import { preloadQuery } from "convex/nextjs";
import { getAuthToken } from "@/app/auth";
import { FunctionReference } from "convex/server";

/**
 * Preloads a Convex query with authentication token
 * 
 * @param query The Convex query function reference
 * @param args The arguments to pass to the query
 * @returns The result of the preloaded query
 */
export async function preloadQueryWithAuth<T>(
  query: FunctionReference<"query", any, any>,
  args: any
): Promise<T> {
  // Get the auth token from Clerk
  const token = await getAuthToken() as string;
  
  // Preload the query with the auth token
  return (await preloadQuery(query, args, { token }))._valueJSON as unknown as T;
} 