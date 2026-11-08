---
id: cant-see-someone
translatedFrom: "d748b65e2b2a"
title: Nevidím někoho nebo jeho volno
summary: Proč ti v zobrazení chybí kolega, jeho volno, narozeniny nebo docházka a kdo to může změnit.
keywords:
  [
    nevidím,
    chybí,
    nezobrazuje se,
    chybí kolega,
    prázdný kalendář týmu,
    jen moje dovolená,
    skryté,
    kde je,
    neviditelný,
  ]
goldenQuestions:
  - question: Kalendář ukazuje jen moji dovolenou, kde je zbytek týmu?
    expectedArticles: [cant-see-someone, dashboard-calendar]
    mustMention: [přepni Zobrazit na Skupina, oprávnění Zobrazení]
  - question: Kolega je v jiném týmu, proč nevidím, kdy má volno?
    expectedArticles: [cant-see-someone, mirroring]
    mustMention: [jen skupiny, do kterých patříš, zrcadlení]
  - question: Proč se nemoc kolegy zobrazuje jako Pryč?
    expectedArticles: [cant-see-someone, who-sees-your-time-off]
    mustMention: [Nemoc vidí kolegové jako Pryč]
---

Co ve Flexi Day vidíš, se řídí skupinami, do kterých patříš, a oprávněními, která v nich máš. Najdi
níže, co ti chybí.

## Kalendář ukazuje jen tebe

- **V poli „{{ui:dashboard.scope.label}}“ máš zvoleno „{{ui:dashboard.scope.mine}}“.** Přepni ho na
  „{{ui:dashboard.scope.group}}“ a vyber skupinu. Aby se přehled takhle otevíral pokaždé, viz
  [Změna nastavení](help:account-settings).
- **Ve skupině nemáš oprávnění {{ui:groupDetail.columns.view}}.** Bez něj tam vidíš jen svoje volno
  a na přehledu ti skupina není nabídnutá. Zapnout ti ho může správce skupiny. Viz
  [Oprávnění ve skupině](help:group-permissions).

## Ten člověk je v jiné skupině

Vidíš volno skupin, do kterých patříš. Někdo z jiné skupiny se ti nezobrazí, ani když je ze stejné
organizace. Pokud ho tvůj tým potřebuje vidět, správce skupiny může jeho volno do vaší skupiny
zrcadlit. Viz [Zrcadlení volna z jiné skupiny](help:mirroring).

## Žádost chybí nebo vypadá jinak

- **Zamítnuté a zrušené žádosti** kolegové nikdy nevidí.
- **Typ {{ui:calendarRecordTypes.SICK.label}}** vidí kolegové jako
  „{{ui:calendarRecordTypes.AWAY.label}}“. Skutečný typ vidí jen schvalovatelé a správci skupiny.
- **Filtr typů volna** ji může skrývat. Zkontroluj „{{ui:dashboard.filter.label}}“ na přehledu.
- **Kalendářní feedy** obsahují jen schválené volno a tvoje aplikace kalendáře je obnovuje podle
  sebe. Viz [Odběr volna v kalendáři Google, Outlook nebo Apple](help:calendar-feed).

Všechna pravidla najdeš v článku [Kdo vidí tvoje volno](help:who-sees-your-time-off).

## Ten člověk ze skupiny odešel

Když někoho ze skupiny odeberou, jeho čekající žádosti a budoucí rezervace v ní se zruší, takže
ty dny zmizí. Jeho minulé dny zůstanou.

## Chybí narozeniny

Narozeniny kolegy uvidíš, jen když se je rozhodl sdílet, oba jste členy skupiny, kterou si
prohlížíš, a organizace skupiny měla placený tarif. Viz
[Přidání narozenin a jejich sdílení](help:birthdays).

## Docházka

Stránka {{ui:nav.teamAttendance}} ukazuje jen lidi, které spravuješ jako správce skupiny nebo správce
organizace, a nikdy externí spolupracovníky. Členové docházku jeden druhého nevidí. Viz
[Docházka týmu a její opravy](help:team-attendance).

## Adresář lidí

Adresář je na tarifu Enterprise a zapíná ho vlastník. Které části profilu vidíš, určuje tabulka
oprávnění organizace: kolegové ve výchozím stavu vidí kartu, fotku a pracovní kontakt, ne pracovní
údaje, kontakt ani osobní údaje. Viz [Zapnutí adresáře lidí a kdo co vidí](help:people-directory).
