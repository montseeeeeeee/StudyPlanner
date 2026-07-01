import { Task, CalendarEvent, Reminder } from "../types";
import { CheckSquare, Calendar as CalendarIcon, Clock, BookOpen, AlertCircle, Bookmark, Star, ChevronRight, GraduationCap } from "lucide-react";

interface DashboardSectionProps {
  tasks: Task[];
  events: CalendarEvent[];
  reminders: Reminder[];
  categories: string[];
  setActiveTab: (tab: "dashboard" | "tasks" | "calendar" | "reminders" | "study" | "schedule" | "grades") => void;
}

export default function DashboardSection({
  tasks,
  events,
  reminders,
  categories,
  setActiveTab
}: DashboardSectionProps) {
  // Today reference is June 17, 2026 or real current date, fallback dynamically
  const getTodayDate = () => {
    // Check if we have our demo year events
    const hasDemoEvents = events.some(e => e.date.startsWith("2026-06"));
    if (hasDemoEvents) {
      return new Date("2026-06-17T00:00:00");
    }
    return new Date();
  };

  const today = getTodayDate();
  const todayStr = today.toISOString().split("T")[0];

  // 1. Tareas stats
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  // 2. Proximo examen o evento académico (earliest event that is today or in the future)
  const sortedUpcomingEvents = [...events]
    .filter(e => {
      // Compare dates as strings (YYYY-MM-DD)
      return e.date >= todayStr;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextEvent = sortedUpcomingEvents.length > 0 ? sortedUpcomingEvents[0] : null;

  // 3. Proximo recordatorio pendiente
  const pendingReminders = reminders
    .filter(r => !r.completed)
    .sort((a, b) => a.datetime.localeCompare(b.datetime));

  const nextReminder = pendingReminders.length > 0 ? pendingReminders[0] : null;

  // 4. Eventos de la semana (next 7 days starting from today)
  const oneWeekLater = new Date(today);
  oneWeekLater.setDate(today.getDate() + 7);
  const oneWeekLaterStr = oneWeekLater.toISOString().split("T")[0];

  const weekEvents = events
    .filter(e => e.date >= todayStr && e.date <= oneWeekLaterStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Helper formatting dates beautifully in Spanish
  const formatDateSpanish = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T12:00:00");
      return d.toLocaleDateString("es-ES", { day: 'numeric', month: 'short', weekday: 'short' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div id="dashboard-section" className="space-y-6">
      
      {/* Bienvenida y Cabecera del Alumno */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/50 rounded-2xl p-5 shadow-2sm relative overflow-hidden">
        <div className="absolute right-4 bottom-0 opacity-10 select-none">
          <GraduationCap className="w-40 h-40 text-amber-900" />
        </div>
        <div className="relative z-10">
          <h2 className="font-display font-bold text-xl text-amber-950 mb-1">
            👋 ¡Hola de nuevo, estudiante!
          </h2>
          <p className="text-xs text-stone-600 max-w-xl leading-relaxed">
            Este es tu informe de situación académica. Aquí podés ver de un vistazo tus tareas pendientes, tus apuntes para estudiar de forma interactiva con IA y planificar tu semana óptimamente.
          </p>
        </div>
      </div>

      {/* Bento Grid: Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Tareas Pendientes Card */}
        <div 
          onClick={() => setActiveTab("tasks")}
          className="bg-white hover:bg-amber-50/20 border border-stone-200 p-4 rounded-xl shadow-2sm hover:shadow-sm transition cursor-pointer flex items-start gap-4 group"
        >
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl group-hover:scale-110 transition">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase block">Tareas y TPs</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold font-display text-stone-800 leading-none">
                {pendingTasks.length}
              </span>
              <span className="text-xs text-stone-500">pendientes</span>
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-2 flex items-center gap-0.5">
              <span>{completedTasks.length} terminadas</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Materias Card */}
        <div 
          onClick={() => setActiveTab("tasks")}
          className="bg-white hover:bg-emerald-50/20 border border-stone-200 p-4 rounded-xl shadow-2sm hover:shadow-sm transition cursor-pointer flex items-start gap-4 group"
        >
          <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl group-hover:scale-110 transition">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase block">Plan de Estudios</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold font-display text-stone-800 leading-none">
                {categories.length}
              </span>
              <span className="text-xs text-stone-500">materias registradas</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-2 flex items-center gap-0.5">
              <span>Administrar materias</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>

        {/* Alertas Recordatorios Card */}
        <div 
          onClick={() => setActiveTab("reminders")}
          className="bg-white hover:bg-sky-50/20 border border-stone-200 p-4 rounded-xl shadow-2sm hover:shadow-sm transition cursor-pointer flex items-start gap-4 group"
        >
          <div className="p-3 bg-sky-100 text-sky-800 rounded-xl group-hover:scale-110 transition">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase block">Corcho de Alertas</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-bold font-display text-stone-800 leading-none">
                {reminders.filter(r => !r.completed).length}
              </span>
              <span className="text-xs text-stone-500">alertas activas</span>
            </div>
            <div className="text-[11px] text-sky-700 font-medium mt-2 flex items-center gap-0.5">
              <span>Ver corcho de alertas</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </div>
        </div>

      </div>

      {/* Próximos de Cerca y Eventos Semanales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Próximo Examen & Recordatorios Clave */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-sm text-stone-700 flex items-center gap-1.5 px-1.5">
            <Star className="w-4 h-4 text-amber-500" />
            Enfoque Inmediato
          </h3>
          
          <div className="bg-[#fcfbf7] border border-stone-200/80 rounded-xl p-4 shadow-sm space-y-4">
            
            {/* Siguiente Examen o Evento */}
            <div>
              <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase block mb-1.5">
                📅 PRÓXIMO EXAMEN / EVENTO ACADÉMICO
              </span>
              {nextEvent ? (
                <div className="bg-white border border-stone-200 rounded-lg p-3 flex items-start gap-3 shadow-2sm">
                  <div className="h-10 w-10 shrink-0 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-col items-center justify-center font-mono text-[11px] text-indigo-700 font-bold leading-tight">
                    <span className="text-xs">{nextEvent.date.split("-")[2]}</span>
                    <span className="uppercase text-[9px] font-normal">
                      {new Date(nextEvent.date + "T12:00:00").toLocaleString("es-ES", { month: "short" })}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-800 leading-tight">
                      {nextEvent.title}
                    </h4>
                    {nextEvent.description && (
                      <p className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                        {nextEvent.description}
                      </p>
                    )}
                    <span className="inline-block mt-1.5 text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded uppercase">
                      {nextEvent.type === "examen" ? "📝 Examen / Entrega" : nextEvent.type === "acto_escolar" ? "🎪 Acto Escolar" : nextEvent.type === "feriado" ? "🌴 Feriado" : "📌 Evento"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-stone-500 italic p-3 text-center border border-dashed border-stone-200/80 rounded-lg bg-stone-50/50">
                  No tenés exámenes o eventos programados.
                </div>
              )}
            </div>

            {/* Siguiente Alerta o Recordatorio */}
            <div>
              <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase block mb-1.5">
                ⏰ PRÓXIMA ALERTA PROGRAMADA
              </span>
              {nextReminder ? (
                <div className="bg-white border border-stone-200 rounded-lg p-3 flex items-start gap-3 shadow-2sm">
                  <div className="h-10 w-10 shrink-0 bg-sky-50 border border-sky-100 rounded-lg flex items-center justify-center text-sky-600">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-stone-800 leading-tight">
                      {nextReminder.title}
                    </h4>
                    <span className="inline-block mt-1 text-[10px] text-sky-700 font-mono font-medium">
                      🔔 {new Date(nextReminder.datetime).toLocaleString("es-ES", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} hs
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-stone-500 italic p-3 text-center border border-dashed border-stone-200/80 rounded-lg bg-stone-50/50">
                  No tenés alertas pendientes para hoy.
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Eventos de la semana (próximos 7 días) */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-sm text-stone-700 flex items-center gap-1.5 px-1.5">
            <CalendarIcon className="w-4 h-4 text-indigo-500" />
            Cronograma de la Semana
          </h3>

          <div className="bg-[#fcfbf7] border border-stone-200/80 rounded-xl p-4 shadow-sm min-h-[220px]">
            <span className="text-[10px] text-stone-400 font-mono tracking-wider uppercase block mb-3">
              📅 PRÓXIMOS 7 DÍAS
            </span>
            
            {weekEvents.length > 0 ? (
              <div className="divide-y divide-stone-100 max-h-[240px] overflow-y-auto pr-1">
                {weekEvents.map((evt) => (
                  <div key={evt.id} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-1 rounded min-w-[70px] text-center capitalize">
                        {formatDateSpanish(evt.date)}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-800 line-clamp-1">{evt.title}</p>
                        {evt.description && <p className="text-[10px] text-stone-500 line-clamp-1">{evt.description}</p>}
                      </div>
                    </div>
                    <span className="text-[9px] shrink-0 font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                      {evt.type === "examen" ? "📝 Examen" : evt.type === "acto_escolar" ? "🎪 Acto" : evt.type === "feriado" ? "🌴 Feriado" : "📌 Evento"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[140px] flex flex-col items-center justify-center text-center p-4">
                <AlertCircle className="w-7 h-7 text-stone-300 mb-1.5" />
                <p className="text-xs text-stone-500 font-medium">Tranquilo, sin compromisos programados</p>
                <p className="text-[10px] text-stone-400">No hay exámenes ni actos en los próximos 7 días.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Accesos rápidos e instructivos */}
      <div className="bg-[#f8f6f0] border border-stone-200 rounded-xl p-4">
        <h4 className="text-xs font-bold text-stone-600 mb-3 uppercase tracking-wider font-mono">⚡ Atajos del Cuaderno</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button 
            type="button"
            onClick={() => setActiveTab("schedule")}
            className="p-3 bg-white hover:bg-amber-500 hover:text-white rounded-lg border border-stone-200 text-stone-700 text-xs font-bold transition flex flex-col items-center gap-1.5 text-center shadow-3sm cursor-pointer"
          >
            <Clock className="w-5 h-5 shrink-0" />
            <span>Ver Horario</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab("grades")}
            className="p-3 bg-white hover:bg-amber-500 hover:text-white rounded-lg border border-stone-200 text-stone-700 text-xs font-bold transition flex flex-col items-center gap-1.5 text-center shadow-3sm cursor-pointer"
          >
            <GraduationCap className="w-5 h-5 shrink-0" />
            <span>Ver Promedios</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab("tasks")}
            className="p-3 bg-white hover:bg-amber-500 hover:text-white rounded-lg border border-stone-200 text-stone-700 text-xs font-bold transition flex flex-col items-center gap-1.5 text-center shadow-3sm cursor-pointer"
          >
            <CheckSquare className="w-5 h-5 shrink-0" />
            <span>Nueva Tarea/TP</span>
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab("study")}
            className="p-3 bg-white hover:bg-amber-500 hover:text-white rounded-lg border border-stone-200 text-stone-700 text-xs font-bold transition flex flex-col items-center gap-1.5 text-center shadow-3sm cursor-pointer"
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            <span>Simular Examen IA</span>
          </button>
        </div>
      </div>

    </div>
  );
}
