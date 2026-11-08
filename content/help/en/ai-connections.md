---
id: ai-connections
title: Connect an AI app to Flexi Day
summary: Let an AI app such as Claude, ChatGPT or Cursor read your Flexi Day data and make changes for you.
module: assistant-and-mcp
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/settings, /organization]
tools: [search_docs, read_doc]
keywords:
  [
    ai connections,
    mcp,
    claude,
    chatgpt,
    cursor,
    connector,
    connect,
    disconnect,
    read only,
    read and write,
    turn on,
    agreement,
    tell members,
  ]
related: [assistant]
goldenQuestions:
  - question: How do I connect ChatGPT to Flexi Day?
    expectedArticles: [ai-connections]
    mustMention: [AI connections card in Settings, https://api.flexi-day.com/mcp]
  - question: Can my AI app approve requests?
    expectedArticles: [ai-connections]
    mustMention: [approve and reject only in Flexi Day]
---

AI connections let an AI app you already use, such as Claude, ChatGPT or Cursor, work with your
Flexi Day data. The app acts as you, in one organization, with the same permissions you have in the
app.

## Before you start

AI connections work on every paid plan: Pro, Enterprise and Custom. The owner chooses one of three
settings for "{{ui:aiConnectionsSettings.card.title}}" in the AI card on the
{{ui:nav.organization}} page:

- **{{ui:aiConnectionsSettings.card.levels.off}}**, the default: no app can connect.
- **{{ui:aiConnectionsSettings.card.levels.read}}**: apps can read what you can see.
- **{{ui:aiConnectionsSettings.card.levels.write}}**: apps can also make changes to your own
  records.

## Turning AI connections on

Only the owner can change the setting. Org admins see it but can't change it, and on the Free plan
it stays off. Before AI connections turn on, the owner reads what the apps can do and what leaves
Flexi Day: what an app reads goes to the company behind that app, under the member's own agreement
with them. Personal accounts of AI apps may keep what they read or train on it, so your
organization's own policy decides which apps people may use.

The owner picks the level to start with under "{{ui:aiConnectionsSettings.turnOn.startWith}}". The
first time an AI feature is turned on, the owner accepts the AI features agreement for the
organization, and Flexi Day records who accepted, when, and which version. If the Assistant already
accepted the current version, AI connections don't ask again.

"{{ui:aiSettings.turnOn.tellMembers}}" is ticked by default and sends everyone in the organization a
notice in the app and on their phone. While AI connections are on, the owner can copy the same text
from the AI card with "{{ui:aiSettings.card.copyNotice}}".

Going from {{ui:aiConnectionsSettings.card.levels.read}} to
{{ui:aiConnectionsSettings.card.levels.write}} needs no new acceptance. Lowering to
{{ui:aiConnectionsSettings.card.levels.read}} or turning AI connections off asks the owner to confirm
first, because it disconnects apps. Every change is recorded with who made it and when.

## Connect an app

1. Open {{ui:nav.settings}} and find the AI connections card.
2. Choose "Connect an AI app" and copy the server address, `https://api.flexi-day.com/mcp`.
3. In your AI app, add a custom connector with that address.
4. Sign in to Flexi Day when the app asks, pick the organization, and allow access.

If you belong to several organizations, each connection covers one of them. Connect again to add
another.

## What a connected app can do

It can read whatever you can see in Flexi Day and look things up in the help. With Read and write
it can also create a request, cancel your own request, and clock you in or out. It can't approve or
reject requests (do that in Flexi Day, or ask [the Assistant](help:assistant)), and it can't change roles, billing or
settings.

A change the app makes reads "{{ui:common.channel.mcp}}" in the request's history or in the
attendance history. When it opens a Sensitive section of someone's profile, the organization's Read
log shows the read the same way.

## Limits

Each organization has a daily AI connection limit: 5,000 calls a day on Pro and 20,000 on
Enterprise. Each person also has a member daily limit of 1,000 calls. Both reset at midnight UTC.
When a limit is reached, the app gets a message saying which limit and when it resets.

## Disconnect

In the AI connections card, choose "Disconnect" next to the app. Apps are also disconnected when
you reset your password, when you delete your account, and when the owner turns AI connections off.
Lowering the setting to Read only removes write access. Owners and org admins see each person's
apps on the AI usage page and can revoke them there.
