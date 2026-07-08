import React, { useState, useEffect, useRef } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, db, googleProvider, ADMIN_EMAIL } from "./lib/firebase";
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, writeBatch, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";

import { Task, CalendarEvent, Reminder, StudyMaterial, ClassSchedule, Flashcard, StudyNote, StudyGoal, StudyChecklist, FeynmanExplanation, MindMap, StudySummary, SubjectGrade } from "./types";
import TaskSection from "./components/TaskSection";
import CalendarSection from "./components/CalendarSection";
import ReminderSection from "./components/ReminderSection";
import StudyHelpSection from "./components/StudyHelpSection";
import DashboardSection from "./components/DashboardSection";
import ScheduleSection from "./components/ScheduleSection";
import GradesSection from "./components/GradesSection";
import HistorySection from "./components/HistorySection";
import StatsSection from "./components/StatsSection";
import AchievementsSection from "./components/AchievementsSection";
import StudyModeSection from "./components/StudyModeSection";
import AdminSection from "./components/AdminSection";

import { BookOpen, Calendar as CalendarIcon, CheckSquare, Clock, Sparkles, RefreshCw, LayoutDashboard, GraduationCap, Archive, BarChart3, Trophy, Sun, Moon, LogOut, ShieldAlert, UserCheck, AlertCircle, Heart } from "lucide-react";

// Default seed data for onboarding the user once their account is accepted
const INITIAL_CATEGORIES = ["Matemáticas", "Historia", "Ciencias", "Literatura", "Geografía", "Idiomas", "Otros"];

const INITIAL_TASKS: Task[] = [
  {
    id: "task-1",
    title: "Resolver guía de derivadas",
    category: "Matemáticas",
    completed: false,
    dueDate: "2026-06-25",
    priority: "high",
    notes: "Páginas 45 y 46 de la fotocopiadora. Entrega individual por Classroom."
  },
  {
    id: "task-2",
    title: "Leer capítulo 4 de Don Quijote",
    category: "Literatura",
    completed: false,
    dueDate: "2026-06-29",
    priority: "medium",
    notes: "Anotar personajes secundarios para el TP grupal."
  },
  {
    id: "task-3",
    title: "Formar equipo para feria de ciencias",
    category: "Geografía",
    completed: true,
    dueDate: "2026-06-24",
    priority: "low",
    notes: "Hablar con Julieta, Lucas y Alan en el recreo largo."
  }
];

const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: "event-1",
    title: "Examen Integrador de Geografía",
    date: "2026-06-28",
    type: "examen",
    description: "Geografía de América: climas, relieves y cuencas hidrográficas."
  },
  {
    id: "event-2",
    title: "Acto escolar Día de la Bandera",
    date: "2026-06-20",
    type: "acto_escolar",
    description: "Asistir con uniforme formal a las 8:30 hs."
  },
  {
    id: "event-3",
    title: "Feriado de Paso a la Inmortalidad de Güemes",
    date: "2026-06-15",
    type: "feriado",
    description: "Feriado nacional permanente."
  }
];

const INITIAL_REMINDERS: Reminder[] = [
  {
    id: "rem-1",
    title: "Llevar diccionario de inglés",
    datetime: "2026-06-25T07:30",
    completed: false
  },
  {
    id: "rem-2",
    title: "Devolver libro 'La Célula' a la biblioteca",
    datetime: "2026-06-26T13:10",
    completed: false
  }
];

const INITIAL_STUDY: StudyMaterial[] = [
  {
    id: "study-1",
    title: "La Célula y su Estructura",
    text: "La célula es la unidad fundamental de todos los seres vivos. Contiene material genético en el núcleo, un citoplasma donde se ubican las organelas y una membrana celular que regula la entrada y salida de sustancias. Las mitocondrias producen energía (ATP) a través de la respiración celular, mientras que en las células de las plantas, los cloroplastos atrapan la luz solar para la fotosíntesis.",
    questions: [
      {
        question: "¿Qué organela celular se encarga de regular la entrada y salida de sustancias?",
        options: [
          "Músculo celular",
          "Membrana celular o plasmática",
          "Mitocondria productiva",
          "Cloroplasto vegetal"
        ],
        correctIndex: 1,
        explanation: "La membrana celular actúa como una barrera selectiva que controla qué nutrientes y desechos pueden cruzar sus límites."
      },
      {
        question: "¿Cuál es la función principal de las mitocondrias?",
        options: [
          "Almacenar jugos y agua",
          "Llevar a cabo la fotosíntesis solar",
          "Producir moléculas de energía (ATP)",
          "Duplicar el núcleo completo"
        ],
        correctIndex: 2,
        explanation: "Las mitocondrias son conocidas como las fuentes de energía celular puesto que obtienen ATP de los alimentos en la respiración celular."
      },
      {
        question: "¿Qué diferencia el cloroplasto del citoplasma común?",
        options: [
          "Que realiza fotosíntesis captando la luz",
          "Que almacena el ADN celular principal",
          "Que no existe en plantas naturales",
          "Que carece de mitocondrias"
        ],
        correctIndex: 0,
        explanation: "Los cloroplastos son organelas presentes únicamente en células vegetales usadas para fijar carbono gracias a la luz del Sol."
      }
    ],
    attempts: []
  }
];

const INITIAL_SCHEDULES: ClassSchedule[] = [
  {
    id: "sched-1",
    subject: "Matemáticas",
    dayOfWeek: "Lunes",
    startTime: "08:00",
    endTime: "09:30",
    classroom: "Aula 4"
  },
  {
    id: "sched-2",
    subject: "Historia",
    dayOfWeek: "Lunes",
    startTime: "09:45",
    endTime: "11:15",
    classroom: "Aula B"
  },
  {
    id: "sched-3",
    subject: "Ciencias",
    dayOfWeek: "Martes",
    startTime: "08:00",
    endTime: "09:30",
    classroom: "Laboratorio"
  },
  {
    id: "sched-4",
    subject: "Literatura",
    dayOfWeek: "Miércoles",
    startTime: "10:30",
    endTime: "12:00",
    classroom: "Aula 2"
  },
  {
    id: "sched-5",
    subject: "Geografía",
    dayOfWeek: "Jueves",
    startTime: "08:00",
    endTime: "09:30",
    classroom: "Aula 1"
  },
  {
    id: "sched-6",
    subject: "Idiomas",
    dayOfWeek: "Viernes",
    startTime: "09:45",
    endTime: "11:15",
    classroom: "Gabinete"
  }
];

const INITIAL_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-1",
    subject: "Matemáticas",
    question: "¿Qué es el Teorema de Pitágoras?",
    answer: "En un triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos: a² + b² = c².",
    status: "review"
  },
  {
    id: "fc-2",
    subject: "Historia",
    question: "¿Cuándo se declaró la Independencia de la República Argentina?",
    answer: "El 9 de julio de 1816 en el histórico Congreso de Tucumán.",
    status: "learned"
  },
  {
    id: "fc-3",
    subject: "Ciencias",
    question: "¿Cuáles son los tres estados clásicos de la materia?",
    answer: "Sólido, líquido y gaseoso.",
    status: "review"
  }
];

const INITIAL_STUDY_NOTES: StudyNote[] = [
  {
    id: "note-1",
    subject: "Historia",
    title: "Causas de la Revolución de Mayo",
    content: "1. Invasiones Inglesas: Demostraron que el virreinato podía organizarse y defenderse por sí mismo, creando milicias criollas.\n2. Invasión napoleónica a España: Derrocamiento del rey Fernando VII, lo que generó un vacío de poder y la oportunidad de autogobierno criollo.\n3. Descontento comercial: Oposición al rígido monopolio comercial impuesto por la corona española.",
    createdAt: "2026-06-24"
  },
  {
    id: "note-2",
    subject: "Matemáticas",
    title: "Fórmula de Resolución Cuadrática",
    content: "Para resolver ax² + bx + c = 0:\nx = (-b ± √(b² - 4ac)) / (2a)\nEl discriminante (b² - 4ac) determina si hay dos soluciones reales distintas, una única solución doble, o raíces complejas imaginarias.",
    createdAt: "2026-06-24"
  }
];

const INITIAL_STUDY_GOALS: StudyGoal[] = [
  {
    id: "goal-1",
    title: "Estudiar con Pomodoro",
    type: "daily",
    targetValue: 2,
    currentValue: 1,
    unit: "horas",
    completed: false
  },
  {
    id: "goal-2",
    title: "Completar cuestionarios de autoevaluación",
    type: "weekly",
    targetValue: 3,
    currentValue: 1,
    unit: "cuestionarios",
    completed: false
  },
  {
    id: "goal-3",
    title: "Repasar Flashcards de estudio",
    type: "daily",
    targetValue: 15,
    currentValue: 5,
    unit: "tarjetas",
    completed: false
  }
];

const INITIAL_STUDY_CHECKLISTS: StudyChecklist[] = [
  {
    id: "check-1",
    title: "Preparación Examen de Álgebra",
    subject: "Matemáticas",
    items: [
      { id: "item-1", text: "Repasar ecuaciones de segundo grado y cuadráticas", completed: true },
      { id: "item-2", text: "Resolver guía de ejercicios prácticos de factorización", completed: false },
      { id: "item-3", text: "Hacer una autoevaluación simulada con IA", completed: false }
    ]
  }
];

export default function App() {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<"dashboard" | "tasks" | "calendar" | "reminders" | "study" | "schedule" | "grades" | "history" | "stats" | "achievements" | "studymode" | "admin">("dashboard");
  const [theme, setTheme] = useState<"claro" | "oscuro">(() => {
    const saved = localStorage.getItem("sp_theme");
    return (saved === "oscuro" || saved === "claro") ? saved : "claro";
  });

  // Firebase Auth states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, _setUserProfile] = useState<any | null>(null);
  const userProfileRef = useRef<any>(null);
  const setUserProfile = (val: any) => {
    userProfileRef.current = val;
    _setUserProfile(val);
  };
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    if (authLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [authLoading]);

  // Custom non-blocking modal confirmation dialog state
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isConfirm: boolean;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    isConfirm: false,
  });

  const showCustomAlert = (title: string, message: string) => {
    setDialog({
      isOpen: true,
      title,
      message,
      isConfirm: false,
    });
  };

  const showCustomConfirm = (title: string, message: string, onConfirm: () => void, confirmText = "Aceptar", cancelText = "Cancelar") => {
    setDialog({
      isOpen: true,
      title,
      message,
      isConfirm: true,
      confirmText,
      cancelText,
      onConfirm,
    });
  };

  const renderDialogModal = () => {
    if (!dialog.isOpen) return null;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-fade-in">
        <div className={`max-w-md w-full border-2 rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up ${
          theme === "oscuro"
            ? "bg-stone-900 border-stone-850 text-stone-100"
            : "bg-white border-amber-100 text-slate-800"
        }`}>
          <div className="space-y-1.5 text-left">
            <h3 className="font-display font-extrabold text-lg flex items-center gap-2 text-stone-900 dark:text-stone-100">
              {dialog.isConfirm ? (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              )}
              {dialog.title}
            </h3>
            <p className="text-sm text-stone-600 dark:text-stone-300 whitespace-pre-line leading-relaxed">
              {dialog.message}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            {dialog.isConfirm && (
              <button
                type="button"
                onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850 text-stone-600 dark:text-stone-400 cursor-pointer transition-colors"
              >
                {dialog.cancelText || "Cancelar"}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setDialog(prev => ({ ...prev, isOpen: false }));
                if (dialog.isConfirm && dialog.onConfirm) {
                  dialog.onConfirm();
                }
              }}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm cursor-pointer transition-colors"
            >
              {dialog.isConfirm ? (dialog.confirmText || "Aceptar") : "Entendido"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Application Data States (linked to Firestore)
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([]);
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [studyNotes, setStudyNotes] = useState<StudyNote[]>([]);
  const [studyGoals, setStudyGoals] = useState<StudyGoal[]>([]);
  const [studyChecklists, setStudyChecklists] = useState<StudyChecklist[]>([]);
  const [feynmanHistory, setFeynmanHistory] = useState<FeynmanExplanation[]>([]);
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [studySummaries, setStudySummaries] = useState<StudySummary[]>([]);
  const [subjectGrades, setSubjectGrades] = useState<SubjectGrade[]>([]);
  const [passingScore, setPassingScore] = useState<number>(6);
  const [pomodoroTotalMinutes, setPomodoroTotalMinutes] = useState<number>(0);
  const [pomodoroSessionsCount, setPomodoroSessionsCount] = useState<number>(0);

  // Sync theme
  useEffect(() => {
    localStorage.setItem("sp_theme", theme);
  }, [theme]);

  // Auth observer
  useEffect(() => {
    let timeoutId: any = null;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        // Safety timeout: if snapshot doesn't respond in 4 seconds, don't keep the screen frozen!
        timeoutId = setTimeout(() => {
          console.warn("Safety timeout triggered: Firebase took too long to load profile snapshot.");
          setAuthLoading(false);
        }, 4000);

        // Listen to user profile updates in real-time so approval state refreshes instantly!
        const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (timeoutId) clearTimeout(timeoutId);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.status !== "accepted") {
              // Auto-accept old pending/rejected accounts on the fly!
              const updatedProfile = {
                ...data,
                status: "accepted",
                acceptedAt: new Date().toISOString()
              };
              await setDoc(userDocRef, updatedProfile);
              setUserProfile(updatedProfile);
            } else {
              setUserProfile(data);
            }
            setAuthLoading(false);
          } else {
            // Document doesn't exist. Create it automatically as accepted!
            const isFirstOrAdmin = firebaseUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            const newUserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || "Estudiante",
              status: "accepted",
              isAdmin: isFirstOrAdmin,
              role: isFirstOrAdmin ? "admin" : "student",
              createdAt: serverTimestamp(),
              requestedAt: new Date().toISOString(),
              acceptedAt: new Date().toISOString(),
              notes: "Creado automáticamente de forma instantánea."
            };
            await setDoc(userDocRef, newUserProfile);
            setUserProfile(newUserProfile);
            setAuthLoading(false);
          }
        }, (err) => {
          if (timeoutId) clearTimeout(timeoutId);
          console.warn("Profile snapshot error:", err);
          setAuthLoading(false);
        });

        return () => {
          if (timeoutId) clearTimeout(timeoutId);
          unsubProfile();
        };
      } else {
        setUserProfile(null);
        setAuthLoading(false);
      }
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const userStatus = "accepted";

  // Real-time collections syncing
  useEffect(() => {
    if (!user || userStatus !== "accepted") return;

    console.log("Setting up Firestore dynamic subscriptions for user:", user.uid);

    // Categories checker to seed initial data for new students
    const checkAndSeedData = async () => {
      try {
        const categoriesSnap = await getDoc(doc(db, "categories", user.uid));
        if (!categoriesSnap.exists()) {
          await seedInitialDataToFirestore(user.uid);
        }
      } catch (err) {
        console.warn("Could not check categories or seed initial data (client might be offline or Firestore is not ready):", err);
      }
    };
    checkAndSeedData();

    // subscriptions
    const unsubscribes = [
      onSnapshot(query(collection(db, "tasks"), where("userId", "==", user.uid)), (snap) => {
        const items: Task[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as Task));
        setTasks(items);
      }, (err) => console.warn("Task subscription error:", err)),
      onSnapshot(query(collection(db, "events"), where("userId", "==", user.uid)), (snap) => {
        const items: CalendarEvent[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as CalendarEvent));
        setEvents(items);
      }, (err) => console.warn("Events subscription error:", err)),
      onSnapshot(query(collection(db, "reminders"), where("userId", "==", user.uid)), (snap) => {
        const items: Reminder[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as Reminder));
        setReminders(items);
      }, (err) => console.warn("Reminders subscription error:", err)),
      onSnapshot(query(collection(db, "study_materials"), where("userId", "==", user.uid)), (snap) => {
        const items: StudyMaterial[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as StudyMaterial));
        setStudyMaterials(items);
      }, (err) => console.warn("Study materials subscription error:", err)),
      onSnapshot(query(collection(db, "schedules"), where("userId", "==", user.uid)), (snap) => {
        const items: ClassSchedule[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as ClassSchedule));
        setSchedules(items);
      }, (err) => console.warn("Schedules subscription error:", err)),
      onSnapshot(query(collection(db, "flashcards"), where("userId", "==", user.uid)), (snap) => {
        const items: Flashcard[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as Flashcard));
        setFlashcards(items);
      }, (err) => console.warn("Flashcards subscription error:", err)),
      onSnapshot(query(collection(db, "study_notes"), where("userId", "==", user.uid)), (snap) => {
        const items: StudyNote[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as StudyNote));
        setStudyNotes(items);
      }, (err) => console.warn("Study notes subscription error:", err)),
      onSnapshot(query(collection(db, "study_goals"), where("userId", "==", user.uid)), (snap) => {
        const items: StudyGoal[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as StudyGoal));
        setStudyGoals(items);
      }, (err) => console.warn("Study goals subscription error:", err)),
      onSnapshot(query(collection(db, "study_checklists"), where("userId", "==", user.uid)), (snap) => {
        const items: StudyChecklist[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as StudyChecklist));
        setStudyChecklists(items);
      }, (err) => console.warn("Study checklists subscription error:", err)),
      onSnapshot(query(collection(db, "feynman_explanations"), where("userId", "==", user.uid)), (snap) => {
        const items: FeynmanExplanation[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as FeynmanExplanation));
        setFeynmanHistory(items);
      }, (err) => console.warn("Feynman subscription error:", err)),
      onSnapshot(query(collection(db, "mind_maps"), where("userId", "==", user.uid)), (snap) => {
        const items: MindMap[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as MindMap));
        setMindMaps(items);
      }, (err) => console.warn("Mind maps subscription error:", err)),
      onSnapshot(query(collection(db, "study_summaries"), where("userId", "==", user.uid)), (snap) => {
        const items: StudySummary[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as StudySummary));
        setStudySummaries(items);
      }, (err) => console.warn("Study summaries subscription error:", err)),
      onSnapshot(query(collection(db, "subject_grades"), where("userId", "==", user.uid)), (snap) => {
        const items: SubjectGrade[] = [];
        snap.forEach((d) => items.push({ ...d.data(), id: d.id } as SubjectGrade));
        setSubjectGrades(items);
      }, (err) => console.warn("Grades subscription error:", err)),
      onSnapshot(doc(db, "categories", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setCategories(docSnap.data().list);
        }
      }, (err) => console.warn("Categories subscription error:", err)),
      onSnapshot(doc(db, "passing_scores", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setPassingScore(docSnap.data().score);
        }
      }, (err) => console.warn("Passing scores subscription error:", err)),
      onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const udata = docSnap.data();
          if (udata.pomodoroTotalMinutes !== undefined) {
            setPomodoroTotalMinutes(udata.pomodoroTotalMinutes);
          }
          if (udata.pomodoroSessionsCount !== undefined) {
            setPomodoroSessionsCount(udata.pomodoroSessionsCount);
          }
        }
      })
    ];

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [user, userStatus]);

  // Browser notifications state and background checker
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const updatePermission = () => {
      setNotificationPermission(Notification.permission);
    };

    window.addEventListener("focus", updatePermission);
    return () => window.removeEventListener("focus", updatePermission);
  }, []);

  useEffect(() => {
    if (notificationPermission !== "granted" || reminders.length === 0) return;

    const checkAndSendNotifications = () => {
      const now = new Date();
      let notifiedIds: string[] = [];
      try {
        const stored = localStorage.getItem("notified_reminder_ids");
        if (stored) {
          notifiedIds = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Error reading notified_reminder_ids:", e);
      }

      let updatedNotifiedIds = [...notifiedIds];
      let hasNewNotifications = false;

      reminders.forEach((rem) => {
        if (rem.completed) return;

        const targetTime = new Date(rem.datetime);
        const diffMs = now.getTime() - targetTime.getTime();
        const diffMinutes = diffMs / (1000 * 60);

        // Notify if it's due in the past but not older than 120 minutes (2 hours)
        if (diffMinutes >= 0 && diffMinutes <= 120 && !notifiedIds.includes(rem.id)) {
          try {
            const notification = new Notification("📌 Recordatorio de StudyPlanner", {
              body: rem.title,
              icon: "/favicon.ico",
              tag: rem.id,
              requireInteraction: true,
            });

            notification.onclick = () => {
              window.focus();
              setActiveTab("reminders");
            };

            // Audio beep synthesis (Web Audio API)
            try {
              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = "sine";
              oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.15);

              setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.type = "sine";
                osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
                gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.25);
              }, 180);
            } catch (soundErr) {
              console.warn("Could not play notification sound:", soundErr);
            }
          } catch (err) {
            console.error("Failed to show desktop notification:", err);
          }

          updatedNotifiedIds.push(rem.id);
          hasNewNotifications = true;
        }
      });

      if (hasNewNotifications) {
        try {
          localStorage.setItem("notified_reminder_ids", JSON.stringify(updatedNotifiedIds));
        } catch (e) {
          console.error("Error saving notified_reminder_ids:", e);
        }
      }
    };

    checkAndSendNotifications();
    const interval = setInterval(checkAndSendNotifications, 20000);
    return () => clearInterval(interval);
  }, [reminders, notificationPermission]);

  const handleRequestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      showCustomAlert(
        "No Soportado",
        "Tu navegador no soporta la API de notificaciones de escritorio."
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") {
        showCustomAlert(
          "¡Notificaciones Activas! 🔔",
          "Te enviaremos una alerta de escritorio cada vez que se cumpla la hora de tus recordatorios guardados en Firebase."
        );
        new Notification("¡StudyPlanner Alertas Activas! 🎉", {
          body: "Las notificaciones en tiempo real para tus recordatorios de estudio están listas.",
          icon: "/favicon.ico"
        });
      } else if (permission === "denied") {
        showCustomAlert(
          "Notificaciones Bloqueadas",
          "Has denegado el permiso. Por favor, actívalas en la configuración de seguridad de tu navegador para recibir alertas."
        );
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    }
  };

  // Seeder helper for initial setup
  const seedInitialDataToFirestore = async (userId: string) => {
    try {
      console.log("Seeding onboarding template dataset for UID:", userId);
      const batch = writeBatch(db);

      // Categories
      batch.set(doc(db, "categories", userId), { userId, list: INITIAL_CATEGORIES });
      // Passing score
      batch.set(doc(db, "passing_scores", userId), { userId, score: 6 });

      // Lists
      INITIAL_TASKS.forEach((t) => batch.set(doc(db, "tasks", t.id), { ...t, userId }));
      INITIAL_EVENTS.forEach((e) => batch.set(doc(db, "events", e.id), { ...e, userId }));
      INITIAL_REMINDERS.forEach((r) => batch.set(doc(db, "reminders", r.id), { ...r, userId }));
      INITIAL_STUDY.forEach((m) => batch.set(doc(db, "study_materials", m.id), { ...m, userId }));
      INITIAL_SCHEDULES.forEach((s) => batch.set(doc(db, "schedules", s.id), { ...s, userId }));
      INITIAL_FLASHCARDS.forEach((f) => batch.set(doc(db, "flashcards", f.id), { ...f, userId }));
      INITIAL_STUDY_NOTES.forEach((n) => batch.set(doc(db, "study_notes", n.id), { ...n, userId }));
      INITIAL_STUDY_GOALS.forEach((g) => batch.set(doc(db, "study_goals", g.id), { ...g, userId }));
      INITIAL_STUDY_CHECKLISTS.forEach((c) => batch.set(doc(db, "study_checklists", c.id), { ...c, userId }));

      // Feynman & Maps
      const demoFeynman: FeynmanExplanation = {
        id: "fey-1",
        topic: "Leyes de Newton",
        explanation: "La primera ley dice que las cosas siguen haciendo lo que hacían a menos que las empujes. La segunda ley dice que empujar más fuerte acelera más rápido, y empujar más pesado acelera más lento (F=m.a). La tercera ley dice que si empujas algo, te empuja de vuelta con la misma fuerza.",
        difficulties: "Visualizar el rozamiento nulo en el espacio.",
        reviewConcepts: "Vectores, rozamiento estático.",
        createdAt: "2026-06-24"
      };
      batch.set(doc(db, "feynman_explanations", demoFeynman.id), { ...demoFeynman, userId });

      const demoMap: MindMap = {
        id: "map-1",
        title: "Sistema Solar",
        subject: "Ciencias",
        centralTopic: "El Sol",
        ideas: ["Mercurio (Caliente)", "Venus (Invernadero)", "Tierra (Agua)", "Marte (Hierro)", "Júpiter (Gas)"],
        createdAt: "2026-06-24"
      };
      batch.set(doc(db, "mind_maps", demoMap.id), { ...demoMap, userId });

      // Grades
      const demoGrades = [
        {
          id: "grade-demo-1",
          subject: "Matemáticas",
          grades: [
            { id: "g1", name: "Parcial 1", score: 8 },
            { id: "g2", name: "Trabajo Práctico 1", score: 7 },
            { id: "g3", name: "Lección Oral", score: 9 }
          ]
        },
        {
          id: "grade-demo-2",
          subject: "Historia",
          grades: [
            { id: "g4", name: "Ensayo Revolución", score: 5 },
            { id: "g5", name: "Examen Cuatrimestral", score: 7 }
          ]
        },
        {
          id: "grade-demo-3",
          subject: "Ciencias",
          grades: [
            { id: "g6", name: "Informe laboratorio", score: 4 },
            { id: "g7", name: "Maqueta Célula", score: 5 }
          ]
        }
      ];
      demoGrades.forEach((dg) => batch.set(doc(db, "subject_grades", dg.id), { ...dg, userId }));

      await batch.commit();
      console.log("Template dataset seeded successfully.");
    } catch (err) {
      console.error("Error seeding initial template data to Firestore:", err);
    }
  };

  // Firestore update generic syncing runner
  const syncCollection = async <T extends { id: string }>(
    colName: string,
    current: T[],
    next: T[]
  ) => {
    if (!user || userStatus !== "accepted") return;
    
    const addedOrUpdated = next.filter((item) => {
      const matched = current.find((x) => x.id === item.id);
      return !matched || JSON.stringify(matched) !== JSON.stringify(item);
    });

    const deleted = current.filter((item) => !next.some((x) => x.id === item.id));

    if (addedOrUpdated.length === 0 && deleted.length === 0) return;

    try {
      const batch = writeBatch(db);
      addedOrUpdated.forEach((item) => {
        batch.set(doc(db, colName, item.id), { ...item, userId: user.uid });
      });
      deleted.forEach((item) => {
        batch.delete(doc(db, colName, item.id));
      });
      await batch.commit();
    } catch (err) {
      console.error(`Error synchronizing collection ${colName}:`, err);
    }
  };

  const syncCategories = async (list: string[]) => {
    if (!user || userStatus !== "accepted") return;
    try {
      await setDoc(doc(db, "categories", user.uid), { userId: user.uid, list });
    } catch (err) {
      console.error("Error syncing categories:", err);
    }
  };

  const syncPassingScore = async (score: number) => {
    if (!user || userStatus !== "accepted") return;
    try {
      await setDoc(doc(db, "passing_scores", user.uid), { userId: user.uid, score });
    } catch (err) {
      console.error("Error syncing passing score:", err);
    }
  };

  // Sync wrappers factory
  const makeSyncHandler = <T extends { id: string }>(
    colName: string,
    state: T[],
    setter: (val: T[]) => void
  ) => {
    return (valOrFn: T[] | ((prev: T[]) => T[])) => {
      const next = typeof valOrFn === "function" ? valOrFn(state) : valOrFn;
      setter(next);
      syncCollection(colName, state, next);
    };
  };

  // Handlers
  const handleUpdateTasks = makeSyncHandler("tasks", tasks, setTasks);
  const handleUpdateEvents = makeSyncHandler("events", events, setEvents);
  const handleUpdateReminders = makeSyncHandler("reminders", reminders, setReminders);
  const handleUpdateStudyMaterials = makeSyncHandler("study_materials", studyMaterials, setStudyMaterials);
  const handleUpdateSchedules = makeSyncHandler("schedules", schedules, setSchedules);
  const handleUpdateFlashcards = makeSyncHandler("flashcards", flashcards, setFlashcards);
  const handleUpdateStudyNotes = makeSyncHandler("study_notes", studyNotes, setStudyNotes);
  const handleUpdateStudyGoals = makeSyncHandler("study_goals", studyGoals, setStudyGoals);
  const handleUpdateStudyChecklists = makeSyncHandler("study_checklists", studyChecklists, setStudyChecklists);
  const handleUpdateFeynmanHistory = makeSyncHandler("feynman_explanations", feynmanHistory, setFeynmanHistory);
  const handleUpdateMindMaps = makeSyncHandler("mind_maps", mindMaps, setMindMaps);
  const handleUpdateStudySummaries = makeSyncHandler("study_summaries", studySummaries, setStudySummaries);
  const handleUpdateSubjectGrades = makeSyncHandler("subject_grades", subjectGrades, setSubjectGrades);

  const handleUpdatePassingScore = (score: number) => {
    setPassingScore(score);
    syncPassingScore(score);
  };

  const handleUpdatePomodoroTotalMinutes = async (mins: number) => {
    setPomodoroTotalMinutes(mins);
    if (user && userStatus === "accepted") {
      try {
        await updateDoc(doc(db, "users", user.uid), { pomodoroTotalMinutes: mins });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleUpdatePomodoroSessionsCount = async (count: number) => {
    setPomodoroSessionsCount(count);
    if (user && userStatus === "accepted") {
      try {
        await updateDoc(doc(db, "users", user.uid), { pomodoroSessionsCount: count });
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) return;
    const nextList = [...categories, trimmed];
    setCategories(nextList);
    syncCategories(nextList);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const updatedCategories = categories.filter((c) => c !== catToDelete);
    let finalCategories = updatedCategories;
    if (updatedCategories.length === 0 || !updatedCategories.includes("Otros")) {
      finalCategories = [...updatedCategories.filter((c) => c !== "Otros"), "Otros"];
    }
    setCategories(finalCategories);
    syncCategories(finalCategories);

    const updatedTasks = tasks.map((t) => 
      t.category === catToDelete ? { ...t, category: "Otros" } : t
    );
    setTasks(updatedTasks);
    syncCollection("tasks", tasks, updatedTasks);
  };

  // Google Login popup
  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login popup failed:", err);
      let msg = "No se pudo iniciar sesión con Google. Intenta nuevamente.";
      if (err?.code === "auth/popup-closed-by-user") {
        msg = "Inicio de sesión cancelado o la pestaña de Google se cerró antes de completar el acceso.";
      } else if (err?.code === "auth/unauthorized-domain") {
        msg = "Este dominio de visualización no está autorizado en tu proyecto de Firebase. Por favor, asegúrate de añadir las URLs de AI Studio a los 'Dominios autorizados' en la configuración de Firebase Auth.";
      } else if (err?.code === "auth/popup-blocked") {
        msg = "El navegador bloqueó la ventana emergente de inicio de sesión de Google. Por favor, permite las ventanas emergentes para este sitio o intenta abrir la aplicación en una pestaña nueva.";
      }
      showCustomAlert("Error de Ingreso", msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign out
  const handleSignOut = () => {
    showCustomConfirm(
      "Cerrar Sesión",
      "¿Seguro que quieres cerrar sesión de tu perfil escolar?",
      async () => {
        try {
          await signOut(auth);
          setActiveTab("dashboard");
        } catch (err) {
          console.error("Sign out failed:", err);
          showCustomAlert("Error", "No se pudo cerrar la sesión.");
        }
      },
      "Cerrar Sesión",
      "Cancelar"
    );
  };

  // Restores demo schema
  const resetAllData = () => {
    showCustomConfirm(
      "Restaurar Agenda",
      "¿Seguro que quieres borrar todos tus datos y restaurar la agenda a los valores iniciales de demostración en la base de datos?",
      async () => {
        if (user && userStatus === "accepted") {
          try {
            const collectionsToClear = [
              "tasks", "events", "reminders", "study_materials", "schedules",
              "flashcards", "study_notes", "study_goals", "study_checklists",
              "feynman_explanations", "mind_maps", "study_summaries", "subject_grades"
            ];
            
            const batch = writeBatch(db);
            for (const col of collectionsToClear) {
              const snap = await getDocs(query(collection(db, col), where("userId", "==", user.uid)));
              snap.forEach((docSnap) => {
                batch.delete(docSnap.ref);
              });
            }
            await batch.commit();
            await seedInitialDataToFirestore(user.uid);
            showCustomAlert("Éxito", "¡Agenda restaurada exitosamente en la nube!");
          } catch (err) {
            console.error(err);
            showCustomAlert("Error", "Error al restaurar los datos en el servidor.");
          }
        }
        setActiveTab("dashboard");
      },
      "Restaurar Todo",
      "Cancelar"
    );
  };

  // Nav class builder
  const getTabClass = (
    tab: "dashboard" | "tasks" | "calendar" | "reminders" | "study" | "schedule" | "grades" | "history" | "stats" | "achievements" | "studymode" | "admin",
    borderColorClass: string,
    textLight: string,
    textDark: string,
    bgLight: string = "bg-white"
  ) => {
    const isActive = activeTab === tab;
    if (theme === "oscuro") {
      return `p-3 py-2.5 rounded-lg text-xs font-bold font-display transition-all duration-150 flex items-center gap-2 cursor-pointer w-full text-left whitespace-nowrap md:whitespace-normal ${
        isActive
          ? `bg-stone-800 ${textDark} border-l-4 ${borderColorClass} shadow-sm`
          : "text-stone-400 hover:bg-stone-800/60 hover:text-stone-200"
      }`;
    } else {
      return `p-3 py-2.5 rounded-lg text-xs font-bold font-display transition-all duration-150 flex items-center gap-2 cursor-pointer w-full text-left whitespace-nowrap md:whitespace-normal ${
        isActive
          ? `${bgLight} ${textLight} border-l-4 ${borderColorClass} shadow-sm`
          : "text-stone-600 hover:bg-stone-200/70"
      }`;
    }
  };

  // Counters
  const pendingTasksCount = tasks.filter((t) => !t.completed).length;
  const activeRemindersCount = reminders.filter((r) => !r.completed).length;

  // 1. LOADING SCREEN
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#faf6ee] dark:bg-stone-950 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-display font-bold text-lg text-amber-900 dark:text-amber-400">Cargando StudyPlanner...</p>
        <p className="text-xs text-stone-500 mt-1">Conectando con base de datos de Firebase</p>
        
        {loadingTimeout && (
          <div className="mt-8 p-6 bg-amber-50/80 dark:bg-stone-900/80 border-2 border-amber-200 dark:border-stone-800 rounded-2xl max-w-md text-left space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-amber-950 dark:text-amber-300 text-sm flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
              ¿Está tardando demasiado?
            </h3>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              Esto suele ocurrir si Firebase no está completamente configurado o si hay problemas de autorización. Por favor verifica:
            </p>
            <ul className="text-xs text-stone-600 dark:text-stone-400 list-disc list-inside space-y-1.5">
              <li>Haber agregado los dominios de AI Studio a <strong>Authorized Domains</strong> en Firebase Authentication.</li>
              <li>Haber activado el proveedor de <strong>Google Sign-In</strong> en Firebase Authentication.</li>
              <li>Haber inicializado tu base de datos Firestore en modo desarrollo o con reglas de lectura/escritura válidas.</li>
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => setAuthLoading(false)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors"
              >
                Omitir Espera (Ver Interfaz)
              </button>
              <button
                onClick={() => {
                  signOut(auth);
                  setAuthLoading(false);
                }}
                className="bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors"
              >
                Cerrar Sesión / Desconectar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. UNAUTHENTICATED SCREEN (Welcome / Google Auth Screen)
  if (!user) {
    return (
      <div className="min-h-screen bg-[#faf6ee] dark:bg-stone-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-stone-900 border-4 border-amber-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative rotate-1">
          {/* Visual Binder spiral ring decorative elements */}
          <div className="absolute -left-3.5 top-12 flex flex-col gap-4 select-none">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="w-6 h-4 bg-stone-300 dark:bg-stone-700 rounded-full border-r border-stone-400"></div>
            ))}
          </div>

          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg rotate-6 mx-auto transform hover:rotate-12 transition-transform duration-300">
              <span className="font-hand text-4xl text-white font-bold select-none">SP</span>
            </div>

            <div>
              <h2 className="font-display font-extrabold text-3xl text-amber-950 dark:text-amber-400 tracking-tight">StudyPlanner</h2>
              <p className="text-xs font-mono uppercase tracking-wider text-amber-800 dark:text-amber-500 mt-1">Tu Agenda Escolar Inteligente</p>
            </div>

            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              Organiza tus materias, tareas, horarios, saca promedios escolares y repasa usando simuladores de exámenes generados por Inteligencia Artificial.
            </p>

            <div className="border-t border-amber-100 dark:border-stone-800 pt-6">
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-4 font-mono">
                Ingreso inmediato y sincronizado en la nube.
              </p>
              <button
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className={`w-full flex items-center justify-center gap-3 bg-[#fdfbf6] dark:bg-stone-800 hover:bg-amber-50 dark:hover:bg-stone-750 text-amber-950 dark:text-amber-300 font-bold font-display py-3.5 px-4 rounded-xl border-2 border-amber-200 dark:border-stone-700 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-200 ${
                  isLoggingIn ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {isLoggingIn ? (
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 15.02 1 12 1 7.24 1 3.23 3.73 1.25 7.72l3.86 3C6.01 7.54 8.76 5.04 12 5.04z" />
                    <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.34H12v4.44h6.44c-.28 1.44-1.11 2.66-2.33 3.48v2.89h3.77c2.2-2.03 3.61-5.01 3.61-8.47z" />
                    <path fill="#FBBC05" d="M5.11 14.72c-.25-.72-.39-1.5-.39-2.31s.14-1.59.39-2.31l-3.86-3C.44 8.73 0 10.31 0 12s.44 3.27 1.25 4.89l3.86-3.17z" />
                    <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.77-2.89c-1.11.74-2.52 1.19-4.19 1.19-3.24 0-5.99-2.5-6.99-5.68l-3.86 3C3.23 20.27 7.24 23 12 23z" />
                  </svg>
                )}
                {isLoggingIn ? "Conectando con Google..." : "Ingresar con Google"}
              </button>
            </div>
          </div>
        </div>
        {renderDialogModal()}
      </div>
    );
  }

  // 3. MAIN APPLICATION VIEW
  return (
    <div className={`min-h-screen font-sans pb-12 transition-colors duration-200 ${
      theme === "oscuro" ? "bg-stone-950 text-stone-100" : "bg-[#faf6ee] text-slate-800"
    }`}>
      
      {/* HEADER: Estilo Cuaderno de un alumno */}
      <header className={`border-b-4 sticky top-0 z-40 shadow-sm transition-colors duration-200 ${
        theme === "oscuro"
          ? "border-amber-500 bg-stone-900/95 text-stone-100"
          : "border-amber-200 bg-white/95 text-slate-800"
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo y Nombre Principal */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center shadow-md rotate-2 transform select-none">
              <span className="font-hand text-3xl text-white font-bold">SP</span>
            </div>
            <div>
              <h1 className={`font-display font-bold text-2xl tracking-tight flex items-center gap-1.5 leading-none ${
                theme === "oscuro" ? "text-amber-400" : "text-amber-900"
              }`}>
                StudyPlanner
                <Sparkles className="w-4 h-4 text-amber-500" />
              </h1>
              <p className={`text-[11px] font-mono tracking-wider mt-1 uppercase select-none ${
                theme === "oscuro" ? "text-stone-400" : "text-stone-500"
              }`}>
                Agenda escolar & Inteligencia de repaso
              </p>
            </div>
          </div>

          {/* Header Actions: Tema, Perfil, Salida */}
          <div className="flex items-center gap-3.5 flex-wrap justify-center">
            
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "claro" ? "oscuro" : "claro")}
              className={`p-2 rounded-xl border transition-all duration-250 flex items-center justify-center cursor-pointer shadow-3sm hover:scale-105 active:scale-95 ${
                theme === "oscuro"
                  ? "bg-stone-850 border-stone-700 text-amber-400 hover:bg-stone-800"
                  : "bg-[#fdfbf6] border-amber-100 text-stone-600 hover:bg-amber-50"
              }`}
              title={theme === "oscuro" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {theme === "oscuro" ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>

            {/* Profile Avatar & Email */}
            <div className={`flex items-center gap-2 p-1.5 pr-3 border rounded-xl text-xs ${
              theme === "oscuro" ? "bg-stone-850 border-stone-800" : "bg-[#fdfbf6] border-amber-100"
            }`}>
              <img src={user.photoURL || ""} alt={user.displayName || ""} referrerPolicy="no-referrer" className="w-7 h-7 rounded-full border border-amber-300" />
              <div className="hidden sm:block text-left">
                <span className="font-bold block text-[11px] leading-tight text-stone-850 dark:text-stone-200">
                  {userProfile?.name || user.displayName}
                </span>
                <span className="text-[9px] text-stone-400 dark:text-stone-500 leading-none">
                  {userProfile?.isAdmin ? "Administrador" : "Estudiante"}
                </span>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className={`p-2 rounded-xl border transition-all duration-200 flex items-center justify-center cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/20 text-stone-400 hover:text-rose-600 ${
                theme === "oscuro" ? "bg-stone-850 border-stone-800" : "bg-[#fdfbf6] border-amber-100"
              }`}
              title="Cerrar Sesión"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>
      </header>

      {/* CUERPO PRINCIPAL DEL CUADERNO AGENDA */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 mt-6">
        
        {/* Binder / Carpeta de Anillas de Agendas Escolares */}
        <div className={`border-2 rounded-2xl shadow-xl overflow-hidden min-h-[580px] flex flex-col md:flex-row relative transition-colors duration-200 ${
          theme === "oscuro"
            ? "bg-stone-900 border-stone-850 text-stone-100"
            : "bg-white border-amber-100 text-slate-800"
        }`}>
          
          {/* Falso Lomo Metálico con Anillas de Carpeta a la Izquierda de Pantallas Medianas+ */}
          <div className="hidden md:flex flex-col justify-around absolute top-12 bottom-12 left-[196px] w-6 z-10 select-none">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <div key={num} className="h-6 w-8 binder-ring rounded-full -ml-[12px] flex items-center justify-center border-l border-t border-white"></div>
            ))}
          </div>

          {/* Menú de pestañas / Sección Separador de Carpeta (Columna Izquierda o Barra superior en móvil) */}
          <nav className={`w-full md:w-[196px] p-4 border-r flex-shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible transition-colors duration-200 ${
            theme === "oscuro" ? "bg-stone-950 border-stone-850" : "bg-stone-100 border-stone-200"
          }`}>
            
            <p className={`hidden md:block text-[10px] uppercase tracking-wider font-bold mb-4 px-2 select-none ${
              theme === "oscuro" ? "text-stone-500" : "text-stone-400"
            }`}>
              SEPARADORES TP
            </p>

            <button
              id="tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={getTabClass("dashboard", "border-l-amber-500", "text-amber-950", "text-amber-200")}
            >
              <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
              <span>Inicio</span>
            </button>

            <button
              id="tab-tasks"
              onClick={() => setActiveTab("tasks")}
              className={getTabClass("tasks", "border-l-amber-500", "text-amber-900", "text-amber-200", "bg-[#faf6ee]")}
            >
              <CheckSquare className="w-4 h-4 flex-shrink-0" />
              <span>Tareas y TPs</span>
            </button>

            <button
              id="tab-calendar"
              onClick={() => setActiveTab("calendar")}
              className={getTabClass("calendar", "border-l-indigo-500", "text-indigo-900", "text-indigo-300")}
            >
              <CalendarIcon className="w-4 h-4 flex-shrink-0" />
              <span>Calendario</span>
            </button>

            <button
              id="tab-schedule"
              onClick={() => setActiveTab("schedule")}
              className={getTabClass("schedule", "border-l-amber-600", "text-amber-900", "text-amber-200")}
            >
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Horario</span>
            </button>

            <button
              id="tab-grades"
              onClick={() => setActiveTab("grades")}
              className={getTabClass("grades", "border-l-indigo-650", "text-indigo-950", "text-indigo-350")}
            >
              <GraduationCap className="w-4 h-4 flex-shrink-0" />
              <span>Promedios</span>
            </button>

            <button
              id="tab-reminders"
              onClick={() => setActiveTab("reminders")}
              className={getTabClass("reminders", "border-l-sky-500", "text-sky-900", "text-sky-300")}
            >
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>Alertas</span>
            </button>

            <button
              id="tab-study"
              onClick={() => setActiveTab("study")}
              className={getTabClass("study", "border-l-emerald-500", "text-emerald-900", "text-emerald-300")}
            >
              <BookOpen className="w-4 h-4 flex-shrink-0" />
              <span>Examen IA</span>
            </button>

            <button
              id="tab-studymode"
              onClick={() => setActiveTab("studymode")}
              className={getTabClass("studymode", "border-l-rose-500", "text-rose-900", "text-rose-350", "bg-[#faf6ee]")}
            >
              <Sparkles className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span className="font-bold">Estudio Inteligente</span>
            </button>

            <button
              id="tab-history"
              onClick={() => setActiveTab("history")}
              className={getTabClass("history", "border-l-amber-550", "text-amber-950", "text-amber-200")}
            >
              <Archive className="w-4 h-4 flex-shrink-0" />
              <span>Historial</span>
            </button>

            <button
              id="tab-stats"
              onClick={() => setActiveTab("stats")}
              className={getTabClass("stats", "border-l-indigo-500", "text-indigo-900", "text-indigo-300")}
            >
              <BarChart3 className="w-4 h-4 flex-shrink-0" />
              <span>Estadísticas</span>
            </button>

            <button
              id="tab-achievements"
              onClick={() => setActiveTab("achievements")}
              className={getTabClass("achievements", "border-l-amber-500", "text-amber-900", "text-amber-200")}
            >
              <Trophy className="w-4 h-4 flex-shrink-0" />
              <span>Logros</span>
            </button>

            {/* Admin tab (Visible only to designated admins) */}
            {userProfile?.isAdmin ? (
              <div key="admin-divider" className={`hidden md:block border-t my-2 ${theme === "oscuro" ? "border-stone-800" : "border-stone-200/80"}`}></div>
            ) : null}
            {userProfile?.isAdmin ? (
              <button
                key="admin-tab-btn"
                id="tab-admin"
                onClick={() => setActiveTab("admin")}
                className={getTabClass("admin", "border-l-rose-600", "text-rose-900", "text-rose-300", "bg-rose-50/10")}
              >
                <UserCheck className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold text-rose-700 dark:text-rose-400">Invitaciones</span>
              </button>
            ) : null}

            <div className={`hidden md:block border-t my-2 ${theme === "oscuro" ? "border-stone-800" : "border-stone-200/80"}`}></div>

            <button
              onClick={resetAllData}
              className={`mt-auto hidden md:flex p-1.5 px-2 rounded transition-colors text-[10px] font-mono justify-center items-center gap-1 cursor-pointer ${
                theme === "oscuro"
                  ? "text-stone-500 hover:bg-stone-800 hover:text-stone-300"
                  : "text-stone-400 hover:bg-stone-200 hover:text-stone-600"
              }`}
              title="Restaurar todo a la demo escolar en Firebase"
            >
              <RefreshCw className="w-3 h-3 animate-spin hover:animate-none" /> Restaurar Agenda
            </button>
          </nav>

          {/* Área de Visualización y Contenido Hoja de Agenda (Columna Derecha) */}
          <div className={`flex-1 p-4 md:p-6 md:pl-10 relative transition-colors duration-200 ${
            theme === "oscuro" ? "bg-stone-900 text-stone-100" : "bg-white text-slate-800"
          }`}>
            
            {activeTab === "dashboard" && (
              <div id="section-dashboard" className="animate-fade-in">
                <DashboardSection
                  tasks={tasks}
                  events={events}
                  reminders={reminders}
                  categories={categories}
                  setActiveTab={setActiveTab}
                />
              </div>
            )}

            {activeTab === "tasks" && (
              <div id="section-tasks" className="animate-fade-in">
                <TaskSection
                  tasks={tasks}
                  onUpdateTasks={handleUpdateTasks}
                  categories={categories}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                />
              </div>
            )}

            {activeTab === "calendar" && (
              <div id="section-calendar" className="animate-fade-in">
                <CalendarSection events={events} onUpdateEvents={handleUpdateEvents} />
              </div>
            )}

            {activeTab === "schedule" && (
              <div id="section-schedule" className="animate-fade-in">
                <ScheduleSection
                  schedules={schedules}
                  onUpdateSchedules={handleUpdateSchedules}
                  categories={categories}
                />
              </div>
            )}

            {activeTab === "grades" && (
              <div id="section-grades" className="animate-fade-in">
                <GradesSection
                  categories={categories}
                  subjectGrades={subjectGrades}
                  onUpdateSubjectGrades={handleUpdateSubjectGrades}
                  passingScore={passingScore}
                  onUpdatePassingScore={handleUpdatePassingScore}
                />
              </div>
            )}

            {activeTab === "reminders" && (
              <div id="section-reminders" className="animate-fade-in">
                <ReminderSection
                  reminders={reminders}
                  onUpdateReminders={handleUpdateReminders}
                  notificationPermission={notificationPermission}
                  onRequestNotificationPermission={handleRequestNotificationPermission}
                />
              </div>
            )}

            {activeTab === "study" && (
              <div id="section-study" className="animate-fade-in">
                <StudyHelpSection studyMaterials={studyMaterials} onUpdateStudyMaterials={handleUpdateStudyMaterials} />
              </div>
            )}

            {activeTab === "studymode" && (
              <div id="section-studymode" className="animate-fade-in">
                <StudyModeSection
                  categories={categories}
                  studyMaterials={studyMaterials}
                  onUpdateStudyMaterials={handleUpdateStudyMaterials}
                  flashcards={flashcards}
                  onUpdateFlashcards={handleUpdateFlashcards}
                  studyNotes={studyNotes}
                  onUpdateStudyNotes={handleUpdateStudyNotes}
                  studyGoals={studyGoals}
                  onUpdateStudyGoals={handleUpdateStudyGoals}
                  studyChecklists={studyChecklists}
                  onUpdateStudyChecklists={handleUpdateStudyChecklists}
                  pomodoroTotalMinutes={pomodoroTotalMinutes}
                  onUpdatePomodoroTotalMinutes={handleUpdatePomodoroTotalMinutes}
                  pomodoroSessionsCount={pomodoroSessionsCount}
                  onUpdatePomodoroSessionsCount={handleUpdatePomodoroSessionsCount}
                  theme={theme}
                  feynmanHistory={feynmanHistory}
                  onUpdateFeynmanHistory={handleUpdateFeynmanHistory}
                  mindMaps={mindMaps}
                  onUpdateMindMaps={handleUpdateMindMaps}
                  studySummaries={studySummaries}
                  onUpdateStudySummaries={handleUpdateStudySummaries}
                />
              </div>
            )}

            {activeTab === "history" && (
              <div id="section-history" className="animate-fade-in">
                <HistorySection
                  tasks={tasks}
                  categories={categories}
                  onUpdateTasks={handleUpdateTasks}
                />
              </div>
            )}

            {activeTab === "stats" && (
              <div id="section-stats" className="animate-fade-in">
                <StatsSection
                  tasks={tasks}
                  events={events}
                  reminders={reminders}
                  studyMaterials={studyMaterials}
                  categories={categories}
                  flashcards={flashcards}
                  pomodoroTotalMinutes={pomodoroTotalMinutes}
                  pomodoroSessionsCount={pomodoroSessionsCount}
                />
              </div>
            )}

            {activeTab === "achievements" && (
              <div id="section-achievements" className="animate-fade-in">
                <AchievementsSection
                  tasks={tasks}
                  studyMaterials={studyMaterials}
                />
              </div>
            )}

            {activeTab === "admin" && userProfile?.isAdmin && (
              <div id="section-admin" className="animate-fade-in">
                <AdminSection theme={theme} />
              </div>
            )}

          </div>

        </div>

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-stone-400 dark:text-stone-500 text-[10px] font-mono gap-2 px-2 select-none">
          <div className="flex items-center gap-1">
            <span>Sesión activa como: {user.email}</span>
            {userProfile?.isAdmin ? (
              <span key="admin-tag-footer" className="bg-rose-950/20 text-rose-500 px-1 rounded border border-rose-900/30 font-bold">ADMIN</span>
            ) : null}
          </div>
          <div className="flex items-center gap-1 text-center sm:text-right">
            <span>Powered by Firebase Cloud Firestore & Google Auth</span>
            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
          </div>
        </div>

      </main>
      {renderDialogModal()}
    </div>
  );
}
