import { useMemo, useState } from "react";
import { parseCommand } from "../domain/commands";

interface CommandPaletteProps {
  onCommit: (command: ReturnType<typeof parseCommand>) => void;
}

const COMMANDS = [
  "/start daily 20m",
  "/start life_skill \"quesadilla\" 25m",
  "/log win \"used spatula safely\" miss \"forgot to turn off burner\" note \"good focus\"",
  "/skill bump life.kitchen_safety +1 reason \"identified hot surface\"",
  "/assign quest \"Hotel/Library sorting\" domain life.organization",
];

export default function CommandPalette({ onCommit }: CommandPaletteProps) {
  const [value, setValue] = useState("");
  const parsed = useMemo(() => parseCommand(value), [value]);

  return (
    <div className="ops-card ops-stack">
      <div>
        <div className="ops-eyebrow">Command Palette</div>
        <h3>Typed actions</h3>
      </div>
      <input
        className="ops-input"
        placeholder="/start daily 20m"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      {parsed ? (
        <div className="ops-card ops-stack">
          <div className="ops-label">Preview</div>
          <pre className="ops-pre">{JSON.stringify(parsed, null, 2)}</pre>
          <button className="ops-btn" onClick={() => onCommit(parsed)}>
            Commit Command
          </button>
        </div>
      ) : (
        <div className="ops-muted">
          Try: {COMMANDS.map((cmd) => (
            <span key={cmd} className="ops-chip ops-chip-light">
              {cmd}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
