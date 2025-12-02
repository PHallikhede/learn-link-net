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
  is_requester: boolean;
}

const Connections = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [newRequestCount, setNewRequestCount] = useState(0);

  useEffect(() => {
    // Wait for auth and role to load before checking
    if (authLoading || roleLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchConnections();

    // Set up real-time subscription for connection requests
    if (role === "alumni") {
      const channel = supabase
        .channel("connection_requests")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "connections",
            filter: `receiver_id=eq.${user.id}`,
          },
          async (payload) => {
            // Fetch requester profile details
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", payload.new.requester_id)
              .single();

            toast.success(
              `New connection request from ${profile?.full_name || "a user"}!`,
              { duration: 5000 }
            );
            setNewRequestCount((prev) => prev + 1);
            fetchConnections();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "connections",
            filter: `requester_id=eq.${user.id}`,
          },
          async (payload) => {
            if (payload.new.status === "accepted") {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", payload.new.receiver_id)
                .single();

              toast.success(
                `${profile?.full_name || "User"} accepted your connection request!`,
                { duration: 5000 }
              );
            } else if (payload.new.status === "rejected") {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", payload.new.receiver_id)
                .single();

              toast.error(
                `${profile?.full_name || "User"} declined your connection request`,
                { duration: 5000 }
              );
            }
            fetchConnections();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    // For students, listen for status updates
    if (role === "student") {
      const channel = supabase
        .channel("connection_updates")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "connections",
            filter: `requester_id=eq.${user.id}`,
          },
          async (payload) => {
            if (payload.new.status === "accepted") {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", payload.new.receiver_id)
                .single();

              toast.success(
                `${profile?.full_name || "User"} accepted your connection request!`,
                { duration: 5000 }
              );
            } else if (payload.new.status === "rejected") {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", payload.new.receiver_id)
                .single();

              toast.error(
                `${profile?.full_name || "User"} declined your connection request`,
                { duration: 5000 }
              );
            }
            fetchConnections();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, role, authLoading, roleLoading]);

  const fetchConnections = async () => {
    if (!user || !role) return;

    try {
      const { data: connectionsData, error } = await supabase
        .from("connections")
        .select("*")
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      if (error) throw error;

      // Fetch profile details for each connection
      const connectionsWithProfiles = await Promise.all(
        connectionsData.map(async (conn) => {
          const otherUserId = conn.requester_id === user.id ? conn.receiver_id : conn.requester_id;
          const isRequester = conn.requester_id === user.id;

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
            other_user_role: isRequester ? "receiver" : "requester",
            is_requester: isRequester,
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
      setNewRequestCount(0);
      fetchConnections();
    } catch (error) {
      console.error("Error updating connection:", error);
      toast.error("Failed to update connection");
    }
  };

  const handleChat = (connectionId: string, otherUserName: string) => {
    navigate(`/chat/${connectionId}`, { state: { otherUserName } });
  };

  if (loading || authLoading || roleLoading) {
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
              <p className="text-muted-foreground">
                No connections yet.{" "}
                {role === "student" ? (
                  <>
                    <a href="/search" className="text-primary hover:underline">
                      Search for alumni mentors
                    </a>{" "}
                    to get started!
                  </>
                ) : (
                  "Wait for students to connect with you!"
                )}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pending Requests Section */}
            {connections.filter((c) => c.status === "pending").length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold">
                    Pending Requests
                  </h2>
                  {newRequestCount > 0 && (
                    <Badge variant="destructive" className="animate-pulse">
                      {newRequestCount} New
                    </Badge>
                  )}
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {connections
                    .filter((c) => c.status === "pending")
                    .map((connection) => (
                      <Card
                        key={connection.id}
                        className="shadow-card hover:shadow-elevated transition-all"
                      >
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                              <User className="w-8 h-8 text-secondary-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-bold text-lg">
                                    {connection.other_user.full_name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {connection.other_user_role}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {connection.other_user.college}
                                  </p>
                                </div>
                                <Badge variant="outline">{connection.status}</Badge>
                              </div>

                              <div className="flex gap-2 mt-4">
                                {!connection.is_requester ? (
                                  <>
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleStatusUpdate(connection.id, "accepted")
                                      }
                                      className="flex-1"
                                    >
                                      <Check className="w-4 h-4 mr-1" />
                                      Accept
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleStatusUpdate(connection.id, "rejected")
                                      }
                                      className="flex-1"
                                    >
                                      <X className="w-4 h-4 mr-1" />
                                      Decline
                                    </Button>
                                  </>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    Waiting for response...
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Accepted Connections Section */}
            {connections.filter((c) => c.status === "accepted").length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">My Connections</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {connections
                    .filter((c) => c.status === "accepted")
                    .map((connection) => (
                      <Card
                        key={connection.id}
                        className="shadow-card hover:shadow-elevated transition-all"
                      >
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                              <User className="w-8 h-8 text-secondary-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-bold text-lg">
                                    {connection.other_user.full_name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {connection.other_user_role}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {connection.other_user.college}
                                  </p>
                                </div>
                                <Badge variant="secondary">{connection.status}</Badge>
                              </div>

                              <Button
                                size="sm"
                                onClick={() =>
                                  handleChat(
                                    connection.id,
                                    connection.other_user.full_name
                                  )
                                }
                                className="w-full mt-4"
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Chat
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}

            {/* Rejected Connections Section */}
            {connections.filter((c) => c.status === "rejected").length > 0 && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Declined Requests</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {connections
                    .filter((c) => c.status === "rejected")
                    .map((connection) => (
                      <Card
                        key={connection.id}
                        className="shadow-card hover:shadow-elevated transition-all opacity-60"
                      >
                        <CardContent className="pt-6">
                          <div className="flex gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                              <User className="w-8 h-8 text-secondary-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-bold text-lg">
                                    {connection.other_user.full_name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {connection.other_user_role}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {connection.other_user.college}
                                  </p>
                                </div>
                                <Badge variant="destructive">{connection.status}</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Connections;
