---
id: create-a-group
title: Create a group for your team
summary: Create a group, set its default allowances, and what a group is for.
module: groups
roles: [owner, manager, member]
routes: [/groups, /groups/detail]
keywords: [create group, new group, team, department, office, set up, add team, group limit]
related: [invite-people, group-permissions, group-settings, plans-and-limits]
goldenQuestions:
  - question: How do I set up a new team in Flexi Day?
    expectedArticles: [create-a-group]
    mustMention: [Create a group on the Groups page, you become its manager]
  - question: Why can't I create another group?
    expectedArticles: [create-a-group, plans-and-limits]
    mustMention: [plan's group limit, extra group slots]
---

A group is the unit Flexi Day tracks time off in, usually a team or an office. Each group has its own
members, approvers, working days, public holidays and allowances. A person can belong to several
groups.

## Create a group

1. Open {{ui:nav.groups}}.
2. In "{{ui:groups.createTitle}}", enter the "{{ui:groups.nameLabel}}".
3. Set "{{ui:groups.defaultVacation}}" and "{{ui:groups.defaultHomeOffice}}": the yearly allowances
   new members start with. The form suggests 20 and 60.
4. Press "{{ui:groups.create}}".

You become the group's manager: you administer it and approve its requests. Your own allowance for
this year opens from the defaults.

## Which organization it belongs to

A new group always goes into your own organization. If you don't have one yet, Flexi Day creates it
on the Free plan and you become its owner. Being an administrator of someone else's organization
doesn't change this: a group you create lands in your own.

## Group limits

Each plan allows a number of groups: 3 on Free, 5 on Pro and 20 on Enterprise, plus any extra group
slots. When they are all used, the form says so. The owner can upgrade or buy a slot on the
{{ui:nav.billing}} page. See [Plans, prices and limits](help:plans-and-limits).

## Next steps

- Invite your team. See [Invite people to a group](help:invite-people).
- Set the working days and the public holiday country. See
  [Working days and public holidays](help:group-settings).
- Give people the right permissions. See [Group permissions](help:group-permissions).

Each group card on the {{ui:nav.groups}} page shows your role in it and links to its
{{ui:groupDetail.tabs.members}}, {{ui:groupDetail.tabs.quotas}}, {{ui:groupDetail.tabs.invites}} and
{{ui:groupDetail.tabs.settings}} tabs.

## Renaming, deleting or leaving a group

The app has no button to rename or delete a group, or to leave one yourself. A group admin can remove a member;
see [Group permissions](help:group-permissions).
