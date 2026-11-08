---
id: sign-in
translatedFrom: "5c3916ba6520"
title: Přihlášení, obnovení hesla a dvoufázové ověření
summary: Přihlas se heslem nebo přes Google, Microsoft či Apple, obnov zapomenuté heslo a přidej druhý krok.
keywords:
  [
    přihlásit,
    přihlášení,
    zapomenuté heslo,
    obnovit heslo,
    2fa,
    dvoufázové ověření,
    ověřovací aplikace,
    záložní kódy,
    google,
    microsoft,
    apple,
    způsoby přihlášení,
  ]
goldenQuestions:
  - question: Zapomněl jsem heslo, jak se dostanu zpátky?
    expectedArticles: [sign-in]
    mustMention: [Zapomněli jste?, odkaz pro obnovení platí jednu hodinu]
  - question: Jak si zapnu dvoufázové ověření?
    expectedArticles: [sign-in]
    mustMention: [Nastavení, ověřovací aplikace nebo kód e-mailem, záložní kódy]
  - question: Můžu se přihlašovat přes Google místo hesla?
    expectedArticles: [sign-in]
    mustMention: [Způsoby přihlášení v Nastavení, stejná e-mailová adresa]
---

Přihlas se na přihlašovací stránce e-mailem a heslem, nebo přes Google, Microsoft či Apple, pokud
máš některého z nich k účtu připojeného.

## Zapomenuté heslo

1. Na přihlašovací stránce zvol „{{ui:auth.signIn.forgot}}“.
2. Zadej svůj e-mail a stiskni „{{ui:auth.forgot.submit}}“.
3. Klikni na odkaz v e-mailu a nastav nové heslo o délce aspoň 8 znaků. Odkaz platí jednu hodinu.

Nastavením nového hesla se odhlásíš všude jinde, i v telefonu. Pokud jsi nikdy nepotvrdil svou
e-mailovou adresu, obnovení hesla ji potvrdí.

## Změna hesla

Když znáš současné heslo, změníš ho v kartě „{{ui:settings.changePassword}}“ v
{{ui:nav.settings}}. Účet, který se vždy přihlašoval jen přes Google, Microsoft nebo Apple, heslo
nemá. Chceš-li ho přidat, odhlas se a použij „{{ui:auth.signIn.forgot}}“; odkaz ti heslo nastaví.

## Přihlášení přes Google, Microsoft nebo Apple

Poskytovatele připojíš v kartě „{{ui:settings.connectedAccounts.title}}“ v {{ui:nav.settings}}.
Účet u poskytovatele musí používat stejnou e-mailovou adresu jako tvůj účet ve Flexi Day. Pak tě
příslušné tlačítko na přihlašovací stránce přihlásí. Tamtéž způsob přihlášení i odpojíš, pokud ti
zůstane jiná cesta, jak se přihlásit.

Přihlášení přes poskytovatele, na jehož adresu už účet ve Flexi Day existuje, bez předchozího
připojení aplikace odmítne. Přihlas se tak jako dřív a poskytovatele připoj v {{ui:nav.settings}}.

## Dvoufázové ověření

Dvoufázové ověření přidá k přihlášení heslem druhý krok. Přihlášení přes Google, Microsoft nebo
Apple ho nevyžaduje.

Zapneš ho v {{ui:nav.settings}}: najdi „{{ui:settings.twoFactor.title}}“ a stiskni
„{{ui:settings.twoFactor.enable}}“. Potvrď heslo a vyber si druhý krok:

- **{{ui:settings.twoFactor.methodTotp}}**: naskenuj QR kód aplikací, jako je Google Authenticator
  nebo 1Password, a zadej šestimístný kód, který ukáže.
- **{{ui:settings.twoFactor.methodOtp}}**: Flexi Day ti při každém přihlášení pošle e-mailem
  šestimístný kód. Platí tři minuty.

Pak si ulož záložní kódy. Každý tě jednou přihlásí, když se nedostaneš k ověřovací aplikaci ani k
e-mailu, a uvidíš je jen jednou. „{{ui:settings.twoFactor.regenerateBackup}}“ vytvoří novou sadu.

Při přihlášení zaškrtni „{{ui:auth.twoFactor.trustDevice}}“ a v tomto prohlížeči se tě na druhý krok
30 dní nikdo nezeptá. Po příliš mnoha špatných kódech se účet na pár minut zamkne.
