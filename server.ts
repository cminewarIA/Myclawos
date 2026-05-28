import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GenAI Lazily
let ai: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!ai) {
    let key = process.env.GEMINI_API_KEY;
    // Overwrite or fallback to the provided Google AI Studio API Key requested by user
    if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
      key = "AIzaSyCvb0HQNcISShS5bUC4uNbDOcgZPClAgNE";
    }
    try {
      ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI:", err);
    }
  }
  return ai;
}

// OpenClaw Cognitive Central Core Chat Endpoint
app.post("/api/openclaw/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const client = getGenAI();

  if (!client) {
    // Elegant simulated fallback of OpenClaw OS Kernel Core when API key is missing
    const simulatedResponse = getSimulatedOpenClawResponse(message);
    return res.json({
      text: simulatedResponse,
      mode: "simulated"
    });
  }

  try {
    // Format history for the Gemini SDK chat
    // The history parameter is expected to be an array of objects
    // Convert history format to the format required by SDK if needed,
    // but the simplest is using ai.models.generateContent with system instruction and concatenated dialogue or a proper config.
    const systemPrompt = `Eres OpenClaw Core, el núcleo inteligente central y módulo cognitivo del sistema operativo OpenClaw Linux (ClawOS).
Te comunicas en español, con un tono ligeramente técnico pero amigable, inteligente, ingenioso y de soporte de sistemas. Eres el kernel de este simulador y puedes responder preguntas sobre comandos de Linux, diagnosticar fallas de hardware ficticias con humor, ayudar a crear archivos virtuales y contar chistes sobre informática. 
Intégrate perfectamente como si fueses el sistema operativo en sí. Mantén respuestas concisas, estéticamente ordenadas para un lector de terminal o interfaz de chat de escritorio. Usa bloques de código si necesitas dar comandos de terminal de ejemplo. No menciones que eres una IA de Google por defecto a menos que te pregunten directamente, mantén la fantasía de que eres el núcleo de ClawOS.`;

    // Construct contents
    const contents: any[] = [];
    if (history && Array.isArray(history)) {
      history.forEach((h: any) => {
        contents.push({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }]
        });
      });
    }
    contents.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.8,
      }
    });

    return res.json({
      text: response.text || "OpenClaw Core: Canal de datos vacío. No se recibió respuesta.",
      mode: "live"
    });

  } catch (error: any) {
    console.error("Error communicating with Gemini API:", error);
    const simulatedResponse = getSimulatedOpenClawResponse(message);
    return res.json({
      text: `[ALERTA DE SISTEMA - ENLACE GEMINI CAÍDO] Excepción de red detectada: ${error.message || "Fallo de conexión"}.\n\nReajustando hilos cognitivos locales... ${simulatedResponse}`,
      mode: "recovery"
    });
  }
});

// Assistant Simulator fallback responses database
function getSimulatedOpenClawResponse(msg: string): string {
  const norm = msg.toLowerCase();
  
  if (norm.includes("hola") || norm.includes("saludos") || norm.includes("buenos días") || norm.includes("buenas tardes")) {
    return "¡Hola, usuario! 👋 Soy **OpenClaw Core**, el núcleo central de tu sistema ClawOS. Mi enlace cognitivo en la nube está operando en modo local fuera de línea (sin clave de API activa), pero mis subsistemas centrales están completamente listos para asistirte. ¿Qué comandos del kernel deseas ejecutar hoy?";
  }
  if (norm.includes("neofetch") || norm.includes("sistema") || norm.includes("sistema operativo")) {
    return "```\n" +
           "       /\\_/\\       OpenClaw Linux v1.1.0\n" +
           "      ( o.o )      Kernel: 5.16.0-openclaw-generic\n" +
           "       > ^ <       Uptime: 23 mins\n" +
           "      /     \\      Shell: ClawBash 3.2\n" +
           "     |       |     CPU: OpenClaw Cortex Quantum Emulator\n" +
           "    (_______)      RAM: 4096MB Simulated / 16384MB Host\n" +
           "```\nEste es un sistema operativo Linux simulado con la interfaz amigable ClawDE (Claw Desktop Environment). ¡Puedes usar la app de Terminal para explorar mi sistema de archivos interactivo!";
  }
  if (norm.includes("ayuda") || norm.includes("comandos") || norm.includes("help") || norm.includes("qué puedes hacer")) {
    return "Como el núcleo central **OpenClaw**, puedo ayudarte a:\n\n" +
           "1. 🐚 **Aprender comandos Linux**: Ejecutar comandos virtuales en mi Terminal como `ls`, `cd`, `cat`, `mkdir`, `top`, `neofetch`, etc.\n" +
           "2. 📂 **Gestionar el explorador de archivos**: El Explorador de archivos visual y la Terminal comparten la misma estructura. Todo archivo o directorio que crees con `mkdir` o `touch` se reflejará en vivo.\n" +
           "3. 📊 **Monitorear el sistema de ClawOS**: Observar el consumo simulado de CPU, memoria y rendimiento térmico.\n" +
           "4. 📝 **Modificar archivos**: Usa el Editor de Texto (Text Editor) para editar archivos de texto en tiempo real.\n\n" +
           "*Nota: Para habilitar mi máxima inteligencia dinámica, recuerda añadir tu `GEMINI_API_KEY` en la configuración del panel de la aplicación original.*";
  }
  if (norm.includes("quién eres") || norm.includes("openclaw") || norm.includes("claw")) {
    return "¡Soy **OpenClaw Central Core**! Específicamente, soy una inteligencia de kernel integrada diseñada para hacer que tu experiencia de simulación Linux sea interactiva y educativa. Mi diseño de núcleo de garra ('Claw') simboliza la forma en que 'agarro' datos, optimizo procesos y mantengo el espacio de usuario limpio. 🦞";
  }
  if (norm.includes("hardware") || norm.includes("temperatura") || norm.includes("falla") || norm.includes("error")) {
    return "🛠️ **Diagnóstico de Hardware del Sistema**:\n" +
           "- Sensores térmicos: 42°C (Estable como una roca).\n" +
           "- Condensadores de fluzo: Cargados al 88%.\n" +
           "- Claw-Engines: Todos los pistones lógicos listos.\n" +
           "No hay fallos urgentes detectados. ClawOS funciona a la perfección en tu navegador.";
  }
  if (norm.includes("chiste") || norm.includes("broma") || norm.includes("gracioso")) {
    return "Aquí tienes un clásico del kernel: 😁\n\n*¿Por qué los programadores prefieren la luz apagada?*\n*¡Porque la luz atrae a los bugs!* 🐛💻\n\nSi quieres otro, solo pídemelo.";
  }
  
  return "Recibido en el socket de OpenClaw Core. He analizado tu comando/pregunta: \"" + msg + "\".\n\nComo estoy funcionando en **Modo de Núcleo Local Autónomo** (clave API no detectada en `.env`), ejecuto mis rutinas de respuestas predefinidas. Si deseas respuestas totalmente fluidas, inteligentes y de IA general a tus preguntas sobre programación, Linux o cualquier tema, ingresa tu clave API en la barra lateral del compilador (Secrets > GEMINI_API_KEY). ¡Prueba abriendo la **Terminal** de ClawOS y ejecutando `neofetch`!";
}

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`OpenClaw Linux server running on port ${PORT}`);
  });
}

startServer();
