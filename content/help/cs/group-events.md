---
id: group-events
translatedFrom: "c713ab4cfeff"
title: Přidání skupinové události do kalendáře týmu
summary: Jak dát do kalendáře skupiny poradu, výjezd nebo pravidelný týmový den a jak změnit či smazat jeden termín, následující nebo všechny.
keywords:
  [
    skupinová událost,
    týmová akce,
    porada,
    schůzka,
    výjezd,
    teambuilding,
    opakovaná událost,
    opakování,
    týdenní porada,
    smazat událost,
    upravit událost,
  ]
goldenQuestions:
  - question: Jak dám naši týdenní poradu do kalendáře pro celý tým?
    expectedArticles: [group-events]
    mustMention: [Nová skupinová událost, Opakování, Týdně]
  - question: Proč nemůžu upravit událost, kterou přidal kolega?
    expectedArticles: [group-events]
    mustMention: [jen ten, kdo ji přidal, nebo správce skupiny]
  - question: Jdou skupinové události přidávat i na tarifu Free?
    expectedArticles: [group-events, plans-and-limits]
    mustMention: [placený tarif, stávající události zůstanou]
---

Skupinová událost je termín v kalendáři skupiny, který není ničím volnem: týmová porada, výjezd, den
vydání. Všichni ve skupině ji vidí v kalendáři na stránce {{ui:nav.dashboard}} a v aplikaci pro
iPhone.

## Kdo ji může přidat

Skupinovou událost může přidat kterýkoli člen skupiny, i bez oprávnění
{{ui:groupDetail.columns.view}}, a také správci skupiny. Organizace skupiny musí mít placený tarif: Pro, Enterprise nebo individuální tarif, včetně
ochranné lhůty. Pokud do žádné z tvých skupin událost přidat nejde, tlačítko a položky menu pro ni se
nezobrazí.

## Přidání skupinové události

1. V horní liště stiskni „{{ui:newRequest.menu.trigger}}“ a vyber
   „{{ui:newRequest.menu.groupEvent}}“. Na stránce {{ui:nav.dashboard}} můžeš také kliknout na den
   pravým tlačítkem a vybrat „{{ui:newRequest.menu.newGroupEvent}}“, nebo vybrat den a použít
   tlačítko pod ním.
2. Vyplň pole „{{ui:groupEvents.title}}“, nejvýš 100 znaků, a vyber skupinu v poli
   „{{ui:groupEvents.group}}“.
3. Nastav datum. Jednorázová událost může trvat několik dní, od pole „{{ui:groupEvents.from}}“ do
   pole „{{ui:groupEvents.until}}“.
4. Nech zapnuté „{{ui:calendar.groupEvent.allDay}}“, nebo ho vypni a nastav
   „{{ui:groupEvents.starts}}“ a „{{ui:groupEvents.ends}}“.
5. Pokud chceš, doplň pole „{{ui:groupEvents.note}}“, nejvýš 1 000 znaků.
6. Stiskni „{{ui:groupEvents.create}}“.

## Opakování

V poli „{{ui:groupEvents.repeat.label}}“ vyber „{{ui:groupEvents.repeat.daily}}“,
„{{ui:groupEvents.repeat.weekly}}“, „{{ui:groupEvents.repeat.monthly}}“ nebo
„{{ui:groupEvents.repeat.yearly}}“ a jak často: jednou za 1 až 99 dní, týdnů, měsíců nebo let.

- **{{ui:groupEvents.repeat.weekly}}** se opakuje ve dnech, které zaškrtneš. Den v týdnu, kdy událost
  začíná, je mezi nimi vždy.
- **{{ui:groupEvents.repeat.monthly}}** se opakuje ve stejný den v měsíci, nebo ve stejný den v týdnu,
  třeba 2. úterý nebo poslední pátek. Den, který měsíc nemá, připadne na jeho poslední den.
- **{{ui:groupEvents.repeat.endsLabel}}**: „{{ui:groupEvents.repeat.endsNever}}“ nebo
  „{{ui:groupEvents.repeat.endsOnDate}}“.

„{{ui:groupEvents.repeat.nextDates}}“ ukazují dalších šest termínů. Opakovaná událost trvá jeden den,
takže nemůže zároveň trvat několik dní.

## Změna nebo smazání události

Vyber den v kalendáři a uvidíš jeho skupinové události jako karty, každou s tlačítky
„{{ui:calendar.groupEvent.edit}}“ a „{{ui:calendar.groupEvent.delete}}“. Na počítači můžeš na den
kliknout i pravým tlačítkem.

Změnit nebo smazat událost může jen ten, kdo ji přidal, dokud je ve skupině, a správci skupiny.
Ostatním karta řekne, kdo to může.

U opakované události se Flexi Day zeptá, na které termíny se změna použije:

- **„{{ui:groupEvents.scope.thisEvent}}“**: jen vybraný den. Na kartě pak stojí
  „{{ui:calendar.groupEvent.changedOnce}}“.
- **„{{ui:groupEvents.scope.following}}“**: ten den a všechny pozdější. Dřívější termíny zůstanou.
- **„{{ui:groupEvents.scope.all}}“**: všechny termíny, i ty minulé.

Změna pravidla opakování nebo začátku pro všechny termíny zahodí změny jednotlivých dní. Flexi Day je
spočítá a nejdřív tě upozorní.

Smazání nejde vrátit. Událost zmizí ze všech kalendářů, včetně kalendářních feedů a
synchronizovaných kalendářů Google nebo Microsoft.

## Když placený tarif skončí

Ve skupině, které skončil placený tarif, zůstanou stávající události v kalendáři a dají se dál
upravovat i mazat. Nové události přidat nejde, stejně jako úpravu, která zakládá novou řadu termínů
nebo z jednorázové události dělá opakovanou. Viz [Když placený tarif skončí](help:lapsed-plan).

## Kde je ještě uvidíš

- Kalendářní feedy a přímá synchronizace mohou skupinové události obsahovat. Viz
  [Odběr volna v kalendáři Google, Outlook nebo Apple](help:calendar-feed) a
  [Přímá synchronizace volna do kalendáře Google nebo Microsoft](help:calendar-direct-sync).
- Přidání, změna ani smazání skupinové události neposílá žádný e-mail ani oznámení.
