"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Documents, { type Doc } from "./Documents";

/** Identification documents for admitted scholars: each is verified by the Office, and a verified file is final. */
export default function EnrolmentDocs({ initial }: { initial: Doc[] }) {
  const router = useRouter();
  const [docs, setDocs] = useState(initial);
  return (
    <Documents
      docs={docs}
      set="enrolment"
      locked
      onChange={(d) => {
        setDocs(d);
        router.refresh();
      }}
    />
  );
}
