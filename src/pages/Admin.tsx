import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, TrendingUp, Shield, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface UserRequest {
  id: number;
  name: string;
  email: string;
  role: "alumni";
  college: string;
  company: string;
  status: "pending";
}

const Admin = () => {
  const stats = [
    { label: "Total Users", value: "1,234", icon: Users, trend: "+12%", color: "text-primary" },
    { label: "Alumni", value: "456", icon: Shield, trend: "+8%", color: "text-secondary" },
    { label: "Students", value: "778", icon: Users, trend: "+15%", color: "text-accent" },
    { label: "Forum Posts", value: "2,145", icon: MessageSquare, trend: "+23%", color: "text-primary" },
  ];

  const pendingRequests: UserRequest[] = [
    {
      id: 1,
      name: "Dr. James Wilson",
      email: "james.wilson@tech.com",
      role: "alumni",
      college: "Stanford University",
      company: "Google",
      status: "pending",
    },
    {
      id: 2,
      name: "Lisa Anderson",
      email: "lisa.a@startup.io",
      role: "alumni",
      college: "MIT",
      company: "Stripe",
      status: "pending",
    },
  ];

  const handleApprove = (name: string) => {
    toast.success(`${name}'s account has been approved!`);
  };

  const handleReject = (name: string) => {
    toast.error(`${name}'s account has been rejected.`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, monitor activity, and maintain platform quality
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="shadow-card hover:shadow-elevated transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-card flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stat.trend}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending Alumni Requests */}
        <Card className="shadow-elevated mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-secondary" />
              Pending Alumni Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending requests at the moment
                </p>
              ) : (
                pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-card transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-lg">{request.name}</h4>
                        <Badge variant="outline">Alumni</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{request.email}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          <span className="font-medium">College:</span> {request.college}
                        </span>
                        <span className="text-muted-foreground">
                          <span className="font-medium">Company:</span> {request.company}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReject(request.name)}
                        className="gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.name)}
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Overview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Platform Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-card rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Connections Made</p>
                <p className="text-3xl font-bold">3,456</p>
              </div>
              <div className="text-center p-4 bg-gradient-card rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Active This Week</p>
                <p className="text-3xl font-bold">892</p>
              </div>
              <div className="text-center p-4 bg-gradient-card rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Avg. Response Time</p>
                <p className="text-3xl font-bold">2.4h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
