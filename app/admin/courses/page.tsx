// app/admin/courses/page.tsx
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

// Define a type for our Course data
interface Course {
    id: string;
    title: string;
    instructor: string;
    description: string;
}

export default function AdminCourseListPage() {
    const { status } = useSession();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch courses from Firestore in real-time
    useEffect(() => {
        const coursesCollectionRef = collection(db, "courses");
        const unsubscribe = onSnapshot(coursesCollectionRef, (querySnapshot) => {
            const coursesData: Course[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Course));
            setCourses(coursesData);
            setIsLoading(false);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    // Route protection
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
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Manage Courses</h1>
                            <p className="text-gray-600 mt-1">Here is a list of all courses on the platform.</p>
                        </div>
                        <Link href="/admin">
                            <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold shadow-lg hover:bg-indigo-700 transition-all">
                                + Create New Course
                            </button>
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-8">
                        {isLoading ? (
                            <p>Loading courses...</p>
                        ) : courses.length > 0 ? (
                            <ul className="space-y-4">
                                {courses.map(course => (
                                    <li key={course.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800">{course.title}</h3>
                                            <p className="text-sm text-gray-500">by {course.instructor}</p>
                                        </div>
                                        {/* This button now links to the dynamic course editor page */}
                                        <Link href={`/admin/courses/${course.id}`}>
                                            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                                                Manage Content
                                            </button>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-gray-500">No courses have been created yet. <Link href="/admin" className="text-indigo-600 hover:underline">Create the first one!</Link></p>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
