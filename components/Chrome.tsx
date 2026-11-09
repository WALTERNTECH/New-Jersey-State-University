import Link from "next/link";
import { programme } from "@/lib/content";
import { currentApplicant } from "@/lib/auth";
import SignOutButton from "./SignOutButton";

export function Brand({ sub = "Office of Student Financial Aid" }: { sub?: string }) {
  return (
    <Link href="/" className="brand" aria-label={`${programme.university} home`}>
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
          <span className="tag">{programme.name} · {programme.cycle} · Applications close {programme.deadline}</span>
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
          <Brand sub={portal ? "Applicant portal" : "Office of Student Financial Aid"} />
          <nav className="mainnav" aria-label="Main">
            {!portal && (
              <>
                <Link className="link" href="/#coverage">The scholarship</Link>
                <Link className="link" href="/#eligibility">Eligibility</Link>
                <Link className="link" href="/#dates">Key dates</Link>
                <Link className="link" href="/#faq">Questions</Link>
              </>
            )}
            {me ? (
              <Link className="btn btn-primary btn-sm" href="/portal">
                {portal ? "Dashboard" : "Continue application"}
              </Link>
            ) : (
              <Link className="btn btn-primary btn-sm" href="/apply">
                Apply now
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
          <div style={{ maxWidth: 360 }}>
            <Brand />
            <p className="mt16">
              The {programme.name} funds four years of undergraduate study for students whose families cannot meet the cost of university.
            </p>
          </div>
          <nav aria-label="Footer">
            <div>
              <b>Scholarship</b>
              <Link href="/#coverage">What it covers</Link>
              <Link href="/#eligibility">Who can apply</Link>
              <Link href="/#dates">Key dates</Link>
              <Link href="/#faq">Questions</Link>
            </div>
            <div>
              <b>Applicants</b>
              <Link href="/apply">Start an application</Link>
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
        <div className="bottom">
          <span>© {year} {programme.university}</span>
          <span>Applying is free. We never ask for payment at any stage of the scholarship process.</span>
        </div>
      </div>
    </footer>
  );
}
