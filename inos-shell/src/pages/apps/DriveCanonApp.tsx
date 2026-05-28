import React, { useState, useEffect } from "react";
import { api } from "../../api";
import { Folder, File, ArrowLeft, Loader2, Database, AlertCircle } from "lucide-react";

interface DriveItem {
    id: string;
    name: string;
    mimeType: string;
    iconLink?: string;
    webViewLink?: string;
}

export default function DriveCanonApp() {
    const [currentFolderId, setCurrentFolderId] = useState<string>("root");
    const [pathHistory, setPathHistory] = useState<{ id: string; name: string }[]>([
        { id: "root", name: "Canon Root" },
    ]);
    const [items, setItems] = useState<DriveItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadFolder = async (folderId: string) => {
        setLoading(true);
        setError(null);
        try {
            // "root" is a magic alias for the Canon Root ID in our API
            const { listing } = await api.driveList({
                driveId: "root", // Ignored by mock, used by real env if set
                parentId: folderId === "root" ? null : folderId,
            });
            setItems(listing.files.map(f => ({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
                iconLink: f.iconLink,
                webViewLink: f.webViewLink
            })));
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load Drive contents");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFolder(currentFolderId);
    }, [currentFolderId]);

    const handleNavigate = (folderId: string, folderName: string) => {
        setCurrentFolderId(folderId);
        setPathHistory(prev => [...prev, { id: folderId, name: folderName }]);
    };

    const handleUp = () => {
        if (pathHistory.length <= 1) return;
        const newPath = [...pathHistory];
        newPath.pop(); // Remove current
        const parent = newPath[newPath.length - 1];
        setPathHistory(newPath);
        setCurrentFolderId(parent.id);
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Database className="w-6 h-6 text-blue-400" />
                        Drive Canon
                    </h1>
                    <p className="text-inos-muted text-sm mt-1">
                        Official file registry and artifact storage.
                    </p>
                </div>
                <div className="gh-env-pill">
                    <span className="gh-env-dot bg-emerald-500" />
                    <span>MCP LIVE</span>
                </div>
            </div>

            <div className="card flex-1 flex flex-col overflow-hidden bg-[#0f172a]/80 backdrop-blur">
                {/* Breadcrumbs / Nav */}
                <div className="p-4 border-b border-inos-border/50 flex items-center gap-3 text-sm">
                    <button
                        onClick={handleUp}
                        disabled={pathHistory.length <= 1}
                        aria-label="Go back to parent folder"
                        className="p-1.5 rounded-full hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap">
                        {pathHistory.map((segment, i) => (
                            <React.Fragment key={segment.id}>
                                {i > 0 && <span className="text-inos-muted">/</span>}
                                <span className={i === pathHistory.length - 1 ? "text-white font-medium" : "text-inos-muted"}>
                                    {segment.name}
                                </span>
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {loading && (
                        <div className="flex items-center justify-center h-40">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center h-40 text-red-400 space-y-2">
                            <AlertCircle className="w-8 h-8" />
                            <p>{error}</p>
                            <button onClick={() => loadFolder(currentFolderId)} className="btn-secondary text-xs">Retry</button>
                        </div>
                    )}

                    {!loading && !error && items.length === 0 && (
                        <div className="flex items-center justify-center h-40 text-inos-muted text-sm">
                            Empty folder
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {!loading && !error && items.map(item => {
                            const isFolder = item.mimeType === "application/vnd.google-apps.folder";
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => isFolder ? handleNavigate(item.id, item.name) : window.open(item.webViewLink, "_blank")}
                                    className="group p-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all cursor-pointer flex items-center gap-3"
                                >
                                    <div className={`p-2 rounded-lg ${isFolder ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-gray-400"}`}>
                                        {isFolder ? <Folder className="w-5 h-5" /> : <File className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-200 truncate group-hover:text-white">
                                            {item.name}
                                        </div>
                                        <div className="text-xs text-inos-muted truncate">
                                            {isFolder ? "Folder" : "File"}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
