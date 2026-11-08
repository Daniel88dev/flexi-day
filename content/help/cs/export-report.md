---
id: export-report
translatedFrom: "0d20f84507d6"
title: Export reportu do Excelu
summary: Jak stáhnout report volna jako sešit Excelu, co obsahují jeho dva listy a co dělat, když je soubor moc velký.
keywords: [export, excel, xlsx, tabulka, stáhnout, sešit, mzdy, csv, export volna, příliš dat]
goldenQuestions:
  - question: Dá se stáhnout všechna data o dovolených do Excelu pro mzdovou účetní?
    expectedArticles: [export-report]
    mustMention: [Export do Excelu na stránce Report, listy Summary a Detail]
  - question: Export hlásí, že je na jeden soubor příliš dat. Co s tím?
    expectedArticles: [export-report]
    mustMention: [zúžit filtry, "nejvýš 50 000 záznamů"]
---

Stránka {{ui:nav.report}} umí stáhnout svoje data jako sešit Excelu (`.xlsx`). Exportovat může každý,
kdo report otevře, a soubor obsahuje přesně to, co ti report ukazuje.

## Stažení sešitu

1. Otevři stránku {{ui:nav.report}} a nastav filtry, které chceš.
2. Stiskni „{{ui:report.export.button}}“. Dialog začíná z aktuálních filtrů reportu.
3. Vyber rok, skupiny, členy a typy volna, nebo nech „vše“.
4. Stiskni „{{ui:report.export.confirm}}“.

Export vždy pokrývá jeden kalendářní rok, i když report ukazuje posledních 12 měsíců.

## Co sešit obsahuje

**List Summary**, jeden řádek na člena, skupinu a typ volna s nárokem: převedeno z minulého roku,
nárok na celý rok, vyčerpáno k dnešku, naplánováno do konce roku, čeká na schválení a zbývá. Čísla
odpovídají tabulce {{ui:report.table.title}} na stránce.

**List Detail**, jeden řádek na záznam: jméno, skupina, typ, dny, od a do, rozsah dnů, rok, měsíc,
stav a poznámka.

Oba listy mají ukotvený řádek záhlaví a zapnutý filtr Excelu u každého sloupce, takže můžeš hned
řadit a filtrovat. Záhlaví sloupců a názvy typů volna jsou anglicky, ať používáš aplikaci v jakémkoli
jazyce.

## Co v exportu není

- Státní svátky se neobjeví nikdy: celofiremní volno není volno, které si někdo vzal.
- Nemoc a zamítnuté žádosti někoho jiného se objeví jen tehdy, když schvaluješ nebo spravuješ jeho
  skupinu, nebo spravuješ organizaci. Totéž platí pro poznámku u jeho záznamů, kterou ostatní vidí
  prázdnou.
- Tvoje vlastní řádky jsou vždy úplné.

Každý export se zaznamená i s tím, kdo ho spustil, za jaký rok a s jakými filtry.

## „{{ui:report.export.tooLarge}}“

Jeden sešit pojme nejvýš 50 000 záznamů. Zuž filtry (méně skupin, členů nebo typů volna) a exportuj
po částech.
