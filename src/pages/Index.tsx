import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import AIChat from "@/components/AIChat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  Sparkles,
  Network,
  Target,
  Award,
  Bot
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [stats, setStats] = useState({
    users: 0,
    alumni: 0,
    connections: 0,
    success: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total users
        const { count: usersCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Fetch total alumni (all alumni, not just verified)
        const { count: alumniCount } = await supabase
          .from("alumni_details")
          .select("*", { count: "exact", head: true });

        // Fetch accepted connections
        const { count: connectionsCount } = await supabase
          .from("connections")
          .select("*", { count: "exact", head: true })
          .eq("status", "accepted");

        setStats({
          users: usersCount || 0,
          alumni: alumniCount || 0,
          connections: connectionsCount || 0,
          success: Math.floor((connectionsCount || 0) * 0.8),
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: Users,
      title: "Connect with Alumni",
      description: "Network with successful alumni from your college across various industries and domains.",
      color: "text-primary",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Matching",
      description: "Get personalized mentor recommendations based on your skills, interests, and career goals.",
      color: "text-secondary",
    },
    {
      icon: MessageSquare,
      title: "Discussion Forum",
      description: "Engage in technical discussions, ask questions, and share knowledge with the community.",
      color: "text-accent",
    },
    {
      icon: Target,
      title: "Career Guidance",
      description: "Receive expert advice on placements, career paths, and skill development from industry professionals.",
      color: "text-primary",
    },
  ];

  const statsDisplay = [
    { value: stats.users, label: "Active Users" },
    { value: stats.alumni, label: "Alumni Mentors" },
    { value: stats.connections, label: "Connections Made" },
    { value: stats.success, label: "Success Stories" },
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      description: "Sign up as a student or alumni and complete your profile with skills and interests.",
      icon: GraduationCap,
    },
    {
      number: "02",
      title: "Get AI Recommendations",
      description: "Our intelligent system suggests perfect mentors based on your goals and aspirations.",
      icon: Sparkles,
    },
    {
      number: "03",
      title: "Connect & Learn",
      description: "Send connection requests, engage in discussions, and grow your professional network.",
      icon: Network,
    },
    {
      number: "04",
      title: "Achieve Your Goals",
      description: "Leverage mentorship and community support to land your dream job or internship.",
      icon: Award,
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <Badge className="mb-4 bg-white/20 text-white border-white/30">
              🚀 Connecting Students & Alumni for Success
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Your Bridge to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">
                Technical Excellence
              </span>
            </h1>
            <p className="text-xl mb-8 text-white/90">
              IntelliConnect brings together students and alumni for mentorship, career guidance, 
              and collaborative learning powered by AI
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-glow"
                onClick={() => navigate("/auth")}
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {statsDisplay.map((stat, index) => (
              <div key={index} className="text-center animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <p className="text-4xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">Features</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to facilitate meaningful connections and accelerate your career growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="shadow-card hover:shadow-elevated transition-all cursor-pointer group"
              >
                <CardContent className="pt-6">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-card flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4">How It Works</Badge>
            <h2 className="text-4xl font-bold mb-4">
              Your Journey to Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Four simple steps to connect with mentors and accelerate your career
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="shadow-card hover:shadow-elevated transition-all h-full">
                  <CardContent className="pt-6">
                    <div className="mb-4">
                      <span className="text-5xl font-bold text-primary/20">{step.number}</span>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center mb-4">
                      <step.icon className="w-6 h-6 text-secondary-foreground" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary to-secondary" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="about" className="py-20 bg-gradient-hero text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-96 h-96 bg-secondary rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of students and alumni building meaningful connections and achieving their goals
          </p>
          <Button 
            size="lg" 
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-glow"
            onClick={() => navigate("/auth")}
          >
            Join IntelliConnect Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-accent rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-secondary-foreground" />
              </div>
              <span className="font-bold">IntelliConnect</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 IntelliConnect. Empowering the next generation of tech professionals.
            </p>
          </div>
        </div>
      </footer>

      {/* AI Chat Button */}
      <Button
        size="lg"
        className="fixed bottom-4 left-4 rounded-full shadow-glow z-40 gap-2"
        onClick={() => setIsChatOpen(true)}
      >
        <Bot className="w-5 h-5" />
        AI Assistant
      </Button>

      {/* AI Chat Widget */}
      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default Index;
