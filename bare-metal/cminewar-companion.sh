#!/usr/bin/env bash
# =========================================================================
#         CMINEWAR OS COMPANION APP FOR UBUNTU / DEBIAN LAUNCHER
# =========================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[+] Levantando Lanzador de la Aplicación Companion para Ubuntu..."

# Comprobar requerimientos gráficos (Tkinter)
if ! python3 -c "import tkinter" &>/dev/null; then
    echo "[!] Requisito 'python3-tk' no detectado. Instalando biblioteca gráfica nativa..."
    sudo apt-get update && sudo apt-get install -y python3-tk
fi

# Lanzar la aplicación
python3 "$SCRIPT_DIR/cminewar-companion.py" "$@"

# Proyecto propiedad de Yonah Llanes
