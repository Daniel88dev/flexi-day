---
id: calendar-feed
translatedFrom: "21f7024eb862"
title: Odběr volna v kalendáři Google, Outlook nebo Apple
summary: Jak vytvořit kalendářní feed svého volna nebo volna týmu, přidat ho do aplikace kalendáře a chránit jeho soukromý odkaz.
keywords:
  [
    synchronizace kalendáře,
    ics,
    ical,
    feed,
    odběr,
    odkaz k odběru,
    google kalendář,
    outlook,
    apple kalendář,
    týmový kalendář,
    vygenerovat token znovu,
    neaktualizuje se,
  ]
goldenQuestions:
  - question: Jak uvidím dovolené svého týmu v Outlooku?
    expectedArticles: [calendar-feed]
    mustMention: [stránka Synchronizace kalendáře, Záznamy mého týmu, Přihlásit se k odběru z webu]
  - question: Schválil jsem volno, ale v Google kalendáři pořád není. Proč?
    expectedArticles: [calendar-feed, calendar-direct-sync]
    mustMention: [o obnovování rozhoduje aplikace kalendáře, často jednou denně]
  - question: Někdo získal můj odkaz na kalendář. Jak ho zneplatním?
    expectedArticles: [calendar-feed]
    mustMention: [Vygenerovat token znovu, starý odkaz přestane fungovat]
---

Kalendářní feed je soukromý odkaz, který si přidáš do aplikace kalendáře. Přidáš ho jednou a schválené
volno se pak samo objevuje v kalendáři Google, Outlook nebo Apple. Feedy jsou zdarma na každém tarifu.
Nastavíš je na stránce {{ui:nav.calendarSync}}.

## Vytvoření kalendáře

1. Otevři stránku {{ui:nav.calendarSync}} a stiskni „{{ui:calSync.newCalendar}}“.
2. Pojmenuj ho.
3. V části „{{ui:calSync.builder.scopeLabel}}“ vyber „{{ui:calSync.builder.scopeMe}}“ nebo
   „{{ui:calSync.builder.scopeTeam}}“. U týmového kalendáře zaškrtni skupiny, které chceš zahrnout.
4. V části „{{ui:calSync.builder.recordTypes}}“ zapni typy volna, které chceš, a každému vyber barvu.
   Přidat můžeš i „{{ui:calSync.builder.groupEvents}}“ a „{{ui:calSync.builder.birthdays}}“.
5. Stiskni „{{ui:calSync.builder.saveNew}}“. Náhled vedle formuláře ukazuje, co feed bude obsahovat.

Kalendářů můžeš mít víc, třeba jeden pro sebe a jeden pro každý tým.

## Co feed obsahuje

- Jen schválené volno: čekající, zamítnuté a zrušené žádosti v něm nejsou.
- Posledních 12 měsíců a vše, co teprve přijde.
- V týmovém kalendáři všechny členy skupin, kde vidíš volno všech, a ve zbytku jen tvoje vlastní
  záznamy. Nemoc kolegů se zobrazí jako Pryč a jejich poznámky se nikdy neodesílají.
- Narozeniny jen těch, kdo se rozhodli je sdílet, a nikdy s věkem.

## Přidání do aplikace kalendáře

Po uložení stránka ukáže „{{ui:calSync.subscribe.linkLabel}}“ a u každé aplikace tlačítko „Přidat“:

- **{{ui:calSync.subscribe.google}}** otevře „Přidat kalendář z URL“. Kalendář se pak objeví v
  „Ostatní kalendáře“.
- **{{ui:calSync.subscribe.outlook}}** otevře „Přihlásit se k odběru z webu“. Pojmenuj ho a stiskni
  Importovat.
- **{{ui:calSync.subscribe.apple}}**: stiskni Přidat na Macu nebo iPhonu, potvrď odběr a vyber, jak
  často se má obnovovat.

Později ho přidáš přes nabídku na kartě kalendáře a „{{ui:calSync.card.copyFeedUrl}}“.

## Proč se změna ještě neukázala

Jak často aplikace kalendáře odkaz znovu načte, rozhoduje ona sama, často jen jednou denně, a Flexi
Day ji nepopožene. Změny na poslední chvíli si ověř přímo ve Flexi Day. Pokud chceš mít svoje volno v
Google nebo Microsoft kalendáři během pár sekund, použij místo toho
[přímou synchronizaci](help:calendar-direct-sync).

## Chraň svůj odkaz

Kdo má odkaz, vidí každý záznam ve feedu, takže s ním zacházej jako s heslem. Zneplatníš ho v nabídce
kalendáře přes „{{ui:calSync.card.regenerateToken}}“. Starý odkaz okamžitě přestane fungovat a každý,
kdo kalendář odebírá, potřebuje nový.

„{{ui:calSync.card.delete}}“ kalendář odstraní a feed natrvalo zastaví. Karta ukazuje, kdy si ho
aplikace naposledy stáhla.
