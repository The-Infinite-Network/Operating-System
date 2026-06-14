import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Rocket, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { api } from "../api";

const SPRINT_MODULES = [
  {
    title: "Module 1: Core Identity",
    prompt: "Who are you at your core? What are the absolute non-negotiable principles you operate by?",
  },
  {
    title: "Module 2: Decision Framework",
    prompt: "How do you make hard decisions? When presented with two good options, what acts as your tie-breaker?",
  },
  {
    title: "Module 3: Boundaries & Vetoes",
    prompt: "What is an immediate 'No' for you? Describe a situation where you would walk away from an opportunity.",
  },
  {
    title: "Module 4: Operating Cadence",
    prompt: "What does your ideal operational rhythm look like? (e.g., deep work mornings, high-bandwidth afternoons, specific rituals).",
  },
  {
    title: "Module 5: Failure & Recovery",
    prompt: "How do you handle failure or system breakdown? What is your protocol for getting back to baseline?",
  },
];

interface DialogueTurn {
  role: "system" | "user";
  text: string;
}

export default function TwinProfileSprints() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [currentModule, setCurrentModule] = useState(0);
  const [dialogue, setDialogue] = useState<DialogueTurn[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [processing, setProcessing] = useState(false);
  const [complete, setComplete] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dialogue.length === 0) {
      setDialogue([{ role: "system", text: SPRINT_MODULES[0].prompt }]);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dialogue, processing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newDialogue: DialogueTurn[] = [
      ...dialogue,
      { role: "user", text: inputValue.trim() },
    ];
    
    setDialogue(newDialogue);
    setInputValue("");

    if (currentModule < SPRINT_MODULES.length - 1) {
      const nextMod = currentModule + 1;
      setCurrentModule(nextMod);
      setDialogue([
        ...newDialogue,
        { role: "system", text: SPRINT_MODULES[nextMod].prompt },
      ]);
    } else {
      await processExtraction(newDialogue);
    }
  };

  const processExtraction = async (finalDialogue: DialogueTurn[]) => {
    setProcessing(true);
    
    const rawDialogue = finalDialogue
      .map(t => (t.role === 'system' ? 'System: ' : 'User: ') + t.text)
      .join("\n\n");

    try {
      const result = await api.fulcrum.intakeDialogue(rawDialogue, user?.uid || "UNKNOWN");
      console.log("Twin Profile Extracted:", result);
      
      setComplete(true);
      setProcessing(false);
      
    } catch (error) {
      console.error(error);
      setTimeout(() => {
        setComplete(true);
        setProcessing(false);
      }, 2000);
    }
  };

  if (complete) {
    return (
      <div className="spine-page flex items-center justify-center min-h-[70vh]">
        <div className="card p-8 max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Profile Generated</h2>
            <p className="text-inos-muted text-sm leading-relaxed">
              FULCRUM has staged a candidate intake packet from the compatibility dialogue flow. No canon fields were promoted.
            </p>
          </div>
          <button 
            onClick={() => navigate("/provisioning")} 
            className="btn-primary w-full"
          >
            Enter My Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="spine-page h-[calc(100vh-64px)] flex flex-col overflow-hidden pb-4">
      <div className="card p-4 shrink-0 flex items-center justify-between bg-slate-900/50 backdrop-blur-md border-b border-inos-border/50 rounded-none rounded-t-xl mb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-inos-muted flex items-center gap-2">
            <Rocket className="w-3 h-3 text-inos-accent" />
            FULCRUM Compatibility Sprints
          </div>
          <div className="text-lg font-bold text-white mt-1">
            {SPRINT_MODULES[currentModule].title}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {SPRINT_MODULES.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${
                idx < currentModule ? "bg-emerald-500" :
                idx === currentModule ? "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" :
                "bg-slate-700"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-6 scrollbar-hide">
        {dialogue.map((turn, idx) => (
          <div 
            key={idx} 
            className={`flex ${turn.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300`}
          >
            <div 
              className={`max-w-[80%] rounded-2xl px-5 py-4 ${
                turn.role === 'user' 
                  ? 'bg-blue-600/20 border border-blue-500/30 text-blue-50 rounded-br-sm' 
                  : 'bg-slate-800/60 border border-slate-700 text-slate-200 rounded-bl-sm'
              }`}
            >
              <p className="text-sm leading-relaxed">{turn.text}</p>
            </div>
          </div>
        ))}
        
        {processing && (
          <div className="flex justify-start">
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl rounded-bl-sm px-5 py-4 flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-inos-accent animate-spin" />
              <span className="text-sm text-inos-muted">Staging FULCRUM candidate...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="shrink-0 pt-4 px-4">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your response..."
            disabled={processing}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-4 pr-12 py-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all disabled:opacity-50"
            autoFocus
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || processing}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white disabled:opacity-50 disabled:hover:bg-blue-500/10 disabled:hover:text-blue-400 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-center mt-2 text-[10px] text-slate-500">
          Press Enter to submit. Be concise and definitive.
        </div>
      </div>
    </div>
  );
}
