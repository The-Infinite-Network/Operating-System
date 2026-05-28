export type MissionStatus = "Planning" | "Active" | "Blocked" | "Complete";
export type TaskStatus = "Backlog" | "Next" | "Doing" | "Blocked" | "Done";

export type Mission = {
  id: string;
  title: string;
  status: string;
  priority?: string | null;
  entityId?: string | null;
  owner?: string | null;
  tags?: string[];
  acceptanceTests?: string[];
  updatedAt?: string;
};

export type Task = {
  id: string;
  title: string;
  status: string | null;
  priority?: string | number | null;
  missionId?: string | null;
  entityId?: string | null;
  owner?: string | null;
  tags?: string[];
  dueDate?: string | null;
  updatedAt?: string;
};

export type Run = {
  id: string;
  missionId?: string;
  taskId?: string;
  runType?: string;
  startedAt?: string;
  endedAt?: string;
  notes?: string;
  links?: string[];
};

export type TimelineEvent = {
  id: string;
  timestamp?: string | null;
  source?: string | null;
  type?: string | null;
  text?: string | null;
  refs?: {
    missionId?: string;
    taskId?: string;
    runId?: string;
    entityId?: string;
  };
};
