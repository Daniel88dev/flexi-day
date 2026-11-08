---
id: notifications
title: Notifications and emails
summary: What the bell in the top bar shows, which notices also come by email or to your iPhone, and how to turn request emails off.
module: notifications
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/settings]
keywords:
  [
    notifications,
    bell,
    alerts,
    email notifications,
    emails,
    unsubscribe,
    stop emails,
    push notifications,
    mark as read,
    clear notifications,
  ]
related: [account-settings, iphone-app, approve-requests, email-not-arriving]
goldenQuestions:
  - question: Which things does Flexi Day email me about?
    expectedArticles: [notifications]
    mustMention: [approval requests, decisions, cancellations, comments]
  - question: Can I turn off the notifications in the app?
    expectedArticles: [notifications]
    mustMention: [the bell can't be turned off, Email notifications turns off emails only]
  - question: How do I clear all my notifications?
    expectedArticles: [notifications]
    mustMention: [Clear all, Mark all read]
---

Flexi Day tells you about things that need you, or that changed for you, with a notice under the
bell in the top bar. Some notices also come by email, and every one reaches the iPhone app if you
allow notifications there.

## The bell

A dot on the bell means you have unread notices. Open it to see the latest twelve, newest first.

- Click a notice to open what it is about. A request opens in its details window, on the page you
  are on.
- "{{ui:notifications.markAllRead}}" clears the dot. "{{ui:notifications.clearAll}}" removes every
  notice, and the cross beside one removes only that one.

## What you get notified about

| Notice                                                               | Who gets it                                                      | Email too |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- | --------- |
| Someone requested time off                                           | The group's approvers and manager                                | Yes       |
| Your request was approved or declined                                | You                                                              | Yes       |
| Your request or approved time off was cancelled by someone else      | You                                                              | Yes       |
| You cancelled approved time off                                      | The group's approvers and manager                                | Yes       |
| A comment on a request                                               | The requester, or the approvers when the requester writes        | Yes       |
| An admin requested time off for you, or changed yours                | You                                                              | No        |
| Your clock was closed automatically                                  | You                                                              | No        |
| Your export is ready                                                 | Whoever asked for it                                             | No        |
| Someone deleted their account                                        | Their organization's admins, and whoever takes over their groups | No        |
| The people directory, the Assistant or AI connections were turned on | Everyone in the organization, if the owner chose to tell them    | No        |

Declined requests that are cancelled later send nothing more. Group events and birthdays never send
notices.

## Turn request emails off

Open {{ui:nav.settings}} and switch off "{{ui:settings.emailNotifications}}". It stops the emails
about requests: approval requests, decisions, cancellations and comments. The same notices still
appear under the bell and on your iPhone; the notices in the app can't be turned off. The setting
belongs to your account, so it applies in every organization.

Some emails always send, whatever the setting:

- confirming your email address, resetting your password and two-factor codes;
- invites to a group or to the people directory;
- warnings to the organization's billing email that the paid plan is ending.

## On your iPhone

The iPhone app shows the same notices as push notifications once you allow them. The email setting
doesn't affect them; turn them off in the iPhone's own settings. An auto-closed clock arrives quietly,
without a sound. See [Use Flexi Day on your iPhone](help:iphone-app).

## Mail that doesn't arrive

See [Emails from Flexi Day don't arrive](help:email-not-arriving).
