import { useState } from "react";
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { saveOperatorProfile } from "../services/operatorProfile";
import { 
  Layout, Terminal, Database, Globe, Settings, ChevronRight, ArrowLeft,
  Activity, CheckCircle2, Zap, Target, Wallet, Clock, AlertCircle, Bot, ListTree
} from "lucide-react";

// --- DND BUILDER COMPONENTS ---
function DraggableWidget({ id, label, icon: Icon }: { id: string, label: string, icon: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-4 bg-[#0a0a0e] border border-[#1a1a24] rounded-xl flex items-center gap-3 cursor-grab active:cursor-grabbing hover:border-purple-500/50 transition-colors ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="p-2 bg-purple-500/10 rounded text-purple-400">
        <Icon size={16} />
      </div>
      <span className="text-xs font-bold text-white uppercase tracking-wider">{label}</span>
    </div>
  );
}

function DroppableZone({ id, children, active }: { id: string, children?: React.ReactNode, active?: boolean }) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] border-2 border-dashed rounded-2xl flex items-center justify-center transition-all ${
        active ? 'border-purple-500 bg-purple-500/5' : 'border-[#1a1a24] bg-transparent'
      }`}
    >
      {children || <span className="text-[10px] font-mono text-[#333] uppercase">Drop Module Here</span>}
    </div>
  );
}

const WIDGET_TYPES = [
  { id: 'missions', label: 'Missions', icon: Target },
  { id: 'timeline', label: 'Global Feed', icon: Activity },
  { id: 'wallet', label: 'Time Wallet', icon: Wallet },
  { id: 'stats', label: 'Operator Stats', icon: Zap },
  { id: 'pole', label: 'POLE Entry', icon: Clock },
  { id: 'alerts', label: 'System Alerts', icon: AlertCircle },
  { id: 'trains', label: 'Active Trains', icon: ListTree },
  { id: 'agent', label: 'Agent Comms', icon: Bot },
];

const UnifiedPreview = (_props: any) => (
  <div className="w-full h-[400px] bg-[#0a0b14] rounded-2xl border border-blue-900/50 overflow-hidden flex shadow-2xl relative animate-in fade-in zoom-in duration-500">
    <div className="w-48 bg-[#050508] border-r border-[#1a1a24] p-4 flex flex-col gap-2">
      <div className="w-full h-8 bg-blue-900/20 rounded mb-4" />
      {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-6 bg-white/5 rounded" />)}
    </div>
    <div className="flex-1 flex flex-col">
      <div className="h-12 border-b border-[#1a1a24] flex items-center justify-between px-4">
        <div className="w-48 h-6 bg-white/5 rounded-full" />
        <div className="flex gap-2">
          <div className="w-6 h-6 bg-white/5 rounded-full" />
          <div className="w-6 h-6 bg-white/5 rounded-full" />
        </div>
      </div>
      <div className="flex-1 p-6 grid grid-cols-2 gap-4">
        <div className="bg-[#050508] rounded-xl border border-[#1a1a24] p-4" />
        <div className="bg-[#050508] rounded-xl border border-[#1a1a24] p-4" />
      </div>
    </div>
  </div>
);

const ControlTowerPreview = (_props: any) => (
  <div className="w-full h-[400px] bg-[#000000] rounded-2xl border border-red-900/50 overflow-hidden flex flex-col p-4 gap-4 shadow-2xl relative animate-in fade-in zoom-in duration-500 font-mono">
    <div className="flex justify-between items-center px-2">
      <div className="text-red-500 text-xs tracking-widest">COMMAND CENTER</div>
      <div className="flex gap-2">
        <div className="w-16 h-4 bg-red-900/20" />
        <div className="w-16 h-4 bg-red-900/20" />
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 h-24">
      {[1, 2, 3].map(i => <div key={i} className="bg-[#0a0a0a] border border-[#222] rounded flex items-center justify-center text-[#333] text-xs">SYS_DATA</div>)}
    </div>
    <div className="flex-1 bg-[#0a0a0a] border border-[#222] rounded p-4 flex flex-col gap-2">
      {[1, 2, 3, 4].map(i => <div key={i} className="w-full h-4 bg-white/5" />)}
    </div>
  </div>
);

const NotionMasterPreview = (_props: any) => (
  <div className="w-full h-[400px] bg-[#f7f7f5] rounded-2xl border border-slate-200 overflow-hidden flex flex-col p-8 shadow-2xl relative animate-in fade-in zoom-in duration-500">
    <div className="w-12 h-12 bg-slate-200 mb-6 rounded" />
    <div className="w-1/2 h-8 bg-slate-200 rounded mb-8" />
    <div className="space-y-4">
      <div className="w-full h-12 bg-white border border-slate-200 rounded shadow-sm" />
      <div className="w-full h-12 bg-white border border-slate-200 rounded shadow-sm" />
      <div className="w-full h-12 bg-white border border-slate-200 rounded shadow-sm" />
    </div>
  </div>
);

const IntranetPrimePreview = (_props: any) => (
  <div className="w-full h-[400px] bg-[#020205] rounded-2xl border border-[#c9a227]/30 overflow-hidden flex flex-col items-center justify-center p-8 shadow-2xl relative animate-in fade-in zoom-in duration-500">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,162,39,0.1)_0%,transparent_60%)]" />
    <div className="w-16 h-16 rounded-full border border-[#c9a227] mb-6 flex items-center justify-center relative z-10 bg-black">
      <div className="w-8 h-8 rounded-full bg-[#c9a227]" />
    </div>
    <div className="w-48 h-6 bg-[#111] border border-[#222] mb-8 relative z-10" />
    <div className="grid grid-cols-3 gap-4 w-full relative z-10">
      <div className="h-24 bg-[#0a0a0e] border border-[#1a1a24] rounded-xl" />
      <div className="h-24 bg-[#0a0a0e] border border-[#1a1a24] rounded-xl" />
      <div className="h-24 bg-[#0a0a0e] border border-[#1a1a24] rounded-xl" />
    </div>
  </div>
);

const CustomBuilderPreview = ({ customItems, setCustomItems }: any) => {
  const handleDragEnd = (event: any) => {
    const { over, active } = event;
    if (over && over.id) {
      setCustomItems((prev: any) => ({
        ...prev,
        [over.id]: active.id
      }));
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="w-full min-h-[500px] bg-[#0d0d12] rounded-2xl border border-purple-500/30 p-6 shadow-2xl relative animate-in fade-in zoom-in duration-500 flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
          <div>
            <div className="text-purple-400 text-[10px] font-mono uppercase tracking-[0.2em] mb-1">Sandbox Active</div>
            <h4 className="text-sm font-bold text-white">Drag system modules into the workspace</h4>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 max-w-[400px] scrollbar-hide">
            {WIDGET_TYPES.filter(w => !Object.values(customItems).includes(w.id)).map(w => (
              <DraggableWidget key={w.id} {...w} />
            ))}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-12 gap-4">
          <div className="col-span-3 flex flex-col gap-4">
            <DroppableZone id="sidebar_top" active={!customItems.sidebar_top}>
              {customItems.sidebar_top && <PlacedWidget id={customItems.sidebar_top} />}
            </DroppableZone>
            <DroppableZone id="sidebar_bottom" active={!customItems.sidebar_bottom}>
              {customItems.sidebar_bottom && <PlacedWidget id={customItems.sidebar_bottom} />}
            </DroppableZone>
          </div>

          <div className="col-span-9 flex flex-col gap-4">
            <div className="h-24">
              <DroppableZone id="main_top" active={!customItems.main_top}>
                {customItems.main_top && <PlacedWidget id={customItems.main_top} />}
              </DroppableZone>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <DroppableZone id="main_left" active={!customItems.main_left}>
                {customItems.main_left && <PlacedWidget id={customItems.main_left} />}
              </DroppableZone>
              <DroppableZone id="main_right" active={!customItems.main_right}>
                {customItems.main_right && <PlacedWidget id={customItems.main_right} />}
              </DroppableZone>
            </div>
            <div className="h-20">
              <DroppableZone id="footer" active={!customItems.footer}>
                {customItems.footer && <PlacedWidget id={customItems.footer} />}
              </DroppableZone>
            </div>
          </div>
        </div>
      </div>
    </DndContext>
  );
};

function PlacedWidget({ id }: { id: string }) {
  const widget = WIDGET_TYPES.find(w => w.id === id);
  if (!widget) return null;
  const Icon = widget.icon;
  return (
    <div className="w-full h-full p-4 bg-[#050508] border border-purple-500/30 rounded-xl flex flex-col animate-in zoom-in duration-300">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={14} className="text-purple-400" />
        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{widget.label}</span>
      </div>
      <div className="flex-1 space-y-2 opacity-50">
        <div className="w-full h-2 bg-white/10 rounded" />
        <div className="w-2/3 h-2 bg-white/10 rounded" />
      </div>
    </div>
  );
}

const LAYOUTS = [
  { id: "unified", name: "Unified OS", icon: Layout, Preview: UnifiedPreview, features: ["Integrated Sidebars", "Global Command Bar", "Standard PARA Sync"] },
  { id: "control", name: "Control Tower", icon: Terminal, Preview: ControlTowerPreview, features: ["Live Stats Grid", "High-Density Mission List", "Dark Command Aura"] },
  { id: "notion", name: "Notion Master", icon: Database, Preview: NotionMasterPreview, features: ["Embedded Notion Views", "Clean White Aesthetic", "Doc-Centric Layout"] },
  { id: "intranet", name: "Intranet Prime", icon: Globe, Preview: IntranetPrimePreview, features: ["Space Visuals", "Gold Branding", "Holding Co Feed First"] },
  { id: "custom", name: "Build Your Own", icon: Settings, Preview: CustomBuilderPreview, features: ["Full Layout Freedom", "Component Picker", "Dev-Mode Enabled"] }
];

export default function SystemProvisioning() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const location = useLocation();
  const isEditMode = location.search.includes("mode=edit");
  
  const [selectedLayout, setSelectedLayout] = useState("unified");
  const [isDeploying, setIsDeploying] = useState(false);
  const [customItems, setCustomItems] = useState<Record<string, string | null>>({
    sidebar_top: null, sidebar_bottom: null, main_top: null, main_left: null, main_right: null, footer: null,
  });

  const ActivePreview = LAYOUTS.find(l => l.id === selectedLayout)?.Preview || UnifiedPreview;
  const currentLayout = LAYOUTS.find(l => l.id === selectedLayout) || LAYOUTS[0];

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await saveOperatorProfile({
        email: user?.email || undefined,
        selectedLayout: selectedLayout,
        onboardingComplete: true,
        custom_grid: selectedLayout === "custom" ? customItems : null
      });
      setTimeout(() => { navigate("/room/me"); }, 1500);
    } catch (err) {
      console.error("[Provisioning] Deployment failed:", err);
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020204] font-['Syne'] text-white flex flex-col">
      <header className="h-16 border-b border-[#1a1a24] flex items-center justify-between px-8 bg-[#050508]/80 backdrop-blur-md z-20">
        <div className="text-xs font-mono tracking-[0.3em] text-[#00f0ff] uppercase">INOS Infrastructure Initialization</div>
        <button onClick={() => navigate("/front-door")} className="text-xs text-[#555] hover:text-white transition-colors flex items-center gap-2">
          <ArrowLeft size={14} /> Back to Front Door
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 bg-[#050508] border-r border-[#1a1a24] p-6 flex flex-col z-10 overflow-y-auto">
          <h2 className="text-xl font-bold mb-8 tracking-tight">Select Framework</h2>
          <div className="flex flex-col gap-3">
            {LAYOUTS.map((layout) => {
              const Icon = layout.icon;
              const isSelected = selectedLayout === layout.id;
              return (
                <button key={layout.id} onClick={() => setSelectedLayout(layout.id)} className={`flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${isSelected ? "border-[#00f0ff] bg-[#00f0ff]/5" : "border-[#1a1a24] hover:bg-white/5"}`}>
                  <Icon size={20} className={isSelected ? "text-[#00f0ff]" : "text-[#777]"} />
                  <span className={`font-bold ${isSelected ? "text-white" : "text-[#777]"}`}>{layout.name}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-8 space-y-4">
            <h4 className="text-[10px] font-mono tracking-widest text-[#555] uppercase">Specifications</h4>
            {currentLayout.features.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-[#777]">
                <CheckCircle2 size={12} className="text-[#00f0ff]" /> {f}
              </div>
            ))}
          </div>
          <div className="mt-auto pt-8">
            <button onClick={handleDeploy} disabled={isDeploying} className="w-full py-4 bg-[#00f0ff] text-black font-black uppercase tracking-widest text-xs rounded-xl hover:bg-[#00d8e6] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-wait">
              {isDeploying ? <><Activity className="animate-spin" size={16} /> Deploying...</> : <>{isEditMode ? "Apply Changes" : "Deploy Configuration"} <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-br from-[#020204] to-[#0a0a0e] relative flex items-center justify-center p-12">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          <div className="w-full max-w-4xl relative z-10">
            <div className="mb-6 flex justify-between items-end">
              <div><h3 className="text-2xl font-bold mb-2">Live Preview Sandbox</h3><p className="text-sm text-[#777]">Visualizing the {currentLayout.name} architecture.</p></div>
            </div>
            <div className="shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl ring-1 ring-white/10 overflow-hidden">
               <ActivePreview customItems={customItems} setCustomItems={setCustomItems} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
