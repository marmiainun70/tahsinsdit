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
  name: "list_students",
  title: "List students",
  description:
    "List students visible to the signed-in user (filtered by Supabase RLS). Optional filter by grade (kelas) and rombel.",
  inputSchema: {
    kelas: z.number().int().min(1).max(6).optional().describe("Grade level (1-6)"),
    rombel: z.string().optional().describe("Class section, e.g. A, B, C, or D"),
    limit: z.number().int().min(1).max(200).optional().describe("Max rows to return (default 50)"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kelas, rombel, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("students")
      .select("id, nama, nis, nisn, kelas, rombel, level, status_bacaan, halaman_terakhir, perlu_perhatian")
      .order("kelas")
      .order("rombel")
      .order("nama")
      .limit(limit ?? 50);
    if (typeof kelas === "number") query = query.eq("kelas", kelas);
    if (rombel) query = query.eq("rombel", rombel);
    const { data, error } = await query;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { students: data ?? [] },
    };
  },
});
