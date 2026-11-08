---
id: manage-subscription
translatedFrom: "44aae15dec79"
title: Předplatné, změna tarifu a zrušení
summary: Jak vlastník předplatí tarif, přepne tarif nebo období platby, změní kartu, stáhne faktury a předplatné zruší.
keywords:
  [
    fakturace,
    předplatné,
    platba,
    platební karta,
    faktura,
    účtenka,
    zrušit předplatné,
    snížit tarif,
    upgrade,
    ročně,
    měsíčně,
    dph,
  ]
goldenQuestions:
  - question: Kde si stáhnu naše faktury?
    expectedArticles: [manage-subscription]
    mustMention: [Spravovat platební metodu na stránce Fakturace, platební portál]
  - question: Jak zrušíme předplatné?
    expectedArticles: [manage-subscription]
    mustMention: [platební portál, jen vlastník]
  - question: Proč nemůžu změnit tarif? Jsem správce.
    expectedArticles: [manage-subscription]
    mustMention: [předplatné mění jen vlastník]
---

Stránka {{ui:nav.billing}} ukazuje tarif tvé organizace, jeho využití a tarify, na které můžeš
přejít. Předplatné mění jen vlastník. Správci vidí stejnou stránku s poznámkou, že nic měnit
nemůžou.

## Předplatné

1. Otevři {{ui:nav.billing}}.
2. V části „{{ui:billing.plansTitle}}“ vyber „{{ui:billing.monthly}}“ nebo „{{ui:billing.yearly}}“.
3. U tarifu Pro nebo Enterprise stiskni „{{ui:billing.subscribe}}“ a zaplať v platebním okně.

Platby probíhají přes Paddle, který zpracuje kartu a připočte DPH podle tvé země. Potvrzení platby
obvykle trvá pár sekund; pak stránka ukáže nový tarif. První předplatné začíná zkušební dobou
zdarma; viz [Tarify, ceny a limity](help:plans-and-limits).

## Změna tarifu nebo období platby

S aktivním předplatným vyber druhý tarif nebo období platby a stiskni
„{{ui:billing.switchPlan}}“. Změna platí hned a rozdíl v ceně se doúčtuje nebo dobropisuje za zbytek
období.

## Karta, faktury a zrušení

„{{ui:billing.managePayment}}“ v kartě „{{ui:billing.currentPlan}}“ otevře platební portál. V něm
změníš kartu, stáhneš faktury nebo tarif zrušíš.

Zrušený tarif funguje do konce zaplaceného období; stránka ukáže datum jako „Skončí“. Potom začne
14denní ochranná lhůta a po ní organizace přejde na tarif Free. Nic se nesmaže. Viz
[Když placený tarif skončí](help:lapsed-plan).

## Sloty pro skupiny

Sloty pro další skupiny přidáš nebo ubereš v části „{{ui:billing.slotsTitle}}“ tlačítky plus a
mínus, pak stiskni „{{ui:billing.slotsSave}}“. Každý slot stojí {{price:SLOT.monthly}} měsíčně nebo
{{price:SLOT.yearly}} ročně, bez DPH.

## Fakturační e-mail

Varování k předplatnému, třeba o neúspěšné platbě, chodí na fakturační e-mail organizace. Vlastník ho
změní na stránce {{ui:nav.organization}} v poli „{{ui:organization.billingEmailLabel}}“.

## Platba po splatnosti

Když platba selže, tarif ukáže „{{ui:billing.statusLabels.past_due}}“ a banner řekne, do kdy všechno
dál funguje. Do té doby změň kartu v platebním portálu.
