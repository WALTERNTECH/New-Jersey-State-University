export default function AuthCard({ title, sub, children }: { title: string; sub: React.ReactNode; children: React.ReactNode }) {
  return (
    <main id="main" className="c-auth">
      <div className="card">
        <div className="brandrow">
          <span className="crest">
            <img src="/crest.png" alt="" width={40} height={37} />
          </span>
          <div>
            <b>New Jersey State University</b>
            <span>Scholarship committee</span>
          </div>
        </div>
        <h2>{title}</h2>
        <p className="sub">{sub}</p>
        {children}
      </div>
    </main>
  );
}
