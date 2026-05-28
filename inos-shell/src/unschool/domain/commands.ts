export type CommandAction =
  | { type: "start"; sessionType: string; duration: number; title?: string }
  | {
      type: "log";
      wins?: string;
      misses?: string;
      note?: string;
    }
  | { type: "skill_bump"; skillId: string; delta: number; reason?: string }
  | { type: "assign_quest"; title: string; domain?: string };

function parseQuoted(input: string) {
  const match = input.match(/"([^"]+)"/);
  return match ? match[1] : null;
}

export function parseCommand(input: string): CommandAction | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) return null;
  const parts = trimmed.split(" ");
  const cmd = parts[0].toLowerCase();

  if (cmd === "/start") {
    const sessionType = parts[1] || "daily";
    const durationMatch = trimmed.match(/(\d+)\s*m/);
    const duration = durationMatch ? Number(durationMatch[1]) : 20;
    const title = parseQuoted(trimmed) || undefined;
    return { type: "start", sessionType, duration, title };
  }

  if (cmd === "/log") {
    const win = trimmed.match(/win\s+"([^"]+)"/i)?.[1];
    const miss = trimmed.match(/miss\s+"([^"]+)"/i)?.[1];
    const note = trimmed.match(/note\s+"([^"]+)"/i)?.[1];
    return { type: "log", wins: win, misses: miss, note };
  }

  if (cmd === "/skill") {
    const skillId = parts[2];
    const deltaMatch = trimmed.match(/([+-]\d+)/);
    const delta = deltaMatch ? Number(deltaMatch[1]) : 1;
    const reason = trimmed.match(/reason\s+"([^"]+)"/i)?.[1];
    if (!skillId) return null;
    return { type: "skill_bump", skillId, delta, reason };
  }

  if (cmd === "/assign") {
    const title = parseQuoted(trimmed) || "";
    if (!title) return null;
    const domainMatch = trimmed.match(/domain\s+([a-z._]+)/i);
    return {
      type: "assign_quest",
      title,
      domain: domainMatch ? domainMatch[1] : undefined,
    };
  }

  return null;
}
