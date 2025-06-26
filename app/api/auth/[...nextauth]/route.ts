// // // app/api/auth/[...nextauth]/route.ts
// // import NextAuth from "next-auth"
// // import GoogleProvider from "next-auth/providers/google"

// // const handler = NextAuth({
// //     providers: [
// //         GoogleProvider({
// //             clientId: process.env.GOOGLE_CLIENT_ID!,
// //             clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
// //         }),
// //     ],
// // })

// // export { handler as GET, handler as POST }

// // app/api/auth/[...nextauth]/route.ts
// import NextAuth from "next-auth"
// import type { NextAuthOptions } from "next-auth"
// import GoogleProvider from "next-auth/providers/google"

// export const authOptions: NextAuthOptions = {
//     providers: [
//         GoogleProvider({
//             clientId: process.env.GOOGLE_CLIENT_ID!,
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//         }),
//     ],
//     callbacks: {
//         async session({ session, token }) {
//             // This callback is called whenever a session is checked.
//             // We are taking the user's unique ID from the 'token' (which Auth.js handles internally)
//             // and adding it to the 'session.user' object.
//             if (token && session.user) {
//                 session.user.id = token.sub as string;
//             }
//             return session;
//         },
//     },
// };

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };

// // app/api/auth/[...nextauth]/route.ts
// import NextAuth from "next-auth"
// import type { NextAuthOptions } from "next-auth"
// import GoogleProvider from "next-auth/providers/google"

// // --- CORRECTED: Removed the 'export' keyword from this line ---
// const authOptions: NextAuthOptions = {
//     providers: [
//         GoogleProvider({
//             clientId: process.env.GOOGLE_CLIENT_ID!,
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
//         }),
//     ],
//     callbacks: {
//         async session({ session, token }) {
//             // This callback is called whenever a session is checked.
//             // We are taking the user's unique ID from the 'token' (which Auth.js handles internally)
//             // and adding it to the 'session.user' object.
//             if (token && session.user) {
//                 session.user.id = token.sub as string;
//             }
//             return session;
//         },
//     },
// };

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };

// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],
    // --- PRODUCTION FIX: Add session strategy and explicit cookie settings ---
    session: {
        strategy: "jwt",
    },
    cookies: {
        sessionToken: {
            name: `__Secure-next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: true,
                domain: '.gyana-ai-platform.vercel.app' // IMPORTANT: Note the leading dot
            }
        },
    },
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub as string;
            }
            return session;
        },
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };


