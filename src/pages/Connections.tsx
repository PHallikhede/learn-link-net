import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, MessageCircle, Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Connection {
  id: string;
  status: string;
  created_at: string;
  other_user: {
    id: string;
    full_name: string;
    email: string;
    college: string;
  };
  other_user_role: string;
}

const Connections = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchConnections();
  }, [user, role]);

  const fetchConnections = async () => {
    if (!user || !role) return;

    try {
      const { data: connectionsData, error } = await supabase
        .from("connections")
        .select("*")
        .or(`student_id.eq.${user.id},alumni_id.eq.${user.id}`);

      if (error) throw error;

      // Fetch profile details for each connection
      const connectionsWithProfiles = await Promise.all(
        connectionsData.map(async (conn) => {
          const otherUserId = conn.student_id === user.id ? conn.alumni_id : conn.student_id;
          const otherUserRole = conn.student_id === user.id ? "alumni" : "student";

          const { data: profile } = await supabase
            .from("profiles")
            .select("id, full_name, email, college")
            .eq("id", otherUserId)
            .single();

          return {
            id: conn.id,
            status: conn.status,
            created_at: conn.created_at,
            other_user: profile,
            other_user_role: otherUserRole,
          };
        })
      );

      setConnections(connectionsWithProfiles);
    } catch (error) {
      console.error("Error fetching connections:", error);
      toast.error("Failed to load connections");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (connectionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("connections")
        .update({ status: newStatus })
        .eq("id", connectionId);

      if (error) throw error;

      toast.success(`Connection ${newStatus}`);
      fetchConnections();
    } catch (error) {
      console.error("Error updating connection:", error);
      toast.error("Failed to update connection");
    }
  };

  const handleChat = (connectionId: string, otherUserName: string) => {
    navigate(`/chat/${connectionId}`, { state: { otherUserName } });
  };

  if (loading) {
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">My Connections</h1>
          <p className="text-muted-foreground">
            Manage your mentor-mentee connections
          </p>
        </div>

        {connections.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground">No connections yet. Start connecting with {role === "student" ? "alumni" : "students"}!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {connections.map((connection) => (
              <Card key={connection.id} className="shadow-card hover:shadow-elevated transition-all">
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-secondary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{connection.other_user.full_name}</h3>
                          <p className="text-sm text-muted-foreground capitalize">{connection.other_user_role}</p>
                          <p className="text-sm text-muted-foreground">{connection.other_user.college}</p>
                        </div>
                        <Badge
                          variant={
                            connection.status === "accepted"
                              ? "secondary"
                              : connection.status === "pending"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {connection.status}
                        </Badge>
                      </div>

                      <div className="flex gap-2 mt-4">
                        {connection.status === "pending" && role === "alumni" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(connection.id, "accepted")}
                              className="flex-1"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(connection.id, "rejected")}
                              className="flex-1"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </>
                        )}
                        {connection.status === "accepted" && (
                          <Button
                            size="sm"
                            onClick={() => handleChat(connection.id, connection.other_user.full_name)}
                            className="w-full"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                          </Button>
                        )}
                        {connection.status === "pending" && role === "student" && (
                          <p className="text-sm text-muted-foreground">Waiting for alumni to accept...</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Connections;
