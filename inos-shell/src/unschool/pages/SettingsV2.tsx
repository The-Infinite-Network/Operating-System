import { useEffect, useState } from "react";
import { exportAll, importAll } from "../data/export";
import { outboxRepo, settingsRepo } from "../data/repositories";
import { processOutbox, retryOutboxErrors } from "../services/outbox";

export default function SettingsV2() {
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [mcpBaseUrl, setMcpBaseUrl] = useState("");
  const [redact, setRedact] = useState(false);
  const [pending, setPending] = useState(0);
  const [health, setHealth] = useState<string>("unknown");

  useEffect(() => {
    settingsRepo.get().then((settings) => {
      setSyncEnabled(settings.syncEnabled);
      setMcpBaseUrl(settings.mcpBaseUrl);
    });
    outboxRepo.countPending().then(setPending);
  }, []);

  const handleSave = async () => {
    await settingsRepo.update({ syncEnabled, mcpBaseUrl });
  };

  const handleExport = async () => {
    const payload = await exportAll(redact);
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `unschool-ops-v2-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const payload = JSON.parse(text);
    await importAll(payload);
    event.target.value = "";
  };

  const handleHealth = async () => {
    await retryOutboxErrors();
    const result = await processOutbox();
    setHealth(result.ok ? "ok" : result.reason || "offline");
    setPending(await outboxRepo.countPending());
  };

  return (
    <div className="ops-page">
      <div className="ops-card ops-stack">
        <h2>Sync Settings</h2>
        <label className="ops-toggle">
          <input
            type="checkbox"
            checked={syncEnabled}
            onChange={(event) => setSyncEnabled(event.target.checked)}
          />
          Sync to INOS Timeline
        </label>
        <label>
          MCP Base URL
          <input
            className="ops-input"
            value={mcpBaseUrl}
            onChange={(event) => setMcpBaseUrl(event.target.value)}
          />
        </label>
        <div className="ops-actions">
          <button className="ops-btn" onClick={handleSave}>
            Save Settings
          </button>
          <button className="ops-btn ops-btn-secondary" onClick={handleHealth}>
            Health Check + Resync
          </button>
        </div>
        <div className="ops-muted">Health: {health}</div>
        <div className="ops-muted">Pending outbox: {pending}</div>
      </div>

      <div className="ops-card ops-stack">
        <h2>Export / Import</h2>
        <label className="ops-toggle">
          <input
            type="checkbox"
            checked={redact}
            onChange={(event) => setRedact(event.target.checked)}
          />
          Redact student names on export
        </label>
        <div className="ops-actions">
          <button className="ops-btn" onClick={handleExport}>
            Export JSON
          </button>
          <label className="ops-file">
            Import JSON
            <input type="file" accept="application/json" onChange={handleImport} />
          </label>
        </div>
      </div>
    </div>
  );
}
