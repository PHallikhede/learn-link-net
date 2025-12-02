import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  attachment_name: string | null;
}

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  other_user: {
    id: string;
    full_name: string;
    email: string;
  };
  last_message?: Message;
}

const Messages = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchConnections();

      // Set up real-time subscription for new messages
      const messagesChannel = supabase
        .channel('messages-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          },
          () => {
            fetchConnections();
          }
        )
        .subscribe();

      // Set up real-time subscription for connection changes
      const connectionsChannel = supabase
        .channel('connections-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'connections',
            filter: `student_id=eq.${user.id}`
          },
          () => {
            fetchConnections();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'connections',
            filter: `alumni_id=eq.${user.id}`
          },
          () => {
            fetchConnections();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(connectionsChannel);
      };
    }
  }, [user, authLoading, navigate]);

  const fetchConnections = async () => {
    if (!user) return;

    try {
      const { data: connectionsData, error: connectionsError } = await supabase
        .from("connections")
        .select("*")
        .eq("status", "accepted")
        .or(`student_id.eq.${user.id},alumni_id.eq.${user.id}`);

      if (connectionsError) throw connectionsError;

      const connectionsWithDetails = await Promise.all(
        (connectionsData || []).map(async (conn) => {
          const otherUserId = conn.requester_id === user.id ? conn.receiver_id : conn.requester_id;

          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", otherUserId)
            .single();

          const { data: messagesData } = await supabase
            .from("messages")
            .select("*")
            .eq("connection_id", conn.id)
            .order("created_at", { ascending: false })
            .limit(1);

          return {
            ...conn,
            other_user: profileData || { id: otherUserId, full_name: "Unknown", email: "" },
            last_message: messagesData?.[0],
          };
        })
      );

      connectionsWithDetails.sort((a, b) => {
        const aTime = a.last_message?.created_at || a.created_at;
        const bTime = b.last_message?.created_at || b.created_at;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      });

      setConnections(connectionsWithDetails);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionClick = (connectionId: string) => {
    navigate(`/chat/${connectionId}`);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>

        {connections.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground mb-4">No conversations yet.</p>
            <p className="text-sm text-muted-foreground">
              Connect with alumni from the{" "}
              <button 
                onClick={() => navigate("/connections")} 
                className="text-primary hover:underline font-medium"
              >
                Connections page
              </button>
              {" "}to start messaging.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {connections.map((connection) => (
              <Card
                key={connection.id}
                className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleConnectionClick(connection.id)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(connection.other_user.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{connection.other_user.full_name}</h3>
                      {connection.last_message && (
                        <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                          {formatTime(connection.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {connection.last_message
                        ? connection.last_message.attachment_name
                          ? `📎 ${connection.last_message.attachment_name}`
                          : connection.last_message.content
                        : "No messages yet"}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
