import { useState, useEffect, FormEvent } from "react";
import { SubjectGrade, GradeItem } from "../types";
import { Plus, Trash2, Award, BookOpen, Calculator, Sparkles, Check, AlertTriangle, HelpCircle } from "lucide-react";

interface GradesSectionProps {
  categories: string[];
  subjectGrades?: SubjectGrade[];
  onUpdateSubjectGrades?: (grades: SubjectGrade[]) => void;
  passingScore?: number;
  onUpdatePassingScore?: (score: number) => void;
}

export default function GradesSection({
  categories,
  subjectGrades: subjectGradesProp,
  onUpdateSubjectGrades,
  passingScore: passingScoreProp,
  onUpdatePassingScore
}: GradesSectionProps) {
  // Load grades from localStorage, fallback to empty or demo grades
  const [subjectGradesLocal, setSubjectGradesLocal] = useState<SubjectGrade[]>(() => {
    const saved = localStorage.getItem("sp_subject_grades");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    
    // Default demo mock grades for a useful starting experience
    return [
      {
        id: "grade-demo-1",
        subject: "Matemáticas",
        grades: [
          { id: "g1", name: "Parcial 1", score: 8 },
          { id: "g2", name: "Trabajo Práctico 1", score: 7 },
          { id: "g3", name: "Lección Oral", score: 9 }
        ]
      },
      {
        id: "grade-demo-2",
        subject: "Historia",
        grades: [
          { id: "g4", name: "Ensayo Revolución", score: 5 },
          { id: "g5", name: "Examen Cuatrimestral", score: 7 }
        ]
      },
      {
        id: "grade-demo-3",
        subject: "Ciencias",
        grades: [
          { id: "g6", name: "Informe laboratorio", score: 4 },
          { id: "g7", name: "Maqueta Célula", score: 5 }
        ]
      }
    ];
  });

  const subjectGrades = subjectGradesProp !== undefined ? subjectGradesProp : subjectGradesLocal;
  const setSubjectGrades = onUpdateSubjectGrades !== undefined ? onUpdateSubjectGrades : setSubjectGradesLocal;

  // Save to localStorage whenever grades change
  useEffect(() => {
    if (subjectGradesProp === undefined) {
      localStorage.setItem("sp_subject_grades", JSON.stringify(subjectGrades));
    }
  }, [subjectGrades, subjectGradesProp]);

  // Passing grade threshold - default 6, but customizable and persistent!
  const [passingScoreLocal, setPassingScoreLocal] = useState<number>(() => {
    const saved = localStorage.getItem("sp_passing_score");
    return saved ? parseFloat(saved) : 6;
  });

  const passingScore = passingScoreProp !== undefined ? passingScoreProp : passingScoreLocal;
  const setPassingScore = onUpdatePassingScore !== undefined ? onUpdatePassingScore : setPassingScoreLocal;

  // Save passingScore to localStorage whenever it changes
  useEffect(() => {
    if (passingScoreProp === undefined) {
      localStorage.setItem("sp_passing_score", passingScore.toString());
    }
  }, [passingScore, passingScoreProp]);

  // Interface view & edit states
  const [selectedSubject, setSelectedSubject] = useState<string>(categories[0] || "Matemáticas");
  
  // Grade input form states
  const [gradeName, setGradeName] = useState("");
  const [gradeScoreStr, setGradeScoreStr] = useState("");

  const handleAddGrade = (e: FormEvent) => {
    e.preventDefault();
    const score = parseFloat(gradeScoreStr);
    if (isNaN(score) || score < 1 || score > 10) {
      alert("Por favor ingresá una nota válida del 1 al 10.");
      return;
    }
    if (!gradeName.trim()) {
      alert("Por favor escribí el motivo/nombre de la calificación (Ej: Evaluación 1).");
      return;
    }

    const newGrade: GradeItem = {
      id: "grade-item-" + Date.now(),
      name: gradeName.trim(),
      score: score
    };

    // Find if subject record already exists in the list
    const existingIndex = subjectGrades.findIndex(sg => sg.subject === selectedSubject);

    if (existingIndex !== -1) {
      const updated = [...subjectGrades];
      updated[existingIndex] = {
        ...updated[existingIndex],
        grades: [...updated[existingIndex].grades, newGrade]
      };
      setSubjectGrades(updated);
    } else {
      const newSubjectGrade: SubjectGrade = {
        id: "subject-grade-" + Date.now(),
        subject: selectedSubject,
        grades: [newGrade]
      };
      setSubjectGrades([...subjectGrades, newSubjectGrade]);
    }

    // Reset fields
    setGradeName("");
    setGradeScoreStr("");
  };

  const handleDeleteGradeItem = (subjectId: string, gradeItemId: string) => {
    const updated = subjectGrades.map(sg => {
      if (sg.id === subjectId) {
        return {
          ...sg,
          grades: sg.grades.filter(g => g.id !== gradeItemId)
        };
      }
      return sg;
    }).filter(sg => sg.grades.length > 0); // Keep subjects with at least 1 grade or clean up

    setSubjectGrades(updated);
  };

  const handleDeleteWholeSubject = (id: string, name: string) => {
    if (window.confirm(`¿Seguro que querés limpiar todas las notas de la materia "${name}"?`)) {
      setSubjectGrades(subjectGrades.filter(sg => sg.id !== id));
    }
  };

  const handleUpdateRetakeScore = (subjectId: string, gradeItemId: string, val: number) => {
    const updated = subjectGrades.map(sg => {
      if (sg.id === subjectId) {
        return {
          ...sg,
          grades: sg.grades.map(g => {
            if (g.id === gradeItemId) {
              return {
                ...g,
                retakeScore: isNaN(val) ? undefined : val
              };
            }
            return g;
          })
        };
      }
      return sg;
    });
    setSubjectGrades(updated);
  };

  // Calculations
  const calculateSubjectStats = (sg: SubjectGrade) => {
    if (sg.grades.length === 0) return { average: 0, count: 0, status: "Sin notas" };
    const sum = sg.grades.reduce((acc, current) => {
      const finalScore = current.retakeScore !== undefined ? current.retakeScore : current.score;
      return acc + finalScore;
    }, 0);
    const average = parseFloat((sum / sg.grades.length).toFixed(2));
    const isApproved = average >= passingScore;
    return {
      average,
      count: sg.grades.length,
      status: isApproved ? "Aprobado" : "Desaprobado"
    };
  };

  // General Average across all graded subjects
  const getOverallStats = () => {
    let totalsSum = 0;
    let countedSubjects = 0;

    subjectGrades.forEach(sg => {
      if (sg.grades.length > 0) {
        const { average } = calculateSubjectStats(sg);
        totalsSum += average;
        countedSubjects++;
      }
    });

    return {
      overallAverage: countedSubjects > 0 ? parseFloat((totalsSum / countedSubjects).toFixed(2)) : 0,
      approvedCount: subjectGrades.filter(sg => calculateSubjectStats(sg).status === "Aprobado").length,
      disapprovedCount: subjectGrades.filter(sg => calculateSubjectStats(sg).status === "Desaprobado").length
    };
  };

  const { overallAverage, approvedCount, disapprovedCount } = getOverallStats();

  return (
    <div className="space-y-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-150 pb-4">
        <div>
          <h2 className="font-display font-bold text-lg text-amber-900 flex items-center gap-2">
            📊 Calculadora de Promedios & Boletín
          </h2>
          <p className="text-xs text-stone-500 mt-1 leading-relaxed">
            Cargá las calificaciones de tus materias, calculá promedios ponderados automáticos y verificá el estado escolar de aprobación de tus cursadas.
          </p>
        </div>

        {/* Passing score picker */}
        <div className="flex items-center gap-2 bg-stone-50 p-2 rounded-lg border border-stone-200">
          <span className="text-[11px] font-bold text-stone-600">Nota de aprobación:</span>
          <input
            type="number"
            min="1"
            max="10"
            step="0.1"
            value={passingScore || ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val)) {
                // Limit range to 1 - 10
                if (val >= 1 && val <= 10) {
                  setPassingScore(val);
                }
              } else {
                setPassingScore(0); // Allow empty temporarily so they can delete/correct
              }
            }}
            onBlur={() => {
              if (!passingScore || passingScore < 1 || passingScore > 10) {
                setPassingScore(6); // default to 6 on blur if empty or invalid
              }
            }}
            placeholder="6.0"
            className="w-16 px-2 py-0.5 bg-white border border-stone-200 rounded text-xs font-mono font-bold text-center text-amber-950 focus:ring-1 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side Column: Add Grades Form & General Average card */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* General Report Summary Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-800 text-white rounded-xl p-5 shadow-md relative overflow-hidden">
            <div className="absolute right-3 bottom-1 opacity-10 select-none">
              <Calculator className="w-32 h-32 text-white" />
            </div>
            
            <span className="text-[10px] text-indigo-200 font-mono tracking-widest block uppercase font-bold">Resumen del Boletín</span>
            
            <div className="flex items-baseline gap-1 mt-2.5">
              <span className="text-4xl font-black font-display text-amber-300 leading-none">
                {overallAverage > 0 ? overallAverage : "0.00"}
              </span>
              <span className="text-xs text-indigo-100 font-medium font-sans">Promedio General</span>
            </div>

            <p className="text-[11px] text-indigo-100 mt-3 leading-relaxed">
              Basado en tus <span className="underline font-bold text-amber-300">{subjectGrades.length}</span> materias cursadas cargadas en tu libreta.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-4 border-t border-indigo-700/60 pt-3.5 text-xs">
              <div className="flex flex-col">
                <span className="text-emerald-300 font-bold flex items-center gap-1">
                  👍 {approvedCount} aprobadas
                </span>
                <span className="text-[10px] text-indigo-200">Promedio mayor o igual a {passingScore}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-rose-300 font-bold flex items-center gap-1">
                  ⚠️ {disapprovedCount} desaprobadas
                </span>
                <span className="text-[10px] text-indigo-200">Promedio menor a {passingScore}</span>
              </div>
            </div>
          </div>

          {/* Calificación Input Form */}
          <div className="bg-[#fcfbf7] border border-stone-200 rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              Cargar Calificación Escolar
            </h3>

            <form onSubmit={handleAddGrade} className="space-y-3.5">
              
              {/* Select subject */}
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Materia en la Libreta</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  {categories.length === 0 && (
                    <option value="Matemáticas">Matemáticas</option>
                  )}
                </select>
              </div>

              {/* Flex grade name option and value */}
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-8">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Concepto / Motivo</label>
                  <input
                    type="text"
                    required
                    maxLength={32}
                    placeholder="Ej: Evaluación Tema 2, TP 1..."
                    value={gradeName}
                    onChange={(e) => setGradeName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-sans focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                
                <div className="col-span-4">
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">Nota (1-10)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="1"
                    max="10"
                    placeholder="8.5"
                    value={gradeScoreStr}
                    onChange={(e) => setGradeScoreStr(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-sm cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Registrar Calificación
              </button>

            </form>
          </div>

        </div>

        {/* Right Side Column: Visual Report Card list for loaded evaluations */}
        <div className="lg:col-span-7 space-y-4">
          
          <h3 className="font-display font-bold text-sm text-stone-700 flex items-center gap-1.5 px-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            Detalle por Materia
          </h3>

          {subjectGrades.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjectGrades.map((sg) => {
                const { average, count, status } = calculateSubjectStats(sg);
                const isApproved = status === "Aprobado";

                return (
                  <div
                    key={sg.id}
                    className="bg-[#fcfbf7] border border-stone-200 rounded-xl p-3.5 flex flex-col justify-between shadow-2sm"
                  >
                    
                    {/* Header: Subject name & average */}
                    <div>
                      <div className="flex items-start justify-between gap-1 border-b border-stone-150 pb-2 mb-2">
                        <div>
                          <h4 className="text-xs font-bold text-stone-800 leading-tight">
                            {sg.subject}
                          </h4>
                          <span className="text-[10px] text-stone-400 font-mono font-medium">
                            {count} {count === 1 ? "nota registrada" : "notas registradas"}
                          </span>
                        </div>
                        
                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold block">
                            Prom: <strong className={`text-sm ${isApproved ? "text-emerald-700" : "text-rose-600"}`}>{average}</strong>
                          </span>
                          <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase leading-none mt-0.5 ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-850"
                              : "bg-rose-100 text-rose-800"
                          }`}>
                            {status}
                          </span>
                        </div>
                      </div>

                      {/* Grades list for this subject */}
                      <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                        {sg.grades.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col gap-1.5 p-2 bg-white/90 border border-stone-150 rounded-lg hover:border-amber-200 hover:shadow-3sm transition"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-stone-750 truncate max-w-[130px]" title={item.name}>
                                {item.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteGradeItem(sg.id, item.id)}
                                className="text-stone-400 hover:text-rose-600 p-0.5 rounded cursor-pointer hover:bg-rose-50"
                                title="Borrar calificación"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-1.5 border-t border-dashed border-stone-100 pt-1.5 text-[10px]">
                              {/* Original Grade */}
                              <div className="flex items-center gap-1">
                                <span className="text-stone-500">Nota orig:</span>
                                <span className={`font-mono font-extrabold px-1.5 py-0.2 rounded text-[11px] ${
                                  item.score < passingScore 
                                    ? "bg-rose-50 text-rose-700 underline decoration-rose-500 decoration-2 decoration-solid font-black" 
                                    : "bg-stone-100 text-stone-850"
                                }`}>
                                  {item.score}
                                </span>
                              </div>

                              {/* Recuperatorio Slot ("Huequito") */}
                              <div className="flex items-center gap-1">
                                <span className="text-stone-405 font-medium">Recup:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="10"
                                  step="0.1"
                                  placeholder="—"
                                  value={item.retakeScore !== undefined ? item.retakeScore : ""}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    handleUpdateRetakeScore(sg.id, item.id, val);
                                  }}
                                  className={`w-11 px-1 py-0.2 rounded text-center text-[11px] font-mono font-bold border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                                    item.retakeScore !== undefined
                                      ? item.retakeScore < passingScore
                                        ? "bg-rose-50 border-rose-300 text-rose-700 underline decoration-rose-500 decoration-2 decoration-solid"
                                        : "bg-emerald-50 border-emerald-300 text-emerald-850"
                                      : "bg-white border-dashed border-stone-300 hover:border-amber-400 text-stone-400"
                                  }`}
                                  title="Ingresá la nota del recuperatorio si corresponde"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Bottom action: Clear entire subject */}
                    <div className="mt-3.5 pt-2 border-t border-stone-150 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteWholeSubject(sg.id, sg.subject)}
                        className="text-[9px] uppercase tracking-wider text-stone-400 hover:text-rose-600 font-bold flex items-center gap-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Limpiar Materia
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-[#fcfbf7] border border-stone-200/80 border-dashed rounded-xl p-8 text-center text-stone-500 max-w-md mx-auto">
              <Calculator className="w-9 h-9 text-stone-300 mx-auto mb-2.5" />
              <p className="text-xs font-bold text-stone-700">Ninguna calificación registrada</p>
              <p className="text-[11px] text-stone-500 mt-1 max-w-xs mx-auto">
                Elegí una materia en la sección de la izquierda, completá la evaluación o concepto y hacé click en registrar para empezar a calcular tus promedios.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
