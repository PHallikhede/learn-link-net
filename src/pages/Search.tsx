import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, User, Building2, Briefcase, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AlumniProfile {
  id: string;
  full_name: string;
  company: string;
  job_title: string;
  college: string;
  bio: string;
  skills: string[];
  interests: string[];
  graduation_year: number;
  verification_status: string;
  connection_status?: string;
}

const Search = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingIds, setConnectingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Wait for auth and role to load before checking
    if (authLoading || roleLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    fetchAlumni();
  }, [user, role, authLoading, roleLoading]);

  const fetchAlumni = async () => {
    if (!user) return;

    try {
      // Karnataka colleges list for filtering
      const karnatakaColleges = [
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
      ];

      // Fetch all verified alumni
      const { data: alumniData, error: alumniError } = await supabase
        .from("alumni_details")
        .select("*")
        .eq("verification_status", "verified");

      if (alumniError) throw alumniError;

      // Fetch profiles for each alumni and filter by Karnataka colleges
      const alumniProfiles = await Promise.all(
        (alumniData || []).map(async (alumni) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", alumni.user_id)
            .single();

          // Check connection status
          const { data: connection } = await supabase
            .from("connections")
            .select("status")
            .eq("student_id", user.id)
            .eq("alumni_id", alumni.user_id)
            .maybeSingle();

          // Only include if from Karnataka college
          if (!profile?.college || !karnatakaColleges.includes(profile.college)) {
            return null;
          }

          return {
            id: alumni.user_id,
            full_name: profile?.full_name || "Unknown",
            company: alumni.company || "Not specified",
            job_title: alumni.job_title || "Alumni",
            college: profile?.college || "Not specified",
            bio: profile?.bio || "",
            skills: profile?.skills || [],
            interests: profile?.interests || [],
            graduation_year: alumni.graduation_year || 2020,
            verification_status: alumni.verification_status,
            connection_status: connection?.status,
          };
        })
      );

      // Filter out null values (non-Karnataka colleges)
      setAlumni(alumniProfiles.filter((profile) => profile !== null) as AlumniProfile[]);
    } catch (error) {
      console.error("Error fetching alumni:", error);
      toast.error("Failed to load alumni");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (alumniId: string, alumniName: string) => {
    if (!user) return;

    setConnectingIds(new Set(connectingIds).add(alumniId));

    try {
      const { error } = await supabase
        .from("connections")
        .insert({
          student_id: user.id,
          alumni_id: alumniId,
          status: "pending",
        });

      if (error) throw error;

      toast.success(`Connection request sent to ${alumniName}!`);
      fetchAlumni(); // Refresh to update connection status
    } catch (error: any) {
      console.error("Error sending connection request:", error);
      if (error.code === "23505") {
        toast.error("Connection request already exists");
      } else {
        toast.error("Failed to send connection request");
      }
    } finally {
      setConnectingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(alumniId);
        return newSet;
      });
    }
  };

  const filteredAlumni = alumni.filter((person) => {
    const matchesSearch =
      searchQuery === "" ||
      person.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      person.skills.some((skill) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesSkill =
      skillFilter === "all" ||
      person.skills.some((skill) =>
        skill.toLowerCase().includes(skillFilter.toLowerCase())
      );

    return matchesSearch && matchesSkill;
  });

  const getConnectionButton = (person: AlumniProfile) => {
    if (person.connection_status === "accepted") {
      return (
        <Button className="w-full" variant="secondary" disabled>
          Connected
        </Button>
      );
    }
    if (person.connection_status === "pending") {
      return (
        <Button className="w-full" variant="outline" disabled>
          Request Pending
        </Button>
      );
    }
    if (person.connection_status === "rejected") {
      return (
        <Button className="w-full" variant="outline" disabled>
          Request Declined
        </Button>
      );
    }
    return (
      <Button
        onClick={() => handleConnect(person.id, person.full_name)}
        className="w-full"
        disabled={connectingIds.has(person.id)}
      >
        {connectingIds.has(person.id) ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Connect
          </>
        )}
      </Button>
    );
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
          <h1 className="text-4xl font-bold mb-2">Find Alumni Mentors</h1>
          <p className="text-muted-foreground">
            Connect with verified alumni experts in your field of interest
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 shadow-card">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, company, or skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  <SelectItem value="machine learning">Machine Learning</SelectItem>
                  <SelectItem value="web">Web Development</SelectItem>
                  <SelectItem value="mobile">Mobile Development</SelectItem>
                  <SelectItem value="data">Data Science</SelectItem>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {filteredAlumni.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground">
                No alumni found matching your criteria. Try adjusting your search.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredAlumni.map((person) => (
              <Card
                key={person.id}
                className="shadow-card hover:shadow-elevated transition-all"
              >
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                      <User className="w-8 h-8 text-secondary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="mb-3">
                        <h3 className="font-bold text-lg">{person.full_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {person.job_title}
                        </p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span>{person.company}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {person.college} • Class of {person.graduation_year}
                          </span>
                        </div>
                      </div>

                      {person.bio && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {person.bio}
                        </p>
                      )}

                      {person.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {person.skills.slice(0, 4).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {person.skills.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{person.skills.length - 4} more
                            </Badge>
                          )}
                        </div>
                      )}

                      {getConnectionButton(person)}
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

export default Search;
