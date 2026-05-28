import { useEffect, useState } from "react";
import { mockGuilds } from "../data/mock/guilds";

const STORAGE_KEY = "inos_guild_membership_v1";

export default function Guilds() {
  const [joined, setJoined] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setJoined(JSON.parse(stored));
      } catch {
        setJoined([]);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(joined));
  }, [joined]);

  const toggleJoin = (guildId: string) => {
    setJoined((prev) =>
      prev.includes(guildId)
        ? prev.filter((id) => id !== guildId)
        : [...prev, guildId]
    );
  };

  return (
    <div className="spine-page">
      <div className="card p-4">
        <div className="text-xs uppercase tracking-[0.2em] text-inos-muted">
          Guild Directory
        </div>
        <div className="guilds-grid">
          {mockGuilds.map((guild) => {
            const isJoined = joined.includes(guild.id);
            return (
              <div key={guild.id} className="inos-card p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{guild.name}</div>
                    <div className="text-[11px] text-inos-muted">
                      {guild.category} - {guild.status}
                    </div>
                  </div>
                  <button
                    className="btn-secondary"
                    type="button"
                    onClick={() => toggleJoin(guild.id)}
                  >
                    {isJoined ? "Leave" : "Join"}
                  </button>
                </div>
                <div className="text-[11px] text-inos-muted mt-2">
                  {guild.description}
                </div>
                <div className="text-[10px] text-inos-muted mt-2">
                  Join rule: {guild.joinRule}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
