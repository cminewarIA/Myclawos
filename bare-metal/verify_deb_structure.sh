#!/usr/bin/env bash
# =========================================================================
# SCRIPT DE VERIFICACIÓN DE ESTRUCTURA Y PERMISOS DEL PAQUETE DEBIAN (.DEB)
# =========================================================================

set -e

PACKAGE_DIR="cminewar-package"

echo "[+] Iniciando verificación de la estructura del paquete en '$PACKAGE_DIR'..."

if [ ! -d "$PACKAGE_DIR" ]; then
    echo "[-] ERROR: El directorio '$PACKAGE_DIR' no existe."
    exit 1
fi

# 1. Definir los archivos y carpetas indispensables
REQUIRED_DIRS=(
    "DEBIAN"
    "usr/bin"
    "usr/share/applications"
    "usr/share/cminewar"
    "usr/share/cminewar/backend"
    "usr/share/pixmaps"
    "usr/local/bin"
    "lib/systemd/system"
)

REQUIRED_FILES=(
    "DEBIAN/control"
    "DEBIAN/postinst"
    "DEBIAN/prerm"
    "usr/bin/cminewar-companion"
    "usr/share/applications/cminewar-companion.desktop"
    "usr/share/cminewar/cminewar-companion.py"
    "usr/local/bin/cminewar-firewall"
    "lib/systemd/system/cminewar.service"
)

# 2. Verificar existencia de directorios requeridos
echo "[+] Comprobando directorios esenciales..."
for dir in "${REQUIRED_DIRS[@]}"; do
    TARGET_DIR="$PACKAGE_DIR/$dir"
    if [ ! -d "$TARGET_DIR" ]; then
        echo "[-] ERROR: Directorio requerido ausente: $TARGET_DIR"
        exit 1
    else
        echo "  [✓] Directorio presente: $dir"
    fi
done

# 3. Verificar existencia de archivos esenciales
echo "[+] Comprobando archivos requeridos..."
for file in "${REQUIRED_FILES[@]}"; do
    TARGET_FILE="$PACKAGE_DIR/$file"
    if [ ! -f "$TARGET_FILE" ]; then
        echo "[-] ERROR: Archivo indispensable ausente: $TARGET_FILE"
        exit 1
    else
        echo "  [✓] Archivo presente: $file"
    fi
done

# 4. Ajustar y auditar permisos de directorios (Deben ser 755)
echo "[+] Validando y normalizando permisos de directorios a 755..."
find "$PACKAGE_DIR" -type d -print0 | while IFS= read -r -d '' dir; do
    chmod 755 "$dir"
    echo "  [✓] Directorio ajustado (755): $dir"
done

# 5. Ajustar y auditar permisos de archivos (644 por defecto, 755 para ejecutables)
echo "[+] Validando y normalizando permisos de archivos..."
find "$PACKAGE_DIR" -type f -print0 | while IFS= read -r -d '' file; do
    # Obtener la ruta relativa quitando el prefijo de la carpeta del paquete
    REL_PATH="${file#$PACKAGE_DIR/}"
    
    case "$REL_PATH" in
        # Scripts de control de DEBIAN (Deben ser ejecutables)
        DEBIAN/postinst|DEBIAN/prerm)
            chmod 755 "$file"
            echo "  [⚡ EXECUTABLE 755] Script de control: $REL_PATH"
            ;;
        # Binarios y scripts ejecutables del sistema
        usr/bin/cminewar-companion|usr/share/cminewar/cminewar-companion.py|usr/local/bin/cminewar-firewall)
            chmod 755 "$file"
            echo "  [⚡ EXECUTABLE 755] Script de ejecución: $REL_PATH"
            ;;
        # Acceso directo de escritorio (Debe ser estricto 644)
        usr/share/applications/cminewar-companion.desktop)
            chmod 644 "$file"
            echo "  [📋 INTERFACE 644] Acceso .desktop: $REL_PATH"
            ;;
        # Control de Debian (Debe ser 644)
        DEBIAN/control)
            chmod 644 "$file"
            echo "  [📋 CONTROL 644] Archivo de control: $REL_PATH"
            ;;
        # Servicios de systemd (Debe ser 644)
        lib/systemd/system/cminewar.service)
            chmod 644 "$file"
            echo "  [📋 SERVICE 644] Servicio systemd: $REL_PATH"
            ;;
        # Por defecto, cualquier otro archivo (como assets, html, css, js) es 644
        *)
            chmod 644 "$file"
            ;;
    esac
done

echo "[✔] Auditoría y normalización completas con éxito. El paquete está listo para ser compilado con 'dpkg-deb'."
exit 0

# Proyecto propiedad de Yonah Llanes
