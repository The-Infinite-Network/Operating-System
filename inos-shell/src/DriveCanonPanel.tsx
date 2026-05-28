import { useEffect, useMemo, useState } from "react";
import { type DriveCanonFolder, type DriveCanonListing } from "./types";
import { api } from "./api";
import {
  DRIVE_CANON_ID,
  DRIVE_CANON_ROOT_ID,
  listMockDriveCanonFolders,
} from "./mockDriveCanon";

const ROOT_PARENT_KEY = "root";
const DEPTH_PADDING = [
  "pl-0",
  "pl-[14px]",
  "pl-[28px]",
  "pl-[42px]",
  "pl-[56px]",
  "pl-[70px]",
  "pl-[84px]",
];
const DEPTH_MARGIN = [
  "ml-[28px]",
  "ml-[42px]",
  "ml-[56px]",
  "ml-[70px]",
  "ml-[84px]",
  "ml-[98px]",
  "ml-[112px]",
];

function parentKey(parentId: string | null) {
  return parentId ?? ROOT_PARENT_KEY;
}

type TreeNodeProps = {
  folderId: string;
  depth: number;
  foldersById: Record<string, DriveCanonFolder>;
  childrenByParent: Record<string, string[]>;
  expandedIds: Set<string>;
  loadingIds: Set<string>;
  errorMessage?: string;
  hasMore?: boolean;
  selectedId: string | null;
  onToggle: (folderId: string) => void;
  onSelect: (folderId: string) => void;
  onRetry: (folderId: string) => void;
  onLoadMore: (folderId: string) => void;
};

function TreeNode({
  folderId,
  depth,
  foldersById,
  childrenByParent,
  expandedIds,
  loadingIds,
  errorMessage,
  hasMore,
  selectedId,
  onToggle,
  onSelect,
  onRetry,
  onLoadMore,
}: TreeNodeProps) {
  const folder = foldersById[folderId];
  if (!folder) return null;
  const isExpanded = expandedIds.has(folderId);
  const isLoading = loadingIds.has(folderId);
  const canExpand = folder.hasChildren;
  const children = childrenByParent[folderId] || [];
  const depthClass =
    DEPTH_PADDING[Math.min(depth, DEPTH_PADDING.length - 1)];
  const marginClass =
    DEPTH_MARGIN[Math.min(depth, DEPTH_MARGIN.length - 1)];

  return (
    <li>
      <div
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${depthClass} ${selectedId === folderId ? "bg-white/10" : "hover:bg-white/5"
          }`}
      >
        <button
          type="button"
          className={`h-5 w-5 rounded border text-[10px] ${canExpand
            ? "border-inos-border text-inos-muted hover:text-inos-text"
            : "border-transparent text-transparent"
            }`}
          onClick={() => (canExpand ? onToggle(folderId) : undefined)}
          aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
          disabled={!canExpand}
        >
          {isExpanded ? "-" : "+"}
        </button>
        <button
          type="button"
          onClick={() => onSelect(folderId)}
          className="flex-1 truncate text-left text-sm"
        >
          {folder.name}
        </button>
        {isLoading && <span className="text-[10px] text-inos-muted">...</span>}
      </div>

      {isExpanded && (
        <div className="mt-1">
          {children.length > 0 && (
            <ul className="space-y-1">
              {children.map((childId) => (
                <TreeNode
                  key={childId}
                  folderId={childId}
                  depth={depth + 1}
                  foldersById={foldersById}
                  childrenByParent={childrenByParent}
                  expandedIds={expandedIds}
                  loadingIds={loadingIds}
                  selectedId={selectedId}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  onRetry={onRetry}
                  onLoadMore={onLoadMore}
                />
              ))}
            </ul>
          )}
          {errorMessage && (
            <div
              className={`mt-2 rounded-md border border-rose-500/40 bg-rose-900/20 px-2 py-1.5 text-[11px] text-rose-100 ${marginClass}`}
            >
              <div>{errorMessage}</div>
              <button
                type="button"
                onClick={() => onRetry(folderId)}
                className="mt-1 text-[10px] underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}
          {hasMore && !isLoading && !errorMessage && (
            <div className={`mt-2 ${marginClass}`}>
              <button
                type="button"
                onClick={() => onLoadMore(folderId)}
                className="text-[11px] text-inos-muted underline underline-offset-2 hover:text-inos-text"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function DriveCanonPanel() {
  const [foldersById, setFoldersById] = useState<
    Record<string, DriveCanonFolder>
  >({});
  const [childrenByParent, setChildrenByParent] = useState<
    Record<string, string[]>
  >({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set()
  );
  const [loadingIds, setLoadingIds] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [source, setSource] = useState<"mcp" | "mock">("mock");
  const [errorByParent, setErrorByParent] = useState<Record<string, string>>(
    {}
  );
  const [nextPageTokenByParent, setNextPageTokenByParent] = useState<
    Record<string, string | null | undefined>
  >({});

  const rootChildren = childrenByParent[ROOT_PARENT_KEY] || [];
  const rootError = errorByParent[ROOT_PARENT_KEY];
  const rootHasMore = Boolean(nextPageTokenByParent[ROOT_PARENT_KEY]);

  const selectedFolder = selectedId ? foldersById[selectedId] : null;
  const selectedPath = useMemo(() => {
    if (!selectedFolder) return "";
    const parts: string[] = [];
    let current: DriveCanonFolder | undefined = selectedFolder;
    let guard = 0;
    while (current && guard < 12) {
      parts.unshift(current.name);
      current = current.parentId ? foldersById[current.parentId] : undefined;
      guard += 1;
    }
    return parts.join(" / ");
  }, [foldersById, selectedFolder]);

  const applyListing = (
    listing: DriveCanonListing,
    { append = false }: { append?: boolean } = {}
  ) => {
    setFoldersById((prev) => {
      const next = { ...prev };
      listing.folders.forEach((folder) => {
        next[folder.id] = folder;
      });
      return next;
    });
    setChildrenByParent((prev) => {
      const key = parentKey(listing.parentId);
      const incoming = listing.folders.map((f) => f.id);
      if (!append || !prev[key]) {
        return { ...prev, [key]: incoming };
      }
      const merged = Array.from(new Set([...prev[key], ...incoming]));
      return { ...prev, [key]: merged };
    });
  };

  const loadChildren = async (
    parentId: string | null,
    pageToken?: string | null
  ) => {
    const key = parentId ?? ROOT_PARENT_KEY;
    setLoadingIds((prev) => new Set([...prev, key]));
    setErrorByParent((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    try {
      const result = await api.driveList({
        driveId: DRIVE_CANON_ID,
        parentId,
        pageToken,
      });
      setSource(result.source);
      applyListing(result.listing, { append: Boolean(pageToken) });
      setNextPageTokenByParent((prev) => ({
        ...prev,
        [key]: result.listing.nextPageToken ?? null,
      }));
      return result.listing;
    } catch (err: any) {
      console.warn("MCP drive list failed, falling back to mock", err);
      // Fallback to mock
      try {
        const mockListing = await listMockDriveCanonFolders(parentId);
        setSource("mock");
        applyListing(mockListing, { append: Boolean(pageToken) });
        setNextPageTokenByParent((prev) => ({
          ...prev,
          [key]: mockListing.nextPageToken ?? null,
        }));
        return mockListing;
      } catch (mockErr) {
        setErrorByParent((prev) => ({
          ...prev,
          [key]:
            "Unable to load folders. Check MCP connectivity / credentials.",
        }));
      }
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
    return null;
  };

  const ensureChildrenLoaded = async (folderId: string) => {
    if (childrenByParent[folderId]) return;
    await loadChildren(folderId);
  };

  const handleToggle = async (folderId: string) => {
    const isExpanded = expandedIds.has(folderId);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (isExpanded) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
    if (!isExpanded) {
      await ensureChildrenLoaded(folderId);
    }
  };

  useEffect(() => {
    void loadChildren(null).then((listing) => {
      const rootId = listing?.folders[0]?.id ?? DRIVE_CANON_ROOT_ID;
      if (!rootId) return;
      setSelectedId((current) => current ?? rootId);
      setExpandedIds((prev) => new Set(prev).add(rootId));
      void ensureChildrenLoaded(rootId);
    });
  }, []);

  return (
    <section className="mt-2 space-y-4">
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-inos-muted">
            Drive Canon
          </p>
          <h2 className="text-lg font-semibold">
            INFINITE_NETWORK_CANON (read-only)
          </h2>
          <p className="text-xs text-inos-muted">
            Shared Drive ID: <span className="font-mono">{DRIVE_CANON_ID}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-inos-muted">
          <span className="pill">Folders only</span>
          <span className="pill">Lazy-loaded tree</span>
          {source === "mock" && <span className="pill">Mock mode</span>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-inos-muted">
                Folder Tree
              </p>
              <h3 className="text-lg font-semibold">Navigation</h3>
            </div>
            <span className="text-[11px] text-inos-muted">
              {Object.keys(foldersById).length} folders
            </span>
          </div>

          {rootError && (
            <div className="mt-3 rounded-md border border-rose-500/40 bg-rose-900/20 px-3 py-2 text-xs text-rose-100">
              <div>{rootError}</div>
              <button
                type="button"
                onClick={() => void loadChildren(null)}
                className="mt-1 text-[10px] underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          <div className="mt-3 max-h-[520px] overflow-y-auto pr-2">
            {rootChildren.length === 0 ? (
              <p className="text-sm text-inos-muted">Loading tree...</p>
            ) : (
              <ul className="space-y-1 text-sm text-inos-text">
                {rootChildren.map((folderId) => (
                  <TreeNode
                    key={folderId}
                    folderId={folderId}
                    depth={0}
                    foldersById={foldersById}
                    childrenByParent={childrenByParent}
                    expandedIds={expandedIds}
                    loadingIds={loadingIds}
                    errorMessage={errorByParent[folderId]}
                    hasMore={Boolean(nextPageTokenByParent[folderId])}
                    selectedId={selectedId}
                    onToggle={handleToggle}
                    onSelect={setSelectedId}
                    onRetry={(id) => void loadChildren(id)}
                    onLoadMore={(id) =>
                      void loadChildren(
                        id,
                        nextPageTokenByParent[id] ?? null
                      )
                    }
                  />
                ))}
              </ul>
            )}
            {rootHasMore && !loadingIds.has(ROOT_PARENT_KEY) && !rootError && (
              <button
                type="button"
                onClick={() =>
                  void loadChildren(
                    null,
                    nextPageTokenByParent[ROOT_PARENT_KEY] ?? null
                  )
                }
                className="mt-3 text-[11px] text-inos-muted underline underline-offset-2 hover:text-inos-text"
              >
                Load more
              </button>
            )}
          </div>
        </div>

        <div className="card p-4 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-inos-muted">
              Folder Metadata
            </p>
            <h3 className="text-lg font-semibold">Details</h3>
          </div>

          {selectedFolder ? (
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-inos-muted">
                  Name
                </div>
                <div className="text-inos-text">{selectedFolder.name}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-inos-muted">
                  Last Modified
                </div>
                <div className="text-inos-text">
                  {selectedFolder.lastModified
                    ? new Date(selectedFolder.lastModified).toLocaleString()
                    : "-"}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-inos-muted">
                  Folder ID
                </div>
                <div className="font-mono text-xs break-all">
                  {selectedFolder.id}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-inos-muted">
                  Path
                </div>
                <div className="text-xs text-inos-muted break-words">
                  {selectedPath || "-"}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-inos-muted">
                  Child Folders
                </div>
                <div className="text-inos-text">
                  {selectedFolder.hasChildren ? "Yes" : "No"}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-inos-muted">
              Select a folder in the tree to see metadata.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
