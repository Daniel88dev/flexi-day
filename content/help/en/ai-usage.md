---
id: ai-usage
title: The AI usage page
summary: What owners and org admins see on the AI usage page, from the Assistant's spend to each person's AI apps, and how to revoke an app.
module: assistant-and-mcp
roles: [org-admin, owner]
routes: [/ai-usage]
tools: []
keywords:
  [
    ai usage,
    usage page,
    weekly limit,
    spend,
    refused,
    calls today,
    revoke,
    connected apps,
    past weeks,
    deleted account,
  ]
related: [assistant-weekly-limit, ai-connection-limits, ai-connections]
goldenQuestions:
  - question: How much of our Assistant limit have we used this week?
    expectedArticles: [ai-usage, assistant-weekly-limit]
    mustMention: [AI usage page]
  - question: How do I cut off an AI app one of our members connected?
    expectedArticles: [ai-usage]
    mustMention: [Revoke, stops at its next call]
---

The {{ui:nav.aiUsage}} page shows what the Assistant and your members' AI apps use in one
organization. Only the owner and org admins see it. Open it from {{ui:nav.aiUsage}} under
{{ui:nav.sections.organization}} in the sidebar, from "{{ui:aiSettings.card.seeUsage}}" on the AI
card of the {{ui:nav.organization}} page, or from "{{ui:assistant.limit.seeUsage}}" when the
Assistant has paused. If you administer more than one organization, pick one at the top.

It shows what each person used and how many of their messages were refused, never what anyone
wrote.

## {{ui:aiUsage.assistant.title}}

How much of the organization's Weekly limit is used, in dollars and as a percentage, and when it
resets, in your own time zone. Answers still being written count, so the figure can drop a little
once they finish. Bars show the last eight weeks beside this one, with the weeks that reached the
limit in red. Once the limit is reached, the card says when, and that the Assistant is paused for
everyone until the reset. See [Weekly limit and Usage](help:assistant-weekly-limit).

## {{ui:aiUsage.connections.title}}

The tool calls all AI apps made today against the daily AI connection limit, when the count resets,
and bars for the last 14 days with the days that reached the limit in red. See
[Limits on AI connections](help:ai-connection-limits).

## {{ui:aiUsage.people.title}}

One row per person who used the Assistant this week, had a message refused, made a call today or
has an AI app connected:

- **{{ui:aiUsage.people.assistantWeek}}**: what their Assistant answers cost this week.
- **{{ui:aiUsage.people.refused}}**: messages the Assistant refused as off topic or unsafe this
  week. From 3 the number turns amber.
- **{{ui:aiUsage.people.callsToday}}**: their AI apps' calls today, marked once they reach the
  member daily limit.
- **{{ui:aiUsage.people.apps}}**: the apps they connected in this organization.

Usage of an account that was deleted and erased shows as "{{ui:aiUsage.people.deletedAccount}}",
with no name, so the totals stay right. On a phone each person is a card.

## Revoke an app

Open a person to see their apps, with the access each has, when it was connected and when it was
last used. Press {{ui:aiUsage.people.revoke}}, then {{ui:aiUsage.people.revoke}} again to confirm.
The app stops at its next call. The person can connect it again while AI connections are on, and
they can disconnect their own apps in Settings. See [AI connections](help:ai-connections).

## {{ui:aiUsage.weeks.title}}

Every earlier week with Assistant use, newest first, with the date the limit was reached if it was.
Open a week to see who used how much. Per-person usage is kept for 180 days; older weeks show only
the organization's total.

If both the Assistant and AI connections are off, the page says so and links to the organization
settings.
