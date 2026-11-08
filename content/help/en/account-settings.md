---
id: account-settings
title: Change your settings
summary: Email notifications, the dashboard calendar layout, language and theme, and where the other account settings live.
module: account
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/settings]
keywords:
  [
    settings,
    preferences,
    email notifications,
    turn off emails,
    language,
    czech,
    dark mode,
    theme,
    lanes,
    stripes,
    calendar layout,
    default group,
  ]
related: [sign-in, delete-your-account, dashboard-calendar, notifications, birthdays]
goldenQuestions:
  - question: How do I stop getting emails about requests?
    expectedArticles: [account-settings]
    mustMention: [Email notifications in Settings, notifications stay in the app]
  - question: Can I make the dashboard open on my team's calendar instead of just mine?
    expectedArticles: [account-settings]
    mustMention: [Whose time off to show, pick the group]
---

Open {{ui:nav.settings}} from the sidebar or from the user menu in the top bar. These settings belong
to your account, so they apply in every organization you work in.

## Email notifications

"{{ui:settings.emailNotifications}}" controls the emails Flexi Day sends about requests: approval
requests for approvers, decisions on your requests, cancellations, and comments. Turn it off and
these updates reach you only in the app, in the bell in the top bar, and on your iPhone if you use
the app. Account emails, such as confirming your address or resetting your password, always send. See
[Notifications and emails](help:notifications).

## The dashboard calendar

The "{{ui:settings.dashboardCalendar}}" card sets how the {{ui:nav.dashboard}} calendar opens:

- **Layout.** "{{ui:settings.layoutLanes}}" puts names on the calendar.
  "{{ui:settings.layoutStripes}}" keeps the month compact; pick a day to see who is away. The iPhone
  app uses the same choice.
- **{{ui:settings.dashboardScope}}.** "{{ui:settings.scopeMine}}" or "{{ui:settings.scopeGroup}}".
  With the group, choose which one. Only groups whose time off you may view are listed; a group
  admin can give you view access.

You can still switch between yourself and a group for one visit on the dashboard itself.

## Language and theme

Switch between English and Czech with the language button in the top bar; the choice is saved with
your account. The theme button picks light, dark, or your system's setting.

## Your name and email address

Your name and email address are the ones you signed up with. The app has no field to change them
yet.

## Other settings on this page

- **Birthday**: whether your groups see your birthday on their calendar. See
  [Add your birthday and share it](help:birthdays).
- **{{ui:settings.connectedAccounts.title}}**, **{{ui:settings.changePassword}}** and
  **{{ui:settings.twoFactor.title}}**: see [Sign in to Flexi Day](help:sign-in).
- **{{ui:settings.yourData.title}}** and **{{ui:settings.deleteAccount.title}}**: see
  [Download your data or delete your account](help:delete-your-account).
