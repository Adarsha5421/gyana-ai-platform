
"use client";

import { useState, useEffect, FormEvent } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import { useSession } from "next-auth/react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy, getDocs, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { Paperclip, PlusCircle, Trash2 } from "@/components/Icons";

// --- Data Types ---
interface Course { title: string; instructor: string; }
interface Module { id: string; title: string; lessons?: Lesson[]; quiz?: Quiz; }
interface Lesson { id: string; title: string; videoUrl: string; content: string; }
interface Quiz { id: string; title: string; questions: Question[]; }
interface Question {
    id: string;
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
}


// --- Component for Adding a Lesson ---
const AddLessonForm = ({ courseId, moduleId, onLessonAdded }: { courseId: string, moduleId: string, onLessonAdded: () => void }) => {
    const [lessonTitle, setLessonTitle] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [lessonContent, setLessonContent] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddLesson = async (e: FormEvent) => {
        e.preventDefault();
        if (!lessonTitle.trim() || !videoUrl.trim()) return;
        setIsSubmitting(true);
        const lessonsCollectionRef = collection(db, "courses", courseId, "modules", moduleId, "lessons");
        try {
            await addDoc(lessonsCollectionRef, {
                title: lessonTitle, videoUrl: videoUrl, content: lessonContent, createdAt: serverTimestamp()
            });
            setLessonTitle(""); setVideoUrl(""); setLessonContent("");
            onLessonAdded();
        } catch (error) {
            console.error("Error adding lesson: ", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleAddLesson} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
            <h5 className="font-semibold text-gray-700">New Lesson</h5>
            <div>
                <label htmlFor="lessonTitle" className="block text-sm font-medium text-gray-700">Lesson Title</label>
                <input type="text" id="lessonTitle" value={lessonTitle} onChange={(e) => setLessonTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700">Video URL</label>
                <input type="url" id="videoUrl" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            <div>
                <label htmlFor="lessonContent" className="block text-sm font-medium text-gray-700">Lesson Content</label>
                <textarea id="lessonContent" rows={5} value={lessonContent} onChange={(e) => setLessonContent(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-blue-300">
                {isSubmitting ? "Saving..." : "Save Lesson"}
            </button>
        </form>
    );
};

// --- Component for Adding a Quiz ---
const AddQuizForm = ({ courseId, moduleId, onQuizAdded }: { courseId: string; moduleId: string; onQuizAdded: () => void }) => {
    const [quizTitle, setQuizTitle] = useState("");
    const [questions, setQuestions] = useState<Omit<Question, 'id'>[]>([{ questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0 }]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleQuestionChange = (qIndex: number, field: 'questionText' | 'options', value: string, oIndex?: number) => {
        const newQuestions = [...questions];
        if (field === 'options' && oIndex !== undefined) newQuestions[qIndex].options[oIndex] = value;
        else if (field === 'questionText') newQuestions[qIndex].questionText = value;
        setQuestions(newQuestions);
    };
    const handleCorrectAnswerChange = (qIndex: number, aIndex: number) => { const newQuestions = [...questions]; newQuestions[qIndex].correctAnswerIndex = aIndex; setQuestions(newQuestions); };
    const addQuestion = () => { setQuestions([...questions, { questionText: "", options: ["", "", "", ""], correctAnswerIndex: 0 }]); };
    const removeQuestion = (index: number) => { setQuestions(questions.filter((_, i) => i !== index)); };

    const handleSaveQuiz = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const quizDocRef = doc(db, "courses", courseId, "modules", moduleId, "quiz", "main_quiz");
        try {
            await setDoc(quizDocRef, { title: quizTitle, questions: questions, createdAt: serverTimestamp() });
            onQuizAdded();
        } catch (error) { console.error("Error saving quiz: ", error); } finally { setIsSubmitting(false); }
    };

    return (
        <form onSubmit={handleSaveQuiz} className="mt-4 p-4 bg-gray-50 rounded-lg space-y-6">
            <h5 className="text-lg font-semibold text-gray-800">Create Quiz for Module</h5>
            <div>
                <label htmlFor="quizTitle" className="block text-sm font-medium text-gray-700">Quiz Title</label>
                <input type="text" id="quizTitle" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
            </div>
            {questions.map((q, qIndex) => (
                <div key={qIndex} className="p-4 border border-gray-200 rounded-md bg-white">
                    <div className="flex justify-between items-center"><label className="block text-sm font-bold text-gray-700">Question {qIndex + 1}</label>{questions.length > 1 && <button type="button" onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>}</div>
                    <textarea value={q.questionText} onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)} rows={2} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Enter question text" required />
                    <div className="mt-2 space-y-2">
                        <label className="block text-xs font-medium text-gray-500">Options (Select the correct answer)</label>
                        {q.options.map((opt, oIndex) => (<div key={oIndex} className="flex items-center"><input type="radio" name={`correct-answer-${qIndex}`} checked={q.correctAnswerIndex === oIndex} onChange={() => handleCorrectAnswerChange(qIndex, oIndex)} className="h-4 w-4 text-indigo-600 border-gray-300" /><input type="text" value={opt} onChange={(e) => handleQuestionChange(qIndex, 'options', e.target.value, oIndex)} className="ml-3 block w-full px-2 py-1 border-gray-300 rounded-md text-sm" placeholder={`Option ${oIndex + 1}`} required /></div>))}
                    </div>
                </div>
            ))}
            <button type="button" onClick={addQuestion} className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"><PlusCircle className="w-5 h-5" /> Add Another Question</button>
            <button type="submit" disabled={isSubmitting} className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold shadow-lg hover:bg-green-700 disabled:bg-green-400">{isSubmitting ? "Saving Quiz..." : "Save Quiz"}</button>
        </form>
    );
};

// --- Main Page Component ---
export default function CourseEditorPage() {
    const { status } = useSession();
    const params = useParams();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [isLoadingCourse, setIsLoadingCourse] = useState(true);
    const [modules, setModules] = useState<Module[]>([]);
    const [moduleTitle, setModuleTitle] = useState("");
    const [isSubmittingModule, setIsSubmittingModule] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState("");

    // --- State to manage which form is open ---
    const [addingLessonToModuleId, setAddingLessonToModuleId] = useState<string | null>(null);
    const [addingQuizToModuleId, setAddingQuizToModuleId] = useState<string | null>(null);

    // Effect to fetch course, modules, and their nested content
    useEffect(() => {
        if (!courseId) return;
        const courseDocRef = doc(db, "courses", courseId);
        onSnapshot(courseDocRef, (doc) => {
            if (doc.exists()) { setCourse(doc.data() as Course); }
            setIsLoadingCourse(false);
        });

        const modulesQuery = query(collection(db, "courses", courseId, "modules"), orderBy("createdAt"));
        const unsubscribeModules = onSnapshot(modulesQuery, async (modulesSnapshot) => {
            const modulesData = await Promise.all(modulesSnapshot.docs.map(async (moduleDoc) => {
                const mod = { id: moduleDoc.id, ...moduleDoc.data() } as Module;
                const lessonsQuery = query(collection(db, "courses", courseId, "modules", mod.id, "lessons"), orderBy("createdAt"));
                const lessonsSnapshot = await getDocs(lessonsQuery);
                mod.lessons = lessonsSnapshot.docs.map(lessonDoc => ({ id: lessonDoc.id, ...lessonDoc.data() } as Lesson));
                const quizDocRef = doc(db, "courses", courseId, "modules", mod.id, "quiz", "main_quiz");
                const quizSnapshot = await getDoc(quizDocRef);
                if (quizSnapshot.exists()) { mod.quiz = { id: quizSnapshot.id, ...quizSnapshot.data() } as Quiz; }
                return mod;
            }));
            setModules(modulesData);
        });
        return () => unsubscribeModules();
    }, [courseId]);

    const handleAddModule = async (e: FormEvent) => { e.preventDefault(); if (!moduleTitle.trim()) return; setIsSubmittingModule(true); try { await addDoc(collection(db, "courses", courseId, "modules"), { title: moduleTitle, createdAt: serverTimestamp() }); setModuleTitle(""); setFeedbackMessage("Module created successfully!"); } catch (error) { console.error("Error adding module: ", error); setFeedbackMessage("Failed to create module."); } finally { setIsSubmittingModule(false); setTimeout(() => setFeedbackMessage(""), 3000); } };

    const deleteQuiz = async (moduleId: string) => { if (confirm("Are you sure?")) { await deleteDoc(doc(db, "courses", courseId, "modules", moduleId, "quiz", "main_quiz")); } };

    if (status === "loading" || isLoadingCourse) { return <div className="h-screen flex items-center justify-center"><p>Loading...</p></div>; }
    if (!course) { return <div className="h-screen flex items-center justify-center"><p>Course not found.</p></div>; }

    return (
        <>
            <Header />
            <main className="pt-24 bg-gray-50 min-h-screen">
                <div className="container mx-auto px-6 py-8">
                    <div><p className="text-sm text-gray-500">Editing Course</p><h1 className="text-3xl font-bold text-gray-800">{course.title}</h1><p className="text-gray-600 mt-1">by {course.instructor}</p></div>
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-1">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-bold mb-4">Add New Module</h3>
                                <form onSubmit={handleAddModule}>
                                    <label htmlFor="moduleTitle" className="block text-sm font-medium text-gray-700">Module Title</label>
                                    <input type="text" id="moduleTitle" value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="e.g., Module 1: Introduction" />
                                    <button type="submit" disabled={isSubmittingModule} className="mt-4 w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-indigo-400">{isSubmittingModule ? "Creating..." : "Add Module"}</button>
                                    {feedbackMessage && <p className="mt-3 text-sm text-center text-gray-600">{feedbackMessage}</p>}
                                </form>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-xl font-bold mb-4">Course Content</h3>
                                {modules.length > 0 ? (
                                    <ul className="space-y-4">
                                        {modules.map(module => (
                                            <li key={module.id} className="bg-gray-100 p-4 rounded-lg">
                                                <h4 className="font-semibold text-gray-800">{module.title}</h4>
                                                <ul className="mt-3 space-y-2 pl-4">
                                                    {module.lessons?.map(lesson => (<li key={lesson.id} className="flex items-center text-gray-600"><Paperclip className="w-4 h-4 mr-2" /><span>{lesson.title}</span></li>))}
                                                    {module.quiz && (<li className="flex justify-between items-center text-green-700 font-semibold bg-green-100 p-2 rounded-md"><span>✓ Quiz: {module.quiz.title}</span><button onClick={() => deleteQuiz(module.id)} className="text-xs text-red-500 hover:underline">Delete</button></li>)}
                                                </ul>
                                                <div className="mt-4 pt-4 border-t flex items-center gap-4">
                                                    <button onClick={() => { setAddingLessonToModuleId(addingLessonToModuleId === module.id ? null : module.id); setAddingQuizToModuleId(null); }} className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-semibold hover:bg-blue-200">{addingLessonToModuleId === module.id ? 'Cancel Lesson' : '+ Add Lesson'}</button>
                                                    {!module.quiz && (<button onClick={() => { setAddingQuizToModuleId(addingQuizToModuleId === module.id ? null : module.id); setAddingLessonToModuleId(null); }} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold hover:bg-green-200">{addingQuizToModuleId === module.id ? 'Cancel Quiz' : '+ Add Quiz'}</button>)}
                                                </div>
                                                {addingLessonToModuleId === module.id && <AddLessonForm courseId={courseId} moduleId={module.id} onLessonAdded={() => setAddingLessonToModuleId(null)} />}
                                                {addingQuizToModuleId === module.id && <AddQuizForm courseId={courseId} moduleId={module.id} onQuizAdded={() => setAddingQuizToModuleId(null)} />}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (<p className="text-sm text-gray-500">No modules created yet.</p>)}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
