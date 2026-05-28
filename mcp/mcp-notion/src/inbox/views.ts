export type InboxViewSpec = {
  name: string;
  filter_code: { property: string; equals: string };
  filter_label: { property: string; equals: string };
};

export const INBOX_VIEWS_SPEC: InboxViewSpec[] = [
  {
    name: "INBOX – Captured",
    filter_code: { property: "routing_status_code", equals: "new" },
    filter_label: { property: "Routing Status", equals: "New" },
  },
  {
    name: "INBOX – Triaged",
    filter_code: { property: "routing_status_code", equals: "triaged" },
    filter_label: { property: "Routing Status", equals: "Triaged" },
  },
  {
    name: "INBOX – Routed",
    filter_code: { property: "routing_status_code", equals: "routed" },
    filter_label: { property: "Routing Status", equals: "Routed" },
  },
  {
    name: "INBOX – Blocked",
    filter_code: { property: "routing_status_code", equals: "blocked" },
    filter_label: { property: "Routing Status", equals: "Blocked" },
  },
  {
    name: "INBOX – Duplicate",
    filter_code: { property: "routing_status_code", equals: "duplicate" },
    filter_label: { property: "Routing Status", equals: "Duplicate" },
  },
  {
    name: "INBOX – Archived",
    filter_code: { property: "routing_status_code", equals: "archived" },
    filter_label: { property: "Routing Status", equals: "Archived" },
  },
];
