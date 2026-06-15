export const ENTITY_OPTIONS = ["Global", "IE", "FFC", "CNGI", "GGP"] as const;

export const ROOM_OPTIONS = [
  "Control Tower",
  "My Room",
  "Ops & Training",
  "Governance Room",
  "Command Center",
] as const;

export const ENTITY_STORAGE_KEY = "inos_entity_context_v1";
export const ROOM_STORAGE_KEY = "inos_room_context_v1";

export type ShellEntity = (typeof ENTITY_OPTIONS)[number];
export type ShellRoom = (typeof ROOM_OPTIONS)[number];

export function readStoredShellContext() {
  if (typeof window === "undefined") {
    return {
      entity: ENTITY_OPTIONS[0] as ShellEntity,
      room: ROOM_OPTIONS[0] as ShellRoom,
    };
  }

  const storedEntity = window.localStorage.getItem(ENTITY_STORAGE_KEY) as ShellEntity | null;
  const storedRoom = window.localStorage.getItem(ROOM_STORAGE_KEY) as ShellRoom | null;

  return {
    entity: storedEntity && ENTITY_OPTIONS.includes(storedEntity) ? storedEntity : ENTITY_OPTIONS[0],
    room: storedRoom && ROOM_OPTIONS.includes(storedRoom) ? storedRoom : ROOM_OPTIONS[0],
  };
}

export function persistShellContext(entity: ShellEntity, room: ShellRoom) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ENTITY_STORAGE_KEY, entity);
  window.localStorage.setItem(ROOM_STORAGE_KEY, room);
  window.dispatchEvent(new CustomEvent("inos-context-change", { detail: { entity, room } }));
}
