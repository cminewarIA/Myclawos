#!/usr/bin/env bash
# =========================================================================
#       🐉 CMINEWAR OS BOOT TRACER & DIAGNOSTICS SCRIPT FOR DEBIAN 🐉
# =========================================================================
# Este script se ejecuta al inicio del sistema para capturar y registrar de forma
# detallada los tiempos de arranque de cada servicio, avisos del kernel y el uso
# de recursos. Está diseñado para diagnosticar demoras en el arranque de Debian.
# =========================================================================

set -e

# Asegurar privilegios de superusuario (root) para acceder a dmesg, systemd-analyze y crear logs
if [ "$EUID" -ne 0 ]; then
  echo "[-] ERROR: Requiere ejecutarse como ROOT para auditar el sistema." >&2
  exit 1
fi

LOG_FILE="/var/log/cminewar-boot.log"
LOG_DIR=$(dirname "$LOG_FILE")

# Crear directorio de logs si no existe
mkdir -p "$LOG_DIR"

# Escribir cabecera del informe
echo "=========================================================================" > "$LOG_FILE"
echo "        🛸 INFORME DE DIAGNÓSTICO DE ARRANQUE DE CMINEWAR OS 🛸" >> "$LOG_FILE"
echo "=========================================================================" >> "$LOG_FILE"
echo "Fecha de Análisis: $(date '+%Y-%m-%d %H:%M:%S')" >> "$LOG_FILE"
echo "Nombre de Host:    $(hostname)" >> "$LOG_FILE"
echo "Versión Kernel:    $(uname -r)" >> "$LOG_FILE"
echo "Arquitectura:      $(uname -m)" >> "$LOG_FILE"
echo "Uptime Actual:     $(uptime -p)" >> "$LOG_FILE"
echo "=========================================================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 1. RENDIMIENTO GENERAL DEL ARRANQUE (systemd-analyze)
echo "[+] ⏱️ ANÁLISIS DEL TIEMPO DE ARRANQUE GENERAL (systemd-analyze):" >> "$LOG_FILE"
if command -v systemd-analyze &>/dev/null; then
  systemd-analyze >> "$LOG_FILE" 2>&1 || echo "No disponible o bloqueado." >> "$LOG_FILE"
else
  echo "Herramienta systemd-analyze no encontrada en este entorno." >> "$LOG_FILE"
fi
echo "" >> "$LOG_FILE"

# 2. SERVICIOS QUE MÁS TIEMPO DE ARRANQUE CONSUMEN (systemd-analyze blame)
echo "[+] 🐢 DETALLE DE SERVICIOS MÁS LENTOS (systemd-analyze blame - Top 15):" >> "$LOG_FILE"
if command -v systemd-analyze &>/dev/null; then
  systemd-analyze blame | head -n 15 >> "$LOG_FILE" 2>&1 || echo "No disponible." >> "$LOG_FILE"
else
  echo "Herramienta systemd-analyze blame no disponible." >> "$LOG_FILE"
fi
echo "" >> "$LOG_FILE"

# 3. CADENA CRÍTICA DE DEPENDENCIAS DE ARRANQUE
echo "[+] 🔗 CADENA CRÍTICA DE INICIALIZACIÓN (systemd-analyze critical-chain):" >> "$LOG_FILE"
if command -v systemd-analyze &>/dev/null; then
  systemd-analyze critical-chain | head -n 25 >> "$LOG_FILE" 2>&1 || echo "No disponible." >> "$LOG_FILE"
else
  echo "Herramienta systemd-analyze critical-chain no disponible." >> "$LOG_FILE"
fi
echo "" >> "$LOG_FILE"

# 4. ADVERTENCIAS Y ERRORES DEL KERNEL (dmesg)
echo "[+] ⚠️ ALERTAS Y ERRORES RECIENTES EN DMESG (Niveles: Crit, Err, Warn):" >> "$LOG_FILE"
if command -v dmesg &>/dev/null; then
  dmesg --level=crit,err,warn | tail -n 30 >> "$LOG_FILE" 2>&1 || echo "Error de acceso a dmesg (seguridad restringida/sandbox)." >> "$LOG_FILE"
else
  echo "Comando dmesg no encontrado." >> "$LOG_FILE"
fi
echo "" >> "$LOG_FILE"

# 5. DIAGNÓSTICO DE ALMACENAMIENTO FÍSICO Y PARTICIONES
echo "[+] 💾 ESTADO DE ESPACIO DE ALMACENAMIENTO:" >> "$LOG_FILE"
df -h >> "$LOG_FILE" 2>&1 || echo "No se pudo obtener información de df." >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 6. ESTADO DE MEMORIA RAM Y CPU AL MOMENTO DEL ARRANQUE
echo "[+] 🧠 UTILIZACIÓN DE MEMORIA RAM Y CPU AL INICIO:" >> "$LOG_FILE"
free -h >> "$LOG_FILE" 2>&1 || echo "No disponible." >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
echo "Carga del Procesador (Load Average):" >> "$LOG_FILE"
cat /proc/loadavg >> "$LOG_FILE" 2>&1 || echo "No disponible." >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 7. LOGS DE ERROR EN EL DAEMON DE CMINEWAR
echo "[+] 🐉 ÚLTIMOS LOGS DEL SERVICIO CMINEWAR OS:" >> "$LOG_FILE"
if command -v journalctl &>/dev/null; then
  journalctl -u cminewar.service -n 20 --no-pager >> "$LOG_FILE" 2>&1 || echo "No se pudo consultar el journal del servicio." >> "$LOG_FILE"
else
  echo "Herramienta journalctl no disponible." >> "$LOG_FILE"
fi

echo "" >> "$LOG_FILE"
echo "=========================================================================" >> "$LOG_FILE"
echo "     🐉 FIN DEL REPORTE DE DIAGNÓSTICO DE ARRANQUE CMINEWAR OS 🐉" >> "$LOG_FILE"
echo "=========================================================================" >> "$LOG_FILE"

echo "[✔] Registro de eventos de arranque generado con éxito en $LOG_FILE"

# Proyecto propiedad de Yonah Llanes
