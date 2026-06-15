import { NODE_API_BASE } from "../api";

const LOCAL_PROFILE_KEY = "inos_operator_profile_v1";

export type OperatorProfile = {
  email?: string;
  selectedLayout: string;
  onboardingComplete?: boolean;
  custom_grid?: Record<string, string | null> | null;
};

function readLocalProfile(): OperatorProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as OperatorProfile;
  } catch {
    return null;
  }
}

function writeLocalProfile(profile: OperatorProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profile));
}

export async function fetchOperatorProfile(email?: string | null) {
  const localProfile = readLocalProfile();

  if (!email) {
    return localProfile || {
      status: "not_found",
      selectedLayout: "unified",
      custom_grid: null,
    };
  }

  try {
    const response = await fetch(`${NODE_API_BASE}/profile/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`Profile fetch failed with status ${response.status}`);
    }

    const profile = await response.json();
    if (profile?.status !== "not_found" && profile?.selectedLayout) {
      writeLocalProfile(profile);
    }
    return profile;
  } catch {
    return localProfile || {
      status: "not_found",
      selectedLayout: "unified",
      custom_grid: null,
    };
  }
}

export async function saveOperatorProfile(profile: OperatorProfile) {
  writeLocalProfile(profile);

  if (!profile.email) {
    return { status: "local_only" };
  }

  try {
    const response = await fetch(`${NODE_API_BASE}/profile/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });

    if (!response.ok) {
      throw new Error(`Profile save failed with status ${response.status}`);
    }

    return await response.json();
  } catch {
    return { status: "local_fallback" };
  }
}
