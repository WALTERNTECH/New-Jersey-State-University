"use client";

export default function SignOutButton({ className }: { className?: string }) {
  return (
    <a
      href="/"
      className={className}
      onClick={async (e) => {
        e.preventDefault();
        await fetch("/api/auth/signout", { method: "POST", headers: { "x-njsu": "1" } }).catch(() => {});
        window.location.href = "/";
      }}
    >
      Sign out
    </a>
  );
}
