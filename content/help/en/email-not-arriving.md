---
id: email-not-arriving
title: Emails from Flexi Day don't arrive
summary: What to check when a confirmation, password reset, sign-in code, invite or request email doesn't reach you.
module: troubleshooting
roles: [member, approver, manager, group-admin, org-admin, owner]
keywords:
  [
    no email,
    email not received,
    didn't get email,
    spam,
    junk,
    verification email,
    confirmation email,
    reset email,
    invite email,
    missing email,
  ]
related: [notifications, create-an-account, sign-in, invite-people, join-a-group]
goldenQuestions:
  - question: I never got the email to confirm my account, what now?
    expectedArticles: [email-not-arriving, create-an-account]
    mustMention: [check spam, link is valid for one hour, Forgot?]
  - question: My manager approved my vacation but I didn't get an email
    expectedArticles: [email-not-arriving, notifications]
    mustMention: [Email notifications in Settings, the bell in the top bar]
---

Flexi Day sends its emails from an address at flexi-day.com. If one doesn't arrive, work through the
steps for the kind of email you expected.

## First checks

- **Spam and junk.** Look there and in any "Promotions" or "Other" tab. Mark the email as not spam so
  the next one lands in your inbox.
- **The right address.** Emails go to the address you signed up with. The user menu in the top bar
  shows it. For an invite, check the address with whoever invited you.
- **Company mail filters.** Some work mailboxes hold or drop mail from new senders. Ask your IT team
  to allow mail from flexi-day.com.

## Confirming your email address

The confirmation link is valid for one hour. If it expired or never came, use
"{{ui:auth.signIn.forgot}}" on the sign-in page and set a password from the email it sends.
Following that link confirms your address too. See
[Create a Flexi Day account](help:create-an-account).

## Password reset and sign-in codes

- A password reset link is valid for one hour. Ask for a new one if it expired.
- A two-factor code sent by email is valid for 3 minutes. Press "{{ui:auth.twoFactor.resend}}" on
  the sign-in screen for a fresh one, or use your authenticator app or a backup code instead. See
  [Sign in to Flexi Day](help:sign-in).

## Group invites

An invite works only for the address it was sent to and expires after 14 days. If it doesn't arrive,
ask a group admin to copy the invite code from the group's {{ui:groupDetail.tabs.invites}} tab and
send it to you another way. Enter it in "{{ui:groups.joinTitle}}" on the {{ui:nav.groups}} page. See
[Join a group with an invite](help:join-a-group).

## Emails about requests

- **The setting is off.** "{{ui:settings.emailNotifications}}" in {{ui:nav.settings}} turns off
  emails about requests: approval requests, decisions, cancellations and comments. The notices still
  show under the bell in the top bar.
- **Some notices never email.** A request an admin filed or changed for you, an auto-closed clock and
  a ready export show only in the app. See [Notifications and emails](help:notifications) for the
  full list.
- **You didn't need one.** You get no email about your own actions, and approvers aren't told about a
  request they filed themselves.

## Still nothing

If none of this helps, write to us through the {{ui:footer.contact}} page linked at the bottom of
flexi-day.com. Name your address and the email you expected.
