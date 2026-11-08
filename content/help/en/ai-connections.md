---
id: ai-connections
title: Connect an AI app to Flexi Day
summary: Let an AI app such as Claude, ChatGPT or Cursor read your Flexi Day data and make changes for you.
module: assistant-and-mcp
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/settings, /organization]
tools: [search_docs, read_doc, create_request, cancel_my_request, clock_in, clock_out]
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
    revoke,
    last used,
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
first and names the apps and people it disconnects. Every change is recorded with who made it and
when.

## Connect an app

1. Open {{ui:nav.settings}} and find the "{{ui:aiConnectionGrants.settings.title}}" card.
2. Under "{{ui:aiConnectionGrants.settings.connectTitle}}", copy the server address,
   `https://api.flexi-day.com/mcp`.
3. In your AI app, add a custom connector with that address.
4. The app opens a Flexi Day page that names it. Sign in as usual. If you use two-factor
   authentication, Flexi Day asks for your code. Nothing is shared until you allow it.
5. Pick the organization the app should work in. Each one shows the access it allows.
   Organizations whose owner hasn't turned on AI connections, or that are on the Free plan, are
   listed with the reason. If none allows it, go back to the app.
6. Check the consent page and choose "{{ui:aiConnect.consent.allow}}".

Each connection covers one organization, and you pick it every time you connect. Connect again to
add another.

### The consent page

- When Flexi Day could check the app's address, the page says "Address checked" with it.
  Otherwise it says "{{ui:aiConnect.consent.notVerified}}": the name is the app's own claim.
- When the app is a program on your computer, such as Claude Code or Cursor, a warning asks you to
  allow it only if you started connecting from it just now.
- "{{ui:aiConnect.consent.read}}" is always part of the connection. "{{ui:aiConnect.consent.write}}"
  is ticked; untick it to connect read only. On a Read only organization it isn't offered.

## What a connected app can do

It can read whatever you can see in Flexi Day and look things up in the help. With Read and write
it can also create a request, cancel your own request, and clock you in or out, only for you.
Flexi Day makes the change at once, under the same rules as in the app. It can't approve or
reject requests (do that in Flexi Day, or ask [the Assistant](help:assistant)), and it can't change roles, billing or
settings.

A change the app makes reads "{{ui:common.channel.mcp}}" in the request's history or in the
attendance history. When it opens a Sensitive section of someone's profile, the organization's Read
log shows the read the same way.

## Limits

Each organization has a daily AI connection limit: 5,000 calls a day on Pro and 20,000 on
Enterprise. Each person also has a member daily limit of 1,000 calls. Both reset at midnight UTC.
When a limit is reached, the app gets a message saying which limit and when it resets.

## Your connections and Disconnect

The "{{ui:aiConnectionGrants.settings.title}}" card in {{ui:nav.settings}} lists each app you
connected: its address, or "{{ui:aiConnectionGrants.settings.notVerified}}" when Flexi Day couldn't
check it, the organization, its access, and when it was last used. Last use updates at least once an hour while the app is in use.

To end one, choose "{{ui:aiConnectionGrants.settings.disconnect}}" next to the app and confirm. The
app stops at its next call. To use it again, connect it again.

### What else disconnects apps

- Resetting your password disconnects every app you connected, in every organization.
- Changing your password in {{ui:nav.settings}} does the same, because it also signs you out
  everywhere else.
- Deleting your account disconnects them all.
- The owner turning AI connections off disconnects every app in the organization. Lowering it to
  {{ui:aiConnectionsSettings.card.levels.read}} disconnects the apps that have write access; connect
  again to get read access.
- Owners and org admins see each person's apps on the AI usage page and can revoke them there.

Signing out, turning on two-factor authentication and a lapsed plan keep your connections. While the plan is lapsed, the app's calls are refused.
