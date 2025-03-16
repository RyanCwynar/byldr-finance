import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Snapshot daily metrics every hour
crons.cron(
  "snapshot metrics", 
  "0 * * * *", // Every hour at minute 0
  api.metrics.snapshotDailyMetrics
);


// Update quotes every hour
crons.cron(
  "update quotes",
  "0 * * * *", // Every hour at minute 0
  api.quotes.updateQuotes
);


export default crons;