export default {
    providers: [
      {
        // domain: "https://assured-kangaroo-29.clerk.accounts.dev",
        domain: process.env.CLERK_URI,
        applicationID: "convex",
      },
    ],
  };