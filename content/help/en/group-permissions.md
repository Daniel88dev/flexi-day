---
id: group-permissions
title: Group permissions, the manager and removing members
summary: What View, Admin, Approver and Tracked allow, how to change them, who the manager is, and what removing a member does.
module: groups
roles: [manager, group-admin, org-admin, owner, member, approver]
routes: [/groups/detail]
keywords:
  [
    permissions,
    roles,
    approver,
    admin,
    view access,
    tracked,
    manager,
    change manager,
    remove member,
    make someone approver,
  ]
related: [organization-roles, approve-requests, invite-people, mirroring]
goldenQuestions:
  - question: How do I make someone an approver in my team?
    expectedArticles: [group-permissions]
    mustMention: [Edit permissions on the Members tab, Approver]
  - question: Why can't my colleague see the team calendar?
    expectedArticles: [group-permissions]
    mustMention: [View permission]
  - question: What happens to someone's booked vacation when I remove them from the group?
    expectedArticles: [group-permissions]
    mustMention: [pending requests and future bookings are cancelled, past bookings stay]
---

Each member of a group holds four permissions, shown as columns on the group's
{{ui:groupDetail.tabs.members}} tab.

## The four permissions

| Permission                          | What it allows                                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| {{ui:groupDetail.columns.view}}     | See everyone's time off in the group. Without it, a member sees only their own.                                                       |
| {{ui:groupDetail.columns.admin}}    | Manage members and permissions, quotas, invites, settings and mirroring, and book leave for members. Includes View. Approves nothing. |
| {{ui:groupDetail.columns.approver}} | Approve or reject members' leave requests. Manages nothing.                                                                           |
| {{ui:groupDetail.columns.tracked}}  | Book leave in the group. Turn it off for someone who only oversees the group.                                                         |

Someone who joins through an invite starts with View and Tracked on, Admin and Approver off.

## Change permissions

1. Open the group from {{ui:nav.groups}} and stay on {{ui:groupDetail.tabs.members}}.
2. Press "{{ui:groupDetail.editPermissions}}" and switch the values.
3. Save.

Group admins, the manager and organization administrators can do this. Nobody can raise their own
permissions, and an organization administrator can't make themselves an approver.

## The manager

Every group has one manager, marked on the {{ui:groupDetail.tabs.members}} tab. The manager always
administers the group and approves its requests, whatever their Admin and Approver values show. The
person who created the group starts as its manager.

To hand the group to someone else, the owner or an organization administrator presses
"{{ui:groupDetail.changeManager.button}}" on the group page and picks a member. The manager and
group admins can't do this themselves. Permissions and approvers stay as they are.

## Remove a member

On the {{ui:groupDetail.tabs.members}} tab, press "{{ui:groupDetail.removeMember}}" next to the
person. They lose access to the group, and:

- their pending requests in the group are cancelled;
- their approved bookings there from tomorrow on are cancelled;
- past bookings and today's stay, with their history.

Nobody is notified. The manager can't be removed; give the group another manager first. If this
group was the person's last link to the organization, their employment there ends too, unless the
organization uses the people directory.
