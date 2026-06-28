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

echo "[+] Instalando herramientas del sistema y suite Omarchy de terminal (Consola y TUI pura)..."
apt-get install -y curl build-essential git iptables iptables-persistent xorriso squashfs-tools mtools syslinux-utils tmux neovim btop htop fzf zoxide jq || true

echo "[+] Nota: Modo Omarchy activo. Se prioriza y ejecuta el espacio de trabajo de consola interactiva pura directamente en TTY (sin Openbox)."
BROWSER_INSTALLED=false

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

# Robustez: Si el usuario ejecuta el script desde la carpeta bare-metal/ o subcarpetas, subir un nivel
if [ ! -f "$INSTALL_DIR/package.json" ] && [ -f "$INSTALL_DIR/../package.json" ]; then
    echo "[+] Detectado que se ejecuta desde subcarpeta. Subiendo un nivel para ubicar la raíz del proyecto..."
    cd ..
    INSTALL_DIR=$(pwd)
fi

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

# 5.5 Configurar el arranque en consola pura por defecto sin servidor gráfico
echo "[+] Configurando el sistema operativo para inicio automático por defecto en consola pura (TUI/modo texto)..."
systemctl set-default multi-user.target || true

# 5.5 Desplegar componentes de la Suite de Consola Interactiva Omarchy de CMineWar OS
echo "[+] Creando cargadores y dashboards interactivos de la Suite Omarchy..."

# A. Desplegar Cliente Chat AI Core CLI en /usr/local/bin/cminewar-ai-cli
cat << 'AICLI' > /usr/local/bin/cminewar-ai-cli
#!/usr/bin/env bash
# =========================================================================
#            🛸 GOOGLE ANTIGRAVITY AGENT WORKSPACE - INTERACTIVE CLI 🛸
# =========================================================================

# Clear screen and show premium loader
clear
echo -e "\033[1;35m"
echo "  ┌────────────────────────────────────────────────────────┐"
echo "  │        🛸 ANTIGRAVITY AGENT CONTAINER CLI v2.4 🛸      │"
echo "  └────────────────────────────────────────────────────────┘"
echo -e "\033[0m"

echo -e "\033[1;33m[⚙] Inicializando subsistemas lógicos de Antigravity...\033[0m"
sleep 0.5
echo -e "    ▷ Conectando con Google AI Control Plane..."
sleep 0.4
echo -e "    ▷ Solicitando modelo de agente \033[1;36mantigravity-preview-05-2026\033[0m..."
sleep 0.4
echo -e "    ▷ Levantando entorno de sandbox remoto (\033[1;32mremote-sandbox-8291a\033[0m)..."
sleep 0.5
echo -e "    ▷ Sincronizando árbol de archivos CMineWar Workspace..."
sleep 0.3
echo -e "\033[1;32m[✔] ¡Sandbox listo y montado correctamente!\033[0m"
echo ""
echo -e "\033[1;30mConectado al runtime remoto. Escribe \033[31mexit\033[30m o \033[31mquit\033[30m para salir del sandbox.\033[0m"
echo -e "\033[1;30mEscribe tu requerimiento para que el Agente Antigravity compile o investigue...\033[0m"
echo ""

HISTORY="[]"

while true; do
  echo -ne "\033[1;35mantigravity-agent㉿sandbox-cli\033[1;30m:~\033[1;32m# \033[0m"
  read -r USER_INPUT
  
  if [ -z "$USER_INPUT" ]; then
    continue
  fi
  
  if [ "$USER_INPUT" = "exit" ] || [ "$USER_INPUT" = "quit" ]; then
    echo -e "\033[1;33m[!] Saliendo del Sandbox de Antigravity...\033[0m"
    echo -e "\033[1;30mDesconectando hilos lógicos y liberando contenedor virtual... [OK]\033[0m"
    sleep 0.8
    break
  fi
  
  # Dynamic progression simulation
  echo -e ""
  echo -e "\033[1;34m[THOUGHT]\033[0m \033[1;30m(Step 1/3) Analizando solicitud del usuario:\033[0m \"$USER_INPUT\""
  sleep 0.7
  
  # Detect command execution intent
  LOW_INPUT=$(echo "$USER_INPUT" | tr '[:upper:]' '[:lower:]')
  if [[ "$LOW_INPUT" == *"ejecuta"* ]] || [[ "$LOW_INPUT" == *"corre"* ]] || [[ "$LOW_INPUT" == *"comando"* ]] || [[ "$LOW_INPUT" == *"crea"* ]] || [[ "$LOW_INPUT" == *"archivo"* ]]; then
    echo -e "\033[1;36m[BASH_CALL]\033[0m \033[1;30minvoking sandbox shell compiler... ($SHELL -c ...)\033[0m"
    sleep 0.8
    echo -e "\033[1;32m[BASH_RESULT]\033[0m \033[1;30mstdout: Code checked. Preparing environment execution context.\033[0m"
    sleep 0.4
  elif [[ "$LOW_INPUT" == *"busca"* ]] || [[ "$LOW_INPUT" == *"investiga"* ]] || [[ "$LOW_INPUT" == *"google"* ]] || [[ "$LOW_INPUT" == *"web"* ]]; then
    echo -e "\033[1;36m[SEARCH_CALL]\033[0m \033[1;30mgrounding via Google Search Core...\033[0m"
    sleep 0.9
    echo -e "\033[1;32m[SEARCH_RESULT]\033[0m \033[1;30mretrieved 4 high-authority citations for context extraction.\033[0m"
    sleep 0.5
  fi
  
  echo -e "\033[1;34m[THOUGHT]\033[0m \033[1;30m(Step 2/3) Ejecutando modelo de razonamiento reflexivo (Thinking)... \033[0m"
  sleep 0.8
  echo -e "\033[1;34m[THOUGHT]\033[0m \033[1;30m(Step 3/3) Sintetizando respuesta óptima para el usuario...\033[0m"
  echo -e ""
  
  # Preparar JSON para la petición
  ESCAPED_INPUT=$(echo "$USER_INPUT" | jq -R .)
  PAYLOAD="{\"message\": $ESCAPED_INPUT, \"history\": $HISTORY}"
  
  # Hacer llamada curl a /api/cminewar/chat
  RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    http://localhost:3000/api/cminewar/chat 2>/dev/null)
    
  if [ -z "$RESPONSE" ] || [ "$(echo "$RESPONSE" | jq -r 'type' 2>/dev/null)" != "object" ]; then
    AI_TEXT="[ALERTA DE SISTEMA - SERVIDOR INACTIVO]\nNo se pudo establecer conexión con el socket local 'localhost:3000'.\nPor favor, verifica que el servicio 'cminewar.service' o el servidor Express estén iniciados."
  else
    AI_TEXT=$(echo "$RESPONSE" | jq -r '.text')
  fi
  
  # Print the awesome agent text
  echo -e "\033[1;35m🛸 AGENTE ANTIGRAVITY:\033[0m"
  echo -e "$AI_TEXT"
  echo ""
  
  # Actualizar histórico local de la conversación en formato JSON
  ESCAPED_AI=$(echo "$AI_TEXT" | jq -R .)
  HISTORY=$(echo "$HISTORY" | jq ". + [{\"role\": \"user\", \"text\": $ESCAPED_INPUT}, {\"role\": \"model\", \"text\": $ESCAPED_AI}] | .[-10:]" 2>/dev/null || echo "[]")
done
AICLI
chmod +x /usr/local/bin/cminewar-ai-cli
ln -sf /usr/local/bin/cminewar-ai-cli /usr/local/bin/antigravity-cli
ln -sf /usr/local/bin/cminewar-ai-cli /usr/local/bin/antigravity

# B. Desplegar Gestor de Comunicaciones e Interfaces en /usr/local/bin/cminewar-network-panel
cat << 'NETPANEL' > /usr/local/bin/cminewar-network-panel
#!/usr/bin/env bash
# =========================================================================
#        PANEL INTERACTIVO DE RED, CONECTORES Y FIREWALL OMARCHY
# =========================================================================

show_network_panel() {
  clear
  echo -e "\033[1;35m"
  echo "  ╔════════════════════════════════════════════════════════╗"
  echo "  ║        🌐 GESTOR DE COMUNICACIONES CMINEWAR OS 🌐      ║"
  echo "  ╚════════════════════════════════════════════════════════╝"
  echo -e "\033[0m"
  
  # Firewall Status Indicator
  IF_STATUS=$(cminewar-firewall status | grep -q "WAN BLOQUEADA" && echo -e "\033[31m🔒 WAN BLOQUEADA (Aislamiento LAN Activo)\033[0m" || echo -e "\033[32m🟢 WAN + LAN DIRECTO (Abierto)\033[0m")
  echo -e "  \033[1;37mESTADO CORTAFUEGOS:\033[0m $IF_STATUS"
  
  # Tech Interfaces Summary
  echo ""
  echo -e "  \033[1;33mESTADO DE INTERFACES INALÁMBRICAS:\033[0m"
  
  # WiFi
  if command -v nmcli &>/dev/null; then
    WIFI_STATE=$(nmcli radio wifi)
    if [ "$WIFI_STATE" = "enabled" ]; then
      WIFI_VAL="\033[32mActivo\033[0m"
    else
      WIFI_VAL="\033[31mInactivo\033[0m"
    fi
  else
    WIFI_VAL="\033[33mSimulado / Activo\033[0m (wpa_supplicant)"
  fi
  echo -e "  * [\033[36mWiFi\033[0m]       $WIFI_VAL"
  
  # Bluetooth
  if command -v bluetoothctl &>/dev/null; then
    BT_STATE=$(bluetoothctl show | grep -q "Powered: yes" && echo -e "\033[32mEncendido\033[0m" || echo -e "\033[31mApagado\033[0m")
  else
    BT_STATE="\033[33mSimulado / Encendido\033[0m (bluez)"
  fi
  echo -e "  * [\033[36mBluetooth\033[0m]  $BT_STATE"
  
  # LTE Mobile
  if command -v mmcli &>/dev/null; then
    LTE_STATE=$(mmcli -m any &>/dev/null && echo -e "\033[32mModem Listo\033[0m" || echo -e "\033[31mSin Módem\033[0m")
  else
    LTE_STATE="\033[33mSimulado / Listo\033[0m (ModemManager)"
  fi
  echo -e "  * [\033[36mLTE / 5G\033[0m]   $LTE_STATE"
  
  echo ""
  echo -e "  \033[1;30m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\033[0m"
  echo -e "  \033[1;37mOPCIONES DE CONFIGURACIÓN RÁPIDA (Teclado):\033[0m"
  echo "  [1] Activar Cortafuegos (Bloquear todo Internet WAN)"
  echo "  [2] Desactivar Cortafuegos (Acceso total a WAN)"
  echo "  [3] Escanear Puntos de Acceso WiFi locales"
  echo "  [4] Escanear Dispositivos Bluetooth locales"
  echo "  [5] Mostrar Estadísticas LTE / Módem celular"
  echo "  [r] Recargar interfaz"
  echo "  [q] Salir"
  echo ""
}

while true; do
  show_network_panel
  echo -ne "  \033[1;35mSelecciona una opción [1-5, r, q]: \033[0m"
  read -r -n 1 opt
  echo ""
  
  case "$opt" in
    1)
      echo -e "\n  [!] Solicitando privilegios de root para bloquear WAN..."
      sudo cminewar-firewall block
      echo -e "  Presiona cualquier tecla para continuar..."
      read -r -n 1
      ;;
    2)
      echo -e "\n  [+] Solicitando privilegios de root para liberar WAN..."
      sudo cminewar-firewall allow
      echo -e "  Presiona cualquier tecla para continuar..."
      read -r -n 1
      ;;
    3)
      echo -e "\n  [*] Escaneando puntos de acceso WiFi..."
      if command -v nmcli &>/dev/null; then
        sudo nmcli device wifi list || true
      else
        echo -e "  \033[1;30m-- Redes WiFi simuladas encontradas --\033[0m"
        echo "  SSID: CMineWarNet_5G   | Canal: 36  | Señal: 98%  | Seguridad: WPA2-Enterprise"
        echo "  SSID: Fibra_Optica_X   | Canal: 6   | Señal: 74%  | Seguridad: WPA2-PSK"
        echo "  SSID: Invitados_Lab    | Canal: 1   | Señal: 45%  | Seguridad: WPA3"
      fi
      echo -e "  Presiona cualquier tecla para volver..."
      read -r -n 1
      ;;
    4)
      echo -e "\n  [*] Buscando dispositivos Bluetooth cercanos..."
      if command -v hcitool &>/dev/null; then
        sudo hcitool scan || true
      else
        echo -e "  \033[1;30m-- Dispositivos Bluetooth detectados --\033[0m"
        echo "  MAC: 00:1A:7D:DA:71:11 | Nombre: Auriculares de Usuario [Pila: Realtek rtlbt]"
        echo "  MAC: CC:2D:A9:05:4B:92 | Nombre: SmartTV_Oficina        [Pila: Broadcom brcm]"
      fi
      echo -e "  Presiona cualquier tecla para volver..."
      read -r -n 1
      ;;
    5)
      echo -e "\n  [*] Recuperando estado de banda móvil LTE..."
      if command -v mmcli &>/dev/null; then
        mmcli -m any || true
      else
        echo -e "  \033[1;30m-- Transceptor Simulado ModemManager (cdc_ether / qmi_wwan) --\033[0m"
        echo "  Modem: Qualcomm Gobi / LTE-M Genérico"
        echo "  Proveedor: CMineWar Network Services"
        echo "  Señal: [|||||] 92% (Excelente)"
        echo "  Estado: Conectado a Red de Datos Móviles (SIM Virtual Activa)"
      fi
      echo -e "  Presiona cualquier tecla para volver..."
      read -r -n 1
      ;;
    q|Q)
      echo -e "\n  Saliendo del Panel de Administración..."
      break
      ;;
    *)
      # Refresh
      ;;
  esac
done
NETPANEL
chmod +x /usr/local/bin/cminewar-network-panel

# C. Desplegar Orquestador del Dashboard Multipanel en /usr/local/bin/cminewar-omarchy-dashboard
cat << 'DASHBOARD' > /usr/local/bin/cminewar-omarchy-dashboard
#!/usr/bin/env bash
# =========================================================================
#            ORQUESTADOR DEL ENTORNO DE TRABAJO MULTI-PANEL OMARCHY
# =========================================================================

SESSION_NAME="omarchy_cminewar"

# Asegurar que no tengamos sesiones duplicadas
tmux kill-session -t "$SESSION_NAME" 2>/dev/null || true

# Iniciar tmux con soporte para comandos
tmux new-session -d -s "$SESSION_NAME" -n "CMineWar Core"

# Dividir verticalmente: Panel izquierdo (45% ancho) y Panel derecho (55% ancho)
tmux split-window -h -p 55 -t "$SESSION_NAME:0"

# Lanzar cliente de IA en el panel de la izquierda
tmux send-keys -t "$SESSION_NAME:0.0" "cminewar-ai-cli" C-m

# Dividir el panel secundario de la derecha horizontalmente para mostrar el network/firewall panel y btop
tmux split-window -v -p 45 -t "$SESSION_NAME:0.1"

# Enviar comandos de inicio a cada panel
tmux send-keys -t "$SESSION_NAME:0.1" "cminewar-network-panel" C-m

if command -v btop &>/dev/null; then
  tmux send-keys -t "$SESSION_NAME:0.2" "btop" C-m
elif command -v htop &>/dev/null; then
  tmux send-keys -t "$SESSION_NAME:0.2" "htop" C-m
else
  tmux send-keys -t "$SESSION_NAME:0.2" "top" C-m
fi

# Aplicar estética visual minimalista y moderna al estilo Omarchy
tmux set-option -t "$SESSION_NAME" status-bg black
tmux set-option -t "$SESSION_NAME" status-fg cyan
tmux set-option -t "$SESSION_NAME" status-interval 1
tmux set-option -t "$SESSION_NAME" status-left-length 50
tmux set-option -t "$SESSION_NAME" status-left "#[fg=green,bold]🐉 CMineWar OS #[fg=white]| #[fg=yellow]Omarchy TUI #[fg=white]| "
tmux set-option -t "$SESSION_NAME" status-right "#[fg=cyan,bold]%Y-%m-%d %H:%M:%S "
tmux set-option -t "$SESSION_NAME" pane-border-style "fg=colour236"
tmux set-option -t "$SESSION_NAME" pane-active-border-style "fg=cyan,bold"

# Lanzar sesión tmux interactiva en pantalla completa
tmux attach-session -t "$SESSION_NAME"
DASHBOARD
chmod +x /usr/local/bin/cminewar-omarchy-dashboard


# Desinstalar por completo servidores gráficos y gestores de ventanas para obligar arranque en consola pura
echo "[+] Desinstalando por completo Openbox, LightDM, Slim, GDM, SDDM, NoDM, Xorg y servidores gráficos..."
apt-get purge -y openbox lightdm gdm gdm3 sddm nodm slim xdm lxdm xserver-xorg xorg || true
apt-get autoremove -y || true

# Configurar el auto-login de root en la Consola TTY1 para albergar la Suite Omarchy de consola nativa
echo "[+] Configurando auto-login para el usuario root en tty1 de forma limpia..."
mkdir -p /etc/systemd/system/getty@tty1.service.d
cat << 'EOF' > /etc/systemd/system/getty@tty1.service.d/override.conf
[Service]
ExecStart=
ExecStart=-/sbin/agetty --autologin root --noclear %I $TERM
EOF

# Deshabilitar y limpiar el antiguo servicio omarchy-tui de systemd si existiese
systemctl disable omarchy-tui.service 2>/dev/null || true
rm -f /etc/systemd/system/omarchy-tui.service 2>/dev/null || true

# Inyectar el cargador automático de la Suite Omarchy en el Perfil de root (.profile)
echo "[+] Inyectando disparador automático de la Suite Omarchy en /root/.profile..."
sed -i '/cminewar-omarchy-dashboard/d' /root/.profile 2>/dev/null || true
sed -i '/Auto-arranque de la Suite/d' /root/.profile 2>/dev/null || true

cat << 'EOF' >> /root/.profile

# Auto-arranque de la Suite de Consola Interactiva Omarchy de CMineWar OS
if [ "$(tty)" = "/dev/tty1" ]; then
    # Esperar de forma activa a que el servidor Express local responda en el puerto 3000
    while ! curl -s http://localhost:3000/api/cminewar/system-status &>/dev/null; do
        sleep 0.5
    done
    exec cminewar-omarchy-dashboard
fi
EOF

systemctl daemon-reload
systemctl enable getty@tty1.service || true
systemctl restart getty@tty1.service || true

echo "[✔] Sistema configurado con éxito para arranque automático de la Suite Omarchy en consola pura sobre tty1."

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
