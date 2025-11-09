import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GraduationCap, Search, MessageCircle, Menu, X, LogOut, User, Shield, Users } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Logout failed");
    } else {
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50 shadow-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center shadow-card group-hover:shadow-glow transition-all">
              <GraduationCap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <span className="font-bold text-xl">IntelliConnect</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/search" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <Search className="w-4 h-4" />
                  Search Alumni
                </Link>
                <Link to="/connections" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <Users className="w-4 h-4" />
                  Connections
                </Link>
                <Link to="/messages" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  Messages
                </Link>
                <Link to="/forum" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  Forum
                </Link>
                {role === "admin" && (
                  <Link to="/admin" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="w-4 h-4" />
                      Profile
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer">View Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
                  Home
                </Link>
                <Button onClick={() => navigate("/auth")}>Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t pt-4 space-y-3 animate-fade-in">
            {user ? (
              <>
                <Link to="/dashboard" className="block text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/search" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <Search className="w-4 h-4" />
                  Search Alumni
                </Link>
                <Link to="/connections" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <Users className="w-4 h-4" />
                  Connections
                </Link>
                <Link to="/messages" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  Messages
                </Link>
                <Link to="/forum" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  Forum
                </Link>
                {role === "admin" && (
                  <Link to="/admin" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                    <Shield className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <Link to="/profile" className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-destructive hover:opacity-80 transition-opacity">
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/" className="block text-sm font-medium hover:text-primary transition-colors">
                  Home
                </Link>
                <Link to="/auth" className="block text-sm font-medium hover:text-primary transition-colors">
                  Login
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
