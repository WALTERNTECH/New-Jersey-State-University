import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/Chrome";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="thanks">
        <div className="wrap-narrow center">
          <span className="kicker">Page not found</span>
          <h1 className="mt16">We couldn’t find that page</h1>
          <p className="lede">It may have moved. Start from the scholarship home page or your applicant portal.</p>
          <div className="flex mt32" style={{ justifyContent: "center" }}>
            <Link className="btn btn-primary" href="/">
              Scholarship home
            </Link>
            <Link className="btn btn-ghost" href="/portal">
              Applicant portal
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
