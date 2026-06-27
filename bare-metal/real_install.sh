#!/usr/bin/env bash
# =========================================================================
#             CMINEWAR OS PHYSICAL BARE-METAL SYSTEM INSTALLER
# =========================================================================
# Script real y automatizado para formatear, particionar e instalar
# CMineWar OS de forma nativa en la unidad de almacenamiento física elegida.
# =========================================================================

set -e

DISK="$1"
OMIT_USER="$2"   # "true" o "false"
DISABLE_SLEEP="$3" # "true" o "false"
BROWSER_CHROMIUM="$4" # "true" o "false"

PROGRESS_FILE="/tmp/cminewar_install_progress.txt"
LOG_FILE="/tmp/cminewar_install_log.txt"

# Inicializar estados de progreso
echo "0" > "$PROGRESS_FILE"
cat /dev/null > "$LOG_FILE"

exec > >(tee -a "$LOG_FILE") 2>&1

echo "========================================================="
echo "   🛰️ INICIANDO INSTALACIÓN REAL DE CMINEWAR OS KERNEL  "
echo "========================================================="
echo "Unidad objetivo: /dev/$DISK"
echo "Omitir usuario estándar (Solo Root): $OMIT_USER"
echo "Desactivar suspensión ACPI: $DISABLE_SLEEP"
echo "Navegador por defecto Chromium: $BROWSER_CHROMIUM"
echo "---------------------------------------------------------"

if [ -z "$DISK" ] || [ ! -b "/dev/$DISK" ]; then
    echo "[!] ERROR: Unidad física /dev/$DISK inexistente o no es un dispositivo de bloque válido."
    echo "FAILED" > "$PROGRESS_FILE"
    exit 1
fi

# 1. PREVENCIÓN DE ACCIDENTES EN ENTORNO DE DESARROLLO
# Ejecutar el instalador portable en Python de forma automatizada y transparente
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
python3 "$SCRIPT_DIR/real_install.py" "$DISK" "$OMIT_USER" "$DISABLE_SLEEP" "$BROWSER_CHROMIUM"
exit $?
