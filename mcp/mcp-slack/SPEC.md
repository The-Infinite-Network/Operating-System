# MCP Slack Bridge Specification

**Status:** candidate  
**Owner:** Operating-System  
**Canon owner:** TEAM-AI for doctrine, Operating-System for runtime implementation

## Objective

Provide a controlled Slack adapter for TEAM AI workflows so Slack posting, reading, and audit behavior no longer depend on ad hoc connector assumptions.

## Scope

This bridge is for:

- reading allowlisted Slack channels
- posting approved TEAM AI packets
- logging every write attempt and outcome
- enforcing deny-by-default routing

This bridge is not for:

- arbitrary workspace-wide posting
- message deletion by default
- free-form channel targeting
- silent canonical updates

## Lane Split

### TEAM-AI owns

- channel doctrine
- handoff packet formats
- approval policy
- agent-to-channel routing rules
- message type taxonomy

### Operating-System owns

- runtime service or MCP implementation
- credentials loading
- launch surface
- API calls to Slack
- durable audit emission
- error handling and retry logic

## Required Capabilities

1. `slack.channels.list_allowlisted`
2. `slack.messages.read`
3. `slack.messages.draft`
4. `slack.messages.send`
5. `slack.messages.send_with_approval`
6. `slack.messages.audit_log`
7. `slack.messages.thread_read`

## Permission Model

### Read-only

- read channel metadata
- read messages in allowlisted channels
- read threads in allowlisted channels

### Draft-only

- render Slack-ready payloads without sending

### Send-with-approval

- handoff
- alert
- status
- mission result
- approval request

### Deny by default

- delete
- edit
- arbitrary direct message send
- arbitrary private-channel writes
- non-allowlisted target writes

## Initial Channel Allowlist

These should be explicit config values, not ad hoc payload fields:

- `#teamai-war`
- `#twin-command`
- `#ffc-fulcrum-system`
- `#war-room`
- `#build-qa`
- `#ark-seal-queue`
- `#law-gate`

Optional only after verification:

- `#teamai-twin`
- `#chatgpt-twin-runs`
- `#twin-daily-journal`

## Message Types

Allowed message payload types:

1. `handoff`
2. `alert`
3. `status`
4. `mission_result`
5. `approval_request`

Every outbound message must include:

- `sync_key`
- `message_type`
- `actor`
- `approval_state`
- `source_confidence`
- `source_of_truth_boundary`

## Suggested Payload Schema

```json
{
  "sync_key": "LDRP-vX.Y-YYYYMMDD-TAG",
  "message_type": "handoff",
  "actor": "WAR",
  "target_channel": "#teamai-war",
  "thread_id": null,
  "approval_state": "approved|draft|auto_allowed|blocked",
  "source_confidence": "high|medium|low",
  "body_markdown": "...",
  "source_of_truth_boundary": "Slack coordination only. Canonical update requires approved writeback.",
  "idempotency_key": "..."
}
```

## Audit Log Contract

Minimum audit fields:

- timestamp
- sync_key
- idempotency_key
- actor
- runtime surface
- target channel
- message type
- approval state
- action attempted
- result
- Slack message id if sent
- error text if failed

## Audit Destination

At minimum one durable local record is required.

Acceptable first version:

- append-only local JSONL under Operating-System runtime logs

Preferred later:

- write-through to Notion / Timeline candidate log via approved adapter path

## Retry and Idempotency

### Retry

- one automatic retry only
- 30-second delay
- no infinite retry loop

### Idempotency

- every send attempt must carry a stable `idempotency_key`
- duplicate send attempts with the same key must not post twice

## Approval Model

### Auto-allowed candidates

- status
- draft handoff
- non-destructive alerts

### Approval required

- mission results framed as final
- approval requests to governance lanes
- any cross-lane operational instruction that could be mistaken for canon movement

## Runtime Home Decision

Recommended shape:

- `Operating-System/mcp/mcp-slack/`
- MCP server or local service adapter with explicit config and logs

Not recommended:

- burying live relay code inside TEAM-AI pack canon
- mixing runtime code into pack zip artifacts

## Acceptance Criteria

- channel allowlist enforced
- no delete/edit by default
- every send audited
- duplicate-send prevention present
- source-of-truth boundary attached to outbound packets
- approval model enforced
- dry-run mode available

## Next Build Step

Implement a minimal read + draft + send + audit version against the allowlist above before adding broader channel or DM support.
