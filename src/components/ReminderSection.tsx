import React, { useState, useEffect } from "react";
import { Reminder } from "../types";
import { Plus, Trash, Clock, Bell, BellOff, Calendar, Pin, Square, CheckSquare, ShieldCheck, AlertTriangle } from "lucide-react";

interface ReminderSectionProps {
  reminders: Reminder[];
  onUpdateReminders: (reminders: Reminder[]) => void;
  notificationPermission: string;
  onRequestNotificationPermission: () => void;
}

const PASTEL_COLORS = [
  "bg-pink-100 hover:bg-pink-200/95 border-pink-200 text-pink-900",
  "bg-sky-100 hover:bg-sky-200/95 border-sky-200 text-sky-900",
  "bg-amber-100 hover:bg-amber-200/95 border-amber-200 text-amber-900",
  "bg-emerald-100 hover:bg-emerald-200/95 border-emerald-200 text-emerald-900",
  "bg-purple-100 hover:bg-purple-200/95 border-purple-200 text-purple-900"
];

export default function ReminderSection({
  reminders,
  onUpdateReminders,
  notificationPermission,
  onRequestNotificationPermission
}: ReminderSectionProps) {
  const [title, setTitle] = useState("");
  const [datetime, setDatetime] = useState("");

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !datetime) return;

    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      title: title.trim(),
      datetime,
      completed: false
    };

    onUpdateReminders([newReminder, ...reminders]);
    setTitle("");
    setDatetime("");
  };

  const handleToggleReminder = (id: string) => {
    const updated = reminders.map((rem) =>
      rem.id === id ? { ...rem, completed: !rem.completed } : rem
    );
    onUpdateReminders(updated);
  };

  const handleDeleteReminder = (id: string) => {
    const updated = reminders.filter((rem) => rem.id !== id);
    onUpdateReminders(updated);
  };

  const calculateTimeRemaining = (targetDatetime: string) => {
    const now = new Date();
    const target = new Date(targetDatetime);
    const diffMs = target.getTime() - now.getTime();

    if (diffMs < 0) {
      return { text: "Vencido", critical: true };
    }

    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 1) {
      const minutes = Math.floor(diffMs / (1000 * 60));
      return { text: `En ${minutes} min`, critical: true };
    }

    if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return { text: `En ${hours} hr`, critical: diffHours < 3 };
    }

    const days = Math.floor(diffHours / 24);
    return { text: `En ${days} día${days > 1 ? "s" : ""}`, critical: false };
  };

  // Sort: pending first, then by datetime ascending
  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    return new Date(a.datetime).getTime() - new Date(b.datetime).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Notification API Status and Permission Request Banner */}
      <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm transition-all duration-300 ${
        notificationPermission === "granted"
          ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-900 dark:text-emerald-300"
          : notificationPermission === "denied"
          ? "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30 text-rose-900 dark:text-rose-300"
          : "bg-amber-50 dark:bg-amber-950/25 border-amber-200 dark:border-amber-900/35 text-amber-900 dark:text-amber-300"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg flex-shrink-0 ${
            notificationPermission === "granted"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : notificationPermission === "denied"
              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          }`}>
            {notificationPermission === "granted" ? (
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : notificationPermission === "denied" ? (
              <BellOff className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            ) : (
              <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div>
            <h4 className="font-bold flex items-center gap-1.5 font-display text-stone-850 dark:text-stone-100">
              {notificationPermission === "granted"
                ? "Alertas Push de Escritorio Activas"
                : notificationPermission === "denied"
                ? "Notificaciones Bloqueadas en Navegador"
                : "Recibe Avisos de Estudio en Tiempo Real"}
            </h4>
            <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5 font-sans leading-relaxed">
              {notificationPermission === "granted"
                ? "Estupendo. Te enviaremos una alerta de pantalla en tiempo real en cuanto se cumpla la hora de tus recordatorios."
                : notificationPermission === "denied"
                ? "Permisos bloqueados. Para activarlos, haz clic en el candado junto a la dirección web y cambia el permiso de Notificaciones a 'Permitir'."
                : "Habilita las notificaciones nativas del navegador para recibir alertas sobre tus tareas y exámenes escolares pendientes."}
            </p>
          </div>
        </div>

        {notificationPermission === "default" && (
          <button
            onClick={onRequestNotificationPermission}
            className="w-full sm:w-auto self-start sm:self-center flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Activar Alertas</span>
          </button>
        )}
      </div>

      {/* Formulario Agregar Recordatorio */}
      <div id="add-reminder-form" className="bg-sky-50/70 border border-sky-200 rounded-xl p-5 shadow-sm relative">
        <h3 className="font-display font-bold text-lg text-sky-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-sky-600" />
          <span>Fijar Nuevo Recordatorio</span>
        </h3>

        <form onSubmit={handleAddReminder} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-sky-800 mb-1">¿Qué necesitas recordar? *</label>
            <input
              id="reminder-title-input"
              type="text"
              placeholder="Ej: Repasar apuntes de inglés antes de dormir"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-sky-200 rounded-lg bg-white/95 text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-gray-400 font-sans"
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="block text-xs font-semibold text-sky-800 mb-1">Fecha y Hora *</label>
            <input
              id="reminder-datetime-input"
              type="datetime-local"
              required
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full px-3 py-2 border border-sky-200 rounded-lg bg-white/95 text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-400 font-sans"
            />
          </div>

          <button
            id="reminder-submit-button"
            type="submit"
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white cursor-pointer px-4 py-2 rounded-lg font-display text-sm font-bold shadow-sm transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Fijar</span>
          </button>
        </form>
      </div>

      {/* Listado de Recordatorios: Estilo Muro de Post-it Notes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-hand font-bold text-2xl text-stone-700">📌 Corcho de Alertas</h4>
          <span className="text-[10px] font-mono text-stone-400">Total: {reminders.length}</span>
        </div>

        {reminders.length === 0 ? (
          <div className="bg-stone-50 border border-dashed border-stone-200 rounded-xl p-10 text-center">
            <p className="text-stone-400 text-sm">No tienes ningún recordatorio fijado.</p>
            <p className="font-hand text-lg text-sky-600 mt-1">¡Todo bajo control!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sortedReminders.map((rem, i) => {
              const colorClass = rem.completed
                ? "bg-stone-100 hover:bg-stone-150 border-stone-200 text-stone-500 line-through opacity-75"
                : PASTEL_COLORS[i % PASTEL_COLORS.length];

              const timeStatus = calculateTimeRemaining(rem.datetime);

              return (
                <div
                  key={rem.id}
                  className={`border p-4.5 rounded-lg shadow-sm transition-all duration-200 relative group flex flex-col justify-between min-h-[140px] transform ${
                    rem.completed ? "rotate-0 scale-98" : i % 2 === 0 ? "rotate-1" : "-rotate-1"
                  }`}
                >
                  {/* Pin Decorativo arriba en el centro */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 select-none">
                    <Pin className={`w-4 h-4 ${rem.completed ? "text-stone-400" : "text-rose-500"} fill-current`} />
                  </div>

                  {/* Acciones e Indicadores */}
                  <div className="space-y-2 mt-1">
                    <div className="flex justify-between items-start gap-2">
                      <button
                        onClick={() => handleToggleReminder(rem.id)}
                        className="text-stone-400 hover:text-stone-800 transition-colors pt-0.5 cursor-pointer"
                        title={rem.completed ? "Marcar pendiente" : "Completar recordatorio"}
                      >
                        {rem.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-500" />
                        )}
                      </button>

                      <p className={`font-hand text-lg leading-tight flex-1 font-semibold ${rem.completed ? "text-stone-400" : ""}`}>
                        {rem.title}
                      </p>
                    </div>

                    {/* Fecha y Hora del Evento */}
                    <div className="flex items-center gap-1 text-[11px] font-medium text-stone-500">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="font-sans">
                        {new Date(rem.datetime).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short"
                        })}{" "}
                        a las{" "}
                        {new Date(rem.datetime).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Pie de Nota con Countdown & Delete */}
                  <div className="flex items-center justify-between border-t border-stone-200/50 pt-2.5 mt-3">
                    <div>
                      {!rem.completed ? (
                        <span
                          className={`text-[10px] font-bold font-sans uppercase px-1.5 py-0.5 rounded-full ${
                            timeStatus.critical
                              ? "bg-rose-500 text-white animate-pulse"
                              : "bg-stone-800/10 text-stone-700"
                          }`}
                        >
                          {timeStatus.text}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold font-sans uppercase px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Resuelto
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="text-stone-400 hover:text-red-500 transition-colors p-1 rounded-full cursor-pointer focus:outline-none"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
