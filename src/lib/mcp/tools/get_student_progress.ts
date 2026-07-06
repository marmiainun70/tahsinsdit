import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "get_student_progress",
  title: "Get student progress",
  description:
    "Fetch a student's basic profile and their most recent Al-Qur'an reading progress entries. Access is filtered by RLS.",
  inputSchema: {
    student_id: z.string().uuid().describe("Student UUID (students.id)"),
    limit: z.number().int().min(1).max(50).optional().describe("Max progress entries (default 10)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ student_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    const [studentRes, progressRes] = await Promise.all([
      supabase
        .from("students")
        .select("id, nama, kelas, rombel, level, status_bacaan, halaman_terakhir, perlu_perhatian, catatan_perhatian")
        .eq("id", student_id)
        .maybeSingle(),
      supabase
        .from("progress_entries")
        .select("*")
        .eq("student_id", student_id)
        .order("created_at", { ascending: false })
        .limit(limit ?? 10),
    ]);

    if (studentRes.error) {
      return { content: [{ type: "text", text: studentRes.error.message }], isError: true };
    }
    if (progressRes.error) {
      return { content: [{ type: "text", text: progressRes.error.message }], isError: true };
    }

    const payload = {
      student: studentRes.data,
      progress: progressRes.data ?? [],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
