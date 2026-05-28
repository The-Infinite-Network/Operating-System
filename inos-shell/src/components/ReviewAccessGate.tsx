import React, { useState } from "react";
import { ShieldCheck, ArrowRight, Lock } from "lucide-react";

interface ReviewAccessGateProps {
  children: React.ReactNode;
  entity: string;
}

export default function ReviewAccessGate({ children, entity }: ReviewAccessGateProps) {
  const [accessCode, setAccessCode] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simplified logic for sandbox demo - allow 'INOS-E0' as master code
    if (accessCode.toUpperCase() === "INOS-E0") {
      setIsAuthorized(true);
    } else {
      setError("Invalid access code for " + entity);
      setTimeout(() => setError(""), 3000);
    }
  };

  if (isAuthorized) return <>{children}</>;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-500">
      <div className="bg-[#080808] border border-[#1a1a1a] rounded-sm max-w-md w-full p-8 space-y-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
              <ShieldCheck size={32} />
            </div>
          </div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-white">Review Access Required</h2>
          <p className="text-xs text-[#555] font-mono uppercase tracking-widest">{entity} INTRANET // LAYER 5 RESTRICTION</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#555] uppercase tracking-widest flex items-center gap-2">
              <Lock size={12} /> Enter Authorization Code
            </label>
            <input
              type="password"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0d0d0d] border border-[#222] rounded-md px-4 py-3 text-sm font-mono text-[#00f0ff] outline-none focus:border-purple-500/50 transition-all"
              autoFocus
            />
          </div>
          
          {error && <p className="text-[10px] text-red-500 font-mono text-center">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 bg-purple-600/10 border border-purple-500/30 text-purple-400 rounded-md font-bold uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            Authenticate <ArrowRight size={14} />
          </button>
        </form>

        <p className="text-[9px] text-[#333] text-center leading-relaxed font-mono">
          UNAUTHORIZED ACCESS TO VAP INTRANET SURFACES IS LOGGED. <br />
          CONTACT THE SYSTEM ARCHITECT FOR ACCESS PROTOCOLS.
        </p>
      </div>
    </div>
  );
}
