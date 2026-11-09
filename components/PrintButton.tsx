"use client";

export default function PrintButton() {
  return (
    <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
      Print confirmation
    </button>
  );
}
