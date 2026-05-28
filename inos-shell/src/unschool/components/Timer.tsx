import { useEffect, useMemo, useState } from "react";

interface TimerProps {
  minutes: number;
  onComplete?: () => void;
}

export default function Timer({ minutes, onComplete }: TimerProps) {
  const totalSeconds = Math.max(1, minutes * 60);
  const [remaining, setRemaining] = useState(totalSeconds);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setRemaining(totalSeconds);
    setRunning(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(id);
          setRunning(false);
          if (onComplete) onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, onComplete]);

  const display = useMemo(() => {
    const mins = Math.floor(remaining / 60);
    const secs = remaining % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, [remaining]);

  return (
    <div className="ops-timer">
      <div className="ops-timer-display">{display}</div>
      <div className="ops-timer-actions">
        <button
          type="button"
          className="ops-btn ops-btn-secondary"
          onClick={() => setRunning((prev) => !prev)}
        >
          {running ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          className="ops-btn ops-btn-ghost"
          onClick={() => {
            setRemaining(totalSeconds);
            setRunning(false);
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
