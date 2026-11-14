import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import { programme } from "@/lib/content";

export const metadata = {
  title: "Privacy Policy",
  description: `How ${programme.university} collects, uses and protects personal information in connection with the ${programme.name}.`,
};

const UPDATED = "13 November 2026";

export default function PrivacyPage() {
  const contact = programme.contactEmail;
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="pagehero">
          <div className="wrap">
            <span className="kicker light">{programme.university}</span>
            <h1>Privacy Policy</h1>
            <p>Last updated {UPDATED}</p>
          </div>
        </section>
        <section className="section">
          <div className="wrap-narrow prose">
            <p>
              This Privacy Policy explains how {programme.university} (“the University”, “we”, “us”) collects, uses, discloses and protects personal information
              when you visit this website, create an applicant account or apply for the {programme.name}.
            </p>

            <h2>1. Information we collect</h2>
            <h3>Information you provide</h3>
            <ul>
              <li>Account details: your name, email address and password. Passwords are stored in hashed form and cannot be read by staff.</li>
              <li>Application information: identity and contact details, academic background, household and financial circumstances, and personal statements.</li>
              <li>Supporting documents: academic transcripts and, for admitted scholars, identification documents, a photograph and immunisation records.</li>
              <li>Payment details: the bank account to which allowances are paid.</li>
              <li>Arrival details, emergency contacts and allowance requests submitted through the applicant portal.</li>
            </ul>
            <h3>Information collected automatically</h3>
            <p>
              When you create an account, sign in, submit an application, reset or change your password, or change your payment details, we log your IP address,
              the date and time, and your browser and device type. Our hosting providers also record IP addresses and the pages requested in server logs. We use
              this information to keep accounts secure, to detect and prevent fraud and misuse, and to investigate security incidents.
            </p>
            <h3>Cookies</h3>
            <p>
              We use strictly necessary cookies to keep you signed in and to remember your cookie preferences. Details are set out in our{" "}
              <Link href="/cookies">Cookie Policy</Link>.
            </p>

            <h2>2. How we use your information</h2>
            <ul>
              <li>To assess your eligibility and your application for admission and the scholarship.</li>
              <li>To verify the documents and information you provide with the issuing schools and authorities.</li>
              <li>To communicate with you about your application, your admission decision and your award.</li>
              <li>To administer awards, including paying allowances to your nominated bank account.</li>
              <li>To maintain the security of this website and protect against unauthorised access and fraud.</li>
              <li>To meet our legal, regulatory and audit obligations.</li>
            </ul>

            <h2>3. Who we share it with</h2>
            <p>We do not sell personal information. We disclose it only to:</p>
            <ul>
              <li>Members of the Scholarship Committee and University staff who need it to assess applications and administer awards.</li>
              <li>Service providers that host this website, store our data and deliver our email, under obligations of confidentiality.</li>
              <li>Schools, examination bodies and authorities, to verify documents you have submitted.</li>
              <li>Banks and payment providers, to pay allowances.</li>
              <li>Regulators, courts and law enforcement, where the law requires.</li>
            </ul>

            <h2>4. Storage and security</h2>
            <p>
              Your information is stored on servers located in the European Union and may be processed in other countries by our service providers. All
              connections to this website are encrypted. Uploaded documents and bank details are encrypted at rest. Access is limited to authorised staff, who
              sign in with two-step verification, and each time a member of staff opens a document or bank details it is recorded.
            </p>

            <h2>5. How long we keep it</h2>
            <p>
              Security logs, including IP addresses, are kept for 12 months. Application records are kept for the admission cycle and, for admitted scholars,
              for the duration of the award, and afterwards for as long as required for audit and legal purposes.
            </p>

            <h2>6. Your rights</h2>
            <p>
              Subject to the law of your country, you may ask for a copy of the personal information we hold about you, ask us to correct it, ask us to delete
              it, or object to how we use it. You can update most of your information yourself in the applicant portal, and you can change your cookie
              preferences at any time.
            </p>

            <h2>7. Contact</h2>
            <p>
              Questions and requests about this policy should be sent to the {programme.office}
              {contact ? (
                <>
                  {" "}
                  at <a href={`mailto:${contact}`}>{contact}</a>
                </>
              ) : null}
              .
            </p>

            <h2>8. Changes to this policy</h2>
            <p>We may update this policy from time to time. The date at the top of this page shows when it was last revised.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
