# Exam Date Alert

試験日程・出題予想通知

## Repository

Recommended repository name: `exam-date-alert`

## Domain candidates

Confirmed domain: `examdate.jp`

Other candidates:

- `examdate.jp`
- `shikakuday.jp`
- `examalert.jp`
- `shikenwatch.jp`

## Concept

行政書士、宅建、FPなどの試験日、申込期限、出題予想を通知し、教材・模試へ送客する。

## Technical Selection

- Frontend: Vite + React 19
- Styling: Plain CSS
- Initial data: Static alert seed records in `src/App.jsx`
- Local state: localStorage for MVP saved alerts and UGC requests
- Notification integrations: LINE Messaging API, X API, transactional email provider, Slack Incoming Webhooks
- Future data layer: Supabase or Cloudflare D1
- SEO/AIO/LLMO: structured data, answer block, FAQ, sitemap, robots and `llms.txt`

## Revenue Paths

- 教材販売
- 模試販売
- 講座送客
- メールスポンサー
- 月額課金

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```
