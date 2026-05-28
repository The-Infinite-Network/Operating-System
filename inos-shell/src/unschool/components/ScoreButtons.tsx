interface ScoreButtonsProps {
  options: string[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function ScoreButtons({
  options,
  value,
  onChange,
  label,
}: ScoreButtonsProps) {
  return (
    <div className="ops-score-group">
      {label ? <div className="ops-label">{label}</div> : null}
      <div className="ops-score-buttons">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={`ops-score-btn ${value === option ? "active" : ""}`}
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
