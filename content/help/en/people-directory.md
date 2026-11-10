---
id: people-directory
title: Turn on the people directory and decide who sees what
summary: What the Enterprise people directory is, how the owner turns it on or off, and how the Permission table and the HR and Leadership roles decide who reads and changes each part of a profile.
module: directory
roles: [member, org-admin, owner]
routes: [/directory]
tools: [list_directory_people]
keywords:
  [
    directory,
    people directory,
    employee directory,
    hr,
    employee profiles,
    staff list,
    permission table,
    who sees what,
    leadership,
    directory roles,
    directory agreement,
    turn off directory,
    delete directory data,
  ]
related:
  [
    directory-profiles,
    directory-read-log,
    employment-spells,
    directory-invites,
    external-workers,
    plans-and-limits,
  ]
goldenQuestions:
  - question: How do I set up an employee directory with HR details?
    expectedArticles: [people-directory]
    mustMention:
      [Enterprise, only the owner turns it on, People directory card on the Organization page]
  - question: Can my colleagues see my home address in the directory?
    expectedArticles: [people-directory, directory-profiles]
    mustMention: [Colleague column, Contact and Personal are None by default]
  - question: How do I give someone from HR access to everyone's profile?
    expectedArticles: [people-directory]
    mustMention: [Directory roles, HR, only the owner assigns them]
---

The people directory keeps a profile for everyone your organization works with, including people
without a Flexi Day account and external workers. It is on the Enterprise plan, off until the owner
turns it on, and once on everyone in the organization finds it under {{ui:nav.directory}}.

## Turn it on

1. The owner opens {{ui:nav.organization}} and finds the "{{ui:organization.directory.title}}" card.
2. Press "{{ui:organization.directory.turnOn}}", read the directory agreement and accept it for the
   organization.
3. Leave "{{ui:organization.directory.dialog.tellMembers}}" ticked to send everyone with an account a
   notice asking them to check their profile.

Everyone employed in the organization appears under their account name. From then on, removing
someone from a group no longer ends their employment; see
[Employment and leaving](help:employment-spells).

A checklist on the directory page then suggests the first steps: add departments, add locations,
assign HR and add job titles.

## The directory page

"{{ui:directory.people}}" lists everyone you can see, as cards or a table. Search by name or job
title, and filter by department or location. The owner, organization administrators and HR also get
"{{ui:directory.former}}", the people who have left, and "{{ui:directory.settings.tab}}". Open
anyone to see their profile; see [Directory profiles](help:directory-profiles).

## Who sees what: the Permission table

A profile has six sections: {{ui:directory.history.sections.CARD}},
{{ui:directory.history.sections.PHOTO}}, {{ui:directory.history.sections.WORK_CONTACT}},
{{ui:directory.history.sections.JOB}}, {{ui:directory.history.sections.CONTACT}} and
{{ui:directory.history.sections.PERSONAL}}. For each section, the
"{{ui:directory.settings.permissions}}" in {{ui:directory.settings.tab}} sets what each audience may
do: {{ui:directory.settings.values.NONE}}, {{ui:directory.settings.values.READ}} or
{{ui:directory.settings.values.WRITE}}. The audiences are the table's columns:
{{ui:directory.history.audiences.OWNER}}, {{ui:directory.history.audiences.SELF}},
{{ui:directory.history.audiences.COLLEAGUE}}, {{ui:directory.history.audiences.EXTERNAL_WORKER}},
{{ui:directory.history.audiences.GROUP_ADMIN}}, {{ui:directory.history.audiences.HR}},
{{ui:directory.history.audiences.LEADERSHIP}} and
{{ui:directory.history.audiences.ORGANIZATION_ADMIN}}. Someone in several audiences gets the widest
cell.

By default:

- **{{ui:directory.history.audiences.COLLEAGUE}}:** reads {{ui:directory.history.sections.CARD}},
  {{ui:directory.history.sections.PHOTO}} and {{ui:directory.history.sections.WORK_CONTACT}}, and
  nothing of {{ui:directory.history.sections.JOB}}, {{ui:directory.history.sections.CONTACT}} or
  {{ui:directory.history.sections.PERSONAL}}.
- **{{ui:directory.history.audiences.SELF}}:** you read your whole profile and write your own
  {{ui:directory.history.sections.PHOTO}}, {{ui:directory.history.sections.CONTACT}} and
  {{ui:directory.history.sections.PERSONAL}}.
- **{{ui:directory.history.audiences.GROUP_ADMIN}}** and
  **{{ui:directory.history.audiences.LEADERSHIP}}:** read {{ui:directory.history.sections.CARD}},
  {{ui:directory.history.sections.PHOTO}}, {{ui:directory.history.sections.WORK_CONTACT}} and
  {{ui:directory.history.sections.JOB}}; a group admin of their group's members, Leadership of
  everyone.
- **{{ui:directory.history.audiences.HR}}** and
  **{{ui:directory.history.audiences.ORGANIZATION_ADMIN}}:** read and write every section of
  everyone.

The table also holds five acts: create a person without an account, send a directory invite, change
worker type, end an employment, and manage departments and locations. The owner, HR and org admins
may do them by default.

Only the owner changes the table. The owner always writes everything, and you always read your own
profile. Colleagues and external workers can get at most {{ui:directory.settings.values.READ}}.
Every change is kept in the permission history.

## HR and Leadership

"{{ui:directory.settings.roles}}" are given to people, not groups. The owner assigns them in
{{ui:directory.settings.tab}}. They need an account and an open employment, end when the
employment ends, and being an org admin brings neither.

## Turn it off

The owner presses "{{ui:organization.directory.turnOff}}" on the same card. Nobody's employment
ends, the directory closes for everyone and its data stays. Retention and the read log keep
working. "{{ui:organization.directory.deleteAll}}" then removes profiles, photos, lists, roles and
people without an account for good; it needs the organization's name typed.

If the plan lapses, the directory stays readable, and data can be cleared but not added.
