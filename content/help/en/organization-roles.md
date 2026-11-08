---
id: organization-roles
title: The owner and organization administrators
summary: Who owns an organization, what an administrator can and can't do, and how the owner adds one.
module: organization
roles: [owner, org-admin]
routes: [/organization]
keywords:
  [
    organization,
    owner,
    administrator,
    org admin,
    add admin,
    company,
    transfer ownership,
    billing email,
    rename organization,
  ]
related: [group-permissions, plans-and-limits, manage-subscription]
goldenQuestions:
  - question: How do I let my HR person manage all our groups?
    expectedArticles: [organization-roles]
    mustMention: [Add administrator on the Organization page, only the owner can add administrators]
  - question: Can an org admin approve vacation requests?
    expectedArticles: [organization-roles]
    mustMention: [administrators can't approve anyone's leave]
---

An organization holds your company's groups and its plan. Flexi Day creates one the first time
someone creates a group, and that person becomes its owner. The {{ui:nav.organization}} page shows
its details, plan, groups and administrators.

## The owner

The owner pays for the organization and has every right in it. Only the owner can:

- add and remove administrators;
- subscribe, change the plan, buy group slots and cancel, on the {{ui:nav.billing}} page;
- change the "{{ui:organization.billingEmailLabel}}", where subscription warnings are sent;
- run the "{{ui:organization.export.title}}" and turn the people directory on.

There is one owner per organization. Handing an organization over to someone else isn't available
yet.

## Administrators

An administrator manages every group in the organization without belonging to any of them: members
and permissions, quotas, invites, group settings and mirroring. An administrator can also rename the
organization, switch the Sick day benefit on or off, book leave for members, and see the
{{ui:nav.billing}} page without changing anything.

An administrator can't approve or reject anyone's leave and can't book their own leave in a group
they don't belong to. In such a group, the group page says you are managing it as an administrator.
To decide on requests, a person needs the Approver permission inside the group. See
[Group permissions](help:group-permissions).

## Add or remove an administrator

1. Open {{ui:nav.organization}} and find "{{ui:organization.adminsTitle}}".
2. Press "{{ui:organization.addAdmin}}" and choose someone. The list holds the people in the
   organization's groups.

"{{ui:organization.remove}}" takes the role away. An administrator who leaves their last group in
the organization loses the role too, unless the organization uses the people directory.

## More than one organization

You can work in groups of several organizations, for example as a member in your employer's and as
the owner of your own. The {{ui:nav.organization}} page has a switcher at the top for the ones you
own or administer.
