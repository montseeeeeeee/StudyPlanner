import React, { useState } from "react";
import { StudyMaterial, QuizQuestion, StudyAttempt } from "../types";
import { BookOpen, HelpCircle, Loader2, PlayCircle, Clipboard, AlertCircle, CheckCircle2, RotateCcw, Award } from "lucide-react";

interface StudyHelpSectionProps {
  studyMaterials: StudyMaterial[];
  onUpdateStudyMaterials: (materials: StudyMaterial[]) => void;
}

export default function StudyHelpSection({ studyMaterials, onUpdateStudyMaterials }: StudyHelpSectionProps) {
  const [inputText, setInputText] = useState("");
  const [title, setTitle] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null);

  // Active quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCreateQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setErrorMessage("");
    setIsLoading(true);

    const materialTitle = title.trim() || `Material del ${new Date().toLocaleDateString("es-ES")}`;

    try {
      const response = await fetch("/api/study-help/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText.trim(),
          count: questionCount
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al conectar con la IA de StudyPlanner.");
      }

      const data = await response.json();
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("El servidor devolvió un formato de preguntas inválido.");
      }

      const newMaterial: StudyMaterial = {
        id: crypto.randomUUID(),
        title: materialTitle,
        text: inputText.trim(),
        questions: data.questions,
        attempts: []
      };

      onUpdateStudyMaterials([newMaterial, ...studyMaterials]);
      setActiveMaterialId(newMaterial.id);
      
      // Reset input form
      setInputText("");
      setTitle("");
      setSelectedAnswers({});
      setQuizSubmitted(false);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "No se pudieron generar las preguntas. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (questionIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: optionIndex,
    });
  };

  const handleSubmitQuiz = (material: StudyMaterial) => {
    // Check if everything is answered
    const unansweredCount = material.questions.filter((_, idx) => selectedAnswers[idx] === undefined).length;
    if (unansweredCount > 0) {
      if (!window.confirm(`Aún te quedan ${unansweredCount} preguntas por responder. ¿Querés terminar el cuestionario de todas formas?`)) {
        return;
      }
    }

    setQuizSubmitted(true);

    // Calculate score
    let correctCount = 0;
    material.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const newAttempt: StudyAttempt = {
      correctCount,
      totalCount: material.questions.length,
      timestamp: new Date().toISOString(),
      answers: selectedAnswers,
    };

    const updatedMaterials = studyMaterials.map((m) => {
      if (m.id === material.id) {
        return {
          ...m,
          attempts: [newAttempt, ...m.attempts]
        };
      }
      return m;
    });

    onUpdateStudyMaterials(updatedMaterials);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizSubmitted(false);
  };

  const activeMaterial = studyMaterials.find((m) => m.id === activeMaterialId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Columna Izquierda: Generador de Cuestionarios / Formulario */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        
        {/* Card para Crear Cuestionario */}
        <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-5 shadow-sm relative overflow-hidden">
          {/* Anillos de espiral decorativos */}
          <div className="absolute top-0 left-6 right-6 h-2 flex justify-start gap-4">
            <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-md -mt-1 select-none"></span>
            <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-md -mt-1 select-none"></span>
            <span className="w-1.5 h-3.5 bg-stone-300 rounded-b shadow-md -mt-1 select-none"></span>
          </div>

          <h3 className="font-display font-bold text-lg text-emerald-900 mb-3 flex items-center gap-1.5 mt-2">
            <BookOpen className="w-5 h-5 text-emerald-700" />
            Entrená con Gemini IA
          </h3>

          <p className="text-xs text-stone-600 mb-4 leading-relaxed">
            Pegá un texto, apunte o capítulo de examen y StudyPlanner generará automáticamente preguntas personalizadas para evaluar tu conocimiento escolar.
          </p>

          <form onSubmit={handleCreateQuestions} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1">Título del tema / Materia (opcional)</label>
              <input
                type="text"
                placeholder="Ej: Revolución de Mayo - Historia"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 border border-emerald-200 rounded-lg bg-white text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-800 mb-1">Texto o Resumen para estudiar *</label>
              <textarea
                id="study-text-input"
                rows={7}
                required
                placeholder="Pegá aquí el texto sobre el cual querés ser evaluado..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full px-3 py-2 border border-emerald-200 rounded-lg bg-white text-xs font-sans focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-stone-400 resize-none font-sans"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-emerald-800 mb-1">Nº Preguntas</label>
                <div className="flex gap-1">
                  {[3, 5, 7].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`flex-1 py-1 rounded-md text-xs font-bold border transition ${
                        questionCount === num
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-white text-stone-700 border-emerald-100 hover:bg-emerald-50"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-5">
                <button
                  id="generate-quiz-button"
                  type="submit"
                  disabled={isLoading || !inputText.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white cursor-pointer px-4 py-2 rounded-lg font-display text-xs font-bold shadow-sm transition flex items-center justify-center gap-1 min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creando...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-3.5 h-3.5" /> Evaluarme
                    </>
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex items-start gap-1.5 text-xs text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </form>
        </div>

        {/* Listado de Cuestionarios Historial */}
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 shadow-sm flex-1 flex flex-col min-h-[180px]">
          <h4 className="font-bold text-stone-800 text-xs border-b border-stone-200 pb-2 mb-3 flex items-center gap-1.5">
            <Clipboard className="w-4 h-4 text-emerald-600" />
            Apuntes Evaluados ({studyMaterials.length})
          </h4>

          {studyMaterials.length === 0 ? (
            <div className="text-center py-8 my-auto">
              <p className="text-stone-400 text-xs italic">Aún no has generado ningún cuestionario de estudio.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {studyMaterials.map((mat) => {
                const isActive = activeMaterialId === mat.id;
                const lastAttempt = mat.attempts[0];

                return (
                  <button
                    key={mat.id}
                    onClick={() => {
                      setActiveMaterialId(mat.id);
                      setSelectedAnswers({});
                      setQuizSubmitted(false);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors flex justify-between items-center ${
                      isActive
                        ? "bg-emerald-100/60 border-emerald-300 text-emerald-950 font-semibold"
                        : "bg-white hover:bg-stone-100 border-stone-200 text-stone-700 font-normal"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="truncate font-sans font-medium">{mat.title}</p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {mat.questions.length} preguntas • {mat.attempts.length} intentos
                      </p>
                    </div>

                    {lastAttempt && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        (lastAttempt.correctCount / lastAttempt.totalCount) >= 0.6
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}>
                        {lastAttempt.correctCount}/{lastAttempt.totalCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Columna Derecha: El Cuestionario Activo / Hoja de Examen */}
      <div className="lg:col-span-8">
        
        {!activeMaterial ? (
          <div className="h-full bg-[#fcfbf9] border border-stone-200 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3 min-h-[350px]">
            <HelpCircle className="w-12 h-12 text-stone-300" />
            <div>
              <p className="text-stone-500 text-sm font-semibold font-display">No hay cuestionario activo</p>
              <p className="text-stone-400 text-xs">Pega apuntes a la izquierda o haz clic en alguno de la lista para empezar a estudiar.</p>
            </div>
            <p className="font-hand text-xl text-emerald-600 max-w-sm pt-2">
              "La educación es el arma más poderosa para cambiar el mundo."
            </p>
          </div>
        ) : (
          <div className="bg-[#fcfbf9] border border-stone-200 rounded-xl shadow-md overflow-hidden relative pb-8">
            
            {/* Cabecera Tipo Examen Escolar Pintoresco */}
            <div className="bg-emerald-50 border-b-2 border-emerald-100 hover:bg-emerald-50/70 py-4 px-6 relative">
              <div className="absolute top-2 right-4 text-[10px] uppercase font-mono text-stone-400">
                Cuestionario de Estudio
              </div>
              
              <h2 className="font-hand font-bold text-3xl text-emerald-950 mb-1">
                📝 {activeMaterial.title}
              </h2>

              <div className="flex flex-wrap gap-4 mt-2 text-xs font-medium text-emerald-800">
                <span>Evaluación de Comprensión Lectora</span>
                <span>•</span>
                <span>Preguntas: {activeMaterial.questions.length}</span>
                {activeMaterial.attempts.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-stone-600 bg-stone-200/50 px-1.5 py-0.5 rounded">
                      Último intento: {activeMaterial.attempts[0].correctCount}/{activeMaterial.attempts[0].totalCount} correctas
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Listado de Preguntas de la Hoja de Examen */}
            <div className="p-6 space-y-6">
              {activeMaterial.questions.map((item, qIdx) => {
                const chosenOptionIdx = selectedAnswers[qIdx];
                const isCorrect = chosenOptionIdx === item.correctIndex;

                return (
                  <div key={qIdx} className="bg-white border border-stone-100 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                    {/* Alfiler de color en la esquina */}
                    <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-bl-lg"></div>

                    <h4 className="font-bold text-stone-800 text-sm flex gap-2">
                      <span className="text-emerald-700 font-mono">{qIdx + 1}.</span>
                      <span>{item.question}</span>
                    </h4>

                    {/* Las 4 opciones */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {item.options.map((option, oIdx) => {
                        const isChosen = chosenOptionIdx === oIdx;
                        const isCorrectOption = oIdx === item.correctIndex;

                        let btnStyle = "border-stone-200 hover:bg-stone-50 text-stone-700";
                        if (quizSubmitted) {
                          if (isCorrectOption) {
                            btnStyle = "bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold";
                          } else if (isChosen) {
                            btnStyle = "bg-rose-50 border-rose-400 text-rose-900";
                          } else {
                            btnStyle = "bg-stone-50 border-stone-200 text-stone-400";
                          }
                        } else if (isChosen) {
                          btnStyle = "bg-emerald-100/50 border-emerald-600 text-emerald-900 font-semibold";
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={quizSubmitted}
                            onClick={() => handleSelectAnswer(qIdx, oIdx)}
                            className={`w-full text-left p-3 rounded-lg border text-xs transition cursor-pointer flex items-start gap-2 ${btnStyle}`}
                          >
                            <span className="font-mono bg-stone-100 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-stone-600">
                              {String.fromCharCode(65 + oIdx)}
                            </span>
                            <span className="leading-tight">{option}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Explicación si el cuestionario ya fue calificado */}
                    {quizSubmitted && (
                      <div className={`mt-3 p-3 rounded-lg text-xs flex gap-2 items-start ${
                        isCorrect ? "bg-emerald-50/70 border border-emerald-200 text-emerald-900" : "bg-orange-50/70 border border-orange-200 text-orange-950"
                      }`}>
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="space-y-1">
                          <p className="font-bold flex items-center gap-1">
                            {isCorrect ? "¡Correcto!" : "Oops, fallaste"}
                            <span className="font-normal text-stone-500">
                              (La respuesta correcta era la {String.fromCharCode(65 + item.correctIndex)})
                            </span>
                          </p>
                          <p className="leading-relaxed text-stone-600 italic font-sans">
                            {item.explanation}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Acciones de entrega de examen */}
            <div className="border-t border-stone-200 px-6 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                {!quizSubmitted ? (
                  <p className="text-xs text-stone-400 italic">
                    Contesta todas las preguntas para enviar tu examen y recibir la explicación pedagógica.
                  </p>
                ) : (
                  <div className="flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-500" />
                    <div>
                      <p className="text-xs font-bold text-stone-800">Cuestionario Calificado</p>
                      <p className="text-[11px] text-stone-500">
                        Puntuación final: {activeMaterial.attempts[0]?.correctCount ?? 0} de {activeMaterial.questions.length} respuestas correctas.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {quizSubmitted ? (
                  <button
                    type="button"
                    onClick={handleResetQuiz}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-700 px-4 py-2 rounded-lg font-display text-xs font-bold shadow-sm transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" /> Rehacer Examen
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubmitQuiz(activeMaterial)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer px-5 py-2.5 rounded-lg font-display text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    Entregar Examen
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
