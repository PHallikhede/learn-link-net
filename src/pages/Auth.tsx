import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const colleges = [
  "Bangalore Institute of Technology (BIT)",
  "BMS College of Engineering (BMSCE)",
  "RV College of Engineering (RVCE)",
  "PES University",
  "MS Ramaiah Institute of Technology (MSRIT)",
  "Dayananda Sagar College of Engineering (DSCE)",
  "BNM Institute of Technology (BNMIT)",
  "Sir M Visvesvaraya Institute of Technology (MVIT)",
  "National Institute of Technology Karnataka (NITK Surathkal)",
  "JSS Science and Technology University",
  "Manipal Institute of Technology (MIT Manipal)",
  "KLE Technological University",
  "SDM College of Engineering and Technology",
  "Siddaganga Institute of Technology (SIT)",
  "CMR Institute of Technology (CMRIT)",
  "New Horizon College of Engineering",
  "Atria Institute of Technology",
  "Other"
];

const Auth = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [userType, setUserType] = useState<"student" | "alumni" | "admin" | "">("");
  const [college, setCollege] = useState("");
  const [company, setCompany] = useState("");
  const [branch, setBranch] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      toast.error(error.message || "Login failed. Please check your credentials.");
      setIsLoading(false);
    } else {
      toast.success("Login successful!");
      navigate("/dashboard");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userType || !college) {
      toast.error("Please select your role and college");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signUp(signupEmail, signupPassword, {
        full_name: signupName,
        college: college,
      });
      
      if (error) {
        toast.error(error.message || "Signup failed");
        setIsLoading(false);
        return;
      }

      // Add user role
      const { data: { user: newUser } } = await supabase.auth.getUser();
      if (newUser) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: newUser.id, role: userType });

        if (roleError) {
          console.error("Error adding role:", roleError);
        }

        // Add role-specific details
        if (userType === "student") {
          await supabase.from("student_details").insert({
            user_id: newUser.id,
            branch: branch || null,
          });
        } else if (userType === "alumni") {
          await supabase.from("alumni_details").insert({
            user_id: newUser.id,
            company: company || null,
            verification_status: "pending",
          });
        }
      }

      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-secondary rounded-2xl mb-4 shadow-glow">
            <GraduationCap className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">IntelliConnect</h1>
          <p className="text-white/80">Connect. Learn. Grow Together.</p>
        </div>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-type">I am a</Label>
                    <Select value={userType} onValueChange={(value: any) => setUserType(value)}>
                      <SelectTrigger id="user-type">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="alumni">Alumni</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="college">College</Label>
                    <Select value={college} onValueChange={setCollege}>
                      <SelectTrigger id="college">
                        <SelectValue placeholder="Select your college" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {userType === "student" && (
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch (Optional)</Label>
                      <Input
                        id="branch"
                        type="text"
                        placeholder="e.g., Computer Science"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                      />
                    </div>
                  )}
                  {userType === "alumni" && (
                    <div className="space-y-2">
                      <Label htmlFor="company">Company (Optional)</Label>
                      <Input
                        id="company"
                        type="text"
                        placeholder="e.g., Google"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
