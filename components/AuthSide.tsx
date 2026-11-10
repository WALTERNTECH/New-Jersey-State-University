import { BackgroundVideo } from "./Motion";

/** The left half of the sign-in and application pages: campus footage under the University's message. */
export default function AuthSide({ eyebrow, title, body, points }: { eyebrow: string; title: string; body: string; points?: string[] }) {
  return (
    <aside className="authx-side">
      <BackgroundVideo src="/media/hero-1.mp4" poster="/media/hero-1.jpg" />
      <div>
        <span className="eyebrow light anim">{eyebrow}</span>
        <h1 className="anim" style={{ animationDelay: "0.1s" }}>{title}</h1>
        <p className="anim" style={{ animationDelay: "0.2s" }}>{body}</p>
        {points && (
          <ul className="anim" style={{ animationDelay: "0.3s" }}>
            {points.map((p) => (
              <li key={p}>
                <i>✓</i>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
