/** The page title above the sign-in and application forms. */
export default function AuthSide({ eyebrow, title }: { eyebrow: string; title: string; body?: string; points?: string[] }) {
  return (
    <div className="authx-side">
      <div className="wrap">
        <p className="kicker">{eyebrow}</p>
        <h1>{title}</h1>
      </div>
    </div>
  );
}
