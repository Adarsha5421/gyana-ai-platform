

// // chatgpt

// "use client";

// import { useState, useEffect, useRef, FormEvent } from "react";
// import { useParams } from "next/navigation";
// import Header from "@/components/Header";
// import { useSession } from "next-auth/react";
// import { db } from "@/lib/firebase";
// import {
//     collection,
//     onSnapshot,
//     query,
//     orderBy,
//     addDoc,
//     serverTimestamp,
//     doc,
//     getDoc,
//     updateDoc
// } from "firebase/firestore";
// import Link from "next/link";
// import dynamic from "next/dynamic";

// const VideoCall = dynamic(() => import("@/components/VideoCall"), {
//     ssr: false,
//     loading: () => (
//         <div className="h-full flex items-center justify-center bg-gray-900 rounded-xl">
//             <p className="text-white">Loading Call...</p>
//         </div>
//     )
// });

// const Video = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg {...props}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
// );
// const Phone = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2" /></svg>
// );
// const Leave = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg {...props}><line x1="2" y1="2" x2="22" y2="22" /></svg>
// );

// interface ChatMessage {
//     id: string;
//     text: string;
//     createdAt: { seconds: number } | null;
//     user: {
//         id: string;
//         name: string | null;
//         image: string | null;
//     };
// }
// interface Course {
//     title: string;
// }

// export default function CourseChatPage() {
//     const { data: session } = useSession();
//     const params = useParams();
//     const courseId = params.courseId as string;

//     const [course, setCourse] = useState<Course | null>(null);
//     const [messages, setMessages] = useState<ChatMessage[]>([]);
//     const [newMessage, setNewMessage] = useState("");
//     const [isLoading, setIsLoading] = useState(true);
//     const messagesEndRef = useRef<HTMLDivElement>(null);

//     const [inCall, setInCall] = useState(false);
//     const [startWithVideo, setStartWithVideo] = useState(false);
//     const [callParticipants, setCallParticipants] = useState<any[]>([]);

//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages]);

//     useEffect(() => {
//         if (courseId) {
//             getDoc(doc(db, "courses", courseId)).then(docSnap => {
//                 if (docSnap.exists()) {
//                     setCourse(docSnap.data() as Course);
//                 }
//             });

//             const messagesQuery = query(
//                 collection(db, "courses", courseId, "chatMessages"),
//                 orderBy("createdAt")
//             );
//             const unsubscribeMessages = onSnapshot(messagesQuery, snapshot => {
//                 const messagesData = snapshot.docs.map(doc => ({
//                     id: doc.id,
//                     ...doc.data()
//                 } as ChatMessage));
//                 setMessages(messagesData);
//                 setIsLoading(false);
//             });

//             const callStatusRef = doc(db, "courses", courseId, "status", "call");
//             const unsubscribeCallStatus = onSnapshot(callStatusRef, docSnap => {
//                 const participants = docSnap.data()?.participants || [];
//                 setCallParticipants(participants);
//             });

//             return () => {
//                 unsubscribeMessages();
//                 unsubscribeCallStatus();
//             };
//         }
//     }, [courseId]);

//     const handleSendMessage = async (e: FormEvent) => {
//         e.preventDefault();
//         if (!newMessage.trim() || !session?.user) return;
//         try {
//             await addDoc(collection(db, "courses", courseId, "chatMessages"), {
//                 text: newMessage,
//                 createdAt: serverTimestamp(),
//                 user: {
//                     id: session.user.id,
//                     name: session.user.name,
//                     image: session.user.image
//                 }
//             });
//             setNewMessage("");
//         } catch (error) {
//             console.error("Error sending message: ", error);
//         }
//     };

//     const handleJoinCall = (video: boolean) => {
//         setStartWithVideo(video);
//         setInCall(true);
//     };

//     const handleLeaveCall = async () => {
//         if (!session?.user) return;
//         const callStatusRef = doc(db, "courses", courseId, "status", "call");
//         const callSnap = await getDoc(callStatusRef);
//         if (callSnap.exists()) {
//             const participants = callSnap.data().participants || [];
//             const updated = participants.filter((p: any) => p.id !== session.user.id);
//             await updateDoc(callStatusRef, { participants: updated });
//         }
//         setInCall(false);
//     };

//     const handleEndCallForAll = async () => {
//         const callStatusRef = doc(db, "courses", courseId, "status", "call");
//         await updateDoc(callStatusRef, { participants: [] });
//         setInCall(false);
//     };

//     const userInCall = session?.user && callParticipants.some((p: any) => p.id === session.user.id);

//     return (
//         <>
//             <Header />
//             <main className="pt-24 bg-gray-50 min-h-screen">
//                 <div className="container mx-auto px-6 py-8">
//                     <div className="flex justify-between items-center mb-6">
//                         <div>
//                             <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
//                                 &larr; Back to Dashboard
//                             </Link>
//                             <h1 className="text-3xl font-bold text-gray-800 mt-2">
//                                 {course ? `${course.title} - Chat Room` : "Loading Chat..."}
//                             </h1>
//                         </div>
//                         <div className="flex flex-col items-end gap-2">
//                             {callParticipants.length > 0 && (
//                                 <div className="text-sm text-gray-600 text-right">
//                                     <span className="font-semibold">In Call:</span>{" "}
//                                     {callParticipants.map((p: any, i) => (
//                                         <span key={p.id}>
//                                             {p.name || "Unknown"}
//                                             {i < callParticipants.length - 1 ? ", " : ""}
//                                         </span>
//                                     ))}
//                                 </div>
//                             )}
//                             {userInCall ? (
//                                 <>
//                                     <button
//                                         onClick={handleLeaveCall}
//                                         className="bg-red-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2"
//                                     >
//                                         <Leave className="w-5 h-5" /> Leave Call
//                                     </button>
//                                     <button
//                                         onClick={handleEndCallForAll}
//                                         className="bg-black text-white px-4 py-2 rounded-lg text-sm mt-1"
//                                     >
//                                         End Call for Everyone
//                                     </button>
//                                 </>
//                             ) : callParticipants.length > 0 ? (
//                                 <button
//                                     onClick={() => handleJoinCall(true)}
//                                     className="bg-green-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2 animate-pulse"
//                                 >
//                                     <Video className="w-5 h-5" /> Join Live Call ({callParticipants.length} active)
//                                 </button>
//                             ) : (
//                                 <>
//                                     <button
//                                         onClick={() => handleJoinCall(true)}
//                                         className="bg-green-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2"
//                                     >
//                                         <Video className="w-5 h-5" /> Start Video Call
//                                     </button>
//                                     <button
//                                         onClick={() => handleJoinCall(false)}
//                                         className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2"
//                                     >
//                                         <Phone className="w-5 h-5" /> Start Voice Call
//                                     </button>
//                                 </>
//                             )}
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
//                         {inCall && (
//                             <div className="lg:col-span-1">
//                                 <VideoCall
//                                     channelName={courseId}
//                                     onLeaveCall={() => setInCall(false)}
//                                     initialVideo={startWithVideo}
//                                 />
//                             </div>
//                         )}
//                         <div className={`bg-white rounded-xl shadow-lg flex flex-col ${inCall ? 'lg:col-span-3' : 'lg:col-span-4'}`} style={{ height: '70vh' }}>
//                             <div className="flex-1 p-6 space-y-4 overflow-y-auto">
//                                 {isLoading ? <p>Loading messages...</p> : messages.length > 0 ? (
//                                     messages.map(msg => (
//                                         <div key={msg.id} className={`flex items-start gap-3 ${msg.user.id === session?.user?.id ? 'flex-row-reverse' : ''}`}>
//                                             <img src={msg.user.image ?? 'https://placehold.co/40x40'} alt={msg.user.name ?? 'User'} className="w-10 h-10 rounded-full" />
//                                             <div className={`p-3 rounded-lg max-w-lg ${msg.user.id === session?.user?.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
//                                                 <p className="font-bold text-sm mb-1">{msg.user.name}</p>
//                                                 <p>{msg.text}</p>
//                                                 <p className={`text-xs mt-1 opacity-70 ${msg.user.id === session?.user?.id ? 'text-indigo-200' : 'text-gray-500'}`}>{msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString() : 'Sending...'}</p>
//                                             </div>
//                                         </div>
//                                     ))
//                                 ) : (
//                                     <p className="text-center text-gray-500">No messages yet.</p>
//                                 )}
//                                 <div ref={messagesEndRef} />
//                             </div>
//                             <div className="p-6 border-t bg-gray-50">
//                                 <form onSubmit={handleSendMessage} className="flex items-center gap-4">
//                                     <input
//                                         type="text"
//                                         value={newMessage}
//                                         onChange={(e) => setNewMessage(e.target.value)}
//                                         className="w-full px-4 py-3 border border-gray-300 rounded-lg"
//                                         placeholder="Type your message..."
//                                     />
//                                     <button
//                                         type="submit"
//                                         className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-indigo-400"
//                                         disabled={!newMessage.trim()}
//                                     >
//                                         Send
//                                     </button>
//                                 </form>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </main>
//         </>
//     );
// }


// // working code
// // app/(main)/courses/[courseId]/page.tsx
// "use client";

// import { useState, useEffect, useRef, FormEvent } from "react";
// import { useParams } from "next/navigation";
// import Header from "@/components/Header";
// import { useSession } from "next-auth/react";
// import { db } from "@/lib/firebase";
// import {
//     collection,
//     onSnapshot,
//     query,
//     orderBy,
//     addDoc,
//     serverTimestamp,
//     doc,
//     getDoc,
//     updateDoc
// } from "firebase/firestore";
// import Link from "next/link";
// import dynamic from "next/dynamic";

// const VideoCall = dynamic(() => import("@/components/VideoCall"), {
//     ssr: false,
//     loading: () => (
//         <div className="h-full flex items-center justify-center bg-gray-900 rounded-xl">
//             <p className="text-white">Loading Call...</p>
//         </div>
//     )
// });

// const Video = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
// );
// const Phone = (props: React.SVGProps<SVGSVGElement>) => (
//     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
// );


// interface Participant {
//     id: string;
//     name: string | null;
//     image: string | null;
// }
// interface ChatMessage {
//     id: string;
//     text: string;
//     createdAt: { seconds: number } | null;
//     user: Participant;
// }
// interface Course {
//     title: string;
// }

// export default function CourseChatPage() {
//     const { data: session } = useSession();
//     const params = useParams();
//     const courseId = params.courseId as string;

//     const [course, setCourse] = useState<Course | null>(null);
//     const [messages, setMessages] = useState<ChatMessage[]>([]);
//     const [newMessage, setNewMessage] = useState("");
//     const [isLoading, setIsLoading] = useState(true);
//     const messagesEndRef = useRef<HTMLDivElement>(null);

//     const [inCall, setInCall] = useState(false);
//     const [startWithVideo, setStartWithVideo] = useState(false);
//     const [callParticipants, setCallParticipants] = useState<Participant[]>([]);

//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages]);

//     useEffect(() => {
//         if (courseId) {
//             getDoc(doc(db, "courses", courseId)).then(docSnap => {
//                 if (docSnap.exists()) {
//                     setCourse(docSnap.data() as Course);
//                 }
//             });

//             const messagesQuery = query(
//                 collection(db, "courses", courseId, "chatMessages"),
//                 orderBy("createdAt")
//             );
//             const unsubscribeMessages = onSnapshot(messagesQuery, snapshot => {
//                 const messagesData = snapshot.docs.map(doc => ({
//                     id: doc.id,
//                     ...doc.data()
//                 } as ChatMessage));
//                 setMessages(messagesData);
//                 setIsLoading(false);
//             });

//             const callStatusRef = doc(db, "courses", courseId, "status", "call");
//             const unsubscribeCallStatus = onSnapshot(callStatusRef, docSnap => {
//                 const participants = docSnap.data()?.participants || [];
//                 setCallParticipants(participants);
//                 // If current user is no longer in the participants list, update their UI
//                 if (session?.user && !participants.some((p: Participant) => p.id === session.user.id)) {
//                     setInCall(false);
//                 }
//             });

//             return () => {
//                 unsubscribeMessages();
//                 unsubscribeCallStatus();
//             };
//         }
//     }, [courseId, session]);

//     const handleSendMessage = async (e: FormEvent) => {
//         e.preventDefault();
//         if (!newMessage.trim() || !session?.user) return;
//         try {
//             await addDoc(collection(db, "courses", courseId, "chatMessages"), {
//                 text: newMessage,
//                 createdAt: serverTimestamp(),
//                 user: {
//                     id: session.user.id,
//                     name: session.user.name,
//                     image: session.user.image
//                 }
//             });
//             setNewMessage("");
//         } catch (error) {
//             console.error("Error sending message: ", error);
//         }
//     };

//     const handleJoinCall = (video: boolean) => {
//         setStartWithVideo(video);
//         setInCall(true);
//     };

//     // --- CORRECTED: The handleLeaveCall function now ONLY sets state ---
//     // The VideoCall component's cleanup logic will handle the rest.
//     const handleLeaveCall = () => {
//         setInCall(false);
//     };

//     const isCurrentUserInCall = callParticipants.some((p: any) => p.id === session?.user?.id);

//     return (
//         <>
//             <Header />
//             <main className="pt-24 bg-gray-50 min-h-screen">
//                 <div className="container mx-auto px-6 py-8">
//                     <div className="flex justify-between items-center mb-6">
//                         <div>
//                             <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
//                                 &larr; Back to Dashboard
//                             </Link>
//                             <h1 className="text-3xl font-bold text-gray-800 mt-2">
//                                 {course ? `${course.title} - Chat Room` : "Loading Chat..."}
//                             </h1>
//                         </div>
//                         <div className="flex items-center gap-4">
//                             {callParticipants.length > 0 && !isCurrentUserInCall && (
//                                 <div className="flex items-center gap-4">
//                                     <div className="flex -space-x-2 overflow-hidden">
//                                         {callParticipants.slice(0, 3).map(p => (
//                                             <img key={p.id} src={p.image || ''} alt={p.name || 'User'} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" />
//                                         ))}
//                                     </div>
//                                     <button
//                                         onClick={() => handleJoinCall(true)}
//                                         className="bg-green-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2 animate-pulse"
//                                     >
//                                         Join Live Call ({callParticipants.length})
//                                     </button>
//                                 </div>
//                             )}
//                             {callParticipants.length === 0 && !inCall && (
//                                 <>
//                                     <button onClick={() => handleJoinCall(true)} className="bg-green-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2">
//                                         <Video className="w-5 h-5" /> Start Video Call
//                                     </button>
//                                     <button onClick={() => handleJoinCall(false)} className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2">
//                                         <Phone className="w-5 h-5" /> Start Voice Call
//                                     </button>
//                                 </>
//                             )}
//                         </div>
//                     </div>

//                     <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
//                         {inCall && (
//                             <div className="lg:col-span-1">
//                                 <VideoCall
//                                     channelName={courseId}
//                                     onLeaveCall={handleLeaveCall} // Pass the simplified handler
//                                     initialVideo={startWithVideo}
//                                 />
//                             </div>
//                         )}
//                         <div className={`bg-white rounded-xl shadow-lg flex flex-col ${inCall ? 'lg:col-span-3' : 'lg:col-span-4'}`} style={{ height: '70vh' }}>
//                             <div className="flex-1 p-6 space-y-4 overflow-y-auto">
//                                 {isLoading ? <p>Loading messages...</p> : messages.map(msg => (
//                                     <div key={msg.id} className={`flex items-start gap-3 ${msg.user.id === session?.user?.id ? 'flex-row-reverse' : ''}`}>
//                                         <img src={msg.user.image ?? 'https://placehold.co/40x40'} alt={msg.user.name ?? 'User'} className="w-10 h-10 rounded-full" />
//                                         <div className={`p-3 rounded-lg max-w-lg ${msg.user.id === session?.user?.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
//                                             <p className="font-bold text-sm mb-1">{msg.user.name}</p>
//                                             <p>{msg.text}</p>
//                                             <p className={`text-xs mt-1 opacity-70 ${msg.user.id === session?.user?.id ? 'text-indigo-200' : 'text-gray-500'}`}>{msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString() : 'Sending...'}</p>
//                                         </div>
//                                     </div>
//                                 ))}
//                                 <div ref={messagesEndRef} />
//                             </div>
//                             <div className="p-6 border-t bg-gray-50">
//                                 <form onSubmit={handleSendMessage} className="flex items-center gap-4">
//                                     <input
//                                         type="text"
//                                         value={newMessage}
//                                         onChange={(e) => setNewMessage(e.target.value)}
//                                         className="w-full px-4 py-3 border border-gray-300 rounded-lg"
//                                         placeholder="Type your message..."
//                                     />
//                                     <button
//                                         type="submit"
//                                         className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-indigo-400"
//                                         disabled={!newMessage.trim()}
//                                     >
//                                         Send
//                                     </button>
//                                 </form>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </main>
//         </>
//     );
// }


// app/(main)/courses/[courseId]/page.tsx
"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { db } from "@/lib/firebase";
import {
    collection,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
} from "firebase/firestore";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import the VideoCall component to prevent server-side rendering issues
const VideoCall = dynamic(() => import("@/components/VideoCall"), {
    ssr: false,
    loading: () => (
        <div className="h-full flex items-center justify-center bg-gray-900 rounded-xl">
            <p className="text-white">Loading Call...</p>
        </div>
    )
});

// Icon Components for this page
const Video = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
);
const Phone = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
);

// Data Types
interface Participant { id: string; name: string | null; image: string | null; }
interface ChatMessage { id: string; text: string; createdAt: { seconds: number } | null; user: Participant; }
interface Course { title: string; }

export default function CourseChatPage() {
    const { data: session } = useSession();
    const params = useParams();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [inCall, setInCall] = useState(false);
    const [startWithVideo, setStartWithVideo] = useState(false);

    const [callParticipants, setCallParticipants] = useState<Participant[]>([]);

    // Effect for scrolling chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Effect for fetching course data and listening for chat/call updates
    useEffect(() => {
        if (courseId) {
            getDoc(doc(db, "courses", courseId)).then(docSnap => {
                if (docSnap.exists()) {
                    setCourse(docSnap.data() as Course);
                }
            });

            const messagesQuery = query(collection(db, "courses", courseId, "chatMessages"), orderBy("createdAt"));
            const unsubscribeMessages = onSnapshot(messagesQuery, snapshot => {
                setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
                setIsLoading(false);
            });

            const callStatusRef = doc(db, "courses", courseId, "status", "call");
            const unsubscribeCallStatus = onSnapshot(callStatusRef, docSnap => {
                const participants = docSnap.data()?.participants || [];
                setCallParticipants(participants);

                // Automatically update inCall state if the current user is no longer in the call
                if (session?.user && !participants.some((p: Participant) => p.id === session.user.id)) {
                    setInCall(false);
                }
            });

            return () => {
                unsubscribeMessages();
                unsubscribeCallStatus();
            };
        }
    }, [courseId, session]);

    const handleSendMessage = async (e: FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !session?.user) return;
        try {
            await addDoc(collection(db, "courses", courseId, "chatMessages"), {
                text: newMessage,
                createdAt: serverTimestamp(),
                user: {
                    id: session.user.id,
                    name: session.user.name,
                    image: session.user.image
                }
            });
            setNewMessage("");
        } catch (error) {
            console.error("Error sending message: ", error);
        }
    };

    const handleJoinCall = (video: boolean) => {
        setStartWithVideo(video);
        setInCall(true);
    };

    const isCurrentUserInCall = session?.user && callParticipants.some((p: any) => p.id === session.user.id);

    return (
        <>
            <Header />
            <main className="pt-24 bg-gray-50 min-h-screen">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
                                &larr; Back to Dashboard
                            </Link>
                            <h1 className="text-3xl font-bold text-gray-800 mt-2">
                                {course ? `${course.title} - Chat Room` : "Loading Chat..."}
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* Logic to show correct call buttons */}
                            {!inCall && callParticipants.length > 0 && (
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-2 overflow-hidden">
                                        {callParticipants.slice(0, 3).map(p => (
                                            <img key={p.id} src={p.image || ''} alt={p.name || 'User'} className="inline-block h-8 w-8 rounded-full ring-2 ring-white" />
                                        ))}
                                    </div>
                                    <button onClick={() => handleJoinCall(true)} className="bg-green-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2 animate-pulse">
                                        Join Live Call ({callParticipants.length})
                                    </button>
                                </div>
                            )}
                            {!inCall && callParticipants.length === 0 && (
                                <>
                                    <button onClick={() => handleJoinCall(true)} className="bg-green-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2">
                                        <Video className="w-5 h-5" /> Start Video Call
                                    </button>
                                    <button onClick={() => handleJoinCall(false)} className="bg-blue-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg flex items-center gap-2">
                                        <Phone className="w-5 h-5" /> Start Voice Call
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        {inCall && (
                            <div className="lg:col-span-1">
                                <VideoCall
                                    channelName={courseId}
                                    onLeaveCall={() => setInCall(false)} // This now correctly hides the component
                                    initialVideo={startWithVideo}
                                />
                            </div>
                        )}
                        <div className={`bg-white rounded-xl shadow-lg flex flex-col ${inCall ? 'lg:col-span-3' : 'lg:col-span-4'}`} style={{ height: '70vh' }}>
                            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                                {isLoading ? <p>Loading messages...</p> : messages.map(msg => (
                                    <div key={msg.id} className={`flex items-start gap-3 ${msg.user.id === session?.user?.id ? 'flex-row-reverse' : ''}`}>
                                        <img src={msg.user.image ?? 'https://placehold.co/40x40'} alt={msg.user.name ?? 'User'} className="w-10 h-10 rounded-full" />
                                        <div className={`p-3 rounded-lg max-w-lg ${msg.user.id === session?.user?.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                            <p className="font-bold text-sm mb-1">{msg.user.name}</p>
                                            <p>{msg.text}</p>
                                            <p className={`text-xs mt-1 opacity-70 ${msg.user.id === session?.user?.id ? 'text-indigo-200' : 'text-gray-500'}`}>{msg.createdAt ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString() : 'Sending...'}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-6 border-t bg-gray-50">
                                <form onSubmit={handleSendMessage} className="flex items-center gap-4">
                                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg" placeholder="Type your message..." />
                                    <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-indigo-400" disabled={!newMessage.trim()}>Send</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
