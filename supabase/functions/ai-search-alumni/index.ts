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

    const { searchQuery, skillFilter } = await req.json();

    // Get student profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Get all alumni (not just verified)
    const { data: alumniData } = await supabase
      .from("profiles")
      .select(`
        *,
        alumni_details!inner(*),
        user_roles!inner(role)
      `)
      .eq("user_roles.role", "alumni");

    if (!alumniData || alumniData.length === 0) {
      return new Response(
        JSON.stringify({ recommendations: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to intelligently search and rank alumni
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an intelligent search and recommendation system for IntelliConnect, a professional networking platform.
Your task is to analyze a search query and student profile to find the most relevant alumni matches.
Consider the search query, student's interests, skills, and career goals when ranking alumni.

Return ONLY a JSON array of alumni IDs ranked by relevance (most relevant first), limit to top 10.
Format: ["id1", "id2", "id3", ...]`;

    const userPrompt = `Student Profile:
- Name: ${profile.full_name}
- College: ${profile.college}
- Bio: ${profile.bio || "No bio"}
- Interests: ${(profile.interests || []).join(", ") || "None specified"}
- Skills: ${(profile.skills || []).join(", ") || "None specified"}

Search Query: "${searchQuery || "Show me relevant alumni"}"
${skillFilter && skillFilter !== "all" ? `Skill Filter: ${skillFilter}` : ""}

Available Alumni (${alumniData.length} results):
${alumniData.map((a, i) => `
${i + 1}. ID: ${a.id}
   Name: ${a.full_name}
   College: ${a.college}
   Company: ${a.alumni_details?.[0]?.company || "N/A"}
   Position: ${a.alumni_details?.[0]?.job_title || "N/A"}
   Skills: ${(a.skills || []).join(", ") || "None"}
   Interests: ${(a.interests || []).join(", ") || "None"}
   Bio: ${a.bio || "No bio"}
`).join("\n")}

Analyze and return alumni IDs ranked by relevance to the search query and student profile. Focus on career path alignment, skill matches, and potential mentorship value.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", await aiResponse.text());
      // Fallback to simple text matching
      const filtered = alumniData.filter((alumni) => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
          alumni.full_name?.toLowerCase().includes(searchLower) ||
          alumni.alumni_details?.[0]?.company?.toLowerCase().includes(searchLower) ||
          alumni.alumni_details?.[0]?.job_title?.toLowerCase().includes(searchLower) ||
          (alumni.skills || []).some((s: string) => s.toLowerCase().includes(searchLower))
        );
      });
      
      return new Response(
        JSON.stringify({ results: filtered.slice(0, 10) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiRankedIds = JSON.parse(aiData.choices[0].message.content);

    // Map AI rankings back to full alumni profiles
    const results = aiRankedIds
      .map((id: string) => alumniData.find((a) => a.id === id))
      .filter(Boolean)
      .slice(0, 10);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-search-alumni:", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
