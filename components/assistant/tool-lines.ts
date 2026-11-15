import type { Copy } from "./assistant-copy";
import type { LiveTool } from "./use-assistant-turn";

type ToolName = Exclude<keyof Copy["tools"], "other">;

export function toolLine(copy: Copy, name: string | null, status: LiveTool["status"]): string {
  const forms = name && name in copy.tools ? copy.tools[name as ToolName] : copy.tools.other;
  return forms[status];
}
