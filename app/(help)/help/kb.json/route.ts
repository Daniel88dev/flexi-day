import { buildKnowledgeBase } from "@/lib/help/knowledge-base";

// The static export writes this to out/help/kb.json; `next dev` serves it from the same path.
export const dynamic = "force-static";

export function GET() {
  return Response.json(buildKnowledgeBase());
}
