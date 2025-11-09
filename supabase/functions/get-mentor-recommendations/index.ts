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
    const studentBio = profile.bio || "";
    const studentSkills = profile.skills || [];

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

    // Use AI to intelligently match mentors
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an intelligent mentor matching system for IntelliConnect. 
Your task is to analyze student profiles and alumni profiles to provide the best mentor recommendations.
Consider skills, interests, experience, college, and career goals to find the most suitable mentors.

Return ONLY a JSON array of alumni IDs ranked by match quality (best first), limit to top 5.
Format: ["id1", "id2", "id3", "id4", "id5"]`;

    const userPrompt = `Student Profile:
- Name: ${profile.full_name}
- College: ${profile.college}
- Bio: ${studentBio}
- Interests: ${studentInterests.join(", ")}
- Skills: ${studentSkills.join(", ")}

Available Alumni (${alumniData.length} mentors):
${alumniData.map((a, i) => `
${i + 1}. ID: ${a.id}
   Name: ${a.full_name}
   College: ${a.college}
   Company: ${a.alumni_details?.[0]?.company || "N/A"}
   Position: ${a.alumni_details?.[0]?.position || "N/A"}
   Skills: ${(a.skills || []).join(", ")}
   Bio: ${a.bio || "N/A"}
`).join("\n")}

Analyze and return the top 5 alumni IDs that would be the best mentors for this student.`;

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
      // Fallback to simple matching if AI fails
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
        };
      });
      const recommendations = scoredAlumni
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
      
      return new Response(
        JSON.stringify({ recommendations }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const aiRecommendedIds = JSON.parse(aiData.choices[0].message.content);

    // Map AI recommendations back to full alumni profiles
    const recommendations = aiRecommendedIds
      .map((id: string) => alumniData.find((a) => a.id === id))
      .filter(Boolean)
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
