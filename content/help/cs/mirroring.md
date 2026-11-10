---
id: mirroring
translatedFrom: "e9848ff2586e"
title: Zrcadlení volna z jiné skupiny
summary: Zrcadli záznamy člena z jedné skupiny do druhé, aby je ukazovaly oba kalendáře, bez druhého schvalování.
keywords:
  [
    zrcadlení,
    zrcadlit,
    více skupin,
    dva týmy,
    zastřešující skupina,
    ukázat volno v jiné skupině,
    duplikovat,
    kalendář napříč týmy,
  ]
goldenQuestions:
  - question: Jsem ve dvou týmech, jak docílím, aby oba viděly moji dovolenou bez dvojího zadávání?
    expectedArticles: [mirroring]
    mustMention: [záložka Zrcadlení, schvaluje se a počítá ve skupině, kde bylo zadané]
  - question: Proč nemůžu schválit žádost, která se ukazuje v mojí skupině?
    expectedArticles: [mirroring]
    mustMention: [zrcadlené záznamy jsou jen pro čtení]
---

Zrcadlení ukazuje volno člena z jedné skupiny i v jiné skupině, ve které také je. Hodí se, když chce
manažer mít své volno v kalendáři svého týmu, nebo když několik malých týmů přispívá do jedné
zastřešující skupiny.

## Co je zrcadlený záznam

Zrcadlený záznam je pohled, ne kopie. Schvaluje se, počítá do nároku a vykazuje jen ve skupině, kde
byl zadaný. V druhé skupině je jen pro čtení: nikdo ho tam neschvaluje a ukazuje se s přerušovaným
okrajem a poznámkou, ze které skupiny je zrcadlený. Kolegové v ní ho vidí stejně jako každý kolega,
takže {{ui:calendarRecordTypes.SICK.label}} se ukáže jako
{{ui:calendarRecordTypes.AWAY.label}} a poznámky zůstanou skryté.

Když člověk cílovou skupinu opustí, jeho záznamy se v ní přestanou ukazovat.

## Nastavení

Musíš spravovat obě skupiny: tu, ze které záznamy pocházejí, i tu, ve které se mají ukazovat. Člen
musí být v obou.

1. Otevři skupinu, ve které se mají záznamy ukazovat, a přejdi na
   {{ui:groupDetail.tabs.mirroring}}.
2. V části „{{ui:groupDetail.mirroring.title}}“ najdi člena a zaškrtni skupiny, ze kterých se má
   zrcadlit. Nabídnou se jen skupiny, které spravuješ a které má člen společné s touto.
3. Stiskni „{{ui:groupDetail.mirroring.save}}“.

Zdrojová skupina, kterou spravuje někdo jiný, se ukáže jako zamčená; nastaví ji správce té skupiny.

## Jako člen

Záložka {{ui:groupDetail.tabs.mirroring}} ti ukáže, které z tvých skupin se do této zrcadlí. Změnit
to může jen správce skupiny.

## Kde se zrcadlené záznamy ukazují

Objeví se v kalendáři skupiny na stránce {{ui:nav.dashboard}} a na stránce {{ui:nav.requests}}, když
se díváš na tuto skupinu. Reporty a export do Excelu počítají každý záznam jen v jeho vlastní
skupině.
