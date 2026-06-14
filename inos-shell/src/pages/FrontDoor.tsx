import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TimelineStream, POLEEntry } from "../components";
import { TwinProfileIntake } from "../components/TwinProfileIntake";
import { api } from "../api";
import { TimelineEvent } from "../types";
import { Rocket, Building2, Heart, ShieldCheck, Globe, Fingerprint, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

export default function FrontDoor() {
  const navigate = useNavigate();
  const { user, login, logout, loading } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [showTwinIntake, setShowTwinIntake] = useState(false);
  const [POLELoading, setPOLELoading] = useState(false);

  useEffect(() => {
    loadTimeline();
  }, []);

  const loadTimeline = async () => {
    setLoadingTimeline(true);
    try {
      const { events: data } = await api.timeline.queryByMission("global", 10);   
      setEvents(data);
    } catch (err) {
      console.error("Failed to load global timeline", err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleIntakeSubmit = async (data: any) => {
    setPOLELoading(true);
    try {
      await api.timeline.logV1({
        event_type: "POLE",
        summary: data.summary,
        entity: data.entity || "GLOBAL",
        sync_key: `INTAKE-${Date.now()}`
      });
      loadTimeline();
    } catch (err) {
      console.error(err);
    } finally {
      setPOLELoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <div className="spine-page space-y-8 pb-12">
      {/* Hero / Greeting */}
      <section className="card overflow-hidden border border-inos-border/40 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.1),transparent_40%)]">
        <div className="px-8 py-10 md:py-16 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-3xl shadow-2xl shadow-orange-500/40">
              8
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Welcome to the Infinite Network
            </h1>
            <p className="text-inos-muted text-lg max-w-2xl mx-auto">
              {user 
                ? `Identity Confirmed: ${user.displayName || user.email}` 
                : "This is your primary entry point. Register your identity, define your agency, and anchor your ventures to the Epoch 0 foundation."
              }
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
                        {!user ? (
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-white text-slate-950 font-bold rounded-2xl hover:scale-105 transition-all shadow-xl"
              >
                <LogIn className="w-5 h-5" />
                Sign in with Google
              </button>
            ) : (
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => navigate("/provisioning")}
                  className="flex items-center gap-2 px-8 py-3 bg-[#00f0ff] text-black font-black rounded-2xl hover:bg-[#00d8e6] transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)]"
                >
                  <Rocket className="w-5 h-5" />
                  Initialize Environment
                </button>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-2 px-8 py-3 bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded-2xl hover:bg-red-500/20 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Sign Out
                </button>
              </div>
            )}
            
            <button
              onClick={() => navigate("/room/me")}
              className="px-8 py-3 bg-[#0f172a] text-white border border-inos-border rounded-2xl hover:bg-[#1e293b] transition-all font-bold"
            >
              Access My Room
            </button>
          </div>
          
          {user && (
            <div className="flex justify-center">
               <button
                onClick={() => setShowTwinIntake(true)}
                className="text-inos-accent hover:underline text-sm font-medium"
              >
                Start FULCRUM Intake
              </button>
            </div>
          )}
        </div>
      </section>

      {showTwinIntake ? (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Fingerprint className="text-inos-accent" />
              Agent Intake
            </h2>
            <button onClick={() => setShowTwinIntake(false)} className="text-xs text-inos-muted hover:text-white underline">
              Close Intake
            </button>
          </div>
          <div className="card p-0 overflow-hidden">
            <TwinProfileIntake />
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">       
          {/* Left Column: Actions & Intake Modules */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* FULCRUM Agent Module */}
              <div
                onClick={() => setShowTwinIntake(true)}
                className="card p-6 border-inos-accent/20 hover:border-inos-accent/50 cursor-pointer group transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-inos-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Fingerprint className="text-inos-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Open FULCRUM</h3>
                <p className="text-xs text-inos-muted leading-relaxed">
                  Start candidate-only Fulcrum intake, coordinate diagnosis,
                  and methodology routing.
                </p>
              </div>

              {/* Register Business Module */}
              <div
                className="card p-6 border-blue-500/20 hover:border-blue-500/50 cursor-pointer group transition-all"
                onClick={() => navigate("/foundation")}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Register Business</h3> 
                <p className="text-xs text-inos-muted leading-relaxed">
                  Anchor your company, venture, or project to the network registry.
                  Assign roles and secure your entity code.
                </p>
              </div>

              {/* Discover Guilds / Hobbies Module */}
              <div
                className="card p-6 border-emerald-500/20 hover:border-emerald-500/50 cursor-pointer group transition-all"
                onClick={() => navigate("/guilds")}
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Discover Guilds</h3>
                <p className="text-xs text-inos-muted leading-relaxed">
                  Log your hobbies and areas of mastery to find aligned guilds    
                  and standards bodies in the network.
                </p>
              </div>

              {/* Security / Review Access */}
              <div
                className="card p-6 border-purple-500/20 hover:border-purple-500/50 cursor-pointer group transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Review Access</h3>
                <p className="text-xs text-inos-muted leading-relaxed">
                  Enter an access code to unlock privileged intranet surfaces     
                  and restricted holding company data.
                </p>
              </div>
            </div>

            {/* Quick Intake Form (POLE Capture) */}
            <div className="card p-6 bg-slate-900/40 border-white/5">
              <div className="flex items-center gap-2 mb-6">
                <Rocket className="w-5 h-5 text-inos-accent" />
                <h3 className="text-lg font-bold uppercase tracking-widest">Immediate Intake</h3>
              </div>
              <POLEEntry onPOLESubmit={handleIntakeSubmit} isLoading={POLELoading} />
            </div>
          </div>

          {/* Right Column: Global Timeline */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-inos-muted flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Global Timeline
              </h2>
              <Link to="/logs" className="text-[10px] text-inos-accent hover:underline uppercase font-bold">
                View All Events
              </Link>
            </div>
            <div className="card p-4 min-h-[500px]">
              <TimelineStream events={events} isLoading={loadingTimeline} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

