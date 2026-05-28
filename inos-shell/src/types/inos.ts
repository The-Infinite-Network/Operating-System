export type POLE = {
  id: string;
  timestamp_start: string;
  duration_minutes: number;
  time_mode: string;
  title: string;
  entity_context: string;
  verification_status: string;
};

export type Mission = {
  id: string;
  title: string;
  status: string;
  priority: string;
  entity: string;
};

export type TimelineEntry = {
  id: string;
  occurred_at: string;
  type: string;
  title: string;
  entity: string;
  mission?: string;
};

export type Guild = {
  id: string;
  name: string;
  category: string;
  status: string;
  description: string;
  joinRule: string;
};
