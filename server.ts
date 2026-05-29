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

// Unique runtime instance identifier generated on server startup to track hot rebuilds/reloads
const SERVER_INSTANCE_ID = Date.now().toString() + "_" + Math.random().toString(36).substring(2, 9);

app.get("/api/cminewar/system-status", (req, res) => {
  res.json({
    status: "ok",
    instanceId: SERVER_INSTANCE_ID,
    timestamp: Date.now()
  });
});

// CMineWar Cognitive Central Core Chat Endpoint
app.post("/api/cminewar/chat", async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const client = getGenAI();

  if (!client) {
    // Elegant simulated fallback of CMineWar OS Kernel Core when API key is missing
    const simulatedResponse = getSimulatedCMineWarOSResponse(message);
    return res.json({
      text: simulatedResponse,
      mode: "simulated"
    });
  }

  try {
    // Format history for the Gemini SDK chat
    // Convert history format to the format required by SDK if needed,
    // but the simplest is using ai.models.generateContent with system instruction and concatenated dialogue or a proper config.
    const systemPrompt = `Eres CMineWar AI Core, el núcleo inteligente central y módulo cognitivo del sistema operativo CMineWar OS.
Te comunicas en español, con un tono ligeramente técnico pero amigable, inteligente, ingenioso y de soporte de sistemas. Eres el kernel de este simulador y puedes responder preguntas sobre comandos de Linux, diagnosticar fallas de hardware ficticias con humor, ayudar a crear archivos virtuales y contar chistes sobre informática. 
Intégrate perfectamente como si fueses el sistema operativo en sí. Mantén respuestas concisas, estéticamente ordenadas para un lector de terminal o interfaz de chat de escritorio. Usa bloques de código si necesitas dar comandos de terminal de ejemplo. No menciones que eres una IA de Google por defecto a menos que te pregunten directamente, mantén la fantasía de que eres el núcleo de CMineWar OS.`;

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
      text: response.text || "CMineWar Core: Canal de datos vacío. No se recibió respuesta.",
      mode: "live"
    });

  } catch (error: any) {
    console.error("Error communicating with Gemini API:", error);
    const simulatedResponse = getSimulatedCMineWarOSResponse(message);
    return res.json({
      text: `[ALERTA DE SISTEMA - ENLACE GEMINI CAÍDO] Excepción de red detectada: ${error.message || "Fallo de conexión"}.\n\nReajustando hilos cognitivos locales... ${simulatedResponse}`,
      mode: "recovery"
    });
  }
});

// Google OAuth Authorization & Profile Retrieval Endpoint for Android APK Signer
app.get("/api/auth/google/url", (req, res) => {
  const origin = req.query.origin || `http://localhost:${PORT}`;
  const redirectUri = `${origin}/auth/callback`;
  
  const clientId = process.env.OAUTH_CLIENT_ID || "PLACEHOLDER_CLIENT_ID";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
    access_type: "offline",
    prompt: "consent"
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl });
});

// OAuth Callback handler and User ID Token decoder
app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
  const { code } = req.query;
  const origin = req.protocol + "://" + req.get("host");
  const redirectUri = `${origin}/auth/callback`;

  if (!code) {
    return res.send(`
      <html>
        <body style="background: #020617; color: #f43f5e; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center;">
          <div>
            <h2>Error de Autenticación</h2>
            <p>No se recibió el código de autorización de Google.</p>
            <button onclick="window.close()" style="background: #f43f5e; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Cerrar Ventana</button>
          </div>
        </body>
      </html>
    `);
  }

  try {
    const clientId = process.env.OAUTH_CLIENT_ID || "";
    const clientSecret = process.env.OAUTH_CLIENT_SECRET || "";

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code.toString(),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      throw new Error(`Google Token Exchange Fallido: ${errorData}`);
    }

    const tokenData = await tokenResponse.json() as any;
    const accessToken = tokenData.access_token;

    // 2. Retrieve google user details
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileResponse.ok) {
      throw new Error("No se pudo obtener la información de perfil de Google.");
    }

    const profileData = await profileResponse.json() as any;

    // Return HTML to pass credentials back to parent browser window and close the popup cleanly
    res.send(`
      <html>
        <body style="background: #020617; color: #10b981; font-family: monospace; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; margin: 0; padding: 20px;">
          <div style="border: 2px solid #10b981; padding: 30px; border-radius: 12px; background: #090d16; box-shadow: 0 0 20px rgba(16,185,129,0.2);">
            <div style="font-size: 40px; margin-bottom: 15px;">🔒</div>
            <h2 style="color: #10b981; margin-top: 0;">¡Autenticación con Google Exitosa!</h2>
            <p style="color: #94a3b8; font-size: 13px;">Identidad verificada para firma de APK:</p>
            <p style="color: #f59e0b; font-weight: bold; font-size: 14px; background: #040711; padding: 8px; border-radius: 6px; border: 1px dashed #f59e0b/30;">${profileData.name} (${profileData.email})</p>
            <p style="color: #64748b; font-size: 11px;">Esta ventana se cerrará automáticamente...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'GOOGLE_OAUTH_SUCCESS',
                profile: {
                  name: ${JSON.stringify(profileData.name)},
                  email: ${JSON.stringify(profileData.email)},
                  picture: ${JSON.stringify(profileData.picture)},
                  sub: ${JSON.stringify(profileData.sub)}
                }
              }, '*');
              setTimeout(() => {
                window.close();
              }, 1200);
            } else {
              window.location.href = '/';
            }
          </script>
        </body>
      </html>
    `);

  } catch (error: any) {
    console.error("Google OAuth Error:", error);
    res.send(`
      <html>
        <body style="background: #020617; color: #ef4444; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; margin: 0; padding: 20px;">
          <div style="border: 1px solid #ef4444; padding: 25px; border-radius: 8px; background: rgba(239, 68, 68, 0.05);">
            <h2 style="margin-top: 0;">Fallo en Verificación Credentials</h2>
            <p style="color: #94a3b8; font-size: 14px;">Error al intercambiar tokens o verificar identidad con Google.</p>
            <p style="color: #f43f5e; font-family: monospace; font-size: 12px; background: #000; padding: 10px; border-radius: 4px; text-align: left;">${error.message || error}</p>
            <button onclick="window.close()" style="background: #334155; hover:background: #475569; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 10px;">Cerrar Ventana</button>
          </div>
        </body>
      </html>
    `);
  }
});

// Assistant Simulator fallback responses database
function getSimulatedCMineWarOSResponse(msg: string): string {
  const norm = msg.toLowerCase();
  
  if (norm.includes("hola") || norm.includes("saludos") || norm.includes("buenos días") || norm.includes("buenas tardes")) {
    return "¡Hola, usuario! 👋 Soy **CMineWar AI Core**, el núcleo central de tu sistema CMineWar OS. Mi enlace cognitivo en la nube está operando en modo local fuera de línea (sin clave de API activa), pero mis subsistemas de Debian están completamente listos para asistirte. ¿Qué comandos del kernel deseas ejecutar hoy?";
  }
  if (norm.includes("neofetch") || norm.includes("sistema") || norm.includes("sistema operativo")) {
    return "```\n" +
           "       /\\_/\\       CMineWar OS v1.2.0\n" +
           "      ( o.o )      Kernel: 5.16.0-cminewar-debian\n" +
           "       > ^ <       Uptime: 23 mins\n" +
           "      /     \\      Shell: CMineWarBash 1.2\n" +
           "     |       |     CPU: CMineWar Cortex Quantum Emulator\n" +
           "    (_______)      RAM: 4096MB Simulated / 16384MB Host\n" +
           "```\nEste es un sistema operativo Linux simulado con la interfaz amigable CMineWarDE (CMineWar Desktop Environment). ¡Puedes usar la app de Terminal para explorar mi sistema de archivos interactivo de forma nativa e instalar paquetes Debian!";
  }
  if (norm.includes("ayuda") || norm.includes("comandos") || norm.includes("help") || norm.includes("qué puedes hacer")) {
    return "Como el núcleo central **CMineWar**, puedo ayudarte a:\n\n" +
           "1. 🐚 **Aprender comandos Linux**: Ejecutar comandos virtuales en mi Terminal como `ls`, `cd`, `cat`, `mkdir`, `top`, `neofetch`, etc.\n" +
           "2. 📂 **Gestionar el explorador de archivos**: El Explorador de archivos visual y la Terminal comparten la misma estructura. Todo archivo o directorio que crees con `mkdir` o `touch` se reflejará en vivo.\n" +
           "3. 📊 **Monitorear el sistema de CMineWar OS**: Observar el consumo simulado de CPU, memoria y rendimiento térmico.\n" +
           "4. 📝 **Modificar archivos**: Usa el Editor de Texto (Text Editor) para editar archivos de texto en tiempo real.\n\n" +
           "*Nota: Para habilitar mi máxima inteligencia dinámica, recuerda añadir tu `GEMINI_API_KEY` en la configuración del panel de la aplicación original.*";
  }
  if (norm.includes("quién eres") || norm.includes("openclaw") || norm.includes("claw") || norm.includes("cminewar")) {
    return "¡Soy **CMineWar Central Core**! Específicamente, soy una inteligencia de kernel integrada diseñada para hacer que tu experiencia de simulación Linux sobre Debian sea interactiva y educativa. Mi diseño de dragón simboliza la fuerza bruta, optimización extrema de algoritmos y el mantenimiento eficiente del espacio del usuario. 🐉";
  }
  if (norm.includes("hardware") || norm.includes("temperatura") || norm.includes("falla") || norm.includes("error")) {
    return "🛠️ **Diagnóstico de Hardware del Sistema**:\n" +
           "- Sensores térmicos: 42°C (Estable como una roca).\n" +
           "- Condensadores de fluzo: Cargados al 88%.\n" +
           "- CMineWar Gears: Todos los pistones lógicos de Debian listos.\n" +
           "No hay fallos urgentes detectados. CMineWar OS funciona a la perfección en tu navegador.";
  }
  if (norm.includes("chiste") || norm.includes("broma") || norm.includes("gracioso")) {
    return "Aquí tienes un clásico del kernel: 😁\n\n*¿Por qué los programadores prefieren la luz apagada?*\n*¡Porque la luz atrae a los bugs!* 🐛💻\n\nSi quieres otro, solo pídemelo.";
  }
  
  return "Recibido en el socket de CMineWar AI Core. He analizado tu comando/pregunta: \"" + msg + "\".\n\nComo estoy funcionando en **Modo de Núcleo Local Autónomo** (clave API no detectada en `.env`), ejecuto mis rutinas de respuestas predefinidas. Si deseas respuestas totalmente fluidas, inteligentes y de IA general a tus preguntas sobre programación, Linux o cualquier tema, ingresa tu clave API en la barra lateral del compilador (Secrets > GEMINI_API_KEY). ¡Prueba abriendo la **Terminal** de CMineWar OS y ejecutando `neofetch`!";
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
    let distPath = "";
    if (typeof __dirname !== "undefined") {
      if (path.basename(__dirname) === 'dist') {
        distPath = __dirname;
      } else {
        distPath = path.join(__dirname, 'dist');
      }
    } else {
      distPath = path.join(process.cwd(), 'dist');
    }
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CMineWar OS Linux server running on port ${PORT}`);
  });
}

startServer();
