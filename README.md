This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Repository Overview

This personal finance dashboard uses TypeScript and the Next.js App Router. Clerk
handles authentication and Convex provides the serverless database layer.

- **Frameworks** – Next.js, React and Tailwind CSS power the UI.
- **Authentication** – Non‑public routes are protected in `middleware.ts` via
  Clerk.
- **Serverless backend** – Functions in the `convex/` directory implement
  queries, mutations, actions and scheduled jobs.
- **Cron jobs** – Hourly tasks update quotes and snapshot metrics.
- **External APIs** – For example, `convex/quoteActions.ts` fetches prices from
  CoinGecko and Finnhub.
- **Wallets and holdings** – `convex/wallets.ts` and `convex/holdings.ts` manage
  wallets and their current value.
- **Metrics and forecasting** – `convex/metrics.ts` aggregates net-worth data and
  the `forecast` and `simulation` components provide charts and simulations.
- **Routing** – Pages live in the `app/` directory, with reusable UI components
  under `components/`.
- **Data preloading** – `lib/convex.ts` preloads Convex queries with Clerk
  tokens so server components can access protected data.

### Next Steps for Learning

- Explore the Convex schema and functions—`wallets.updateWalletValue` and
  `quoteActions.updateQuotes` are good starting points.
- Review the cron schedule defined in `convex/crons.ts`.
- Read the Next.js App Router documentation to understand the `app/` structure.
- See how Tailwind CSS and Recharts are used for styling and charts.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
