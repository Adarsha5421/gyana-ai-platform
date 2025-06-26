// lib/next-auth.d.ts

import NextAuth, { DefaultSession } from "next-auth"

// By declaring an interface inside a module with the same name, 
// we can extend the original interfaces from next-auth.
declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        user: {
            /** The user's unique ID. */
            id: string;
        } & DefaultSession["user"]; // This includes the default fields like name, email, image
    }
}
