---
id: birthdays
title: Add your birthday and share it with your groups
summary: Save your birthday in Settings, choose whether your groups see it and your age, and where shared birthdays appear.
module: group-events
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/settings, /dashboard]
tools: [list_birthdays]
keywords:
  [
    birthday,
    birthdays,
    date of birth,
    age,
    share birthday,
    hide birthday,
    cake,
    colleague birthday,
    remove birthday,
  ]
related: [account-settings, group-events, calendar-feed, dashboard-calendar]
goldenQuestions:
  - question: How do I make my birthday show on the team calendar?
    expectedArticles: [birthdays]
    mustMention: [Birthday card in Settings, Share my birthday with my groups, paid plan]
  - question: Can I share my birthday without people seeing how old I am?
    expectedArticles: [birthdays]
    mustMention: [leave the year empty, the year shows your age]
  - question: Why don't I see my colleague's birthday on the dashboard?
    expectedArticles: [birthdays, cant-see-someone]
    mustMention: [they chose to share it, show the group]
---

You can add your birthday in {{ui:nav.settings}}. It always shows on your own calendar, and your
groups see it only if you share it.

## Add your birthday

1. Open {{ui:nav.settings}} and find the "{{ui:settings.birthday.title}}" card.
2. Pick the "{{ui:settings.birthday.day}}" and "{{ui:settings.birthday.month}}".
3. The "{{ui:settings.birthday.year}}" is optional. With a year, everyone who sees your birthday on
   the calendar also sees the age you turn. Leave it empty to keep your age to yourself.
4. Save.

A birthday on 29 February shows on 28 February in other years. Saving works on any plan.

## Share it with your groups

Turn on "{{ui:settings.birthday.share}}" and save. The switch needs at least one of your groups on a
paid plan: Pro, Enterprise or a custom plan. Without one, the card says so and your birthday stays
on your own calendar.

The "{{ui:settings.birthday.panelTitle}}" panel beside the form shows where your birthday appears
right now:

- **{{ui:settings.birthday.yourCalendar}}**: always, with your age if you saved a year.
- **{{ui:settings.birthday.groupCalendar}}**: the groups that see it, once you share.
- **{{ui:settings.birthday.teamFeeds}}**: team calendar feeds include shared birthdays, never with
  your age.
- **{{ui:settings.birthday.colleaguesCalendars}}**: never. Direct sync writes only your own birthday
  into your own calendar.

Turn the switch off, or press "{{ui:settings.birthday.remove}}", and your birthday leaves every
group calendar.

## Who sees a shared birthday

Shared birthdays show on the {{ui:nav.dashboard}} calendar with a cake, and in the iPhone app.

- With "{{ui:dashboard.scope.label}}" set to "{{ui:dashboard.scope.mine}}", you see only your own
  birthday.
- With a group shown, you also see the shared birthdays of that group's members. Showing a group
  needs the {{ui:groupDetail.columns.view}} permission.
- Only fellow members see them. An organization administrator who isn't in the group sees none.
- A group whose organization never had a paid plan shows no shared birthdays.

Nobody gets a notification or email about a birthday.

## When the plan ends

If your groups lose their paid plan, a birthday you already share keeps showing there. You can stop
sharing, but turning it back on needs a group on a paid plan again.

## Birthdays in your calendar app

A calendar feed or a direct sync can include birthdays. See
[Subscribe to time off in your calendar app](help:calendar-feed).
