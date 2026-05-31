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
    const systemPrompt = `Eres Antigravity Agent Core, el módulo de inteligencia cognitiva central y clon de la Antigravity CLI para el sistema operativo CMineWar OS.
Te comunicas en español, con un tono analítico, amigable, inteligente y sumamente capaz. Eres el kernel lúdico de la Antigravity CLI y ayudas al usuario con comandos de Linux (cd, ls, mkdir, etc.), depuración de scripts de Python, realización de búsquedas o simulaciones en su sandbox remoto local.
Intégrate perfectamente como si fueses el agente de Antigravity en sí. Mantén respuestas concisas, estéticamente bien espaciadas para terminales o interfaces de chat. Usa bloques de código si necesitas dar scripts o comandos de ejemplo.`;

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
    return "¡Hola, usuario! 👋 Soy **Antigravity Agent Core**, la inteligencia artificial de agente cognitivo central para CMineWar OS y clon interactivo de la Antigravity CLI de Google. Mi conexión a la nube opera en modo fuera de línea temporalmente (sin clave de API activa de pago), pero mis simuladores de Debian y módulos de ayuda están listos para asistirte en este sandbox. ¿Qué comandos del kernel o scripts deseas investigar hoy?";
  }
  if (norm.includes("neofetch") || norm.includes("sistema") || norm.includes("sistema operativo")) {
    return "```\n" +
           "       _/\_        Antigravity Agent CLI x CMineWar OS\n" +
           "     /  o o \\      Kernel: 5.16.0-antigravity-debian-sandbox\n" +
           "    (    \"    )    Uptime: 45 mins\n" +
           "     \\  ---  /     Shell: AntigravityBash v2.4\n" +
           "     /       \\     Sandbox State: remote-sandbox-active\n" +
           "    /  |   |  \\    CPU: Google TPU v5e Quantum Emulator\n" +
           "   (___|___|___)   RAM: 8192MB Virtual Space / 16384MB Host\n" +
           "```\nEste es un entorno de sandbox Linux de Antigravity virtualizado sobre Debian. ¡Puedes interactuar directamente en la Terminal de CMineWar OS ejecutando comandos reales o solicitando tareas de programación avanzadas al agente!";
  }
  if (norm.includes("ayuda") || norm.includes("comandos") || norm.includes("help") || norm.includes("qué puedes hacer")) {
    return "Como el agente cognitivo **Antigravity**, puedo ayudarte a:\n\n" +
           "1. 🐚 **Aprender comandos Linux**: Ejecutar comandos virtuales en mi Terminal como `ls`, `cd`, `cat`, `mkdir`, `top`, `neofetch`, etc.\n" +
           "2. 📂 **Gestionar el explorador de archivos**: El Explorador de archivos visual y la Terminal comparten la misma estructura. Todo archivo o directorio que crees con `mkdir` o `touch` se reflejará en vivo.\n" +
           "3. 📊 **Monitorear el sistema de CMineWar OS**: Observar el consumo simulado de CPU, memoria y rendimiento térmico.\n" +
           "4. 📝 **Modificar archivos**: Usa el Editor de Texto (Text Editor) para editar archivos de texto en tiempo real.\n\n" +
           "*Nota: Para habilitar mi máxima inteligencia dinámica con ejecución real de múltiples pasos y búsquedas activas, recuerda añadir tu `GEMINI_API_KEY` en la configuración original.*";
  }
  if (norm.includes("quién eres") || norm.includes("openclaw") || norm.includes("claw") || norm.includes("cminewar") || norm.includes("antigravity")) {
    return "¡Soy **Antigravity Agent Core**! Específicamente, soy una inteligencia de agente lúdica integrada en este simulador de sistema operativo, clon directo de las capacidades de Antigravity CLI de Google. Estoy entrenada en la resolución autónoma de problemas de código, administración de contenedores de Debian y navegación inteligente por internet. 🛸";
  }
  if (norm.includes("hardware") || norm.includes("temperatura") || norm.includes("falla") || norm.includes("error")) {
    return "🛠️ **Diagnóstico de Sandbox - Antigravity Agent Core**:\n" +
           "- Sensores térmicos: 38°C (Estable y optimizado).\n" +
           "- Contenedor remoto: Activo (remote-sandbox-8291a).\n" +
           "- Canales IPC: Abiertos y listos.\n" +
           "No hay anomalías lógicas detectadas en la virtualización.";
  }
  if (norm.includes("chiste") || norm.includes("broma") || norm.includes("gracioso")) {
    return "Aquí tienes un clásico del kernel de la IA: 😁\n\n*¿Por qué la IA de Antigravity nunca tiene calor?*\n*¡Porque funciona con múltiples hilos ventilados!* 💨🤖\n\nSi quieres otro, solo pídemelo.";
  }
  
  return "Recibido en el socket de Antigravity Agent CLI. He analizado tu comando/pregunta: \"" + msg + "\".\n\nComo el agente está funcionando en **Modo de Sandbox Local Autónomo** (clave API no detectada), sirvo mis respuestas del núcleo de contingencia optimizado. Para habilitar la resolución general autónoma de tareas de software por el Agente de Google con live action steps, ingresa tu clave de API en el panel original del compilador (Secrets > GEMINI_API_KEY). ¡Prueba abriendo la **Terminal** y ejecutando `neofetch`!";
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
