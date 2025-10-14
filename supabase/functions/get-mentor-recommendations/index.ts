import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Get student profile and interests
    const { data: profile } = await supabase
      .from("profiles")
      .select("*, student_details(*)")
      .eq("id", user.id)
      .single();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const studentInterests = profile.interests || [];

    // Get all alumni with their details
    const { data: alumniData } = await supabase
      .from("profiles")
      .select(`
        *,
        alumni_details(*),
        user_roles!inner(role)
      `)
      .eq("user_roles.role", "alumni")
      .eq("alumni_details.verification_status", "approved");

    if (!alumniData || alumniData.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Score each alumni based on skill matching
    const scoredAlumni = alumniData.map((alumni) => {
      const alumniSkills = alumni.skills || [];
      const matchingSkills = alumniSkills.filter((skill: string) =>
        studentInterests.some((interest: string) =>
          interest.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(interest.toLowerCase())
        )
      );
      
      return {
        ...alumni,
        matchScore: matchingSkills.length,
        matchingSkills
      };
    });

    // Sort by match score and take top 5
    const recommendations = scoredAlumni
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in get-mentor-recommendations:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
