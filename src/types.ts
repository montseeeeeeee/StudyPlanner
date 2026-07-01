export interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string; // YYYY-MM-DD
  completedDate?: string; // YYYY-MM-DD when completed
  priority: "low" | "medium" | "high";
  category: string; // e.g., 'Matemáticas', 'Historia', 'Ciencias', 'Otros'
  notes?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: "examen" | "acto_escolar" | "feriado" | "otro";
  description?: string;
}

export interface Reminder {
  id: string;
  title: string;
  datetime: string; // YYYY-MM-DDTHH:mm
  completed: boolean;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface StudyAttempt {
  correctCount: number;
  totalCount: number;
  timestamp: string;
  answers: { [questionIndex: number]: number }; // questionIndex -> chosen option index
}

export interface StudyMaterial {
  id: string;
  title: string;
  text: string;
  questions: QuizQuestion[];
  attempts: StudyAttempt[];
}

export interface StudySummary {
  id: string;
  title: string;
  subject: string;
  content: string;
  createdAt: string;
  attachments?: StudyAttachment[];
}

export interface ClassSchedule {
  id: string;
  subject: string;
  dayOfWeek: "Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo";
  startTime: string; // e.g., "08:00"
  endTime: string; // e.g., "09:30"
  classroom?: string; // Optional room
}

export interface GradeItem {
  id: string;
  name: string; // e.g., "TP 1", "Parcial"
  score: number; // e.g., 8.5
  retakeScore?: number; // Optional retake/recuperatorio score
}

export interface SubjectGrade {
  id: string;
  subject: string;
  grades: GradeItem[];
}

export interface StudyAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string; // base64 for images or text preview
}

export interface Flashcard {
  id: string;
  subject: string;
  question: string;
  answer: string;
  status: "learned" | "review"; // "learned" -> Aprendida, "review" -> Pendiente de repaso
  leitnerBox?: number; // 1 to 5 (or 1 to 7) for Leitner System
  nextReviewDate?: string; // YYYY-MM-DD for recommended next review
  attachments?: StudyAttachment[];
}

export interface StudyNote {
  id: string;
  subject: string;
  title: string;
  content: string;
  createdAt: string; // ISO String or YYYY-MM-DD
  isCornell?: boolean; // True if using the Cornell template
  cornellKeywords?: string; // Keywords / Questions column
  cornellSummary?: string; // Summary box
  attachments?: StudyAttachment[];
}

export interface FeynmanExplanation {
  id: string;
  topic: string;
  explanation: string;
  difficulties: string;
  reviewConcepts: string;
  createdAt: string;
  attachments?: StudyAttachment[];
}

export interface MindMapNode {
  id: string;
  text: string;
}

export interface MindMap {
  id: string;
  title: string;
  subject: string;
  centralTopic: string;
  ideas: string[]; // simple list of related ideas as requested "Definir un tema central. Agregar conceptos secundarios relacionados. Visualizar conexiones entre ideas."
  createdAt: string;
  attachments?: StudyAttachment[];
}

export interface StudyGoal {
  id: string;
  title: string;
  type: "daily" | "weekly";
  targetValue: number;
  currentValue: number;
  unit: "horas" | "cuestionarios" | "tarjetas" | "actividades";
  completed: boolean;
}

export interface StudyChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface StudyChecklist {
  id: string;
  title: string;
  subject: string;
  items: StudyChecklistItem[];
}

