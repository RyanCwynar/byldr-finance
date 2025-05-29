import { auth } from '@clerk/nextjs/server';

export async function getAuthToken() {
  const authInfo = await auth();
  return authInfo.getToken({ template: 'convex' }) ?? undefined;
}
