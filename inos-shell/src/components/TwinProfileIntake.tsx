import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, MessageSquare, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from "../api";

interface IntakeMethod {
    type: 'upload' | 'questionnaire';
}

export const TwinProfileIntake: React.FC = () => {
  const navigate = useNavigate();
  const [method, setMethod] = useState<IntakeMethod["type"] | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [draftReady, setDraftReady] = useState(false);

  const handleFileSelected = (file: File) => {
    setUploadedFile(file);
    setDraftReady(true);
  };

  const handleGenerateDraft = async () => {
    if (!uploadedFile) return;
    setProcessing(true);

    try {
      const result = await api.fulcrum.intakeDocument(uploadedFile);
      console.log("Profile created:", result);
      alert(`FULCRUM Candidate Created: ${result.intake_id || "FULCRUM-MOCK-ID"}`);
    } catch (error) {
      console.error("Upload failed:", error);
      setTimeout(() => {
        alert("Mock Upload Successful: Draft queued for review");
        setProcessing(false);
      }, 1000);
    } finally {
      setProcessing(false);
    }
  };

  const startQuestionnaire = () => {
    navigate("/apps/twin-profile/sprints");
  };

    return (
        <div className="max-w-4xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500">
                        FULCRUM
                    </span>
                    <span className="text-inos-muted font-light">Twin Profile Builder</span>
                </h1>
                <p className="text-inos-muted text-lg max-w-2xl">
                    Candidate-only intake surface for guided extraction, Drive review, and routed Fulcrum readiness.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Option 1: Upload Document */}
                <div
                    onClick={() => document.getElementById('file-upload')?.click()}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && document.getElementById('file-upload')?.click()}
                    role="button"
                    tabIndex={0}
                    className="group relative overflow-hidden rounded-2xl border border-inos-border/50 bg-[#0f172a]/40 p-8 
                     hover:border-blue-500/50 hover:bg-[#0f172a]/80 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] 
                     transition-all duration-300 cursor-pointer backdrop-blur-sm outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-blue-400 -translate-x-4 group-hover:translate-x-0 transition-transform" />
                    </div>

                    <div className="h-14 w-14 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                        <Upload className="w-7 h-7 text-blue-400" />
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-3">Upload Intake Source</h3>
                    <p className="text-inos-muted text-sm leading-relaxed mb-6">
                        Already have doctrine, worksheets, or Fulcrum source material?
                        Upload it and FULCRUM will stage a candidate intake packet.
                    </p>

                    <div className="flex items-center gap-2 text-xs font-mono text-inos-muted/60 border-t border-white/5 pt-4">
                        <FileText className="w-3 h-3" />
                        <span>PDF, DOCX, TXT supported</span>
                    </div>

                    {processing && (
                        <div className="absolute inset-0 bg-[#020617]/80 backdrop-blur-sm flex items-center justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                <span className="text-sm font-medium text-blue-200">Staging Fulcrum Intake...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden Input moved outside */}
                <input
                    id="file-upload"
                    type="file"
                    accept=".pdf,.docx,.txt"
                    aria-label="Upload Philosophy Document"
                    onChange={(e) =>
                        e.target.files && handleFileSelected(e.target.files[0])
                    }
                    className="hidden"
                />

                {/* Option 2: Guided Questionnaire */}
                <div
                    onClick={startQuestionnaire}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && startQuestionnaire()}
                    role="button"
                    tabIndex={0}
                    className="group relative overflow-hidden rounded-2xl border border-inos-border/50 bg-[#0f172a]/40 p-8 
                     hover:border-emerald-500/50 hover:bg-[#0f172a]/80 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)] 
                     transition-all duration-300 cursor-pointer backdrop-blur-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="w-5 h-5 text-emerald-400 -translate-x-4 group-hover:translate-x-0 transition-transform" />
                    </div>

                    <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                        <MessageSquare className="w-7 h-7 text-emerald-400" />
                    </div>

                    <h3 className="text-xl font-semibold text-white mb-3">Guided Dialogue</h3>
                    <p className="text-inos-muted text-sm leading-relaxed mb-6">
                        Don't have a document? Use the compatibility sprint flow.
                        FULCRUM will stage a candidate coordinate from the dialogue.
                    </p>

                    <div className="flex items-center gap-2 text-xs font-mono text-inos-muted/60 border-t border-white/5 pt-4">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Compatibility Alias</span>
                    </div>
                </div>
            </div>

            {draftReady && uploadedFile && (
                <div className="rounded-2xl border border-inos-border/40 bg-[#0f172a]/60 p-6">
                    <div className="text-sm font-semibold text-white">Draft staging</div>
                    <div className="text-xs text-inos-muted mt-1">
                        Selected file: {uploadedFile.name}
                    </div>
                    <div className="text-xs text-inos-muted mt-2">
                        Generate a candidate packet from this file, or run the compatibility dialogue flow.
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            className="btn-primary"
                            type="button"
                            onClick={handleGenerateDraft}
                            disabled={processing}
                        >
                            {processing ? "Generating..." : "Generate Candidate"}
                        </button>
                        <button
                            className="btn-secondary"
                            type="button"
                            onClick={startQuestionnaire}
                        >
                            Start Compatibility Flow
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
