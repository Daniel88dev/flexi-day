---
id: email-not-arriving
translatedFrom: "673fe6711ae5"
title: E-maily od Flexi Day nechodí
summary: Co zkontrolovat, když ti nepřijde potvrzení adresy, obnovení hesla, přihlašovací kód, pozvánka nebo e-mail k žádosti.
keywords:
  [
    nepřišel e-mail,
    nedostal jsem e-mail,
    chybí e-mail,
    spam,
    nevyžádaná pošta,
    ověřovací e-mail,
    potvrzovací e-mail,
    obnovení hesla,
    pozvánka nepřišla,
  ]
goldenQuestions:
  - question: Nepřišel mi e-mail na potvrzení účtu, co teď?
    expectedArticles: [email-not-arriving, create-an-account]
    mustMention: [podívej se do spamu, odkaz platí hodinu, Zapomněli jste?]
  - question: Manažer mi schválil dovolenou, ale e-mail mi nepřišel
    expectedArticles: [email-not-arriving, notifications]
    mustMention: [E-mailová oznámení v Nastavení, zvoneček v horní liště]
---

Flexi Day posílá e-maily z adresy na doméně flexi-day.com. Když některý nepřijde, projdi kroky pro
druh e-mailu, na který čekáš.

## Nejdřív zkontroluj

- **Spam a nevyžádanou poštu.** Podívej se tam i do záložek jako „Promoakce“ nebo „Ostatní“. Označ
  e-mail jako „není spam“, aby další přišel do doručené pošty.
- **Správnou adresu.** E-maily chodí na adresu, se kterou ses registroval. Najdeš ji v uživatelském
  menu v horní liště. U pozvánky si adresu ověř s tím, kdo tě zval.
- **Firemní filtry pošty.** Některé pracovní schránky zadrží nebo zahodí poštu od nových odesílatelů.
  Požádej svoje IT, ať povolí poštu z domény flexi-day.com.

## Potvrzení e-mailové adresy

Odkaz pro potvrzení platí hodinu. Pokud vypršel nebo vůbec nepřišel, použij na přihlašovací stránce
„{{ui:auth.signIn.forgot}}“ a nastav si heslo z e-mailu, který přijde. Tím odkazem se potvrdí i tvoje
adresa. Viz [Založení účtu ve Flexi Day](help:create-an-account).

## Obnovení hesla a přihlašovací kódy

- Odkaz pro obnovení hesla platí hodinu. Když vyprší, požádej o nový.
- Kód dvoufázového ověření poslaný e-mailem platí 3 minuty. Na přihlašovací obrazovce stiskni
  „{{ui:auth.twoFactor.resend}}“ pro nový, nebo místo něj použij aplikaci pro ověřování či záložní
  kód. Viz [Přihlášení, obnovení hesla a dvoufázové ověření](help:sign-in).

## Pozvánky do skupiny

Pozvánka platí jen pro adresu, na kterou byla poslaná, a vyprší po 14 dnech. Když nepřijde, požádej
správce skupiny, ať zkopíruje kód pozvánky na záložce {{ui:groupDetail.tabs.invites}} a pošle ti ho
jinak. Zadej ho v části „{{ui:groups.joinTitle}}“ na stránce {{ui:nav.groups}}. Viz
[Připojení ke skupině přes pozvánku](help:join-a-group).

## E-maily k žádostem

- **Nastavení je vypnuté.** „{{ui:settings.emailNotifications}}“ v {{ui:nav.settings}} vypínají
  e-maily k žádostem: žádosti o schválení, rozhodnutí, zrušení a komentáře. Oznámení se dál ukazují
  pod zvonečkem v horní liště.
- **Některá oznámení e-mailem nechodí nikdy.** Žádost, kterou za tebe zadal nebo změnil správce,
  automaticky uzavřená směna a hotový export se ukážou jen v aplikaci. Celý seznam je v článku
  [Oznámení a e-maily](help:notifications).
- **E-mail nebyl potřeba.** O vlastních akcích e-mail nedostaneš a schvalovatelé se nedozví o
  žádosti, kterou sami zadali.

## Pořád nic

Pokud nic z toho nepomůže, napiš nám přes stránku „{{ui:footer.contact}}“, odkaz najdeš dole na
flexi-day.com. Uveď svoji adresu a e-mail, na který čekáš.
