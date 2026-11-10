---
id: employment-spells
title: End someone's employment, and when they come back
summary: How an employment starts and ends with and without the directory, what End employment changes, where people who left are listed, and how a returning person's new spell can copy from the old one.
module: directory
roles: [org-admin, owner]
routes: [/directory/person]
keywords:
  [
    end employment,
    leaver,
    offboarding,
    someone left,
    termination,
    last day,
    former,
    former employees,
    rehire,
    rejoin,
    returning employee,
    spell,
    copy from previous spell,
    no group,
  ]
related:
  [people-directory, directory-profiles, external-workers, group-permissions, organization-roles]
goldenQuestions:
  - question: An employee is leaving. How do I offboard them in Flexi Day?
    expectedArticles: [employment-spells]
    mustMention: [End employment, Last day, upcoming bookings are cancelled]
  - question: A former employee came back. Can I reuse their old profile?
    expectedArticles: [employment-spells]
    mustMention:
      [new spell starts empty, Copy from previous spell, Contact Personal and Profile photo]
  - question: I removed someone from their last group but they still show in the directory. Why?
    expectedArticles: [employment-spells]
    mustMention: [removing someone from a group no longer ends their employment, End employment]
---

An employment is one person's time working for one organization. It starts when they first join one
of its groups or are added to the directory, and it carries their attendance and directory profile.
One stretch from start to end is called a spell.

## How an employment ends

- **Without the directory:** it ends by itself when the person loses their last link to the
  organization, such as being removed from their last group. The owner and organization
  administrators can also end it from the "{{ui:organization.people.title}}" card on the
  {{ui:nav.organization}} page.
- **With the directory on:** removing someone from a group never ends their employment. They stay
  employed, in no group, until someone ends it by hand. The owner and org admins find them with the
  "{{ui:directory.noGroupFilter}}" filter on the directory page.

## End employment

1. Open the person's profile under {{ui:nav.directory}}.
2. Press "{{ui:directory.end.action}}" ("{{ui:directory.end.actionExternal}}" for an external
   worker).
3. Pick the "{{ui:directory.end.dateLabel}}": today or earlier, and not before they started. A
   leaving date on their profile is suggested.
4. Read what will change and confirm.

Ending, all at once:

- removes them from every group of the organization and from approver slots;
- cancels their pending requests and their upcoming bookings; past bookings stay;
- ends their org admin access and their HR or Leadership role;
- clears "Reports to" on everyone who reported to them;
- removes the sections whose retention is set to end with the employment.

The owner, HR and organization administrators can end an employment by default. The owner's own
employment can't be ended, and someone who manages a group needs another manager for it first. No
plan is needed.

## People who left

The "{{ui:directory.former}}" tab lists ended spells, most recent first, for the owner, organization
administrators and HR. Their profiles stay readable to them, and what is kept is governed by the
organization's retention periods.

## When someone comes back

A person who rejoins starts a new spell with an empty profile, marked
"{{ui:directory.markers.REJOINED}}" for the owner, organization administrators and HR. The earlier
spell stays in "{{ui:directory.former}}".

On the new profile, a banner offers "{{ui:directory.copySpell.action}}". It copies Contact,
Personal and the Profile photo from the previous spell, as far as retention kept them. Card, Work
contact and Job never carry over, and a section the new spell already holds is never overwritten.
The owner, organization administrators and HR can copy.
