// app/admin/page.tsx
"use client";

import { useState, FormEvent } from "react";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase"; // Import the Firestore database instance
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Import Firestore functions

export default function AdminCreateCoursePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // State for the form inputs
    const [title, setTitle] = useState("");
    const [instructor, setInstructor] = useState("");
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage("");
        setError("");

        if (!title || !instructor) {
            setError("Title and Instructor are required.");
            setIsSubmitting(false);
            return;
        }

        try {
            // --- This is the new Firestore logic ---
            // Get a reference to the "courses" collection in our database
            const coursesCollectionRef = collection(db, "courses");

            // Add a new document to that collection with our course data
            await addDoc(coursesCollectionRef, {
                title: title,
                instructor: instructor,
                description: description,
                createdAt: serverTimestamp(), // Add a timestamp for when it was created
                progress: 0, // Default progress for a new course
            });

            setMessage(`Course "${title}" created successfully!`);
            // Clear the form fields after successful submission
            setTitle("");
            setInstructor("");
            setDescription("");

        } catch (e) {
            console.error("Error adding document: ", e);
            setError("Failed to create the course. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Protect the route
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
                    <h1 className="text-3xl font-bold text-gray-800">Create New Course</h1>
                    <p className="text-gray-600 mt-1">Fill out the details below to add a new course to the platform.</p>
                </div>

                <div className="container mx-auto px-6">
                    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                {/* Course Title */}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Course Title</label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                {/* Instructor Name */}
                                <div>
                                    <label htmlFor="instructor" className="block text-sm font-medium text-gray-700">Instructor Name</label>
                                    <input
                                        type="text"
                                        id="instructor"
                                        value={instructor}
                                        onChange={(e) => setInstructor(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                {/* Course Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Course Description</label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="mt-8">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold text-lg shadow-lg hover:bg-indigo-700 transition-all disabled:bg-indigo-400"
                                >
                                    {isSubmitting ? "Creating..." : "Create Course"}
                                </button>
                            </div>
                        </form>
                        {/* Show success or error messages */}
                        {message && <p className="mt-4 text-center text-green-600 font-semibold">{message}</p>}
                        {error && <p className="mt-4 text-center text-red-600 font-semibold">{error}</p>}
                    </div>
                </div>
            </main>
        </>
    );
}
