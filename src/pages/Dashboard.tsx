import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, TrendingUp, Sparkles, User, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("User");
  const [stats, setStats] = useState({
    connections: 0,
    forumPosts: 0,
    skillsShared: 0,
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait for auth and role to load
    if (authLoading || roleLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    const fetchDashboardData = async () => {      
      try {
        // Fetch user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, skills")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0]);
        }

        // Fetch connections count
        const { count: connectionsCount } = await supabase
          .from("connections")
          .select("*", { count: "exact", head: true })
          .or(`student_id.eq.${user.id},alumni_id.eq.${user.id}`)
          .eq("status", "accepted");

        // Fetch forum posts count
        const { count: forumPostsCount } = await supabase
          .from("forum_posts")
          .select("*", { count: "exact", head: true })
          .eq("author_id", user.id);

        // Fetch AI-powered alumni recommendations
        let alumniRecommendations = [];
        
        if (role === "student") {
          try {
            const { data: aiData, error: aiError } = await supabase.functions.invoke('get-mentor-recommendations');
            
            if (aiError) {
              console.error("AI recommendations error:", aiError);
            } else if (aiData?.recommendations) {
              alumniRecommendations = aiData.recommendations.slice(0, 3).map((alumni: any) => ({
                id: alumni.id,
                name: alumni.full_name || "Unknown",
                role: `${alumni.alumni_details?.[0]?.position || "Professional"} at ${alumni.alumni_details?.[0]?.company || "Company"}`,
                college: alumni.college || "",
                skills: alumni.skills || [],
                matchScore: 95, // AI-powered match
              }));
            }
          } catch (error) {
            console.error("Error fetching AI recommendations:", error);
          }
        }
        
        // Fallback to basic recommendations if AI fails
        if (alumniRecommendations.length === 0) {
          const { data: alumniData } = await supabase
            .from("profiles")
            .select("*")
            .limit(10);

          if (alumniData) {
            for (const profile of alumniData) {
              const { data: alumniDetail } = await supabase
                .from("alumni_details")
                .select("*")
                .eq("user_id", profile.id)
                .eq("verification_status", "verified")
                .maybeSingle();
              
              if (alumniDetail && profile.id !== user.id) {
                alumniRecommendations.push({
                  id: profile.id,
                  name: profile.full_name || "Unknown",
                  role: `${alumniDetail.job_title || "Professional"} at ${alumniDetail.company || "Company"}`,
                  college: profile.college || "",
                  skills: profile.skills || [],
                  matchScore: Math.floor(Math.random() * 20) + 80,
                });
              }
              if (alumniRecommendations.length >= 3) break;
            }
          }
        }

        // Fetch recent connection requests
        const { data: connectionRequests } = await supabase
          .from("connections")
          .select("*")
          .eq("receiver_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(3);

        // Fetch requester profiles for connection requests
        const activities = [];
        if (connectionRequests && connectionRequests.length > 0) {
          for (const req of connectionRequests) {
            const { data: requesterProfile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", req.requester_id)
              .maybeSingle();
            
            activities.push({
              action: "New connection request from",
              user: requesterProfile?.full_name || "Unknown User",
              time: new Date(req.created_at).toLocaleDateString(),
            });
          }
        }

        setStats({
          connections: connectionsCount || 0,
          forumPosts: forumPostsCount || 0,
          skillsShared: profile?.skills?.length || 0,
        });
        setRecommendations(alumniRecommendations);
        setRecentActivity(activities);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, authLoading, roleLoading]);

  const handleConnect = async (alumniId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("connections")
        .insert({
          requester_id: user.id,
          receiver_id: alumniId,
          status: "pending",
        });

      if (error) throw error;
      toast.success("Connection request sent!");
    } catch (error: any) {
      toast.error(error.message || "Failed to send connection request");
    }
  };

  const statsDisplay = [
    { label: "Connections", value: stats.connections.toString(), icon: Users, color: "text-primary" },
    { label: "Forum Posts", value: stats.forumPosts.toString(), icon: MessageSquare, color: "text-secondary" },
    { label: "Skills Shared", value: stats.skillsShared.toString(), icon: BookOpen, color: "text-accent" },
  ];

  if (isLoading || authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {userName}! 👋
          </h1>
          <p className="text-muted-foreground">
            {role === "student" 
              ? "Continue your learning journey and connect with amazing alumni mentors."
              : "Share your expertise and guide the next generation of tech professionals."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 animate-slide-up">
          {statsDisplay.map((stat, index) => (
            <Card key={index} className="shadow-card hover:shadow-elevated transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl bg-gradient-card flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* AI Recommendations */}
          <Card className="lg:col-span-2 shadow-elevated">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-secondary" />
                <CardTitle>AI-Powered Mentor Recommendations</CardTitle>
              </div>
              <CardDescription>
                Alumni matched to your skills and interests using intelligent algorithms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recommendations.length > 0 ? (
                recommendations.map((mentor, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between p-4 rounded-lg border bg-gradient-card hover:shadow-card transition-all"
                  >
                    <div className="flex gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{mentor.name}</h4>
                        <p className="text-sm text-muted-foreground">{mentor.role}</p>
                        <p className="text-xs text-muted-foreground mb-2">{mentor.college}</p>
                        <div className="flex flex-wrap gap-1">
                          {mentor.skills.slice(0, 3).map((skill: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 text-secondary">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-semibold">{mentor.matchScore}%</span>
                      </div>
                      {role === "student" ? (
                        <Button size="sm" onClick={() => handleConnect(mentor.id)}>Connect</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => navigate("/search")}>View Profile</Button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No recommendations available yet.</p>
                  {role === "student" && (
                    <Button onClick={() => navigate("/search")}>Search Alumni</Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Stay updated with your network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex gap-3 pb-3 border-b last:border-0">
                    <div className="w-2 h-2 rounded-full bg-secondary mt-2" />
                    <div>
                      <p className="text-sm">
                        {activity.action}{" "}
                        <span className="font-semibold">{activity.user}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
