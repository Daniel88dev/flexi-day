---
id: ai-connection-limits
title: Limits on AI connections
summary: The daily AI connection limit, the member daily limit and the limits for each app, and what an AI app hears when it reaches one.
module: assistant-and-mcp
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: []
tools: []
keywords:
  [
    daily ai connection limit,
    member daily limit,
    limit reached,
    too many calls,
    reset,
    midnight utc,
    ai connections,
    mcp,
    calls a day,
  ]
related: [ai-connections, ai-usage]
goldenQuestions:
  - question: My AI app says Flexi Day's daily limit is reached. When can it call again?
    expectedArticles: [ai-connection-limits]
    mustMention: [midnight UTC]
  - question: How many calls a day can our organization's AI apps make?
    expectedArticles: [ai-connection-limits]
    mustMention: ["5,000 on Pro", "20,000 on Enterprise and Custom", "1,000 per person"]
---

AI connections have limits, so that one app or one person can't use up what the whole organization
shares. Only the app's tool calls count. Connecting, listing what the app can do and checking the
connection don't.

## Daily limits

- **Daily AI connection limit**: the calls all of an organization's AI connections may make in one
  day, together. 5,000 on Pro, 20,000 on Enterprise and Custom.
- **Member daily limit**: 1,000 per person in each organization, so one app stuck in a loop can't
  use the whole organization's day.

Both reset at midnight UTC. The owner sees both numbers when turning AI connections on in the AI
card on the {{ui:nav.organization}} page.

## Limits for each app

Each app a person connected may make 300 tool calls in 5 minutes and 30 changes an hour. A change
is creating or cancelling a request, or clocking in or out; each can send emails, which is why
changes have a lower limit. A person's second app has limits of its own.

## When a limit is reached

The app gets a message in your app language saying which limit it reached and when it resets, so
it can tell you. Until then its calls are refused. Flexi Day itself keeps working, and so do your
other apps, unless the organization reached its daily AI connection limit, which every app there
shares. Nobody gets an email or a notification.
