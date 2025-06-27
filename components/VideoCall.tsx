// // components/VideoCall.tsx
// "use client";

// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useSession } from 'next-auth/react';
// import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
// import { db } from '@/lib/firebase';
// import { doc, updateDoc, arrayUnion, setDoc, getDoc } from 'firebase/firestore';

// // --- Icons ---
// const Phone = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>);
// const Mic = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>);
// const MicOff = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="2" x2="22" y1="2" y2="22" /><path d="M18.89 13.23A7.12 7.12 0 0 1 19 12v-2" /><path d="M5 10v2a7 7 0 0 0 12 5" /><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 2.45 2.96" /><path d="M9 9v3a3 3 0 0 0 3 3" /><line x1="12" x2="12" y1="19" y2="22" /></svg>);
// const Video = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>);
// const VideoOff = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 16v-3a1 1 0 0 0-1-1H9m-6 6 2 2 2-2" /><path d="M2 12v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5.5" /><path d="m22 2-2.1 2.1" /><path d="M1 1l22 22" /></svg>);

// interface VideoCallProps {
//     channelName: string;
//     onLeaveCall: () => void;
//     initialVideo: boolean;
// }

// const useAgoraClient = () => {
//     const clientRef = useRef<IAgoraRTCClient | null>(null);
//     if (!clientRef.current) {
//         clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
//     }
//     return clientRef.current;
// };

// export default function VideoCall({ channelName, onLeaveCall, initialVideo }: VideoCallProps) {
//     const client = useAgoraClient();
//     const { data: session } = useSession();
//     const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
//     const [localTracks, setLocalTracks] = useState<{ videoTrack: ICameraVideoTrack | null, audioTrack: IMicrophoneAudioTrack | null }>({ videoTrack: null, audioTrack: null });
//     const localVideoRef = useRef<HTMLVideoElement>(null);
//     const hasJoined = useRef(false);

//     const [isMuted, setIsMuted] = useState(false);
//     const [isVideoOff, setIsVideoOff] = useState(!initialVideo);

//     useEffect(() => {
//         if (localTracks.videoTrack && localVideoRef.current) {
//             localTracks.videoTrack.play(localVideoRef.current);
//         }
//         return () => {
//             localTracks.videoTrack?.stop();
//         };
//     }, [localTracks.videoTrack]);

//     const stopCall = useCallback(async () => {
//         if (hasJoined.current) {
//             const callStatusRef = doc(db, "courses", channelName, "status", "call");

//             // --- UPDATED: Remove the full participant object by filtering ---
//             interface Participant {
//                 id: string;
//                 name?: string;
//                 image?: string;
//             }
//             const docSnap = await getDoc(callStatusRef);
//             if (docSnap.exists() && session?.user) {
//                 const existingParticipants: Participant[] = docSnap.data().participants || [];
//                 const newParticipants = existingParticipants.filter((p: Participant) => p.id !== session.user.id);
//                 await updateDoc(callStatusRef, { participants: newParticipants });
//             }

//             localTracks.audioTrack?.close();
//             localTracks.videoTrack?.close();
//             await client.leave();
//             hasJoined.current = false;
//         }
//         onLeaveCall();
//     }, [client, localTracks, channelName, onLeaveCall, session]);


//     useEffect(() => {
//         const callStatusRef = doc(db, "courses", channelName, "status", "call");
//         const startCall = async () => {
//             if (hasJoined.current || !session?.user) return;

//             client.on('user-published', async (user, mediaType) => {
//                 await client.subscribe(user, mediaType);
//                 if (mediaType === 'video') setRemoteUsers(Array.from(client.remoteUsers));
//                 if (mediaType === 'audio') user.audioTrack?.play();
//             });
//             client.on('user-unpublished', user => {
//                 setRemoteUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid));
//             });

//             try {
//                 const response = await fetch('/api/agora-token', {
//                     method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channelName }),
//                 });
//                 const { token } = await response.json();
//                 await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, channelName, token, session.user.id);

//                 hasJoined.current = true;

//                 // --- UPDATED: Add full user object to participants list ---
//                 const participant = {
//                     id: session.user?.id,
//                     name: session.user.name,
//                     image: session.user.image,
//                 };
//                 await setDoc(callStatusRef, { participants: arrayUnion(participant) }, { merge: true });

//                 const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
//                 const videoTrack = await AgoraRTC.createCameraVideoTrack();

//                 await audioTrack.setMuted(isMuted);
//                 await videoTrack.setEnabled(!isVideoOff);

//                 setLocalTracks({ audioTrack, videoTrack });
//                 await client.publish([audioTrack, videoTrack]);
//             } catch (error) { console.error("Failed to start call", error); }
//         };

//         startCall();

//         return () => {
//             stopCall();
//         };
//     }, [client, channelName, initialVideo, session, stopCall]);


//     const toggleAudio = async () => {
//         if (localTracks.audioTrack) {
//             const newMutedState = !isMuted;
//             await localTracks.audioTrack.setMuted(newMutedState);
//             setIsMuted(newMutedState);
//         }
//     };

//     const toggleVideo = async () => {
//         if (localTracks.videoTrack) {
//             const newVideoState = !isVideoOff;
//             await localTracks.videoTrack.setEnabled(!newVideoState);
//             setIsVideoOff(newVideoState);
//         }
//     };

//     return (
//         <div className="flex flex-col h-full">
//             <div className="flex-grow bg-gray-900 rounded-xl shadow-lg p-4 flex flex-col gap-4 overflow-y-auto">
//                 <h3 className="text-lg font-semibold text-white text-center">Live Call</h3>
//                 <div className="relative w-full aspect-video">
//                     <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover rounded-md bg-black ${isVideoOff ? 'hidden' : 'block'}`}></video>
//                     {isVideoOff && (
//                         <div className="absolute inset-0 flex items-center justify-center bg-black rounded-md">
//                             <img src={session?.user?.image ?? 'https://placehold.co/96x96'} alt="Avatar" className="w-24 h-24 rounded-full" />
//                         </div>
//                     )}
//                     <p className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm text-white">{session?.user?.name}</p>
//                 </div>
//                 {remoteUsers.map(user => (
//                     <div key={user.uid} className="relative w-full aspect-video">
//                         <video
//                             id={`user-video-${user.uid}`}
//                             ref={ref => {
//                                 if (ref) {
//                                     user.videoTrack?.play(ref);
//                                 }
//                             }}
//                             autoPlay
//                             playsInline
//                             className="w-full h-full object-cover rounded-md bg-black"
//                         ></video>
//                     </div>
//                 ))}
//             </div>
//             <div className="pt-4 flex items-center justify-center gap-4">
//                 <button onClick={toggleAudio} className={`p-3 rounded-full font-semibold shadow-lg flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
//                     {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
//                 </button>
//                 <button onClick={toggleVideo} className={`p-3 rounded-full font-semibold shadow-lg flex items-center justify-center transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
//                     {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
//                 </button>
//                 <button onClick={stopCall} className="bg-red-500 text-white p-4 rounded-full font-semibold shadow-lg flex items-center justify-center">
//                     <Phone className="w-6 h-6" />
//                 </button>
//             </div>
//         </div>
//     );
// }


// // components/VideoCall.tsx

// // working code 
// "use client";

// import { useState, useEffect, useRef, useCallback } from 'react';
// import { useSession } from 'next-auth/react';
// import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
// import { db } from '@/lib/firebase';
// import { doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc } from 'firebase/firestore';

// // --- Icons ---
// const Phone = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>);
// const Mic = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>);
// const MicOff = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="2" x2="22" y1="2" y2="22" /><path d="M18.89 13.23A7.12 7.12 0 0 1 19 12v-2" /><path d="M5 10v2a7 7 0 0 0 12 5" /><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 2.45 2.96" /><path d="M9 9v3a3 3 0 0 0 3 3" /><line x1="12" x2="12" y1="19" y2="22" /></svg>);
// const Video = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>);
// const VideoOff = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 16v-3a1 1 0 0 0-1-1H9m-6 6 2 2 2-2" /><path d="M2 12v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5.5" /><path d="m22 2-2.1 2.1" /><path d="M1 1l22 22" /></svg>);

// const RemoteUser = ({ user }: { user: IAgoraRTCRemoteUser }) => {
//     const videoRef = useRef<HTMLDivElement>(null);
//     useEffect(() => {
//         if (videoRef.current && user.videoTrack) { user.videoTrack.play(videoRef.current); }
//         return () => { user.videoTrack?.stop(); };
//     }, [user.videoTrack]);
//     return <div ref={videoRef} className="w-full h-full object-cover rounded-md bg-black"></div>;
// };

// interface VideoCallProps {
//     channelName: string;
//     onLeaveCall: () => void;
//     initialVideo: boolean;
// }

// const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

// export default function VideoCall({ channelName, onLeaveCall, initialVideo }: VideoCallProps) {
//     const { data: session } = useSession();
//     const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
//     const [localTracks, setLocalTracks] = useState<{ videoTrack: ICameraVideoTrack | null, audioTrack: IMicrophoneAudioTrack | null }>({ videoTrack: null, audioTrack: null });
//     const localVideoRef = useRef<HTMLVideoElement>(null);
//     const hasJoined = useRef(false);

//     const [isMuted, setIsMuted] = useState(false);
//     const [isVideoOff, setIsVideoOff] = useState(!initialVideo);

//     useEffect(() => {
//         if (localTracks.videoTrack && localVideoRef.current) {
//             localTracks.videoTrack.play(localVideoRef.current);
//         }
//     }, [localTracks.videoTrack]);

//     const stopCall = useCallback(async () => {
//         onLeaveCall();
//     }, [onLeaveCall]);

//     useEffect(() => {
//         const callStatusRef = doc(db, "courses", channelName, "status", "call");

//         const join = async () => {
//             if (hasJoined.current || !session?.user) return;

//             client.on('user-published', async (user, mediaType) => { await client.subscribe(user, mediaType); if (mediaType === 'video') setRemoteUsers(Array.from(client.remoteUsers)); if (mediaType === 'audio') user.audioTrack?.play(); });
//             client.on('user-unpublished', user => setRemoteUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid)));

//             try {
//                 const response = await fetch('/api/agora-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channelName }) });
//                 const { token } = await response.json();

//                 await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, channelName, token, session.user.id);
//                 hasJoined.current = true;

//                 const participant = { id: session.user.id, name: session.user.name, image: session.user.image };
//                 await setDoc(callStatusRef, { participants: arrayUnion(participant) }, { merge: true });

//                 const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
//                 const videoTrack = initialVideo ? await AgoraRTC.createCameraVideoTrack() : null;

//                 setLocalTracks({ audioTrack, videoTrack });

//                 const tracksToPublish = [audioTrack];
//                 if (videoTrack) tracksToPublish.push(videoTrack);

//                 await client.publish(tracksToPublish);
//             } catch (error) { console.error("Failed to start call", error); }
//         };

//         const leave = async () => {
//             if (!hasJoined.current || !session?.user) return;

//             const docSnap = await getDoc(callStatusRef);
//             if (docSnap.exists()) {
//                 const existingParticipants = docSnap.data().participants || [];
//                 const newParticipants = existingParticipants.filter((p: any) => p.id !== session.user.id);
//                 await updateDoc(callStatusRef, { participants: newParticipants });
//             }

//             localTracks.audioTrack?.close();
//             localTracks.videoTrack?.close();
//             client.removeAllListeners();
//             await client.leave();
//             hasJoined.current = false;
//         };

//         join();
//         return () => { leave(); };

//     }, [client, channelName, initialVideo, session]);

//     const toggleAudio = async () => { if (localTracks.audioTrack) { const muted = !isMuted; await localTracks.audioTrack.setMuted(muted); setIsMuted(muted); } };
//     const toggleVideo = async () => { if (localTracks.videoTrack) { const videoOff = !isVideoOff; await localTracks.videoTrack.setEnabled(!videoOff); setIsVideoOff(videoOff); } };

//     return (
//         <div className="flex flex-col h-full">
//             <div className="flex-grow bg-gray-900 rounded-xl shadow-lg p-4 flex flex-col gap-4 overflow-y-auto">
//                 <h3 className="text-lg font-semibold text-white text-center">Live Call</h3>
//                 <div className="relative w-full aspect-video">
//                     <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover rounded-md bg-black ${isVideoOff ? 'hidden' : 'block'}`}></video>
//                     {isVideoOff && (<div className="absolute inset-0 flex items-center justify-center bg-black rounded-md"><img src={session?.user?.image ?? 'https://placehold.co/96x96'} alt="Avatar" className="w-24 h-24 rounded-full" /></div>)}
//                     <p className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm text-white">{session?.user?.name}</p>
//                 </div>
//                 {remoteUsers.map(user => (
//                     <div key={user.uid} className="relative w-full aspect-video">
//                         <RemoteUser user={user} />
//                     </div>
//                 ))}
//             </div>
//             <div className="pt-4 flex items-center justify-center gap-4">
//                 <button onClick={toggleAudio} className={`p-3 rounded-full font-semibold shadow-lg flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}>{isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}</button>
//                 <button onClick={toggleVideo} className={`p-3 rounded-full font-semibold shadow-lg flex items-center justify-center transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}>{isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}</button>
//                 <button onClick={stopCall} className="bg-red-500 text-white p-4 rounded-full font-semibold shadow-lg flex items-center justify-center">
//                     <Phone className="w-6 h-6" />
//                 </button>
//             </div>
//         </div>
//     );
// }


// components/VideoCall.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import AgoraRTC, { IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc } from 'firebase/firestore';

// --- Icons ---
const Phone = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>);
const Mic = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></svg>);
const MicOff = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="2" x2="22" y1="2" y2="22" /><path d="M18.89 13.23A7.12 7.12 0 0 1 19 12v-2" /><path d="M5 10v2a7 7 0 0 0 12 5" /><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 2.45 2.96" /><path d="M9 9v3a3 3 0 0 0 3 3" /><line x1="12" x2="12" y1="19" y2="22" /></svg>);
const Video = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>);
const VideoOff = (props: React.SVGProps<SVGSVGElement>) => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 16v-3a1 1 0 0 0-1-1H9m-6 6 2 2 2-2" /><path d="M2 12v-2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v5.5" /><path d="m22 2-2.1 2.1" /><path d="M1 1l22 22" /></svg>);

const RemoteUser = ({ user }: { user: IAgoraRTCRemoteUser }) => {
    const videoRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (videoRef.current && user.videoTrack) { user.videoTrack.play(videoRef.current); }
        return () => { user.videoTrack?.stop(); };
    }, [user.videoTrack]);
    return <div ref={videoRef} className="w-full h-full object-cover rounded-md bg-black"></div>;
};

interface VideoCallProps {
    channelName: string;
    onLeaveCall: () => void;
    initialVideo: boolean;
}

const useAgoraClient = () => {
    const clientRef = useRef<IAgoraRTCClient | null>(null);
    if (!clientRef.current) {
        clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    }
    return clientRef.current;
};

export default function VideoCall({ channelName, onLeaveCall, initialVideo }: VideoCallProps) {
    const client = useAgoraClient();
    const { data: session } = useSession();
    const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
    const [localTracks, setLocalTracks] = useState<{ videoTrack: ICameraVideoTrack | null, audioTrack: IMicrophoneAudioTrack | null }>({ videoTrack: null, audioTrack: null });
    const localVideoRef = useRef<HTMLVideoElement>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(!initialVideo);

    useEffect(() => {
        if (localTracks.videoTrack && localVideoRef.current) {
            localTracks.videoTrack.play(localVideoRef.current);
        }
    }, [localTracks.videoTrack]);

    useEffect(() => {
        const callStatusRef = doc(db, "courses", channelName, "status", "call");
        let joined = false;

        const join = async () => {
            if (joined || !session?.user) return;

            client.on('user-published', async (user, mediaType) => { await client.subscribe(user, mediaType); if (mediaType === 'video') setRemoteUsers(Array.from(client.remoteUsers)); if (mediaType === 'audio') user.audioTrack?.play(); });
            client.on('user-unpublished', user => { setRemoteUsers(prevUsers => prevUsers.filter(u => u.uid !== user.uid)); });

            try {
                const response = await fetch('/api/agora-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ channelName }) });
                const { token } = await response.json();

                await client.join(process.env.NEXT_PUBLIC_AGORA_APP_ID!, channelName, token, session.user.id);
                joined = true;

                const participant = { id: session.user.id, name: session.user.name, image: session.user.image };
                await setDoc(callStatusRef, { participants: arrayUnion(participant) }, { merge: true });

                const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
                const videoTrack = await AgoraRTC.createCameraVideoTrack();

                await audioTrack.setMuted(isMuted);
                await videoTrack.setEnabled(!isVideoOff);
                setLocalTracks({ audioTrack, videoTrack });
                await client.publish([audioTrack, videoTrack]);
            } catch (error) { console.error("Failed to start call", error); }
        };

        join();

        return () => {
            const leave = async () => {
                if (!joined || !session?.user) return;

                const docSnap = await getDoc(callStatusRef);
                if (docSnap.exists()) {
                    const existingParticipants = docSnap.data().participants || [];
                    const newParticipants = existingParticipants.filter((p: any) => p.id !== session.user.id);
                    await updateDoc(callStatusRef, { participants: newParticipants });
                }

                localTracks.audioTrack?.close();
                localTracks.videoTrack?.close();
                client.removeAllListeners();
                await client.leave();
            };
            leave();
        };
    }, []); // This effect runs only once when the component mounts

    const toggleAudio = async () => { if (localTracks.audioTrack) { const muted = !isMuted; await localTracks.audioTrack.setMuted(muted); setIsMuted(muted); } };
    const toggleVideo = async () => { if (localTracks.videoTrack) { const videoOff = !isVideoOff; await localTracks.videoTrack.setEnabled(!videoOff); setIsVideoOff(videoOff); } };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-grow bg-gray-900 rounded-xl shadow-lg p-4 flex flex-col gap-4 overflow-y-auto">
                <h3 className="text-lg font-semibold text-white text-center">Live Call</h3>
                <div className="relative w-full aspect-video">
                    <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover rounded-md bg-black ${isVideoOff ? 'hidden' : 'block'}`}></video>
                    {isVideoOff && (<div className="absolute inset-0 flex items-center justify-center bg-black rounded-md"><img src={session?.user?.image ?? ''} alt="Avatar" className="w-24 h-24 rounded-full" /></div>)}
                    <p className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-sm text-white">{session?.user?.name}</p>
                </div>
                {remoteUsers.map(user => (
                    <div key={user.uid} className="relative w-full aspect-video">
                        <RemoteUser user={user} />
                    </div>
                ))}
            </div>
            <div className="pt-4 flex items-center justify-center gap-4">
                <button onClick={toggleAudio} className={`p-3 rounded-full font-semibold shadow-lg flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}>{isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}</button>
                <button onClick={toggleVideo} className={`p-3 rounded-full font-semibold shadow-lg flex items-center justify-center transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800'}`}>{isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}</button>
                <button onClick={onLeaveCall} className="bg-red-500 text-white p-4 rounded-full font-semibold shadow-lg flex items-center justify-center">
                    <Phone className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
