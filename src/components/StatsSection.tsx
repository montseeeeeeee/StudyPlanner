import React from "react";
import { Task, CalendarEvent, Reminder, StudyMaterial, Flashcard } from "../types";
import { BarChart3, TrendingUp, CheckCircle, Clock, AlertCircle, Calendar, MessageSquare, BookOpen, Trophy, Sparkles, Flame, Brain } from "lucide-react";

interface StatsSectionProps {
  tasks: Task[];
  events: CalendarEvent[];
  reminders: Reminder[];
  studyMaterials: StudyMaterial[];
  categories: string[];
  flashcards?: Flashcard[];
  pomodoroTotalMinutes?: number;
  pomodoroSessionsCount?: number;
}

export default function StatsSection({
  tasks,
  events,
  reminders,
  studyMaterials,
  categories,
  flashcards = [],
  pomodoroTotalMinutes = 0,
  pomodoroSessionsCount = 0
}: StatsSectionProps) {
  // 1. Basic metrics calculation
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Count of reminders and quizzes
  const totalReminders = reminders.length;
  const totalQuizzesTaken = studyMaterials.reduce((acc, m) => acc + (m.attempts?.length || 0), 0);

  // 3. Flashcards stats
  const totalFlashcards = flashcards.length;
  const learnedFlashcards = flashcards.filter(f => f.status === "learned").length;
  const learnedRate = totalFlashcards > 0 ? Math.round((learnedFlashcards / totalFlashcards) * 100) : 0;

  // 4. Pomodoro stats
  const studiedHours = parseFloat((pomodoroTotalMinutes / 60).toFixed(1));

  // 5. Subject with the most tasks
  const tasksByCategory: { [key: string]: number } = {};
  categories.forEach((cat) => {
    tasksByCategory[cat] = 0;
  });
  tasks.forEach((task) => {
    if (tasksByCategory[task.category] !== undefined) {
      tasksByCategory[task.category]++;
    } else {
      tasksByCategory[task.category] = 1;
    }
  });

  let topSubject = "Ninguna";
  let maxTasks = 0;
  Object.entries(tasksByCategory).forEach(([cat, count]) => {
    if (count > maxTasks) {
      maxTasks = count;
      topSubject = cat;
    }
  });

  // 6. Tasks distribution by subject
  const subjectStats = categories.map((cat) => {
    const totalInCat = tasks.filter((t) => t.category === cat).length;
    const completedInCat = tasks.filter((t) => t.category === cat && t.completed).length;
    const pendingInCat = totalInCat - completedInCat;
    return {
      category: cat,
      total: totalInCat,
      completed: completedInCat,
      pending: pendingInCat,
      rate: totalInCat > 0 ? Math.round((completedInCat / totalInCat) * 100) : 0,
    };
  }).filter(stat => stat.total > 0); // Only show subjects that have tasks to keep chart clean

  // 7. Tasks by priority
  const priorityHigh = tasks.filter((t) => t.priority === "high").length;
  const priorityMedium = tasks.filter((t) => t.priority === "medium").length;
  const priorityLow = tasks.filter((t) => t.priority === "low").length;
  const totalWithPriority = priorityHigh + priorityMedium + priorityLow;

  const pctHigh = totalWithPriority > 0 ? Math.round((priorityHigh / totalWithPriority) * 100) : 0;
  const pctMedium = totalWithPriority > 0 ? Math.round((priorityMedium / totalWithPriority) * 100) : 0;
  const pctLow = totalWithPriority > 0 ? Math.round((priorityLow / totalWithPriority) * 100) : 0;

  // 8. Exam Simulator Average Score
  let totalAttemptedQuestions = 0;
  let totalCorrectAnswers = 0;
  studyMaterials.forEach((material) => {
    material.attempts?.forEach((attempt) => {
      totalAttemptedQuestions += attempt.totalCount;
      totalCorrectAnswers += attempt.correctCount;
    });
  });
  const quizAvgScore = totalAttemptedQuestions > 0 ? Math.round((totalCorrectAnswers / totalAttemptedQuestions) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header section with ring decoration */}
      <div className="relative overflow-hidden bg-indigo-50/40 border border-indigo-100 rounded-2xl p-6 shadow-3sm">
        <div className="absolute top-0 left-6 right-6 h-2 flex justify-start gap-4">
          <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-sm -mt-1 select-none"></span>
          <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-sm -mt-1 select-none"></span>
          <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-sm -mt-1 select-none"></span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-800">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-indigo-950 font-display">Estadísticas Académicas</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Análisis completo y visual de tu rendimiento, tareas y avance en las materias escolares.
            </p>
          </div>
        </div>
      </div>

      {/* Bento Grid of Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total creadas */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-3sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Tareas Creadas</span>
            <span className="p-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-mono">Totales</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-stone-850 font-mono tracking-tight">{totalTasks}</span>
            <span className="text-xs text-stone-400 font-medium">TPs & Tareas</span>
          </div>
          <div className="mt-3 border-t border-stone-100 pt-2 flex items-center gap-1.5 text-[10px] font-medium text-stone-500">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>Creadas desde el inicio</span>
          </div>
        </div>

        {/* Tareas Completadas */}
        <div className="bg-emerald-50/10 border border-emerald-150 rounded-2xl p-4 shadow-3sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Completadas</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">Listo</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-emerald-850 font-mono tracking-tight">{completedTasks}</span>
            <span className="text-xs text-emerald-600 font-bold">Hechas</span>
          </div>
          <div className="mt-3 border-t border-emerald-100 pt-2 flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>¡Excelente ritmo de entrega!</span>
          </div>
        </div>

        {/* Pendientes */}
        <div className="bg-amber-50/10 border border-amber-150 rounded-2xl p-4 shadow-3sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pendientes</span>
            <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-wider">Por hacer</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-amber-850 font-mono tracking-tight">{pendingTasks}</span>
            <span className="text-xs text-amber-600 font-bold">Por entregar</span>
          </div>
          <div className="mt-3 border-t border-amber-100 pt-2 flex items-center gap-1.5 text-[10px] font-medium text-amber-850">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Organiza tu calendario</span>
          </div>
        </div>

        {/* Porcentaje de Logro */}
        <div className="bg-indigo-50/15 border border-indigo-150 rounded-2xl p-4 shadow-3sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Porcentaje</span>
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-bold uppercase">Rate</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-indigo-900 font-mono tracking-tight">{completionRate}%</span>
            <span className="text-xs text-indigo-600 font-bold">Completado</span>
          </div>
          <div className="mt-3 border-t border-indigo-100 pt-2 flex items-center gap-1.5 text-[10px] font-medium text-indigo-750">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            <span>Progreso global del ciclo</span>
          </div>
        </div>
      </div>

      {/* Secondary metrics group */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Materia con más tareas */}
        <div className="bg-[#fafbfd] border border-stone-200 rounded-xl p-4 shadow-3sm flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Materia más Cargada</span>
            <span className="text-xs font-bold text-stone-850 truncate block">{topSubject}</span>
            <span className="text-[10px] text-stone-500 font-medium block mt-0.5">
              {maxTasks > 0 ? `${maxTasks} tareas registradas` : "Sin tareas aún"}
            </span>
          </div>
        </div>

        {/* Eventos académicos */}
        <div className="bg-[#fafbfd] border border-stone-200 rounded-xl p-4 shadow-3sm flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Eventos en Agenda</span>
            <span className="text-xs font-bold text-stone-850 block">{events.length} Eventos</span>
            <span className="text-[10px] text-stone-500 font-medium block mt-0.5">Exámenes y actos escolares</span>
          </div>
        </div>

        {/* Recordatorios */}
        <div className="bg-[#fafbfd] border border-stone-200 rounded-xl p-4 shadow-3sm flex items-center gap-3">
          <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Recordatorios</span>
            <span className="text-xs font-bold text-stone-850 block">{totalReminders} Creados</span>
            <span className="text-[10px] text-stone-500 font-medium block mt-0.5">Alertas de entrega rápida</span>
          </div>
        </div>

        {/* Cuestionarios realizados */}
        <div className="bg-[#fafbfd] border border-stone-200 rounded-xl p-4 shadow-3sm flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Cuestionarios de IA</span>
            <span className="text-xs font-bold text-stone-850 block">{totalQuizzesTaken} Realizados</span>
            <span className="text-[10px] text-stone-500 font-medium block mt-0.5">
              {totalQuizzesTaken > 0 ? `Promedio de nota: ${quizAvgScore}%` : "Sin intentos registrados"}
            </span>
          </div>
        </div>
      </div>

      {/* Rendimiento en Modos de Estudio */}
      <div className="relative overflow-hidden bg-stone-50 border border-stone-200/80 rounded-2xl p-5 shadow-3sm">
        <h3 className="text-xs font-black uppercase text-stone-700 tracking-wider flex items-center gap-1.5 mb-4 select-none">
          <Brain className="w-4 h-4 text-rose-500" />
          Rendimiento en Modos de Estudio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Pomodoro hours card */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-3 shadow-3sm">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Clock className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Estudiado con Pomodoro</span>
              <span className="text-sm font-black text-stone-850 block">{studiedHours} hrs</span>
              <span className="text-[10px] text-stone-500 font-medium block mt-0.5">
                {pomodoroSessionsCount} sesiones completadas
              </span>
            </div>
          </div>

          {/* Flashcards card */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-3 shadow-3sm">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Brain className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Tarjetas Aprendidas</span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-sm font-black text-stone-850 block">
                  {learnedFlashcards} <span className="text-xs font-normal text-stone-400">/ {totalFlashcards}</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">{learnedRate}%</span>
              </div>
              <div className="h-1 w-full bg-stone-100 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${learnedRate}%` }}></div>
              </div>
            </div>
          </div>

          {/* Quizzes card */}
          <div className="bg-white border border-stone-200 rounded-xl p-4 flex items-center gap-3 shadow-3sm">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Trophy className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-stone-400 block tracking-wider">Autoevaluaciones Realizadas</span>
              <span className="text-sm font-black text-stone-850 block">{totalQuizzesTaken} cuestionarios</span>
              <span className="text-[10px] text-stone-500 font-medium block mt-0.5">
                {totalQuizzesTaken > 0 ? `Promedio: ${quizAvgScore}%` : "Inicia repasos interactivos"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Bar Chart of Tasks by Subject */}
        <div className="lg:col-span-8 bg-white border border-stone-200 rounded-2xl p-5 shadow-3sm">
          <h3 className="text-xs font-bold uppercase text-stone-700 tracking-wider flex items-center gap-1.5 mb-5 select-none">
            <BarChart3 className="w-4 h-4 text-amber-500" />
            Progreso de Tareas por Materia
          </h3>

          {subjectStats.length === 0 ? (
            <div className="h-[220px] flex flex-col items-center justify-center border border-dashed border-stone-200 rounded-xl">
              <BookOpen className="w-8 h-8 text-stone-300 mb-2" />
              <p className="text-xs font-bold text-stone-500">Crea tareas y márcalas para ver el gráfico</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subjectStats.map((subject) => (
                <div key={subject.category} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-stone-800">{subject.category}</span>
                    <span className="font-mono text-[11px] text-stone-500">
                      <span className="font-bold text-emerald-600">{subject.completed}</span> / <span className="font-bold text-stone-700">{subject.total}</span> completadas ({subject.rate}%)
                    </span>
                  </div>
                  {/* Custom animated double bar */}
                  <div className="h-6 w-full bg-stone-100 rounded-md overflow-hidden relative border border-stone-200/50 flex items-center">
                    {/* Done Bar (emerald green) */}
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                      style={{ width: `${subject.rate}%` }}
                    ></div>
                    {/* Percentage text inside bar if space permits */}
                    <span className="absolute left-3 text-[10px] font-bold text-stone-800 mix-blend-difference select-none">
                      {subject.rate > 0 ? `${subject.rate}%` : "0% listo"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Task Priority Distribution & Simulator Score */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Distribution by Priority */}
          <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-3sm flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase text-stone-700 tracking-wider flex items-center gap-1.5 mb-4 select-none">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Distribución de Prioridad
              </h3>

              {totalTasks === 0 ? (
                <div className="h-[100px] flex items-center justify-center border border-dashed border-stone-200 rounded-xl">
                  <span className="text-[10px] text-stone-400 font-medium">Sin prioridades que mostrar</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* High Priority Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-stone-600">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Alta
                      </span>
                      <span className="font-mono font-bold text-stone-850">
                        {priorityHigh} ({pctHigh}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${pctHigh}%` }}></div>
                    </div>
                  </div>

                  {/* Medium Priority Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-stone-600">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Media
                      </span>
                      <span className="font-mono font-bold text-stone-850">
                        {priorityMedium} ({pctMedium}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 transition-all duration-300" style={{ width: `${pctMedium}%` }}></div>
                    </div>
                  </div>

                  {/* Low Priority Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-stone-600">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Baja
                      </span>
                      <span className="font-mono font-bold text-stone-850">
                        {priorityLow} ({pctLow}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${pctLow}%` }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Exam Simulator Score Indicator */}
          <div className="bg-emerald-50/20 border border-emerald-200 rounded-2xl p-5 shadow-3sm flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase text-emerald-850 tracking-wider flex items-center gap-1.5 mb-2 select-none">
              <Trophy className="w-4 h-4 text-emerald-600" />
              Rendimiento en Simuladores
            </h3>

            {totalQuizzesTaken === 0 ? (
              <div className="p-4 text-center">
                <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
                  Realiza repasos interactivos con Inteligencia Artificial para ver tu nota promedio de examen aquí.
                </p>
              </div>
            ) : (
              <div className="mt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-600 font-medium">Respuestas Correctas</span>
                  <span className="font-mono font-extrabold text-emerald-850 text-sm">
                    {totalCorrectAnswers} / {totalAttemptedQuestions}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-3 w-full bg-stone-200/60 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${quizAvgScore}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="font-mono text-lg font-black text-emerald-850">{quizAvgScore}%</span>
                </div>

                <div className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-100 p-2 rounded-lg leading-relaxed font-medium">
                  🌟 {quizAvgScore >= 70 ? "¡Excelente nivel de retención de conceptos!" : "Sigue utilizando la IA para afianzar tus materias antes de rendir."}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
