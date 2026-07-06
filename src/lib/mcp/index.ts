import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listStudentsTool from "./tools/list_students";
import getStudentProgressTool from "./tools/get_student_progress";

// The OAuth issuer MUST be the direct Supabase host, built from the project
// ref (import-safe: Vite inlines this literal at build time).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "tahsin-sdit-mcp",
  title: "Tahsin SDIT Luqmanul Hakim",
  version: "0.1.0",
  instructions:
    "Tools for the Tahsin SDIT Luqmanul Hakim portal. Use `whoami` to verify the signed-in user, `list_students` to browse students visible to that user (filtered by role via RLS), and `get_student_progress` to inspect a student's recent Al-Qur'an reading progress.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listStudentsTool, getStudentProgressTool],
});
