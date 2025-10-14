import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, TrendingUp, Sparkles, User, BookOpen } from "lucide-react";

const Dashboard = () => {
  const [userType] = useState<"student" | "alumni">("student"); // This would come from auth context

  const stats = [
    { label: "Connections", value: "12", icon: Users, color: "text-primary" },
    { label: "Forum Posts", value: "8", icon: MessageSquare, color: "text-secondary" },
    { label: "Skills Shared", value: "5", icon: BookOpen, color: "text-accent" },
  ];

  const recommendations = [
    {
      name: "Dr. Sarah Johnson",
      role: "Senior AI Engineer at Google",
      college: "MIT",
      skills: ["Machine Learning", "Python", "TensorFlow"],
      matchScore: 95,
    },
    {
      name: "Rajesh Kumar",
      role: "Full Stack Developer at Microsoft",
      college: "IIT Bombay",
      skills: ["React", "Node.js", "Cloud Computing"],
      matchScore: 88,
    },
    {
      name: "Emily Chen",
      role: "Data Scientist at Amazon",
      college: "Stanford",
      skills: ["Data Analysis", "Python", "SQL"],
      matchScore: 82,
    },
  ];

  const recentActivity = [
    { action: "New connection request from", user: "Alex Thompson", time: "2 hours ago" },
    { action: "Comment on your post", user: "Maria Garcia", time: "5 hours ago" },
    { action: "New forum question in", user: "Web Development", time: "1 day ago" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, John! 👋
          </h1>
          <p className="text-muted-foreground">
            {userType === "student" 
              ? "Continue your learning journey and connect with amazing alumni mentors."
              : "Share your expertise and guide the next generation of tech professionals."}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8 animate-slide-up">
          {stats.map((stat, index) => (
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
              {recommendations.map((mentor, index) => (
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
                        {mentor.skills.map((skill, i) => (
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
                    <Button size="sm">Connect</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Stay updated with your network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivity.map((activity, index) => (
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
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
