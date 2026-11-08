---
id: dashboard-calendar
translatedFrom: "4d6ba2982b38"
title: Kdo je pryč, na přehledu
summary: Čti kalendář na přehledu, přepínej mezi svým volnem a volnem skupiny, filtruj podle typu a používej karty vedle něj.
keywords:
  [
    přehled,
    kalendář,
    kdo je pryč,
    kdo má volno,
    dnes pryč,
    kalendář týmu,
    měsíční pohled,
    filtr,
    legenda,
    zůstatek,
    státní svátky,
  ]
goldenQuestions:
  - question: Jak zjistím, kdo z týmu má příští týden volno?
    expectedArticles: [dashboard-calendar]
    mustMention: [kalendář na Přehledu, přepni Zobrazit na Skupina]
  - question: Proč v kalendáři vidím jen svoji dovolenou?
    expectedArticles: [dashboard-calendar]
    mustMention: [Já nebo Skupina, oprávnění Zobrazení]
---

{{ui:nav.dashboard}} je první stránka po přihlášení. Její měsíční kalendář ukazuje, kdo je pryč, a
karty kolem něj, co potřebuje tvoji pozornost.

## Kalendář

Mezi měsíci se pohybuješ šipkami vedle názvu měsíce. Každá žádost se ukazuje ve dnech, které pokrývá,
se jménem a typem. Půlden nese značku „{{ui:calendar.halfDayMark}}“. Ve svých dnech se ukazují i
státní svátky země skupiny, akce skupiny a narozeniny.

Kliknutím na žádost otevřeš její podrobnosti. Kliknutím na prázdný den, nebo tažením přes dny na
počítači, požádáš o volno na tato data. Pravým tlačítkem na den otevřeš
„{{ui:newRequest.menu.requestTimeOff}}“ a, pokud je tvůj tarif má,
„{{ui:newRequest.menu.newGroupEvent}}“.

## Já, nebo skupina

„{{ui:dashboard.scope.label}}“ přepíná mezi „{{ui:dashboard.scope.mine}}“ a
„{{ui:dashboard.scope.group}}“. U skupiny vyber, kterou. Vybrat jde jen skupiny, kde máš oprávnění
Zobrazení; bez něj vidíš jen své vlastní volno. Pohled skupiny zahrnuje i volno zrcadlené z jiných
skupin.

Jak změnit, s čím se kalendář otevírá, a jak volit mezi rozvržením „{{ui:settings.layoutLanes}}“ a
„{{ui:settings.layoutStripes}}“, najdeš v článku [Změna nastavení](help:account-settings).

## Filtr podle typu

„{{ui:dashboard.filter.label}}“ skryje nebo ukáže typy volna, třeba když chceš vidět jen dny home
office. Legenda pod kalendářem pojmenuje barvy.

## Karty

- **Statistiky:** {{ui:dashboard.stats.pendingApprovals}}, {{ui:dashboard.stats.outToday}},
  {{ui:dashboard.stats.comingUp}} a {{ui:dashboard.stats.workingToday}}.
- **{{ui:widgets.approvals.title}}:** pro schvalovatele žádosti, které čekají na ně, s tlačítky k
  rozhodnutí. Každý tu v části „{{ui:widgets.approvals.yourRequests}}“ vidí i své vlastní žádosti,
  které ještě čekají.
- **{{ui:widgets.outToday.title}}:** kdo má dnes volno.
- **{{ui:widgets.balance.title}}:** kolik dní ti letos zbývá u každého typu s nárokem, za všechny
  tvoje skupiny, s poznámkou o čekajících dnech. Viz [Nároky](help:allowances).

## Zatím žádné skupiny

Nový účet bez skupiny uvidí „{{ui:dashboard.noGroupsTitle}}“ s formuláři, jak se ke skupině připojit
nebo ji vytvořit. Viz [Připojení ke skupině](help:join-a-group) a
[Vytvoření skupiny](help:create-a-group).
