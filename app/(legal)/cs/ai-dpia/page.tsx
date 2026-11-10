// NOTE: The Czech DPIA information page. Keep it in step with app/(legal)/ai-dpia/page.tsx; a
// test fails when their sections drift apart. Have it reviewed by a qualified lawyer before
// relying on it.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { aiTextsPublished, aiTextsUpdated, LEGAL } from "@/lib/legal";

export function generateMetadata(): Metadata {
  return {
    title: "Funkce AI: podklady pro posouzení vlivu (DPIA) · flexiday",
    description:
      "Tok dat, další zpracovatelé, doba uchování a záruky Asistenta a AI připojení pro posouzení vlivu na ochranu osobních údajů, které provádí organizace.",
    ...(aiTextsPublished() ? {} : { robots: { index: false, follow: false } }),
  };
}

export default function CsAiDpiaPage() {
  return (
    <LegalShell
      title="Funkce AI: podklady pro posouzení vlivu (DPIA)"
      updated={aiTextsUpdated("cs")}
      locale="cs"
      intro="Co organizace potřebuje vědět o Asistentovi a AI připojení pro své vlastní posouzení vlivu na ochranu osobních údajů (DPIA)."
      translatedPage="ai-dpia"
    >
      <h2>1. K čemu tato stránka slouží</h2>
      <p>
        Správcem údajů, které lidé organizace zadávají Asistentovi, a údajů, které čtou jejich AI
        aplikace, je organizace. Ta také rozhoduje, zda před zapnutím některé z funkcí potřebuje
        posouzení vlivu na ochranu osobních údajů podle článku 35 GDPR. Dotčenými osobami jsou
        zaměstnanci a funkce používají AI, takže mnoho organizací ho potřebovat bude. Oddíl 11 naší{" "}
        <a href="/cs/dpa/">Smlouvy o zpracování osobních údajů</a> slibuje podklady pro něj a tato
        stránka je dává. Sama posouzením není: rizika pro své lidi a své účely váží organizace.
      </p>
      <p>
        Závazným textem je <a href="/cs/ai-agreement/">Smlouva o funkcích AI</a>. Pokud se tato
        stránka a smlouva liší, má přednost smlouva.
      </p>

      <h2>2. Co funkce dělají</h2>
      <ul>
        <li>
          <strong>Asistent</strong> je AI chat uvnitř Flexi Day na tarifu Enterprise. Členové se ho
          ptají na svou dovolenou, docházku a kolegy a žádají ho o změny, například o podání žádosti
          o volno nebo schválení žádosti, o které smějí rozhodovat.
        </li>
        <li>
          <strong>AI připojení</strong> dovolují členovi připojit ke svému účtu AI aplikaci, kterou
          už používá, například Claude nebo ChatGPT, na kterémkoli placeném tarifu. Aplikace čte to,
          co člen vidí v jedné organizaci, a pokud vlastník povolí čtení i změny, provádí změny,
          které by člen mohl provést u svých vlastních záznamů.
        </li>
      </ul>
      <p>Obě funkce jsou vypnuté, dokud je vlastník nezapne, a kdykoli je může vypnout.</p>

      <h2>3. Tok dat</h2>
      <h3>Asistent</h3>
      <ol>
        <li>Člen napíše zprávu ve Flexi Day. Dorazí na naše servery na {LEGAL.cs.hosting}.</li>
        <li>
          Zprávu nejdřív zkontroluje samostatný model společnosti Anthropic. Zpráva, kterou odmítne,
          například proto, že se netýká Flexi Day, nejde dál a zůstane jen v naší kopii chatu.
        </li>
        <li>
          Zpráva jde ke společnosti Anthropic se jménem, rolí, organizací a jazykem člena a s datem.
          Asistent odpoví a k tomu si od našich serverů přes nástroje vyžádá data z Flexi Day. Každý
          nástroj běží na našich serverech s oprávněními člena, takže vrátí jen to, co člen sám
          vidí, a jeho výsledek jde ke společnosti Anthropic.
        </li>
        <li>
          Změna, kterou Asistent navrhne, se v chatu zobrazí jako karta. Nic se nezmění, dokud ji
          člen nepotvrdí, a změna pak proběhne s novou kontrolou oprávnění.
        </li>
        <li>
          Chat tak, jak ho vidí členové, uchováváme v naší databázi ve Frankfurtu. Anthropic
          uchovává ve Spojených státech relaci, tedy paměť modelu o chatu.
        </li>
      </ol>
      <h3>AI připojení</h3>
      <ol>
        <li>
          Člen připojí aplikaci přes přihlášení a obrazovku se souhlasem, která aplikaci jmenuje, a
          vybere jednu organizaci. Aplikace dostane token jen pro tuto organizaci, nikdy heslo
          člena.
        </li>
        <li>
          Aplikace volá náš server. Každé volání se kontroluje podle oprávnění člena, nastavení
          vlastníka (jen čtení, nebo čtení i změny) a tarifu a vrací jen to, co člen vidí.
        </li>
        <li>
          Co aplikace přečte, jde ke společnosti, která za ní stojí, podle vlastní smlouvy člena s
          ní. Tato společnost není naším dalším zpracovatelem. Jakmile data do aplikace dorazí, naše
          zpracování i naše odpovědnost končí.
        </li>
      </ol>

      <h2>4. Údaje a osoby</h2>
      <ul>
        <li>
          <strong>Osoby</strong>: členové organizace, kteří funkce používají, a kolegové, jejichž
          záznamy vidí.
        </li>
        <li>
          <strong>Chaty</strong>: co členové napíšou, odpovědi a data z Flexi Day přečtená kvůli
          odpovědi: žádosti o volno a zůstatky, docházka, skupinové události a narozeniny a záznamy
          v adresáři, pokud je člen vidí. Nemoc může prozradit údaje o zdravotním stavu, tedy
          zvláštní kategorii podle článku 9 GDPR. Nástroje nikdy nevracejí obsah příloh.
        </li>
        <li>
          <strong>Záznamy o používání</strong>: kdo a kdy Asistenta použil, jaký model, tokeny a
          cena, kolik zpráv člověka bylo odmítnuto a denní počty volání z AI aplikací. Žádný obsah.
        </li>
        <li>
          <strong>Záznamy o připojeních</strong>: u každého AI připojení název a adresa aplikace,
          člen, organizace, udělený přístup a kdy byl naposledy použit.
        </li>
        <li>
          Změny provedené přes Asistenta nebo AI aplikaci jsou tak označeny v historii žádosti, v
          historii docházky a v záznamu čtení adresáře.
        </li>
      </ul>

      <h2>5. Další zpracovatelé a příjemci</h2>
      <table>
        <thead>
          <tr>
            <th>Kdo</th>
            <th>Role</th>
            <th>Umístění</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Anthropic, PBC</td>
            <td>
              Další zpracovatel. Provozuje Asistenta a kontrolu zpráv, jen pro organizace, které
              Asistenta zapnou. Jeho vlastní další zpracovatelé jsou na{" "}
              <a href="https://trust.anthropic.com/subprocessors">seznamu společnosti Anthropic</a>
            </td>
            <td>
              Spojené státy (uložení); zpracování v kterékoli zemi, kde Anthropic provozuje své
              modely
            </td>
          </tr>
          <tr>
            <td>Amazon Web Services (AWS)</td>
            <td>Další zpracovatel. Provoz a databáze, včetně naší kopie každého chatu</td>
            <td>EU (Frankfurt, Německo)</td>
          </tr>
          <tr>
            <td>Functional Software, Inc. (Sentry)</td>
            <td>
              Další zpracovatel. Sledování chyb a výkonu: pseudonymní identifikátory a časy, nikdy
              text chatů, argumenty ani výsledky nástrojů
            </td>
            <td>Region EU (Frankfurt, Německo); společnost sídlí ve Spojených státech</td>
          </tr>
          <tr>
            <td>Společnost, která stojí za připojenou AI aplikací</td>
            <td>
              Příjemce, kterého si zvolil člen, podle jeho vlastní smlouvy. Není naším dalším
              zpracovatelem
            </td>
            <td>Podle aplikace</td>
          </tr>
        </tbody>
      </table>
      <p>
        Předání společnosti Anthropic se opírá o standardní smluvní doložky Evropské komise, modul 3
        (zpracovatel zpracovateli). Anthropic není certifikován podle rámce EU-USA pro ochranu
        osobních údajů (Data Privacy Framework). Protože Anthropic může provozovat inferenci i v
        zemích, které nejmenuje, musí to pokrýt posouzení dopadu předání. Anthropic nám změny svých
        vlastních dalších zpracovatelů oznamuje 15 dní předem a každou změnu předáváme, jakmile ji
        dostaneme.
      </p>

      <h2>6. Doba uchování</h2>
      <ul>
        <li>
          Chat uchováváme 180 dní po jeho poslední zprávě a člen může své chaty smazat i dříve.
        </li>
        <li>
          Anthropic chat smaže 30 dní po jeho poslední zprávě, nebo hned, když se chat smaže.
          Zprávu, kterou označí jeho bezpečnostní systémy, uchová až 2 roky kvůli vymáhání svých
          zásad používání.
        </li>
        <li>
          Člen, který z organizace odejde, je z ní odebrán nebo smaže svůj účet, přijde o své chaty
          v této organizaci hned, u nás i u společnosti Anthropic. Smazáním organizace se smažou
          všechny její chaty.
        </li>
        <li>
          Záznamy o používání uchováváme 90 dní, pak jako týdenní součty za osobu 180 dní a poté
          jako součty za organizaci, které nikoho nejmenují.
        </li>
        <li>
          Záznamy o připojeních uchováváme, dokud se aplikace neodpojí, k čemuž dojde i při obnovení
          nebo změně hesla a při smazání účtu.
        </li>
        <li>Naše zálohy vyprší do sedmi dnů.</li>
      </ul>

      <h2>7. Záruky</h2>
      <ul>
        <li>My ani Anthropic na datech organizace netrénujeme modely.</li>
        <li>
          Obě funkce čtou jen to, co člen sám vidí, přes stejné kontroly oprávnění jako aplikace, a
          zůstávají uvnitř jedné organizace, ke které chat nebo připojení patří.
        </li>
        <li>
          Každá změna, kterou Asistent navrhne, čeká, až ji člen potvrdí. Asistent nikdy
          nedoporučuje schválit ani zamítnout žádost někoho jiného; ukáže fakta a rozhodne
          schvalovatel. Chat členům říká, že Asistent je AI a může se mýlit.
        </li>
        <li>
          Text, který napsali lidé, například poznámky k žádostem, dostává model označený jako
          takový a nikdy ho nebere jako pokyn. Samostatná kontrola prověří každou zprávu dřív, než
          ji Asistent uvidí.
        </li>
        <li>
          Vlastník a správci organizace vidí, kolik kdo Asistenta používá a kolik jeho zpráv bylo
          odmítnuto, nikdy ne to, co kdo napsal.
        </li>
        <li>
          AI aplikace se přihlašují přes OAuth, dostanou jednu organizaci na připojení a jen
          přístup, který vlastník povolí, a ztratí ho, když je člen odpojí, obnoví nebo změní heslo,
          nebo když vlastník AI připojení vypne.
        </li>
        <li>
          Každá organizace má Týdenní limit Asistenta a denní limit AI připojení a každý člen denní
          limit volání z AI aplikací.
        </li>
        <li>
          Naše protokoly a hlášení chyb nikdy nezaznamenávají text chatů, argumenty ani výsledky
          nástrojů. Data jsou šifrovaná při přenosu i v klidu.
        </li>
      </ul>

      <h2>8. Body pro vaše posouzení</h2>
      <ul>
        <li>Odpovědi mohou být chybné. Změny vyžadují potvrzení člena, odpovědi ne.</li>
        <li>
          Chaty se ukládají ve Spojených státech a zpracovávat se mohou i v dalších zemích, jak
          popisuje oddíl 5.
        </li>
        <li>
          Vlastník a správci organizace vidí používání a odmítnuté zprávy po jednotlivých osobách.
          Ověřte, zda to vaše pracovní právo nepovažuje za kontrolu zaměstnanců.
        </li>
        <li>
          Členové si mohou připojit AI aplikace s osobními účty, které si přečtená data mohou
          uchovat nebo na nich trénovat. Které aplikace mohou vaši lidé používat, určují pravidla
          vaší organizace; režim jen pro čtení omezuje, co mohou změnit.
        </li>
      </ul>

      <h2>9. Zpráva SOC 2 společnosti Anthropic</h2>
      <p>
        Anthropic poskytuje své zprávy SOC 2 zákazníkům na písemnou žádost. Pokud ji chcete vidět,
        napište na <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> z e-mailu účtu vlastníka
        organizace. Aktuální zprávu si vyžádáme od společnosti Anthropic a předáme vám ji za
        podmínek mlčenlivosti společnosti Anthropic.
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
