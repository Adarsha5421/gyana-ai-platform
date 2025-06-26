
"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import Link from "next/link";


// --- Icon Components (included here to make the component self-contained) ---
const BookOpen = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
);
const Lightbulb = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></svg>
);
const BarChart2 = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
);


// --- Data Types ---
interface Course {
  id: string;
  title: string;
  instructor: string;
  description: string;
}

// --- Main Landing Page Component ---
export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({ courses: 0, students: 50 }); // Start students with a base number
  const [isLoading, setIsLoading] = useState(true);

  // --- Heuristic #1: Visibility of System Status ---
  // Fetch live data from Firestore to show users real, up-to-date information.
  useEffect(() => {
    const coursesRef = collection(db, "courses");

    const unsubscribeCourses = onSnapshot(coursesRef, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
      setCourses(coursesData.slice(0, 3)); // Show first 3 courses
      setStats(prev => ({ ...prev, courses: snapshot.size }));
      setIsLoading(false);
    });

    return () => unsubscribeCourses();
  }, []);

  // --- Component for Feature Cards ---
  const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{children}</p>
    </div>
  );

  return (
    // <div className="bg-gray-50">
    //   <Header />
    //   {/* --- Hero Section --- */}
    //   <main className="pt-24 pb-16">
    //     <section className="container mx-auto px-6 text-center">
    //       <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
    //         The Smarter Way to <span className="text-indigo-600">Master Any Subject</span>
    //       </h1>
    //       <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
    //         Go beyond video lectures. Our platform combines high-quality courses with a personal AI tutor that is available 24/7 to help you understand concepts, solve problems, and achieve your learning goals.
    //       </p>
    //       <div className="mt-10">
    //         <Link href="/dashboard">
    //           <button className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-xl hover:bg-indigo-700 transition-all transform hover:-translate-y-1">
    //             Start Learning Now
    //           </button>
    //         </Link>
    //       </div>
    //     </section>

    //     {/* --- Heuristic #1 & #8: Visibility of Status & Minimalist Design --- */}
    //     {/* Cleanly show key stats to build trust and show system activity */}
    //     <section className="container mx-auto px-6 py-20">
    //       <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    //         <div className="p-4">
    //           <p className="text-4xl font-bold text-indigo-600">{isLoading ? '...' : stats.students}+</p>
    //           <p className="text-gray-500 font-medium">Happy Learners</p>
    //         </div>
    //         <div className="p-4">
    //           <p className="text-4xl font-bold text-indigo-600">{isLoading ? '...' : stats.courses}</p>
    //           <p className="text-gray-500 font-medium">Courses Available</p>
    //         </div>
    //         <div className="p-4">
    //           <p className="text-4xl font-bold text-indigo-600">24/7</p>
    //           <p className="text-gray-500 font-medium">AI Tutor Access</p>
    //         </div>
    //         <div className="p-4">
    //           <p className="text-4xl font-bold text-indigo-600">95%</p>
    //           <p className="text-gray-500 font-medium">Completion Rate</p>
    //         </div>
    //       </div>
    //     </section>

    //     {/* --- Featured Courses Section --- */}
    //     <section id="courses" className="py-20 bg-white">
    //       <div className="container mx-auto px-6">
    //         <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Explore Our Popular Courses</h2>
    //         {isLoading ? (
    //           <p className="text-center">Loading courses...</p>
    //         ) : (
    //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
    //             {courses.map(course => (
    //               <div key={course.id} className="bg-gray-50 rounded-xl shadow-lg overflow-hidden flex flex-col">
    //                 <div className="p-6 flex-grow">
    //                   <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
    //                   <p className="text-sm text-gray-500 mt-1">by {course.instructor}</p>
    //                   <p className="mt-4 text-gray-600 flex-grow">{course.description.substring(0, 100)}...</p>
    //                 </div>
    //                 <div className="p-6 bg-gray-100">
    //                   <Link href="/dashboard">
    //                     <button className="w-full bg-indigo-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-600">
    //                       View Course
    //                     </button>
    //                   </Link>
    //                 </div>
    //               </div>
    //             ))}
    //           </div>
    //         )}
    //       </div>
    //     </section>

    //     {/* --- Heuristic #2: Match System & Real World / How it works section --- */}
    //     <section className="py-20">
    //       <div className="container mx-auto px-6 text-center">
    //         <h2 className="text-4xl font-bold text-gray-800 mb-12">A Better Way to Learn</h2>
    //         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
    //           <FeatureCard icon={<BookOpen />} title="Structured Courses">
    //             Follow expertly designed courses with video lessons, text content, and clear modules to guide your learning journey.
    //           </FeatureCard>
    //           <FeatureCard icon={<Lightbulb />} title="AI-Powered Tutor">
    //             Never get stuck again. Our AI tutor is available 24/7 to answer questions, explain complex topics, and guide you through problems.
    //           </FeatureCard>
    //           <FeatureCard icon={<BarChart2 />} title="Track Your Progress">
    //             Stay motivated by tracking your course completion, lesson progress, and quiz scores on your personal dashboard.
    //           </FeatureCard>
    //         </div>
    //       </div>
    //     </section>

    //   </main>
    //   <footer className="bg-gray-800 text-white">
    //     <div className="container mx-auto px-6 py-8 text-center">
    //       <p>&copy; {new Date().getFullYear()} Gyana AI. All Rights Reserved.</p>
    //       <p className="text-sm text-gray-400 mt-2">Empowering the next generation of learners in Kathmandu and beyond.</p>
    //     </div>
    //   </footer>
    // </div>
    <div className="bg-gray-50 text-gray-800 font-inter">
      <Header />

      {/* Hero Section */}
      <main className="pt-24 pb-12">
        <section className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-snug">
            Learn Smarter with <span className="text-indigo-600">Gyana AI</span>
          </h1>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto text-base md:text-lg">
            Combine structured courses with a 24/7 personal AI tutor to master any subject at your pace.
          </p>
          <div className="mt-8">
            <Link href="/dashboard">
              <button className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow hover:bg-indigo-700 transition">
                Start Learning Now
              </button>
            </Link>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-indigo-600">{isLoading ? '...' : stats.students}+</p>
              <p className="text-gray-500 mt-1 text-sm">Happy Learners</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">{isLoading ? '...' : stats.courses}</p>
              <p className="text-gray-500 mt-1 text-sm">Courses Available</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">24/7</p>
              <p className="text-gray-500 mt-1 text-sm">Tutor Support</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">95%</p>
              <p className="text-gray-500 mt-1 text-sm">Completion Rate</p>
            </div>
          </div>
        </section>

        {/* Featured Courses */}
        <section id="courses" className="bg-white py-16">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">Popular Courses</h2>
            {isLoading ? (
              <p className="text-center text-gray-500">Loading courses...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {courses.map((course, index) => (
                  <div key={course.id} className="rounded-xl shadow hover:shadow-lg transition bg-white overflow-hidden flex flex-col">
                    <div className="h-32 bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
                      {course.title.split(" ")[0]}
                    </div>
                    <div className="p-6 flex-grow">
                      <h3 className="text-lg font-bold">{course.title}</h3>
                      <p className="text-sm text-gray-500">by {course.instructor}</p>
                      <p className="text-gray-600 mt-3 text-sm">{course.description.substring(0, 100)}...</p>
                    </div>
                    <div className="p-6 bg-gray-100">
                      <Link href="/dashboard">
                        <button className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700">
                          View Course
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* How It Works / Features */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-12">Why Choose Gyana AI?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <FeatureCard icon={<BookOpen className="w-6 h-6" />} title="Structured Learning">
                Follow expert-designed learning paths with engaging videos, lessons, and quizzes.
              </FeatureCard>
              <FeatureCard icon={<Lightbulb className="w-6 h-6" />} title="24/7 AI Tutor">
                Get instant help whenever you're stuck — ask questions and get answers anytime.
              </FeatureCard>
              <FeatureCard icon={<BarChart2 className="w-6 h-6" />} title="Track Progress">
                See your learning progress, completed lessons, and quiz scores in one place.
              </FeatureCard>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-8">
        <p className="text-sm">&copy; {new Date().getFullYear()} Gyana AI. All Rights Reserved.</p>
        <p className="text-xs text-gray-400 mt-1">Built with ❤️ in Kathmandu for learners worldwide.</p>
      </footer>
    </div>

  );
}
