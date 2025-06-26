// app/(main)/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { BookOpen, CheckCircle, Percent, Clock } from "@/components/Icons"; // Import necessary icons

// --- Data Types ---
interface Course {
    id: string;
    title: string;
    instructor: string;
}
interface UserProgress {
    completedLessons: string[];
    progress: number;
    timeSpent: number; // in seconds
}
interface QuizResult {
    id: string;
    courseId: string;
    quizTitle: string;
    score: number;
    submittedAt: {
        seconds: number;
        nanoseconds: number;
    };
}

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [courses, setCourses] = useState<Course[]>([]);
    const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
    const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch all courses
    useEffect(() => {
        const coursesRef = collection(db, "courses");
        const unsubscribe = onSnapshot(coursesRef, (snapshot) => {
            const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
            setCourses(coursesData);
        });
        return () => unsubscribe();
    }, []);

    // Fetch all user-specific data (progress and quiz results)
    useEffect(() => {
        if (!session?.user?.id) return;
        setIsLoading(true);

        // Fetch course progress
        const progressRef = collection(db, "users", session.user.id, "courseProgress");
        const unsubscribeProgress = onSnapshot(progressRef, (snapshot) => {
            const progressData: Record<string, UserProgress> = {};
            snapshot.forEach(doc => {
                progressData[doc.id] = doc.data() as UserProgress;
            });
            setUserProgress(progressData);
        });

        // Fetch quiz results
        const resultsQuery = query(collection(db, "users", session.user.id, "quizResults"), orderBy("submittedAt", "desc"));
        const unsubscribeResults = onSnapshot(resultsQuery, (snapshot) => {
            const resultsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizResult));
            setQuizResults(resultsData);
            setIsLoading(false);
        });

        return () => {
            unsubscribeProgress();
            unsubscribeResults();
        };
    }, [session?.user?.id]);


    // Helper to format time from seconds to a readable string
    const formatTime = (seconds: number) => {
        if (!seconds) return "0m";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h > 0 ? `${h}h ` : ''}${m}m`;
    };

    if (status === "loading" || isLoading) {
        return <div className="h-screen flex items-center justify-center"><p>Loading profile...</p></div>;
    }

    if (status === "unauthenticated") {
        router.push('/');
        return null;
    }

    // Find the course title for a given quiz result
    const getCourseTitle = (courseId: string) => {
        return courses.find(c => c.id === courseId)?.title || "Unknown Course";
    };

    return (
        <>
            <Header />
            <main className="pt-24 bg-gradient-to-b from-gray-50 to-white min-h-screen">
                <div className="container mx-auto px-6 py-12 max-w-7xl">
                    {/* Profile Header */}
                    <div className="flex items-center space-x-6 mb-12">
                        <img
                            src={session?.user?.image ?? 'https://placehold.co/96x96'}
                            alt={session?.user?.name ?? 'User'}
                            className="w-24 h-24 rounded-full border-4 border-indigo-500 shadow-lg"
                        />
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-800">{session?.user?.name}</h1>
                            <p className="text-lg text-gray-500">{session?.user?.email}</p>
                        </div>
                    </div>

                    {/* My Courses Section */}
                    <div className="mb-16">
                        <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-3">
                            <BookOpen className="w-6 h-6" /> My Courses
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map(course => (
                                <div key={course.id} className="bg-white rounded-2xl shadow-md p-6 transition-all hover:shadow-lg hover:-translate-y-1">
                                    <h3 className="text-xl font-semibold text-gray-800">{course.title}</h3>
                                    <p className="text-sm text-gray-500 mb-4">by {course.instructor}</p>

                                    {/* Progress bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-full transition-all"
                                            style={{ width: `${userProgress[course.id]?.progress || 0}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-gray-700 font-medium text-right">
                                        {userProgress[course.id]?.progress || 0}% Complete
                                    </p>

                                    {/* Time + Lessons */}
                                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm text-gray-600">
                                        <span>
                                            <Clock className="w-4 h-4 inline mr-1 text-indigo-400" />
                                            {formatTime(userProgress[course.id]?.timeSpent)}
                                        </span>
                                        <span>
                                            <CheckCircle className="w-4 h-4 inline mr-1 text-green-400" />
                                            {userProgress[course.id]?.completedLessons?.length || 0} Lessons
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quiz History Section */}
                    <div>
                        <h2 className="text-2xl font-bold text-indigo-700 mb-6 flex items-center gap-3">
                            <Percent className="w-6 h-6" /> Quiz History
                        </h2>
                        <div className="bg-white rounded-2xl shadow-md p-6">
                            {quizResults.length > 0 ? (
                                <ul className="space-y-4">
                                    {quizResults.map(result => (
                                        <li
                                            key={result.id}
                                            className="flex justify-between items-center p-4 border rounded-xl hover:bg-gray-50 transition-all"
                                        >
                                            <div>
                                                <h3 className="font-semibold text-gray-800">{result.quizTitle}</h3>
                                                <p className="text-sm text-gray-500">From: {getCourseTitle(result.courseId)}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(result.submittedAt.seconds * 1000).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div
                                                className={`text-xl font-bold ${result.score >= 70 ? 'text-green-600' : 'text-red-500'
                                                    }`}
                                            >
                                                {result.score}%
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-center text-gray-400 py-8 text-sm">You have not completed any quizzes yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>

        </>
    );
}
