#!/usr/bin/env bash
# =========================================================================
#          CMINEWAR OS LIVE KIOSK ISO BUILD ENGINE (PROYECTO REAL BARE-METAL)
# =========================================================================
# Este script automatiza la generación de un sistema operativo de uso real 
# basado en Alpine Linux o Debian para tu ordenador compatible con UEFI y BIOS.
# Ejecuta e inicializa esta interfaz de React y Node en pantalla completa (Kiosk)
# de forma nativa sin que haya otro sistema operativo corriendo por debajo.
# =========================================================================

set -e

echo "[+] CMineWar OS Live Linux ISO Builder Initializing..."
echo "[!] Asegúrate de ejecutar este script en un entorno de desarrollo Linux (eg. Debian, Ubuntu, Bash)."

WORK_DIR="/tmp/cminewaros-iso-build"
ISO_OUT_DIR="./dist_iso"
mkdir -p "$WORK_DIR"
mkdir -p "$ISO_OUT_DIR"

# 1. PASO EXPLICATIVO: Cómo empaquetar de forma real utilizando Alpine Linux Live CD Creator
cat << 'INSTRUCTIONS'

========================================================================
BLUEPRINT DE CARGA NATIVA (KIOSK BARE-METAL) CON ALPINE LINUX
========================================================================
Para construir una ISO con este React-Server empotrado desde cero:

Paso 1: Instalar dependencias necesarias para empaquetado ISO en Linux:
  $ sudo apt-get update
  $ sudo apt-get install xorriso squashfs-tools mtools syslinux-utils live-build -y

Paso 2: Compilar nuestra aplicación web React:
  $ npm run build

Paso 3: Estructurar la imagen de arranque de nuestro sistema operativo personalizado:
  Aquí te mostramos cómo se configura el script de autostart nativo de X11 en la ISO:

INSTRUCTIONS

# Crear archivo de simulación de autostart para empaquetar directamente
cat << 'EOF' > "$WORK_DIR/autostart"
#!/bin/sh
# /etc/xdg/openbox/autostart
# Script que arranca CMineWar OS directamente sobre el servidor de video físico X11 / Wayland

# 1. Asegurar volumen y mezclas de sonido por hardware
amixer sset Master 90% unmute || true

# 2. Desactivar protección protector de pantalla y ahorro de energía física
xset s off || true
xset -dpms || true
xset s noblank || true

# 2.5 Prevenir los molestos errores "Failed to execute child process" en Openbox para binarios ausentes
# Creamos ejecutables dummy en el PATH en caso de que el entorno de escritorio, menús o atajos los invoquen.
for bin_name in evte obconf lxappearance conky compton picom nitrogen tint2 volumeicon; do
  if ! command -v $bin_name &>/dev/null; then
    echo -e '#!/bin/sh\nexit 0' > "/usr/bin/$bin_name" 2>/dev/null || echo -e '#!/bin/sh\nexit 0' > "/usr/local/bin/$bin_name" 2>/dev/null || true
    chmod +x "/usr/bin/$bin_name" 2>/dev/null || chmod +x "/usr/local/bin/$bin_name" 2>/dev/null || true
  fi
done

# 3. Asegurar que la interfaz de red local loopback esté activa para peticiones internas
ifconfig lo up || ip link set lo up || true

# 4. Cambiar al directorio del proyecto y arrancar el servidor Express local
cd /opt/cminewaros || cd /opt/clawos || true
node dist/server.cjs &

# 5. Esperar 3 segundos para asegurar que el servidor Express en el puerto 3000 esté levantado completamente
sleep 3

# 6. Detectar si el binario del navegador disponible en el sistema Debian/Alpine
if command -v chromium &>/dev/null; then
  CHROME_BIN="chromium"
elif command -v chromium-browser &>/dev/null; then
  CHROME_BIN="chromium-browser"
elif command -v google-chrome &>/dev/null; then
  CHROME_BIN="google-chrome"
elif command -v x-www-browser &>/dev/null; then
  CHROME_BIN="x-www-browser"
else
  CHROME_BIN="chromium"
fi

# 7. Iniciar navegador Chromium en pantalla completa (modo Kiosco) consumiendo del servidor local Node HTTP
# Esto soluciona de raíz los problemas CORS de protocolo file://, bloqueo de almacenamiento local, de sonido y activos con rutas absolutas
# Añadimos --user-data-dir para dar soporte nativo y evitar que el navegador aborte cuando se ejecuta como ROOT en ISOs live o entornos bare-metal
# Agregamos flags de compatibilidad GPU para evitar pantallas en negro en tarjetas legacy físicas en Openbox
$CHROME_BIN --kiosk \
  --no-sandbox \
  --no-first-run \
  --simulate-outdated-no-au \
  --disable-infobars \
  --window-size=1920,1080 \
  --window-position=0,0 \
  --disable-session-crashed-bubble \
  --disable-translate \
  --start-maximized \
  --user-data-dir=/tmp/chromium-kiosk-profile \
  --password-store=basic \
  --no-errdialogs \
  --autoplay-policy=no-user-gesture-required \
  --disable-gpu \
  --disable-software-rasterizer \
  --disable-gpu-compositing \
  --disable-dev-shm-usage \
  --ozone-platform=x11 \
  --disable-features=UseOzonePlatform \
  http://localhost:3000 &

EOF

echo "[+] Archivo de arranque autostart escrito en: $WORK_DIR/autostart"

# Crear grub.cfg para UEFI arranque limpio
cat << 'EOF' > "$WORK_DIR/grub.cfg"
set default="0"
set timeout=3

menuentry "CMineWar OS Linux v1.1.2 - Kernel Kiosk Bare-Metal (Auto-arrancable)" {
    linux /boot/vmlinuz-virt console=tty1 quiet loglevel=3 logo.nologo
    initrd /boot/initramfs-virt
}
EOF

echo "[+] Archivo grub.cfg UEFI de arranque guardado en: $WORK_DIR/grub.cfg"
echo "[+] Estructuras cognitivas del instalador bare-metal preparadas con éxito para empaquetar manualmente."
echo "[+] Proceso concluido. Sigue los pasos del archivo HOWTO_BOOT_BARE_METAL.md de este directorio."
