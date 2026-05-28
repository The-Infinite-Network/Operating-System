export type ReviewEntity = "IE" | "FFC" | "CNGI" | "GGP" | "INOS";

export type ReviewSession = {
  name: string;
  email: string;
  entity: ReviewEntity;
  access: "tester" | "operator" | "owner";
  grantedAt: string;
};

export const REVIEW_SESSION_KEY = "inos_review_session_v1";

const ACCESS_CODES: Record<string, { entity: ReviewEntity; access: ReviewSession["access"] }> = {
  "INOS-REVIEW-2026": { entity: "INOS", access: "tester" },
  "IE-REVIEW-2026": { entity: "IE", access: "tester" },
  "FFC-REVIEW-2026": { entity: "FFC", access: "tester" },
  "CNGI-REVIEW-2026": { entity: "CNGI", access: "tester" },
  "GGP-REVIEW-2026": { entity: "GGP", access: "tester" },
  "INOS-OWNER-2026": { entity: "INOS", access: "owner" },
};

export function getReviewSession(): ReviewSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(REVIEW_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReviewSession;
  } catch {
    window.localStorage.removeItem(REVIEW_SESSION_KEY);
    return null;
  }
}

export function setReviewSession(session: ReviewSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REVIEW_SESSION_KEY, JSON.stringify(session));
}

export function clearReviewSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(REVIEW_SESSION_KEY);
}

export function validateReviewCode(code: string, requestedEntity: ReviewEntity) {
  const normalized = code.trim().toUpperCase();
  const grant = ACCESS_CODES[normalized];
  if (!grant) return { ok: false as const, error: "That access code is not recognized." };
  if (grant.entity !== "INOS" && grant.entity !== requestedEntity) {
    return { ok: false as const, error: `That code is not valid for ${requestedEntity}.` };
  }
  return { ok: true as const, grant };
}

export function canAccessEntity(session: ReviewSession | null, entity: ReviewEntity) {
  if (!session) return false;
  return session.entity === "INOS" || session.entity === entity;
}
