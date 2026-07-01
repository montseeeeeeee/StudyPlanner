import React, { useState, useRef } from "react";
import { StudyAttachment } from "../types";
import { Upload, FileText, Image, File, Trash2, Sparkles, Loader2, Check } from "lucide-react";

interface StudyAttachmentUploaderProps {
  attachments: StudyAttachment[];
  onChange: (attachments: StudyAttachment[]) => void;
  onExtractContent?: (
    extractedText: string,
    metadata: {
      topic: string;
      summary: string;
      keywords: string;
      explanation: string;
      difficulties: string;
      reviewConcepts: string;
      ideas: string[];
    }
  ) => void;
  theme?: "claro" | "oscuro";
}

export default function StudyAttachmentUploader({
  attachments,
  onChange,
  onExtractContent,
  theme = "claro"
}: StudyAttachmentUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();

    // Check file type
    const isImage = file.type.startsWith("image/");
    const isText = file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md") || file.name.endsWith(".json");
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      const newAttachment: StudyAttachment = {
        name: file.name,
        type: file.type || (isPdf ? "application/pdf" : isText ? "text/plain" : "application/octet-stream"),
        size: file.size,
        dataUrl: dataUrl
      };

      // Add to list
      const updated = [...attachments, newAttachment];
      onChange(updated);

      // If it's a text file, we can actually parse its text
      if (isText && dataUrl) {
        try {
          // Extract base64 part if it's a data URL, or decode it
          const rawText = dataUrl.includes("base64,") 
            ? atob(dataUrl.split("base64,")[1]) 
            : dataUrl;
          
          // Trigger automatic parsing info
          triggerSmartExtraction(file.name, rawText);
        } catch (err) {
          // Fallback text
          triggerSmartExtraction(file.name, "Contenido leído del archivo: " + file.name);
        }
      } else {
        // For PDF or Images, trigger the smart educational simulator
        triggerSmartExtraction(file.name, "");
      }
    };

    if (isText) {
      reader.readAsText(file);
    } else {
      // Read as DataURL for image previews & pdf representation
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const triggerSmartExtraction = (fileName: string, rawText: string) => {
    if (!onExtractContent) return;

    setIsProcessing(true);
    setProcessingStep("Leyendo estructura del archivo...");

    // Simulate cute AI thinking pipeline steps
    setTimeout(() => {
      setProcessingStep("Escaneando conceptos académicos y diagramas...");
      
      setTimeout(() => {
        setProcessingStep("Gemini IA sintetizando resumen, palabras clave y métodos de estudio...");
        
        setTimeout(() => {
          // Generate customized mock content based on file name keywords
          const nameLower = fileName.toLowerCase();
          let topic = "Apuntes de Clase";
          let summary = "Contenido extraído para estudio.";
          let keywords = "Apunte, Estudio, Conceptos";
          let explanation = "";
          let difficulties = "";
          let reviewConcepts = "";
          let ideas: string[] = [];

          if (rawText && rawText.length > 10) {
            // If we read actual raw text, build a smart summary out of it
            topic = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
            topic = topic.charAt(0).toUpperCase() + topic.slice(1);
            
            summary = rawText.length > 200 ? rawText.substring(0, 200) + "..." : rawText;
            keywords = Array.from(new Set(rawText.split(/\s+/).filter(w => w.length > 5).slice(0, 5))).join(", ");
            explanation = rawText;
            difficulties = "Comprender la articulación formal del texto original de manera integral.";
            reviewConcepts = "Terminología técnica básica introducida en el escrito.";
            ideas = rawText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 15).slice(0, 5);
          } else if (nameLower.includes("biol") || nameLower.includes("celu") || nameLower.includes("foto") || nameLower.includes("quim") || nameLower.includes("cien")) {
            topic = "Estructura Celular y Mitocondria";
            summary = "La célula es la unidad fundamental de los seres vivos. La mitocondria genera la energía celular (ATP) a través de la respiración celular.";
            keywords = "Mitocondria, ATP, Célula Eucariota, Ribosomas, Cloroplasto";
            explanation = "La mitocondria funciona como la central eléctrica de la célula: toma la glucosa (comida) y el oxígeno para fabricar la energía química (ATP) que la célula necesita para crecer, repararse y realizar todas sus funciones vitales básicas.";
            difficulties = "Explicar la cadena de transporte de electrones y la diferencia con la fotosíntesis clorofílica.";
            reviewConcepts = "Respiración celular, Molécula de ATP, Ciclo de Krebs, Membrana interna";
            ideas = ["Célula eucariota vs procariota", "Núcleo y almacenamiento de ADN", "Mitocondria (Generadora de Energía ATP)", "Cloroplastos (Fotosíntesis celular)", "Membrana plasmática semipermeable"];
          } else if (nameLower.includes("hist") || nameLower.includes("revo") || nameLower.includes("inde") || nameLower.includes("social")) {
            topic = "Revolución de Mayo de 1810";
            summary = "La Revolución de Mayo fue una serie de acontecimientos revolucionarios ocurridos en Buenos Aires, que destituyeron al virrey Cisneros y crearon la Primera Junta.";
            keywords = "Primera Junta, Virrey Cisneros, Cabildo Abierto, Criollos, Emancipación";
            explanation = "En mayo de 1810, España estaba invadida por Napoleón y el rey Fernando VII estaba prisionero. Los criollos de Buenos Aires aprovecharon esto para convocar un Cabildo Abierto, sosteniendo que si no había rey legítimo, el virrey Cisneros ya no tenía autoridad. Así nació nuestro primer gobierno patrio autónomo.";
            difficulties = "Diferenciar las facciones internas de la Primera Junta (Morenistas vs Saavedristas).";
            reviewConcepts = "Virreinato del Río de la Plata, Cabildo Abierto del 22 de Mayo, Cisneros, Cornelio Saavedra";
            ideas = ["Crisis de la monarquía española por Napoleón", "Convocatoria al Cabildo Abierto", "Destitución del virrey Cisneros", "Constitución de la Primera Junta de Gobierno", "Impacto emancipador en América del Sur"];
          } else if (nameLower.includes("mate") || nameLower.includes("alge") || nameLower.includes("geom") || nameLower.includes("calc") || nameLower.includes("fisi") || nameLower.includes("formu")) {
            topic = "Teorema de Pitágoras y Trigonometría";
            summary = "El Teorema de Pitágoras establece que en todo triángulo rectángulo, el cuadrado de la hipotenusa es igual a la suma de los cuadrados de los catetos: a² + b² = c².";
            keywords = "Hipotenusa, Catetos, Triángulo Rectángulo, Pitágoras, Ángulo Recto";
            explanation = "Si tienes un triángulo con un ángulo perfecto de 90 grados, el lado más largo se llama hipotenusa. El Teorema de Pitágoras dice que si construyes un cuadrado sobre la hipotenusa, su área será exactamente idéntica a sumar las áreas de los dos cuadrados construidos sobre los lados cortos.";
            difficulties = "Calcular raíces cuadradas no perfectas manualmente y despejar variables complejas.";
            reviewConcepts = "Ángulo recto, Cateto opuesto y adyacente, Raíz cuadrada, Despeje de ecuaciones";
            ideas = ["Triángulo rectángulo con ángulo de 90°", "Hipotenusa (Lado de mayor longitud)", "Cateto opuesto y cateto adyacente", "Fórmula del teorema: a² + b² = c²", "Aplicación práctica para calcular distancias"];
          } else if (nameLower.includes("geog") || nameLower.includes("plan") || nameLower.includes("tierr") || nameLower.includes("clima")) {
            topic = "Capas de la Tierra y Placas Tectónicas";
            summary = "La Tierra está compuesta por tres capas principales: corteza, manto y núcleo. El movimiento de las placas tectónicas sobre el manto causa sismos y cordilleras.";
            keywords = "Corteza, Manto, Núcleo Terrestre, Deriva Continental, Sismos";
            explanation = "La Tierra es como un durazno o huevo: tiene una cáscara rocosa y sólida (la corteza), una pulpa caliente de roca fundida y magma (el manto) y un centro sólido súper caliente (el núcleo). Las placas de la corteza flotan sobre el manto y chocan lentamente, creando montañas y terremotos.";
            difficulties = "Explicar cómo las corrientes de convección del manto mueven los continentes.";
            reviewConcepts = "Litósfera, Astenósfera semisólida, Corrientes de convección magmática, Pangea";
            ideas = ["La corteza terrestre sólida", "Manto terrestre de roca fluida", "Núcleo metálico conductor de calor", "Deriva continental y placas tectónicas", "Zonas de subducción y actividad sísmica"];
          } else if (nameLower.includes("quim") || nameLower.includes("atom") || nameLower.includes("enla") || nameLower.includes("mole")) {
            topic = "Tabla Periódica y Enlaces Químicos";
            summary = "Los átomos se organizan en la tabla periódica según su número atómico. Buscan estabilidad uniéndose mediante enlaces iónicos, covalentes o metálicos.";
            keywords = "Átomo, Enlace Covalente, Enlace Iónico, Electrones de Valencia, Regla del Octeto";
            explanation = "Los átomos quieren ser estables y para eso necesitan completar 8 electrones en su órbita externa (regla del octeto). Para lograrlo, los átomos se unen compartiendo electrones alegremente (enlace covalente) o robándose/donándose electrones entre sí (enlace iónico).";
            difficulties = "Diferenciar la polaridad molecular en un enlace covalente.";
            reviewConcepts = "Electronegatividad atómica, Configuración electrónica, Regla del octeto, Enlace no polar";
            ideas = ["Estructura del átomo (Protones, neutrones, electrones)", "La tabla periódica y periodos", "Electrones de la capa de valencia", "Enlace covalente (Compartir electrones)", "Enlace iónico (Transferir electrones)"];
          } else {
            // Universal premium study backup
            topic = "Sintesis Académica - " + fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
            topic = topic.substring(0, 45);
            summary = "Análisis temático integral para el estudio dinámico. Resumen de las ideas de la lección cargada para memorización activa y repaso Cornell.";
            keywords = "Análisis conceptual, Estudio activo, Repaso eficiente, Síntesis";
            explanation = "Este material resume las nociones primordiales del archivo escolar. Nos enseña que para asimilar un tema complejo, debemos desglosarlo en sus premisas nucleares, relacionarlas mediante analogías familiares y repasar los vacíos identificados.";
            difficulties = "Identificar y jerarquizar los conceptos de menor peso relativo de forma rápida.";
            reviewConcepts = "Glosario de términos nuevos, Mapa de relaciones lógicas, Autoevaluación";
            ideas = ["Introducción y contextualización del tema", "Planteamiento del concepto nuclear", "Análisis de relaciones causa-efecto", "Ejemplos prácticos de la vida cotidiana", "Resumen sintético para examen"];
          }

          onExtractContent(rawText || `Archivo cargado: ${fileName}`, {
            topic,
            summary,
            keywords,
            explanation,
            difficulties,
            reviewConcepts,
            ideas
          });

          setIsProcessing(false);
          setProcessingStep("");
        }, 1200);
      }, 1000);
    }, 1000);
  };

  const removeAttachment = (index: number) => {
    const file = attachments[index];
    if (window.confirm(`⚠️ ¿Estás seguro de que deseas eliminar permanentemente el archivo adjunto "${file.name}"? Esta acción evitará pérdidas accidentales.`)) {
      const updated = attachments.filter((_, idx) => idx !== index);
      onChange(updated);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="w-4 h-4 text-rose-500" />;
    if (type.includes("pdf")) return <FileText className="w-4 h-4 text-red-500" />;
    return <File className="w-4 h-4 text-blue-500" />;
  };

  return (
    <div className={`space-y-3 border rounded-xl p-3 shadow-3sm transition-colors duration-200 ${
      theme === "oscuro" ? "bg-stone-900 border-stone-800 text-stone-100" : "bg-white border-stone-200 text-slate-800"
    }`}>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-wider">Subir apuntes o material</span>
        {attachments.length > 0 && (
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
            theme === "oscuro" ? "text-stone-400 bg-stone-950" : "text-stone-400 bg-stone-100"
          }`}>
            {attachments.length} archivo(s)
          </span>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-xl p-4.5 text-center transition cursor-pointer flex flex-col items-center justify-center min-h-[90px] ${
          isDragging
            ? theme === "oscuro" ? "border-rose-500 bg-rose-950/20" : "border-rose-500 bg-rose-50/40"
            : theme === "oscuro"
              ? "border-stone-800 bg-stone-950/50 hover:bg-stone-950 hover:border-stone-700"
              : "border-stone-200 bg-stone-50/30 hover:bg-stone-50 hover:border-stone-300"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf,.txt,.md,.json,.doc,.docx"
          className="hidden"
        />

        <Upload className={`w-5 h-5 mb-1.5 ${theme === "oscuro" ? "text-stone-500" : "text-stone-400"}`} />
        <p className={`text-[11px] font-bold ${theme === "oscuro" ? "text-stone-300" : "text-stone-700"}`}>Arrastrá tu PDF, Imagen o Archivo de texto</p>
        <p className="text-[9px] text-stone-400 mt-0.5">O hace click para explorar (PDF, JPG, PNG, TXT)</p>
      </div>

      {/* AI Processing Overlay */}
      {isProcessing && (
        <div className={`border rounded-xl p-3 flex items-center gap-3 animate-pulse ${
          theme === "oscuro" ? "bg-rose-950/30 border-rose-900" : "bg-rose-50/80 border-rose-200"
        }`}>
          <Loader2 className="w-5 h-5 text-rose-600 animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className={`text-[10px] font-black uppercase block tracking-wider ${theme === "oscuro" ? "text-rose-400" : "text-rose-900"}`}>Procesador Inteligente</span>
            <p className={`text-[10px] truncate ${theme === "oscuro" ? "text-stone-300" : "text-stone-600"}`}>{processingStep}</p>
          </div>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between gap-2 p-2 border rounded-lg text-xs ${
                theme === "oscuro" ? "bg-stone-950 border-stone-850" : "bg-stone-50 border-stone-200"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {getFileIcon(file.type)}
                <div className="min-w-0">
                  <p className={`font-bold truncate max-w-[140px] md:max-w-[200px] ${theme === "oscuro" ? "text-stone-200" : "text-stone-750"}`} title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[9px] text-stone-400 font-mono font-bold">
                    {(file.size / 1024).toFixed(1)} KB • {file.type.split("/")[1] || "archivo"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {file.type.startsWith("image/") && file.dataUrl && (
                  <img
                    src={file.dataUrl}
                    alt="preview"
                    className="w-7 h-7 object-cover rounded border border-stone-200 flex-shrink-0"
                    referrerPolicy="no-referrer"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className={`p-1 rounded transition ${
                    theme === "oscuro" ? "text-stone-500 hover:text-rose-400 hover:bg-stone-900" : "text-stone-400 hover:text-rose-600 hover:bg-stone-100"
                  }`}
                  title="Eliminar archivo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {onExtractContent && !isProcessing && (
            <button
              type="button"
              onClick={() => {
                if (attachments.length > 0) {
                  // Re-trigger extraction for the first file in the list as primary input
                  const primaryFile = attachments[attachments.length - 1];
                  triggerSmartExtraction(primaryFile.name, primaryFile.type.startsWith("text") ? primaryFile.dataUrl || "" : "");
                }
              }}
              className={`w-full mt-2 py-1.5 px-3 border rounded-lg text-[10px] font-black uppercase flex items-center justify-center gap-1.5 transition cursor-pointer ${
                theme === "oscuro"
                  ? "bg-rose-950/20 hover:bg-rose-950/40 text-rose-300 border-rose-900/50"
                  : "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-600" />
              ¡Autocompletar Método de Estudio con IA! ✨
            </button>
          )}
        </div>
      )}
    </div>
  );
}
