import React, { useState } from "react";
import { CalendarEvent } from "../types";
import { ChevronLeft, ChevronRight, Plus, Trash, Calendar, Gift, Star, Award, MapPin } from "lucide-react";

interface CalendarSectionProps {
  events: CalendarEvent[];
  onUpdateEvents: (events: CalendarEvent[]) => void;
}

export default function CalendarSection({ events, onUpdateEvents }: CalendarSectionProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 17)); // Baseline June 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-06-17");

  // Event modal / form state
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"examen" | "acto_escolar" | "feriado" | "otro">("examen");
  const [description, setDescription] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Days calculations for the month grid
  const firstDayOfMonth = new Date(year, month, 1);
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday, 1 is Monday...
  // Shift Sunday to be last (Monday = 0, Sunday = 6) or keep standard.
  // Let's keep standard (Sunday=0, Monday=1, etc.) but format columns: Dom, Lun, Mar, Mie, Jue, Vie, Sab
  const numDaysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to format Date target as YYYY-MM-DD
  const formatDateString = (y: number, m: number, d: number) => {
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    return `${y}-${mm}-${dd}`;
  };

  const handleDateChange = (dateVal: string) => {
    setSelectedDateStr(dateVal);
    if (dateVal) {
      const parts = dateVal.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1; // 0-indexed month
        const d = parseInt(parts[2], 10);
        const nextDate = new Date(y, m, d);
        if (!isNaN(nextDate.getTime())) {
          setCurrentDate(nextDate);
        }
      }
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDateStr) return;

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: title.trim(),
      date: selectedDateStr,
      type,
      description: description.trim() ? description.trim() : undefined,
    };

    onUpdateEvents([...events, newEvent]);
    setTitle("");
    setType("examen");
    setDescription("");
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter((ev) => ev.id !== id);
    onUpdateEvents(updated);
  };

  // Generate blank spots before start of month
  const blanks = Array(startDayOfWeek).fill(null);
  // Generate days of month
  const dayNumbers = Array.from({ length: numDaysInMonth }, (_, i) => i + 1);
  const totalSlots = [...blanks, ...dayNumbers];

  const getEventsForDate = (dateStr: string) => {
    return events.filter((ev) => ev.date === dateStr);
  };

  const getEventTypeBadgeColor = (t: string) => {
    switch (t) {
      case "examen":
        return "bg-rose-500 text-white";
      case "acto_escolar":
        return "bg-amber-500 text-white";
      case "feriado":
        return "bg-sky-500 text-white";
      default:
        return "bg-indigo-500 text-white";
    }
  };

  const getEventTypeLabel = (t: string) => {
    switch (t) {
      case "examen": return "📝 Examen";
      case "acto_escolar": return "🎪 Acto Escolar";
      case "feriado": return "🏖️ Feriado";
      default: return "📌 Evento";
    }
  };

  const getEventDotColor = (t: string) => {
    switch (t) {
      case "examen": return "bg-rose-500";
      case "acto_escolar": return "bg-amber-500";
      case "feriado": return "bg-sky-500";
      default: return "bg-indigo-500";
    }
  };

  // Sort upcoming events for the year/month
  const upcomingEvents = events
    .filter((ev) => {
      const evDate = new Date(ev.date + "T12:00:00");
      return evDate.getFullYear() === year && evDate.getMonth() === month;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna Izquierda: Grid de Calendario */}
      <div className="lg:col-span-8 bg-white border border-stone-200 rounded-xl p-5 shadow-sm overflow-hidden">
        {/* Cabecera del Calendario de la Agenda */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-4">
          <div className="flex items-center gap-1">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="font-display font-bold text-lg text-stone-800">
              {monthNames[month]} <span className="text-gray-400 font-light">{year}</span>
            </h3>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={prevMonth}
              className="p-1 px-2.5 rounded bg-amber-50 hover:bg-amber-100/70 text-amber-800 transition active:scale-95"
              title="Mes Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(2026, 5, 17))}
              className="px-2 py-1 text-xs font-semibold rounded bg-stone-100 text-stone-600 hover:bg-stone-200"
            >
              Hoy
            </button>
            <button
              onClick={nextMonth}
              className="p-1 px-2.5 rounded bg-amber-50 hover:bg-amber-100/70 text-amber-800 transition active:scale-95"
              title="Mes Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Nombres de los Días de la Semana */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-stone-400 uppercase tracking-wider mb-2 select-none">
          <div>Dom</div>
          <div>Lun</div>
          <div>Mar</div>
          <div>Mié</div>
          <div>Jue</div>
          <div>Vie</div>
          <div>Sáb</div>
        </div>

        {/* Cuadrícula de Días */}
        <div className="grid grid-cols-7 gap-1.5">
          {totalSlots.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square bg-stone-50/40 rounded-lg border border-dashed border-stone-100"></div>;
            }

            const currentStr = formatDateString(year, month, day);
            const isSelected = selectedDateStr === currentStr;
            const dayEvents = getEventsForDate(currentStr);
            const isToday = year === 2026 && month === 5 && day === 17; // Fake check relative to target mockup

            return (
              <button
                key={`day-${day}`}
                onClick={() => setSelectedDateStr(currentStr)}
                className={`aspect-square p-1.5 flex flex-col justify-between items-start rounded-lg border transition-all cursor-pointer relative ${
                  isSelected
                    ? "bg-indigo-50 border-indigo-400 text-indigo-900 ring-2 ring-indigo-200 ring-offset-1"
                    : isToday
                    ? "bg-amber-50 border-amber-300 text-amber-900 font-bold"
                    : "bg-white hover:bg-stone-50 text-stone-700 border-stone-200"
                }`}
              >
                <div className="flex justify-between w-full items-center">
                  <span className={`text-xs font-bold ${isToday ? "bg-amber-400 text-stone-950 px-1.5 rounded-full" : ""}`}>
                    {day}
                  </span>
                  {isToday && <span className="text-[9px] font-hand font-bold text-amber-700 leading-none">Hoy</span>}
                </div>

                {/* Dots representando Eventos */}
                <div className="flex flex-wrap gap-1 max-w-full overflow-hidden mt-1 h-3.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className={`w-2 h-2 rounded-full ${getEventDotColor(ev.type)} flex-shrink-0`}
                      title={`${ev.title} - ${getEventTypeLabel(ev.type)}`}
                    ></span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] font-bold text-[8px] text-gray-400 leading-none">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Formulario de Agregar Evento para la Fecha Elegida */}
        <div className="mt-5 border-t border-stone-100 pt-4">
          <p className="text-xs text-stone-500 font-medium mb-3">
            Crear o editar evento para el <span className="font-bold underline text-indigo-700">{selectedDateStr ? new Date(selectedDateStr + "T12:00:00").toLocaleDateString("es-ES", { day: 'numeric', month: 'long', year: 'numeric' }) : "ningún día seleccionado"}</span>
          </p>

          <form onSubmit={handleAddEvent} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-4">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Título del Evento / Examen</label>
                <input
                  type="text"
                  placeholder="Título: Examen de Historia, Acto Patrio..."
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Fecha (Editable 📅)</label>
                <input
                  type="date"
                  required
                  value={selectedDateStr}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Categoría / Tipo</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-2 py-1.5 border border-stone-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                >
                  <option value="examen">📝 Examen / Entrega</option>
                  <option value="acto_escolar">🎪 Acto Escolar</option>
                  <option value="feriado">🏖️ Feriado / Festivo</option>
                  <option value="otro">📌 Otro Evento / Recordatorio</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer py-1.5 rounded-lg text-xs font-display font-medium shadow-sm transition flex justify-center items-center gap-1 h-[34px]"
                >
                  <Plus className="w-3.5 h-3.5" /> Guardar
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Descripción u horario (Opcional)</label>
              <input
                type="text"
                placeholder="Breve descripción u horario del evento (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Columna Derecha: Próximos Eventos del Mes */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        {/* Agenda Post-it de Próximos Eventos */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 shadow-sm relative overflow-hidden pr-2">
          {/* Alfiler decorativo arriba */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-sky-500 rounded-full border-b border-sky-700 shadow-md flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-sky-200 rounded-full"></div>
          </div>

          <h3 className="font-hand font-bold text-2xl text-yellow-800 text-center mb-4 mt-2">
            🗒️ Agenda de {monthNames[month]}
          </h3>

          <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-2">
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-yellow-700 text-xs italic">No hay exámenes ni feriados cargados para este mes.</p>
                <p className="font-hand text-lg text-amber-700 mt-1">¡Un mes súper relajado!</p>
              </div>
            ) : (
              upcomingEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white/80 border-l-4 border-l-amber-500 border border-yellow-101 p-3 rounded-r-lg shadow-sm space-y-1 relative group hover:bg-white"
                >
                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="absolute top-1.5 right-1.5 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded cursor-pointer"
                    title="Eliminar evento"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Día {ev.date.split("-")[2]}
                    </span>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded ${getEventTypeBadgeColor(ev.type)}`}>
                      {ev.type === "examen" ? "Examen" : ev.type === "acto_escolar" ? "Acto" : ev.type === "feriado" ? "Feriado" : "Evento"}
                    </span>
                  </div>

                  <h4 className="font-semibold text-stone-800 text-xs">{ev.title}</h4>
                  {ev.description && (
                    <p className="text-stone-500 font-sans text-[11px] leading-tight flex items-center gap-1">
                      <span>• {ev.description}</span>
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Guía Escolar / Leyenda */}
        <div className="bg-[#fbfcfa] border border-stone-200 rounded-xl p-4 shadow-sm text-xs text-stone-600 space-y-3">
          <h4 className="font-bold text-stone-800 border-b border-stone-100 pb-1 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" />
            Leyenda de Colores
          </h4>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span>
              <span>Exámenes / Entregas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span>
              <span>Actos Escolares</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-sky-500 inline-block"></span>
              <span>Feriados / Puentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-indigo-500 inline-block"></span>
              <span>Otros Eventos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
