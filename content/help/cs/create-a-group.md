---
id: create-a-group
translatedFrom: "cfa502820ff0"
title: Vytvoření skupiny pro tým
summary: Vytvoř skupinu, nastav její výchozí nároky a zjisti, k čemu skupina slouží.
keywords:
  [vytvořit skupinu, nová skupina, tým, oddělení, pobočka, založit, přidat tým, limit skupin]
goldenQuestions:
  - question: Jak ve Flexi Day založím nový tým?
    expectedArticles: [create-a-group]
    mustMention: [Vytvořit skupinu na stránce Skupiny, staneš se jejím manažerem]
  - question: Proč nemůžu vytvořit další skupinu?
    expectedArticles: [create-a-group, plans-and-limits]
    mustMention: [limit skupin v tarifu, sloty pro další skupiny]
---

Skupina je jednotka, ve které Flexi Day sleduje volno, obvykle tým nebo pobočka. Každá skupina má
své členy, schvalovatele, pracovní dny, státní svátky a nároky. Člověk může být v několika
skupinách.

## Vytvoření skupiny

1. Otevři {{ui:nav.groups}}.
2. V části „{{ui:groups.createTitle}}“ zadej „{{ui:groups.nameLabel}}“.
3. Nastav „{{ui:groups.defaultVacation}}“ a „{{ui:groups.defaultHomeOffice}}“: roční nároky, se
   kterými noví členové začínají. Formulář navrhuje 20 a 60.
4. Stiskni „{{ui:groups.create}}“.

Staneš se manažerem skupiny: spravuješ ji a schvaluješ její žádosti. Tvůj vlastní letošní nárok se
otevře podle výchozích hodnot.

## Do které organizace patří

Nová skupina vždy patří do tvé vlastní organizace. Pokud ji ještě nemáš, Flexi Day ji založí na
tarifu Free a ty se staneš jejím vlastníkem. Na tom nic nemění, že jsi správcem cizí organizace:
skupina, kterou vytvoříš, skončí v té tvojí.

## Limity skupin

Každý tarif dovoluje určitý počet skupin: 3 na Free, 5 na Pro a 20 na Enterprise, plus případné
sloty navíc. Když jsou všechny využité, formulář to řekne. Vlastník může přejít na vyšší tarif nebo
koupit slot na stránce {{ui:nav.billing}}. Viz [Tarify, ceny a limity](help:plans-and-limits).

## Další kroky

- Pozvi svůj tým. Viz [Pozvání lidí do skupiny](help:invite-people).
- Nastav pracovní dny a zemi státních svátků. Viz
  [Pracovní dny a státní svátky](help:group-settings).
- Dej lidem správná oprávnění. Viz [Oprávnění ve skupině](help:group-permissions).

Každá karta skupiny na stránce {{ui:nav.groups}} ukazuje tvou roli v ní a vede do záložek
{{ui:groupDetail.tabs.members}}, {{ui:groupDetail.tabs.quotas}}, {{ui:groupDetail.tabs.invites}} a
{{ui:groupDetail.tabs.settings}}.

## Přejmenování, smazání nebo opuštění skupiny

Aplikace nemá tlačítko pro přejmenování ani smazání skupiny, ani pro to, abys ji sám opustil.
Správce skupiny může člena odebrat; viz [Oprávnění ve skupině](help:group-permissions).
