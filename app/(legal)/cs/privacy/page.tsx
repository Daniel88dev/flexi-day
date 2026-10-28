// NOTE: The Czech Privacy Policy. Keep it in step with app/(legal)/privacy/page.tsx;
// a test fails when their sections drift apart. Have it reviewed by a qualified
// lawyer before publication.
import type { Metadata } from "next";
import { LegalShell } from "@/components/legal/legal-shell";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Zásady ochrany osobních údajů — flexiday",
  description: "Jak flexiday shromažďuje, používá a chrání vaše osobní údaje podle GDPR.",
};

export default function CsPrivacyPage() {
  return (
    <LegalShell
      title="Zásady ochrany osobních údajů"
      updated={LEGAL.cs.updated}
      locale="cs"
      intro="Tyto zásady vysvětlují, jaké osobní údaje flexiday zpracovává, v jaké roli, proč, a jaká práva vám dává obecné nařízení o ochraně osobních údajů (GDPR)."
      translatedPage="privacy"
    >
      <h2>1. Kdo jsme</h2>
      <p>
        Službu {LEGAL.product} provozuje <strong>{LEGAL.entity}</strong> (&bdquo;my&ldquo;), IČO{" "}
        {LEGAL.ico}, fyzická osoba podnikající se sídlem {LEGAL.cs.address}.
      </p>
      <p>Naše role závisí na druhu údajů a je stejná u všech tarifů:</p>
      <ul>
        <li>
          Jsme <strong>správcem</strong> <strong>údajů vašeho účtu</strong>: přihlášení, nastavení,
          oznámení, propojených kalendářů, registrací push oznámení a narozenin. O těchto údajích
          rozhodujeme my a tyto zásady je popisují celé.
        </li>
        <li>
          Jsme <strong>zpracovatelem</strong> <strong>údajů organizace</strong>: toho, co organizace
          vede o lidech, kteří v ní pracují, například pracovní poměry, skupiny, nepřítomnosti,
          docházku a nároky. Jejich správcem je organizace (obvykle váš zaměstnavatel). Zpracováváme
          je jen proto, abychom této organizaci poskytovali Službu, podle jejích pokynů a podle naší{" "}
          <a href="/cs/dpa/">Smlouvy o zpracování osobních údajů</a>. Organizace rozhoduje, jak
          dlouho vaše záznamy uchovává, a odpovídá na vaše žádosti, které se jich týkají.
        </li>
      </ul>
      <p>
        S jakýmkoli dotazem k ochraně osobních údajů nebo k uplatnění svých práv nám napište na{" "}
        <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>. Pověřence pro ochranu osobních údajů
        jsme nejmenovali, protože nám to článek 37 GDPR neukládá.
      </p>

      <h2>2. Rozsah</h2>
      <p>
        Tyto zásady se vztahují na webovou aplikaci flexiday a související služby (dále jen
        &bdquo;Služba&ldquo;), nástroj, ve kterém týmy žádají o volno, schvalují ho a sledují. Na
        weby třetích stran, na které případně odkazujeme, se nevztahují.
      </p>

      <h2>3. Jaké údaje shromažďujeme</h2>
      <h3>Údaje účtu (jsme správcem)</h3>
      <ul>
        <li>
          <strong>Přihlašovací údaje</strong> — vaše jméno, e-mailová adresa a heslo (ukládáme jen
          jeho osolený hash; heslo v čitelné podobě nikdy nevidíme).
        </li>
        <li>
          <strong>Nastavení a oznámení</strong> — vaše předvolby a oznámení, která vám v aplikaci
          zobrazujeme.
        </li>
        <li>
          <strong>Narozeniny</strong> — měsíc a den, případně i rok, pokud je zadáte, sdílené se
          skupinami, ve kterých jste, pokud se je rozhodnete sdílet.
        </li>
        <li>
          <strong>Komunikace s podporou</strong> — obsah e-mailů, které nám pošlete.
        </li>
        <li>
          <strong>Přihlášení přes Google, Microsoft nebo Apple</strong>: pokud se přihlásíte jedním
          z těchto účtů, poskytovatel nám pošle vaše jméno, e-mailovou adresu a profilový obrázek,
          pokud ho máte. Používáme je jen k založení vašeho účtu a k přihlášení.
        </li>
        <li>
          <strong>Propojení kalendáře</strong>: pokud k osobnímu kalendáři připojíte svůj kalendář
          Google nebo Microsoft, ukládáme přístupové tokeny, které poskytovatel vydá (šifrovaně),
          udělené oprávnění, zvolené časové pásmo a identifikátory událostí, které jsme vytvořili.
          Podrobnosti jsou v oddílu 6.
        </li>
      </ul>
      <h3>Údaje organizace (zpracováváme je pro vaši organizaci)</h3>
      <ul>
        <li>
          <strong>Pracovní a týmové údaje</strong> — organizace a skupiny, do kterých patříte, vaše
          role a pozvánky a vlastní kopie vašeho jména a e-mailu, kterou si vede organizace.
        </li>
        <li>
          <strong>Údaje o nepřítomnosti</strong> — žádosti o volno, které podáte, včetně dat, druhu
          volna (např. dovolená, nemoc, home office), stavu a poznámky, pokud ji připojíte, spolu s
          nároky, ze kterých se čerpají, a záznamem změn, který zachycuje, kdo co změnil.
        </li>
        <li>
          <strong>Poloha při docházce</strong> — pokud váš zaměstnavatel zapnul záznam polohy u
          docházky, ukládáme zeměpisnou šířku, délku a přesnost, které váš prohlížeč nahlásí ve
          chvíli příchodu a ve chvíli odchodu. Mezi těmito dvěma okamžiky se nic nezaznamenává a nic
          se nesbírá na pozadí: prohlížeč se vás pokaždé zeptá na svolení a odmítnutí se nijak
          nezaznamenává ani neoznačuje. Souřadnice vidíte vy a správci vaší organizace nebo skupiny;
          nikdo jiný je nevidí. Mažeme je dvanáct měsíců po pracovním dni, ke kterému patří — záznam
          docházky zůstává, jen bez polohy.
        </li>
        <li>
          <strong>Přílohy žádostí</strong> — soubory (obrázky nebo PDF), které vy nebo správce
          připojíte k žádosti o volno, například potvrzení od lékaře. Protože soubor může obsahovat
          údaje o zdravotním stavu, zacházíme s ním jako se zvláštní kategorií osobních údajů podle
          článku 9 GDPR. Ukládáme ho, aby ti, kdo o vaší žádosti rozhodují, měli podklad. Přílohy
          jsou uloženy šifrovaně na AWS ve Frankfurtu v Německu a otevřít nebo stáhnout je můžete
          jen vy, schvalovatelé skupiny a její správci; ostatní členové týmu ani nevidí, že příloha
          existuje. Přílohu mažeme dvanáct měsíců po nepřítomnosti, ke které patří, nebo dříve,
          pokud je žádost zrušena.
        </li>
        <li>
          <strong>Profily v adresáři lidí</strong> — pokud vlastník organizace zapnul adresář lidí,
          profil, který o vás organizace vede. Popisuje ho{" "}
          <a href="/cs/directory-agreement/">smlouva k adresáři lidí</a>.
        </li>
      </ul>
      <h3>Údaje, které shromažďujeme automaticky (jsme správcem)</h3>
      <ul>
        <li>
          <strong>Technické údaje</strong> — IP adresa, typ prohlížeče a zařízení a časové údaje,
          zaznamenávané v serverových protokolech kvůli bezpečnosti a spolehlivosti.
        </li>
        <li>
          <strong>Údaje o relaci</strong> — přihlašovací cookie a token v místním úložišti, díky
          kterým zůstáváte přihlášeni (viz oddíl 10).
        </li>
        <li>
          <strong>Push token</strong> — adresa, kterou Apple přidělí vašemu iPhonu pro oznámení;
          ukládáme ji, jen pokud v aplikaci pro iPhone oznámení povolíte.
        </li>
        <li>
          <strong>Údaje o chybách a výkonu</strong> — když se ve vašem prohlížeči nebo na našich
          serverech něco pokazí, zaznamenáme chybu, stránku nebo trasu API, kde nastala, verzi
          prohlížeče a operačního systému a měření časů, abychom ji mohli opravit. Záznam nese
          náhodný identifikátor, který platí jen pro aktuální kartu prohlížeče. Nenahráváme vaši
          obrazovku ani relaci a tyto údaje nepoužíváme k vytváření vašeho profilu.
        </li>
      </ul>

      <h2>4. Proč údaje používáme a na jakém právním základě</h2>
      <p>
        Tabulka se týká údajů, jejichž jsme správcem. U údajů organizace rozhoduje o účelu a právním
        základu zpracování organizace a za tuto volbu odpovídá. Údaje organizace zpracováváme jen
        proto, abychom jí poskytovali Službu.
      </p>
      <table>
        <thead>
          <tr>
            <th>Účel</th>
            <th>Právní základ (čl. 6 odst. 1 GDPR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Založení a správa vašeho účtu a vaše přihlášení</td>
            <td>Plnění smlouvy (b)</td>
          </tr>
          <tr>
            <td>
              Zápis vašich vlastních schválených nepřítomností do vašeho kalendáře Google nebo
              Microsoft, pokud ho připojíte
            </td>
            <td>Plnění smlouvy (b)</td>
          </tr>
          <tr>
            <td>Zasílání transakčních e-mailů (např. ověření e-mailu, oznámení)</td>
            <td>Plnění smlouvy (b) / oprávněný zájem (f)</td>
          </tr>
          <tr>
            <td>Zasílání push oznámení do aplikace pro iPhone</td>
            <td>Plnění smlouvy (b) / oprávněný zájem (f)</td>
          </tr>
          <tr>
            <td>Zabezpečení Služby a předcházení zneužití</td>
            <td>Oprávněný zájem (f)</td>
          </tr>
          <tr>
            <td>Diagnostika chyb a sledování výkonu, aby Služba fungovala</td>
            <td>Oprávněný zájem (f)</td>
          </tr>
          <tr>
            <td>Plnění právních povinností a odpovědi na zákonné žádosti</td>
            <td>Právní povinnost (c)</td>
          </tr>
        </tbody>
      </table>

      <h2>5. Komu údaje předáváme</h2>
      <p>
        Vaše osobní údaje neprodáváme. Uvnitř Služby vidí údaje organizace lidé ve vaší organizaci
        tak, jak to dovolují její nastavení a role, například váš tým a skupiny kvůli plánování
        zástupu. Spoléháme na tyto zpracovatele, kteří jednají podle našich pokynů na základě smluv
        o zpracování. Ti, kdo pracují s údaji organizace, jsou našimi dalšími zpracovateli a uvádí
        je <a href="/cs/dpa/">Smlouva o zpracování osobních údajů</a>:
      </p>
      <table>
        <thead>
          <tr>
            <th>Zpracovatel</th>
            <th>Účel</th>
            <th>Umístění</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Amazon Web Services (AWS)</td>
            <td>Provoz aplikace a ukládání databáze</td>
            <td>EU (Frankfurt, Německo)</td>
          </tr>
          <tr>
            <td>Amazon SES (AWS)</td>
            <td>Odesílání transakčních e-mailů</td>
            <td>EU (Frankfurt, Německo)</td>
          </tr>
          <tr>
            <td>Functional Software, Inc. (Sentry)</td>
            <td>Sledování chyb a diagnostika výkonu</td>
            <td>Region EU (Frankfurt, Německo); společnost sídlí ve Spojených státech</td>
          </tr>
          <tr>
            <td>Apple Inc. (Apple Push Notification service)</td>
            <td>
              Doručuje push oznámení do vašeho iPhonu; vidí text oznámení: jména a data
              nepřítomností a docházky
            </td>
            <td>Spojené státy</td>
          </tr>
          <tr>
            <td>Paddle.com Market Ltd</td>
            <td>
              Zpracování plateb, účtování předplatného, daně a fakturace (prodejce placených tarifů,
              Merchant of Record)
            </td>
            <td>Spojené království / EU</td>
          </tr>
        </tbody>
      </table>
      <p>
        U placených tarifů vystupuje jako prodejce Paddle: když si koupíte předplatné, zpracuje
        Paddle vaše platební údaje podle svých vlastních zásad ochrany osobních údajů — úplné údaje
        vaší platební karty nikdy nedostáváme.
      </p>
      <p>
        Údaje můžeme zpřístupnit také tehdy, když to vyžaduje zákon, když je to nutné k vymáhání
        našich Podmínek nebo k ochraně práv, bezpečnosti a zabezpečení našich uživatelů.
      </p>

      <h2>6. Propojení kalendářů a uživatelská data Google</h2>
      <p>
        K osobnímu kalendáři můžete připojit svůj vlastní kalendář Google nebo Microsoft. flexiday
        pak do primárního kalendáře tohoto účtu zapisuje vaše schválené nepřítomnosti a udržuje je
        aktuální, jak se vaše žádosti mění. Zapisují se tam jen vaše vlastní záznamy, nikdy záznamy
        kolegů.
      </p>
      <h3>K čemu máme přístup</h3>
      <p>
        Od Googlu žádáme jediné oprávnění, <code>calendar.events.owned</code>, které nám dovoluje
        vytvářet, měnit a mazat události v kalendářích, které vlastníte. Používáme ho jen u
        událostí, které jsme sami vytvořili. Vaše ostatní události, seznam kalendářů ani cizí
        kalendáře nečteme. Od Microsoftu žádáme <code>Calendars.ReadWrite</code> a{" "}
        <code>offline_access</code>, díky kterému synchronizace běží, i když jste odhlášeni, a
        používáme je stejně.
      </p>
      <h3>Co zapisujeme a ukládáme</h3>
      <p>
        Každá událost nese druh nepřítomnosti (například &bdquo;Dovolená&ldquo;), její data nebo
        časy, vaše časové pásmo a poznámku, kterou jste k žádosti připojili, pokud nějakou. Kdo vidí
        váš kalendář, například kolegové, se kterými ho vaše organizace sdílí, uvidí i tyto
        události. U nás ukládáme přístupové tokeny, které nám poskytovatel vydal, šifrovaně, spolu s
        uděleným oprávněním a identifikátorem každé vytvořené události, abychom ji mohli později
        upravit nebo odstranit.
      </p>
      <h3>Jak je používáme a co nikdy neděláme</h3>
      <p>
        Přístup, který udělíte, používáme jen k tomu, aby váš kalendář odpovídal vašim schváleným
        nepřítomnostem. Tato data, včetně uživatelských dat Google, neprodáváme, nepoužíváme k
        reklamě ani k trénování modelů umělé inteligence či strojového učení a nikomu je
        nepředáváme. Nikdo z flexiday je nečte, ledaže nás o to požádáte kvůli podpoře, vyžaduje to
        bezpečnost nebo to vyžaduje zákon.
      </p>
      <p>
        Používání informací získaných z Google API službou {LEGAL.product} a jejich předávání jiným
        aplikacím se řídí{" "}
        <a href="https://developers.google.com/terms/api-services-user-data-policy">
          zásadami Google API Services User Data Policy
        </a>
        , včetně požadavků na omezené použití (Limited Use).
      </p>
      <h3>Odpojení a smazání</h3>
      <p>
        Když kalendář odpojíte, smažeme z něj události, které jsme vytvořili, zrušíme svůj přístup u
        Googlu a smažeme tokeny, které jsme drželi. Microsoft nám zrušení přístupu z naší strany
        nenabízí; flexiday můžete odebrat v oprávněních aplikací svého účtu Microsoft. Přístup
        Googlu můžete kdykoli zrušit také na{" "}
        <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a> a
        synchronizaci pak zastavíme. Když smažete svůj účet flexiday, uděláme totéž nejprve u všech
        připojených kalendářů: smažeme události, které jsme vytvořili, zrušíme přístup u Googlu a
        smažeme tokeny. Co v tu chvíli odstranit nebo zrušit nedokážeme, zůstane; zbylou událost
        můžete smazat sami a přístup flexiday odebrat v oprávněních svého účtu Google.
      </p>

      <h2>7. Předávání mimo EU</h2>
      <p>
        Vaše údaje jsou uloženy v Evropské unii ({LEGAL.cs.hosting}). Pokud dojde k předání mimo
        Evropský hospodářský prostor, opíráme se o vhodné záruky, například o standardní smluvní
        doložky Evropské komise.
      </p>

      <h2>8. Jak dlouho údaje uchováváme</h2>
      <p>
        Údaje vašeho účtu uchováváme, dokud váš účet existuje. Účet můžete sami smazat v Nastavení,
        nebo nás požádat o výmaz údajů účtu. Údaje organizace zůstávají, dokud je organizace
        uchovává: organizace rozhoduje, kdy ukončí pracovní poměr, kdy vymaže záznamy člověka a kdy
        smaže sama sebe.
      </p>
      <h3>Smazání účtu</h3>
      <p>
        Smazáním účtu okamžitě odstraníte údaje svého účtu z našich provozních systémů: způsoby
        přihlášení, relace, nastavení, oznámení, propojení kalendářů (postupem z oddílu 6),
        registrace push oznámení a narozeniny.
      </p>
      <p>
        Nesmažete tím záznamy, které o vás vedou organizace, ve kterých pracujete, protože patří
        jim. Vaše pracovní poměry zůstávají otevřené a vaše schválené nepřítomnosti, přílohy
        žádostí, docházka, nároky a záznam změn zůstávají u každé organizace pod jménem a e-mailem,
        které pro vás vedla v okamžiku smazání. Správci organizace dostanou oznámení a organizace
        rozhodne, zda váš pracovní poměr ukončí, nebo vaše záznamy vymaže. Čekající žádosti se
        zruší, ať jsou na jakékoli datum. Pokud máte v tu chvíli zaznamenaný příchod bez odchodu,
        docházka se v okamžiku smazání uzavře a den se označí ke kontrole správcem. Skupiny, které
        spravujete v organizaci někoho jiného, přejdou na vlastníka této organizace. Před smazáním
        si můžete v Nastavení stáhnout údaje svého účtu a své vlastní záznamy z každé organizace, ve
        které pracujete.
      </p>
      <p>
        Pokud vlastníte organizaci, ve které už nepracuje nikdo jiný s účtem, smazáním účtu smažete
        i organizaci: její skupiny, záznam o předplatném a vše, co vede o jiných lidech, včetně
        bývalých členů, smazaných účtů a lidí, kteří účet nikdy neměli. To je pokyn organizace k
        ukončení služby a vlastník si předtím může stáhnout export organizace. Vlastník musí před
        smazáním účtu odebrat ostatní členy, kteří mají účet, a zrušit obnovující se předplatné.
        Paddle jako prodejce uchovává vlastní záznamy o minulých platbách podle svých zásad ochrany
        osobních údajů.
      </p>
      <h3>Výmaz údajů organizace</h3>
      <p>
        Údaje organizace o určitém člověku mohou vymazat jen vlastník a správci organizace, a to
        samostatným krokem, odděleně od ukončení pracovního poměru. Služba jim to umožní, jakmile
        člověk smaže svůj účet, nebo u člověka, který účet nikdy neměl. Pokud chcete své záznamy v
        organizaci vymazat nebo opravit, obraťte se na tuto organizaci.
      </p>
      <h3>Zálohy a další lhůty</h3>
      <p>
        Naše databázové zálohy postupně vypršují, takže smazané údaje z nich zmizí do sedmi dnů.
        Mažeme je, pokud nám zákon neukládá uchovávat je déle.
      </p>
      <p>
        Přílohy žádostí se mažou automaticky dvanáct měsíců po nepřítomnosti, nebo hned po zrušení
        žádosti. Souřadnice polohy u docházky se mažou dvanáct měsíců po pracovním dni, ke kterému
        patří, a samotný záznam docházky zůstává. Serverové protokoly uchováváme po omezenou dobu z
        bezpečnostních důvodů.
      </p>

      <h2>9. Vaše práva</h2>
      <p>Podle GDPR máte právo:</p>
      <ul>
        <li>na přístup k osobním údajům, které o vás vedeme;</li>
        <li>na opravu nepřesných údajů;</li>
        <li>na výmaz svých údajů (&bdquo;právo být zapomenut&ldquo;);</li>
        <li>na omezení některého zpracování nebo vznést proti němu námitku;</li>
        <li>získat své údaje ve strojově čitelném formátu (přenositelnost);</li>
        <li>kdykoli odvolat souhlas, pokud zpracování na souhlasu stojí.</li>
      </ul>
      <p>
        U údajů účtu napište na <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> a žádost
        vyřídíme sami. Údaje svého účtu si také můžete stáhnout a účet smazat v Nastavení.
      </p>
      <p>
        U údajů organizace je správcem vaše organizace a na vaši žádost odpovídá ona, ve lhůtách,
        které stanoví GDPR. Své vlastní záznamy z každé organizace, ve které pracujete, si můžete
        stáhnout v Nastavení. Pokud nám pošlete žádost týkající se údajů organizace, předáme ji
        vlastníkovi organizace a pomůžeme mu ji vyřídit; údaje organizace sami neměníme ani
        nemažeme.
      </p>
      <p>
        Máte také právo podat stížnost u dozorového úřadu, kterým je {LEGAL.cs.authority.name},{" "}
        {LEGAL.cs.authority.address} (<a href={LEGAL.authority.url}>{LEGAL.authority.url}</a>).
      </p>

      <h2>10. Cookies a místní úložiště</h2>
      <p>
        Ukládáme jen to, co Služba potřebuje ke svému fungování, a proto nevidíte žádnou cookie
        lištu. Nic z toho, co ukládáme, vás neidentifikuje napříč návštěvami a neprobíhá žádná
        analytika, reklama ani sledování napříč weby.
      </p>
      <ul>
        <li>
          <strong>Přihlášení.</strong> Relační cookie a odpovídající token v místním úložišti, díky
          kterým zůstáváte přihlášeni. Jejich vymazáním se odhlásíte.
        </li>
        <li>
          <strong>Diagnostika.</strong> Náhodný identifikátor (<code>fd.sid</code>) v úložišti
          relace vašeho prohlížeče, který seskupuje záznamy o chybách a výkonu popsané v oddílu 3.
          Zahodí se, když kartu zavřete, a nikdy nespojuje dvě návštěvy.
        </li>
        <li>
          <strong>Předvolby.</strong> Vaše volba světlého nebo tmavého vzhledu, uložená ve vašem
          prohlížeči.
        </li>
        <li>
          <strong>Platby.</strong> U placeného tarifu se při otevření pokladny načte Paddle, který
          si nastaví vlastní cookies ke zpracování platby a předcházení podvodům. Děje se to jen ve
          chvíli, kdy kliknete na předplatné nebo správu platební metody, nikdy při běžném zobrazení
          stránky.
        </li>
      </ul>

      <h2>11. Děti</h2>
      <p>
        Služba není určena dětem. Vědomě neshromažďujeme osobní údaje nikoho mladšího 16 let. Pokud
        se domníváte, že nám údaje poskytlo dítě, kontaktujte nás a my je odstraníme.
      </p>

      <h2>12. Zabezpečení</h2>
      <p>
        K ochraně vašich údajů přijímáme vhodná technická a organizační opatření. Podrobnosti
        najdete na stránce <a href="/security/">Zabezpečení</a> (v angličtině).
      </p>

      <h2>13. Změny těchto zásad</h2>
      <p>
        Tyto zásady můžeme čas od času aktualizovat. Změníme pak datum poslední aktualizace výše a u
        podstatných změn vás upozorníme výrazněji.
      </p>

      <h2>14. Kontakt</h2>
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
