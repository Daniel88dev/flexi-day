---
id: cant-book-time-off
title: I can't book time off
summary: Why a time off request is refused or the form won't submit, and what fixes each case.
module: troubleshooting
roles: [member, approver, manager, group-admin, org-admin, owner]
routes: [/requests]
keywords:
  [
    can't book,
    cannot request,
    request refused,
    request failed,
    error,
    already booked,
    exceed the allowance,
    no access,
    read-only,
    submit disabled,
    no groups,
  ]
related:
  [
    request-time-off,
    allowances,
    group-permissions,
    lapsed-plan,
    types-of-time-off,
    sick-day-benefit,
  ]
goldenQuestions:
  - question: It says some days are already booked but I don't see any vacation there
    expectedArticles: [cant-book-time-off, request-time-off]
    mustMention: [one booking per day, a pending request counts, cancel it first]
  - question: Why does my request say it would exceed the allowance?
    expectedArticles: [cant-book-time-off, allowances]
    mustMention: [pending requests count, ask a group admin]
  - question: I get "No access for related group" when I send a request
    expectedArticles: [cant-book-time-off, group-permissions]
    mustMention: [Tracked permission, group admin]
---

When Flexi Day refuses a request, the message under the form says why. Find it below.

## "{{ui:newRequest.noGroups}}"

You can book only in a group you belong to. Join one with an invite, or create your own. See
[Join a group with an invite](help:join-a-group).

## "No access for related group"

You need the {{ui:groupDetail.columns.tracked}} permission to book in a group. Someone who only
oversees a group often has it off. Ask a group admin to turn it on, on the group's
{{ui:groupDetail.tabs.members}} tab. See [Group permissions](help:group-permissions).

## Some days are already booked

You can hold one booking per day, across all your groups. A pending request counts as much as an
approved one. The message lists the days. Cancel or change the request that holds them, or pick other
dates. Days of declined or cancelled requests are free again. See
[Cancel or change a request](help:cancel-or-change-a-request).

## The range has no working day

Flexi Day skips the days your group doesn't work and its country's public holidays. A range made only
of those, such as a weekend, is refused. Check the group's working days with a group admin.

## It would exceed the allowance

For types with an allowance, such as {{ui:calendarRecordTypes.VACATION.label}}, a request can't take
you past the days you have for that year. Your pending requests count too. The
"{{ui:widgets.balance.title}}" card on the {{ui:nav.dashboard}} shows what is left.

- Book fewer days, or a type without an allowance.
- Ask a group admin to raise your allowance for the year. See [Allowances](help:allowances).

External workers can book only types that draw on no allowance, such as
{{ui:calendarRecordTypes.NON_PAID_LEAVE.label}}.

## "{{ui:billing.readOnlyGroup}}"

The organization's paid plan ended and this group is over the Free limits, so nobody can book in it
until the owner subscribes again or the group shrinks. See
[When a paid plan ends](help:lapsed-plan).

## {{ui:calendarRecordTypes.SICK_DAY.label}} isn't offered

It shows only where the organization has the Sick day benefit on a paid plan. See
[Offer paid sick days with the Sick day benefit](help:sick-day-benefit).

## The button stays grey

"{{ui:newRequest.submit}}" waits until the form is complete:

- a group and a type are picked;
- the end date is on or after the start date;
- a note is filled in for {{ui:calendarRecordTypes.OTHER.label}}.

Dates must fall between 1 January this year and 31 December next year.

## Booking for someone else

As a group admin you can book only for members who have {{ui:groupDetail.columns.tracked}} on, and
never for someone who deleted their account. See [Request time off](help:request-time-off).
