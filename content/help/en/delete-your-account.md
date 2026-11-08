---
id: delete-your-account
title: Download your data or delete your account
summary: Get a copy of your account data or of what an organization holds about you, and delete your account for good.
module: account
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/settings]
keywords:
  [
    delete account,
    close account,
    remove account,
    gdpr,
    export my data,
    download my data,
    personal data,
    leave flexi day,
  ]
related: [account-settings, organization-roles]
goldenQuestions:
  - question: How do I delete my Flexi Day account?
    expectedArticles: [delete-your-account]
    mustMention: [Delete account in Settings, it can't be undone]
  - question: If I delete my account does my employer lose my vacation history?
    expectedArticles: [delete-your-account]
    mustMention: [organizations keep their records of your leave and attendance]
  - question: Can I download all my data?
    expectedArticles: [delete-your-account]
    mustMention: [Your data card in Settings, ZIP available for 7 days]
---

Both live at the bottom of {{ui:nav.settings}}: "{{ui:settings.yourData.title}}" for copies of your
data, and "{{ui:settings.deleteAccount.title}}".

## Download your data

- **{{ui:settings.yourData.accountData}}.** "{{ui:settings.yourData.download}}" saves one JSON file
  at once: your profile, sign-in methods, sessions and devices, settings, notifications, calendar
  connections and birthday. Passwords and tokens are left out.
- **{{ui:settings.yourData.organizationData}}.** For each organization you work or worked in, you
  can export what it holds about you: employment, groups, quotas, bookings with attachments,
  attendance and the change log. It is prepared in the background as a ZIP, you are notified when it
  is ready, and it stays available for 7 days.

## What deleting your account removes

Deleting removes your sign-in and your personal data for good: your account and its sign-in
methods, your settings, notifications, calendar connections, birthday and AI connections. It can't be
undone.

The organizations you work in keep their records of your leave, attendance and quotas, with their
history, until they end your employment or erase those records.

If you own an organization that has nobody else in it, it is deleted with its groups. Download the
organization export first if you want a copy. Groups you manage in someone else's organization pass
to that organization's owner.

## Delete your account

1. Open {{ui:nav.settings}} and go to "{{ui:settings.deleteAccount.title}}".
2. Confirm it's you: enter your password, or, if you sign in with Google or Microsoft, sign in again.
3. Read the summary of what goes and what stays, and press "{{ui:settings.deleteAccount.confirmDelete}}".

## When you can't delete yet

The card tells you what is in the way:

- You manage a group in your own organization that still has other members. Remove them first.
- You own an organization where other people still work. Remove them first. Handing an organization
  over to someone else isn't available yet.
- Your organization's subscription will renew. Cancel it in the billing portal first; you give up the
  rest of the paid period. See [Manage your subscription](help:manage-subscription).
