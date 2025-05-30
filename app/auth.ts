import { auth } from "@clerk/nextjs/server";

/**
 * Retrieve the Convex auth token.
 *
 * When BYPASS_AUTH is enabled this returns a stub token so
 * backend calls can be made without Clerk in local development.
 */
export async function getAuthToken() {
  if (process.env.BYPASS_AUTH === "true") {
    // Skip generating a Clerk token when auth is bypassed
    return undefined;
  }

  const authInfo = await auth();
  return authInfo.getToken({ template: "convex" }) ?? undefined;
}
