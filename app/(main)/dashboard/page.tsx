
// "use client";

// import { useState, FormEvent, useEffect, useRef } from "react";
// import { useSession } from "next-auth/react";
// import { LayoutDashboard, MessageSquare, PlayCircle, CheckCircle2, Paperclip, BookText } from "@/components/Icons";
// import Header from "@/components/Header";
// import { db } from "@/lib/firebase";
// import { collection, onSnapshot, query, orderBy, getDocs, doc, setDoc, arrayUnion, arrayRemove, getDoc, addDoc, serverTimestamp } from "firebase/firestore";
// import ReactMarkdown from 'react-markdown';

// // --- Data Types ---
// interface Message { role: 'user' | 'assistant'; content: string; image?: string; }
// interface Course { id: string; title: string; instructor: string; description: string; progress: number; }
// interface Module { id: string; title: string; lessons?: Lesson[]; quiz?: Quiz; }
// interface Lesson { id: string; title: string; videoUrl: string; content: string; }
// interface Quiz { id: string; title: string; questions: QuizQuestion[]; }
// interface QuizQuestion { questionText: string; options: string[]; correctAnswerIndex: number; }
// interface UserProgress { completedLessons: string[]; progress: number; }
// interface Note { content: string; }


// // --- NEW: Quiz Player Component ---
// const QuizPlayer = ({ quiz, courseId, moduleId, onQuizComplete }: { quiz: Quiz, courseId: string, moduleId: string, onQuizComplete: () => void }) => {
//     const { data: session } = useSession();
//     const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//     const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
//     const [isSubmitted, setIsSubmitted] = useState(false);
//     const [score, setScore] = useState(0);

//     const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
//         setSelectedAnswers({ ...selectedAnswers, [questionIndex]: answerIndex });
//     };

//     const handleSubmitQuiz = async () => {
//         let correctAnswers = 0;
//         quiz.questions.forEach((q, index) => {
//             if (selectedAnswers[index] === q.correctAnswerIndex) {
//                 correctAnswers++;
//             }
//         });
//         const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
//         setScore(finalScore);
//         setIsSubmitted(true);

//         // Save the quiz result to Firestore
//         if (session?.user?.id) {
//             const quizResultRef = collection(db, "users", session.user.id, "quizResults");
//             await addDoc(quizResultRef, {
//                 courseId,
//                 moduleId,
//                 quizTitle: quiz.title,
//                 score: finalScore,
//                 submittedAt: serverTimestamp()
//             });
//         }
//     };

//     if (isSubmitted) {
//         return (
//             <div className="p-6 text-center">
//                 <h3 className="text-2xl font-bold">Quiz Results</h3>
//                 <p className="mt-4 text-4xl font-bold">Your Score: <span className={score >= 70 ? 'text-green-600' : 'text-red-500'}>{score}%</span></p>
//                 <button onClick={onQuizComplete} className="mt-8 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700">Back to Course</button>
//             </div>
//         )
//     }

//     const currentQuestion = quiz.questions[currentQuestionIndex];
//     return (
//         <div className="p-6">
//             <h3 className="text-xl font-bold">{quiz.title}</h3>
//             <p className="text-gray-500">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
//             <div className="mt-6">
//                 <p className="font-semibold text-lg">{currentQuestion.questionText}</p>
//                 <div className="mt-4 space-y-3">
//                     {currentQuestion.options.map((option, index) => (
//                         <label key={index} className={`block p-4 rounded-lg border cursor-pointer ${selectedAnswers[currentQuestionIndex] === index ? 'bg-indigo-100 border-indigo-500' : 'bg-white hover:bg-gray-50'}`}>
//                             <input
//                                 type="radio"
//                                 name={`question-${currentQuestionIndex}`}
//                                 checked={selectedAnswers[currentQuestionIndex] === index}
//                                 onChange={() => handleAnswerSelect(currentQuestionIndex, index)}
//                                 className="mr-3"
//                             />
//                             {option}
//                         </label>
//                     ))}
//                 </div>
//             </div>
//             <div className="mt-8 flex justify-end">
//                 {currentQuestionIndex < quiz.questions.length - 1 ? (
//                     <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold">Next Question</button>
//                 ) : (
//                     <button onClick={handleSubmitQuiz} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold">Submit Quiz</button>
//                 )}
//             </div>
//         </div>
//     );
// };


// export default function DashboardPage() {
//     const { data: session } = useSession();

//     // --- State Variables ---
//     const [messages, setMessages] = useState<Message[]>([]);
//     const [input, setInput] = useState("");
//     const [image, setImage] = useState<string | null>(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const chatContainerRef = useRef<HTMLDivElement>(null);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const [courses, setCourses] = useState<Course[]>([]);
//     const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
//     const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
//     const [modules, setModules] = useState<Module[]>([]);
//     const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
//     const [isLoadingContent, setIsLoadingContent] = useState(false);
//     const [notes, setNotes] = useState("");
//     const [activeTab, setActiveTab] = useState<'tutor' | 'notes'>('tutor');

//     // NEW state to manage which quiz is being taken
//     const [takingQuizForModule, setTakingQuizForModule] = useState<Module | null>(null);

//     // --- Data Fetching and Logic ---
//     useEffect(() => {
//         const coursesCollectionRef = collection(db, "courses");
//         const unsubscribe = onSnapshot(coursesCollectionRef, (querySnapshot) => {
//             const coursesData: Course[] = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
//             setCourses(coursesData);
//             if (coursesData.length > 0 && !selectedCourse) {
//                 setSelectedCourse(coursesData[0]);
//             }
//         });
//         return () => unsubscribe();
//     }, [selectedCourse]);

//     useEffect(() => {
//         if (!session?.user?.id) return;
//         const userProgressRef = collection(db, "users", session.user.id, "courseProgress");
//         const unsubscribe = onSnapshot(userProgressRef, (snapshot) => {
//             const progressData: Record<string, UserProgress> = {};
//             snapshot.forEach(doc => { progressData[doc.id] = doc.data() as UserProgress; });
//             setUserProgress(progressData);
//         });
//         return () => unsubscribe();
//     }, [session?.user?.id]);

//     useEffect(() => {
//         if (!selectedCourse) return;
//         setIsLoadingContent(true);
//         const modulesQuery = query(collection(db, "courses", selectedCourse.id, "modules"), orderBy("createdAt"));
//         const unsubscribeModules = onSnapshot(modulesQuery, async (modulesSnapshot) => {
//             const modulesData = await Promise.all(modulesSnapshot.docs.map(async (moduleDoc) => {
//                 const module = { id: moduleDoc.id, ...moduleDoc.data() } as Module;
//                 const lessonsQuery = query(collection(db, "courses", selectedCourse.id, "modules", module.id, "lessons"), orderBy("createdAt"));
//                 const lessonsSnapshot = await getDocs(lessonsQuery);
//                 module.lessons = lessonsSnapshot.docs.map(lessonDoc => ({ id: lessonDoc.id, ...lessonDoc.data() } as Lesson));
//                 const quizDocRef = doc(db, "courses", selectedCourse.id, "modules", module.id, "quiz", "main_quiz");
//                 const quizSnapshot = await getDoc(quizDocRef);
//                 if (quizSnapshot.exists()) { module.quiz = { id: quizSnapshot.id, ...quizSnapshot.data() } as Quiz; }
//                 return module;
//             }));
//             setModules(modulesData);
//             if (modulesData.length > 0 && modulesData[0].lessons && modulesData[0].lessons.length > 0 && !selectedLesson && !takingQuizForModule) {
//                 setSelectedLesson(modulesData[0].lessons[0]);
//             }
//             setIsLoadingContent(false);
//         });
//         return () => unsubscribeModules();
//     }, [selectedCourse]);

//     useEffect(() => {
//         if (!session?.user?.id || !selectedCourse) return;
//         const noteDocRef = doc(db, "users", session.user.id, "notes", selectedCourse.id);
//         const unsubscribe = onSnapshot(noteDocRef, (doc) => {
//             if (doc.exists()) { setNotes(doc.data().content); } else { setNotes(""); }
//         });
//         return () => unsubscribe();
//     }, [selectedCourse, session?.user?.id]);

//     useEffect(() => {
//         if (!session?.user?.id || !selectedCourse || !notes) return;
//         const handler = setTimeout(async () => { const noteDocRef = doc(db, "users", session.user.id, "notes", selectedCourse.id); await setDoc(noteDocRef, { content: notes }, { merge: true }); }, 1000);
//         return () => clearTimeout(handler);
//     }, [notes, selectedCourse, session?.user?.id]);

//     const handleToggleLessonComplete = async () => { if (!session?.user?.id || !selectedCourse || !selectedLesson) return; const userProgressDocRef = doc(db, "users", session.user.id, "courseProgress", selectedCourse.id); const isCompleted = userProgress[selectedCourse.id]?.completedLessons?.includes(selectedLesson.id); try { await setDoc(userProgressDocRef, { completedLessons: isCompleted ? arrayRemove(selectedLesson.id) : arrayUnion(selectedLesson.id) }, { merge: true }); recalculateCourseProgress(selectedCourse.id); } catch (error) { console.error("Error updating lesson status: ", error); } };
//     const recalculateCourseProgress = async (courseId: string) => { if (!session?.user?.id) return; const userProgressDocRef = doc(db, "users", session.user.id, "courseProgress", courseId); const userProgressSnap = await getDoc(userProgressDocRef); const completedLessonIds = userProgressSnap.data()?.completedLessons || []; const totalLessons = modules.reduce((acc, module) => acc + (module.lessons?.length || 0), 0); const progress = totalLessons > 0 ? Math.round((completedLessonIds.length / totalLessons) * 100) : 0; await setDoc(userProgressDocRef, { progress }, { merge: true }); };
//     useEffect(() => { chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight); }, [messages]);
//     useEffect(() => { if (session && messages.length === 0) { setMessages([{ role: 'assistant', content: `Hi ${session.user?.name?.split(' ')[0]}! How can I help?` }]); } }, [session, messages.length]);
//     const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => { setImage(reader.result as string); }; } };
//     const handleSubmit = async (e: FormEvent) => { e.preventDefault(); if ((!input.trim() && !image) || isLoading) return; const userMessage: Message = { role: 'user', content: input, image: image || undefined }; setMessages(prev => [...prev, userMessage]); setIsLoading(true); try { const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: input, image: image }), }); if (!response.ok) throw new Error('Network response was not ok'); const data = await response.json(); setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]); } catch (error) { console.error("Failed to get AI response:", error); setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting." }]); } finally { setInput(""); setImage(null); setIsLoading(false); } };
//     const getEmbedUrl = (url: string | undefined): string | null => { if (!url) { return null; } try { const urlObj = new URL(url); let videoId: string | null = null; if (urlObj.hostname === 'youtu.be') { videoId = urlObj.pathname.slice(1); } else if (urlObj.hostname.includes('youtube.com')) { if (urlObj.pathname.startsWith('/shorts/')) { videoId = urlObj.pathname.split('/shorts/')[1]; } else { videoId = urlObj.searchParams.get('v'); } } if (videoId) { const ampersandPosition = videoId.indexOf('&'); if (ampersandPosition !== -1) { videoId = videoId.substring(0, ampersandPosition); } return `https://www.youtube.com/embed/${videoId}`; } } catch (error) { console.error("Invalid video URL:", error); return null; } if (url.includes('/embed/')) { return url; } return null; };

//     if (!session) return <div className="h-screen flex items-center justify-center"><p>Loading...</p></div>;

//     // --- RENDER LOGIC ---
//     return (
//         <>
//             <Header />
//             <main className="pt-24 bg-gray-50 min-h-screen">
//                 <div className="container mx-auto px-6 py-8"><h1 className="text-3xl font-bold text-gray-800">Welcome back, {session.user?.name?.split(' ')[0]}!</h1><p className="text-gray-600 mt-1">Let's continue learning and making progress.</p></div>
//                 <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
//                     <div className="lg:col-span-2 bg-white rounded-xl shadow-lg">
//                         {takingQuizForModule ? (
//                             <QuizPlayer
//                                 quiz={takingQuizForModule.quiz!}
//                                 courseId={selectedCourse!.id}
//                                 moduleId={takingQuizForModule.id}
//                                 onQuizComplete={() => setTakingQuizForModule(null)}
//                             />
//                         ) : (
//                             <div className="p-6">
//                                 <h2 className="text-2xl font-bold text-gray-800">{selectedCourse ? selectedCourse.title : 'Select a Course'}</h2>
//                                 <p className="text-sm text-gray-500 mb-4">by {selectedCourse ? selectedCourse.instructor : 'N/A'}</p>
//                                 <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
//                                     {(() => { const embedUrl = selectedLesson ? getEmbedUrl(selectedLesson.videoUrl) : null; if (embedUrl) { return (<iframe width="100%" height="100%" src={embedUrl} title={selectedLesson!.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-lg"></iframe>); } else { return <PlayCircle className="w-20 h-20 text-white/50" />; } })()}
//                                 </div>
//                                 <div className="mt-6 prose max-w-none">
//                                     <h3 className="text-xl font-bold">{selectedLesson ? selectedLesson.title : "Select a lesson to begin"}</h3>
//                                     {selectedLesson ? (<> <ReactMarkdown>{selectedLesson.content}</ReactMarkdown> <button onClick={handleToggleLessonComplete} className={`mt-6 w-full px-6 py-3 rounded-lg font-semibold text-lg shadow-lg transition-all ${userProgress[selectedCourse!.id]?.completedLessons?.includes(selectedLesson.id) ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}> {userProgress[selectedCourse!.id]?.completedLessons?.includes(selectedLesson.id) ? '✓ Marked as Complete' : 'Mark as Complete'} </button> </>) : (<p className="text-gray-500">Choose a lesson from the list.</p>)}
//                                 </div>
//                             </div>
//                         )}
//                     </div>

//                     <div className="space-y-8">
//                         <div className="bg-white rounded-xl shadow-lg p-6">
//                             <h3 className="text-xl font-bold text-gray-800 mb-4">Course Content</h3>
//                             {isLoadingContent ? <p>Loading content...</p> : (<ul className="space-y-4"> {modules.map(module => {
//                                 const completedLessonIds = userProgress[selectedCourse!.id]?.completedLessons || [];
//                                 const allLessonsInModuleCompleted = module.lessons?.every(l => completedLessonIds.includes(l.id));
//                                 return (
//                                     <li key={module.id}>
//                                         <h4 className="font-semibold text-gray-700 mb-2">{module.title}</h4>
//                                         <ul className="space-y-1 pl-2"> {module.lessons?.map(lesson => { const isCompleted = completedLessonIds.includes(lesson.id); return (<li key={lesson.id} onClick={() => { setSelectedLesson(lesson); setTakingQuizForModule(null); }} className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selectedLesson?.id === lesson.id && !takingQuizForModule ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}> {isCompleted ? <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> : <PlayCircle className="w-5 h-5 mr-3" />} <span className={isCompleted ? 'line-through text-gray-500' : ''}>{lesson.title}</span> </li>) })}
//                                             {module.quiz && (
//                                                 <li className="mt-2">
//                                                     <button onClick={() => setTakingQuizForModule(module)} disabled={!allLessonsInModuleCompleted} className={`w-full text-center p-2 rounded-md font-semibold ${allLessonsInModuleCompleted ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
//                                                         Take Quiz: {module.quiz.title}
//                                                     </button>
//                                                 </li>
//                                             )}
//                                         </ul>
//                                     </li>
//                                 )
//                             })} </ul>)}
//                         </div>

//                         <div className="bg-white rounded-xl shadow-lg">
//                             <div className="flex border-b">
//                                 <button onClick={() => setActiveTab('tutor')} className={`flex-1 p-4 font-semibold flex items-center justify-center gap-2 ${activeTab === 'tutor' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}><MessageSquare className="w-5 h-5" /> AI Tutor</button>
//                                 <button onClick={() => setActiveTab('notes')} className={`flex-1 p-4 font-semibold flex items-center justify-center gap-2 ${activeTab === 'notes' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}><BookText className="w-5 h-5" /> My Notes</button>
//                             </div>
//                             <div className="p-6">
//                                 {activeTab === 'tutor' ? (
//                                     <div>
//                                         <div ref={chatContainerRef} className="h-80 bg-gray-100 rounded-lg p-4 flex flex-col space-y-4 overflow-y-auto">{messages.map((msg, index) => (<div key={index} className={`flex flex-col ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>{msg.image && <img src={msg.image} alt="User upload" className="rounded-lg mb-2 max-w-xs" />}<div className={`p-3 rounded-lg max-w-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>{msg.content}</div></div>))}{isLoading && <div className="bg-gray-200 text-gray-800 self-start p-3 rounded-lg"><span className="animate-pulse">Typing...</span></div>}</div>
//                                         <form onSubmit={handleSubmit} className="mt-4 flex items-center"><input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" /><button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2 text-gray-500 hover:text-indigo-600 disabled:text-gray-300"><Paperclip className="w-6 h-6" /></button><input type="text" placeholder="Ask a question..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} className="w-full px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100" /><button type="submit" disabled={isLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 disabled:bg-indigo-300">Send</button></form>
//                                     </div>
//                                 ) : (
//                                     <div><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={`My personal notes for ${selectedCourse?.title}...`} className="w-full h-96 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" /><p className="text-xs text-gray-400 mt-2 text-center">Notes are saved automatically.</p></div>
//                                 )}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </main>
//         </>
//     );
// }


// app/(main)/dashboard/page.tsx


"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { LayoutDashboard, MessageSquare, PlayCircle, CheckCircle2, Paperclip, BookText } from "@/components/Icons";
import Header from "@/components/Header";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, getDocs, doc, setDoc, arrayUnion, arrayRemove, getDoc, addDoc, serverTimestamp, increment } from "firebase/firestore";
import ReactMarkdown from 'react-markdown';
import Link from "next/link";

// --- Data Types ---
interface Message { role: 'user' | 'assistant'; content: string; image?: string; }
interface Course { id: string; title: string; instructor: string; description: string; progress: number; }
interface Module { id: string; title: string; lessons?: Lesson[]; quiz?: Quiz; }
interface Lesson { id: string; title: string; videoUrl: string; content: string; }
interface Quiz { id: string; title: string; questions: QuizQuestion[]; }
interface QuizQuestion { questionText: string; options: string[]; correctAnswerIndex: number; }
interface UserProgress { completedLessons: string[]; progress: number; timeSpent?: number; }
interface Note { content: string; }

// --- Quiz Player Component ---
const QuizPlayer = ({ quiz, courseId, moduleId, onQuizComplete }: { quiz: Quiz, courseId: string, moduleId: string, onQuizComplete: () => void }) => {
    const { data: session } = useSession();
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const handleAnswerSelect = (qIndex: number, aIndex: number) => { setSelectedAnswers({ ...selectedAnswers, [qIndex]: aIndex }); };
    const handleSubmitQuiz = async () => {
        let correctAnswers = 0;
        quiz.questions.forEach((q, index) => { if (selectedAnswers[index] === q.correctAnswerIndex) { correctAnswers++; } });
        const finalScore = Math.round((correctAnswers / quiz.questions.length) * 100);
        setScore(finalScore);
        setIsSubmitted(true);
        if (session?.user?.id) {
            const quizResultRef = collection(db, "users", session.user.id, "quizResults");
            await addDoc(quizResultRef, { courseId, moduleId, quizTitle: quiz.title, score: finalScore, submittedAt: serverTimestamp() });
        }
    };
    if (isSubmitted) { return (<div className="p-6 text-center"><h3 className="text-2xl font-bold">Quiz Results</h3><p className="mt-4 text-4xl font-bold">Your Score: <span className={score >= 70 ? 'text-green-600' : 'text-red-500'}>{score}%</span></p><button onClick={onQuizComplete} className="mt-8 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700">Back to Course</button></div>) }
    const currentQuestion = quiz.questions[currentQuestionIndex];
    return (<div className="p-6"><h3 className="text-xl font-bold">{quiz.title}</h3><p className="text-gray-500">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p><div className="mt-6"><p className="font-semibold text-lg">{currentQuestion.questionText}</p><div className="mt-4 space-y-3">{currentQuestion.options.map((option, index) => (<label key={index} className={`block p-4 rounded-lg border cursor-pointer ${selectedAnswers[currentQuestionIndex] === index ? 'bg-indigo-100 border-indigo-500' : 'bg-white hover:bg-gray-50'}`}><input type="radio" name={`question-${currentQuestionIndex}`} checked={selectedAnswers[currentQuestionIndex] === index} onChange={() => handleAnswerSelect(currentQuestionIndex, index)} className="mr-3" />{option}</label>))}</div></div><div className="mt-8 flex justify-end">{currentQuestionIndex < quiz.questions.length - 1 ? (<button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold">Next Question</button>) : (<button onClick={handleSubmitQuiz} className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold">Submit Quiz</button>)}</div></div>);
};

export default function DashboardPage() {
    const { data: session } = useSession();

    // --- State Variables ---
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<Module[]>([]);
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [notes, setNotes] = useState("");
    const [activeTab, setActiveTab] = useState<'tutor' | 'notes'>('tutor');
    const [takingQuizForModule, setTakingQuizForModule] = useState<Module | null>(null);

    // --- Data Fetching and Logic ---
    useEffect(() => {
        const coursesCollectionRef = collection(db, "courses");
        const unsubscribe = onSnapshot(coursesCollectionRef, (snapshot) => {
            const coursesData: Course[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
            setCourses(coursesData);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (courses.length > 0 && !selectedCourse) {
            setSelectedCourse(courses[0]);
        }
    }, [courses, selectedCourse]);

    useEffect(() => {
        if (!session?.user?.id) return;
        const userProgressRef = collection(db, "users", session.user.id, "courseProgress");
        const unsubscribe = onSnapshot(userProgressRef, (snapshot) => {
            const progressData: Record<string, UserProgress> = {};
            snapshot.forEach(doc => { progressData[doc.id] = doc.data() as UserProgress; });
            setUserProgress(progressData);
        });
        return () => unsubscribe();
    }, [session?.user?.id]);

    useEffect(() => {
        if (!selectedCourse) return;
        setIsLoadingContent(true);
        const modulesQuery = query(collection(db, "courses", selectedCourse.id, "modules"), orderBy("createdAt"));
        const unsubscribeModules = onSnapshot(modulesQuery, async (modulesSnapshot) => {
            const modulesData = await Promise.all(modulesSnapshot.docs.map(async (moduleDoc) => {
                const module = { id: moduleDoc.id, ...moduleDoc.data() } as Module;
                const lessonsQuery = query(collection(db, "courses", selectedCourse.id, "modules", module.id, "lessons"), orderBy("createdAt"));
                const lessonsSnapshot = await getDocs(lessonsQuery);
                module.lessons = lessonsSnapshot.docs.map(lessonDoc => ({ id: lessonDoc.id, ...lessonDoc.data() } as Lesson));
                const quizDocRef = doc(db, "courses", selectedCourse.id, "modules", module.id, "quiz", "main_quiz");
                const quizSnapshot = await getDoc(quizDocRef);
                if (quizSnapshot.exists()) { module.quiz = { id: quizSnapshot.id, ...quizSnapshot.data() } as Quiz; }
                return module;
            }));
            setModules(modulesData);
            if (modulesData.length > 0 && modulesData[0].lessons && modulesData[0].lessons.length > 0 && !selectedLesson && !takingQuizForModule) {
                setSelectedLesson(modulesData[0].lessons[0]);
            }
            setIsLoadingContent(false);
        });
        return () => unsubscribeModules();
    }, [selectedCourse, takingQuizForModule]);

    useEffect(() => {
        if (!session?.user?.id || !selectedCourse) return;
        const noteDocRef = doc(db, "users", session.user.id, "notes", selectedCourse.id);
        const unsubscribe = onSnapshot(noteDocRef, (doc) => {
            if (doc.exists()) { setNotes(doc.data().content); } else { setNotes(""); }
        });
        return () => unsubscribe();
    }, [selectedCourse, session?.user?.id]);

    useEffect(() => {
        if (!session?.user?.id || !selectedCourse) return;
        const handler = setTimeout(async () => {
            const noteDocRef = doc(db, "users", session.user.id, "notes", selectedCourse.id);
            await setDoc(noteDocRef, { content: notes }, { merge: true });
        }, 1000);
        return () => clearTimeout(handler);
    }, [notes, selectedCourse, session?.user?.id]);

    useEffect(() => {
        if (!session?.user?.id || !selectedCourse) return;
        const interval = setInterval(async () => {
            const progressDocRef = doc(db, "users", session.user.id, "courseProgress", selectedCourse.id);
            await setDoc(progressDocRef, { timeSpent: increment(10) }, { merge: true });
        }, 10000);
        return () => clearInterval(interval);
    }, [selectedCourse, session?.user?.id]);

    const handleToggleLessonComplete = async () => { if (!session?.user?.id || !selectedCourse || !selectedLesson) return; const userProgressDocRef = doc(db, "users", session.user.id, "courseProgress", selectedCourse.id); const isCompleted = userProgress[selectedCourse.id]?.completedLessons?.includes(selectedLesson.id); try { await setDoc(userProgressDocRef, { completedLessons: isCompleted ? arrayRemove(selectedLesson.id) : arrayUnion(selectedLesson.id) }, { merge: true }); recalculateCourseProgress(selectedCourse.id); } catch (error) { console.error("Error updating lesson status: ", error); } };
    const recalculateCourseProgress = async (courseId: string) => {
        if (!session?.user?.id) return;
        const userProgressDocRef = doc(db, "users", session.user.id, "courseProgress", courseId);
        const userProgressSnap = await getDoc(userProgressDocRef);
        const completedLessonIds = userProgressSnap.data()?.completedLessons || [];

        // ✅ Fix: Filter only modules from this course
        const courseModules = modules.filter(m => selectedCourse?.id === courseId);
        const totalLessons = courseModules.reduce((acc, module) => acc + (module.lessons?.length || 0), 0);

        const progress = totalLessons > 0
            ? Math.min(100, Math.round((completedLessonIds.length / totalLessons) * 100))
            : 0;

        await setDoc(userProgressDocRef, { progress }, { merge: true });
    };
    useEffect(() => { chatContainerRef.current?.scrollTo(0, chatContainerRef.current.scrollHeight); }, [messages]);
    useEffect(() => { if (session && messages.length === 0) { setMessages([{ role: 'assistant', content: `Hi ${session.user?.name?.split(' ')[0]}! How can I help?` }]); } }, [session, messages.length]);
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => { setImage(reader.result as string); }; } };
    const handleSubmit = async (e: FormEvent) => { e.preventDefault(); if ((!input.trim() && !image) || isLoading) return; const userMessage: Message = { role: 'user', content: input, image: image || undefined }; setMessages(prev => [...prev, userMessage]); setIsLoading(true); try { const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: input, image: image }), }); if (!response.ok) throw new Error('Network response was not ok'); const data = await response.json(); setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]); } catch (error) { console.error("Failed to get AI response:", error); setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting." }]); } finally { setInput(""); setImage(null); setIsLoading(false); } };
    const getEmbedUrl = (url: string | undefined): string | null => { if (!url) { return null; } try { const urlObj = new URL(url); let videoId: string | null = null; if (urlObj.hostname === 'youtu.be') { videoId = urlObj.pathname.slice(1); } else if (urlObj.hostname.includes('youtube.com')) { if (urlObj.pathname.startsWith('/shorts/')) { videoId = urlObj.pathname.split('/shorts/')[1]; } else { videoId = urlObj.searchParams.get('v'); } } if (videoId) { const ampersandPosition = videoId.indexOf('&'); if (ampersandPosition !== -1) { videoId = videoId.substring(0, ampersandPosition); } return `https://www.youtube.com/embed/${videoId}`; } } catch (error) { console.error("Invalid video URL:", error); return null; } if (url.includes('/embed/')) { return url; } return null; };

    if (!session) return <div className="h-screen flex items-center justify-center"><p>Loading...</p></div>;

    return (
        <>
            <Header />
            <main className="pt-24 bg-gray-50 min-h-screen">
                <div className="container mx-auto px-6 py-8"><h1 className="text-3xl font-bold text-gray-800">Welcome back, {session.user?.name?.split(' ')[0]}!</h1><p className="text-gray-600 mt-1">Let's continue learning and making progress.</p></div>
                <div className="container mx-auto px-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg">
                        {takingQuizForModule ? (<QuizPlayer quiz={takingQuizForModule.quiz!} courseId={selectedCourse!.id} moduleId={takingQuizForModule.id} onQuizComplete={() => setTakingQuizForModule(null)} />) : (<div className="p-6"> <h2 className="text-2xl font-bold text-gray-800">{selectedCourse ? selectedCourse.title : 'Select a Course'}</h2> <p className="text-sm text-gray-500 mb-4">by {selectedCourse ? selectedCourse.instructor : 'N/A'}</p> <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center"> {(() => { const embedUrl = selectedLesson ? getEmbedUrl(selectedLesson.videoUrl) : null; if (embedUrl) { return (<iframe width="100%" height="100%" src={embedUrl} title={selectedLesson!.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-lg"></iframe>); } else { return <PlayCircle className="w-20 h-20 text-white/50" />; } })()} </div> <div className="mt-6 prose max-w-none"> <h3 className="text-xl font-bold">{selectedLesson ? selectedLesson.title : "Select a lesson to begin"}</h3> {selectedLesson ? (<> <ReactMarkdown>{selectedLesson.content}</ReactMarkdown> <button onClick={handleToggleLessonComplete} className={`mt-6 w-full px-6 py-3 rounded-lg font-semibold text-lg shadow-lg transition-all ${userProgress[selectedCourse!.id]?.completedLessons?.includes(selectedLesson.id) ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}> {userProgress[selectedCourse!.id]?.completedLessons?.includes(selectedLesson.id) ? '✓ Marked as Complete' : 'Mark as Complete'} </button> </>) : (<p className="text-gray-500">Choose a lesson from the list.</p>)} </div> </div>)}
                    </div>

                    <div className="space-y-8">
                        {/* --- CORRECTED: "Your Progress" component is now part of the sidebar --- */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center space-x-3"><LayoutDashboard className="w-8 h-8 text-indigo-600" /><h3 className="text-xl font-bold text-gray-800">Your Courses</h3></div>
                            <ul className="mt-4 space-y-4">
                                {courses.length > 0 ? (
                                    courses.map(course => (
                                        <li key={course.id} onClick={() => setSelectedCourse(course)} className={`cursor-pointer p-2 rounded-lg hover:bg-gray-100 ${selectedCourse?.id === course.id ? 'bg-gray-200' : ''}`}>
                                            <p className="font-semibold text-gray-700">{course.title}</p>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1"><div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${userProgress[course.id]?.progress || 0}%` }}></div></div>
                                        </li>
                                    ))
                                ) : (
                                    <p className="text-gray-500">No courses available.</p>
                                )}
                            </ul>
                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Course Content</h3>
                            <div className="flex justify-end mb-4">
                                <Link href={`/courses/${selectedCourse?.id}`}>
                                    <button className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-indigo-200">
                                        Go to Course Chat Room
                                    </button>
                                </Link>
                            </div>
                            {isLoadingContent ? <p>Loading content...</p> : (<ul className="space-y-4"> {modules.map(module => { const completedLessonIds = userProgress[selectedCourse!.id]?.completedLessons || []; const allLessonsInModuleCompleted = module.lessons?.every(l => completedLessonIds.includes(l.id)); return (<li key={module.id}> <h4 className="font-semibold text-gray-700 mb-2">{module.title}</h4> <ul className="space-y-1 pl-2"> {module.lessons?.map(lesson => { const isCompleted = completedLessonIds.includes(lesson.id); return (<li key={lesson.id} onClick={() => { setSelectedLesson(lesson); setTakingQuizForModule(null); }} className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selectedLesson?.id === lesson.id && !takingQuizForModule ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}> {isCompleted ? <CheckCircle2 className="w-5 h-5 mr-3 text-green-500" /> : <PlayCircle className="w-5 h-5 mr-3" />} <span className={isCompleted ? 'line-through text-gray-500' : ''}>{lesson.title}</span> </li>) })} {module.quiz && (<li className="mt-2"> <button onClick={() => setTakingQuizForModule(module)} disabled={!allLessonsInModuleCompleted} className={`w-full text-center p-2 rounded-md font-semibold ${allLessonsInModuleCompleted ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}> Take Quiz: {module.quiz.title} </button> </li>)} </ul> </li>) })} </ul>)}
                        </div>

                        <div className="bg-white rounded-xl shadow-lg">
                            <div className="flex border-b"><button onClick={() => setActiveTab('tutor')} className={`flex-1 p-4 font-semibold flex items-center justify-center gap-2 ${activeTab === 'tutor' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}><MessageSquare className="w-5 h-5" /> AI Tutor</button><button onClick={() => setActiveTab('notes')} className={`flex-1 p-4 font-semibold flex items-center justify-center gap-2 ${activeTab === 'notes' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}><BookText className="w-5 h-5" /> My Notes</button></div>
                            <div className="p-6">{activeTab === 'tutor' ? (<div> <div ref={chatContainerRef} className="h-80 bg-gray-100 rounded-lg p-4 flex flex-col space-y-4 overflow-y-auto">{messages.map((msg, index) => (<div key={index} className={`flex flex-col ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>{msg.image && <img src={msg.image} alt="User upload" className="rounded-lg mb-2 max-w-xs" />}<div className={`p-3 rounded-lg max-w-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>{msg.content}</div></div>))}{isLoading && <div className="bg-gray-200 text-gray-800 self-start p-3 rounded-lg"><span className="animate-pulse">Typing...</span></div>}</div> <form onSubmit={handleSubmit} className="mt-4 flex items-center"><input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" /><button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2 text-gray-500 hover:text-indigo-600 disabled:text-gray-300"><Paperclip className="w-6 h-6" /></button><input type="text" placeholder="Ask a question..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} className="w-full px-3 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100" /><button type="submit" disabled={isLoading} className="bg-indigo-600 text-white px-4 py-2 rounded-r-lg hover:bg-indigo-700 disabled:bg-indigo-300">Send</button></form> </div>) : (<div><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={`My personal notes for ${selectedCourse?.title}...`} className="w-full h-96 p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" /><p className="text-xs text-gray-400 mt-2 text-center">Notes are saved automatically.</p></div>)}</div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}

