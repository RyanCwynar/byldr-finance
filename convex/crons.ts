import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Snapshot daily metrics every 20 minutes
crons.cron(
  "snapshot metrics",
  "*/20 * * * *", // Every 20 minutes
  api.metrics.snapshotDailyMetrics
);


// Update quotes every 10 minutes
crons.cron(
  "update quotes",
  "*/10 * * * *", // Every 10 minutes
  api.quotes.updateQuotes
);


export default crons;