"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function UserTracker() {
  const { user, isSignedIn } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);
  
  useEffect(() => {
    if (isSignedIn && user) {
      // User is signed in, track them in the database
      upsertUser({
        metadata: {
          email: user.primaryEmailAddress?.emailAddress,
          name: user.fullName || user.username || undefined,
        }
      }).catch(error => {
        console.error("Failed to track user:", error);
      });
    }
  }, [isSignedIn, user, upsertUser]);
  
  // This component doesn't render anything
  return null;
} 