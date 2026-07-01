import React, { useState, useEffect, useRef } from "react";
import {
  Flashcard,
  StudyNote,
  StudyGoal,
  StudyChecklist,
  StudyChecklistItem,
  StudyMaterial,
  QuizQuestion,
  FeynmanExplanation,
  MindMap,
  StudyAttachment,
  StudySummary
} from "../types";
import StudyAttachmentUploader from "./StudyAttachmentUploader";
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  BookOpen,
  Layers,
  Sparkles,
  Trophy,
  Check,
  X,
  PlusCircle,
  Brain,
  HelpCircle,
  Eye,
  RotateCw,
  Notebook,
  AlertCircle,
  Network,
  FileText,
  Target,
  ChevronRight
} from "lucide-react";

interface StudyModeSectionProps {
  categories: string[];
  studyMaterials: StudyMaterial[];
  onUpdateStudyMaterials: (materials: StudyMaterial[]) => void;
  flashcards: Flashcard[];
  onUpdateFlashcards: (fc: Flashcard[]) => void;
  studyNotes: StudyNote[];
  onUpdateStudyNotes: (notes: StudyNote[]) => void;
  studyGoals: StudyGoal[];
  onUpdateStudyGoals: (goals: StudyGoal[]) => void;
  studyChecklists: StudyChecklist[];
  onUpdateStudyChecklists: (checklists: StudyChecklist[]) => void;
  pomodoroTotalMinutes: number;
  onUpdatePomodoroTotalMinutes: (mins: number) => void;
  pomodoroSessionsCount: number;
  onUpdatePomodoroSessionsCount: (count: number) => void;
  theme?: "claro" | "oscuro";
  feynmanHistory?: FeynmanExplanation[];
  onUpdateFeynmanHistory?: (feynman: FeynmanExplanation[]) => void;
  mindMaps?: MindMap[];
  onUpdateMindMaps?: (maps: MindMap[]) => void;
  studySummaries?: StudySummary[];
  onUpdateStudySummaries?: (summaries: StudySummary[]) => void;
}

type SubTab = "pomodoro" | "flashcards" | "evaluation" | "feynman" | "cornell" | "mindmaps" | "goals" | "checklists" | "resumenes";

export default function StudyModeSection({
  categories,
  studyMaterials,
  onUpdateStudyMaterials,
  flashcards,
  onUpdateFlashcards,
  studyNotes,
  onUpdateStudyNotes,
  studyGoals,
  onUpdateStudyGoals,
  studyChecklists,
  onUpdateStudyChecklists,
  pomodoroTotalMinutes,
  onUpdatePomodoroTotalMinutes,
  pomodoroSessionsCount,
  onUpdatePomodoroSessionsCount,
  theme = "claro",
  feynmanHistory: feynmanHistoryProp,
  onUpdateFeynmanHistory,
  mindMaps: mindMapsProp,
  onUpdateMindMaps,
  studySummaries: studySummariesProp,
  onUpdateStudySummaries
}: StudyModeSectionProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("pomodoro");

  // Helper date tools
  const getTodayDateString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const addDaysToToday = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  // ==========================================
  // 1. POMODORO TIMER STATE & LOGIC
  // ==========================================
  const [pomodoroWorkTime, setPomodoroWorkTime] = useState<number>(25);
  const [pomodoroBreakTime, setPomodoroBreakTime] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<"study" | "break">("study");
  const [pomodoroCompletedToday, setPomodoroCompletedToday] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isTimerRunning) {
      setTimeLeft(timerMode === "study" ? pomodoroWorkTime * 60 : pomodoroBreakTime * 60);
    }
  }, [pomodoroWorkTime, pomodoroBreakTime, timerMode, isTimerRunning]);

  useEffect(() => {
    if (isTimerRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (timerMode === "study") {
              onUpdatePomodoroSessionsCount(pomodoroSessionsCount + 1);
              onUpdatePomodoroTotalMinutes(pomodoroTotalMinutes + pomodoroWorkTime);
              setPomodoroCompletedToday(p => p + 1);
              // Update hours goal
              const updated = studyGoals.map(g => {
                if (g.unit === "horas") {
                  const val = parseFloat((g.currentValue + pomodoroWorkTime / 60).toFixed(2));
                  return { ...g, currentValue: val, completed: val >= g.targetValue };
                }
                return g;
              });
              onUpdateStudyGoals(updated);
              alert("🍅 ¡Excelente trabajo! Completaste tu sesión de estudio Pomodoro. ¡Hora de un descanso!");
              setTimerMode("break");
              return pomodoroBreakTime * 60;
            } else {
              alert("☕ ¡Terminó el descanso! Hora de volver a concentrarse.");
              setTimerMode("study");
              return pomodoroWorkTime * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTimerRunning, timerMode, pomodoroWorkTime, pomodoroBreakTime, pomodoroSessionsCount, pomodoroTotalMinutes, studyGoals]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // ==========================================
  // 2. FLASHCARDS CON SISTEMA LEITNER
  // ==========================================
  const [fcQuestion, setFcQuestion] = useState("");
  const [fcAnswer, setFcAnswer] = useState("");
  const [fcSubject, setFcSubject] = useState(categories[0] || "Matemáticas");
  const [fcFilterSubject, setFcFilterSubject] = useState<string>("all");
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [editingFcId, setEditingFcId] = useState<string | null>(null);
  const [fcAttachments, setFcAttachments] = useState<StudyAttachment[]>([]);

  // Leitner Practice Session States
  const [leitnerPracticeMode, setLeitnerPracticeMode] = useState<boolean>(false);
  const [practiceFilter, setPracticeFilter] = useState<"due" | "all">("due");
  const [practiceIndex, setPracticeIndex] = useState<number>(0);
  const [practiceFlipped, setPracticeFlipped] = useState<boolean>(false);

  const handleAddOrEditFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fcQuestion.trim() || !fcAnswer.trim()) return;

    if (editingFcId) {
      const updated = flashcards.map(fc => {
        if (fc.id === editingFcId) {
          return { ...fc, question: fcQuestion.trim(), answer: fcAnswer.trim(), subject: fcSubject, attachments: fcAttachments };
        }
        return fc;
      });
      onUpdateFlashcards(updated);
      setEditingFcId(null);
    } else {
      const newFc: Flashcard = {
        id: crypto.randomUUID(),
        subject: fcSubject,
        question: fcQuestion.trim(),
        answer: fcAnswer.trim(),
        status: "review",
        leitnerBox: 1,
        nextReviewDate: getTodayDateString(),
        attachments: fcAttachments
      };
      onUpdateFlashcards([newFc, ...flashcards]);
    }
    setFcQuestion("");
    setFcAnswer("");
    setFcAttachments([]);
  };

  const handleStartEditFc = (fc: Flashcard) => {
    setEditingFcId(fc.id);
    setFcQuestion(fc.question);
    setFcAnswer(fc.answer);
    setFcSubject(fc.subject);
    setFcAttachments(fc.attachments || []);
  };

  const handleDeleteFlashcard = (id: string) => {
    if (window.confirm("⚠️ ¿Estás seguro de que deseas eliminar permanentemente esta tarjeta de memoria?")) {
      onUpdateFlashcards(flashcards.filter(fc => fc.id !== id));
    }
  };

  const getDueFlashcards = () => {
    const today = getTodayDateString();
    return flashcards.filter(fc => !fc.nextReviewDate || fc.nextReviewDate <= today);
  };

  const getPracticePool = () => {
    if (practiceFilter === "due") {
      return getDueFlashcards();
    }
    return flashcards;
  };

  const handleLeitnerResult = (knewIt: boolean) => {
    const pool = getPracticePool();
    if (pool.length === 0) return;
    const currentCard = pool[practiceIndex];

    const updated = flashcards.map(fc => {
      if (fc.id === currentCard.id) {
        const currentBox = fc.leitnerBox || 1;
        let nextBox = currentBox;
        let days = 1;

        if (knewIt) {
          nextBox = Math.min(5, currentBox + 1);
          if (nextBox === 2) days = 2;
          else if (nextBox === 3) days = 4;
          else if (nextBox === 4) days = 7;
          else if (nextBox === 5) days = 14;
        } else {
          nextBox = 1; // Drop back to Box 1
          days = 1;
        }

        return {
          ...fc,
          leitnerBox: nextBox,
          status: nextBox === 5 ? ("learned" as const) : ("review" as const),
          nextReviewDate: addDaysToToday(days)
        };
      }
      return fc;
    });

    onUpdateFlashcards(updated);

    // Goal count update
    const updatedGoals = studyGoals.map(g => {
      if (g.unit === "tarjetas") {
        const val = g.currentValue + 1;
        return { ...g, currentValue: val, completed: val >= g.targetValue };
      }
      return g;
    });
    onUpdateStudyGoals(updatedGoals);

    setPracticeFlipped(false);
    if (practiceIndex < pool.length - 1) {
      setPracticeIndex(practiceIndex + 1);
    } else {
      alert("🎉 ¡Completaste tu sesión de práctica Leitner actual!");
      setLeitnerPracticeMode(false);
      setPracticeIndex(0);
    }
  };

  const boxCounts = [1, 2, 3, 4, 5].map(box => flashcards.filter(f => (f.leitnerBox || 1) === box).length);

  // ==========================================
  // 3. AUTOEVALUACION IA
  // ==========================================
  const [evalSelectedMaterialId, setEvalSelectedMaterialId] = useState<string>("");
  const [evalAnswers, setEvalAnswers] = useState<{ [key: number]: number }>({});
  const [evalSubmitted, setEvalSubmitted] = useState<boolean>(false);
  const [evalFinishedScore, setEvalFinishedScore] = useState<number | null>(null);
  const [evalActiveQuestionIndex, setEvalActiveQuestionIndex] = useState<number>(0);

  useEffect(() => {
    if (!evalSelectedMaterialId && studyMaterials.length > 0) {
      setEvalSelectedMaterialId(studyMaterials[0].id);
    }
  }, [studyMaterials, evalSelectedMaterialId]);

  const activeEvalMaterial = studyMaterials.find(m => m.id === evalSelectedMaterialId);

  const handleSelectEvalAnswer = (qIndex: number, oIndex: number) => {
    if (evalSubmitted) return;
    setEvalAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
  };

  const handleSubmitEvalQuiz = () => {
    if (!activeEvalMaterial) return;
    
    setEvalSubmitted(true);
    let correct = 0;
    activeEvalMaterial.questions.forEach((q, idx) => {
      if (evalAnswers[idx] === q.correctIndex) correct++;
    });

    const scorePct = Math.round((correct / activeEvalMaterial.questions.length) * 100);
    setEvalFinishedScore(scorePct);

    const newAttempt = {
      correctCount: correct,
      totalCount: activeEvalMaterial.questions.length,
      timestamp: new Date().toISOString(),
      answers: evalAnswers,
    };

    const updatedMaterials = studyMaterials.map(m => {
      if (m.id === activeEvalMaterial.id) {
        return { ...m, attempts: [newAttempt, ...m.attempts] };
      }
      return m;
    });
    onUpdateStudyMaterials(updatedMaterials);

    const updatedGoals = studyGoals.map(g => {
      if (g.unit === "cuestionarios") {
        const val = g.currentValue + 1;
        return { ...g, currentValue: val, completed: val >= g.targetValue };
      }
      return g;
    });
    onUpdateStudyGoals(updatedGoals);
  };

  const handleResetEvalQuiz = () => {
    setEvalAnswers({});
    setEvalSubmitted(false);
    setEvalFinishedScore(null);
    setEvalActiveQuestionIndex(0);
  };

  const MOCK_EVAL_MATERIAL: StudyMaterial = {
    id: "mock_eval_1",
    title: "Cuestionario de Hábitos de Estudio",
    text: "Preguntas básicas sobre organización escolar y técnicas de memorización activa.",
    questions: [
      {
        question: "¿Cuál es el beneficio primordial de la técnica Pomodoro?",
        options: [
          "Evitar por completo el estudio vespertino.",
          "Sostener la concentración profunda mediante intervalos estructurados y descansos.",
          "Aprender sin esfuerzo durmiendo inmediatamente.",
          "Obtener un promedio perfecto de forma mágica."
        ],
        correctIndex: 1,
        explanation: "La técnica Pomodoro sostiene la atención dividiendo el tiempo en bloques cortos con descansos regulados."
      },
      {
        question: "¿Cuál es el núcleo del Sistema Leitner para flashcards?",
        options: [
          "Organizar tarjetas por colores sin orden específico.",
          "Repasar las tarjetas difíciles con mayor frecuencia y promover las aprendidas a cajas superiores.",
          "Escribir resúmenes largos de capítulos enteros.",
          "Hacer mapas mentales únicamente."
        ],
        correctIndex: 1,
        explanation: "El sistema Leitner promueve las correctas y demota las difíciles, optimizando el tiempo de repaso."
      }
    ],
    attempts: []
  };

  const activeAssessmentSource = activeEvalMaterial || MOCK_EVAL_MATERIAL;

  // ==========================================
  // 4. TECNICA DE FEYNMAN
  // ==========================================
  const [feynmanTopic, setFeynmanTopic] = useState("");
  const [feynmanExplanation, setFeynmanExplanation] = useState("");
  const [feynmanDifficulties, setFeynmanDifficulties] = useState("");
  const [feynmanReviewConcepts, setFeynmanReviewConcepts] = useState("");
  const [feynmanSubject, setFeynmanSubject] = useState(categories[0] || "Matemáticas");
  const [feynmanAttachments, setFeynmanAttachments] = useState<StudyAttachment[]>([]);

  const [feynmanHistoryLocal, setFeynmanHistoryLocal] = useState<FeynmanExplanation[]>(() => {
    const saved = localStorage.getItem("sp_feynman_explanations");
    return saved ? JSON.parse(saved) : [];
  });
  const feynmanHistory = feynmanHistoryProp !== undefined ? feynmanHistoryProp : feynmanHistoryLocal;
  const setFeynmanHistory = onUpdateFeynmanHistory !== undefined ? onUpdateFeynmanHistory : setFeynmanHistoryLocal;

  useEffect(() => {
    if (feynmanHistoryProp === undefined) {
      localStorage.setItem("sp_feynman_explanations", JSON.stringify(feynmanHistory));
    }
  }, [feynmanHistory, feynmanHistoryProp]);

  const handleSaveFeynman = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feynmanTopic.trim() || !feynmanExplanation.trim()) return;

    const newExpl: FeynmanExplanation = {
      id: crypto.randomUUID(),
      topic: feynmanTopic.trim(),
      explanation: feynmanExplanation.trim(),
      difficulties: feynmanDifficulties.trim(),
      reviewConcepts: feynmanReviewConcepts.trim(),
      createdAt: getTodayDateString(),
      attachments: feynmanAttachments
    };

    setFeynmanHistory([newExpl, ...feynmanHistory]);
    setFeynmanTopic("");
    setFeynmanExplanation("");
    setFeynmanDifficulties("");
    setFeynmanReviewConcepts("");
    setFeynmanAttachments([]);
    alert("💡 ¡Explicación Feynman guardada con éxito! Revisa tu historial abajo.");
  };

  const handleDeleteFeynman = (id: string) => {
    if (window.confirm("⚠️ ¿Estás seguro de que deseas eliminar permanentemente esta explicación del método Feynman?")) {
      setFeynmanHistory(feynmanHistory.filter(f => f.id !== id));
    }
  };

  // ==========================================
  // 5. APUNTES METODO CORNELL
  // ==========================================
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteSubject, setNoteSubject] = useState(categories[0] || "Matemáticas");
  const [isCornell, setIsCornell] = useState<boolean>(false);
  const [noteKeywords, setNoteKeywords] = useState("");
  const [noteSummary, setNoteSummary] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteFilterSubject, setNoteFilterSubject] = useState<string>("all");
  const [selectedNoteForViewing, setSelectedNoteForViewing] = useState<StudyNote | null>(null);
  const [noteAttachments, setNoteAttachments] = useState<StudyAttachment[]>([]);

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    if (editingNoteId) {
      const updated = studyNotes.map(n => {
        if (n.id === editingNoteId) {
          return {
            ...n,
            title: noteTitle.trim(),
            content: noteContent.trim(),
            subject: noteSubject,
            isCornell,
            cornellKeywords: isCornell ? noteKeywords.trim() : "",
            cornellSummary: isCornell ? noteSummary.trim() : "",
            attachments: noteAttachments
          };
        }
        return n;
      });
      onUpdateStudyNotes(updated);
      setEditingNoteId(null);
    } else {
      const newNote: StudyNote = {
        id: crypto.randomUUID(),
        subject: noteSubject,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        createdAt: getTodayDateString(),
        isCornell,
        cornellKeywords: isCornell ? noteKeywords.trim() : "",
        cornellSummary: isCornell ? noteSummary.trim() : "",
        attachments: noteAttachments
      };
      onUpdateStudyNotes([newNote, ...studyNotes]);
    }

    setNoteTitle("");
    setNoteContent("");
    setNoteKeywords("");
    setNoteSummary("");
    setIsCornell(false);
    setNoteAttachments([]);
  };

  const handleStartEditNote = (note: StudyNote) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setNoteSubject(note.subject);
    setIsCornell(!!note.isCornell);
    setNoteKeywords(note.cornellKeywords || "");
    setNoteSummary(note.cornellSummary || "");
    setNoteAttachments(note.attachments || []);
    setSelectedNoteForViewing(null);
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm("⚠️ ¿Estás seguro de que deseas eliminar permanentemente este apunte? Esta acción no se puede deshacer para evitar pérdidas accidentales.")) {
      onUpdateStudyNotes(studyNotes.filter(n => n.id !== id));
      if (selectedNoteForViewing?.id === id) setSelectedNoteForViewing(null);
    }
  };

  const filteredNotes = noteFilterSubject === "all"
    ? studyNotes
    : studyNotes.filter(n => n.subject === noteFilterSubject);

  // ==========================================
  // 6. MAPAS MENTALES
  // ==========================================
  const [mindMapsLocal, setMindMapsLocal] = useState<MindMap[]>(() => {
    const saved = localStorage.getItem("sp_mind_maps");
    return saved ? JSON.parse(saved) : [
      {
        id: "map-1",
        title: "Sistema Solar",
        subject: "Ciencias",
        centralTopic: "El Sol",
        ideas: ["Mercurio (Caliente)", "Venus (Invernadero)", "Tierra (Agua)", "Marte (Hierro)", "Júpiter (Gas)"],
        createdAt: getTodayDateString()
      }
    ];
  });
  const mindMaps = mindMapsProp !== undefined ? mindMapsProp : mindMapsLocal;
  const setMindMaps = onUpdateMindMaps !== undefined ? onUpdateMindMaps : setMindMapsLocal;

  useEffect(() => {
    if (mindMapsProp === undefined) {
      localStorage.setItem("sp_mind_maps", JSON.stringify(mindMaps));
    }
  }, [mindMaps, mindMapsProp]);

  const [mapTitle, setMapTitle] = useState("");
  const [mapSubject, setMapSubject] = useState(categories[0] || "Matemáticas");
  const [mapCentralTopic, setMapCentralTopic] = useState("");
  const [activeMapId, setActiveMapId] = useState<string>("map-1");
  const [newIdeaText, setNewIdeaText] = useState("");
  const [mapAttachments, setMapAttachments] = useState<StudyAttachment[]>([]);
  const [extractedIdeas, setExtractedIdeas] = useState<string[]>([]);

  const handleCreateMindMap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapTitle.trim() || !mapCentralTopic.trim()) return;

    const newMap: MindMap = {
      id: crypto.randomUUID(),
      title: mapTitle.trim(),
      subject: mapSubject,
      centralTopic: mapCentralTopic.trim(),
      ideas: extractedIdeas.length > 0 ? extractedIdeas : [],
      createdAt: getTodayDateString(),
      attachments: mapAttachments
    };

    setMindMaps([newMap, ...mindMaps]);
    setActiveMapId(newMap.id);
    setMapTitle("");
    setMapCentralTopic("");
    setMapAttachments([]);
    setExtractedIdeas([]);
  };

  const handleAddIdeaToMap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIdeaText.trim()) return;

    const updated = mindMaps.map(m => {
      if (m.id === activeMapId) {
        return { ...m, ideas: [...m.ideas, newIdeaText.trim()] };
      }
      return m;
    });
    setMindMaps(updated);
    setNewIdeaText("");
  };

  const handleRemoveIdeaFromMap = (index: number) => {
    const updated = mindMaps.map(m => {
      if (m.id === activeMapId) {
        const copy = [...m.ideas];
        copy.splice(index, 1);
        return { ...m, ideas: copy };
      }
      return m;
    });
    setMindMaps(updated);
  };

  const handleDeleteMindMap = (id: string) => {
    if (window.confirm("⚠️ ¿Estás seguro de que deseas eliminar permanentemente este mapa mental?")) {
      const remaining = mindMaps.filter(m => m.id !== id);
      setMindMaps(remaining);
      if (activeMapId === id && remaining.length > 0) {
        setActiveMapId(remaining[0].id);
      }
    }
  };

  const activeMindMap = mindMaps.find(m => m.id === activeMapId);

  // ==========================================
  // 7. OBJETIVOS DE ESTUDIO STATE & LOGIC
  // ==========================================
  const [goalTitle, setGoalTitle] = useState("");
  const [goalType, setGoalType] = useState<"daily" | "weekly">("daily");
  const [goalTarget, setGoalTarget] = useState<number>(2);
  const [goalUnit, setGoalUnit] = useState<"horas" | "cuestionarios" | "tarjetas" | "actividades">("horas");

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim() || goalTarget <= 0) return;

    const newGoal: StudyGoal = {
      id: crypto.randomUUID(),
      title: goalTitle.trim(),
      type: goalType,
      targetValue: goalTarget,
      currentValue: 0,
      unit: goalUnit,
      completed: false
    };

    onUpdateStudyGoals([newGoal, ...studyGoals]);
    setGoalTitle("");
    setGoalTarget(2);
  };

  const handleIncrementGoal = (id: string, amount: number) => {
    const updated = studyGoals.map(g => {
      if (g.id === id) {
        const nextVal = parseFloat(Math.min(g.currentValue + amount, g.targetValue).toFixed(2));
        return { ...g, currentValue: nextVal, completed: nextVal >= g.targetValue };
      }
      return g;
    });
    onUpdateStudyGoals(updated);
  };

  const handleDeleteGoal = (id: string) => {
    if (window.confirm("⚠️ ¿Estás seguro de que deseas eliminar permanentemente este objetivo de estudio?")) {
      onUpdateStudyGoals(studyGoals.filter(g => g.id !== id));
    }
  };

  // ==========================================
  // 8. CHECKLIST DE ESTUDIO
  // ==========================================
  const [checklistTitle, setChecklistTitle] = useState("");
  const [checklistSubject, setChecklistSubject] = useState(categories[0] || "Matemáticas");
  const [newItemText, setNewItemText] = useState("");
  const [activeChecklistId, setActiveChecklistId] = useState<string>("");

  useEffect(() => {
    if (!activeChecklistId && studyChecklists.length > 0) {
      setActiveChecklistId(studyChecklists[0].id);
    }
  }, [studyChecklists, activeChecklistId]);

  const handleCreateChecklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checklistTitle.trim()) return;

    const newList: StudyChecklist = {
      id: crypto.randomUUID(),
      title: checklistTitle.trim(),
      subject: checklistSubject,
      items: []
    };

    onUpdateStudyChecklists([newList, ...studyChecklists]);
    setActiveChecklistId(newList.id);
    setChecklistTitle("");
  };

  const handleDeleteChecklist = (id: string) => {
    if (window.confirm("⚠️ ¿Estás seguro de que deseas eliminar permanentemente esta lista de estudio?")) {
      onUpdateStudyChecklists(studyChecklists.filter(cl => cl.id !== id));
      if (activeChecklistId === id) setActiveChecklistId("");
    }
  };

  const handleAddChecklistItem = (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const updated = studyChecklists.map(cl => {
      if (cl.id === listId) {
        const newItem: StudyChecklistItem = {
          id: crypto.randomUUID(),
          text: newItemText.trim(),
          completed: false
        };
        return { ...cl, items: [...cl.items, newItem] };
      }
      return cl;
    });

    onUpdateStudyChecklists(updated);
    setNewItemText("");
  };

  const handleToggleChecklistItem = (listId: string, itemId: string) => {
    const updated = studyChecklists.map(cl => {
      if (cl.id === listId) {
        return {
          ...cl,
          items: cl.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
        };
      }
      return cl;
    });
    onUpdateStudyChecklists(updated);
  };

  const handleDeleteChecklistItem = (listId: string, itemId: string) => {
    if (window.confirm("⚠️ ¿Estás seguro de que deseas eliminar permanentemente este elemento de la lista?")) {
      const updated = studyChecklists.map(cl => {
        if (cl.id === listId) {
          return { ...cl, items: cl.items.filter(item => item.id !== itemId) };
        }
        return cl;
      });
      onUpdateStudyChecklists(updated);
    }
  };

  // ==========================================
  // 9. BIBLIOTECA DE RESÚMENES POR MATERIA
  // ==========================================
  const [studySummariesLocal, setStudySummariesLocal] = useState<StudySummary[]>(() => {
    const saved = localStorage.getItem("sp_study_summaries");
    return saved ? JSON.parse(saved) : [];
  });
  const studySummaries = studySummariesProp !== undefined ? studySummariesProp : studySummariesLocal;
  const setStudySummaries = onUpdateStudySummaries !== undefined ? onUpdateStudySummaries : setStudySummariesLocal;

  const [summaryTitle, setSummaryTitle] = useState("");
  const [summarySubject, setSummarySubject] = useState(categories[0] || "Matemáticas");
  const [summaryContent, setSummaryContent] = useState("");
  const [summaryAttachments, setSummaryAttachments] = useState<StudyAttachment[]>([]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>("all");
  const [activeSummaryId, setActiveSummaryId] = useState<string | null>(null);

  useEffect(() => {
    if (studySummariesProp === undefined) {
      localStorage.setItem("sp_study_summaries", JSON.stringify(studySummaries));
    }
  }, [studySummaries, studySummariesProp]);

  const handleCreateSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summaryTitle.trim() || !summaryContent.trim()) {
      alert("⚠️ Por favor ingresá un título y el contenido del resumen.");
      return;
    }

    const newSummary: StudySummary = {
      id: crypto.randomUUID(),
      title: summaryTitle.trim(),
      subject: summarySubject,
      content: summaryContent.trim(),
      createdAt: getTodayDateString(),
      attachments: summaryAttachments
    };

    setStudySummaries([newSummary, ...studySummaries]);
    setSummaryTitle("");
    setSummaryContent("");
    setSummaryAttachments([]);
    setActiveSummaryId(newSummary.id);
    alert("📚 ¡Resumen guardado con éxito!");
  };

  const handleDeleteSummary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("⚠️ ¿Estás seguro de que deseas eliminar permanentemente este resumen? Esta acción no se puede deshacer para evitar pérdidas accidentales.")) {
      const updated = studySummaries.filter(s => s.id !== id);
      setStudySummaries(updated);
      if (activeSummaryId === id) {
        setActiveSummaryId(updated.length > 0 ? updated[0].id : null);
      }
    }
  };

  const activeChecklist = studyChecklists.find(cl => cl.id === activeChecklistId);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className={`rounded-2xl p-5 shadow-2sm relative overflow-hidden border transition-colors duration-200 ${
        theme === "oscuro"
          ? "bg-stone-900 border-amber-800 text-stone-100"
          : "bg-[#faf6ee] border-[#f5e3ca] text-slate-800"
      }`}>
        <div className="absolute right-0 top-0 w-32 h-32 bg-amber-200/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-3 mt-1">
          <div className={`p-2.5 rounded-xl ${
            theme === "oscuro" ? "bg-rose-950/50 text-rose-300" : "bg-rose-100 text-rose-800"
          }`}>
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h2 className={`text-lg font-black font-display transition-colors duration-200 ${
              theme === "oscuro" ? "text-amber-400" : "text-stone-850"
            }`}>Modo de Estudio Activo</h2>
            <p className={`text-xs transition-colors duration-200 ${
              theme === "oscuro" ? "text-stone-300" : "text-stone-500"
            }`}>
              Métodos e instrumentos de memorización activa, apuntes jerárquicos y autoevaluación inteligente.
            </p>
          </div>
        </div>
      </div>

      {/* SUB TABS NAV */}
      <div className={`flex flex-wrap gap-1 p-1 rounded-xl max-w-full overflow-x-auto border transition-colors duration-200 ${
        theme === "oscuro"
          ? "bg-stone-950 border-stone-850"
          : "bg-stone-100 border-stone-200/70"
      }`}>
        {(["pomodoro", "flashcards", "evaluation", "feynman", "cornell", "mindmaps", "goals", "checklists", "resumenes"] as const).map((tab) => {
          const tabLabelMap: { [key: string]: string } = {
            pomodoro: "🍅 Pomodoro",
            flashcards: "🃏 Leitner Flashcards",
            evaluation: "🧠 Autoevaluación IA",
            feynman: "💡 Feynman",
            cornell: "📖 Cornell Apuntes",
            mindmaps: "🌿 Mapas Mentales",
            goals: "🎯 Metas de Estudio",
            checklists: "📋 Checklists",
            resumenes: "📚 Resúmenes de Materia"
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`px-3 py-1.8 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                activeSubTab === tab
                  ? theme === "oscuro"
                    ? "bg-stone-800 text-amber-400 shadow-3sm border border-stone-700"
                    : "bg-white text-stone-850 shadow-3sm border border-stone-200/50"
                  : theme === "oscuro"
                    ? "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-50/75"
              }`}
            >
              {tabLabelMap[tab]}
            </button>
          );
        })}
      </div>

      {/* SUB TAB PANELS */}
      <div className={`border rounded-2xl p-5 min-h-[350px] shadow-sm transition-colors duration-200 ${
        theme === "oscuro"
          ? "bg-stone-950 border-stone-850 text-stone-100"
          : "bg-white border-stone-200 text-slate-800"
      }`}>
        
        {/* 1. POMODORO TIMER PANEL */}
        {activeSubTab === "pomodoro" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 flex flex-col items-center justify-center p-4">
              <div className={`relative w-56 h-56 rounded-full border-8 flex flex-col items-center justify-center transition-all duration-300 ${
                timerMode === "study"
                  ? theme === "oscuro" ? "border-rose-950/50 bg-rose-950/10" : "border-rose-100 bg-rose-50/20"
                  : theme === "oscuro" ? "border-emerald-950/50 bg-emerald-950/10" : "border-emerald-100 bg-emerald-50/20"
              }`}>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  timerMode === "study"
                    ? theme === "oscuro" ? "bg-rose-900/40 text-rose-300" : "bg-rose-100 text-rose-700"
                    : theme === "oscuro" ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700"
                }`}>
                  {timerMode === "study" ? "Estudio 🍅" : "Descanso ☕"}
                </span>
                <h3 className={`text-4xl font-black font-mono tracking-tighter mt-3 ${
                  theme === "oscuro" ? "text-stone-100" : "text-stone-850"
                }`}>
                  {formatTime(timeLeft)}
                </h3>
                <p className={`text-[10px] font-bold mt-2 ${
                  theme === "oscuro" ? "text-stone-400" : "text-stone-400"
                }`}>
                  Hoy: {pomodoroCompletedToday} sesiones
                </p>
                {isTimerRunning && (
                  <div className={`absolute inset-0 rounded-full border-2 animate-ping opacity-10 pointer-events-none ${
                    timerMode === "study" ? "border-rose-500" : "border-emerald-500"
                  }`}></div>
                )}
              </div>

              <div className="flex items-center gap-2 mt-5">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isTimerRunning
                      ? theme === "oscuro"
                        ? "bg-stone-800 text-amber-400 border border-stone-700"
                        : "bg-amber-100 text-amber-900 border border-amber-200"
                      : "bg-rose-600 hover:bg-rose-700 text-white"
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                  {isTimerRunning ? "Pausar" : "Comenzar"}
                </button>
                <button
                  onClick={() => { setIsTimerRunning(false); setTimerMode("study"); setTimeLeft(pomodoroWorkTime * 60); }}
                  className={`p-2 rounded-full transition border ${
                    theme === "oscuro"
                      ? "bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-200"
                      : "bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-600"
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className={`md:col-span-5 space-y-4 border rounded-xl p-4 transition-colors duration-200 ${
              theme === "oscuro"
                ? "bg-stone-900 border-stone-800"
                : "bg-stone-50/80 border-stone-200"
            }`}>
              <h4 className={`text-xs font-bold uppercase tracking-wide ${
                theme === "oscuro" ? "text-amber-400" : "text-stone-700"
              }`}>Configurar Intervalos</h4>
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={`font-bold ${theme === "oscuro" ? "text-stone-300" : "text-stone-600"}`}>Tiempo de Estudio:</span>
                    <span className={`font-mono font-bold ${theme === "oscuro" ? "text-stone-100" : "text-stone-700"}`}>{pomodoroWorkTime} minutos</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={pomodoroWorkTime}
                    onChange={(e) => setPomodoroWorkTime(parseInt(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      theme === "oscuro" ? "bg-stone-800" : "bg-stone-200"
                    }`}
                    disabled={isTimerRunning}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={`font-bold ${theme === "oscuro" ? "text-stone-300" : "text-stone-600"}`}>Tiempo de Descanso:</span>
                    <span className={`font-mono font-bold ${theme === "oscuro" ? "text-stone-100" : "text-stone-700"}`}>{pomodoroBreakTime} minutos</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={pomodoroBreakTime}
                    onChange={(e) => setPomodoroBreakTime(parseInt(e.target.value))}
                    className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer ${
                      theme === "oscuro" ? "bg-stone-800" : "bg-stone-200"
                    }`}
                    disabled={isTimerRunning}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. FLASHCARDS CON SISTEMA LEITNER PANEL */}
        {activeSubTab === "flashcards" && (
          <div className="space-y-6">
            {/* Box Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-stone-50 p-4 border border-stone-200 rounded-xl">
              {[1, 2, 3, 4, 5].map((box, i) => {
                const colorMap = ["bg-red-50 text-red-700 border-red-200", "bg-orange-50 text-orange-700 border-orange-200", "bg-yellow-50 text-yellow-700 border-yellow-200", "bg-blue-50 text-blue-700 border-blue-200", "bg-emerald-50 text-emerald-700 border-emerald-200"];
                const labelMap = ["Diario (Caja 1)", "Cada 2 días (Caja 2)", "Cada 4 días (Caja 3)", "Cada 7 días (Caja 4)", "Graduado (Caja 5)"];
                return (
                  <div key={box} className={`p-2.5 border rounded-lg text-center ${colorMap[i]}`}>
                    <span className="text-[10px] font-bold block uppercase">{labelMap[i]}</span>
                    <span className="text-xl font-black">{boxCounts[i]}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 border-b border-stone-200 pb-3 justify-between items-center">
              <span className="text-xs font-bold text-stone-500">Sesión Leitner</span>
              <button
                onClick={() => {
                  setLeitnerPracticeMode(!leitnerPracticeMode);
                  setPracticeIndex(0);
                  setPracticeFlipped(false);
                }}
                className={`px-4 py-1.8 rounded-lg text-xs font-bold transition ${
                  leitnerPracticeMode ? "bg-amber-150 text-amber-900 border border-amber-300" : "bg-amber-600 hover:bg-amber-700 text-white"
                }`}
              >
                {leitnerPracticeMode ? "Volver a Mis Tarjetas" : "⚡ Iniciar Repaso Leitner"}
              </button>
            </div>

            {leitnerPracticeMode ? (
              /* LEITNER PRACTICE CAROUSEL MODE */
              <div className="max-w-xl mx-auto space-y-4">
                <div className="flex items-center justify-between">
                  <select
                    value={practiceFilter}
                    onChange={(e) => { setPracticeFilter(e.target.value as any); setPracticeIndex(0); setPracticeFlipped(false); }}
                    className="bg-white border border-stone-200 rounded-lg py-1 px-3 text-xs font-bold text-stone-700"
                  >
                    <option value="due">Tarjetas para Repasar Hoy ({getDueFlashcards().length})</option>
                    <option value="all">Todas las Tarjetas ({flashcards.length})</option>
                  </select>
                </div>

                {getPracticePool().length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-stone-200 rounded-xl">
                    <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-stone-700">¡Al día! No hay tarjetas pendientes para hoy.</p>
                    <p className="text-[11px] text-stone-400 mt-0.5">Puedes cambiar el filtro a "Todas las Tarjetas" para practicar sin límites.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-[#fffdf9] border-2 border-amber-200/70 rounded-2xl p-6 min-h-[160px] flex flex-col justify-between items-center relative text-center shadow-3sm">
                      <div className="flex justify-between w-full items-center">
                        <span className="text-[9px] font-black uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                          {getPracticePool()[practiceIndex]?.subject}
                        </span>
                        <span className="text-[9px] font-black uppercase text-amber-700">
                          Caja {getPracticePool()[practiceIndex]?.leitnerBox || 1}
                        </span>
                      </div>

                      <div className="my-5 flex-1 flex items-center justify-center">
                        {!practiceFlipped ? (
                          <h3 className="font-display font-bold text-sm text-stone-800 leading-normal px-2">
                            {getPracticePool()[practiceIndex]?.question}
                          </h3>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block">Respuesta:</span>
                            <p className="text-xs text-stone-700 font-bold px-2 italic leading-relaxed">
                              {getPracticePool()[practiceIndex]?.answer}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between w-full items-center border-t border-stone-100 pt-2">
                        <button
                          onClick={() => setPracticeFlipped(!practiceFlipped)}
                          className="text-[10px] text-stone-500 font-bold flex items-center gap-1 hover:text-stone-700"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                          {practiceFlipped ? "Ver Pregunta" : "Revelar Respuesta"}
                        </button>
                        <span className="text-[10px] font-mono font-bold text-stone-400">
                          {practiceIndex + 1} / {getPracticePool().length}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => handleLeitnerResult(false)}
                        className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-bold hover:bg-red-100 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> No la supe (Bajar a Caja 1)
                      </button>
                      <button
                        onClick={() => handleLeitnerResult(true)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> ¡La supe! (Subir Caja)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* CARD INDEX & DECK MANAGEMENT */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 bg-[#faf9f6] border border-stone-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider">
                    {editingFcId ? "Editar Tarjeta" : "Nueva Tarjeta de Estudio"}
                  </h4>
                  <form onSubmit={handleAddOrEditFlashcard} className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-stone-600">Pregunta (Frente):</label>
                      <textarea
                        rows={2}
                        value={fcQuestion}
                        onChange={(e) => setFcQuestion(e.target.value)}
                        placeholder="Pregunta o concepto clave..."
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-stone-600">Respuesta (Reverso):</label>
                      <textarea
                        rows={2}
                        value={fcAnswer}
                        onChange={(e) => setFcAnswer(e.target.value)}
                        placeholder="Respuesta analítica sintetizada..."
                        className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-stone-600">Materia:</label>
                      <select
                        value={fcSubject}
                        onChange={(e) => setFcSubject(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs text-stone-700 font-bold"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="pt-1">
                      <StudyAttachmentUploader
                        attachments={fcAttachments}
                        onChange={setFcAttachments}
                        onExtractContent={(text, meta) => {
                          setFcQuestion(`¿Qué es y qué importancia tiene ${meta.topic}?`);
                          setFcAnswer(meta.summary);
                        }}
                        theme={theme}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.8 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg transition"
                    >
                      {editingFcId ? "Guardar Cambios" : "Agregar Tarjeta"}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between bg-stone-50 p-2.5 border border-stone-200 rounded-xl">
                    <span className="text-[11px] font-bold text-stone-600">Filtrar por Materia:</span>
                    <select
                      value={fcFilterSubject}
                      onChange={(e) => setFcFilterSubject(e.target.value)}
                      className="bg-white border border-stone-200 rounded-lg py-1 px-3 text-xs text-stone-700 font-bold"
                    >
                      <option value="all">Todas las materias</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {flashcards.filter(f => fcFilterSubject === "all" || f.subject === fcFilterSubject).length === 0 ? (
                    <div className="p-12 text-center border border-dashed border-stone-200 rounded-xl">
                      <Layers className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-stone-500">No hay tarjetas registradas.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                      {flashcards.filter(f => fcFilterSubject === "all" || f.subject === fcFilterSubject).map((fc) => {
                        const isFlipped = flippedCardId === fc.id;
                        return (
                          <div
                            key={fc.id}
                            className="border bg-white border-stone-200 rounded-xl p-3 flex flex-col justify-between h-[130px] shadow-3sm hover:border-amber-200 transition-all"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex gap-1 items-center">
                                <span className="text-[9px] font-black uppercase bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded">
                                  {fc.subject}
                                </span>
                                {fc.attachments && fc.attachments.length > 0 && (
                                  <span className="text-[8px] font-black uppercase text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200 flex items-center gap-0.5" title="Tiene documentos adjuntos">
                                    📎 {fc.attachments.length}
                                  </span>
                                )}
                              </div>
                              <span className="text-[9px] font-bold text-amber-700">
                                Caja {fc.leitnerBox || 1} • Próximo: {fc.nextReviewDate || "Hoy"}
                              </span>
                            </div>

                            <div
                              onClick={() => setFlippedCardId(isFlipped ? null : fc.id)}
                              className="cursor-pointer flex-1 flex items-center justify-center text-center select-none py-1"
                            >
                              {!isFlipped ? (
                                <p className="text-xs font-bold text-stone-800 line-clamp-2">{fc.question}</p>
                              ) : (
                                <p className="text-xs text-stone-600 font-medium italic line-clamp-2">{fc.answer}</p>
                              )}
                            </div>

                            <div className="flex justify-between items-center text-[9px] border-t border-stone-100 pt-2">
                              <span className="text-stone-400 font-bold">{isFlipped ? "Ver Pregunta ➜" : "Ver Respuesta ➜"}</span>
                              <div className="flex gap-2">
                                <button onClick={() => handleStartEditFc(fc)} className="text-stone-400 hover:text-amber-700"><Edit2 className="w-3 h-3" /></button>
                                <button onClick={() => handleDeleteFlashcard(fc.id)} className="text-stone-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. AUTOEVALUACION IA PANEL */}
        {activeSubTab === "evaluation" && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-stone-50 p-3.5 border border-stone-200 rounded-xl">
              <div>
                <span className="text-[10px] font-bold text-stone-400 uppercase">Evaluación Activa</span>
                <h4 className="text-xs font-bold text-stone-800 mt-0.5">{activeAssessmentSource.title}</h4>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <select
                  value={evalSelectedMaterialId}
                  onChange={(e) => { setEvalSelectedMaterialId(e.target.value); handleResetEvalQuiz(); }}
                  className="bg-white border border-stone-200 rounded-lg py-1.5 px-3 text-xs font-bold text-stone-700"
                >
                  {studyMaterials.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                  {studyMaterials.length === 0 && (
                    <option value="mock_eval_1">Cuestionario de Diagnóstico (Defecto)</option>
                  )}
                </select>
                {(evalSubmitted || Object.keys(evalAnswers).length > 0) && (
                  <button
                    onClick={handleResetEvalQuiz}
                    className="px-3 py-1.5 bg-stone-100 border border-stone-200 text-stone-700 font-bold text-xs rounded-lg"
                  >
                    Reiniciar
                  </button>
                )}
              </div>
            </div>

            {evalSubmitted ? (
              /* RESULTS DASHBOARD */
              <div className="space-y-5">
                <div className="p-5 border border-emerald-200 bg-emerald-50/15 rounded-xl text-center max-w-md mx-auto space-y-1.5">
                  <Trophy className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-black text-emerald-950">¡Cuestionario Completado!</h4>
                  <div className="text-3xl font-black text-stone-850">{evalFinishedScore}%</div>
                  <p className="text-xs text-stone-600">
                    Respondiste correctamente {activeAssessmentSource.questions.filter((q, i) => evalAnswers[i] === q.correctIndex).length} de {activeAssessmentSource.questions.length} preguntas.
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-stone-600 tracking-wider">Revisión de Respuestas</h4>
                  {activeAssessmentSource.questions.map((q, qIdx) => {
                    const isCorrect = evalAnswers[qIdx] === q.correctIndex;
                    return (
                      <div key={qIdx} className={`p-4 border rounded-xl space-y-2 ${isCorrect ? "bg-emerald-50/10 border-emerald-150" : "bg-red-50/10 border-red-150"}`}>
                        <div className="flex items-start gap-2 justify-between">
                          <h5 className="text-xs font-bold text-stone-800">{qIdx + 1}. {q.question}</h5>
                          {isCorrect ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">Correcta</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] font-bold rounded">Incorrecta</span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {q.options.map((opt, oIdx) => {
                            const wasSelected = evalAnswers[qIdx] === oIdx;
                            const isCorrectOpt = q.correctIndex === oIdx;
                            let style = "bg-white border-stone-200 text-stone-600";
                            if (wasSelected && isCorrectOpt) style = "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold";
                            else if (wasSelected && !isCorrectOpt) style = "bg-red-50 border-red-200 text-red-800 font-bold";
                            else if (isCorrectOpt) style = "bg-emerald-50 border-emerald-200 text-emerald-700";

                            return (
                              <div key={oIdx} className={`p-2 border rounded-lg flex items-center justify-between ${style}`}>
                                <span>{opt}</span>
                                {wasSelected && <span className="text-[9px] font-black uppercase">Tu Elección</span>}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[11px] text-stone-500 italic bg-stone-50 p-2 rounded border border-stone-150">
                          <strong>Explicación:</strong> {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ACTIVE QUIZ FORM: QUESTION-BY-QUESTION CARD DESIGN */
              <div className="max-w-xl mx-auto space-y-5">
                <div className="flex justify-between items-center text-xs text-stone-400 font-bold">
                  <span>PREGUNTA {evalActiveQuestionIndex + 1} DE {activeAssessmentSource.questions.length}</span>
                  <span className="font-mono">{Math.round(((evalActiveQuestionIndex + 1) / activeAssessmentSource.questions.length) * 100)}% Completado</span>
                </div>

                <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${((evalActiveQuestionIndex + 1) / activeAssessmentSource.questions.length) * 100}%` }}
                  ></div>
                </div>

                <div className="bg-[#fcfcfb] border border-stone-200 rounded-2xl p-6 space-y-4">
                  <h3 className="font-display font-bold text-sm text-stone-850">
                    {activeAssessmentSource.questions[evalActiveQuestionIndex]?.question}
                  </h3>

                  <div className="space-y-2">
                    {activeAssessmentSource.questions[evalActiveQuestionIndex]?.options.map((opt, oIdx) => {
                      const isSelected = evalAnswers[evalActiveQuestionIndex] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => handleSelectEvalAnswer(evalActiveQuestionIndex, oIdx)}
                          className={`w-full p-3 text-left text-xs font-bold rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50 border-emerald-500 text-emerald-900 shadow-3sm"
                              : "bg-white border-stone-200 hover:border-stone-300 text-stone-700"
                          }`}
                        >
                          <span>{opt}</span>
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-emerald-600 bg-emerald-600" : "border-stone-300"}`}>
                            {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setEvalActiveQuestionIndex(p => Math.max(0, p - 1))}
                    className="px-4 py-2 bg-stone-100 text-stone-750 font-bold text-xs rounded-lg hover:bg-stone-200 border border-stone-200 disabled:opacity-40"
                    disabled={evalActiveQuestionIndex === 0}
                  >
                    Atrás
                  </button>

                  {evalActiveQuestionIndex === activeAssessmentSource.questions.length - 1 ? (
                    <button
                      onClick={handleSubmitEvalQuiz}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
                    >
                      Finalizar y Calificar
                    </button>
                  ) : (
                    <button
                      onClick={() => setEvalActiveQuestionIndex(p => Math.min(activeAssessmentSource.questions.length - 1, p + 1))}
                      className="px-4 py-2 bg-stone-800 text-white font-bold text-xs rounded-lg hover:bg-stone-900 flex items-center gap-1"
                    >
                      Siguiente <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TECNICA DE FEYNMAN PANEL */}
        {activeSubTab === "feynman" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-[#faf9f6] border border-stone-200 rounded-xl p-4 space-y-3">
              <div>
                <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider">Explicar con Técnica Feynman</h4>
                <p className="text-[11px] text-stone-500 mt-1">
                  Explica un concepto complejo usando analogías sencillas y lenguaje coloquial (como si se lo enseñaras a un niño de 10 años).
                </p>
              </div>

              <form onSubmit={handleSaveFeynman} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Tema central:</label>
                    <input
                      type="text"
                      value={feynmanTopic}
                      onChange={(e) => setFeynmanTopic(e.target.value)}
                      placeholder="Ej: Fotosíntesis"
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Materia:</label>
                    <select
                      value={feynmanSubject}
                      onChange={(e) => setFeynmanSubject(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs text-stone-700 font-bold"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-stone-600">Tu Explicación Simple (Feynman):</label>
                  <textarea
                    rows={4}
                    value={feynmanExplanation}
                    onChange={(e) => setFeynmanExplanation(e.target.value)}
                    placeholder="La planta come luz del sol para fabricar azúcar usando el aire y agua..."
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    required
                  />
                </div>

                <div className="space-y-1 border-t border-stone-200 pt-2.5">
                  <span className="text-[10px] font-black uppercase text-stone-500 block mb-1">Preguntas de Reflexión</span>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[9px] font-bold text-stone-600 mb-0.5">¿Qué parte te resultó difícil explicar de forma simple?</label>
                      <input
                        type="text"
                        value={feynmanDifficulties}
                        onChange={(e) => setFeynmanDifficulties(e.target.value)}
                        placeholder="Explicar cómo funciona químicamente la clorofila..."
                        className="w-full px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-stone-600 mb-0.5">¿Qué conceptos o palabras clave deberías repasar?</label>
                      <input
                        type="text"
                        value={feynmanReviewConcepts}
                        onChange={(e) => setFeynmanReviewConcepts(e.target.value)}
                        placeholder="Fotones de luz, absorción celular, glucosa..."
                        className="w-full px-2 py-1 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <StudyAttachmentUploader
                    attachments={feynmanAttachments}
                    onChange={setFeynmanAttachments}
                    onExtractContent={(text, meta) => {
                      setFeynmanTopic(meta.topic);
                      setFeynmanExplanation(meta.explanation);
                      setFeynmanDifficulties(meta.difficulties);
                      setFeynmanReviewConcepts(meta.reviewConcepts);
                    }}
                    theme={theme}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-amber-850 hover:bg-amber-900 text-white font-bold text-xs rounded-lg transition shadow-sm cursor-pointer"
                >
                  Guardar Explicación Feynman
                </button>
              </form>
            </div>

            <div className="lg:col-span-6 space-y-3">
              <span className="text-[10px] font-black uppercase text-stone-500 block">Tus Explicaciones Guardadas</span>
              {feynmanHistory.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-stone-200 rounded-xl">
                  <Brain className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-stone-500">Historial vacío.</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">Sintetiza un tema a la izquierda para grabarlo aquí.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {feynmanHistory.map((item) => (
                    <div key={item.id} className="bg-white border border-stone-200 rounded-xl p-4 space-y-2.5 shadow-3sm relative">
                      <button
                        onClick={() => handleDeleteFeynman(item.id)}
                        className="absolute top-4 right-4 p-1 text-stone-400 hover:text-rose-600"
                        title="Eliminar explicación"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        <span className="text-[9px] font-black uppercase bg-stone-100 text-stone-500 px-1.5 py-0.2 rounded mr-1.5">Feynman</span>
                        <h4 className="inline text-xs font-black text-stone-850">{item.topic}</h4>
                        <span className="block text-[9px] text-stone-400 font-bold font-mono mt-0.5">Registrado: {item.createdAt}</span>
                      </div>

                      <p className="text-xs text-stone-600 leading-normal bg-stone-50/50 p-2.5 rounded border border-stone-150 italic whitespace-pre-wrap font-medium">
                        "{item.explanation}"
                      </p>

                      {item.attachments && item.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.attachments.map((file, fIdx) => (
                            <div key={fIdx} className="flex items-center gap-1 px-2 py-0.5 bg-rose-50 border border-rose-100 rounded text-[9px] font-bold text-rose-800">
                              <span>📎</span>
                              <span className="truncate max-w-[110px]" title={file.name}>{file.name}</span>
                              {file.type.startsWith("image/") && file.dataUrl && (
                                <img src={file.dataUrl} alt="mini-prev" className="w-4 h-4 object-cover rounded ml-0.5 border border-rose-200" referrerPolicy="no-referrer" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-stone-100 pt-2">
                        {item.difficulties && (
                          <div>
                            <span className="font-extrabold text-amber-900 block">Dificultad al explicar:</span>
                            <span className="text-stone-500 font-medium">{item.difficulties}</span>
                          </div>
                        )}
                        {item.reviewConcepts && (
                          <div>
                            <span className="font-extrabold text-rose-800 block">A repasar:</span>
                            <span className="text-stone-500 font-medium">{item.reviewConcepts}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. APUNTES METODO CORNELL PANEL */}
        {activeSubTab === "cornell" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-[#faf9f6] border border-stone-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider">
                  {editingNoteId ? "Editar Apunte Cornell" : "Crear Apunte / Cornell"}
                </h4>
                <div className="flex items-center gap-1.5 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  <input
                    type="checkbox"
                    id="cornellToggle"
                    checked={isCornell}
                    onChange={(e) => setIsCornell(e.target.checked)}
                    className="w-3.5 h-3.5 text-amber-600 rounded"
                  />
                  <label htmlFor="cornellToggle" className="text-[10px] font-black uppercase text-amber-900 cursor-pointer select-none">Cornell</label>
                </div>
              </div>

              <form onSubmit={handleSaveNote} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Título:</label>
                    <input
                      type="text"
                      placeholder="Ej: Apuntes de Termodinámica"
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Materia:</label>
                    <select
                      value={noteSubject}
                      onChange={(e) => setNoteSubject(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs text-stone-700 font-bold"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {isCornell ? (
                  <div className="space-y-2 border border-amber-200 rounded-xl p-3 bg-amber-50/10 space-y-2.5">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-amber-900">1. Palabras Clave / Preguntas:</label>
                      <textarea
                        rows={2}
                        value={noteKeywords}
                        onChange={(e) => setNoteKeywords(e.target.value)}
                        placeholder="Términos clave, preguntas guía, ideas cortas..."
                        className="w-full px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-amber-900">2. Notas de Clase (Área Principal):</label>
                      <textarea
                        rows={3}
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                        placeholder="Explicación detallada de fórmulas, leyes, esquemas..."
                        className="w-full px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-amber-900">3. Resumen Final:</label>
                      <textarea
                        rows={2}
                        value={noteSummary}
                        onChange={(e) => setNoteSummary(e.target.value)}
                        placeholder="La síntesis en tus propias palabras del tema general..."
                        className="w-full px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Contenido del Apunte:</label>
                    <textarea
                      rows={6}
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      placeholder="Escribe tus resúmenes de clase, teoremas o explicaciones completas..."
                      className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                )}

                <div className="pt-2">
                  <StudyAttachmentUploader
                    attachments={noteAttachments}
                    onChange={setNoteAttachments}
                    onExtractContent={(text, meta) => {
                      setNoteTitle(meta.topic);
                      setNoteContent(meta.explanation);
                      setNoteKeywords(meta.keywords || "");
                      setNoteSummary(meta.summary || "");
                    }}
                    theme={theme}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-1.8 bg-amber-850 hover:bg-amber-900 text-white font-bold text-xs rounded-lg transition"
                  >
                    {editingNoteId ? "Actualizar Apunte" : "Guardar Apunte"}
                  </button>
                  {editingNoteId && (
                    <button
                      type="button"
                      onClick={() => { setEditingNoteId(null); setNoteTitle(""); setNoteContent(""); setIsCornell(false); }}
                      className="px-3 bg-stone-100 text-stone-600 rounded-lg text-xs"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between bg-stone-50 p-2 border border-stone-200 rounded-xl">
                <span className="text-[11px] font-bold text-stone-600">Filtrar por Materia:</span>
                <select
                  value={noteFilterSubject}
                  onChange={(e) => setNoteFilterSubject(e.target.value)}
                  className="bg-white border border-stone-200 rounded-lg py-1 px-3 text-xs text-stone-700 font-bold"
                >
                  <option value="all">Todas las materias</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {selectedNoteForViewing ? (
                /* DETAILED VIEW IN CORNELL FORMAT GRID */
                <div className="bg-[#fcfbf9] border border-amber-200 rounded-2xl p-5 space-y-3 relative shadow-sm">
                  <button
                    onClick={() => setSelectedNoteForViewing(null)}
                    className="absolute top-4 right-4 p-1.5 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 mr-2">
                      {selectedNoteForViewing.subject}
                    </span>
                    {selectedNoteForViewing.isCornell && (
                      <span className="text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                        Método Cornell 📖
                      </span>
                    )}
                    <h3 className="font-display font-extrabold text-base text-stone-850 pt-1">
                      {selectedNoteForViewing.title}
                    </h3>
                    <p className="text-[10px] text-stone-400 font-bold font-mono">Registrado: {selectedNoteForViewing.createdAt}</p>
                  </div>

                  {selectedNoteForViewing.attachments && selectedNoteForViewing.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedNoteForViewing.attachments.map((file, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-bold text-amber-900">
                          <span>📎</span>
                          <span className="truncate max-w-[150px]" title={file.name}>{file.name}</span>
                          {file.type.startsWith("image/") && file.dataUrl && (
                            <img src={file.dataUrl} alt="mini-prev" className="w-5 h-5 object-cover rounded ml-1 border border-amber-300" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedNoteForViewing.isCornell ? (
                    <div className="space-y-3 mt-3">
                      {/* Grid Split */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 border border-stone-200 rounded-xl overflow-hidden">
                        {/* Left column (Palabras Clave) */}
                        <div className="md:col-span-4 bg-[#faf9f6] p-3 border-r border-stone-200">
                          <span className="text-[9px] font-black text-amber-900 uppercase block border-b border-stone-200 pb-1 mb-2">Palabras Clave / Preguntas</span>
                          <div className="text-xs font-bold text-stone-700 whitespace-pre-wrap leading-relaxed">{selectedNoteForViewing.cornellKeywords}</div>
                        </div>
                        {/* Right column (Notas de clase) */}
                        <div className="md:col-span-8 bg-white p-3">
                          <span className="text-[9px] font-black text-stone-400 uppercase block border-b border-stone-200/60 pb-1 mb-2">Notas Detalladas</span>
                          <div className="text-xs font-medium text-stone-800 whitespace-pre-wrap leading-relaxed">{selectedNoteForViewing.content}</div>
                        </div>
                      </div>
                      {/* Bottom row (Resumen final) */}
                      <div className="bg-amber-50/30 p-3.5 border border-amber-150 rounded-xl">
                        <span className="text-[9px] font-black text-amber-900 uppercase block border-b border-amber-200 pb-1 mb-2">Resumen de la sesión</span>
                        <p className="text-xs font-semibold text-stone-700 italic leading-relaxed whitespace-pre-wrap">
                          "{selectedNoteForViewing.cornellSummary}"
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-stone-200 pt-3 text-xs text-stone-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {selectedNoteForViewing.content}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2.5 justify-end">
                    <button
                      onClick={() => handleStartEditNote(selectedNoteForViewing)}
                      className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded hover:bg-amber-100 transition"
                    >
                      Editar apunte
                    </button>
                    <button
                      onClick={() => handleDeleteNote(selectedNoteForViewing.id)}
                      className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-150 px-3 py-1 rounded hover:bg-rose-100 transition"
                    >
                      Borrar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-1">
                  {filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => setSelectedNoteForViewing(note)}
                      className="bg-white border border-stone-200 rounded-xl p-3.5 hover:border-amber-200 hover:shadow-2sm transition cursor-pointer flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex gap-1 items-center">
                            <span className="text-[9px] font-black uppercase text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                              {note.subject}
                            </span>
                            {note.attachments && note.attachments.length > 0 && (
                              <span className="text-[8px] font-black uppercase text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 flex items-center gap-0.5">
                                📎 {note.attachments.length}
                              </span>
                            )}
                          </div>
                          {note.isCornell && (
                            <span className="text-[8px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                              Cornell
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-stone-850 truncate">{note.title}</h4>
                        <p className="text-[11px] text-stone-500 leading-normal line-clamp-2 mt-1">
                          {note.isCornell ? note.cornellSummary : note.content}
                        </p>
                      </div>
                      <span className="text-[9px] text-stone-400 font-bold hover:text-stone-700 block text-right">Consultar apunte completo ➜</span>
                    </div>
                  ))}
                  {filteredNotes.length === 0 && (
                    <div className="p-12 text-center border border-dashed border-stone-200 rounded-xl col-span-2">
                      <Notebook className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                      <p className="text-xs font-bold text-stone-500">No hay apuntes cargados.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. MAPAS MENTALES PANEL */}
        {activeSubTab === "mindmaps" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create & selector lists */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#faf9f6] border border-stone-200 rounded-xl p-4 space-y-3">
                <h4 className="text-xs font-black uppercase text-[#1e1b4b] tracking-wider">Crear Mapa Mental</h4>
                <form onSubmit={handleCreateMindMap} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Título del mapa:</label>
                    <input
                      type="text"
                      placeholder="Ej: Biología Celular"
                      value={mapTitle}
                      onChange={(e) => setMapTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Tema central:</label>
                    <input
                      type="text"
                      placeholder="Ej: La Célula"
                      value={mapCentralTopic}
                      onChange={(e) => setMapCentralTopic(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Materia:</label>
                    <select
                      value={mapSubject}
                      onChange={(e) => setMapSubject(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs text-stone-700 font-bold"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pt-2">
                    <StudyAttachmentUploader
                      attachments={mapAttachments}
                      onChange={setMapAttachments}
                      onExtractContent={(text, meta) => {
                        setMapTitle(meta.topic);
                        setMapCentralTopic(meta.topic);
                        if (meta.ideas && meta.ideas.length > 0) {
                          setExtractedIdeas(meta.ideas);
                        } else {
                          // fallback ideas from keywords
                          setExtractedIdeas(meta.keywords ? meta.keywords.split(",").map(k => k.trim()) : []);
                        }
                      }}
                      theme={theme}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.8 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-lg transition"
                  >
                    Iniciar Mapa Mental
                  </button>
                </form>
              </div>

              {/* Saved Mind Maps Indexes */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-stone-500 block">Tus Mapas Mentales</span>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {mindMaps.map(m => (
                    <div
                      key={m.id}
                      onClick={() => setActiveMapId(m.id)}
                      className={`p-2 px-3 border rounded-lg flex items-center justify-between text-xs font-medium cursor-pointer transition ${
                        activeMapId === m.id
                          ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-bold"
                          : "bg-white border-stone-200 hover:border-indigo-200 text-stone-700"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="truncate block font-bold text-stone-850">{m.title}</span>
                          {m.attachments && m.attachments.length > 0 && (
                            <span className="text-[8px] font-black uppercase text-indigo-700 bg-indigo-50 px-1 py-0.1 rounded border border-indigo-200">
                              📎 {m.attachments.length}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-stone-400 block font-bold uppercase">{m.subject} • {m.ideas.length} ideas</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMindMap(m.id); }}
                        className="p-1 text-stone-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas display panel */}
            <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl p-4 flex flex-col justify-between">
              {activeMindMap ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <div>
                      <span className="text-[9px] font-black uppercase bg-indigo-100 text-indigo-800 px-1.8 py-0.2 rounded mr-2">
                        {activeMindMap.subject}
                      </span>
                      <h4 className="inline text-xs font-bold text-stone-850">{activeMindMap.title}</h4>
                    </div>
                  </div>

                  {activeMindMap.attachments && activeMindMap.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1 border-b border-stone-100 pb-2">
                      {activeMindMap.attachments.map((file, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 rounded text-[9px] font-bold text-indigo-800">
                          <span>📎</span>
                          <span className="truncate max-w-[120px]" title={file.name}>{file.name}</span>
                          {file.type.startsWith("image/") && file.dataUrl && (
                            <img src={file.dataUrl} alt="mini-prev" className="w-4 h-4 object-cover rounded ml-0.5 border border-indigo-200" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Dynamic Concept Node Adder */}
                  <form onSubmit={handleAddIdeaToMap} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: Mitocondria (Energía)"
                      value={newIdeaText}
                      onChange={(e) => setNewIdeaText(e.target.value)}
                      className="flex-1 px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 bg-indigo-900 hover:bg-indigo-950 text-white font-bold text-xs rounded-lg transition"
                    >
                      Agregar Concepto
                    </button>
                  </form>

                  {/* VISUAL CANVAS WRAPPER */}
                  <div className="overflow-x-auto py-1">
                    <div className="relative w-[480px] h-[280px] bg-stone-50 border border-stone-200 rounded-xl overflow-hidden shadow-inner mx-auto">
                      {/* SVG CONNECTIONS */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none">
                        {activeMindMap.ideas.map((_, idx) => {
                          const angle = (idx * 2 * Math.PI) / activeMindMap.ideas.length;
                          const r = 90;
                          const nodeX = 240 + Math.cos(angle) * r;
                          const nodeY = 140 + Math.sin(angle) * r;
                          return (
                            <line
                              key={idx}
                              x1={240}
                              y1={140}
                              x2={nodeX}
                              y2={nodeY}
                              stroke="#6366f1"
                              strokeWidth="2"
                              strokeDasharray="4 4"
                            />
                          );
                        })}
                      </svg>

                      {/* Nodes overlay absolute positioned */}
                      {/* Central node */}
                      <div
                        className="absolute bg-indigo-900 text-white font-bold text-xs px-3.5 py-2.5 rounded-2xl shadow-md border-2 border-indigo-400 text-center select-none z-10"
                        style={{
                          left: "240px",
                          top: "140px",
                          transform: "translate(-50%, -50%)"
                        }}
                      >
                        {activeMindMap.centralTopic}
                      </div>

                      {/* Secondary nodes */}
                      {activeMindMap.ideas.map((idea, idx) => {
                        const angle = (idx * 2 * Math.PI) / activeMindMap.ideas.length;
                        const r = 90;
                        const nodeX = 240 + Math.cos(angle) * r;
                        const nodeY = 140 + Math.sin(angle) * r;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleRemoveIdeaFromMap(idx)}
                            title="Haz clic para borrar concepto"
                            className="absolute bg-[#eef2ff] hover:bg-red-50 hover:text-rose-700 hover:border-rose-300 border border-indigo-200 text-indigo-950 font-semibold text-[10px] px-2.5 py-1.5 rounded-xl shadow-2sm cursor-pointer select-none text-center transition-all duration-150 max-w-[120px] truncate"
                            style={{
                              left: `${nodeX}px`,
                              top: `${nodeY}px`,
                              transform: "translate(-50%, -50%)"
                            }}
                          >
                            {idea}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <p className="text-[10px] text-stone-400 font-bold text-center">💡 Haz clic sobre cualquier concepto secundario para eliminarlo de las ramificaciones.</p>
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center m-auto">
                  <Network className="w-8 h-8 text-indigo-400 mb-2" />
                  <p className="text-xs font-bold text-stone-500">Selecciona o crea un Mapa Mental</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. OBJETIVOS DE ESTUDIO PANEL */}
        {activeSubTab === "goals" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-[#faf9f6] border border-stone-200 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">Crear Meta de Estudio</h4>
              <form onSubmit={handleCreateGoal} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-stone-600">Título de la meta:</label>
                  <input
                    type="text"
                    placeholder="Ej: Estudiar matemáticas con Pomodoro"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Tipo de meta:</label>
                    <select
                      value={goalType}
                      onChange={(e) => setGoalType(e.target.value as any)}
                      className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs text-stone-700 font-bold"
                    >
                      <option value="daily">Diaria</option>
                      <option value="weekly">Semanal</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Unidad de medida:</label>
                    <select
                      value={goalUnit}
                      onChange={(e) => setGoalUnit(e.target.value as any)}
                      className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs text-stone-700 font-bold"
                    >
                      <option value="horas">Horas</option>
                      <option value="cuestionarios">Cuestionarios</option>
                      <option value="tarjetas">Tarjetas Repasadas</option>
                      <option value="actividades">Actividades</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-stone-600">Meta objetivo (Valor numérico):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(parseFloat(e.target.value) || 1)}
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-1.8 bg-stone-800 hover:bg-stone-900 text-white font-bold text-xs rounded-lg transition"
                >
                  Registrar Meta
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-3.5">
              <span className="text-[10px] font-extrabold uppercase text-stone-500 block">Tus Metas Activas</span>
              {studyGoals.length === 0 ? (
                <div className="p-10 text-center border border-dashed border-stone-200 rounded-xl">
                  <Target className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-stone-500">No hay metas registradas.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {studyGoals.map((g) => {
                    const pct = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));
                    return (
                      <div key={g.id} className="bg-white border border-stone-200 rounded-xl p-3.5 space-y-3 shadow-3sm relative">
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="absolute top-3.5 right-3.5 p-1 text-stone-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-1">
                          <div className="flex gap-1.5 items-center">
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                              g.type === "daily" ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-indigo-50 text-indigo-800 border-indigo-200"
                            }`}>
                              {g.type === "daily" ? "Diaria" : "Semanal"}
                            </span>
                            {g.completed && (
                              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[8px] font-black uppercase px-2 py-0.5 rounded">Completada✓</span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-stone-850 truncate pr-6">{g.title}</h4>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-stone-500">
                            <span>Progreso</span>
                            <span>{g.currentValue} / {g.targetValue} {g.unit} ({pct}%)</span>
                          </div>
                          <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${g.completed ? "bg-emerald-500" : "bg-indigo-500"}`}
                              style={{ width: `${pct}%` }}
                            ></div>
                          </div>
                        </div>

                        {!g.completed && (
                          <div className="flex gap-1.5 justify-end">
                            <button
                              onClick={() => handleIncrementGoal(g.id, 1)}
                              className="px-2 py-0.8 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-[10px] font-bold rounded"
                            >
                              +1 {g.unit === "horas" ? "hora" : "repaso"}
                            </button>
                            {g.unit === "horas" && (
                              <button
                                onClick={() => handleIncrementGoal(g.id, 0.25)}
                                className="px-2 py-0.8 bg-stone-100 border border-stone-200 text-stone-600 hover:bg-stone-200 text-[10px] font-bold rounded"
                              >
                                +15 mins
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 8. STUDY CHECKLISTS PANEL */}
        {activeSubTab === "checklists" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#faf9f6] border border-stone-200 rounded-xl p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-sky-950 tracking-wider">Crear Checklist de Examen</h4>
                  <p className="text-[10px] text-stone-500 mt-0.5">Fracciona tus temas o guías para rendir una evaluación importante.</p>
                </div>

                <form onSubmit={handleCreateChecklist} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Título de la lista:</label>
                    <input
                      type="text"
                      placeholder="Ej: Trimestral de Literatura"
                      value={checklistTitle}
                      onChange={(e) => setChecklistTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-stone-600">Materia:</label>
                    <select
                      value={checklistSubject}
                      onChange={(e) => setChecklistSubject(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg py-1.5 px-2.5 text-xs text-stone-700 font-bold"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.8 bg-sky-700 hover:bg-sky-850 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Crear Checklist
                  </button>
                </form>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-stone-500 block">Tus Listas</span>
                {studyChecklists.length === 0 ? (
                  <p className="text-[11px] text-stone-400 italic">No tienes listas guardadas.</p>
                ) : (
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {studyChecklists.map((l) => {
                      const doneCount = l.items.filter(i => i.completed).length;
                      const totalItems = l.items.length;
                      const pct = totalItems > 0 ? Math.round((doneCount / totalItems) * 100) : 0;
                      return (
                        <div
                          key={l.id}
                          onClick={() => setActiveChecklistId(l.id)}
                          className={`p-2 px-3 border rounded-lg flex items-center justify-between text-xs font-medium cursor-pointer transition ${
                            activeChecklistId === l.id
                              ? "bg-sky-50 border-sky-300 text-sky-900 font-bold"
                              : "bg-white border-stone-200 hover:border-sky-200 text-stone-700"
                          }`}
                        >
                          <div className="min-w-0">
                            <span className="truncate block font-bold text-stone-850">{l.title}</span>
                            <span className="text-[9px] text-stone-400 block font-bold uppercase">{l.subject} • {doneCount}/{totalItems} items ({pct}%)</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteChecklist(l.id); }}
                            className="p-1 text-stone-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-4 min-h-[220px] flex flex-col justify-between">
              {activeChecklist ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <div>
                      <span className="text-[9px] font-black uppercase bg-sky-100 text-sky-800 px-1.8 py-0.2 rounded mr-2">
                        {activeChecklist.subject}
                      </span>
                      <h4 className="inline text-xs font-bold text-stone-850">{activeChecklist.title}</h4>
                    </div>
                    <span className="text-xs font-black text-sky-850 bg-sky-50 border border-sky-150 px-2 py-0.5 rounded-full font-mono">
                      {activeChecklist.items.length > 0
                        ? `${Math.round((activeChecklist.items.filter(i => i.completed).length / activeChecklist.items.length) * 100)}%`
                        : "0%"}
                    </span>
                  </div>

                  <form onSubmit={(e) => handleAddChecklistItem(e, activeChecklist.id)} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej: Repasar tema de vanguardias..."
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      className="flex-1 px-3 py-1 bg-white border border-stone-200 rounded-lg text-xs"
                    />
                    <button
                      type="submit"
                      className="px-3 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-lg transition"
                    >
                      Sumar
                    </button>
                  </form>

                  <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                    {activeChecklist.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-1.5 hover:bg-stone-50 rounded-lg border border-transparent transition">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => handleToggleChecklistItem(activeChecklist.id, item.id)}
                            className={`p-0.5 rounded cursor-pointer ${item.completed ? "text-emerald-600 bg-emerald-50" : "text-stone-300 hover:text-emerald-600"}`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <span className={`text-xs font-medium truncate ${item.completed ? "text-stone-400 line-through" : "text-stone-700"}`}>
                            {item.text}
                          </span>
                        </div>
                        <button onClick={() => handleDeleteChecklistItem(activeChecklist.id, item.id)} className="text-stone-400 hover:text-rose-600 p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    {activeChecklist.items.length === 0 && (
                      <p className="text-xs text-stone-400 font-medium italic text-center py-6">No has sumado actividades aún.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center m-auto">
                  <CheckCircle2 className="w-8 h-8 text-sky-400 mb-2" />
                  <p className="text-xs font-bold text-stone-500">Selecciona o crea una checklist de examen</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 9. BIBLIOTECA DE RESÚMENES PANEL */}
        {activeSubTab === "resumenes" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Formulario de Carga de Resúmenes (col-span-5) */}
            <div className={`lg:col-span-5 border rounded-xl p-4 shadow-3sm flex flex-col justify-between transition-colors duration-200 ${
              theme === "oscuro"
                ? "bg-stone-900 border-stone-850"
                : "bg-stone-50/50 border-stone-200/80"
            }`}>
              <div>
                <h3 className={`font-display font-black text-sm mb-1 flex items-center gap-1.5 ${
                  theme === "oscuro" ? "text-amber-400" : "text-stone-850"
                }`}>
                  <span>📚</span> Subir Resumen de Materia
                </h3>
                <p className={`text-[11px] mb-4 ${
                  theme === "oscuro" ? "text-stone-400" : "text-stone-500"
                }`}>
                  Cargá tus apuntes, resúmenes manuscritos o archivos de estudio para tenerlos siempre a mano y ordenados por materia.
                </p>

                <form onSubmit={handleCreateSummary} className="space-y-3.5">
                  <div>
                    <label className={`block text-[10px] font-black uppercase mb-1 ${
                      theme === "oscuro" ? "text-stone-400" : "text-stone-500"
                    }`}>Materia</label>
                    <select
                      value={summarySubject}
                      onChange={(e) => setSummarySubject(e.target.value)}
                      className={`w-full px-3 py-1.8 border rounded-lg text-xs cursor-pointer focus:ring-1 focus:ring-rose-500 transition-colors duration-200 ${
                        theme === "oscuro"
                          ? "bg-stone-950 border-stone-800 text-stone-100"
                          : "bg-white border-stone-200 text-stone-800"
                      }`}
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black uppercase mb-1 ${
                      theme === "oscuro" ? "text-stone-400" : "text-stone-500"
                    }`}>Título del Resumen</label>
                    <input
                      type="text"
                      placeholder="Ej: Apuntes de Termodinámica"
                      value={summaryTitle}
                      onChange={(e) => setSummaryTitle(e.target.value)}
                      required
                      className={`w-full px-3 py-1.8 border rounded-lg text-xs focus:ring-1 focus:ring-rose-500 transition-colors duration-200 ${
                        theme === "oscuro"
                          ? "bg-stone-950 border-stone-800 text-stone-100 placeholder-stone-600"
                          : "bg-white border-stone-200 text-stone-800 placeholder-stone-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black uppercase mb-1 ${
                      theme === "oscuro" ? "text-stone-400" : "text-stone-500"
                    }`}>Contenido del Resumen</label>
                    <textarea
                      rows={8}
                      placeholder="Escribí, pegá tu resumen o dejá una descripción aquí..."
                      value={summaryContent}
                      onChange={(e) => setSummaryContent(e.target.value)}
                      required
                      className={`w-full px-3 py-2 border rounded-lg text-xs font-sans resize-none focus:ring-1 focus:ring-rose-500 transition-colors duration-200 ${
                        theme === "oscuro"
                          ? "bg-stone-950 border-stone-800 text-stone-100 placeholder-stone-600"
                          : "bg-white border-stone-200 text-stone-800 placeholder-stone-400"
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-[10px] font-black uppercase mb-1 ${
                      theme === "oscuro" ? "text-stone-400" : "text-stone-500"
                    }`}>Documentos o Imágenes Adjuntos</label>
                    <StudyAttachmentUploader
                      attachments={summaryAttachments}
                      onChange={setSummaryAttachments}
                      onExtractContent={(text, meta) => {
                        if (meta.topic) setSummaryTitle(meta.topic);
                        if (meta.summary || text) setSummaryContent(meta.summary || text);
                      }}
                      theme={theme}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                  >
                    Guardar Resumen
                  </button>
                </form>
              </div>
            </div>

            {/* Listado y Visor de Resúmenes (col-span-7) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Filtro de Materias */}
              <div>
                <label className={`block text-[10px] font-black uppercase mb-1.5 ${
                  theme === "oscuro" ? "text-stone-400" : "text-stone-500"
                }`}>Seleccionar Materia</label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedSubjectFilter("all");
                      setActiveSummaryId(null);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      selectedSubjectFilter === "all"
                        ? theme === "oscuro"
                          ? "bg-stone-100 text-stone-950 border-stone-100"
                          : "bg-stone-800 text-white border-stone-800"
                        : theme === "oscuro"
                          ? "bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800 hover:text-white"
                          : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    📂 Todas
                  </button>
                  {categories.map((cat) => {
                    const count = studySummaries.filter(s => s.subject === cat).length;
                    return (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedSubjectFilter(cat);
                          setActiveSummaryId(null);
                        }}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition flex items-center gap-1 cursor-pointer ${
                          selectedSubjectFilter === cat
                            ? "bg-rose-700 text-white border-rose-700"
                            : theme === "oscuro"
                              ? "bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800 hover:text-white"
                              : "bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100"
                        }`}
                      >
                        📁 {cat} <span className="text-[9px] opacity-75">({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contenedor Principal de Contenido */}
              <div className={`border rounded-xl overflow-hidden min-h-[300px] flex flex-col transition-colors duration-200 ${
                theme === "oscuro"
                  ? "bg-stone-950 border-stone-850"
                  : "bg-stone-50/20 border-stone-200"
              }`}>
                
                {/* 1. Si hay un resumen activo, mostrar el VISOR */}
                {activeSummaryId && studySummaries.find(s => s.id === activeSummaryId) ? (() => {
                  const summary = studySummaries.find(s => s.id === activeSummaryId)!;
                  return (
                    <div className={`flex-1 flex flex-col transition-colors duration-200 ${
                      theme === "oscuro" ? "bg-stone-900 text-stone-100" : "bg-white text-stone-850"
                    }`}>
                      {/* Cabecera del Visor */}
                      <div className={`border-b p-4 flex justify-between items-start transition-colors duration-200 ${
                        theme === "oscuro" ? "border-stone-800 bg-stone-950/60" : "border-stone-100 bg-stone-50/50"
                      }`}>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-black uppercase border px-2 py-0.2 rounded font-mono ${
                              theme === "oscuro"
                                ? "bg-rose-950/40 text-rose-300 border-rose-900/40"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              {summary.subject}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400 font-bold">{summary.createdAt}</span>
                          </div>
                          <h4 className={`text-sm font-black font-display ${theme === "oscuro" ? "text-amber-400" : "text-stone-850"}`}>{summary.title}</h4>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => handleDeleteSummary(summary.id, e)}
                            className={`p-1.5 rounded transition cursor-pointer ${
                              theme === "oscuro"
                                ? "text-stone-400 hover:text-rose-400 bg-stone-800 hover:bg-stone-750"
                                : "text-stone-400 hover:text-rose-600 bg-stone-100 hover:bg-rose-50"
                            }`}
                            title="Eliminar Resumen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setActiveSummaryId(null)}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded transition cursor-pointer ${
                              theme === "oscuro"
                                ? "text-stone-300 bg-stone-800 hover:bg-stone-700"
                                : "text-stone-600 bg-stone-150 hover:bg-stone-200"
                            }`}
                          >
                            Volver a la lista
                          </button>
                        </div>
                      </div>

                      {/* Cuerpo del Resumen */}
                      <div className="flex-1 p-5 overflow-y-auto max-h-[350px] space-y-4">
                        <div className={`text-xs leading-relaxed font-sans whitespace-pre-wrap ${
                          theme === "oscuro" ? "text-stone-300" : "text-stone-700"
                        }`}>
                          {summary.content}
                        </div>

                        {/* Adjuntos en el visor */}
                        {summary.attachments && summary.attachments.length > 0 && (
                          <div className={`border-t pt-3 mt-4 space-y-2 ${
                            theme === "oscuro" ? "border-stone-800" : "border-stone-100"
                          }`}>
                            <p className="text-[10px] font-black uppercase text-stone-400">Documentos Adjuntos ({summary.attachments.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {summary.attachments.map((file, fIdx) => (
                                <div key={fIdx} className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-lg text-xs font-bold shadow-3sm ${
                                  theme === "oscuro"
                                    ? "bg-rose-950/20 border-rose-900/35 text-rose-300"
                                    : "bg-rose-50 border-rose-100 text-rose-800"
                                }`}>
                                  <span>📎</span>
                                  <span className="truncate max-w-[150px]" title={file.name}>{file.name}</span>
                                  {file.type.startsWith("image/") && file.dataUrl && (
                                    <img src={file.dataUrl} alt="prev" className={`w-6 h-6 object-cover rounded ml-1 border ${
                                      theme === "oscuro" ? "border-rose-900" : "border-rose-200"
                                    }`} referrerPolicy="no-referrer" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })() : (
                  /* 2. Si no hay resumen activo, mostrar la LISTA filtrada */
                  (() => {
                    const filteredSummaries = selectedSubjectFilter === "all"
                      ? studySummaries
                      : studySummaries.filter(s => s.subject === selectedSubjectFilter);

                    return (
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className={`border-b pb-2 mb-3 flex justify-between items-center ${
                            theme === "oscuro" ? "border-stone-850" : "border-stone-100"
                          }`}>
                            <span className={`text-[10px] font-black uppercase ${
                              theme === "oscuro" ? "text-stone-400" : "text-stone-500"
                            }`}>
                              {selectedSubjectFilter === "all" ? "Todos los Resúmenes" : `Resúmenes de ${selectedSubjectFilter}`}
                            </span>
                            <span className="text-[10px] text-stone-400 font-bold">{filteredSummaries.length} guardados</span>
                          </div>

                          {filteredSummaries.length === 0 ? (
                            <div className="text-center py-12 flex flex-col items-center justify-center my-auto">
                              <span className="text-3xl mb-2">📂</span>
                              <p className={`text-xs font-bold ${theme === "oscuro" ? "text-stone-400" : "text-stone-500"}`}>No hay resúmenes cargados para esta materia</p>
                              <p className="text-[11px] text-stone-400 mt-0.5">Subí tu primer apunte o resumen usando el formulario de la izquierda.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                              {filteredSummaries.map((summary) => (
                                <div
                                  key={summary.id}
                                  onClick={() => setActiveSummaryId(summary.id)}
                                  className={`border rounded-xl p-3.5 flex flex-col justify-between h-[130px] shadow-3sm hover:border-rose-200 cursor-pointer transition-all relative overflow-hidden group ${
                                    theme === "oscuro"
                                      ? "bg-stone-900 border-stone-800 hover:bg-stone-850"
                                      : "bg-white border-stone-200 hover:bg-stone-50/20"
                                  }`}
                                >
                                  <div>
                                    <div className="flex justify-between items-start mb-1.5">
                                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded font-mono ${
                                        theme === "oscuro"
                                          ? "bg-stone-950 text-stone-400"
                                          : "bg-stone-100 text-stone-600"
                                      }`}>
                                        {summary.subject}
                                      </span>
                                      <span className="text-[9px] font-mono text-stone-400 font-bold">{summary.createdAt}</span>
                                    </div>
                                    <h5 className={`font-bold text-xs truncate pr-5 ${
                                      theme === "oscuro" ? "text-stone-200" : "text-stone-800"
                                    }`}>{summary.title}</h5>
                                    <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 leading-normal font-sans">
                                      {summary.content}
                                    </p>
                                  </div>

                                  <div className={`flex justify-between items-center border-t pt-2 mt-2 ${
                                    theme === "oscuro" ? "border-stone-850" : "border-stone-50"
                                  }`}>
                                    <div className="flex items-center gap-1.5">
                                      {summary.attachments && summary.attachments.length > 0 && (
                                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded border flex items-center gap-0.5 ${
                                          theme === "oscuro"
                                            ? "text-rose-300 bg-rose-950/40 border-rose-900/40"
                                            : "text-rose-700 bg-rose-50 border-rose-200"
                                        }`}>
                                          📎 {summary.attachments.length}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="flex gap-1.5 opacity-80 group-hover:opacity-100">
                                      <button
                                        onClick={(e) => handleDeleteSummary(summary.id, e)}
                                        className={`p-1 rounded transition cursor-pointer ${
                                          theme === "oscuro"
                                            ? "text-stone-500 hover:text-rose-400 hover:bg-stone-800"
                                            : "text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                                        }`}
                                        title="Eliminar Resumen"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
