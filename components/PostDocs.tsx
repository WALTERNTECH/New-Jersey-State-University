"use client";

import { useState } from "react";
import Documents, { type Doc } from "./Documents";

/** After submission: required documents are fixed, optional ones can still be added or updated. */
export default function PostDocs({ initial }: { initial: Doc[] }) {
  const [docs, setDocs] = useState(initial);
  return <Documents docs={docs} onChange={setDocs} locked />;
}
