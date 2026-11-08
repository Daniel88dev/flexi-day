---
id: external-workers
translatedFrom: "b9214d58764a"
title: Externí spolupracovníci
summary: Co se mění pro člověka označeného jako externí spolupracovník (žádná docházka, žádné nároky, menší profil) a jak změnit typ pracovníka.
keywords:
  [
    externí spolupracovník,
    externista,
    dodavatel,
    osvč,
    živnostník,
    freelancer,
    konzultant,
    brigádník,
    typ pracovníka,
    zaměstnanec,
    změnit typ pracovníka,
    žádný nárok,
    nemůžu zaznamenat příchod,
  ]
goldenQuestions:
  - question: Jak přidám freelancera, který nemá mít nárok na dovolenou?
    expectedArticles: [external-workers, directory-invites]
    mustMention: [Externí spolupracovník, nároky se nastaví na nulu]
  - question: Proč nemůžu zaznamenat příchod? Píše to, že externí pracovníci docházku nevedou.
    expectedArticles: [external-workers]
    mustMention: [externí spolupracovníci příchod nezaznamenávají, žádný požadovaný čas]
  - question: Jak změním externistu na běžného zaměstnance?
    expectedArticles: [external-workers]
    mustMention: [Změnit typ pracovníka, nastavit nároky znovu]
---

Každý v [adresáři lidí](help:people-directory) je buď zaměstnanec, nebo externí spolupracovník: někdo,
kdo pro organizaci pracuje příležitostně, na konkrétních úkolech. Profil i seznam v adresáři označují
externí spolupracovníky „{{ui:directory.markers.EXTERNAL_WORKER}}“ pro každého, kdo je vidí.

## Co je pro externího spolupracovníka jinak

- **Docházka:** nemůže zaznamenat příchod, nemá žádný požadovaný čas a nezobrazuje se na stránce
  {{ui:nav.teamAttendance}}. Jeho dřívější historie zůstane čitelná.
- **Nároky:** jeho nároky na {{ui:calendarRecordTypes.VACATION.label}},
  {{ui:calendarRecordTypes.HOME_OFFICE.label}} a {{ui:calendarRecordTypes.SICK_DAY.label}} jsou nulové
  a na přelomu roku se nic nepřevádí. Zadat si může jen typy volna, které z žádného nároku nečerpají.
- **Profil:** typ smlouvy, úvazek, konec zkušební doby a celá sekce Osobní údaje pro něj neplatí.
- **Co vidí:** podle výchozí tabulky oprávnění čte externí spolupracovník u kolegů jen Kartu a
  Fotografii, ne jejich pracovní kontakt.

Skupiny, kalendáře, reporty, upozornění a narozeniny fungují stejně jako u zaměstnanců.

## Změna typu pracovníka

1. Otevři profil člověka v části {{ui:nav.directory}}.
2. Stiskni „{{ui:directory.workerType.action}}“.
3. Přečti si, co se změní, a potvrď.

Ve výchozím stavu to může vlastník, HR a správci organizace. Adresář musí být zapnutý, tarif na tom
nezáleží a jde to jen u člověka, který je pořád zaměstnaný.

**Ze zaměstnance na externího spolupracovníka** se hned smaže typ smlouvy, úvazek, konec zkušební
doby, celá sekce Osobní údaje a případný vlastní požadovaný čas. Jeho nároky ve skupinách organizace
se od letoška nastaví na nulu. Směnu, která mu běží, ukončit jde.

**Z externího spolupracovníka na zaměstnance** se nic neobnoví. Smazaná pole začínají prázdná a
nároky zůstanou nulové, dokud je správce skupiny znovu nenastaví; viz [Nároky](help:allowances).

## Přidání externího spolupracovníka

Když přidáváš člověka bez účtu, vyber jako typ pracovníka „{{ui:directory.addPerson.external}}“. Viz
[Přidání lidí a pozvánky do adresáře](help:directory-invites).
