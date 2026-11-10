---
id: directory-invites
title: Add people without an account and send directory invites
summary: How to add someone to the directory who has no Flexi Day account, and how a directory invite lets them claim that profile as their own.
module: directory
roles: [org-admin, owner]
routes: [/directory]
keywords:
  [
    add person,
    add employee,
    no account,
    without account,
    directory invite,
    invite to flexi day,
    claim profile,
    onboarding,
    new hire,
    send invite again,
    invite sent,
  ]
related: [people-directory, invite-people, external-workers, directory-profiles, employment-spells]
goldenQuestions:
  - question: Can I add an employee to the directory before they have an account?
    expectedArticles: [directory-invites]
    mustMention: [Add person, No account, Enterprise]
  - question: How does a person I added get access to their own profile?
    expectedArticles: [directory-invites]
    mustMention: [Send invite, email on the profile, valid 14 days]
  - question: The new hire signed up with the same email but isn't linked to their profile. Why?
    expectedArticles: [directory-invites]
    mustMention: [only an invite links the profile, signing up alone doesn't]
---

The directory can hold people who have no Flexi Day account yet, such as a new hire before their
first day or someone who never books leave. A directory invite later lets them take over that
profile with their own account.

## Add a person

1. Open {{ui:nav.directory}} and press "{{ui:directory.addPerson.action}}".
2. Enter their name and choose a worker type: "{{ui:directory.addPerson.employee}}" or
   "{{ui:directory.addPerson.external}}".
3. Fill in the card if you like: job title, department, location and who they report to.
4. Add an email if you plan to invite them. It must not belong to anyone else in the organization.
5. Press "{{ui:directory.addPerson.confirm}}". Their profile opens, and you fill in the rest there.

The owner, HR and organization administrators can add people by default, on the Enterprise plan.
The person is marked "{{ui:directory.markers.NO_ACCOUNT}}" for the owner, org admins and HR.

Until they have an account, they are in no group: nobody books leave for them, gives them an
allowance or enters attendance, they get no notifications, and they don't count toward the plan's
member limits.

## Send a directory invite

1. Open their profile. If it has no email yet, add one with "{{ui:directory.invite.addEmail}}".
2. Press "{{ui:directory.invite.action}}".
3. Optionally pick a group under "{{ui:directory.invite.group}}"; they join it when they accept.
4. Press "{{ui:directory.invite.confirm}}".

The email names the organization and carries the link, valid for 14 days. While it is open the
profile shows "{{ui:directory.markers.INVITE_SENT}}". "{{ui:directory.invite.again}}" withdraws the
earlier invite, and so does changing the email on the profile.

## Claiming the profile

Accepting the invite creates their account or signs them in, and the profile becomes theirs. From
then on its name and email follow their account.

- Only an invite links a profile. Someone who signs up with the same email without the invite is
  not linked, and joining the organization another way with that email is refused until the profile
  is claimed or the email changes.
- An ordinary group invite sent to the same address claims the profile too.
- If the person already has an employment in the organization, the claim is refused and an admin
  sorts out the duplicate.
- An invite stops working once the person's employment ends or the profile gets an account.

Turning the directory off withdraws open invites that name no group; invites to a group stay valid.
For inviting people straight into a group, see [Invite people](help:invite-people).
