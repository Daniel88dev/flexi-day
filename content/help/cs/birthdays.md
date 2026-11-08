---
id: birthdays
translatedFrom: "0ddaae0cd186"
title: Přidání narozenin a jejich sdílení se skupinami
summary: Jak uložit narozeniny v Nastavení, rozhodnout, jestli je skupiny uvidí i s tvým věkem, a kde se sdílené narozeniny zobrazují.
keywords:
  [
    narozeniny,
    datum narození,
    věk,
    sdílet narozeniny,
    skrýt narozeniny,
    dort,
    narozeniny kolegy,
    odebrat narozeniny,
  ]
goldenQuestions:
  - question: Jak udělám, aby se moje narozeniny ukázaly v kalendáři týmu?
    expectedArticles: [birthdays]
    mustMention: [karta Narozeniny v Nastavení, Sdílet moje narozeniny se skupinami, placený tarif]
  - question: Můžu sdílet narozeniny tak, aby nikdo neviděl, kolik mi je?
    expectedArticles: [birthdays]
    mustMention: [nech rok prázdný, rok ukáže tvůj věk]
  - question: Proč na přehledu nevidím narozeniny kolegyně?
    expectedArticles: [birthdays, cant-see-someone]
    mustMention: [rozhodla se je sdílet, zobrazená skupina]
---

Narozeniny si můžeš přidat v {{ui:nav.settings}}. Ve tvém vlastním kalendáři se zobrazí vždy, tvoje
skupiny je uvidí, jen pokud je sdílíš.

## Přidání narozenin

1. Otevři {{ui:nav.settings}} a najdi kartu „{{ui:settings.birthday.title}}“.
2. Vyber pole „{{ui:settings.birthday.day}}“ a „{{ui:settings.birthday.month}}“.
3. Pole „{{ui:settings.birthday.year}}“ je nepovinné. S rokem uvidí každý, kdo tvoje narozeniny vidí
   v kalendáři, i věk, kterého se dožíváš. Nech ho prázdné a věk zůstane jen tvůj.
4. Ulož.

Narozeniny 29. února se v ostatních letech zobrazí 28. února. Uložit je jde na každém tarifu.

## Sdílení se skupinami

Zapni „{{ui:settings.birthday.share}}“ a ulož. Přepínač potřebuje aspoň jednu tvoji skupinu na
placeném tarifu: Pro, Enterprise nebo individuálním. Bez ní to karta napíše a narozeniny zůstanou
jen ve tvém kalendáři.

Panel „{{ui:settings.birthday.panelTitle}}“ vedle formuláře ukazuje, kde se tvoje narozeniny právě
zobrazují:

- **{{ui:settings.birthday.yourCalendar}}**: vždy, s věkem, pokud jsi uložil rok.
- **{{ui:settings.birthday.groupCalendar}}**: skupiny, které je uvidí, jakmile je sdílíš.
- **{{ui:settings.birthday.teamFeeds}}**: týmové kalendářní feedy obsahují sdílené narozeniny, nikdy
  s věkem.
- **{{ui:settings.birthday.colleaguesCalendars}}**: nikdy. Přímá synchronizace zapisuje jen tvoje
  narozeniny do tvého vlastního kalendáře.

Když přepínač vypneš nebo stiskneš „{{ui:settings.birthday.remove}}“, tvoje narozeniny zmizí ze
všech kalendářů skupin.

## Kdo sdílené narozeniny vidí

Sdílené narozeniny se zobrazují s dortem v kalendáři na stránce {{ui:nav.dashboard}} a v aplikaci
pro iPhone.

- Když máš v poli „{{ui:dashboard.scope.label}}“ zvoleno „{{ui:dashboard.scope.mine}}“, vidíš jen
  svoje narozeniny.
- Když zobrazíš skupinu, vidíš i sdílené narozeniny jejích členů. Zobrazit skupinu jde jen s
  oprávněním {{ui:groupDetail.columns.view}}.
- Vidí je jen ostatní členové. Správce organizace, který ve skupině není, je nevidí.
- Skupina, jejíž organizace nikdy neměla placený tarif, sdílené narozeniny neukazuje.

O narozeninách nikdo nedostane oznámení ani e-mail.

## Když placený tarif skončí

Pokud tvoje skupiny přijdou o placený tarif, narozeniny, které už sdílíš, se tam dál zobrazují.
Sdílení můžeš vypnout, ale znovu ho zapneš jen se skupinou na placeném tarifu.

## Narozeniny v aplikaci kalendáře

Kalendářní feed nebo přímá synchronizace mohou obsahovat narozeniny. Viz
[Odběr volna v kalendáři Google, Outlook nebo Apple](help:calendar-feed).
