import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/Chrome";
import CookieSettingsLink from "@/components/CookieSettingsLink";
import { programme } from "@/lib/content";

export const metadata = { title: "Cookie Policy", description: `The cookies used on the ${programme.university} admissions website and how to manage them.` };

const cookies = [
  { name: "njsu_session", purpose: "Authenticates applicants and keeps them signed in to the applicant portal.", lasts: "30 days", kind: "Strictly necessary" },
  { name: "njsu_staff", purpose: "Authenticates committee members in the committee console.", lasts: "12 hours", kind: "Strictly necessary" },
  { name: "njsu_consent", purpose: "Stores your cookie preferences.", lasts: "12 months", kind: "Strictly necessary" },
];

export default function CookiesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="pagehero">
          <div className="wrap">
            <span className="kicker light">{programme.university}</span>
            <h1>Cookie Policy</h1>
            <p>Last updated 13 November 2026</p>
          </div>
        </section>
        <section className="section">
          <div className="wrap-narrow prose">
            <p>
              Cookies are small text files placed on your device when you visit a website. This policy explains which cookies this website uses and how you can
              manage them. It should be read together with our <Link href="/privacy">Privacy Policy</Link>.
            </p>

            <h2>Cookies we use</h2>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Purpose</th>
                  <th>Duration</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {cookies.map((c) => (
                  <tr key={c.name}>
                    <td className="mono">{c.name}</td>
                    <td>{c.purpose}</td>
                    <td style={{ whiteSpace: "nowrap" }}>{c.lasts}</td>
                    <td>{c.kind}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              All of these are first-party cookies set by this website. We do not use advertising or third-party tracking cookies, and no performance or
              analytics cookies are set at present. If that changes, they will be used only with your consent.
            </p>

            <h2>Managing your preferences</h2>
            <p>
              You can review and change your choices at any time. You can also block or delete cookies in your browser settings; if you block strictly necessary
              cookies, you will not be able to sign in.
            </p>
            <p>
              <CookieSettingsLink className="btn btn-primary">Cookie settings</CookieSettingsLink>
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
