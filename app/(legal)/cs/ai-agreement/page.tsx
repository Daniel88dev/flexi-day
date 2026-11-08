// NOTE: The Czech AI features agreement. Keep it in step with
// app/(legal)/ai-agreement/page.tsx; a test fails when their sections drift apart.
// Have it reviewed by a qualified lawyer before relying on it.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { AI_AGREEMENT_VERSION, LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Smlouva o funkcích AI · flexiday",
  description:
    "Smlouva, kterou organizace přijímá, když její vlastník poprvé zapne Asistenta nebo AI připojení. Doplňuje smlouvu o zpracování osobních údajů.",
};

export default function CsAiAgreementPage() {
  return (
    <LegalShell
      title="Smlouva o funkcích AI"
      updated={LEGAL.cs.updated}
      locale="cs"
      intro={`Verze ${AI_AGREEMENT_VERSION}. Vlastník organizace ji přijímá jménem organizace, když poprvé zapne Asistenta nebo AI připojení.`}
      translatedPage="ai-agreement"
    >
      <h2>1. Smluvní strany a rozsah</h2>
      <p>
        Tuto smlouvu uzavírá organizace, jejíž vlastník zapne funkci AI (dále jen
        &bdquo;Správce&ldquo;), jednající prostřednictvím svého vlastníka, a{" "}
        <strong>{LEGAL.entity}</strong>, {LEGAL.cs.address}, IČO {LEGAL.ico} (dále jen
        &bdquo;Zpracovatel&ldquo;, &bdquo;my&ldquo;). Doplňuje{" "}
        <a href="/cs/dpa/">Smlouvu o zpracování osobních údajů</a> (dále jen &bdquo;DPA&ldquo;) pro
        dvě funkce AI ve Službě: <strong>Asistenta</strong> a <strong>AI připojení</strong>.
      </p>
      <p>
        Vše, co DPA říká o údajích organizace, platí i pro údaje, se kterými tyto funkce pracují,
        včetně oznamování porušení zabezpečení, auditů a pomoci s žádostmi. Pokud se tato smlouva a
        DPA v těchto údajích liší, má přednost tato smlouva.
      </p>

      <h2>2. K čemu funkce AI slouží</h2>
      <ul>
        <li>
          <strong>Asistent</strong> je AI chat ve Službě, na tarifu Enterprise. Členové se ho ptají
          na svou dovolenou, docházku a kolegy a žádají ho o změny. Čte jen to, co tazatel sám vidí,
          a každá změna čeká, až ji tento člen potvrdí.
        </li>
        <li>
          <strong>AI připojení</strong> umožňují členovi připojit ke svému účtu AI aplikaci, kterou
          už používá, například Claude nebo ChatGPT. Aplikace pracuje s vlastními oprávněními tohoto
          člena v organizaci.
        </li>
      </ul>
      <p>Obě funkce jsou vypnuté, dokud je vlastník nezapne, a vlastník je může kdykoli vypnout.</p>

      <h2>3. O jaké údaje jde</h2>
      <ul>
        <li>
          <strong>Chaty</strong>: co člen Asistentovi napíše, jeho odpovědi a údaje ze Služby, které
          Asistent čte, aby odpověděl, například žádosti, zůstatky, docházku a záznamy v adresáři,
          které člen vidí.
        </li>
        <li>
          <strong>Záznam chatu</strong>: kopie každého chatu, kterou uchováváme, aby si ji člen mohl
          znovu přečíst, s řádky o činnosti nástrojů, potvrzovacími kartami a jejich stavem a
          zprávami, které Asistent odmítl.
        </li>
        <li>
          <strong>Záznamy o využití</strong>: u každého kroku chatu kdo, kdy, který model, počet
          tokenů a cena. Neobsahují žádný obsah.
        </li>
        <li>
          <strong>Záznamy o připojení</strong>: u každého AI připojení název a adresa aplikace,
          člen, organizace, udělený přístup a kdy byla naposledy použita.
        </li>
      </ul>
      <p>
        Asistent dostává také jméno a roli člena, který se ptá. Chaty jsou{" "}
        <strong>údaji organizace</strong>: zpracováváme je pro Správce podle DPA, na jeho pokyn, a
        ne pro žádný vlastní účel.
      </p>

      <h2>4. Pokyny Správce</h2>
      <p>
        Nastavení vlastníka ve Službě jsou zdokumentované pokyny Správce podle DPA: zapnutí nebo
        vypnutí Asistenta a povolení AI připojení jen pro čtení, pro čtení i zápis, nebo vůbec.
        Změna platí jako pokyn ve chvíli, kdy se uloží.
      </p>
      <p>
        Správce zajistí, že má pro používání funkcí AI s údaji svých lidí právní základ, a informuje
        o nich své lidi, jak vyžaduje článek 13 GDPR. Volba &bdquo;Dát vědět členům&ldquo; pošle
        všem upozornění v aplikaci a v telefonu; nenahrazuje vlastní informace, které Správce svým
        lidem dává.
      </p>

      <h2>5. Anthropic jako další zpracovatel</h2>
      <p>
        Asistent běží u společnosti <strong>Anthropic, PBC</strong> se sídlem ve Spojených státech,
        kterou Správce přijetím této smlouvy schvaluje jako dalšího zpracovatele. Anthropic dostává
        údaje z chatů jen od organizací, které Asistenta zapnou.
      </p>
      <ul>
        <li>
          Anthropic ukládá chaty ve Spojených státech a zpracovávat je může i v dalších zemích, kde
          provozuje své modely.
        </li>
        <li>
          Předání se opírá o standardní smluvní doložky EU, modul 3 (zpracovatel zpracovateli).
          Anthropic není certifikován v rámci EU-U.S. Data Privacy Framework.
        </li>
        <li>Anthropic na údajích Správce nikdy netrénuje modely a my také ne.</li>
        <li>
          Zprávu, kterou označí jeho bezpečnostní systémy, Anthropic uchová až 2 roky, aby mohl
          vymáhat svá pravidla používání.
        </li>
        <li>
          Anthropic nám změny svých dalších zpracovatelů oznamuje 15 dní předem. Každou změnu
          předáme Správci, jakmile ji dostaneme, a Správce může vznést námitku, jak popisuje DPA,
          nebo Asistenta vypnout.
        </li>
      </ul>

      <h2>6. Uchovávání a mazání</h2>
      <ul>
        <li>
          Záznam chatu uchováváme 180 dní od jeho poslední zprávy a člen může své chaty smazat i
          dřív.
        </li>
        <li>
          Anthropic chat smaže 30 dní po jeho poslední zprávě, nebo hned, když se ve Službě smaže.
        </li>
        <li>
          Když člen z organizace odejde, je z ní odebrán nebo smaže svůj účet, jeho chaty v této
          organizaci se hned smažou, u nás i u společnosti Anthropic, a změny, které ještě čekají na
          jeho potvrzení, se zruší.
        </li>
        <li>
          Když se organizace smaže, smažou se všechny její chaty, u nás i u společnosti Anthropic.
        </li>
        <li>
          Záznamy o využití uchováváme 90 dní. Každý týden se pak sečte do součtu za osobu, který
          uchováváme 180 dní, a potom do součtu za organizaci, který nikoho nejmenuje.
        </li>
        <li>Záznamy o připojení uchováváme, dokud člen aplikaci neodpojí.</li>
        <li>
          Vypnutí Asistenta hned zastaví nové zprávy. Chaty zůstanou čitelné, dokud se nesmažou
          podle pravidel výše.
        </li>
      </ul>

      <h2>7. Co vidí vlastník a správci organizace</h2>
      <p>
        Vlastník a správci organizace vidí, kolik kdo Asistenta používá a kolik jeho zpráv Asistent
        odmítl. Nikdy nevidí, co kdo napsal.
      </p>

      <h2>8. AI připojení</h2>
      <p>
        Povolení AI připojení je zdokumentovaný pokyn Správce předat aplikaci člena to, co tento
        člen v organizaci vidí, a v režimu pro čtení i zápis jí dovolit provádět změny, které by
        mohl provést člen. Společnost, která za aplikací stojí, si vybírá člen podle své vlastní
        smlouvy s ní. Není naším dalším zpracovatelem a nemáme s ní žádnou smlouvu.
      </p>
      <p>
        Naše odpovědnost končí ve chvíli, kdy údaje dorazí do aplikace. Osobní účty AI aplikací si
        mohou přečtené údaje uchovat nebo na nich trénovat, proto o tom, které aplikace mohou lidé
        Správce používat, rozhodují pravidla Správce.
      </p>

      <h2>9. Verze</h2>
      <p>
        Zaznamenáváme, kdo tuto smlouvu přijal, kdy a kterou verzi. Když zveřejníme novou verzi,
        vlastník je požádán o její přijetí při příští návštěvě a Asistent i AI připojení mezitím
        fungují dál. Dokud ji vlastník nepřijme, platí verze, kterou přijal naposledy.
      </p>

      <h2>10. Kontakt</h2>
      <p>
        {LEGAL.entity}
        <br />
        {LEGAL.cs.address}
        <br />
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
      </p>
    </LegalShell>
  );
}
