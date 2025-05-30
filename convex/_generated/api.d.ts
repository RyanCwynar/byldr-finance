/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as assets from "../assets.js";
import type * as crons from "../crons.js";
import type * as debts from "../debts.js";
import type * as holdings from "../holdings.js";
import type * as holdingsNode from "../holdingsNode.js";
import type * as metrics from "../metrics.js";
import type * as quoteActions from "../quoteActions.js";
import type * as quotes from "../quotes.js";
import type * as costs from "../costs.js";
import type * as oneTime from "../oneTime.js";
import type * as recurring from "../recurring.js";
import type * as simulations from "../simulations.js";
import type * as userPreferences from "../userPreferences.js";
import type * as users from "../users.js";
import type * as wallets from "../wallets.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  assets: typeof assets;
  crons: typeof crons;
  debts: typeof debts;
  holdings: typeof holdings;
  holdingsNode: typeof holdingsNode;
  metrics: typeof metrics;
  quoteActions: typeof quoteActions;
  quotes: typeof quotes;
  costs: typeof costs;
  oneTime: typeof oneTime;
  recurring: typeof recurring;
  simulations: typeof simulations;
  userPreferences: typeof userPreferences;
  users: typeof users;
  wallets: typeof wallets;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
