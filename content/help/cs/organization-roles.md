---
id: organization-roles
translatedFrom: "f8754381c0a5"
title: Vlastník a správci organizace
summary: Kdo organizaci vlastní, co správce smí a nesmí a jak ho vlastník přidá.
keywords:
  [
    organizace,
    vlastník,
    správce,
    správce organizace,
    přidat správce,
    firma,
    převod vlastnictví,
    fakturační e-mail,
    přejmenovat organizaci,
  ]
goldenQuestions:
  - question: Jak nechám naši personalistku spravovat všechny skupiny?
    expectedArticles: [organization-roles]
    mustMention: [Přidat správce na stránce Organizace, správce přidává jen vlastník]
  - question: Může správce organizace schvalovat žádosti o dovolenou?
    expectedArticles: [organization-roles]
    mustMention: [správci nemůžou schvalovat ničí volno]
---

Organizace drží skupiny tvé firmy a její tarif. Flexi Day ji založí, když někdo poprvé vytvoří
skupinu, a ten člověk se stane jejím vlastníkem. Stránka {{ui:nav.organization}} ukazuje její údaje,
tarif, skupiny a správce.

## Vlastník

Vlastník za organizaci platí a má v ní všechna práva. Jen vlastník může:

- přidávat a odebírat správce;
- předplatit tarif, změnit ho, koupit sloty pro skupiny a předplatné zrušit, na stránce
  {{ui:nav.billing}};
- změnit „{{ui:organization.billingEmailLabel}}“, kam chodí varování k předplatnému;
- spustit „{{ui:organization.export.title}}“ a zapnout adresář lidí.

Organizace má jednoho vlastníka. Předání organizace někomu jinému zatím není k dispozici.

## Správci

Správce spravuje všechny skupiny v organizaci, aniž by byl v některé z nich členem: členy a
oprávnění, kvóty, pozvánky, nastavení skupin a zrcadlení. Správce také může přejmenovat organizaci,
zapnout nebo vypnout benefit zdravotního volna, zadávat volno za členy a prohlížet stránku
{{ui:nav.billing}}, aniž by na ní cokoli měnil.

Správce nemůže schválit ani zamítnout ničí volno a nemůže si zadat vlastní volno ve skupině, ve které
není. Na stránce takové skupiny uvidí, že ji spravuje jako správce organizace. Kdo má rozhodovat o
žádostech, potřebuje ve skupině oprávnění Schvalovatel. Viz
[Oprávnění ve skupině](help:group-permissions).

## Přidání a odebrání správce

1. Otevři {{ui:nav.organization}} a najdi „{{ui:organization.adminsTitle}}“.
2. Stiskni „{{ui:organization.addAdmin}}“ a vyber někoho. V seznamu jsou lidé ze skupin organizace.

„{{ui:organization.remove}}“ roli odebere. Správce, který opustí svou poslední skupinu v organizaci,
o roli přijde také, pokud organizace nepoužívá adresář lidí.

## Více organizací

Můžeš pracovat ve skupinách několika organizací, třeba jako člen ve firmě zaměstnavatele a jako
vlastník té svojí. Stránka {{ui:nav.organization}} má nahoře přepínač pro ty, které vlastníš nebo
spravuješ.
