# 🐉 CMineWar OS — Estación de Trabajo Cognitiva y Sistema Operativo

¡Bienvenido a **CMineWar OS**! Este proyecto representa una plataforma vanguardista de estación de trabajo cognitiva y entorno de sistema operativo híbrido. Ha sido diseñado con una estética ciberpunk de alto contraste (basada en tonos pizarra oscuros, naranjas y rojos incandescentes) y cuenta con un núcleo de servidor Express en Node.js, una interfaz de usuario interactiva ultrarreactiva construida en React + Vite y una integración profunda con entornos físicos Debian/GNU Linux "bare-metal".

El sistema está presidido por el majestuoso logotipo del **Dragón de CMineWar**, un emblema de alto rendimiento generado con precisión vectorial y brillos fluidos que representa el núcleo inteligente del sistema.

---

## 🚀 Características Principales

### 1. Sistema de Arranque Dual e Interfaces de Enlace
*   **Enlace de Producción Exclusivo**: El panel de bienvenida requiere una dirección IP real del nodo físico para su vinculación (por ejemplo, `192.168.1.100`), denegando de forma estricta las conexiones procedentes de entornos locales simulados, emuladores o interfaces de bucle de retorno (`127.0.0.1`, `localhost`, `10.0.2.*`).
*   **Cargador de Arranque Avanzado (Bootloader)**: Simula de forma interactiva y ejecuta la secuencia real de carga del kernel. Permite la reparación de sectores corruptos mediante el **Modo Seguro (Safe Mode)**.
*   **Panel de Diagnóstico Técnico**: Permite filtrar y examinar en tiempo real los registros detallados de inicialización de los controladores de hardware, firmware y el estado de montaje del sistema de archivos virtual (VFS).

### 2. Integración Física con Servidores Debian ("Bare-Metal")
CMineWar OS incluye un conjunto de servicios de fondo y utilidades en Python que se ejecutan directamente en la máquina anfitriona para ofrecer telemetría y control real:
*   **Compañero de Sistema (`cminewar-companion.py` / `cminewar-desktop-app.py`)**: Aplicaciones nativas de escritorio basadas en Tkinter que monitorizan la temperatura real del procesador, el uso de memoria, la carga del sistema y la actividad de los servicios de systemd.
*   **Gestor de Servicios e Invocación Remota**: Permite arrancar, detener y reiniciar servicios críticos del sistema (como el propio servidor de CMineWar o servidores de bases de datos) a través de llamadas de API seguras (`/api/cminewar/services/control`).
*   **Aislamiento de Red por Cortafuegos (WAN Block)**: Implementa reglas de aislamiento local instantáneo utilizando `iptables`. Permite rechazar todo el tráfico hacia Internet (WAN) manteniendo la conectividad intacta con redes locales (LAN: `192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`) para garantizar la privacidad física y la soberanía de los datos.

### 3. Suite de Aplicaciones Incorporadas
*   **Terminal de Consola**: Soporta la simulación de comandos UNIX estándar (`neofetch`, `ls`, `cat`, `iptables`, `systemctl`) con respuestas del núcleo inteligente y soporte de enlace interactivo con nodos remotos mediante SSH.
*   **Explorador de Archivos (FileManager)**: Gestor visual completo integrado con un Sistema de Archivos Virtual (VFS) persistente en el navegador y con capacidad de sincronización con el almacenamiento real de producción de Debian.
*   **Editor de Código y Texto (TextEditor)**: Editor con resaltado de sintaxis, gestión de múltiples pestañas activas y guardado directo en el VFS.
*   **EuroOffice Suite**: Herramienta de productividad de oficina que incluye:
    *   *EuroWord*: Procesador de textos profesional con plantillas de documentos técnicos de CMineWar.
    *   *EuroSpread*: Generador de hojas de cálculo con soporte de fórmulas matemáticas, gráficos analíticos mediante Recharts e importación de datos.
    *   *EuroSlide*: Diseñador de presentaciones visuales con controles de diapositivas interactivos.
*   **Navegador Chromium**: Simulador de navegador web seguro con resultados de búsqueda técnica indexados.
*   **Monitor de Sistema (SystemMonitor)**: Gráficos de telemetría de rendimiento que muestran la carga de la CPU, uso de memoria RAM, procesos activos y la temperatura física real del silicio.
*   **Control de Hardware**: Panel para la gestión de controladores gráficos (como NVIDIA Enterprise), gobernadores de la CPU (Performance, Powersave), resolución de pantalla y el estado de la batería o fuente de alimentación.
*   **Beini (Auditor de Redes)**: Herramienta de análisis e ingeniería de seguridad para auditar la robustez de los protocolos inalámbricos (WPA/WPA2) y realizar pruebas de estrés de red legítimas.
*   **GitHub Updater & Pipeline de Compilación**: Descarga actualizaciones OTA comparando el hash de la rama de producción e interactúa de forma visual con las herramientas de compilación de Android (Gradle) para la generación de archivos binarios `.apk` optimizados.

### 4. Compilación Móvil Nativa (Android)
*   **Capacitor & Gradle**: Integración total para el despliegue del sistema táctil en dispositivos móviles, soportando rotación fluida acelerada por hardware y pantallas de carga adaptadas con el logotipo oficial.

---

## 🛠️ Arquitectura de Archivos del Proyecto

```text
├── android/                  # Configuración y código nativo para la compilación APK en Android (Gradle)
├── assets/                   # Logotipos oficiales del sistema (incluido el emblema del Dragón en PNG y JPG)
├── bare-metal/               # Scripts y servicios físicos para despliegue en hosts Debian reales
│   ├── build_iso.sh          # Blueprint de construcción para empaquetar el Kiosko autoejecutable (Alpine)
│   ├── cminewar-companion.py # Panel gráfico Tkinter para monitorización de hardware físico
│   ├── cminewar-desktop-app.py # Aplicación de escritorio centralizada para telemetría y control de systemd
│   ├── install_debian_service.sh # Instalador automatizado de servicios systemd en el servidor anfitrión
│   ├── real_install.py       # Instalador portable interactivo escrito en Python para discos externos (WTG)
│   └── update_system.py      # Script de actualización del gestor de arranque (GRUB) y paquetes físicos
├── server.ts                 # Servidor de producción en Express, gestor de la API del sistema y proxy seguro
├── src/                      # Código fuente de la interfaz reactiva en React (TypeScript)
│   ├── App.tsx               # Componente principal, gestor del entorno de escritorio, gateway y ciclo de vida
│   ├── components/           # Componentes modulares y aplicaciones de la suite de CMineWar
│   │   ├── Bootloader.tsx    # Interfaz interactiva de arranque y consola de recuperación (Modo Seguro)
│   │   ├── DragonLogo.tsx    # Componente SVG reactivo y animado del dragón insignia
│   │   ├── EuroOffice.tsx    # Suite de ofimática integrada (EuroWord, EuroSpread, EuroSlide)
│   │   ├── ... (etc.)        # Aplicaciones individuales modulares
│   ├── index.css             # Estilos globales y configuración del tema ciberpunk mediante Tailwind CSS
│   └── main.tsx              # Punto de entrada de inicialización de React
├── package.json              # Configuración de dependencias, scripts de compilación Vite y bundles de Esbuild
└── metadata.json             # Ajustes y metadatos del iFrame y permisos requeridos por la plataforma
```

---

## ⚡ Guía de Instalación y Despliegue

### Requisitos Previos
*   **Node.js** (versión 18 o superior)
*   **npm** (incluido con Node.js)
*   Un entorno compatible con **Debian/GNU Linux** para ejecutar los scripts del directorio `bare-metal` (opcional, necesario únicamente para la monitorización física de hardware y control del cortafuegos real).

### Ejecución en Modo de Desarrollo
1.  Instala las dependencias de la aplicación:
    ```bash
    npm install
    ```
2.  Inicia el servidor Express con el soporte de recarga en caliente de Vite:
    ```bash
    npm run dev
    ```
3.  Abre tu navegador e ingresa en `http://localhost:3000` para acceder a la consola de control.

### Compilación y Puesta en Producción
Para empaquetar el proyecto de manera óptima en un único archivo ejecutable de Node.js de alto rendimiento:
```bash
npm run build
```
Este comando realizará las siguientes tareas:
1.  Compilará los archivos estáticos del frontend React + Vite dentro del directorio `dist/`.
2.  Empaquetará el backend TypeScript (`server.ts`) utilizando **esbuild** en un único módulo autocontenido de CommonJS en `dist/server.cjs`, evitando problemas de resolución de rutas relativas de ESM en producción.

Para iniciar la aplicación en producción en el puerto `3000` (el único accesible de forma externa en entornos protegidos):
```bash
npm run start
```

---

## 💾 Despliegue en Disco Portable (Instalador WTG)

Si deseas instalar **CMineWar OS** en un disco de almacenamiento USB o unidad de estado sólido (SSD) portátil para arrancar físicamente cualquier ordenador x86_64:

1.  Asegúrate de ejecutar el script con privilegios de administrador (`root`):
    ```bash
    sudo python3 bare-metal/real_install.py
    ```
2.  Introduce el identificador del disco de destino (por ejemplo, `sdb` o `sdc`).
    *   *⚠️ ADVERTENCIA CRÍTICA: Asegúrate de comprobar minuciosamente la unidad. El instalador particionará, formateará en Ext4 y sobreescribirá por completo los datos del disco seleccionado.*
3.  El instalador preparará la partición del sistema, la partición EFI de arranque, configurará el gestor de arranque GRUB con soporte portable y desplegará la suite completa de CMineWar OS como un servicio del sistema que se ejecuta automáticamente al arrancar.

---

## 🛡️ Licencia y Soberanía Tecnológica

**CMineWar OS** ha sido desarrollado bajo estrictos principios de soberanía de datos y resiliencia tecnológica. Las reglas del cortafuegos de aislamiento local de la suite garantizan que el operador mantenga el control exclusivo sobre toda la telemetría e información confidencial procesada en la estación de trabajo cognitiva.

---
*Producido con orgullo y rigurosidad técnica para la suite oficial de CMineWar OS.*
