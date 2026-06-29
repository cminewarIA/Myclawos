#!/usr/bin/env bash
# =========================================================================
#      CMINEWAR OS - SHELL WRAPPER PARA ACTUALIZACIÓN INTEGRAL DEL SISTEMA
# =========================================================================
# Este script actúa como un punto de entrada seguro y compatible con Debian
# para ejecutar el proceso completo de actualización incluyendo el GRUB.
# =========================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_SCRIPT="$SCRIPT_DIR/update_system.py"

# Asegurar permisos del script de python
chmod +x "$PYTHON_SCRIPT" || true

# Ejecutar con python3
python3 -u "$PYTHON_SCRIPT" "$@"
