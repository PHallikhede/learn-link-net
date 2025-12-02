import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read: boolean;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
}

const Chat = () => {
  const { connectionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const otherUserName = location.state?.otherUserName || "User";

  useEffect(() => {
    console.log("Chat component mounted");
    console.log("Auth loading:", authLoading);
    console.log("User:", user);
    console.log("Connection ID:", connectionId);
    
    // Wait for auth to load
    if (authLoading) {
      console.log("Waiting for auth to load...");
      return;
    }
    
    if (!user || !connectionId) {
      console.log("Missing user or connectionId, redirecting...");
      navigate("/connections");
      return;
    }

    fetchMessages();

    // Set up realtime subscription
    const channel = supabase
      .channel(`messages-${connectionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          // Prevent duplicates (especially for sender's own messages)
          setMessages((current) => {
            const exists = current.some(msg => msg.id === newMessage.id);
            if (exists) return current;
            // Also check if this is replacing a temp message
            const hasTempVersion = current.some(msg => msg.id.startsWith('temp-') && msg.sender_id === newMessage.sender_id);
            if (hasTempVersion) return current;
            return [...current, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, connectionId, authLoading, navigate]);

  const fetchMessages = async () => {
    if (!connectionId) {
      console.error("No connection ID provided");
      toast.error("Invalid connection");
      navigate("/connections");
      setLoading(false);
      return;
    }

    if (!user) {
      console.error("No user found");
      setLoading(false);
      return;
    }

    console.log("Fetching messages for connection:", connectionId);
    console.log("Current user:", user.id);

    try {
      // First verify the connection exists and is accepted
      const { data: connection, error: connError } = await supabase
        .from("connections")
        .select("status, requester_id, receiver_id")
        .eq("id", connectionId)
        .maybeSingle();

      console.log("Connection data:", connection);
      console.log("Connection error:", connError);

      if (connError) throw connError;

      if (!connection) {
        console.error("Connection not found");
        toast.error("Connection not found");
        navigate("/connections");
        return;
      }

      // Check if user is part of this connection
      if (connection.requester_id !== user?.id && connection.receiver_id !== user?.id) {
        console.error("User not part of connection");
        toast.error("You don't have access to this conversation");
        navigate("/connections");
        return;
      }

      // Check if connection is accepted
      if (connection.status !== "accepted") {
        console.error("Connection not accepted, status:", connection.status);
        toast.error("This connection must be accepted before you can chat");
        navigate("/connections");
        return;
      }

      console.log("Connection verified, fetching messages...");

      // Fetch messages only if all checks pass
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("connection_id", connectionId)
        .order("created_at", { ascending: true });

      console.log("Messages data:", data);
      console.log("Messages error:", error);

      if (error) throw error;
      setMessages(data || []);
      console.log("Messages loaded successfully");
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
      navigate("/connections");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (
    content: string,
    attachmentData?: { url: string; name: string; type: string }
  ) => {
    if (!user || !connectionId) return;

    const tempId = `temp-${Date.now()}`;
    
    // Optimistically add message to UI
    const optimisticMessage: Message = {
      id: tempId,
      content,
      sender_id: user.id,
      created_at: new Date().toISOString(),
      read: false,
      attachment_url: attachmentData?.url,
      attachment_name: attachmentData?.name,
      attachment_type: attachmentData?.type,
    };
    
    setMessages((current) => [...current, optimisticMessage]);
    setSending(true);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          connection_id: connectionId,
          sender_id: user.id,
          content,
          attachment_url: attachmentData?.url,
          attachment_name: attachmentData?.name,
          attachment_type: attachmentData?.type,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace optimistic message with real one
      setMessages((current) =>
        current.map((msg) => (msg.id === tempId ? data : msg))
      );
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      // Remove optimistic message on error
      setMessages((current) => current.filter((msg) => msg.id !== tempId));
      throw error;
    } finally {
      setSending(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/connections")}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Connections
        </Button>

        <Card className="shadow-elevated h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <CardTitle>Chat with {otherUserName}</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <MessageList messages={messages} currentUserId={user?.id || ""} />
            <MessageInput
              connectionId={connectionId}
              userId={user?.id || ""}
              onSendMessage={handleSendMessage}
              sending={sending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
