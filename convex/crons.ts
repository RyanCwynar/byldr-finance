import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Run metrics update twice daily at 9am and 5pm UTC
crons.cron(
  "update net worth morning",
  "0 9 * * *", // Every day at 9am UTC
  api.metrics.getCurrentNetWorth
);

crons.cron(
  "update net worth evening", 
  "0 17 * * *", // Every day at 5pm UTC
  api.metrics.getCurrentNetWorth
);

export default crons;