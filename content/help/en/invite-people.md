---
id: invite-people
title: Invite people to a group
summary: Send an email invite, share the invite code when the email doesn't arrive, and revoke invites.
module: groups
roles: [manager, group-admin, org-admin, owner]
routes: [/groups/detail]
keywords:
  [
    invite,
    add member,
    add people,
    add employee,
    invite code,
    resend invite,
    revoke invite,
    onboarding,
    new colleague,
  ]
related: [join-a-group, group-permissions, plans-and-limits]
goldenQuestions:
  - question: How do I add a new colleague to our team?
    expectedArticles: [invite-people]
    mustMention: [Invites tab, Send invite, the code expires in 14 days]
  - question: My colleague never got the invite email, what can I do?
    expectedArticles: [invite-people]
    mustMention: [Copy code, Join a group on the Groups page]
---

You add people to a group by inviting their email address. Group admins, the group's manager and
organization administrators can invite; the {{ui:groupDetail.tabs.invites}} tab is hidden from
everyone else.

## Send an invite

1. Open the group from {{ui:nav.groups}} and go to {{ui:groupDetail.tabs.invites}}.
2. Enter the person's email address under "{{ui:groupDetail.invites.title}}".
3. Press "{{ui:groupDetail.invites.send}}".

Flexi Day emails them an invite link and a single-use code. The invite works only for that address
and expires after 14 days. Someone without an account creates one from the link and lands in the
group in one step.

## When the email doesn't arrive

The invite appears under "{{ui:groupDetail.invites.pendingTitle}}" with its code. Press
"{{ui:groupDetail.invites.copy}}" and send the code another way. The person signs in, opens
{{ui:nav.groups}} and enters it in "{{ui:groups.joinTitle}}". A code needs an account whose email
address is confirmed. If the email failed to send, the tab tells you so straight away.

## Resend or withdraw an invite

To send a fresh invite, invite the same address again. The older invite stops working, code and link
alike. "{{ui:groupDetail.invites.revoke}}" withdraws an invite without sending a new one.

## Group size

Pending invites count toward the plan's limit of people per group, as members do. When the group is
full, sending fails until you remove a member, revoke an invite or upgrade the plan. See
[Plans, prices and limits](help:plans-and-limits).

## What the new member gets

They join with View and Tracked on, Admin and Approver off, and this year's allowance from the
group's defaults. Change their permissions on the {{ui:groupDetail.tabs.members}} tab. See
[Group permissions](help:group-permissions).
