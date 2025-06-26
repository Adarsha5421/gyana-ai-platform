// app/admin/notices/page.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Megaphone, Trash2 } from "@/components/Icons";

interface Notice {
    id: string;
    message: string;
    createdAt: {
        seconds: number;
    } | null;
}

export default function AdminNoticesPage() {
    const { status } = useSession();
    const router = useRouter();

    const [message, setMessage] = useState("");
    const [notices, setNotices] = useState<Notice[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState("");

    // Fetch existing notices in real-time
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

    const handlePostNotice = async (e: FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        setFeedback("");

        try {
            await addDoc(collection(db, "notices"), {
                message: message,
                createdAt: serverTimestamp()
            });
            setMessage("");
            setFeedback("Notice posted successfully!");
        } catch (error) {
            console.error("Error posting notice: ", error);
            setFeedback("Failed to post notice.");
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setFeedback(""), 3000);
        }
    };

    const handleDeleteNotice = async (noticeId: string) => {
        if (confirm("Are you sure you want to delete this notice?")) {
            await deleteDoc(doc(db, "notices", noticeId));
        }
    };

    if (status === "loading") {
        return <div className="h-screen flex items-center justify-center"><p>Loading...</p></div>;
    }
    if (status === "unauthenticated") {
        router.push('/');
        return null;
    }

    return (
        <>
            <Header />
            <main className="pt-24 bg-gray-50 min-h-screen">
                <div className="container mx-auto px-6 py-8">
                    <div className="flex items-center gap-3 mb-6">
                        <Megaphone className="w-8 h-8 text-indigo-600" />
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Post a Notice</h1>
                            <p className="text-gray-600 mt-1">Announcements will be shown to all students in real-time.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Form for posting new notices */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <form onSubmit={handlePostNotice}>
                                <label htmlFor="noticeMessage" className="block text-sm font-medium text-gray-700">New Announcement</label>
                                <textarea
                                    id="noticeMessage"
                                    rows={6}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    placeholder="e.g., The platform will be down for maintenance on Friday at 10 PM."
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="mt-4 w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg hover:bg-indigo-700 transition-all disabled:bg-indigo-400"
                                >
                                    {isSubmitting ? "Posting..." : "Post Notice"}
                                </button>
                                {feedback && <p className="mt-3 text-sm text-center font-semibold text-green-600">{feedback}</p>}
                            </form>
                        </div>

                        {/* List of recent notices */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Notices</h3>
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {notices.length > 0 ? (
                                    notices.map(notice => (
                                        <div key={notice.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-start">
                                            <div>
                                                <p className="text-gray-800">{notice.message}</p>
                                                <p className="text-xs text-gray-400 mt-2">
                                                    Posted on: {notice.createdAt ? new Date(notice.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                                                </p>
                                            </div>
                                            <button onClick={() => handleDeleteNotice(notice.id)} className="text-red-400 hover:text-red-600 ml-4">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">No notices posted yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
