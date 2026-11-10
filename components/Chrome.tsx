import Link from "next/link";
import { programme } from "@/lib/content";
import { currentApplicant } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export function Brand({ sub = "Admissions and Financial Aid", light = false }: { sub?: string; light?: boolean }) {
  return (
    <Link href="/" className={`brand${light ? " light" : ""}`} aria-label={`${programme.university} home`}>
      <span className="crest">
        <img src="/crest.png" alt="" width={40} height={37} />
      </span>
      <span className="wordmark">
        <b>{programme.university}</b>
        <span>{sub}</span>
      </span>
    </Link>
  );
}

export async function SiteHeader({ portal = false }: { portal?: boolean }) {
  const me = await currentApplicant().catch(() => null);
  return (
    <>
      <div className="utility">
        <div className="wrap">
          <span className="tag">
            {programme.name} · {programme.cycle} · Applications close {programme.deadline}
          </span>
          <nav aria-label="Account">
            {me ? (
              <>
                <Link href="/portal">Applicant portal</Link>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link href="/signin">Sign in</Link>
                <Link href="/apply">Apply</Link>
              </>
            )}
          </nav>
        </div>
      </div>
      <header className="masthead">
        <div className="wrap">
          <Brand sub={portal ? "Applicant portal" : "Admissions and Financial Aid"} />
          <nav className="mainnav" aria-label="Main">
            {!portal && (
              <>
                <Link className="link" href="/#award">The Scholarship</Link>
                <Link className="link" href="/financial-aid">Financial Aid</Link>
                <Link className="link" href="/#eligibility">Eligibility</Link>
                <Link className="link" href="/#dates">Key Dates</Link>
              </>
            )}
            {me ? (
              <Link className="btn btn-primary btn-sm" href="/portal">
                {portal ? "Dashboard" : "Applicant portal"}
              </Link>
            ) : (
              <Link className="btn btn-primary btn-sm" href="/apply">
                Apply
              </Link>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="top">
          <div style={{ maxWidth: 380 }}>
            <Brand light />
            <p className="mt16">
              The {programme.name} meets the full cost of attendance for four years of undergraduate study for students of exceptional promise and
              demonstrated financial need.
            </p>
          </div>
          <nav aria-label="Footer">
            <div>
              <b>Admissions</b>
              <Link href="/#award">The Scholarship</Link>
              <Link href="/#eligibility">Eligibility</Link>
              <Link href="/#dates">Key Dates</Link>
              <Link href="/#faq">Frequently Asked Questions</Link>
            </div>
            <div>
              <b>Financial Aid</b>
              <Link href="/financial-aid">Allowances</Link>
              <Link href="/financial-aid#how">How allowances are requested</Link>
            </div>
            <div>
              <b>Applicants</b>
              <Link href="/apply">Begin an application</Link>
              <Link href="/signin">Sign in</Link>
              <Link href="/portal">Applicant portal</Link>
            </div>
            {(programme.contactEmail || programme.contactPhone) && (
              <div>
                <b>Contact</b>
                {programme.contactEmail && <a href={`mailto:${programme.contactEmail}`}>{programme.contactEmail}</a>}
                {programme.contactPhone && <a href={`tel:${programme.contactPhone.replace(/\s/g, "")}`}>{programme.contactPhone}</a>}
              </div>
            )}
          </nav>
        </div>
        <p className="notice">
          <b>Fraud notice.</b> New Jersey State University does not charge candidates for any part of the admission or scholarship process and never requests
          payment by telephone, messaging service or email. Requests for payment made in the University’s name should be disregarded.
        </p>
        <div className="bottom">
          <span>© {year} {programme.university}</span>
          <span>{programme.office}</span>
        </div>
      </div>
    </footer>
  );
}
