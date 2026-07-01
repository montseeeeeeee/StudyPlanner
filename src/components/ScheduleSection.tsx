import { useState, FormEvent } from "react";
import { ClassSchedule } from "../types";
import { Clock, Plus, Trash2, Edit2, MapPin, Sparkles, X, Check } from "lucide-react";

interface ScheduleSectionProps {
  schedules: ClassSchedule[];
  onUpdateSchedules: (schedules: ClassSchedule[]) => void;
  categories: string[];
}

const DAYS: Array<"Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo"> = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo"
];

export default function ScheduleSection({
  schedules,
  onUpdateSchedules,
  categories
}: ScheduleSectionProps) {
  // Determine current day of the week to highlight
  const getTodaySpanishDay = (): string => {
    // We default to the current system day
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const systemIndex = new Date().getDay();
    
    // For June 17, 2026 demo coherence, let's also support matching Wednesday/Miércoles
    return dayNames[systemIndex];
  };

  const todaySpanish = getTodaySpanishDay();

  // Form & Editing States
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form values
  const [subject, setSubject] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<"Lunes" | "Martes" | "Miércoles" | "Jueves" | "Viernes" | "Sábado" | "Domingo">("Lunes");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:30");
  const [classroom, setClassroom] = useState("");

  const resetForm = () => {
    setSubject(categories[0] || "Matemáticas");
    setDayOfWeek("Lunes");
    setStartTime("08:00");
    setEndTime("09:30");
    setClassroom("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleStartAdd = () => {
    setSubject(categories[0] || "Matemáticas");
    setDayOfWeek("Lunes");
    setStartTime("08:00");
    setEndTime("09:30");
    setClassroom("");
    setIsAdding(true);
    setEditingId(null);
  };

  const handleStartEdit = (sched: ClassSchedule) => {
    setSubject(sched.subject);
    setDayOfWeek(sched.dayOfWeek);
    setStartTime(sched.startTime);
    setEndTime(sched.endTime);
    setClassroom(sched.classroom || "");
    setEditingId(sched.id);
    setIsAdding(false);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    if (startTime >= endTime) {
      alert("La hora de inicio debe ser anterior a la hora de finalización.");
      return;
    }

    if (editingId) {
      // Editing
      const updated = schedules.map(s => 
        s.id === editingId 
          ? { id: editingId, subject, dayOfWeek, startTime, endTime, classroom: classroom.trim() || undefined }
          : s
      );
      onUpdateSchedules(updated);
    } else {
      // Adding new
      const newSchedule: ClassSchedule = {
        id: "schedule-" + Date.now(),
        subject,
        dayOfWeek,
        startTime,
        endTime,
        classroom: classroom.trim() || undefined
      };
      onUpdateSchedules([...schedules, newSchedule]);
    }

    resetForm();
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`¿Seguro que querés eliminar el horario de "${name}"?`)) {
      onUpdateSchedules(schedules.filter(s => s.id !== id));
    }
  };

  // Group schedules by day
  const getSchedulesByDay = (day: string) => {
    return schedules
      .filter(s => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  return (
    <div className="space-y-6">
      
      {/* Header section with Action Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-150 pb-4">
        <div>
          <h2 className="font-display font-bold text-lg text-amber-900 flex items-center gap-2">
            📅 Horario Semanal de Clases
          </h2>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Organizá tus turnos escolares y materias semanales. Las clases del día actual (<span className="font-bold underline text-amber-700">{todaySpanish}</span>) se mostrarán resaltadas.
          </p>
        </div>

        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={handleStartAdd}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition shadow-2sm flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Agregar Clase
          </button>
        )}
      </div>

      {/* Form (Add or Edit) */}
      {(isAdding || editingId) && (
        <form onSubmit={handleSave} className="bg-amber-50/40 border border-amber-200/70 rounded-xl p-4 shadow-sm space-y-4 animate-fade-in">
          <div className="flex justify-between items-center border-b border-amber-200/50 pb-2">
            <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              {editingId ? "Editar horario seleccionado" : "Agregar nuevo horario de clases"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-stone-400 hover:text-stone-605 cursor-pointer p-0.5 rounded-full hover:bg-stone-200/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            
            {/* Materia choice */}
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Materia</label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {/* Append custom entered subject option if it isn't in categories */}
                  {!categories.includes(subject) && subject && (
                    <option value={subject}>{subject}</option>
                  )}
                </select>
              </div>
            </div>

            {/* Día de la semana */}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Día de la semana</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Start / End Hours */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Inicio</label>
                <input
                  type="text"
                  placeholder="08:00"
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                  title="Formato HH:MM de 24 horas (ej. 08:30 o 13:15)"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Fin</label>
                <input
                  type="text"
                  placeholder="09:30"
                  pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                  title="Formato HH:MM de 24 horas (ej. 09:30 o 15:00)"
                />
              </div>
            </div>

            {/* Aula */}
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Aula / Salón (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Aula 12, Planta Alta..."
                value={classroom}
                onChange={(e) => setClassroom(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

          </div>

          <div className="flex justify-end gap-2 text-xs pt-1">
            <button
              type="button"
              onClick={resetForm}
              className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium cursor-pointer transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold cursor-pointer transition flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              {editingId ? "Guardar cambios" : "Añadir horario"}
            </button>
          </div>
        </form>
      )}

      {/* Grid of days */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {DAYS.map((day) => {
          const daySchedules = getSchedulesByDay(day);
          const isToday = day === todaySpanish;

          return (
            <div
              key={day}
              className={`border rounded-xl overflow-hidden shadow-2sm flex flex-col min-h-[160px] ${
                isToday
                  ? "bg-amber-50/30 border-amber-300 ring-2 ring-amber-500/20"
                  : "bg-white border-stone-200"
              }`}
            >
              {/* Day Header */}
              <div
                className={`px-3.5 py-2.5 flex items-center justify-between border-b ${
                  isToday
                    ? "bg-amber-500 text-white border-amber-500"
                    : "bg-stone-50 text-stone-700 border-stone-100"
                }`}
              >
                <span className="text-xs font-bold uppercase tracking-wider font-display">
                  {day}
                </span>
                {isToday && (
                  <span className="text-[10px] font-mono leading-none bg-white text-amber-700 font-extrabold px-1.5 py-1.2 rounded-full flex items-center gap-0.5 animate-pulse">
                    <Sparkles className="w-3 h-3 fill-amber-700" /> HOY
                  </span>
                )}
              </div>

              {/* Schedules list */}
              <div className="p-3 flex-1 flex flex-col gap-2.5">
                {daySchedules.length > 0 ? (
                  daySchedules.map((sched) => (
                    <div
                      key={sched.id}
                      className="group bg-white border border-stone-150 rounded-lg p-2.5 hover:border-amber-200 hover:shadow-2sm transition flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div>
                          <h4 className="text-xs font-bold text-stone-800 line-clamp-2">
                            {sched.subject}
                          </h4>
                          <div className="flex items-center gap-1 text-[10px] text-stone-500 mt-1">
                            <Clock className="w-3.5 h-3.5 text-stone-400" />
                            <span className="font-mono">
                              {sched.startTime} hs - {sched.endTime} hs
                            </span>
                          </div>
                          {sched.classroom && (
                            <div className="flex items-center gap-1 text-[10px] text-stone-500 mt-0.5 font-sans">
                              <MapPin className="w-3.5 h-3.5 text-stone-400" />
                              <span className="truncate">{sched.classroom}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Edit/Delete controls shown on hover or easily in layout */}
                        <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(sched)}
                            className="p-1 text-stone-400 hover:text-indigo-650 hover:bg-stone-100 rounded transition cursor-pointer"
                            title="Editar clase"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(sched.id, sched.subject)}
                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Eliminar clase"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-4 text-center text-stone-400">
                    <p className="text-[11px] italic">Sin clases agendadas</p>
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
