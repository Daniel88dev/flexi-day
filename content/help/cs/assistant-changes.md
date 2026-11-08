---
id: assistant-changes
translatedFrom: "030d2101b081"
title: Potvrzení změn, které připraví Asistent
summary: Jak fungují potvrzovací karty Asistenta a co se stane, když kartu potvrdíš, odmítneš nebo napíšeš dál.
keywords:
  [
    asistent,
    karta,
    potvrdit,
    potvrzení,
    teď ne,
    ponechat,
    zkusit znovu,
    nepoužito,
    zadat volno,
    zrušit,
    příchod,
    odchod,
    poznámka,
    upozornění,
  ]
goldenQuestions:
  - question: Může mi Asistent zadat den volna?
    expectedArticles: [assistant-changes, assistant]
    mustMention: [kartu potvrdíš, nic se nezmění před potvrzením]
  - question: Proč karta píše, že Asistent četl poznámku od někoho jiného?
    expectedArticles: [assistant-changes]
    mustMention: [zkontroluj, že karta odpovídá tomu, o co jsi žádal(a)]
---

Požádej Asistenta, ať ti zadá volno, zruší některou z tvých žádostí nebo zaznamená příchod či
odchod, a on změnu připraví jako kartu v chatu. Nic se nezmění, dokud kartu nepotvrdíš.

## Co karta ukazuje

Karta položí otázku, třeba „{{ui:assistant.cards.title.create_request}}“, a vypíše údaje, které Flexi
Day spočítalo podle stejných pravidel jako aplikace: typ, termín, pracovní dny, tvůj zůstatek před a
po a skupinu. Poznámka nebo důvod, o které jsi požádal(a), se ukáže doslovně, s řádkem, čí jsou to
slova. Údaje pocházejí z Flexi Day, nikdy z vlastních slov Asistenta. Každá karta nese text
„{{ui:assistant.cards.madeThrough}}“.

Když pravidla změnu nedovolí, třeba protože ti nezbývá dost dní, kartu nedostaneš. Asistent ti
místo toho řekne proč.

## Potvrdit, nebo nechat být

- „{{ui:assistant.cards.confirm.create_request}}“, „{{ui:assistant.cards.confirm.cancel_my_request}}“,
  „{{ui:assistant.cards.confirm.clock_in}}“ nebo „{{ui:assistant.cards.confirm.clock_out}}“ změnu
  provede. Flexi Day v tu chvíli pravidla zkontroluje znovu. Karta se zmenší na jeden řádek s
  výsledkem a odkazem „{{ui:assistant.cards.open}}“, který otevře tvoje žádosti nebo docházku.
- „{{ui:assistant.cards.notNow}}“, u zrušení „{{ui:assistant.cards.keepIt}}“, nechá všechno, jak
  bylo.
- Když se změna při potvrzení nepovede, třeba protože mezitím někdo ten den obsadil, karta ukáže
  důvod červeně a zůstane otevřená. „{{ui:assistant.cards.tryAgain}}“ to zkusí ještě jednou.
- Když místo toho pošleš novou zprávu, každá karta, která ještě čeká, se označí jako nepoužitá.
  Potom už ji potvrdit nejde; o novou kartu požádej znovu.

Když Asistent připraví dvě změny najednou, každá dostane vlastní kartu a rozhodneš je jednu po
druhé. Psát pokračuje, až rozhodneš všechny.

Změna provedená touto cestou má v historii žádosti nebo v historii docházky toho dne poznámku
„{{ui:common.channel.assistant}}“. Schvalovatelé dostanou stejná upozornění jako u žádosti z
aplikace.

## Poznámka od někoho jiného

Než Asistent změnu připraví, může číst text, který napsali jiní, třeba poznámku u volna kolegy nebo
název skupinové události. Pokud ho četl, karta uvede, kdo ho napsal, a požádá tě, ať zkontroluješ,
že jde o to, o co jsi žádal(a). Někdo by mohl napsat poznámku, která má Asistenta navést jinam, a
proto si před potvrzením ověř, že karta odpovídá tomu, o co jsi žádal(a).

## Při Týdenním limitu

Karta, která už se ukázala, jde potvrdit i poté, co tvoje organizace vyčerpá Týdenní limit.
Potvrzení změnu provede, ale Asistent na ni odpoví až po obnovení limitu, s tvou další zprávou.
Viz [Týdenní limit a využití](help:assistant-weekly-limit).
