# INOS Shell: Runs & AAR Tab Implementation Specification

**Target Agent:** INOS Shell Frontend Developer  
**MCP Server:** `mcp-notion` (localhost:3002)  
**Status:** Ready for Implementation

Local `api.ts` wrapper names like `createRun()` and `getAARByRunId()` are internal convenience methods. The underlying public MCP contract uses dot-name tools such as `runs.create`, `runs.list`, `runs.end`, `aars.getByRunId`, and `aars.update`.

---

## Overview

The INOS Shell needs two new tabs in the Mission Detail view:

1. **Runs Tab** - Create and manage mission runs (1:1 with AAR)
2. **AAR Tab** - View and edit After-Action Reviews

Both tabs should follow the existing "Tasks" tab pattern for consistency.

---

## 1. API Functions to Add (`src/api.ts`)

Add these five functions to the `api` object:

```typescript
// Create a run (creates both Run and AAR entries)
createRun: async (payload: {
  missionId: string;
  runTitle?: string;
  notes?: string;
}): Promise<{ run: { id: string; url: string }; aar: { id: string; url: string } }> => {
  const data = await postJson<{
    data: {
      run: { id: string; url: string };
      aar: { id: string; url: string };
    };
  }>("/tool/runs.create", {
    params: {
      mission_id: payload.missionId,
      run_title: payload.runTitle,
      notes: payload.notes,
    },
  });
  return data.data;
},

// List runs for a mission (durable query - survives refresh)
listRunsForMission: async (payload: {
  missionId: string;
  limit?: number;
  offset?: number;
}): Promise<{
  runs: Array<{
    id: string;
    title: string;
    status: string;
    startDate: string | null;
    endDate: string | null;
    notes: string | null;
    url: string;
  }>;
  total: number;
  hasMore: boolean;
}> => {
  const data = await postJson<{
    data: {
      runs: Array<{
        id: string;
        title: string;
        status: string;
        startDate: string | null;
        endDate: string | null;
        notes: string | null;
        url: string;
      }>;
      total: number;
      hasMore: boolean;
    };
  }>("/tool/runs.list", {
    params: {
      mission_id: payload.missionId,
      limit: payload.limit,
      offset: payload.offset,
    },
  });
  return data.data;
},

// Get AAR by Run ID (durable query - survives refresh)
getAARByRunId: async (payload: {
  runId: string;
}): Promise<{
  id: string;
  title: string;
  status: string;
  summary: string | null;
  outcomes: string | null;
  lessons: string | null;
  runId: string;
  missionId: string | null;
  url: string;
} | null> => {
  const data = await postJson<{
    data: {
      id: string;
      title: string;
      status: string;
      summary: string | null;
      outcomes: string | null;
      lessons: string | null;
      runId: string;
      missionId: string | null;
      url: string;
    } | null;
  }>("/tool/aars.getByRunId", {
    params: {
      run_id: payload.runId,
    },
  });
  return data.data;
},

// End a run
endRun: async (payload: {
  runId: string;
  endNotes?: string;
}): Promise<{ id: string; url: string }> => {
  const data = await postJson<{
    data: { id: string; url: string };
  }>("/tool/runs.end", {
    params: {
      run_id: payload.runId,
      end_notes: payload.endNotes,
    },
  });
  return data.data;
},

// Update an AAR
updateAAR: async (payload: {
  aarId: string;
  title?: string;
  summary?: string;
  outcomes?: string;
  lessons?: string;
  status?: string; // "Draft" | "In Progress" | "Complete"
}): Promise<{ id: string; url: string }> => {
  const data = await postJson<{
    data: { id: string; url: string };
  }>("/tool/aars.update", {
    params: {
      aar_id: payload.aarId,
      title: payload.title,
      summary: payload.summary,
      outcomes: payload.outcomes,
      lessons: payload.lessons,
      status: payload.status,
    },
  });
  return data.data;
},
```

---

## 2. Type Definitions (`src/types.ts`)

Add these types:

```typescript
export type MissionRun = {
  id: string;
  title: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  missionId: string;
};

export type MissionAAR = {
  id: string;
  title: string;
  status: string;
  summary: string | null;
  outcomes: string | null;
  lessons: string | null;
  runId: string | null;
  missionId: string;
};
```

---

## 3. Runs Tab Implementation (`src/App.tsx`)

### State Management

Add to component state:

```typescript
// Runs state
const [runs, setRuns] = useState<MissionRun[]>([]);
const [runsLoading, setRunsLoading] = useState(false);
const [runForm, setRunForm] = useState({ title: "", notes: "" });
const [selectedRun, setSelectedRun] = useState<MissionRun | null>(null);

// AAR state (for AAR tab)
const [aar, setAAR] = useState<MissionAAR | null>(null);
const [aarLoading, setAARLoading] = useState(false);
const [aarForm, setAARForm] = useState({
  title: "",
  summary: "",
  outcomes: "",
  lessons: "",
  status: "Draft",
});
```

### Load Runs Function

```typescript
const loadRuns = async () => {
  if (!selectedMission) return;
  setRunsLoading(true);
  try {
    // TODO: Wire to the durable MCP-backed runs.list query
    // For now, runs will be created via createRun and stored in state
    // Future: api.listRunsForMission(selectedMission.id)
    setRuns([]);
  } catch (error) {
    console.error("Failed to load runs", error);
    addToast("Failed to load runs", "error");
  } finally {
    setRunsLoading(false);
  }
};
```

### Create Run Handler

```typescript
const submitRun = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!selectedMission) return;

  try {
    const result = await api.createRun({
      missionId: selectedMission.id,
      runTitle: runForm.title || undefined,
      notes: runForm.notes || undefined,
    });

    addToast("Run created successfully", "success");
    setRunForm({ title: "", notes: "" });
    
    // Add to runs list
    const newRun: MissionRun = {
      id: result.run.id,
      title: runForm.title || `Run: ${selectedMission.title}`,
      status: "In Progress",
      startDate: new Date().toISOString(),
      endDate: null,
      notes: runForm.notes || null,
      missionId: selectedMission.id,
    };
    setRuns([...runs, newRun]);
    setSelectedRun(newRun);
    
    // Refresh timeline
    if (selectedMission) {
      loadTimelineEvents(selectedMission.id);
    }
  } catch (error) {
    console.error("Failed to create run", error);
    addToast("Failed to create run", "error");
  }
};
```

### End Run Handler

```typescript
const handleEndRun = async (run: MissionRun) => {
  if (!confirm("End this run? This will mark it as complete.")) return;

  try {
    await api.endRun({
      runId: run.id,
      endNotes: undefined, // Could add a prompt for end notes
    });

    addToast("Run ended successfully", "success");
    
    // Update run in state
    setRuns(runs.map((r) => 
      r.id === run.id 
        ? { ...r, status: "Complete", endDate: new Date().toISOString() }
        : r
    ));
    
    // Refresh timeline
    if (selectedMission) {
      loadTimelineEvents(selectedMission.id);
    }
  } catch (error) {
    console.error("Failed to end run", error);
    addToast("Failed to end run", "error");
  }
};
```

### Runs Tab UI

Replace the placeholder in the `missionDetailTab === "runs"` section:

```tsx
{missionDetailTab === "runs" ? (
  <div className="space-y-3 pt-2">
    {/* Create Run Form */}
    <form className="space-y-2" onSubmit={submitRun}>
      <div>
        <label
          className="text-xs text-inos-muted"
          htmlFor="run-title"
        >
          New Run
        </label>
        <input
          id="run-title"
          className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent"
          value={runForm.title}
          onChange={(e) =>
            setRunForm((f) => ({ ...f, title: e.target.value }))
          }
          placeholder="Run title (optional, defaults to mission title)"
        />
      </div>
      <div>
        <label
          className="text-xs text-inos-muted"
          htmlFor="run-notes"
        >
          Notes (optional)
        </label>
        <textarea
          id="run-notes"
          className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent"
          value={runForm.notes}
          onChange={(e) =>
            setRunForm((f) => ({ ...f, notes: e.target.value }))
          }
          placeholder="Initial run notes..."
          rows={3}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition hover:translate-y-[-1px]"
      >
        Start Run
      </button>
    </form>

    {/* Runs List */}
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
        Active Runs ({runs.filter((r) => r.status === "In Progress").length})
      </div>
      {runs
        .filter((r) => r.status === "In Progress")
        .map((run) => (
          <div
            key={run.id}
            className="rounded-lg border border-inos-border/60 bg-[#0f172a] px-3 py-2"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{run.title}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedRun(run);
                    setMissionDetailTab("aar");
                    // Load AAR for this run
                    loadAARForRun(run.id);
                  }}
                  className="text-xs text-inos-accent hover:underline"
                >
                  View AAR
                </button>
                <button
                  onClick={() => handleEndRun(run)}
                  className="text-xs text-red-400 hover:underline"
                >
                  End Run
                </button>
              </div>
            </div>
            <div className="text-xs text-inos-muted mt-1">
              Started: {run.startDate ? new Date(run.startDate).toLocaleString() : "—"}
            </div>
            {run.notes && (
              <div className="text-xs text-inos-muted mt-1">{run.notes}</div>
            )}
          </div>
        ))}
      
      {runs.filter((r) => r.status === "In Progress").length === 0 && (
        <p className="text-sm text-inos-muted">
          No active runs. Start a run to begin tracking mission execution.
        </p>
      )}
    </div>

    {/* Completed Runs */}
    {runs.filter((r) => r.status === "Complete").length > 0 && (
      <div className="space-y-2 pt-4 border-t border-inos-border/60">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          Completed Runs ({runs.filter((r) => r.status === "Complete").length})
        </div>
        {runs
          .filter((r) => r.status === "Complete")
          .map((run) => (
            <div
              key={run.id}
              className="rounded-lg border border-inos-border/60 bg-[#0f172a]/50 px-3 py-2 opacity-75"
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{run.title}</span>
                <button
                  onClick={() => {
                    setSelectedRun(run);
                    setMissionDetailTab("aar");
                    loadAARForRun(run.id);
                  }}
                  className="text-xs text-inos-accent hover:underline"
                >
                  View AAR
                </button>
              </div>
              <div className="text-xs text-inos-muted mt-1">
                {run.startDate && run.endDate
                  ? `${new Date(run.startDate).toLocaleDateString()} → ${new Date(run.endDate).toLocaleDateString()}`
                  : "—"}
              </div>
            </div>
          ))}
      </div>
    )}
  </div>
) : null}
```

---

## 4. AAR Tab Implementation (`src/App.tsx`)

### Load AAR Function

```typescript
const loadAARForRun = async (runId: string) => {
  setAARLoading(true);
  try {
    const result = await api.getAARByRunId({ runId });
    if (result) {
      // Map API response to MissionAAR type
      setAAR({
        id: result.id,
        title: result.title,
        status: result.status,
        summary: result.summary,
        outcomes: result.outcomes,
        lessons: result.lessons,
        runId: result.runId,
        missionId: result.missionId || selectedMission?.id || "",
      });
      // Populate form with existing AAR data
      setAARForm({
        title: result.title,
        summary: result.summary || "",
        outcomes: result.outcomes || "",
        lessons: result.lessons || "",
        status: result.status,
      });
    } else {
      // No AAR found - this shouldn't happen if run was created correctly
      addToast("AAR not found for this run", "error");
      setAAR(null);
    }
  } catch (error) {
    console.error("Failed to load AAR", error);
    addToast("Failed to load AAR", "error");
  } finally {
    setAARLoading(false);
  }
};
```

### Update AAR Handler

```typescript
const submitAAR = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!aar) return;

  try {
    await api.updateAAR({
      aarId: aar.id,
      title: aarForm.title || undefined,
      summary: aarForm.summary || undefined,
      outcomes: aarForm.outcomes || undefined,
      lessons: aarForm.lessons || undefined,
      status: aarForm.status,
    });

    addToast("AAR updated successfully", "success");
    
    // Update AAR in state
    setAAR({
      ...aar,
      title: aarForm.title || aar.title,
      summary: aarForm.summary || null,
      outcomes: aarForm.outcomes || null,
      lessons: aarForm.lessons || null,
      status: aarForm.status,
    });
    
    // Refresh timeline
    if (selectedMission) {
      loadTimelineEvents(selectedMission.id);
    }
  } catch (error) {
    console.error("Failed to update AAR", error);
    addToast("Failed to update AAR", "error");
  }
};
```

### AAR Tab UI

Replace the placeholder in the `missionDetailTab === "aar"` section:

```tsx
{missionDetailTab === "aar" ? (
  <div className="space-y-3 pt-2">
    {aarLoading ? (
      <div className="text-xs text-inos-muted">Loading AAR...</div>
    ) : aar ? (
      <form className="space-y-3" onSubmit={submitAAR}>
        <div>
          <label
            className="text-xs text-inos-muted"
            htmlFor="aar-title"
          >
            AAR Title
          </label>
          <input
            id="aar-title"
            className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent"
            value={aarForm.title || aar.title}
            onChange={(e) =>
              setAARForm((f) => ({ ...f, title: e.target.value }))
            }
            placeholder="AAR title"
          />
        </div>

        <div>
          <label
            className="text-xs text-inos-muted"
            htmlFor="aar-summary"
          >
            Summary
          </label>
          <textarea
            id="aar-summary"
            className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent"
            value={aarForm.summary || aar.summary || ""}
            onChange={(e) =>
              setAARForm((f) => ({ ...f, summary: e.target.value }))
            }
            placeholder="What happened? Key events and outcomes..."
            rows={4}
          />
        </div>

        <div>
          <label
            className="text-xs text-inos-muted"
            htmlFor="aar-outcomes"
          >
            Outcomes
          </label>
          <textarea
            id="aar-outcomes"
            className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent"
            value={aarForm.outcomes || aar.outcomes || ""}
            onChange={(e) =>
              setAARForm((f) => ({ ...f, outcomes: e.target.value }))
            }
            placeholder="What was achieved? Measurable results..."
            rows={4}
          />
        </div>

        <div>
          <label
            className="text-xs text-inos-muted"
            htmlFor="aar-lessons"
          >
            Lessons Learned
          </label>
          <textarea
            id="aar-lessons"
            className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent"
            value={aarForm.lessons || aar.lessons || ""}
            onChange={(e) =>
              setAARForm((f) => ({ ...f, lessons: e.target.value }))
            }
            placeholder="What did we learn? What would we do differently?"
            rows={4}
          />
        </div>

        <div>
          <label
            className="text-xs text-inos-muted"
            htmlFor="aar-status"
          >
            Status
          </label>
          <select
            id="aar-status"
            className="mt-1 w-full rounded-lg border border-inos-border bg-[#0f172a] px-3 py-2 text-sm outline-none focus:border-inos-accent"
            value={aarForm.status || aar.status}
            onChange={(e) =>
              setAARForm((f) => ({ ...f, status: e.target.value }))
            }
          >
            <option value="Draft">Draft</option>
            <option value="In Progress">In Progress</option>
            <option value="Complete">Complete</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:translate-y-[-1px]"
        >
          Save AAR
        </button>
      </form>
    ) : selectedRun ? (
      <div className="text-sm text-inos-muted">
        <p>No AAR found for this run.</p>
        <p className="mt-2 text-xs">
          AARs are created automatically when you start a run. If you don't see an AAR,
          make sure the run was created successfully.
        </p>
      </div>
    ) : (
      <div className="text-sm text-inos-muted">
        <p>Select a run from the Runs tab to view or edit its AAR.</p>
      </div>
    )}
  </div>
) : null}
```

---

## 5. Integration Points

### When Run is Created

1. Store the AAR ID returned from `createRun()`:

   ```typescript
   const result = await api.createRun(...);
   // result.aar.id - store this for AAR tab access
   ```

2. Create a mapping: `runId -> aarId` to enable AAR loading

### When Mission is Selected

1. Load runs for the mission (when API is available)
2. If a run is in progress, show it prominently
3. Auto-select the AAR tab if user clicks "View AAR"

### Timeline Integration

- Runs automatically emit `RUN_STARTED` and `AAR_CREATED` events
- Ending a run emits `RUN_ENDED`
- Updating AAR (first save, final save) emits `AAR_UPDATED`
- Timeline should refresh after run/AAR operations

---

## 6. Future Enhancements (Not Required for MVP)

1. ~~**List Runs API**: Add `api.listRunsForMission(missionId)` endpoint~~ ✅ **COMPLETE** - Now available
2. ~~**Get AAR API**: Add `api.getAARByRunId(runId)` endpoint~~ ✅ **COMPLETE** - Now available
3. **Run Details View**: Show run timeline, linked tasks, etc.
4. **AAR Templates**: Pre-fill AAR with structured prompts
5. **AAR Export**: Generate PDF or markdown export
6. **Pagination UI**: Implement "Load more" for runs list if `hasMore: true`

---

## 7. Testing Checklist

- [ ] Create a run from Runs tab
- [ ] Verify run appears in active runs list
- [ ] Click "View AAR" and verify AAR tab loads
- [ ] Edit AAR fields and save
- [ ] Verify AAR status can be changed
- [ ] End a run and verify it moves to completed section
- [ ] Verify timeline events appear after run/AAR operations
- [ ] Test error handling (network errors, invalid mission, etc.)

---

## Notes for Implementation

1. **AAR ID Storage**: When `createRun()` returns `{ run: {...}, aar: {...} }`, store the `aar.id` in a way that can be retrieved by `runId`. Consider a `Map<runId, aarId>` or adding `aarId` to the `MissionRun` type.

2. **State Management**: The current implementation uses local component state. Consider if you need to persist runs/AARs across page refreshes (localStorage) or if they should be fetched from the API each time.

3. **Loading States**: Show loading indicators when creating runs or updating AARs to provide user feedback.

4. **Error Messages**: Use the existing toast system (`addToast`) for user feedback.

5. **Styling**: Follow the existing design patterns (card backgrounds, border colors, button styles) for consistency.

---

**MCP Protocol Compliance:** All API calls follow the MCP tool pattern: `POST /tool/{toolName}` with `{ params: {...} }` in the request body, and responses wrapped in `{ data: {...} }`.
