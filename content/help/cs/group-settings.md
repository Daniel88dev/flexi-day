---
id: group-settings
translatedFrom: "488481a3825a"
title: Pracovní dny a státní svátky skupiny
summary: Vyber, ve které dny v týdnu se ve skupině zadává volno a státní svátky které země se přeskakují.
keywords:
  [
    pracovní dny,
    víkend,
    pracovní týden,
    částečný úvazek,
    státní svátky,
    svátky,
    národní svátky,
    země svátků,
    země,
  ]
goldenQuestions:
  - question: Pracujeme od neděle do čtvrtka, zvládne to Flexi Day?
    expectedArticles: [group-settings]
    mustMention: [Pracovní dny v záložce Nastavení skupiny]
  - question: Proč se nám v kalendáři neukazují státní svátky?
    expectedArticles: [group-settings]
    mustMention: [země státních svátků v záložce Nastavení skupiny]
---

Záložka {{ui:groupDetail.tabs.settings}} skupiny obsahuje dvě nastavení, která rozhodují, které dny
žádost zabere. Tuto záložku vidí správci skupiny, manažer a správci organizace.

## Pracovní dny

V části „{{ui:groupDetail.workingDays}}“ zaškrtni dny v týdnu, kdy skupina pracuje, a stiskni
„{{ui:groupDetail.saveWorkingDays}}“. Potřeba je aspoň jeden den.

Žádosti zabírají jen tyto dny. Když si někdo vyžádá rozsah, ostatní dny v něm se přeskočí, takže
žádost od pátku do pondělí ve skupině pracující od pondělí do pátku zabere dva dny a z nároku ubere
dva. Rozsah bez jediného pracovního dne aplikace odmítne.

Pracovní dny patří skupině, takže je sdílí všichni v ní. Platí pro nové žádosti; dřív zadané volno
zůstane, jak je.

## Státní svátky

V části „{{ui:groupDetail.holidayCountry}}“ vyber „{{ui:groupDetail.holidayCountryLabel}}“ a
stiskni „{{ui:groupDetail.saveHolidayCountry}}“. „{{ui:groupDetail.holidayCountryNone}}“ je vypne.

Státní svátky dané země pak:

- se ukazují v kalendáři na stránce {{ui:nav.dashboard}} všem ve skupině;
- se při žádosti o rozsah přeskakují stejně jako nepracovní dny, takže z nároku nic neuberou.

Do kalendářových kanálů se nikdy neexportují.

## Kde ještě tato nastavení hrají roli

Docházka má vlastní pracovní dny a zemi svátků, nastavené pro celou organizaci na stránce
{{ui:nav.organization}}. Nastavení skupiny docházku nemění.
