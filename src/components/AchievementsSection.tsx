import React from "react";
import { Task, StudyMaterial } from "../types";
import { Trophy, Award, Lock, CheckCircle2, Star, Sparkles, BookOpen } from "lucide-react";

interface AchievementsSectionProps {
  tasks: Task[];
  studyMaterials: StudyMaterial[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isUnlocked: boolean;
  unlockDate?: string;
  currentProgress: number;
  maxProgress: number;
  badgeColor: string;
}

export default function AchievementsSection({ tasks, studyMaterials }: AchievementsSectionProps) {
  // Today's date string
  const todayStr = new Date().toLocaleDateString("en-CA");

  // Helper: Get ISO Week string from date "YYYY-MM-DD"
  const getYearAndWeek = (dateStr: string) => {
    try {
      const date = new Date(dateStr + "T12:00:00");
      if (isNaN(date.getTime())) return null;
      const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = tempDate.getUTCDay() || 7;
      tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
      const weekNo = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      return `${tempDate.getUTCFullYear()}-W${weekNo}`;
    } catch {
      return null;
    }
  };

  // 1. Gather task completions
  const completedTasks = tasks.filter((t) => t.completed);
  const completedCount = completedTasks.length;

  // Sort completed tasks chronologically to find precise unlock dates
  const sortedCompletions = [...completedTasks].sort((a, b) => {
    const dateA = a.completedDate || a.dueDate;
    const dateB = b.completedDate || b.dueDate;
    return new Date(dateA + "T12:00:00").getTime() - new Date(dateB + "T12:00:00").getTime();
  });

  // 2. Gather study attempts
  const allAttempts: { timestamp: string; correctCount: number; totalCount: number }[] = [];
  studyMaterials.forEach((material) => {
    material.attempts?.forEach((attempt) => {
      allAttempts.push({
        timestamp: attempt.timestamp,
        correctCount: attempt.correctCount,
        totalCount: attempt.totalCount,
      });
    });
  });

  // Sort attempts chronologically
  const sortedAttempts = [...allAttempts].sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
  const attemptsCount = sortedAttempts.length;

  // 3. Week with no overdue tasks (0 overdue, and at least 3 completed tasks in total)
  const overdueTasks = tasks.filter((t) => !t.completed && t.dueDate < todayStr);
  const hasNoOverdue = overdueTasks.length === 0;
  const overdueProgress = hasNoOverdue ? Math.min(completedCount, 3) : 0;
  const isOverdueAchievementUnlocked = hasNoOverdue && completedCount >= 3;
  // Unlock date is when they got their 3rd task completed or today
  const overdueUnlockDate = isOverdueAchievementUnlocked
    ? (sortedCompletions[2]?.completedDate || sortedCompletions[2]?.dueDate || todayStr)
    : undefined;

  // 4. Group tasks by week to check "Todas las tareas de una semana completadas"
  const tasksByWeek: { [weekStr: string]: Task[] } = {};
  tasks.forEach((task) => {
    const weekStr = getYearAndWeek(task.dueDate);
    if (weekStr) {
      if (!tasksByWeek[weekStr]) {
        tasksByWeek[weekStr] = [];
      }
      tasksByWeek[weekStr].push(task);
    }
  });

  let hasCompletedAllInAnyWeek = false;
  let bestWeekRate = 0;
  let bestWeekCompleted = 0;
  let bestWeekTotal = 0;
  let weekUnlockDate: string | undefined = undefined;

  Object.entries(tasksByWeek).forEach(([week, weekTasks]) => {
    const totalInWeek = weekTasks.length;
    const doneInWeek = weekTasks.filter((t) => t.completed).length;
    if (totalInWeek > 0) {
      const rate = doneInWeek / totalInWeek;
      if (rate > bestWeekRate) {
        bestWeekRate = rate;
        bestWeekCompleted = doneInWeek;
        bestWeekTotal = totalInWeek;
      }
      if (doneInWeek === totalInWeek && totalInWeek >= 1) {
        hasCompletedAllInAnyWeek = true;
        // The unlock date is when they finished the last task of this week
        const weekCompletions = weekTasks.map((t) => t.completedDate || t.dueDate);
        weekCompletions.sort((a, b) => new Date(b + "T12:00:00").getTime() - new Date(a + "T12:00:00").getTime());
        weekUnlockDate = weekCompletions[0]; // newest completion in this week
      }
    }
  });

  // Formatting date for Display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const [year, month, day] = dateStr.split("T")[0].split("-");
      return `${day}/${month}/${year}`;
    } catch {
      return "";
    }
  };

  // Definitions of all Achievements
  const achievementsList: Achievement[] = [
    {
      id: "first_task",
      name: "Primer Paso",
      description: "Completa tu primera tarea o trabajo práctico de la agenda.",
      icon: <CheckCircle2 className="w-5 h-5" />,
      isUnlocked: completedCount >= 1,
      unlockDate: completedCount >= 1 ? (sortedCompletions[0]?.completedDate || sortedCompletions[0]?.dueDate) : undefined,
      currentProgress: Math.min(completedCount, 1),
      maxProgress: 1,
      badgeColor: "bg-blue-100 text-blue-850 border border-blue-200",
    },
    {
      id: "ten_tasks",
      name: "Estudiante Constante",
      description: "Completa un total de 10 tareas escolares.",
      icon: <Star className="w-5 h-5" />,
      isUnlocked: completedCount >= 10,
      unlockDate: completedCount >= 10 ? (sortedCompletions[9]?.completedDate || sortedCompletions[9]?.dueDate) : undefined,
      currentProgress: Math.min(completedCount, 10),
      maxProgress: 10,
      badgeColor: "bg-purple-100 text-purple-850 border border-purple-200",
    },
    {
      id: "twentyfive_tasks",
      name: "Dominio Académico",
      description: "Completa 25 tareas o prácticos escolares.",
      icon: <Award className="w-5 h-5" />,
      isUnlocked: completedCount >= 25,
      unlockDate: completedCount >= 25 ? (sortedCompletions[24]?.completedDate || sortedCompletions[24]?.dueDate) : undefined,
      currentProgress: Math.min(completedCount, 25),
      maxProgress: 25,
      badgeColor: "bg-amber-100 text-amber-850 border border-amber-200",
    },
    {
      id: "fifty_tasks",
      name: "Leyenda del Estudio",
      description: "Completa 50 tareas. ¡Una marca digna de admiración!",
      icon: <Trophy className="w-5 h-5" />,
      isUnlocked: completedCount >= 50,
      unlockDate: completedCount >= 50 ? (sortedCompletions[49]?.completedDate || sortedCompletions[49]?.dueDate) : undefined,
      currentProgress: Math.min(completedCount, 50),
      maxProgress: 50,
      badgeColor: "bg-rose-100 text-rose-850 border border-rose-200",
    },
    {
      id: "first_quiz",
      name: "Mente Curiosa",
      description: "Completa tu primer cuestionario interactivo con el simulador de IA.",
      icon: <BookOpen className="w-5 h-5" />,
      isUnlocked: attemptsCount >= 1,
      unlockDate: attemptsCount >= 1 ? sortedAttempts[0]?.timestamp.split("T")[0] : undefined,
      currentProgress: Math.min(attemptsCount, 1),
      maxProgress: 1,
      badgeColor: "bg-emerald-100 text-emerald-850 border border-emerald-200",
    },
    {
      id: "ten_quizzes",
      name: "Listo para el Examen",
      description: "Completa 10 cuestionarios en el simulador de examen.",
      icon: <Sparkles className="w-5 h-5" />,
      isUnlocked: attemptsCount >= 10,
      unlockDate: attemptsCount >= 10 ? sortedAttempts[9]?.timestamp.split("T")[0] : undefined,
      currentProgress: Math.min(attemptsCount, 10),
      maxProgress: 10,
      badgeColor: "bg-teal-100 text-teal-850 border border-teal-200",
    },
    {
      id: "no_overdue",
      name: "Puntualidad Absoluta",
      description: "Pasa una semana sin tareas atrasadas (vence con 0 tareas vencidas y al menos 3 completadas).",
      icon: <CheckCircle2 className="w-5 h-5" />,
      isUnlocked: isOverdueAchievementUnlocked,
      unlockDate: overdueUnlockDate,
      currentProgress: overdueProgress,
      maxProgress: 3,
      badgeColor: "bg-indigo-100 text-indigo-850 border border-indigo-200",
    },
    {
      id: "all_completed_week",
      name: "Semana Perfecta",
      description: "Completa el 100% de tus tareas de una semana lectiva (mínimo 1 tarea en esa semana).",
      icon: <Star className="w-5 h-5" />,
      isUnlocked: hasCompletedAllInAnyWeek,
      unlockDate: weekUnlockDate,
      currentProgress: hasCompletedAllInAnyWeek ? 1 : parseFloat(bestWeekRate.toFixed(2)),
      maxProgress: 1,
      badgeColor: "bg-sky-100 text-sky-850 border border-sky-200",
    },
  ];

  // Counters
  const unlockedCount = achievementsList.filter((a) => a.isUnlocked).length;
  const totalCount = achievementsList.length;

  return (
    <div className="space-y-6">
      {/* Header section with spiral notebook binding design */}
      <div className="relative overflow-hidden bg-amber-50/40 border border-amber-200 rounded-2xl p-6 shadow-3sm">
        <div className="absolute top-0 left-6 right-6 h-2 flex justify-start gap-4">
          <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-sm -mt-1 select-none"></span>
          <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-sm -mt-1 select-none"></span>
          <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-sm -mt-1 select-none"></span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-amber-950 font-display">Sistema de Logros</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                ¡Supera tus metas académicas! Completa tareas y simula exámenes para desbloquear insignias especiales.
              </p>
            </div>
          </div>

          {/* Quick summary badge */}
          <div className="bg-amber-100/50 border border-amber-200 rounded-xl p-2 px-4 flex items-center gap-2 self-start sm:self-auto">
            <span className="text-sm font-black text-amber-950 font-mono">
              {unlockedCount} / {totalCount}
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Desbloqueados</span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="mt-5 space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-bold text-amber-900">
            <span>Progreso de Colección de Logros</span>
            <span>{Math.round((unlockedCount / totalCount) * 100)}% Completado</span>
          </div>
          <div className="h-3 w-full bg-stone-200/60 rounded-full overflow-hidden p-0.5 border border-stone-200/40">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-amber-500 to-rose-500 rounded-full transition-all duration-700"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Grid of Achievements cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {achievementsList.map((achievement) => {
          // Calculate percentage for progress bars
          const progressPercentage = (achievement.currentProgress / achievement.maxProgress) * 100;

          return (
            <div
              key={achievement.id}
              className={`border rounded-2xl p-5 relative overflow-hidden transition flex flex-col justify-between ${
                achievement.isUnlocked
                  ? "bg-white border-stone-200/85 shadow-sm hover:border-amber-200 hover:shadow-2sm"
                  : "bg-stone-50/70 border-stone-200 border-dashed"
              }`}
            >
              <div className="flex gap-4">
                {/* Badge Icon */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 relative ${
                    achievement.isUnlocked
                      ? achievement.badgeColor
                      : "bg-stone-100 text-stone-400 border border-stone-200 border-dashed"
                  }`}
                >
                  {achievement.isUnlocked ? (
                    achievement.icon
                  ) : (
                    <Lock className="w-5 h-5 text-stone-400" />
                  )}
                  
                  {/* Small check icon on unlock */}
                  {achievement.isUnlocked && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>

                {/* Info block */}
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4
                      className={`text-xs font-bold truncate ${
                        achievement.isUnlocked ? "text-stone-850" : "text-stone-400"
                      }`}
                    >
                      {achievement.name}
                    </h4>
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      achievement.isUnlocked ? "text-stone-500 font-medium" : "text-stone-400 font-medium"
                    }`}
                  >
                    {achievement.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar or Completion Stamp */}
              <div className="mt-5 pt-3 border-t border-stone-100/70">
                {achievement.isUnlocked ? (
                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-700">
                    <span className="bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-150">
                      ¡Completado!
                    </span>
                    {achievement.unlockDate && (
                      <span className="font-mono text-stone-400">
                        Obtenido el {formatDate(achievement.unlockDate)}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px] font-bold text-stone-500">
                      <span>Progreso del logro</span>
                      <span className="font-mono">
                        {achievement.maxProgress === 1
                          ? `${Math.round(progressPercentage)}%`
                          : `${achievement.currentProgress} / ${achievement.maxProgress}`}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-stone-200/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stone-400/70 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
