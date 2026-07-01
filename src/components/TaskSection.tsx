import React, { useState } from "react";
import { Task } from "../types";
import { Plus, Trash, CheckSquare, Square, Edit3, Save, X, Calendar, AlertCircle } from "lucide-react";

interface TaskSectionProps {
  tasks: Task[];
  onUpdateTasks: (tasks: Task[]) => void;
  categories: string[];
  onAddCategory: (newCat: string) => void;
  onDeleteCategory: (catToDelete: string) => void;
}

export default function TaskSection({ tasks, onUpdateTasks, categories, onAddCategory, onDeleteCategory }: TaskSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Custom Category adding/managing state
  const [showManageCats, setShowManageCats] = useState(false);
  const [catToConfirmDelete, setCatToConfirmDelete] = useState<string | null>(null);
  
  // Custom Category adding UI state
  const [showAddCatInput, setShowAddCatInput] = useState(false);
  const [newCatInputVal, setNewCatInputVal] = useState("");

  // Form states
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("Otros");
  const [notes, setNotes] = useState("");

  // Grid/Filter states
  const [filterCategory, setFilterCategory] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState<"todos" | "pendientes" | "completadas">("todos");
  const [showFilterAddInput, setShowFilterAddInput] = useState(false);
  const [filterAddInputVal, setFilterAddInputVal] = useState("");

  // Edit states
  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high">("medium");
  const [editCategory, setEditCategory] = useState("Otros");
  const [editNotes, setEditNotes] = useState("");

  const handleAddNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatInputVal.trim();
    if (!trimmed) return;
    
    onAddCategory(trimmed);
    setCategory(trimmed); // Select newly added category
    setNewCatInputVal("");
    setShowAddCatInput(false);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      dueDate: dueDate || new Date().toISOString().split("T")[0],
      priority,
      category,
      notes: notes.trim() ? notes.trim() : undefined,
    };

    onUpdateTasks([newTask, ...tasks]);
    
    // Reset form
    setTitle("");
    setDueDate("");
    setPriority("medium");
    setCategory("Otros");
    setNotes("");
  };

  const handleToggleTask = (id: string) => {
    const todayStr = new Date().toLocaleDateString("en-CA");
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          completedDate: nextCompleted ? todayStr : undefined
        };
      }
      return t;
    });
    onUpdateTasks(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    onUpdateTasks(updated);
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDueDate(task.dueDate);
    setEditPriority(task.priority);
    setEditCategory(task.category);
    setEditNotes(task.notes || "");
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) return;

    const updated = tasks.map((t) =>
      t.id === id
        ? {
            ...t,
            title: editTitle.trim(),
            dueDate: editDueDate,
            priority: editPriority,
            category: editCategory,
            notes: editNotes.trim() ? editNotes.trim() : undefined,
          }
        : t
    );
    onUpdateTasks(updated);
    setEditingId(null);
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "high":
        return "bg-rose-100 text-rose-700 border-rose-300";
      case "medium":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "low":
        return "bg-emerald-100 text-emerald-700 border-emerald-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Matemáticas": return "bg-blue-100 text-blue-800";
      case "Historia": return "bg-amber-100 text-amber-800";
      case "Ciencias": return "bg-teal-100 text-teal-800";
      case "Literatura": return "bg-purple-100 text-purple-800";
      case "Geografía": return "bg-orange-100 text-orange-800";
      case "Idiomas": return "bg-pink-100 text-pink-800";
      default: return "bg-rose-100 text-rose-850 border border-rose-200/50";
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesCategory = filterCategory === "Todos" || task.category === filterCategory;
    const matchesStatus =
      filterStatus === "todos" ||
      (filterStatus === "completadas" && task.completed) ||
      (filterStatus === "pendientes" && !task.completed);
    return matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Nueva Tarea (Formulario tipo nota de agenda) */}
      <div id="add-task-form" className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
        {/* Adorno binder rings en el fondo */}
        <div className="absolute top-0 left-4 right-4 h-2 flex justify-between">
          <div className="w-3 h-4 bg-gray-300 rounded-full -mt-2 shadow-inner"></div>
          <div className="w-3 h-4 bg-gray-300 rounded-full -mt-2 shadow-inner"></div>
          <div className="w-3 h-4 bg-gray-300 rounded-full -mt-2 shadow-inner"></div>
          <div className="w-3 h-4 bg-gray-300 rounded-full -mt-2 shadow-inner"></div>
        </div>

        <h3 className="font-display font-bold text-lg text-amber-900 mb-4 flex items-center gap-2 mt-1">
          <Plus className="w-5 h-5 text-amber-700" />
          Nueva Tarea de Estudio
        </h3>

        <form onSubmit={handleAddTask} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">Título de la Tarea / Actividad *</label>
              <input
                id="task-title-input"
                type="text"
                placeholder="Ej: Resolver guía de derivadas"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-400 font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">Fecha de Entrega</label>
              <input
                id="task-date-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-amber-800">Materia / Categoría</label>
                <button
                  type="button"
                  onClick={() => setShowAddCatInput(!showAddCatInput)}
                  className="text-[11px] font-bold text-amber-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  {showAddCatInput ? "Ver materias" : "➕ Crear materia"}
                </button>
              </div>

              {showAddCatInput ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    required
                    placeholder="Escribe la materia..."
                    value={newCatInputVal}
                    onChange={(e) => setNewCatInputVal(e.target.value)}
                    className="flex-1 px-3 py-2 border border-amber-200 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-sans text-xs"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const trimmed = newCatInputVal.trim();
                        if (trimmed) {
                          onAddCategory(trimmed);
                          setCategory(trimmed);
                          setNewCatInputVal("");
                          setShowAddCatInput(false);
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newCatInputVal.trim();
                      if (trimmed) {
                        onAddCategory(trimmed);
                        setCategory(trimmed);
                        setNewCatInputVal("");
                        setShowAddCatInput(false);
                      }
                    }}
                    className="px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer"
                  >
                    OK
                  </button>
                </div>
              ) : (
                <select
                  id="task-category-select"
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === "__add_new__") {
                      setShowAddCatInput(true);
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 font-sans text-xs"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__add_new__">➕ Escribir materia nueva...</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-amber-800 mb-1">Prioridad de Entrega</label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "high"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-1 text-xs font-medium rounded-lg border transition-all capitalized ${
                      priority === p
                        ? p === "high"
                          ? "bg-rose-500 text-white border-rose-500"
                          : p === "medium"
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-emerald-500 text-white border-emerald-500"
                        : "bg-white text-gray-600 border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    {p === "high" ? "Alta" : p === "medium" ? "Media" : "Baja"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-amber-800 mb-1">Apuntes Adicionales</label>
            <textarea
              id="task-notes-input"
              rows={2}
              placeholder="Ej: Hacer con Matías, entra en el parcial final..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white/90 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-gray-400 font-sans text-sm resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              id="task-submit-button"
              type="submit"
              className="bg-amber-600 hover:bg-amber-700 text-white cursor-pointer px-4 py-2 rounded-lg font-display text-sm font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Agregar Tarea
            </button>
          </div>
        </form>
      </div>

      {/* Filtros de Tarea (Estilo Separadores de Carpeta) */}
      <div id="task-filters" className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-gray-200 pb-3">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus("todos")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filterStatus === "todos"
                ? "bg-stone-800 text-white border-stone-800"
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
            }`}
          >
            Todas ({tasks.length})
          </button>
          <button
            onClick={() => setFilterStatus("pendientes")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filterStatus === "pendientes"
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
            }`}
          >
            Pendientes ({tasks.filter((t) => !t.completed).length})
          </button>
          <button
            onClick={() => setFilterStatus("completadas")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filterStatus === "completadas"
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
            }`}
          >
            Completas ({tasks.filter((t) => t.completed).length})
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {showFilterAddInput ? (
            <div className="flex items-center gap-1.5 bg-amber-50/50 p-1 rounded-lg border border-amber-250">
              <input
                type="text"
                placeholder="Escribe la materia..."
                value={filterAddInputVal}
                onChange={(e) => setFilterAddInputVal(e.target.value)}
                className="px-2 py-1 text-xs border border-amber-300 rounded bg-white text-gray-800 placeholder:text-gray-400 font-sans focus:outline-none min-w-[130px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const trimmed = filterAddInputVal.trim();
                    if (trimmed) {
                      onAddCategory(trimmed);
                      setFilterCategory(trimmed);
                      setFilterAddInputVal("");
                      setShowFilterAddInput(false);
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const trimmed = filterAddInputVal.trim();
                  if (trimmed) {
                    onAddCategory(trimmed);
                    setFilterCategory(trimmed);
                    setFilterAddInputVal("");
                    setShowFilterAddInput(false);
                  } else {
                    setShowFilterAddInput(false);
                  }
                }}
                className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[10px] transition cursor-pointer"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setShowFilterAddInput(false)}
                className="px-1.5 py-0.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded text-[10px] transition cursor-pointer"
              >
                X
              </button>
            </div>
          ) : (
            <>
              <span className="text-xs text-stone-500 font-medium whitespace-nowrap">Filtrar Materia:</span>
              <div className="flex gap-1.5 items-center">
                <select
                  id="filter-category-select"
                  value={filterCategory}
                  onChange={(e) => {
                    if (e.target.value === "__add_filter_cat__") {
                      setShowFilterAddInput(true);
                    } else {
                      setFilterCategory(e.target.value);
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none"
                >
                  <option value="Todos">Todas las materias</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__add_filter_cat__">➕ Escribir materia nueva...</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowFilterAddInput(true)}
                  className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg border border-amber-200/60 transition cursor-pointer flex items-center justify-center"
                  title="Escribir materia nueva"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowManageCats(!showManageCats)}
                  className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center ${
                    showManageCats 
                    ? "bg-rose-100 text-rose-800 border-rose-300" 
                    : "bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200"
                  }`}
                  title="Eliminar/Gestionar materias"
                >
                  <Trash className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Panel para gestionar/eliminar materias */}
      {showManageCats && (
        <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 mb-4 gap-3 animate-fade-in">
          <div className="flex justify-between items-center mb-2 border-b border-rose-200/50 pb-2">
            <h4 className="text-xs font-semibold text-rose-955 flex items-center gap-1.5">
              <span>🗑️ Eliminar/Gestionar materias</span>
              <span className="text-[10px] font-normal text-rose-700">(Al eliminar una materia, sus tareas se asignarán a "Otros")</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowManageCats(false);
                setCatToConfirmDelete(null);
              }}
              className="text-stone-400 hover:text-stone-600 cursor-pointer p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {catToConfirmDelete && (
            <div className="bg-rose-100 border border-rose-300 rounded-lg p-3 mb-3 text-stone-800 text-xs animate-pulse flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                ¿Seguro que querés eliminar la materia <strong className="text-rose-900">"{catToConfirmDelete}"</strong>? Las tareas/TPs asignados cambiarán a <span className="italic font-bold text-rose-950">"Otros"</span>.
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    onDeleteCategory(catToConfirmDelete);
                    if (filterCategory === catToConfirmDelete) {
                      setFilterCategory("Todos");
                    }
                    if (category === catToConfirmDelete) {
                      setCategory("Otros");
                    }
                    setCatToConfirmDelete(null);
                  }}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer transition text-[11px]"
                >
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setCatToConfirmDelete(null)}
                  className="px-3 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded font-semibold cursor-pointer transition text-[11px]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className={`inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full font-medium shadow-2sm border text-xs transition ${
                  catToConfirmDelete === cat 
                    ? "bg-rose-205 border-rose-400 text-rose-900" 
                    : "bg-white border-rose-100 text-stone-700 hover:border-rose-350"
                }`}
              >
                {cat}
                {cat !== "Otros" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setCatToConfirmDelete(cat);
                    }}
                    className="p-0.5 hover:bg-rose-100 text-rose-500 rounded-full cursor-pointer transition"
                    title={`Eliminar materia "${cat}"`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                ) : (
                  <span className="text-[9px] text-stone-400 font-normal px-0.5">(Fijo)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Listado de Tareas (Estilo hoja rayada de cuaderno) */}
      <div id="tasks-list" className="bg-[#fcfbf7] border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        {/* Cabecera de la hoja */}
        <div className="border-b border-rose-200 bg-[#faf8f0] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-hand font-bold text-2xl text-rose-500 select-none">Tareas pendientes</span>
          </div>
          <span className="text-xs font-mono text-stone-400 uppercase select-none">STUDY PLANNER AGENDA</span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-stone-400 text-sm">No hay tareas que coincidan con los filtros seleccionados.</p>
            <p className="font-hand text-xl text-stone-500">¡Tenés más tiempo para un recreo o descansar!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className={`transition-all duration-150 p-4 relative ${
                  task.completed ? "bg-stone-50/50" : "hover:bg-amber-50/20"
                }`}
              >
                {/* Margen rojo de cuadernillo a la izquierda */}
                <div className="absolute top-0 bottom-0 left-12 w-[1px] bg-rose-200 select-none pointer-events-none"></div>

                <div className="flex items-start gap-4 z-10 relative">
                  {/* Botón de completar */}
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className="mt-0.5 text-stone-400 hover:text-amber-600 transition-colors cursor-pointer"
                  >
                    {task.completed ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-stone-400" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 pl-4">
                    {editingId === task.id ? (
                      /* Formulario de Edición */
                      <div className="space-y-3 bg-stone-50 p-3 rounded-lg border border-stone-200">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-2 py-1 border border-stone-300 rounded font-sans text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                          required
                        />
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-stone-600 mb-0.5">Fecha</label>
                            <input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              className="w-full p-1 border border-stone-300 rounded focus:outline-none bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-stone-600 mb-0.5">Materia</label>
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full p-1 border border-stone-300 rounded focus:outline-none bg-white"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-stone-600 mb-0.5">Prioridad</label>
                            <select
                              value={editPriority}
                              onChange={(e) => setEditPriority(e.target.value as any)}
                              className="w-full p-1 border border-stone-300 rounded focus:outline-none bg-white"
                            >
                              <option value="low">Baja</option>
                              <option value="medium">Media</option>
                              <option value="high">Alta</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-stone-600 mb-0.5">Apuntes</label>
                            <input
                              type="text"
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full p-1 border border-stone-300 rounded focus:outline-none bg-white"
                              placeholder="Sin apuntes"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1 px-2.5 rounded bg-gray-200 hover:bg-gray-300 text-stone-700 text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <X className="w-3.5 h-3.5" /> Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(task.id)}
                            className="p-1 px-2.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                          >
                            <Save className="w-3.5 h-3.5" /> Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Vista de Tarea Común */
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`font-semibold text-stone-800 text-sm ${
                              task.completed ? "line-through text-stone-400" : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          
                          {/* Categoría */}
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getCategoryColor(task.category)}`}>
                            {task.category}
                          </span>

                          {/* Prioridad */}
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                            {task.priority === "high" ? "Prioritario" : task.priority === "medium" ? "Medio" : "Bajo"}
                          </span>
                        </div>

                        {task.notes && (
                          <p className="text-xs text-stone-500 font-hand text-base tracking-wide leading-tight bg-yellow-50/40 p-1.5 rounded border border-dashed border-amber-100 italic">
                            ✍️ {task.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-stone-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            {task.dueDate ? new Date(task.dueDate + "T12:00:00").toLocaleDateString("es-ES", { weekday: 'long', day: 'numeric', month: 'short' }) : "Sin fecha"}
                          </span>

                          {!task.completed && new Date(task.dueDate) < new Date(new Date().toISOString().split('T')[0]) && (
                            <span className="text-red-500 flex items-center gap-1 font-semibold text-[10px] uppercase animate-pulse">
                              <AlertCircle className="w-3 h-3" />
                              Vencida
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {editingId !== task.id && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => startEdit(task)}
                        className="p-1.5 hover:bg-stone-100 rounded text-stone-400 hover:text-stone-700 transition"
                        title="Editar tarea"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 hover:bg-rose-50 rounded text-stone-400 hover:text-rose-600 transition"
                        title="Eliminar tarea"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
