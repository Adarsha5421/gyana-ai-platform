
"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { BookOpen, Bell } from "./Icons"; // Import the new Bell icon

// Define the type for a notice
interface Notice {
    id: string;
    message: string;
    createdAt: { seconds: number };
}

export default function Header() {
    const { data: session } = useSession();

    // State for notifications
    const [notices, setNotices] = useState<Notice[]>([]);
    const [showNotices, setShowNotices] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch notices in real-time
    useEffect(() => {
        const noticesQuery = query(collection(db, "notices"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(noticesQuery, (snapshot) => {
            const noticesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Notice));
            setNotices(noticesData);
        });
        return () => unsubscribe();
    }, []);

    // Check for unread notices using localStorage
    useEffect(() => {
        if (notices.length > 0) {
            const readNotices: string[] = JSON.parse(localStorage.getItem('readNotices') || '[]');
            const newUnreadCount = notices.filter(n => !readNotices.includes(n.id)).length;
            setUnreadCount(newUnreadCount);
        }
    }, [notices]);

    const handleNotificationClick = () => {
        setShowNotices(!showNotices);
        if (!showNotices) {
            // Mark all current notices as read
            const noticeIds = notices.map(n => n.id);
            localStorage.setItem('readNotices', JSON.stringify(noticeIds));
            setUnreadCount(0);
        }
    };

    return (
        <header className="bg-white/80 backdrop-blur-md fixed top-0 left-0 right-0 z-50 border-b border-gray-200">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <BookOpen className="text-indigo-600 w-8 h-8" />
                        <span className="text-2xl font-bold text-gray-800">Gyana AI</span>
                    </Link>
                </div>
                <nav className="hidden md:flex items-center space-x-8">
                    <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors">Courses</Link>
                    <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">For Institutions</a>
                </nav>
                <div className="flex items-center space-x-4">
                    {session ? (
                        <div className="flex items-center space-x-4">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button onClick={handleNotificationClick} className="text-gray-500 hover:text-indigo-600">
                                    <Bell className="w-6 h-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-xs items-center justify-center">
                                                {unreadCount}
                                            </span>
                                        </span>
                                    )}
                                </button>
                                {showNotices && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border overflow-hidden">
                                        <div className="p-4 font-bold border-b">Notifications</div>
                                        <ul className="max-h-96 overflow-y-auto">
                                            {notices.length > 0 ? notices.map(notice => (
                                                <li key={notice.id} className="p-4 border-b hover:bg-gray-50">
                                                    <p className="text-sm text-gray-700">{notice.message}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{new Date(notice.createdAt.seconds * 1000).toLocaleDateString()}</p>
                                                </li>
                                            )) : <li className="p-4 text-sm text-gray-500">No new notices.</li>}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Profile Link */}
                            <Link href="/profile">
                                <img
                                    src={session.user?.image ?? 'https://placehold.co/40x40'}
                                    alt={session.user?.name ?? 'User'}
                                    className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-indigo-400 transition-all"
                                />
                            </Link>
                            <button
                                onClick={() => signOut()}
                                className="bg-red-500 text-white px-5 py-2 rounded-lg font-semibold shadow-lg hover:bg-red-600 transition-all"
                            >
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <>
                            <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })} className="text-gray-600 hover:text-indigo-600 transition-colors">Log In</button>
                            <button onClick={() => signIn('google', { callbackUrl: '/dashboard' })} className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold shadow-lg hover:bg-indigo-700 transition-all transform hover:-translate-y-0.5">Sign Up Free</button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
