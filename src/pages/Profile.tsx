import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Building2, MapPin, Calendar, Edit2, Save } from "lucide-react";
import { toast } from "sonner";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    role: "student",
    college: "MIT - Massachusetts Institute of Technology",
    year: "3rd Year",
    branch: "Computer Science",
    bio: "Passionate about machine learning and web development. Looking to connect with industry professionals.",
    interests: ["Machine Learning", "Web Development", "Cloud Computing"],
    skills: ["Python", "React", "TensorFlow"],
    goals: "Secure a summer internship in AI/ML",
  });

  const handleSave = () => {
    toast.success("Profile updated successfully!");
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isLoggedIn />
      
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
                <h2 className="text-2xl font-bold mb-1">{profile.name}</h2>
                <Badge className="mb-4">
                  {profile.role === "student" ? "Student" : "Alumni"}
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
                  {profile.role === "student" && (
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
                    <Input placeholder="Enter skills (comma separated)" />
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
                    <Input placeholder="Enter interests (comma separated)" />
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
            {profile.role === "student" && (
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

            {/* Education Details */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isEditing ? (
                  <>
                    <div>
                      <Label>College</Label>
                      <Input value={profile.college} readOnly className="mt-1" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Year</Label>
                        <Input
                          value={profile.year}
                          onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Branch</Label>
                        <Input
                          value={profile.branch}
                          onChange={(e) => setProfile({ ...profile, branch: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">{profile.college}</p>
                    <p className="text-sm text-muted-foreground">
                      {profile.branch} • {profile.year}
                    </p>
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
