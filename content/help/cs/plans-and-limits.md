---
id: plans-and-limits
translatedFrom: "e3fc68622af2"
title: Tarify, ceny a limity
summary: Co obsahují tarify Free, Pro a Enterprise, kolik stojí a jak fungují limity skupin a členů.
keywords:
  [
    cena,
    ceník,
    kolik stojí,
    tarif free,
    pro,
    enterprise,
    limity,
    kolik lidí,
    kolik skupin,
    sloty pro skupiny,
    zkušební doba,
    upgrade,
  ]
goldenQuestions:
  - question: Kolik Flexi Day stojí?
    expectedArticles: [plans-and-limits]
    mustMention: [tarif Free, Pro, Enterprise, bez DPH]
  - question: Je nás 12, můžeme zůstat na tarifu zdarma?
    expectedArticles: [plans-and-limits]
    mustMention: [Free dovoluje 10 lidí ve skupině, 3 skupiny]
  - question: Jaký tarif potřebuju na přílohy a docházku?
    expectedArticles: [plans-and-limits]
    mustMention: [Pro nebo Enterprise]
---

Každá organizace začíná na tarifu Free. Vlastník ji může převést na Pro nebo Enterprise na stránce
{{ui:nav.billing}}. Ceny jsou bez DPH, které se připočte při platbě podle tvé země.

## Tarify

| Tarif      | Cena                                                                        | Skupiny | Lidí ve skupině | Sloty navíc |
| ---------- | --------------------------------------------------------------------------- | ------- | --------------- | ----------- |
| Free       | zdarma                                                                      | 3       | 10              | žádné       |
| Pro        | {{price:PRO.monthly}} měsíčně nebo {{price:PRO.yearly}} ročně               | 5       | 25              | až 4        |
| Enterprise | {{price:ENTERPRISE.monthly}} měsíčně nebo {{price:ENTERPRISE.yearly}} ročně | 20      | 100             | až 20       |

Cena je za celou organizaci, ne za člověka. Při roční platbě ušetříš zhruba 17 %.

## Co který tarif přidává

Free pokrývá volno: skupiny, žádosti a schvalování, kvóty, reporty, export do Excelu a synchronizaci
kalendáře.

Pro a Enterprise přidávají:

- přílohy u žádostí (obrázky a PDF);
- narozeniny a akce skupiny v kalendáři skupiny;
- docházku se záznamem příchodu a odpracovaným časem;
- benefit zdravotního volna;
- AI připojení, se kterým s Flexi Day pracují aplikace jako Claude nebo ChatGPT.

Enterprise navíc přidává adresář lidí s profily zaměstnanců a Asistenta.

## Zkušební doba zdarma

První předplatné začíná zkušební dobou zdarma: 10 dní při měsíční platbě, 2 měsíce při roční.
Platit začneš dnem, kdy skončí. Organizace, která už předplatné měla, při změně tarifu novou
zkušební dobu nedostane.

## Sloty pro skupiny

Na placeném tarifu může vlastník na stránce {{ui:nav.billing}} v části „{{ui:billing.slotsTitle}}“
dokoupit sloty pro další skupiny. Každý slot přidá jednu skupinu a stojí {{price:SLOT.monthly}}
měsíčně nebo {{price:SLOT.yearly}} ročně. Sloty se účtují hned, i během zkušební doby.

## Jak se limity počítají

- **Skupiny.** Počítá se každá skupina v organizaci. Když jsou všechny využité, vytvoření skupiny
  ukáže, že skupiny v tarifu došly.
- **Lidé ve skupině.** Počítají se členové i otevřené pozvánky, takže skupina na limitu už další
  pozvánky neodešle. Místo uvolníš odebráním člena nebo zrušením pozvánky.

Karta „{{ui:billing.usageTitle}}“ na stránce {{ui:nav.billing}} ukazuje využité skupiny a velikost
každé skupiny. Počet lidí v celé organizaci omezený není.

Některé organizace mají vlastní tarif s limity dohodnutými s Flexi Day. Jejich stránka
{{ui:nav.billing}} ukazuje tyto limity.
