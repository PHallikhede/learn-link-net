import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Building2, Calendar, Edit2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    college: "",
    bio: "",
    interests: [] as string[],
    skills: [] as string[],
    year: "",
    branch: "",
    goals: "",
    job_title: "",
    company: "",
    graduation_year: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        // Fetch profile data
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        // Fetch role-specific data
        if (role === "student") {
          const { data: studentData } = await supabase
            .from("student_details")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          setProfile({
            full_name: profileData.full_name || "",
            email: profileData.email || "",
            college: profileData.college || "",
            bio: profileData.bio || "",
            interests: profileData.interests || [],
            skills: profileData.skills || [],
            year: studentData?.year?.toString() || "",
            branch: studentData?.branch || "",
            goals: studentData?.goals || "",
            job_title: "",
            company: "",
            graduation_year: "",
          });
        } else if (role === "alumni") {
          const { data: alumniData } = await supabase
            .from("alumni_details")
            .select("*")
            .eq("user_id", user.id)
            .maybeSingle();

          setProfile({
            full_name: profileData.full_name || "",
            email: profileData.email || "",
            college: profileData.college || "",
            bio: profileData.bio || "",
            interests: profileData.interests || [],
            skills: profileData.skills || [],
            year: "",
            branch: "",
            goals: "",
            job_title: alumniData?.job_title || "",
            company: alumniData?.company || "",
            graduation_year: alumniData?.graduation_year?.toString() || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      } finally {
        setLoading(false);
      }
    };

    if (!roleLoading && role) {
      fetchProfile();
    }
  }, [user, role, roleLoading]);

  const handleSave = async () => {
    if (!user) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          bio: profile.bio,
          interests: profile.interests,
          skills: profile.skills,
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Update role-specific data
      if (role === "student") {
        const { error: studentError } = await supabase
          .from("student_details")
          .upsert({
            user_id: user.id,
            year: profile.year ? parseInt(profile.year) : null,
            branch: profile.branch,
            goals: profile.goals,
          });

        if (studentError) throw studentError;
      } else if (role === "alumni") {
        const { error: alumniError } = await supabase
          .from("alumni_details")
          .upsert({
            user_id: user.id,
            job_title: profile.job_title,
            company: profile.company,
            graduation_year: profile.graduation_year ? parseInt(profile.graduation_year) : null,
          });

        if (alumniError) throw alumniError;
      }

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (authLoading || roleLoading || loading) {
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Profile</h1>
          <Button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="gap-2"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </>
            )}
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="md:col-span-1 shadow-elevated h-fit">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-accent flex items-center justify-center mb-4">
                  <User className="w-12 h-12 text-secondary-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-1">{profile.full_name}</h2>
                <Badge className="mb-4">
                  {role === "student" ? "Student" : role === "alumni" ? "Alumni" : "Admin"}
                </Badge>
                <div className="w-full space-y-3 text-left">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.college}</span>
                  </div>
                  {role === "student" && profile.year && profile.branch && (
                    <>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{profile.year} - {profile.branch}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Section */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={profile.bio}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    rows={4}
                  />
                ) : (
                  <p className="text-muted-foreground">{profile.bio}</p>
                )}
              </CardContent>
            </Card>

            {/* Skills & Interests */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Skills & Interests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-2 block">Technical Skills</Label>
                  {isEditing ? (
                    <Input 
                      placeholder="Enter skills (comma separated)"
                      value={profile.skills.join(", ")}
                      onChange={(e) => setProfile({ ...profile, skills: e.target.value.split(",").map(s => s.trim()).filter(s => s) })}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block">Interests</Label>
                  {isEditing ? (
                    <Input 
                      placeholder="Enter interests (comma separated)"
                      value={profile.interests.join(", ")}
                      onChange={(e) => setProfile({ ...profile, interests: e.target.value.split(",").map(s => s.trim()).filter(s => s) })}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest, index) => (
                        <Badge key={index} variant="outline">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Career Goals (Student) */}
            {role === "student" && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Career Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      value={profile.goals}
                      onChange={(e) => setProfile({ ...profile, goals: e.target.value })}
                      rows={3}
                    />
                  ) : (
                    <p className="text-muted-foreground">{profile.goals}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Education/Career Details */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{role === "student" ? "Education" : "Career"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <>
                    <div>
                      <Label>College</Label>
                      <Input value={profile.college} readOnly className="mt-1" />
                    </div>
                    {role === "student" ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Year</Label>
                          <Input
                            value={profile.year}
                            onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                            placeholder="e.g., 3"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Branch</Label>
                          <Input
                            value={profile.branch}
                            onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                            placeholder="e.g., Computer Science"
                            className="mt-1"
                          />
                        </div>
                      </div>
                    ) : role === "alumni" && (
                      <>
                        <div>
                          <Label>Job Title</Label>
                          <Input
                            value={profile.job_title}
                            onChange={(e) => setProfile({ ...profile, job_title: e.target.value })}
                            placeholder="e.g., Software Engineer"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Company</Label>
                          <Input
                            value={profile.company}
                            onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                            placeholder="e.g., Google"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Graduation Year</Label>
                          <Input
                            value={profile.graduation_year}
                            onChange={(e) => setProfile({ ...profile, graduation_year: e.target.value })}
                            placeholder="e.g., 2020"
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">{profile.college}</p>
                    {role === "student" && profile.branch && profile.year && (
                      <p className="text-sm text-muted-foreground">
                        {profile.branch} • Year {profile.year}
                      </p>
                    )}
                    {role === "alumni" && (
                      <>
                        {profile.job_title && profile.company && (
                          <p className="text-sm text-muted-foreground">
                            {profile.job_title} at {profile.company}
                          </p>
                        )}
                        {profile.graduation_year && (
                          <p className="text-sm text-muted-foreground">
                            Graduated: {profile.graduation_year}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
