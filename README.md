# NJSU Access Scholarship portal

The public scholarship site and applicant portal for New Jersey State University's four-year Access Scholarship.

## The applicant journey

1. **Eligibility check** (`/apply`): four questions, answered before any account exists. Applicants who don't qualify are told why, straight away.
2. **Account** on the same screen: name, email, password. No email round trip before starting.
3. **Application** (`/portal/application`): six short sections, documents and a review page. Every field autosaves; the applicant can leave and continue from any device. Errors show inline and sections can be skipped and finished later. "Edit" on the review page returns to review.
4. **Documents**: PDF/JPG/PNG up to 4 MB, drag and drop, large phone photos shrunk in the browser. Two required; two optional ones can be added after submitting. Files are checked by content and encrypted (AES-256-GCM) before storage.
5. **Confirmation** (`/portal/submitted`): reference number, what happens next, printable.
6. **Portal** (`/portal`): progress while in draft, then a status tracker (submitted → under review → interview → decision).

There is no application fee anywhere in the flow.

## Editing content

All dates, coverage, eligibility, FAQs and programmes are in `lib/content.ts`. The form's sections and fields are in `lib/form.ts`. Contact details appear only when `NEXT_PUBLIC_CONTACT_EMAIL` / `NEXT_PUBLIC_CONTACT_PHONE` are set.

## Running locally

```bash
npm install
node scripts/dev.mjs
```

Without `DATABASE_URL` the app uses an embedded Postgres (PGlite) in `.local/pglite`. Tables are created at first request.

## Production (Vercel)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection (Supabase transaction pooler), role `njsu_api`, schema `njsu` |
| `MASTER_KEY` | 32 random bytes, base64. Encrypts uploaded documents. Never change it once documents exist. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional. Scholarship office email shown in the footer and help text. |
| `NEXT_PUBLIC_CONTACT_PHONE` | Optional. |

`node scripts/secrets.mjs` creates `.local/secrets.json` (gitignored) with a database password and master key.

## Not built yet

- Committee review console (reading applications, moving them through review, interview and decision).
- Email (confirmation, password reset). Password resets currently go through the scholarship office.
