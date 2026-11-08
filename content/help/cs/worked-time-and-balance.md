---
id: worked-time-and-balance
translatedFrom: "10a42bc992a1"
title: Odpracovaný čas, požadovaný čas a saldo
summary: Jak Flexi Day převádí směny a pauzy na odpracovaný čas, které dny docházku nevyžadují a jak se počítá denní nebo měsíční saldo.
keywords:
  [
    odpracovaný čas,
    pracovní doba,
    odpracované hodiny,
    saldo,
    přesčas,
    přesčasy,
    nedopracováno,
    požadovaný čas,
    odečet přestávky,
    přítomnost,
    saldo za měsíc,
    den volna,
    půlden,
    státní svátek,
  ]
goldenQuestions:
  - question: Proč mi z dne odečetlo 30 minut, když jsem na pauze nebyl?
    expectedArticles: [worked-time-and-balance]
    mustMention: [nárok na přestávku, odečte se po překročení hranice přítomnosti]
  - question: Musím zaznamenat příchod, když mám dovolenou?
    expectedArticles: [worked-time-and-balance]
    mustMention: [schválená absence docházku nevyžaduje, Home Office čas vyžaduje]
  - question: Převádějí se přesčasy do dalšího měsíce?
    expectedArticles: [worked-time-and-balance]
    mustMention: [saldo se nepřevádí ani nenuluje, je na zaměstnavateli]
---

{{ui:nav.myAttendance}} ukazuje u každého dne, jak dlouho jsi byl přítomen, kolik z toho se počítá
jako odpracované, co den vyžadoval a rozdíl. Přepínej mezi „{{ui:clock.views.day}}“,
„{{ui:clock.views.week}}“ a „{{ui:clock.views.month}}“.

## Jak se počítá odpracovaný čas

- **{{ui:clock.presence}}** je součet tvých směn za den, včetně pauz.
- **Odečtené pauzy:** když přítomnost překročí hranici (ve výchozím stavu 6 hodin), odečte se větší
  z nároku na přestávku (ve výchozím stavu 30 minut) a skutečně vybraných pauz. Pod hranicí se
  odečítají jen pauzy, které sis vzal.
- **{{ui:clock.worked}}** je přítomnost minus tento odečet.

Nárok na přestávku se tedy z dlouhého dne odečte, i když jsi nikdy nestiskl „{{ui:clock.takeBreak}}“,
a delší pauza se odečte celá. Obě čísla nastavuje tvoje organizace.

## Požadovaný čas

**{{ui:clock.required}}** je požadovaný čas organizace na den (ve výchozím stavu 8 hodin), pokud ti
správce nenastavil vlastní. Půldenní absence ho pro ten den sníží na polovinu.

## Dny, které nic nevyžadují

Docházka se nevyžaduje v den, který je:

- mimo tvůj pracovní poměr, před jeho začátkem nebo po jeho konci;
- mimo pracovní dny organizace;
- státním svátkem v zemi, kterou organizace pro svátky používá;
- pokrytý schválenou absencí, třeba {{ui:calendarRecordTypes.VACATION.label}} nebo
  {{ui:calendarRecordTypes.SICK.label}}, v kterékoli skupině organizace.

{{ui:calendarRecordTypes.HOME_OFFICE.label}} čas vyžaduje: práce z domova je práce. Žádost, která
čeká na schválení, zatím nic neomlouvá. Tyhle dny jsou v týdnu a měsíci šrafované.

Příchod v takový den zaznamenat můžeš. Den se označí „{{ui:clock.excludedClockInFlag}}“ a čas se
započítá do měsíce.

## Tvoje saldo

**{{ui:clock.balance}}** je odpracovaný minus požadovaný čas. Tvoje organizace ho ukazuje jedním ze
dvou způsobů:

- **Po dnech:** každý den má barvu podle svého požadovaného času.
- **Za měsíc:** jedno „{{ui:clock.monthBalance}}“ proti požadovanému času měsíce.

V průběhu měsíce saldo počítá jen pracovní dny, které už začaly, takže dny, které teprve přijdou,
nejsou manko. „{{ui:clock.monthRequired}}“ vedle ukazuje, co vyžaduje celý měsíc.

Nic se nevynucuje. Saldo se nepřevádí do dalšího měsíce a nenuluje se; jen se ukazuje a vše další je
na tvém zaměstnavateli.

## Proč se změnil starý den

Pravidla se čtou, když se den zobrazuje, ne když se odpracoval. Pokud organizace změní požadovaný čas,
pravidla přestávek, pracovní dny nebo zemi pro svátky, posunou se i minulá salda. Jen den směny a její
časové pásmo zůstávají takové, jaké byly při příchodu.
