---
id: request-time-off
translatedFrom: "dd9afd02e239"
title: Žádost o volno
summary: Zadej si dovolenou nebo jiné volno na den či rozsah a zjisti, co se stane po odeslání.
keywords:
  [
    zadat volno,
    vzít si dovolenou,
    žádost o dovolenou,
    den volna,
    nová žádost,
    odeslat,
    už zadáno,
    zadat za někoho,
    v zastoupení,
  ]
goldenQuestions:
  - question: Jak si zadám týden dovolené?
    expectedArticles: [request-time-off]
    mustMention: [Nová žádost, Od a Do, víkendy a státní svátky se přeskočí]
  - question: Píše mi to, že některé dny už jsou zadané. Co to znamená?
    expectedArticles: [request-time-off]
    mustMention: [jeden záznam na den, nejdřív zruš původní žádost]
  - question: Můžu zadat volno za někoho z týmu?
    expectedArticles: [request-time-off]
    mustMention: [správce vybere člena v poli Pro, Rovnou schválit]
---

O volno žádáš ve skupině, ve které jsi. Žádost čeká, dokud o ní nerozhodne schvalovatel této
skupiny.

## Otevření formuláře žádosti

- V horní liště stiskni „{{ui:newRequest.trigger}}“. Pokud tvoje skupiny můžou mít akce skupiny,
  tlačítko se jmenuje „{{ui:newRequest.menu.trigger}}“; zvol „{{ui:newRequest.menu.timeOff}}“.
- Nebo v kalendáři na stránce {{ui:nav.dashboard}} klikni na den, případně na počítači táhni přes
  několik dní. Formulář se otevře s těmito daty.

## Vyplnění

1. **{{ui:newRequest.group}}**: skupina, ke které volno patří, pokud jsi ve více skupinách.
2. **{{ui:newRequest.type}}**: viz [Typy volna](help:types-of-time-off).
3. **{{ui:newRequest.from}}** a **{{ui:newRequest.to}}**: první a poslední den, oba včetně. Na jeden
   den vyber dvakrát stejné datum. Zadat jde volno od 1. ledna letošního roku do 31. prosince
   příštího.
4. Volitelně časy, půlden a poznámka. Viz [Půlden a časy](help:half-days-and-times). U typu
   {{ui:calendarRecordTypes.OTHER.label}} je poznámka povinná.
5. Stiskni „{{ui:newRequest.submit}}“.

Na placeném tarifu můžeš po odeslání žádosti přiložit soubory. Viz
[Přílohy k žádosti](help:attachments).

## Které dny se zadají

Flexi Day zadá jeden den za každý pracovní den v rozsahu. Dny, kdy skupina nepracuje, a státní
svátky její země se přeskočí a nic nestojí. Rozsah bez jediného pracovního dne aplikace odmítne.

Na jeden den můžeš mít jen jeden záznam. Pokud je některý den v rozsahu už zadaný, čekající nebo
schválený, aplikace odmítne celou žádost a vypíše ty dny. Nejdřív zruš původní žádost, nebo vyber
jiná data. Zrušené a zamítnuté dny jsou zase volné.

U typů s nárokem aplikace žádost odmítne, když by překročila, co ti na daný rok zbývá, a počítá i
tvoje čekající žádosti. Viz [Nároky](help:allowances).

## Po odeslání

Žádost má stav {{ui:status.pending}}. Schvalovatelé skupiny dostanou e-mail a upozornění v aplikaci.
Ty dostaneš upozornění, až ji někdo schválí nebo zamítne. Sledovat ji můžeš na stránce
{{ui:nav.requests}} nebo v části „{{ui:widgets.approvals.yourRequests}}“ na stránce
{{ui:nav.dashboard}}.

## Zadání volna za člena

Správci skupiny, manažer a správci organizace můžou zadat volno za někoho ze skupiny. Ve formuláři
vyber daného člověka v poli „{{ui:newRequest.forMember}}“. Volba
„{{ui:newRequest.approveImmediately}}“ je ve výchozím stavu zaškrtnutá a vytvoří žádost rovnou
schválenou tebou. Když ji odškrtneš, projde žádost běžným schvalováním; člen dostane upozornění, že
ji za něj někdo podal.
