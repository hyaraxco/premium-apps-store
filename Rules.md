# Premium Apps by Hyarax — Engineering and Contributor Rules

Applies to humans, AI agents, automation, and pull requests.

## 1. Source of Truth

Read before changing code:

1. `Prd.md` — product scope and release gates.
2. `Architecture.md` — service boundaries and data flows.
3. `Design.md` — UI system and interaction rules.
4. `Schema.md` — persisted model and migration policy.
5. `Rules.md` — execution constraints.
6. Repository `AGENTS.md` and relevant Next.js docs under `node_modules/next/dist/docs/`.

Code wins when documentation is stale, but stale documentation must be updated in the same change.

## 2. Mandatory Workflow

1. Classify task: bugfix, feature, refactor, docs, config, test, or release.
2. Inspect current implementation and git status.
3. Define observable acceptance criteria.
4. Perform impact scan: files, callers, routes, schema, persisted state, tests.
5. Make smallest reversible change.
6. Self-review diff.
7. Run targeted verification, then wider checks proportional to risk.
8. Report changed behavior, exact evidence, and remaining risks.

Bugfixes require exact error/reproduction before editing. After three failed focused attempts, stop and escalate instead of stacking patches.

## 3. Git and Ownership

- Commit author must be `hyaraxco <hyarax.id@gmail.com>`.
- Before every commit or push, verify:

```bash
git config user.name
git status --short
```

- Commit, push, tag, merge, or open PR only after explicit user request.
- Never force-push, bypass hooks, amend published history, or commit secrets.
- Stage only intended files.
- Do not commit environment files, context files, generated screenshots, DB dumps, or credentials. A sanitized `.env.example` containing names and fake values is the only environment-file exception.
- Commit format: `<type>(<scope>): <description>`.

## 4. Naming and Brand

- Canonical full brand: `Premium Apps by Hyarax`.
- Compact UI brand: `Hyarax Apps`.
- Monogram: `Hx`.
- Customer-facing copy must not say Stackbay.
- Existing `stackbay-*` storage/event keys are persisted technical identifiers. Rename only with explicit backward-compatible migration.
- Code symbols use English; customer copy uses clear Indonesian.

## 5. TypeScript and React

- No `any` unless integration boundary proves unavoidable and is documented.
- Prefer domain unions over free-form strings.
- Validate external/server-action input at runtime; TypeScript is not validation.
- Server Components are default.
- Add `'use client'` only at smallest interactive boundary.
- Client Components must not import DB, environment secrets, or server-only modules.
- Do not trigger side effects inside state updater/render.
- Preserve semantic HTML; ARIA supplements, never replaces, native semantics.
- Await App Router `params` and `searchParams` promises.
- Use `server-only` guard for server data modules.

## 6. Next.js

- Read version-matched docs in `node_modules/next/dist/docs/` before changing framework conventions.
- Fetch database directly in Server Components; do not create internal API route wrappers without a real external/client need.
- Server Actions:
  - validate input;
  - verify auth internally;
  - return typed/actionable errors;
  - revalidate affected routes/tags;
  - remain idempotent where retries are possible.
- Add `loading.tsx`, `error.tsx`, and `not-found.tsx` where dynamic route risk warrants them.
- Caching must be explicit. Orders/admin/payment use no stale cache.
- Never expose secrets through `NEXT_PUBLIC_*`.

## 7. Database and Migrations

- `src/db/schema.ts` plus checked-in migrations define persisted structure.
- Never change schema without reading `Schema.md` and existing migrations.
- Never use destructive migration against production without explicit approval and backup/Neon branch.
- Do not edit applied migrations.
- Checkout and fulfillment multi-write operations are transactions.
- Inventory updates are concurrency-safe and cannot go negative.
- Preserve order snapshots when catalog data changes.
- Add indexes for foreign-key/filter/order paths intentionally; do not index every column.
- Seed scripts are idempotent and must not overwrite operator changes accidentally.

## 8. Security and Privacy Boundaries

Never:

- Store or expose plaintext fulfillment passwords in public responses.
- Trust product price, total, stock, status, or role from client.
- Authorize admin mutations by cookie presence alone.
- Log session tokens, API keys, QRIS source payload, credentials, or full PII.
- Return fake order/product data after production DB failure.
- Put real bank account, QRIS payload, WhatsApp number, or password into docs/tests/source.

Required:

- Cryptographically random session and public tracking tokens.
- Server-side admin session validation in every admin action.
- Encryption at rest for fulfillment secrets.
- Rate limiting backed by shared durable store in serverless production.
- Generic public errors; detailed server-only logs with redaction.
- Explicit authorization review for every new admin/public-data route.

## 9. Commerce Rules

- Browser cart is advisory; server recalculates all prices.
- Variant must belong to product.
- Quantity and duration must be positive and within product rules.
- Month 12 promo applies only when configured.
- Order creation is idempotent.
- Payment status and fulfillment status follow allowed transitions.
- Unknown order returns 404; never fabricate demo state in production.
- Email failure is retryable and visible to admin.
- QRIS amount and CRC require verified tests before release.

## 10. UI and Design Rules

- Follow `Design.md`; do not invent a new visual language mid-task.
- Reuse CSS tokens and shared components.
- No colored status rails, generic pastel chip collection, glassmorphism, fake reviews, or decorative gradients.
- One primary action per panel.
- Support light, dark, mobile, keyboard, focus, and reduced motion.
- Status cannot rely on color alone.
- New forms require labels, field errors, ARIA linkage, pending state, and preserved values.
- Generic AI Risk score 3+ requires revision before completion.

## 11. Testing and Verification

Canonical package manager is **npm** because `package-lock.json` is the deployment lockfile. Do not update `bun.lock`; remove it only in an explicit lockfile-cleanup change after confirming Vercel/npm behavior.

Minimum after TypeScript code changes:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Also run focused checks:

- DB/schema: migration generation review, disposable DB apply, seed test.
- Checkout: pricing, invalid input, stock race, rollback, idempotency.
- Auth: no cookie, fake cookie, expired session, valid session, direct action call.
- QRIS: known CRC vectors and real scanner sandbox/manual verification.
- Email: mock/test inbox; never send production email during routine tests.
- UI: desktop/tablet/mobile, light/dark, keyboard, reduced motion.
- Routes: public 200, protected redirect, unknown IDs 404.

Never claim fixed/ready/passing without fresh command output from current turn.

## 12. Dependency Rules

- Standard library/platform first.
- Reuse installed dependency before adding another.
- Add dependency only when it removes meaningful risk or complex maintained code.
- Verify official docs, current version compatibility, license, maintenance, bundle/runtime impact, and security audit.
- No package for trivial helpers.
- Lockfile changes require review.

## 13. Protected Areas

Require explicit user approval before changing:

- Product pricing, stock, warranty, or legal terms.
- Payment account and QRIS configuration.
- Domain/DNS/email sender configuration.
- Authentication/session model.
- Database destructive migrations or data deletion.
- GitHub visibility, repository ownership, Vercel production deployment.
- Public brand name and persisted storage-key migration.

Do not modify unrelated files, user work, other projects, or global machine configuration.

## 14. Documentation Maintenance

- Product-scope changes update `Prd.md`.
- Service/data-flow/tool changes update `Architecture.md`.
- UI token/component/flow changes update `Design.md`.
- Schema/index/constraint/migration changes update `Schema.md`.
- Workflow/security/contributor-boundary changes update `Rules.md`.

Documentation change belongs in same PR/commit as behavior change.
