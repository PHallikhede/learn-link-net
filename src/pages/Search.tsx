import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon, Filter, User, Building2, MapPin } from "lucide-react";
import { toast } from "sonner";

interface AlumniProfile {
  id: number;
  name: string;
  company: string;
  role: string;
  college: string;
  location: string;
  skills: string[];
  graduationYear: number;
  available: boolean;
}

const Search = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");

  const alumni: AlumniProfile[] = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      company: "Google",
      role: "Senior AI Engineer",
      college: "MIT",
      location: "San Francisco, CA",
      skills: ["Machine Learning", "Python", "TensorFlow", "NLP"],
      graduationYear: 2015,
      available: true,
    },
    {
      id: 2,
      name: "Rajesh Kumar",
      company: "Microsoft",
      role: "Full Stack Developer",
      college: "IIT Bombay",
      location: "Seattle, WA",
      skills: ["React", "Node.js", "Azure", "TypeScript"],
      graduationYear: 2017,
      available: true,
    },
    {
      id: 3,
      name: "Emily Chen",
      company: "Amazon",
      role: "Data Scientist",
      college: "Stanford",
      location: "Seattle, WA",
      skills: ["Data Analysis", "Python", "SQL", "Statistics"],
      graduationYear: 2018,
      available: false,
    },
    {
      id: 4,
      name: "Carlos Rodriguez",
      company: "Meta",
      role: "Mobile Developer",
      college: "MIT",
      location: "Menlo Park, CA",
      skills: ["React Native", "iOS", "Android", "Swift"],
      graduationYear: 2016,
      available: true,
    },
  ];

  const handleConnect = (name: string) => {
    toast.success(`Connection request sent to ${name}!`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Mentors</h1>
          <p className="text-muted-foreground">
            Connect with alumni experts in your field of interest
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-8 shadow-card">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, company, or skill..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Skill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Skills</SelectItem>
                  <SelectItem value="ml">Machine Learning</SelectItem>
                  <SelectItem value="web">Web Development</SelectItem>
                  <SelectItem value="mobile">Mobile Development</SelectItem>
                  <SelectItem value="data">Data Science</SelectItem>
                </SelectContent>
              </Select>
              <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by College" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  <SelectItem value="mit">MIT</SelectItem>
                  <SelectItem value="stanford">Stanford</SelectItem>
                  <SelectItem value="iit">IIT Bombay</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="grid md:grid-cols-2 gap-6">
          {alumni.map((person) => (
            <Card key={person.id} className="shadow-card hover:shadow-elevated transition-all">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                    <User className="w-8 h-8 text-secondary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-lg">{person.name}</h3>
                        <p className="text-sm text-muted-foreground">{person.role}</p>
                      </div>
                      {person.available && (
                        <Badge variant="secondary" className="text-xs">
                          Available
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>{person.company}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{person.location}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {person.college} • Class of {person.graduationYear}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {person.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>

                    <Button 
                      onClick={() => handleConnect(person.name)}
                      className="w-full"
                      disabled={!person.available}
                    >
                      {person.available ? "Send Connect Request" : "Not Available"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Search;
