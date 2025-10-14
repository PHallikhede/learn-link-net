import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  isLoggedIn?: boolean;
}

const Navbar = ({ isLoggedIn = false }: NavbarProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center shadow-card group-hover:shadow-glow transition-all">
              <GraduationCap className="w-6 h-6 text-secondary-foreground" />
            </div>
            <span className="font-bold text-xl">IntelliConnect</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {isLoggedIn ? (
              <>
                <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
                  Dashboard
                </Link>
                <Link to="/forum" className="text-sm font-medium hover:text-primary transition-colors">
                  Forum
                </Link>
                <Link to="/search" className="text-sm font-medium hover:text-primary transition-colors">
                  Find Mentors
                </Link>
              </>
            ) : (
              <>
                <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
                  How It Works
                </a>
                <a href="#about" className="text-sm font-medium hover:text-primary transition-colors">
                  About
                </a>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 w-4 h-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 w-4 h-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/auth")}>
                  Login
                </Button>
                <Button onClick={() => navigate("/auth")}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
