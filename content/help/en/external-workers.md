---
id: external-workers
title: External workers
summary: What changes for a person marked as an external worker (no clocking, no allowances, a smaller profile) and how to change someone's worker type.
module: directory
roles: [member, group-admin, org-admin, owner]
routes: [/directory/person]
keywords:
  [
    external worker,
    contractor,
    freelancer,
    consultant,
    temporary worker,
    worker type,
    employee,
    change worker type,
    no allowance,
    cannot clock in,
  ]
related: [people-directory, directory-profiles, allowances, clock-in-and-out, employment-spells]
goldenQuestions:
  - question: How do I add a freelancer who shouldn't get vacation days?
    expectedArticles: [external-workers, directory-invites]
    mustMention: [External worker, allowances go to zero]
  - question: Why can't I clock in? It says no attendance for external workers.
    expectedArticles: [external-workers]
    mustMention: [external workers don't clock in, no required time]
  - question: How do I change a contractor to a regular employee?
    expectedArticles: [external-workers]
    mustMention: [Change worker type, set their allowances again]
---

Everyone in the [people directory](help:people-directory) is either an employee or an external
worker: someone who works for the organization occasionally, on specific tasks. The profile and the
directory list mark external workers "{{ui:directory.markers.EXTERNAL_WORKER}}" for everyone who sees
them.

## What is different for an external worker

- **Attendance:** they can't clock in, owe no required time and don't appear on
  {{ui:nav.teamAttendance}}. Their earlier history stays readable.
- **Allowances:** their {{ui:calendarRecordTypes.VACATION.label}},
  {{ui:calendarRecordTypes.HOME_OFFICE.label}} and {{ui:calendarRecordTypes.SICK_DAY.label}}
  allowances are zero, and nothing carries over at the turn of the year. They can book only leave
  types that draw on no allowance.
- **Profile:** contract type, working time, probation end and the whole Personal section don't
  apply.
- **What they see:** under the default Permission table, external workers read colleagues' Card and
  Photo only, not their work contact.

Groups, calendars, reports, notifications and birthdays work as for employees.

## Change someone's worker type

1. Open the person's profile under {{ui:nav.directory}}.
2. Press "{{ui:directory.workerType.action}}".
3. Read what changes and confirm.

The owner, HR and organization administrators can do this by default. It needs the directory to be
on but no particular plan, and works only for someone still employed.

**Employee to external worker** clears, at once, the contract type, working time, probation end
date, the whole Personal section and any own required time. Their allowances in the organization's
groups go to zero from this year on. A session they had running can still be closed.

**External worker to employee** restores nothing. The cleared fields start empty and the allowances
stay at zero until a group admin sets them again; see [Allowances](help:allowances).

## Adding someone as an external worker

When you add a person without an account, pick "{{ui:directory.addPerson.external}}" as their worker
type. See [Add people and send directory invites](help:directory-invites).
