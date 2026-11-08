---
id: calendar-direct-sync
translatedFrom: "189017bec52b"
title: Přímá synchronizace volna do kalendáře Google nebo Microsoft
summary: Jak přímá synchronizace zapíše tvoje schválené volno do kalendáře Google nebo Microsoft během pár sekund, jaký tarif potřebuje a jak opravit synchronizaci, která se zastavila.
keywords:
  [
    přímá synchronizace,
    připojit google,
    připojit microsoft,
    outlook,
    microsoft 365,
    google workspace,
    mimo kancelář,
    pracovní místo,
    nutné znovu připojit,
    synchronizace selhala,
    pozastaveno,
    odpojit,
  ]
goldenQuestions:
  - question: Umí Flexi Day nastavit v Outlooku Mimo kancelář, když mi schválí dovolenou?
    expectedArticles: [calendar-direct-sync]
    mustMention: [Připojit Microsoft, kalendář Pouze moje záznamy, placený tarif]
  - question: Synchronizace kalendáře hlásí Nutné znovu připojit. Co mám dělat?
    expectedArticles: [calendar-direct-sync]
    mustMention: [Znovu připojit, události v kalendáři zůstanou]
  - question: Proč nemůžu připojit Google k týmovému kalendáři?
    expectedArticles: [calendar-direct-sync, calendar-feed]
    mustMention: [záznamy kolegů se nikdy nesynchronizují, použij odkaz k odběru]
---

Přímá synchronizace zapíše tvoje vlastní schválené volno do kalendáře Google nebo Microsoft během pár
sekund od změny, bez čekání, až si aplikace kalendáře znovu načte feed. Potřebuje placený tarif:
aspoň jedna z tvých skupin musí patřit organizaci s tarifem Pro nebo Enterprise.

## Připojení kalendáře

1. Otevři stránku {{ui:nav.calendarSync}} a vytvoř kalendář s volbou „{{ui:calSync.builder.scopeMe}}“, nebo
   použij existující. Viz [Odběr volna v kalendáři](help:calendar-feed).
2. V části „{{ui:calSync.connect.label}}“ na jeho kartě stiskni „Připojit Google“ nebo „Připojit
   Microsoft“.
3. Přihlas se u poskytovatele a povol přístup ke kalendáři.

Po návratu do Flexi Day karta po první synchronizaci ukáže „{{ui:calSync.connect.chips.synced}}“.
Kalendář se synchronizuje vždy jen s jedním poskytovatelem.

Týmové kalendáře připojit nejde. Dny kolegů se nikdy nezapisují do osobního kalendáře; na ně použij
odkaz k odběru.

## Co se zapisuje

- Tvoje schválené volno od 12 měsíců zpět a vše, co teprve přijde, do tvého hlavního kalendáře. Podle
  něj sdílení ve tvé organizaci ukazuje kolegům, kdy jsi pryč.
- Se zapnutou volbou „{{ui:calSync.builder.groupEvents}}“ události všech tvých skupin. Se zapnutou
  volbou „{{ui:calSync.builder.birthdays}}“ jen tvoje vlastní narozeniny.
- Názvy událostí jsou v jazyce, ve kterém používáš Flexi Day.

Jak absence vypadá, záleží na účtu:

- **Google Workspace (Business Standard nebo vyšší):** celodenní absence se zobrazí jako štítek místa
  s typem absence, absence na část dne jako Mimo kancelář a Home office nastaví tvoje pracovní místo
  na Domov.
- **Osobní Gmail a ostatní účty Google:** absence se zobrazí jako události Zaneprázdněn. Home office
  se nesynchronizuje.
- **Microsoft:** absence se zobrazí jako Mimo kancelář. Home office se nesynchronizuje.

Flexi Day mění jen události, které sám zapsal. Docházka a narozeniny kolegů se nikdy nezapisují.

## Ovládání synchronizace

Připojená karta ukazuje „{{ui:calSync.connect.timeZone}}“ pro absence na část dne; tam ho i změníš.
Nabídka „…“ vedle něj obsahuje:

- **„{{ui:calSync.connect.syncNow}}“**, které hned spustí synchronizaci.
- **„{{ui:calSync.connect.disconnect}}“**, které z kalendáře odstraní všechny události zapsané Flexi
  Day a nic jiného.

## Když se synchronizace zastaví

| Karta ukazuje                                 | Co dělat                                                                                                      |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| „{{ui:calSync.connect.chips.needsReconnect}}“ | Poskytovatel ukončil přístup. Stiskni „{{ui:calSync.connect.reconnect}}“; události v kalendáři zůstanou.      |
| „{{ui:calSync.connect.chips.paused}}“         | Nemáš žádný placený tarif. Nic se nezapisuje ani nemaže; synchronizace pokračuje, jakmile bude tarif aktivní. |
| „{{ui:calSync.connect.chips.failed}}“         | Poslední pokus selhal. Stiskni „{{ui:calSync.connect.syncNow}}“ a zkus to znovu.                              |

Pokud Microsoft hlásí, že Flexi Day musí schválit správce, schválí ho IT správce tvé firmy jednou a
pak se připojíš znovu.
