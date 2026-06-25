# Customer Support

Frontline support agent: triage Slack threads, search the Notion KB, draft replies, and escalate when policy requires a human.

## Try It

```bash
recipes install github:introspection-recipes/customer-support
pi --recipe customer-support
```

For local development:

```bash
recipes doctor .
recipes install .
pi --recipe customer-support
```

## What It Includes

- `agent`: support lead.
- `triage`: intent, urgency, and policy classifier.
- `responder`: KB-grounded reply drafter.
- `escalation`: human handoff and risk checker.
- `ticket-triage`: support workflow skill.

## Configuration

The recipe ships real Slack and Notion extension tools. Set:

```bash
export SLACK_BOT_TOKEN=...
export NOTION_TOKEN=...
```

The Slack token needs channel history and message posting permissions. The Notion integration must be shared with the KB pages or databases the agent should search.
