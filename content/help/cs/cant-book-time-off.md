---
id: cant-book-time-off
translatedFrom: "a91321ae3b8c"
title: Nejde mi zadat volno
summary: Proč je žádost o volno odmítnutá nebo formulář nejde odeslat a co v každém případě pomůže.
keywords:
  [
    nejde zadat volno,
    nejde odeslat žádost,
    žádost odmítnuta,
    chyba,
    už rezervované,
    překročení nároku,
    nemám přístup,
    jen pro čtení,
    tlačítko nejde stisknout,
    žádné skupiny,
  ]
goldenQuestions:
  - question: Píše mi to, že některé dny už jsou rezervované, ale žádnou dovolenou tam nevidím
    expectedArticles: [cant-book-time-off, request-time-off]
    mustMention: [jedna rezervace na den, počítá se i čekající žádost, nejdřív ji zruš]
  - question: Proč mi žádost hlásí, že by překročila nárok?
    expectedArticles: [cant-book-time-off, allowances]
    mustMention: [čekající žádosti se počítají, požádej správce skupiny]
  - question: Při odeslání žádosti mi vyskočí „No access for related group“
    expectedArticles: [cant-book-time-off, group-permissions]
    mustMention: [oprávnění Sledován, správce skupiny]
---

Když Flexi Day žádost odmítne, zpráva pod formulářem řekne proč. Najdi ji níže.

## „{{ui:newRequest.noGroups}}“

Volno si můžeš zadat jen ve skupině, do které patříš. Připoj se k nějaké přes pozvánku, nebo si
vytvoř vlastní. Viz [Připojení ke skupině přes pozvánku](help:join-a-group).

## „No access for related group“

K zadávání volna ve skupině potřebuješ oprávnění {{ui:groupDetail.columns.tracked}}. Kdo skupinu jen
dohlíží, ho často má vypnuté. Požádej správce skupiny, ať ti ho zapne na záložce
{{ui:groupDetail.tabs.members}}. Viz [Oprávnění ve skupině](help:group-permissions).

## Některé dny už jsou rezervované

Na jeden den můžeš mít jen jednu rezervaci, napříč všemi skupinami. Čekající žádost se počítá stejně
jako schválená. Zpráva ty dny vypíše. Zruš nebo změň žádost, která je drží, nebo vyber jiná data.
Dny ze zamítnutých nebo zrušených žádostí jsou zase volné. Viz
[Zrušení nebo změna žádosti](help:cancel-or-change-a-request).

## V rozsahu není žádný pracovní den

Flexi Day vynechává dny, kdy tvoje skupina nepracuje, a státní svátky její země. Rozsah jen z
takových dnů, třeba víkend, se odmítne. Pracovní dny skupiny si ověř u správce skupiny.

## Žádost by překročila nárok

U typů s nárokem, jako je typ {{ui:calendarRecordTypes.VACATION.label}}, tě žádost nemůže dostat přes
počet dní, které na daný rok máš. Počítají se i tvoje čekající žádosti. Kolik zbývá, ukazuje karta
„{{ui:widgets.balance.title}}“ na stránce {{ui:nav.dashboard}}.

- Zadej méně dní nebo typ bez nároku.
- Požádej správce skupiny, ať ti nárok na daný rok zvýší. Viz [Nároky](help:allowances).

Externí spolupracovníci si můžou zadat jen typy, které nečerpají z nároku, třeba typ
{{ui:calendarRecordTypes.NON_PAID_LEAVE.label}}.

## „{{ui:billing.readOnlyGroup}}“

Placený tarif organizace skončil a tahle skupina je nad limity tarifu Free, takže si v ní nikdo
nemůže zadat volno, dokud vlastník znovu nepředplatí tarif nebo se skupina nezmenší. Viz
[Když placený tarif skončí](help:lapsed-plan).

## Typ {{ui:calendarRecordTypes.SICK_DAY.label}} v nabídce není

Zobrazí se jen tam, kde má organizace na placeném tarifu zapnutý benefit zdravotního volna. Viz
[Placené zdravotní volno](help:sick-day-benefit).

## Tlačítko zůstává šedé

„{{ui:newRequest.submit}}“ čeká, dokud formulář není kompletní:

- je vybraná skupina a typ;
- datum konce je stejné nebo pozdější než datum začátku;
- u typu {{ui:calendarRecordTypes.OTHER.label}} je vyplněná poznámka.

Data musí ležet mezi 1. lednem letošního roku a 31. prosincem příštího roku.

## Zadání volna za někoho jiného

Jako správce skupiny můžeš zadat volno jen členům, kteří mají zapnuté oprávnění
{{ui:groupDetail.columns.tracked}}, a nikdy tomu, kdo smazal svůj účet. Viz
[Žádost o volno](help:request-time-off).
