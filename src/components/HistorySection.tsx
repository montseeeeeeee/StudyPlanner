import React, { useState } from "react";
import { Task } from "../types";
import { CheckCircle2, Calendar, Filter, Search, RotateCcw, Archive, BookOpen } from "lucide-react";

interface HistorySectionProps {
  tasks: Task[];
  categories: string[];
  onUpdateTasks: (tasks: Task[]) => void;
}

export default function HistorySection({ tasks, categories, onUpdateTasks }: HistorySectionProps) {
  const [filterTime, setFilterTime] = useState<"all" | "week" | "month">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter completed tasks
  const completedTasks = tasks.filter((t) => t.completed);

  // Helper to check if a date is within this week (last 7 days)
  const isThisWeek = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr + "T12:00:00");
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    return date >= oneWeekAgo && date <= today;
  };

  // Helper to check if a date is within this month
  const isThisMonth = (dateStr?: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr + "T12:00:00");
    const today = new Date();
    return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  // Process and sort tasks (most recently completed first, fallback to dueDate)
  const filteredCompletedTasks = completedTasks
    .filter((task) => {
      // Time filter (uses completedDate, fallback to dueDate if not set)
      const dateToCompare = task.completedDate || task.dueDate;
      if (filterTime === "week" && !isThisWeek(dateToCompare)) return false;
      if (filterTime === "month" && !isThisMonth(dateToCompare)) return false;

      // Category filter
      if (filterCategory !== "all" && task.category !== filterCategory) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesNotes = task.notes?.toLowerCase().includes(query) || false;
        return matchesTitle || matchesNotes;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort chronologically from newest to oldest
      const dateA = a.completedDate || a.dueDate;
      const dateB = b.completedDate || b.dueDate;
      return new Date(dateB + "T12:00:00").getTime() - new Date(dateA + "T12:00:00").getTime();
    });

  const handleReopenTask = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          completed: false,
          completedDate: undefined,
        };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  const getCategoryBadgeColor = (cat: string) => {
    switch (cat) {
      case "Matemáticas":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Historia":
        return "bg-amber-50 text-amber-700 border border-amber-200";
      case "Ciencias":
        return "bg-teal-50 text-teal-700 border border-teal-200";
      case "Literatura":
        return "bg-purple-50 text-purple-700 border border-purple-200";
      case "Geografía":
        return "bg-orange-50 text-orange-700 border border-orange-200";
      case "Idiomas":
        return "bg-pink-50 text-pink-700 border border-pink-200";
      default:
        return "bg-stone-50 text-stone-700 border border-stone-200";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/D";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-6">
      {/* Header of Section */}
      <div className="relative overflow-hidden bg-amber-50/40 border border-amber-200 rounded-2xl p-6 shadow-3sm">
        {/* Ring decoration */}
        <div className="absolute top-0 left-6 right-6 h-2 flex justify-start gap-4">
          <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-sm -mt-1 select-none"></span>
          <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-sm -mt-1 select-none"></span>
          <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-sm -mt-1 select-none"></span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-amber-950 font-display">Historial de Tareas</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Aquí se guardan de forma automática todas las tareas y trabajos prácticos que has marcado como completados.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#fdfbf7] border border-stone-200 rounded-xl p-4 shadow-3sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search bar */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por título o notas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 placeholder-stone-400 font-medium"
            />
          </div>

          {/* Time Filter buttons */}
          <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 self-start md:self-auto">
            <button
              onClick={() => setFilterTime("all")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition ${
                filterTime === "all" ? "bg-white text-amber-950 shadow-xs" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterTime("week")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition ${
                filterTime === "week" ? "bg-white text-amber-950 shadow-xs" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Esta semana
            </button>
            <button
              onClick={() => setFilterTime("month")}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition ${
                filterTime === "month" ? "bg-white text-amber-950 shadow-xs" : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Este mes
            </button>
          </div>

          {/* Category Filter dropdown */}
          <div className="relative min-w-[140px]">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg py-2 pl-3 pr-8 text-xs font-bold text-stone-700 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 appearance-none"
            >
              <option value="all">Todas las materias</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Tasks List */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        {filteredCompletedTasks.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center border border-dashed border-stone-300 text-stone-400 mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-stone-700">No hay tareas completadas en esta vista</p>
            <p className="text-xs text-stone-405 max-w-sm mt-1">
              {completedTasks.length === 0
                ? "Las tareas aparecerán aquí de forma automática a medida que las completes en la sección de Tareas."
                : "Prueba cambiando los filtros o quitando tu término de búsqueda."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 bg-stone-50 p-3 px-4 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              <div className="col-span-6">Título de la tarea / Notas</div>
              <div className="col-span-2 text-center">Materia</div>
              <div className="col-span-2 text-center">Fecha Entrega</div>
              <div className="col-span-2 text-center">Fecha Completada</div>
            </div>

            {/* List items */}
            {filteredCompletedTasks.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 px-4 items-center hover:bg-stone-50/40 transition group"
              >
                {/* Title & Notes */}
                <div className="col-span-1 md:col-span-6 flex items-start gap-3">
                  <button
                    onClick={() => handleReopenTask(task.id)}
                    className="mt-0.5 text-emerald-600 hover:text-amber-600 transition p-0.5 bg-emerald-50 rounded hover:bg-amber-50 cursor-pointer"
                    title="Desmarcar como completada (volver a pendientes)"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-stone-800 line-through decoration-stone-300">
                      {task.title}
                    </h4>
                    {task.notes && (
                      <p className="text-[11px] text-stone-405 mt-1 leading-normal italic font-medium">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Category/Materia */}
                <div className="col-span-1 md:col-span-2 text-left md:text-center">
                  <span className="md:hidden text-[10px] text-stone-400 font-bold block mb-1">Materia:</span>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${getCategoryBadgeColor(task.category)}`}>
                    {task.category}
                  </span>
                </div>

                {/* Due Date */}
                <div className="col-span-1 md:col-span-2 text-left md:text-center text-xs font-mono text-stone-600 font-medium">
                  <span className="md:hidden text-[10px] text-stone-400 font-bold block mb-1">Fecha Entrega:</span>
                  <div className="flex items-center md:justify-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                </div>

                {/* Completed Date */}
                <div className="col-span-1 md:col-span-2 text-left md:text-center text-xs font-mono font-bold text-emerald-700">
                  <span className="md:hidden text-[10px] text-stone-400 font-bold block mb-1">Fecha Completada:</span>
                  <div className="flex items-center md:justify-center gap-1.5 bg-emerald-50 md:bg-transparent rounded px-2 py-1 md:p-0 w-fit md:w-auto">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{formatDate(task.completedDate || task.dueDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
