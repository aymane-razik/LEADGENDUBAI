# Dune Demo Recording Guide

## Start the isolated demo

Run `run-demo.bat`. It checks MongoDB and Redis, creates a local-only `backend/.env.demo` on first use, reseeds the dedicated `dubai-realestate-demo` database, then starts the API, worker, and frontend on their own ports:

- Workspace: `http://localhost:3010/login`
- Public landing page: `http://localhost:3010/`
- API readiness: `http://localhost:5010/api/v1/health`
- Demo login: `admin@dubairealestate.com` / `Demo@123456`

`backend/.env.demo` contains generated development-only signing and encryption keys and is ignored by Git. The seeder refuses to connect to any Mongo database except the exact local `dubai-realestate-demo` database. It clears that demo database on each seed run, then recreates stable sample content. It never seeds the app's ordinary `dubai-realestate` database.

The seeded workspace has eight users, 60 leads across a realistic status funnel, 35 listings, six campaigns, activities, four scraper records, and three inactive webhook examples. The webhook examples point to `.invalid` domains so a recording does not send demo data to a third party. Use `seed-demo.bat` to restore the sample data between takes. Use `stop-demo.bat` to stop only the process trees started by the demo launcher; MongoDB and Redis remain running so the seeded database is retained.

## Demo accounts

All eight seeded accounts use `Demo@123456`:

| Role | Email |
| --- | --- |
| Admin | `admin@dubairealestate.com` |
| Manager | `manager@dubairealestate.com` |
| Agent | `ahmed@dubairealestate.com` |
| Agent | `omar@dubairealestate.com` |
| Agent | `fatima@dubairealestate.com` |
| Agent | `khalid@dubairealestate.com` |
| Agent | `noor@dubairealestate.com` |
| Agent | `mohammed@dubairealestate.com` |

If MongoDB and Redis are not already listening locally, the launcher can start the isolated services in `docker-compose.demo.yml` when Docker Desktop is available. If only one service is missing, start that service before retrying.

## Suggested recording path

1. Start on `/` and capture the editorial landing page, moving map illustration, principle cards, and workspace call to action.
2. Enter the workspace and sign in with the demo access button or one of the accounts above.
3. Show the live overview, lead funnel, priority action, recent prospects, and featured Dubai supply.
4. Open the leads workspace, filter by status or quality, inspect a scored lead, then create a prospect.
5. Explore properties and open a listing detail page.
6. Show campaign and agent metrics, analytics, settings, and the background scraper state.
7. Show the webhook integration screen and point out that sample endpoints are deliberately inactive until an organization adds a real HTTPS endpoint.

## Demo-safe actions

Campaign start, resume, and test actions run as simulations and explicitly report that no email, SMS, or WhatsApp messages were sent. Scraper runs show sample run metrics without contacting a listing site or importing data. Webhook tests create a simulated delivery record without making an outbound request; seeded `.invalid` endpoints remain inactive. Property viewings create real demo activities against seeded leads. The profile password can be changed from Settings, and team invitations create demo workspace users.

Third-party integrations and two-factor authentication require provider credentials or security setup and are clearly marked as unavailable in the local demo. Password reset delivery still requires SMTP. PostgreSQL migrations and cutover still need a PostgreSQL 18 instance and a rehearsed Mongo backfill; this demo intentionally runs on isolated MongoDB data.
