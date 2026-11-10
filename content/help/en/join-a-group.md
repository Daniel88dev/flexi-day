---
id: join-a-group
title: Join a group with an invite
summary: Use the link in your invite email or the invite code from your group admin to join a group.
module: account
roles: [member]
routes: [/groups]
keywords:
  [join, invite, invitation, invite code, invite link, join team, code expired, wrong account]
related: [create-an-account, invite-people]
goldenQuestions:
  - question: My manager sent me a code, where do I enter it?
    expectedArticles: [join-a-group]
    mustMention: [Join a group on the Groups page, confirm your email address first]
  - question: My invite link says it has expired, what now?
    expectedArticles: [join-a-group]
    mustMention: [invites expire after 14 days, ask your group admin for a new invite]
---

A group admin invites you by email. The email holds an invite link and an invite code. Either one
gets you into the group, once.

## Join with the invite link

Open the link from your invite email. The page names the group and who invited you.

- **No account yet:** fill in your name and a password and press
  "{{ui:join.signUpSubmit}}". Your account is created with the address confirmed, already in the
  group.
- **You have an account:** sign in, then press "{{ui:join.join}}". Nothing happens until you press
  it.

## Join with the invite code

If the email didn't arrive, your group admin can copy the code and send it to you another way.

1. Sign in and open {{ui:nav.groups}}.
2. In "{{ui:groups.joinTitle}}", paste the code or the whole invite link into
   "{{ui:groups.inviteInput}}".
3. Press "{{ui:groups.join}}".

Codes work in capitals or small letters, with or without their dashes. A code works only for an
account whose email address is confirmed. If yours isn't, use the link in the invite email: following
it confirms the address.

## Why an invite doesn't work

- **It is for another address.** An invite works only for the email address it was sent to. If you
  are signed in with a different account, sign out and continue with the invited one, or ask the
  admin to invite the address you use.
- **It expired.** An invite is valid for 14 days.
- **It was used or withdrawn.** Each invite works once. Sending a new invite to the same address
  cancels the older one.
- **The group is full.** Every plan limits the number of people in a group, and the organization may
  have reached it.

In each case, ask your group admin for a new invite.

## After you join

You land in the group as a member: you see the group's calendar, your leave is tracked there, and
you have this year's allowance from the group's defaults. A group admin can change your permissions.
See [Group permissions](help:group-permissions).
