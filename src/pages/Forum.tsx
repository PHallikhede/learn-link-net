import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, ThumbsUp, Send, Plus, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface ForumPost {
  id: string;
  author_id: string;
  author: string;
  authorRole: "student" | "alumni";
  title: string;
  content: string;
  created_at: string;
  likes: number;
  replies: number;
  tags: string[];
  isLiked?: boolean;
}

const Forum = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [showNewPost, setShowNewPost] = useState(false);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Wait for auth to load before checking
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPosts();
  }, [user, authLoading, navigate]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Fetch forum posts with author details
      const { data: postsData, error: postsError } = await supabase
        .from("forum_posts")
        .select(`
          id,
          author_id,
          title,
          content,
          tags,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      // Fetch profiles and roles for all authors
      const authorIds = postsData?.map(p => p.author_id) || [];
      const [profilesResult, rolesResult, likesResult, repliesResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("id", authorIds),
        supabase.from("user_roles").select("user_id, role").in("user_id", authorIds),
        supabase.from("post_likes").select("post_id, user_id"),
        supabase.from("forum_replies").select("post_id")
      ]);

      // Create lookup maps
      const profilesMap = new Map(profilesResult.data?.map(p => [p.id, p.full_name]) || []);
      const rolesMap = new Map(rolesResult.data?.map(r => [r.user_id, r.role]) || []);
      const likesMap = new Map<string, { count: number; isLiked: boolean }>();
      const repliesMap = new Map<string, number>();

      // Count likes per post
      likesResult.data?.forEach(like => {
        const current = likesMap.get(like.post_id) || { count: 0, isLiked: false };
        current.count++;
        if (like.user_id === user.id) {
          current.isLiked = true;
        }
        likesMap.set(like.post_id, current);
      });

      // Count replies per post
      repliesResult.data?.forEach(reply => {
        repliesMap.set(reply.post_id, (repliesMap.get(reply.post_id) || 0) + 1);
      });

      const formattedPosts: ForumPost[] = postsData?.map(post => ({
        id: post.id,
        author_id: post.author_id,
        author: profilesMap.get(post.author_id) || "Unknown User",
        authorRole: (rolesMap.get(post.author_id) || "student") as "student" | "alumni",
        title: post.title,
        content: post.content,
        created_at: post.created_at,
        likes: likesMap.get(post.id)?.count || 0,
        isLiked: likesMap.get(post.id)?.isLiked || false,
        replies: repliesMap.get(post.id) || 0,
        tags: post.tags || [],
      })) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to load forum posts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in title and content");
      return;
    }

    try {
      setSubmitting(true);
      const tagsArray = tags ? tags.split(",").map(t => t.trim()).filter(t => t) : [];

      const { error } = await supabase.from("forum_posts").insert({
        author_id: user!.id,
        title: title.trim(),
        content: content.trim(),
        tags: tagsArray,
      });

      if (error) throw error;

      toast.success("Post created successfully!");
      setTitle("");
      setContent("");
      setTags("");
      setShowNewPost(false);
      fetchPosts();
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string, isCurrentlyLiked: boolean) => {
    try {
      if (isCurrentlyLiked) {
        // Unlike
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user!.id);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user!.id });

        if (error) throw error;
      }

      fetchPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to update like");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

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
              <Input 
                placeholder="Post Title" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Textarea 
                placeholder="What's on your mind? Share your questions or insights..."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <Input 
                placeholder="Tags (comma separated)" 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewPost(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreatePost} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Post
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forum Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  No posts yet. Be the first to start a discussion!
                </p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="shadow-card hover:shadow-elevated transition-all">
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`flex flex-col h-auto py-1 ${post.isLiked ? 'text-primary' : ''}`}
                        onClick={() => handleLike(post.id, post.isLiked || false)}
                      >
                        <ThumbsUp className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
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
                            <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
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
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Forum;
