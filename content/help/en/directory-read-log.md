---
id: directory-read-log
title: Sensitive sections and the read log
summary: Why Contact and Personal stay hidden until you press Show, what the read log records about who opened them, and who can read the log.
module: directory
roles: [member, org-admin, owner]
routes: [/directory]
tools: [show_directory_section]
keywords:
  [
    read log,
    access log,
    audit,
    who viewed my profile,
    sensitive data,
    private data,
    show,
    hidden,
    gdpr,
    privacy request,
    encrypted,
  ]
related: [directory-profiles, people-directory]
goldenQuestions:
  - question: Can I find out who looked at my home address?
    expectedArticles: [directory-read-log]
    mustMention: [read log, owner and org admins, kept 12 months]
  - question: Why does the Contact section say Hidden until you open it?
    expectedArticles: [directory-read-log]
    mustMention: [Show, recorded in the read log]
---

Contact (private phone, private email, emergency contacts) and Personal (home address, date of birth)
are the sensitive sections of a [directory profile](help:directory-profiles). They are stored
encrypted, and nobody sees their values by just opening a profile.

## Open a sensitive section

On a profile, the section reads "{{ui:directory.profile.hidden}}". Press
"{{ui:directory.profile.show}}" to see it. You can only do this where the Permission table lets you
read the section: by default the person themselves, HR, organization administrators and the owner.

Opening someone else's section is recorded in the read log, and the page says so. Opening your own
profile records nothing. Once opened, the section stays open while you stay on that person's
profile and its edit page.

## What the read log records

Each entry has who opened it, whose profile, which section, when, and the audience that allowed it,
such as HR or Org admin. It never holds the values. Exports of a person's data are logged there
too. A section opened through an AI app or the Assistant shows "{{ui:common.channel.mcp}}" or
"{{ui:common.channel.assistant}}" under the reader.

Entries are kept for 12 months and then removed. They stay even after the person is erased, as
they hold no values.

## Read the log

The owner and organization administrators open "{{ui:directory.settings.readLog}}" in
{{ui:directory.settings.tab}} on the {{ui:nav.directory}} page. Filter it by person or by reader, and
press "{{ui:directory.settings.readLogPanel.older}}" to go further back. HR can't read the log, and
the iPhone app never shows it.

While the directory is off, the owner and org admins still reach the log from the
"{{ui:organization.directory.title}}" card on the {{ui:nav.organization}} page.

## When someone asks what you hold

If a person asks who accessed their data, the read log answers it. A copy of everything their
profile holds comes from the person export, which the owner and organization administrators run
from the profile. It also lists the read log entries about them, with a purpose such as HR
administration in place of the readers' names.
