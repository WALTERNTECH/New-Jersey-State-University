import { SiteFooter, SiteHeader } from "@/components/Chrome";
import CookieSettingsLink from "@/components/CookieSettingsLink";
import { programme } from "@/lib/content";

export const metadata = { title: "Cookies" };

const cookies = [
  { name: "njsu_session", purpose: "Keeps applicants signed in to the applicant portal.", lasts: "30 days", kind: "Strictly necessary" },
  { name: "njsu_staff", purpose: "Keeps committee members signed in to the committee console.", lasts: "12 hours", kind: "Strictly necessary" },
  { name: "njsu_consent", purpose: "Remembers your cookie choice.", lasts: "12 months", kind: "Strictly necessary" },
];

export default function CookiesPage() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="pagehero">
          <div className="wrap">
            <span className="kicker light">{programme.university}</span>
            <h1>Cookies</h1>
          </div>
        </section>
        <section className="section">
          <div className="wrap-narrow stack" style={{ gap: 28 }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Cookie</th>
                  <th>Purpose</th>
                  <th>Expires</th>
                  <th>Type</th>
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
            <p>No analytics or advertising cookies are used.</p>
            <div>
              <CookieSettingsLink className="btn btn-primary">Change cookie settings</CookieSettingsLink>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
