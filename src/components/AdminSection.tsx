import { useState, useEffect } from "react";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Check, X, Shield, Users, Clock, UserCheck, UserX, Search, Trash2 } from "lucide-react";

interface AdminUserRecord {
  uid: string;
  email: string;
  name: string;
  status: "pending" | "accepted" | "rejected";
  isAdmin: boolean;
  requestedAt?: string;
  acceptedAt?: string;
  notes?: string;
}

interface AdminSectionProps {
  theme: "claro" | "oscuro";
}

export default function AdminSection({ theme }: AdminSectionProps) {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AdminUserRecord[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as AdminUserRecord);
      });
      // Sort: pending first, then by date requested
      list.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        const dateA = a.requestedAt || "";
        const dateB = b.requestedAt || "";
        return dateB.localeCompare(dateA);
      });
      setUsers(list);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleApprove = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        status: "accepted",
        acceptedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error approving user:", error);
      alert("No se pudo aprobar al usuario.");
    }
  };

  const handleReject = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        status: "rejected"
      });
    } catch (error) {
      console.error("Error rejecting user:", error);
      alert("No se pudo rechazar al usuario.");
    }
  };

  const handleDeleteRecord = async (uid: string, name: string) => {
    if (window.confirm(`¿Seguro que quieres eliminar el registro de ${name}?`)) {
      try {
        await deleteDoc(doc(db, "users", uid));
      } catch (error) {
        console.error("Error deleting user record:", error);
        alert("No se pudo eliminar el registro.");
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.notes && u.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterStatus === "all" || u.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const pendingCount = users.filter((u) => u.status === "pending").length;
  const acceptedCount = users.filter((u) => u.status === "accepted").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-amber-100">
        <div>
          <h2 className="text-xl font-display font-bold flex items-center gap-2 text-amber-900 oscuro:text-amber-400">
            <Shield className="w-5 h-5 text-red-500" />
            Panel de Administración
          </h2>
          <p className="text-xs text-stone-500 oscuro:text-stone-400">
            Gestiona los estudiantes y administradores registrados en la plataforma StudyPlanner.
          </p>
        </div>

        {/* Quick Statistics */}
        <div className="flex gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-amber-100 oscuro:bg-amber-950/40 text-amber-800 oscuro:text-amber-300 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {pendingCount} Pendientes
          </span>
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 oscuro:bg-emerald-950/40 text-emerald-800 oscuro:text-emerald-300 font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {acceptedCount} Activos
          </span>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o motivación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-9 pr-4 py-2 text-sm rounded-xl border outline-none transition-all ${
              theme === "oscuro"
                ? "bg-stone-850 border-stone-700 text-stone-100 focus:border-amber-500"
                : "bg-[#fdfbf6] border-amber-100 text-stone-800 focus:border-amber-400 focus:bg-white"
            }`}
          />
        </div>

        <div className="flex gap-1.5">
          {(["all", "pending", "accepted", "rejected"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider border select-none cursor-pointer transition-all ${
                filterStatus === status
                  ? "bg-amber-500 border-amber-500 text-white"
                  : theme === "oscuro"
                  ? "bg-stone-850 border-stone-700 text-stone-400 hover:text-stone-200"
                  : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50"
              }`}
            >
              {status === "all"
                ? "Todos"
                : status === "pending"
                ? "Pendientes"
                : status === "accepted"
                ? "Aceptados"
                : "Rechazados"}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="py-12 text-center text-stone-500">Cargando lista de usuarios...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-12 text-center rounded-2xl border-2 border-dashed border-stone-200 oscuro:border-stone-800 text-stone-500">
          No se encontraron usuarios que coincidan con la búsqueda o filtro.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((u) => (
            <div
              key={u.uid}
              className={`p-4 border-2 rounded-2xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                u.status === "pending"
                  ? "border-amber-300 bg-amber-50/10"
                  : u.status === "accepted"
                  ? "border-emerald-100 dark:border-emerald-950/40"
                  : "border-stone-200 oscuro:border-stone-850 opacity-75"
              } ${theme === "oscuro" ? "bg-stone-850/40" : "bg-white"}`}
            >
              {/* Profile Details */}
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-sm text-stone-900 oscuro:text-stone-100">{u.name}</span>
                  <span className="text-xs text-stone-500 oscuro:text-stone-400">({u.email})</span>
                  
                  {/* Status Badge */}
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      u.status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : u.status === "accepted"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-850"
                    }`}
                  >
                    {u.status === "pending"
                      ? "Pendiente"
                      : u.status === "accepted"
                      ? "Aceptado"
                      : "Rechazado"}
                  </span>

                  {u.isAdmin && (
                    <span className="text-[9px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5">
                      <Shield className="w-2.5 h-2.5" /> Admin
                    </span>
                  )}
                </div>

                {/* Notes/Motivation */}
                {u.notes && (
                  <p className="text-xs text-stone-600 oscuro:text-stone-300 italic bg-amber-50/20 dark:bg-stone-900/30 p-2 rounded-lg border border-amber-500/10">
                    <span className="font-bold not-italic text-[10px] text-amber-800 dark:text-amber-400 block mb-0.5 uppercase tracking-wider">
                      Motivo / Mensaje de registro:
                    </span>
                    "{u.notes}"
                  </p>
                )}

                {/* Dates */}
                <div className="text-[10px] text-stone-400 font-mono flex flex-wrap gap-x-4 gap-y-1">
                  {u.requestedAt && (
                    <span>Solicitado: {new Date(u.requestedAt).toLocaleString("es-AR")}</span>
                  )}
                  {u.acceptedAt && u.status === "accepted" && (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Aprobado: {new Date(u.acceptedAt).toLocaleString("es-AR")}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {u.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleApprove(u.uid)}
                      className="p-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer select-none transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Aceptar
                    </button>
                    <button
                      onClick={() => handleReject(u.uid)}
                      className="p-1.5 px-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer select-none transition-colors"
                    >
                      <UserX className="w-3.5 h-3.5" /> Rechazar
                    </button>
                  </>
                )}

                {u.status !== "pending" && !u.isAdmin && (
                  <button
                    onClick={() => handleApprove(u.uid)}
                    className="p-1.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs font-semibold flex items-center gap-1 cursor-pointer select-none transition-colors"
                  >
                    Re-Aceptar
                  </button>
                )}

                {!u.isAdmin && (
                  <button
                    onClick={() => handleDeleteRecord(u.uid, u.name)}
                    className="p-2 rounded-xl text-stone-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
