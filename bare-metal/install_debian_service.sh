#!/usr/bin/env bash
# =========================================================================
#          CMINEWAR OS SYSTEM SERVICE INSTALLER & FIREWALL DEPLOYER FOR DEBIAN
# =========================================================================
# Este script está específicamente diseñado para implementar la interfaz y el 
# backend de CMineWar OS en sistemas operativos Debian GNU/Linux tradicionales (en PC,
# Mini-PC, Servidores Domésticos o placas integradas).
#
# Configura el inicio automático como servicio del sistema (Systemd),
# expone el acceso local (puerto 3000) de forma segura y provee el script de
# cortafuegos (iptables) para aislar por completo el tráfico WAN manteniendo 
# el acceso LAN intacto.
# =========================================================================

set -e

# Asegurar privilegios de superusuario (root)
if [ "$EUID" -ne 0 ]; then
  echo "[-] ERROR: Este instalador requiere ejecutarse como ROOT."
  echo "    Por favor ejecuta: sudo bash $0"
  exit 1
fi

echo "========================================================================="
echo "   🐉 INSTALADOR DE CMINEWAR OS PARA DEBIAN GNU/LINUX (BARE-METAL & SERVICIOS)"
echo "========================================================================="
echo "[+] Detectando sistema operativo..."

if [ -f /etc/debian_version ]; then
    DEBIAN_VER=$(cat /etc/debian_version)
    echo "[✔] Sistema Debian compatible detectado (versión $DEBIAN_VER)."
else
    echo "[!] ADVERTENCIA: No se ha detectado un archivo oficial de Debian."
    echo "    Este script está optimizado para Debian y derivados directos (Ubuntu/Mint/etc)."
    read -p "¿Deseas continuar de todas formas? (s/N): " choice
    if [[ ! "$choice" =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# 1. Instalar requerimientos básicos de Debian
echo "[+] Actualizando repositorios e instalando herramientas de compilación..."
apt-get update -y
apt-get install -y curl build-essential git iptables iptables-persistent xorriso squashfs-tools mtools syslinux-utils chromium openbox || apt-get install -y curl build-essential git iptables iptables-persistent xorriso squashfs-tools mtools syslinux-utils chromium-browser openbox || apt-get install -y curl build-essential git iptables iptables-persistent xorriso squashfs-tools mtools syslinux-utils openbox

# 2. Comprobar e instalar Node.js
if ! command -v node &> /dev/null; then
    echo "[+] Node.js no detectado. Instalando el nodo oficial LTS (v20)..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
else
    NODE_VERSION=$(node -v)
    echo "[✔] Node.js ya instalado: $NODE_VERSION"
fi

# 3. Detectar ruta del proyecto CMineWar OS
INSTALL_DIR=$(pwd)
echo "[+] Directorio de instalación detectado: $INSTALL_DIR"

if [ ! -f "$INSTALL_DIR/package.json" ]; then
    echo "[-] ERROR: No se encuentra 'package.json' en el directorio: $INSTALL_DIR"
    echo "    Ejecuta el script desde la carpeta raíz del proyecto CMineWar OS."
    exit 1
fi

# 4. Compilar la aplicación React y el Servidor Full-stack
echo "[+] Instalando dependencias del proyecto npm..."
npm install

echo "[+] Compilando servidor nativo y activos estáticos de la interfaz web..."
npm run build

# 5. Configurar el Servicio de Systemd para mantener vivo CMineWar OS
echo "[+] Configurando daemon de fondo de Systemd en /etc/systemd/system/cminewar.service..."

cat <<EOF > /etc/systemd/system/cminewar.service
[Unit]
Description=CMineWar OS - Estación Servidora Cognitiva y Gestor de Almacenamiento
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/bin/node dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Recargar systemd y meter en arranque automático
systemctl daemon-reload
systemctl enable cminewar.service
systemctl restart cminewar.service

echo "[✔] Servicio 'cminewar.service' habilitado y arrancado con éxito en el puerto 3000."

# 5.5 Auto-configurar entorno de escritorio Openbox en modo Kiosco y prevenir popups de advertencia
echo "[+] Configurando Openbox y eliminando alertas de procesos huérfanos..."

# Prevenir los molestos errores "Failed to execute child process" en Openbox para binarios ausentes
# Creamos pequeños ejecutables dummy silenciosos en /usr/local/bin/ (para que tengan prioridad en el PATH)
for bin_name in evte obconf lxappearance conky compton picom nitrogen tint2 volumeicon x-terminal-emulator xterm lxterminal x-window-manager; do
  if ! command -v "$bin_name" &>/dev/null; then
    echo -e '#!/bin/sh\nexit 0' > "/usr/local/bin/$bin_name" 2>/dev/null || true
    chmod +x "/usr/local/bin/$bin_name" 2>/dev/null || true
  fi
done

# Crear directorios de configuración de Openbox si existen o se usan
mkdir -p /etc/xdg/openbox
mkdir -p ~/.config/openbox

# Definir la receta autostart para Openbox que arranca Chromium directamente a localhost:3000
cat << 'OBAUTO' > /tmp/cminewaros_openbox_autostart
#!/bin/sh
# Autostart para Openbox / CMineWar OS Kiosk
xset s off || true
xset -dpms || true
xset s noblank || true

# Asegurar loopback de red activa
ifconfig lo up || ip link set lo up || true

# Esperar activamente a que el servidor Express local en el puerto 3000 responda
# Esto previene pantallas blancas o fallas de carga prematuras durante arranques fríos lentos
for i in $(seq 1 30); do
  if wget -qO- http://localhost:3000/api/health &>/dev/null || wget -qO- http://localhost:3000 &>/dev/null || curl -s http://localhost:3000 &>/dev/null || nc -z localhost 3000 &>/dev/null; then
    break
  fi
  sleep 1
done

# Autodetectar navegador instalado
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

# Iniciar navegador en modo Kiosco de pantalla completa
# Se ejecuta en un bucle infinito que se auto-recupera de caídas accidentales de proceso o Alt+F4 involuntarios.
# Con perfiles limpios, se remueve el SingletonLock para solventar incidencias al reiniciar post apagón de hardware brusco.
while true; do
  rm -f /tmp/chromium-kiosk-profile/SingletonLock 2>/dev/null || true
  rm -f /tmp/chromium-kiosk-profile/Lock 2>/dev/null || true

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
    http://localhost:3000
    
  sleep 1
done &
OBAUTO

# Aplicar el script de autostart a nivel del sistema (para todos los usuarios que abran Openbox)
cp /tmp/cminewaros_openbox_autostart /etc/xdg/openbox/autostart || true
chmod +x /etc/xdg/openbox/autostart || true

# Aplicar también para el usuario root y usuarios del sistema si poseen perfil configurado
if [ -d "$HOME/.config" ]; then
  mkdir -p "$HOME/.config/openbox" || true
  cp /tmp/cminewaros_openbox_autostart "$HOME/.config/openbox/autostart" || true
  chmod +x "$HOME/.config/openbox/autostart" || true
fi

# Hacer lo mismo para el usuario físico no-root en caso de existir en /home
for user_dir in /home/*; do
  if [ -d "$user_dir" ]; then
    mkdir -p "$user_dir/.config/openbox" || true
    cp /tmp/cminewaros_openbox_autostart "$user_dir/.config/openbox/autostart" || true
    chmod +x "$user_dir/.config/openbox/autostart" || true
    # Asegurar que el usuario es dueño del directorio y el script
    user_name=$(basename "$user_dir")
    chown -R "$user_name:$user_name" "$user_dir/.config" || true
  fi
done

echo "[✔] Entorno de escritorio Openbox pre-configurado con éxito para Kiosco auto-arrancable."

# 6. Escribir el Gestor de Cortafuegos Físico de Debian (Anti-WAN)
echo "[+] Desplegando script de control del cortafuegos de internet en /usr/local/bin/cminewar-firewall..."

cat <<'EOF' > /usr/local/bin/cminewar-firewall
#!/usr/bin/env bash
# =========================================================================
# CONTROL DE CORTAFUEGOS CMINEWAR OS - TRÁFICO WAN / AISLAMIENTOS LOCALES DE RED
# =========================================================================

set -e

if [ "$EUID" -ne 0 ]; then
  echo "[-] ERROR: Requiere privilegios de root."
  exit 1
fi

ACTION=$1

if [ -z "$ACTION" ]; then
    echo "Uso: cminewar-firewall [block | allow | status]"
    echo ""
    echo "  block  - Bloquea todo el tráfico a Internet (WAN), manteniendo la red local libre."
    echo "  allow  - Permite libre acceso a internet (comportamiento estándar)."
    echo "  status - Muestra las reglas de filtrado de red de iptables vigentes."
    exit 0
fi

case "$ACTION" in
    block)
        echo "[!] Activando reglas de aislamiento WAN en iptables..."
        
        # Guardar comportamiento actual para deshacer
        iptables --flush OUTPUT || true
        
        # 1. Permitir todo el tráfico en la interfaz de bucle local (loopback)
        iptables -A OUTPUT -o lo -j ACCEPT
        
        # 2. Permitir tráfico de salida con destino a redes locales privadas standard (LAN)
        # Redes tipo Clase C (las domésticas usuales):
        iptables -A OUTPUT -d 192.168.0.0/16 -j ACCEPT
        # Redes tipo Clase B:
        iptables -A OUTPUT -d 172.16.0.0/12 -j ACCEPT
        # Redes tipo Clase A corporativas:
        iptables -A OUTPUT -d 10.0.0.0/8 -j ACCEPT
        
        # 3. El resto del tráfico de salida hacia Internet (WAN) queda terminantemente bloqueado
        iptables -P OUTPUT DROP
        
        # Guardar reglas persistentes para sobrevivir a reinicios
        if command -v iptables-save &> /dev/null; then
            iptables-save > /etc/iptables/rules.v4 || true
        fi
        
        echo "[✔] Cortafuegos ACTIVADO con Éxito."
        echo "    El equipo se encuentra completamente aislado de la WAN (Internet)."
        echo "    Acceso de administración LAN sigue 100% abierto."
        ;;
        
    allow)
        echo "[+] Abriendo compuertas del Cortafuegos para libre acceso a Internet..."
        
        # Restaurar comportamiento de políticas por defecto
        iptables -P OUTPUT ACCEPT
        iptables --flush OUTPUT || true
        
        # Guardar reglas vacías para persistencia
        if command -v iptables-save &> /dev/null; then
            iptables-save > /etc/iptables/rules.v4 || true
        fi
        
        echo "[✔] Cortafuegos APAGADO con Éxito. Acceso a Internet completamente libre."
        ;;
        
    status)
        echo "========================================================================="
        echo "     ESTADO DE CONTROL DE RUTAS FÍSICAS DE RED DE CMINEWAR OS - IP_TABLES"
        echo "========================================================================="
        POLICY=$(iptables -S OUTPUT | grep "\-P" | awk '{print $3}')
        if [ "$POLICY" = "DROP" ]; then
            echo -e "ESTADO GLOBAL DE RED DE SALIDA: \033[31m🔒 WAN BLOQUEADA (Aislamiento LAN Activo)\033[0m"
        else
            echo -e "ESTADO GLOBAL DE RED DE SALIDA: \033[32m🟢 WAN + LAN LIBRES Y ABIERTAS\033[0m"
        fi
        echo ""
        echo "Lista de reglas actuales de salida en iptables:"
        iptables -L OUTPUT -n --line-numbers
        ;;
        
    *)
        echo "[-] Dirección u opción desconocida. Usa block, allow o status."
        exit 1
        ;;
esac
EOF

chmod +x /usr/local/bin/cminewar-firewall

# 7. Imprimir resumen
LOCAL_IP=$(hostname -I | awk '{print $1}' || echo "127.0.0.1")

echo "========================================================================="
echo "  🏅 INSTALACIÓN E INTEGRACIÓN EN DEBIAN COMPLETADA DE FORMA EXITOSA"
echo "========================================================================="
echo "  1. Servicio de Arranque: cminewar.service ya de fondo mediante systemd."
echo "  2. Acceso Local de Red:   http://$LOCAL_IP:3000"
echo "  3. Persistencia de Ventanas: Enlazado automáticamente por perfiles del navegador local."
echo "  4. Cortafuegos de Red:"
echo "     * Para bloquear internet:  sudo cminewar-firewall block"
echo "     * Para habilitar internet:  sudo cminewar-firewall allow"
echo "     * Para ver estado actual:  sudo cminewar-firewall status"
echo "========================================================================="
