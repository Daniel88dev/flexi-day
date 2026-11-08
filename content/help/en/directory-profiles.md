---
id: directory-profiles
title: Directory profiles, photos, departments and locations
summary: What each section of a directory profile holds, how to edit your own or someone else's profile and photo, and how departments and locations work.
module: directory
roles: [member, group-admin, org-admin, owner]
routes: [/directory/person, /directory/person/edit]
tools: [get_directory_profile, show_directory_section]
keywords:
  [
    profile,
    edit profile,
    job title,
    department,
    location,
    reports to,
    manager,
    work phone,
    work email,
    emergency contact,
    home address,
    date of birth,
    profile photo,
    employee number,
    contract type,
    profile history,
  ]
related: [people-directory, directory-read-log, employment-spells, external-workers]
goldenQuestions:
  - question: How do I add my emergency contact in Flexi Day?
    expectedArticles: [directory-profiles]
    mustMention: [Edit profile, Contact section]
  - question: Where do I change someone's department?
    expectedArticles: [directory-profiles]
    mustMention: [Card section, Departments and locations in Directory settings]
  - question: Is the profile photo the same as my account picture?
    expectedArticles: [directory-profiles]
    mustMention: [directory pages only, other screens keep the account picture]
---

Each person in the [people directory](help:people-directory) has a profile, split into six
sections. What you see and can change in each depends on the organization's Permission table.

## The sections

| Section                                        | Holds                                                                                               |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| {{ui:directory.history.sections.CARD}}         | Name, job title, department, location and who the person reports to                                 |
| {{ui:directory.history.sections.PHOTO}}        | The profile photo                                                                                   |
| {{ui:directory.history.sections.WORK_CONTACT}} | Work email and work phone                                                                           |
| {{ui:directory.history.sections.JOB}}          | Legal name, employee number, start and leaving dates, probation end, contract type and working time |
| {{ui:directory.history.sections.CONTACT}}      | Private phone and email, two emergency contacts                                                     |
| {{ui:directory.history.sections.PERSONAL}}     | Home address and date of birth                                                                      |

{{ui:directory.history.sections.CONTACT}} and {{ui:directory.history.sections.PERSONAL}} are the
sensitive sections: they are encrypted and stay hidden until you press
"{{ui:directory.profile.show}}". See [The read log](help:directory-read-log).

Probation, contract type, working time and the {{ui:directory.history.sections.PERSONAL}} section
apply to employees only, not to [external workers](help:external-workers).

## Edit a profile

1. Open the person under {{ui:nav.directory}}, or your own profile.
2. Press "{{ui:directory.profile.edit}}".
3. Change the sections marked "{{ui:directory.edit.editable}}" and press
   "{{ui:directory.edit.save}}".

Sections you may only read are shown greyed. A few rules:

- The name of someone with an account comes from their account; it can be edited only for a person
  without one.
- Work email is separate from the sign-in email, and colleagues see this one.
- Phones are one number in international form, with no extension.
- Reports to is informational and grants nothing.
- The leaving date is informational too: it ends nothing.
- The employee number must be unique among current staff.
- An emergency contact needs both a name and a phone.

"{{ui:directory.profile.history}}" lists who changed which fields and when, never the values. The
owner, organization administrators and HR can open it.

## Profile photo

On the edit page, press "{{ui:directory.edit.photo.upload}}" and pick a PNG, JPEG, WebP or HEIC
image of at most 10 MB. It saves at once. The photo shows on directory pages only; the calendar,
reports and attendance keep the account picture. Location data is stripped, and photos are never
used for face recognition. By default you, HR and org admins can change it.

## Departments and locations

Each organization keeps its own lists, under "{{ui:directory.settings.lists}}" in
{{ui:directory.settings.tab}}. A person holds at most one of each. They aren't tied to groups, and a
location's country only sets where its people's phone numbers start.

An entry someone holds can't be deleted; archive it instead. An archived entry leaves the pickers,
and people who hold it keep it, shown as "(archived)". The owner, HR and org admins manage the lists
by default.

## On a lapsed plan

Without Enterprise the directory stays readable, and values can be cleared but not set.
