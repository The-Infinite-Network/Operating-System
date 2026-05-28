import { useState } from "react";
import { storage } from "../storage";
import { useUnschoolStore } from "../store";

export default function ExportImport() {
  const [busy, setBusy] = useState(false);
  const { bumpRefresh } = useUnschoolStore();

  const handleExport = async () => {
    setBusy(true);
    try {
      const payload = await storage.exportAll();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `unschool-ops-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const payload = JSON.parse(text);
    setBusy(true);
    try {
      await storage.importAll(payload);
      bumpRefresh();
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  };

  return (
    <div className="ops-card ops-stack">
      <div>
        <h3>Export / Import</h3>
        <p className="ops-muted">
          Manual JSON backups. Nothing leaves this machine unless you export it.
        </p>
      </div>
      <div className="ops-actions">
        <button
          type="button"
          className="ops-btn"
          onClick={handleExport}
          disabled={busy}
        >
          Export JSON
        </button>
        <label className="ops-file">
          Import JSON
          <input type="file" accept="application/json" onChange={handleImport} />
        </label>
      </div>
    </div>
  );
}
