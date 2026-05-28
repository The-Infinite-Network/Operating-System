import { z } from "zod";

// Mission status options (locked list)
export const MISSION_STATUS = [
  "Proposed",
  "Planning",
  "In Flight",
  "Blocked",
  "Done",
  "Parked",
] as const;
export type MissionStatus = (typeof MISSION_STATUS)[number];
export const MISSION_STATUS_SCHEMA = z.enum(
  MISSION_STATUS as unknown as [string, ...string[]]
);

// Build status options (locked list)
export const BUILD_STATUS = [
  "Spec",
  "In Build",
  "QA",
  "Parked",
  "Shipped",
] as const;
export type BuildStatus = (typeof BUILD_STATUS)[number];
export const BUILD_STATUS_SCHEMA = z.enum(
  BUILD_STATUS as unknown as [string, ...string[]]
);

// Utility: small helper to return lists for docs
export const getMissionStatusOptions = () => MISSION_STATUS.slice();
export const getBuildStatusOptions = () => BUILD_STATUS.slice();

export default {
  MISSION_STATUS,
  BUILD_STATUS,
  MISSION_STATUS_SCHEMA,
  BUILD_STATUS_SCHEMA,
};
