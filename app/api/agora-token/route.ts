// app/api/agora-token/route.ts
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const { channelName } = await req.json();

    if (!channelName) {
        return NextResponse.json({ error: 'channelName is required' }, { status: 400 });
    }

    const appID = process.env.NEXT_PUBLIC_AGORA_APP_ID!;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE!;
    const uid = 0; // Let Agora assign the user ID
    const role = RtcRole.PUBLISHER;
    const expirationTimeInSeconds = 3600; // Token expires in 1 hour
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // --- CORRECTED FUNCTION CALL ---
    // The function requires 7 arguments. We were missing the last one.
    // We will set privilegeExpiredTs to the same value as the token expiration.
    const token = RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channelName,
        uid,
        role,
        privilegeExpiredTs, // 6th argument: token expiration
        privilegeExpiredTs  // 7th argument: privilege expiration
    );

    return NextResponse.json({ token });
}
