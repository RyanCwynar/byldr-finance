"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { useAuth } from "@clerk/nextjs";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  const auth = useAuth();

  // Provide a mock auth object when bypassing Clerk in development
  const mockAuth = {
    isLoaded: true,
    isSignedIn: true,
    userId: "dev-user",
    getToken: async () => "dev-token",
  };

  const authState =
    process.env.NEXT_PUBLIC_BYPASS_AUTH === "true" ? mockAuth : auth;

  return (
    <ConvexProviderWithClerk client={convex} useAuth={() => authState}>
      {children}
    </ConvexProviderWithClerk>
  );
}
