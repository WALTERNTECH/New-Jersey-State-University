import "./committee.css";

export const metadata = { title: { default: "Committee", template: "%s · NJSU Committee" }, robots: { index: false, follow: false } };

export default function CommitteeLayout({ children }: { children: React.ReactNode }) {
  return <div className="cmt">{children}</div>;
}
