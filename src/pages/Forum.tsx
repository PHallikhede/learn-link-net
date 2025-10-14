import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Send, Plus, User } from "lucide-react";
import { toast } from "sonner";

interface ForumPost {
  id: number;
  author: string;
  authorRole: "student" | "alumni";
  title: string;
  content: string;
  timestamp: string;
  likes: number;
  replies: number;
  tags: string[];
}

const Forum = () => {
  const [showNewPost, setShowNewPost] = useState(false);
  const [posts] = useState<ForumPost[]>([
    {
      id: 1,
      author: "Priya Sharma",
      authorRole: "student",
      title: "How to prepare for Machine Learning interviews?",
      content: "I'm a final year student looking to break into ML. What topics should I focus on?",
      timestamp: "2 hours ago",
      likes: 15,
      replies: 8,
      tags: ["Machine Learning", "Career", "Interview Prep"],
    },
    {
      id: 2,
      author: "Dr. Michael Chen",
      authorRole: "alumni",
      title: "Best practices for Cloud Architecture in 2025",
      content: "Sharing insights from my experience building scalable systems at AWS...",
      timestamp: "5 hours ago",
      likes: 32,
      replies: 12,
      tags: ["Cloud Computing", "Architecture", "AWS"],
    },
    {
      id: 3,
      author: "Amit Patel",
      authorRole: "student",
      title: "Resources for learning React and modern web development?",
      content: "Looking for comprehensive tutorials and project ideas to master React...",
      timestamp: "1 day ago",
      likes: 24,
      replies: 15,
      tags: ["Web Development", "React", "JavaScript"],
    },
  ]);

  const handleCreatePost = () => {
    toast.success("Post created successfully!");
    setShowNewPost(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Discussion Forum</h1>
            <p className="text-muted-foreground">
              Ask questions, share knowledge, and learn together
            </p>
          </div>
          <Button onClick={() => setShowNewPost(!showNewPost)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Post
          </Button>
        </div>

        {/* New Post Form */}
        {showNewPost && (
          <Card className="mb-6 shadow-elevated animate-scale-in">
            <CardHeader>
              <CardTitle>Create New Post</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Post Title" />
              <Textarea 
                placeholder="What's on your mind? Share your questions or insights..."
                rows={4}
              />
              <Input placeholder="Tags (comma separated)" />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewPost(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePost}>
                  <Send className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forum Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="shadow-card hover:shadow-elevated transition-all cursor-pointer">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      post.authorRole === "alumni" ? "bg-secondary/20" : "bg-primary/20"
                    }`}>
                      <User className={`w-5 h-5 ${
                        post.authorRole === "alumni" ? "text-secondary" : "text-primary"
                      }`} />
                    </div>
                    <Button variant="ghost" size="sm" className="flex flex-col h-auto py-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-xs">{post.likes}</span>
                    </Button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{post.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-medium">{post.author}</span>
                          <Badge variant={post.authorRole === "alumni" ? "secondary" : "outline"} className="text-xs">
                            {post.authorRole}
                          </Badge>
                          <span>•</span>
                          <span>{post.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-3">{post.content}</p>
                    
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <Button variant="ghost" size="sm" className="gap-2">
                      <MessageSquare className="w-4 h-4" />
                      {post.replies} Replies
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

export default Forum;
