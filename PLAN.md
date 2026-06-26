# QuotePilot Android MVP Plan

## Summary
- Build QuotePilot as an Android-first Expo SDK 56 React Native app using TypeScript, Expo Router, Supabase Auth/Postgres, React Hook Form, Zod, client-side PDFs, and soft usage limits.
- Current repo is a clean Expo starter with SDK 56, React 19, React Native 0.85, typed routes, and no top-level feature deps installed yet.
- Key tradeoffs: Supabase direct client plus RLS instead of a custom backend; local heuristic quote parsing instead of AI; client-side PDF generation instead of server PDF rendering; soft paywall prompts instead of hard subscription enforcement.
- Docs reviewed: Expo Router SDK 56, Stack, Native Tabs, Print, Sharing, Clipboard, AsyncStorage, Expo env vars, Supabase React Native Auth, and Supabase RLS. ([docs.expo.dev](https://docs.expo.dev/versions/v56.0.0/sdk/router/)) ([docs.expo.dev](https://docs.expo.dev/versions/v56.0.0/sdk/router/stack)) ([docs.expo.dev](https://docs.expo.dev/versions/v56.0.0/sdk/router/native-tabs)) ([docs.expo.dev](https://docs.expo.dev/versions/v56.0.0/sdk/print)) ([docs.expo.dev](https://docs.expo.dev/versions/v56.0.0/sdk/sharing)) ([docs.expo.dev](https://docs.expo.dev/versions/v56.0.0/sdk/clipboard)) ([docs.expo.dev](https://docs.expo.dev/versions/v56.0.0/sdk/async-storage/)) ([docs.expo.dev](https://docs.expo.dev/guides/environment-variables/)) ([supabase.com](https://supabase.com/docs/guides/auth/quickstarts/react-native)) ([supabase.com](https://supabase.com/docs/guides/database/postgres/row-level-security))

## Key Changes
- Use `expo-router` route groups with `Stack` and stable `Tabs` imports from `expo-router`; avoid external `@react-navigation/*` imports per SDK 56 guidance.
- Install runtime deps: `@supabase/supabase-js`, `react-native-url-polyfill`, `@react-native-async-storage/async-storage`, `react-hook-form`, `@hookform/resolvers`, `zod`, `zustand`, `expo-print`, `expo-sharing`, `expo-clipboard`.
- Add env vars: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; never use Supabase secret/service-role keys in the app.
- Use AsyncStorage for Supabase session persistence following Supabase’s React Native guidance; use RLS as the real data boundary.
- Demo mode is local-only with seeded demo data and working PDF/share flows; it does not sync to Supabase.

## App Structure
```text
src/app/
  _layout.tsx
  (auth)/welcome.tsx login.tsx signup.tsx
  (onboarding)/business.tsx
  (app)/_layout.tsx
  (app)/(tabs)/_layout.tsx dashboard.tsx clients.tsx estimates.tsx invoices.tsx more.tsx
  (app)/clients/new.tsx [id].tsx [id]/edit.tsx
  (app)/services/index.tsx new.tsx [id]/edit.tsx
  (app)/estimates/new.tsx [id].tsx [id]/edit.tsx
  (app)/invoices/new.tsx [id].tsx [id]/edit.tsx
  (app)/follow-ups.tsx settings.tsx pricing.tsx
src/components/ui/ src/features/ src/lib/ src/types/ supabase/migrations/
```
- `src/features/*` owns feature screens/hooks/forms; `src/lib/supabase`, `src/lib/money`, `src/lib/pdf`, `src/lib/quick-quote`, and `src/lib/repositories` hold shared logic.
- Shared UI should be small mobile SaaS primitives: buttons, inputs, list rows, metric tiles, status badges, empty/loading/error states.
- Zustand is limited to auth/demo/ui state; persisted business data comes from Supabase except demo data.

## Data Model
- Supabase tables: `profiles`, `business_profiles`, `clients`, `service_items`, `estimates`, `estimate_line_items`, `invoices`, `invoice_line_items`, `usage_counters`.
- Use the requested entity fields, with these storage decisions: money fields become integer minor units like `subtotal_minor`, `unit_price_minor`, `total_minor`; tax rates become integer basis points like `tax_rate_bps`; quantities become `quantity_milli`; currency is stored as ISO code.
- Add `user_id` to every user-owned table, including line item tables, for simple RLS and indexing.
- Use text columns with check constraints for statuses, unit types, categories, discount types, and plan values instead of Postgres enums for easier MVP iteration.
- Add unique constraints for `business_profiles.user_id`, monthly usage by `(user_id, month)`, and document numbers by `(user_id, estimate_number)` / `(user_id, invoice_number)`.
- RLS: enable on every public table; authenticated users can select/insert/update/delete only rows where `user_id = auth.uid()`; `profiles.id = auth.uid()`; no app table access for anonymous public users.
- Document numbers use business prefixes plus a per-user count with unique-constraint retry; a DB sequence/RPC can be added later if concurrent document creation becomes real.

## Development Order
1. Reset starter screens into the QuotePilot shell: theme tokens, auth/onboarding/app route groups, tabs, headers, and placeholder states.
2. Add dependencies, Supabase client, auth context, login/signup/demo mode, protected route redirects, and env validation.
3. Create Supabase migration with schema, indexes, constraints, and RLS policies.
4. Build business onboarding and settings defaults: country, currency, manual tax/VAT rate, terms, payment instructions.
5. Build clients and saved service items CRUD with Zod forms.
6. Build estimate creation/detail flow: client selection, line items, discount/tax totals, status changes, and Quick Quote Assistant parsing.
7. Build professional estimate PDF HTML, `expo-print` file generation, `expo-sharing`, copied share message, copied follow-up message, and optional `mailto:`.
8. Build invoice creation/detail and estimate-to-invoice conversion, including invoice PDFs and paid/unpaid tracking.
9. Build dashboard metrics, follow-ups screen, usage counters, and pricing/paywall placeholder with soft upgrade prompts at 2/3 and over 3 monthly estimates/invoices.
10. Polish Android UX: loading/error/empty states, keyboard-safe forms, large tap targets, PDF visual review, lint/typecheck, and manual emulator pass.

## Test Plan And Acceptance
- Pure logic tests: money formatting/calculation, discount/tax rounding, Quick Quote Assistant parsing, usage-limit prompts, follow-up eligibility.
- Integration/manual scenarios: signup/login, demo mode, onboarding, client CRUD, estimate creation, PDF export/share, estimate status changes, convert to invoice, invoice PDF export/share, follow-up copy, dashboard metrics.
- First working version is accepted when a new Android user can sign up, create a business profile/client/estimate, generate and share a professional estimate PDF, convert it to an invoice, generate/share invoice PDF, see dashboard/follow-up state, and encounter no cross-user data leakage under RLS.
- Verification commands after implementation: `npm run lint`, `npx tsc --noEmit`, and Android emulator smoke test.

## Assumptions And Postponed Work
- Country presets only set currency; tax/VAT rate stays user-entered to avoid giving incorrect tax advice.
- Saved service items are implemented in MVP but only marketed as future Pro value; the placeholder paywall does not aggressively block.
- Follow-up defaults: sent estimates appear after 3 days if no explicit `follow_up_date`; invoices appear when sent/unpaid/overdue and due or 7 days after issue if no due date.
- Postpone Stripe/RevenueCat, real AI, OCR, push notifications, background reminders, iOS polish, web dashboard, team accounts, advanced tax rules, logo uploads/custom branding, analytics, server-rendered PDFs, and EAS production builds.
