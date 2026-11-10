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
| `ADMIN_SETUP_TOKEN` | Lets the first committee owner be created at `/committee/setup`. Only works while there are no committee accounts. Locally it is `local-setup`. |

`node scripts/secrets.mjs` creates `.local/secrets.json` (gitignored) with a database password and master key. `node scripts/vercel-env.mjs` copies the secrets to Vercel production.

## Committee console (`/committee`)

- **Sign-in**: email and password, then a 6-digit code from an authenticator app (set up on first sign-in; a code can't be used twice). Sessions last 12 hours. 6 wrong passwords lock the account for 15 minutes.
- **Roles**: *reviewer* reads, scores, adds notes and opens reviews; *chair* also moves applications to interview and makes decisions, and can export; *owner* also adds members, changes roles, turns access off and resets sign-ins.
- **Dashboard**, in priority order: work waiting for a person, today's numbers, the pipeline, the 30-day trend, who is applying, recent activity.
- **Applications**: stage tabs, search, filters by country and programme, sort by score. Each application shows its answers, essays, documents (opening one is logged), the committee's scores (four criteria, 1–5 each, out of 20), internal notes and the stage history.
- **Stages**: submitted → under review → interview → awarded / waitlisted / not selected. Decisions can be revised. The applicant's portal shows each stage and the decision; committee notes and reasons are never shown to applicants.
- **Activity log** (owner): every sign-in, document view, score, note, stage change and export. **Export** (chair, owner): CSV of submitted applications without essays or documents.

New members get a one-time password from the owner (shown once, to pass on privately); they set up their authenticator and choose their own password at first sign-in.

## Not built yet

- Email (application confirmation, decision emails, password reset). Applicant password resets go through the scholarship office; committee resets through an owner.
