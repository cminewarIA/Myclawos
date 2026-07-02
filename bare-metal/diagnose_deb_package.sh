#!/usr/bin/env bash
# =========================================================================
# SCRIPT DE DIAGNÓSTICO DE INTEGRIDAD Y PERMISOS - CMINEWAR DEB PACKAGE
# =========================================================================

# No usamos set -e para poder recorrer todas las pruebas y reportar todos los errores juntos al final.
ERRORS=0
WARNINGS=0

PACKAGE_DIR="cminewar-package"

echo "========================================================================="
echo "   DIAGNÓSTICO DE SEGURIDAD, INTEGRIDAD Y PERMISOS DEL PAQUETE .DEB"
echo "========================================================================="
echo "Directorio de análisis: $PACKAGE_DIR/"
echo "Fecha y hora: $(date)"
echo "-------------------------------------------------------------------------"

if [ ! -d "$PACKAGE_DIR" ]; then
    echo "[❌ ERROR] El directorio '$PACKAGE_DIR' no existe en la raíz."
    exit 1
fi

# Función para obtener permisos en formato octal (ej: 755) compatible con Linux/macOS
get_octal_permissions() {
    local file_path="$1"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        stat -f "%OLp" "$file_path" 2>/dev/null || stat -f "%Lp" "$file_path"
    else
        stat -c "%a" "$file_path"
    fi
}

# 1. Comprobación de Estructura de Carpetas Requerida
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

echo "[+] 1. Verificando directorios estructurales..."
for dir in "${REQUIRED_DIRS[@]}"; do
    TARGET_DIR="$PACKAGE_DIR/$dir"
    if [ ! -d "$TARGET_DIR" ]; then
        echo "  [❌ ERROR] Directorio ausente: $dir"
        ERRORS=$((ERRORS + 1))
    else
        PERM=$(get_octal_permissions "$TARGET_DIR")
        if [ "$PERM" != "755" ]; then
            echo "  [⚠️ ADVERTENCIA] El directorio '$dir' tiene permisos $PERM (Se recomienda 755)"
            WARNINGS=$((WARNINGS + 1))
        else
            echo "  [✓] Estructura OK: /$dir (Permisos: $PERM)"
        fi
    fi
done

echo ""

# 2. Comprobación de Archivos Esenciales y sus Permisos Específicos
# Formato: "ruta_relativa|permisos_requeridos|descripción"
REQUIRED_FILES=(
    "DEBIAN/control|644|Archivo de control de Debian"
    "DEBIAN/postinst|755|Script post-instalación de systemd y permisos"
    "DEBIAN/prerm|755|Script pre-remoción de detención de servicios"
    "usr/bin/cminewar-companion|755|Lanzador global de la aplicación companion"
    "usr/share/applications/cminewar-companion.desktop|644|Acceso directo e interfaz de escritorio"
    "usr/share/cminewar/cminewar-companion.py|755|Código fuente de la aplicación de control en Python"
    "usr/local/bin/cminewar-firewall|755|Script del cortafuegos WAN de iptables"
    "lib/systemd/system/cminewar.service|644|Servicio systemd de la estación servidora"
)

echo "[+] 2. Verificando archivos indispensables y permisos exactos..."
for entry in "${REQUIRED_FILES[@]}"; do
    IFS="|" read -r file_path req_perm desc <<< "$entry"
    TARGET_FILE="$PACKAGE_DIR/$file_path"
    
    if [ ! -f "$TARGET_FILE" ]; then
        echo "  [❌ ERROR] Archivo requerido ausente: $file_path ($desc)"
        ERRORS=$((ERRORS + 1))
    else
        PERM=$(get_octal_permissions "$TARGET_FILE")
        if [ "$PERM" != "$req_perm" ]; then
            echo "  [❌ ERROR] Permisos incorrectos en $file_path ($desc). Actual: $PERM, Requerido: $req_perm"
            ERRORS=$((ERRORS + 1))
        else
            echo "  [✓] Archivo OK: /$file_path ($desc) - Permisos: $PERM"
        fi
    fi
done

echo ""

# 3. Comprobación de Sintaxis y Cabeceras en DEBIAN/control
echo "[+] 3. Auditando metadatos en DEBIAN/control..."
CONTROL_FILE="$PACKAGE_DIR/DEBIAN/control"
if [ -f "$CONTROL_FILE" ]; then
    # Verificar campos requeridos por dpkg-deb
    for field in "Package:" "Version:" "Section:" "Priority:" "Architecture:" "Maintainer:" "Description:"; do
        if ! grep -q "^$field" "$CONTROL_FILE"; then
            echo "  [❌ ERROR] El archivo de control no contiene la cabecera obligatoria: $field"
            ERRORS=$((ERRORS + 1))
        fi
    done
    if [ $ERRORS -eq 0 ]; then
        echo "  [✓] Metadatos de control válidos."
    fi
else
    echo "  [❌ ERROR] Archivo DEBIAN/control ausente. No se puede auditar."
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 4. Comprobación del script postinst (set -e y systemctl seguro)
echo "[+] 4. Evaluando seguridad en script postinst..."
POSTINST_FILE="$PACKAGE_DIR/DEBIAN/postinst"
if [ -f "$POSTINST_FILE" ]; then
    if ! grep -q "^set -e" "$POSTINST_FILE"; then
        echo "  [⚠️ ADVERTENCIA] El script postinst no contiene 'set -e'. Cualquier fallo intermedio no detendrá la instalación."
        WARNINGS=$((WARNINGS + 1))
    else
        echo "  [✓] Directiva 'set -e' presente en postinst."
    fi
    
    if grep -q "systemctl" "$POSTINST_FILE" && ! grep -q "command -v systemctl" "$POSTINST_FILE"; then
        echo "  [⚠️ ADVERTENCIA] postinst ejecuta systemctl de forma directa sin comprobar su existencia de manera segura en entornos Docker/chroot."
        WARNINGS=$((WARNINGS + 1))
    else
        echo "  [✓] Comprobaciones seguras de systemctl presentes en postinst."
    fi
else
    echo "  [❌ ERROR] Archivo DEBIAN/postinst ausente."
    ERRORS=$((ERRORS + 1))
fi

echo ""

# 5. Evaluando contenido y consistencia del archivo .desktop
echo "[+] 5. Evaluando contenido del archivo .desktop..."
DESKTOP_FILE="$PACKAGE_DIR/usr/share/applications/cminewar-companion.desktop"
if [ -f "$DESKTOP_FILE" ]; then
    # Validar campo Exec
    if grep -q "^Exec=/usr/bin/cminewar-companion" "$DESKTOP_FILE"; then
        echo "  [✓] Campo 'Exec' configurado correctamente con la ruta absoluta: /usr/bin/cminewar-companion"
    else
        echo "  [❌ ERROR] El campo 'Exec' del archivo .desktop no apunta a la ruta absoluta correcta (/usr/bin/cminewar-companion)."
        ERRORS=$((ERRORS + 1))
    fi

    # Validar campo Icon
    if grep -q "^Icon=/usr/share/pixmaps/cminewar-companion.png" "$DESKTOP_FILE"; then
        echo "  [✓] Campo 'Icon' configurado correctamente con la ruta absoluta: /usr/share/pixmaps/cminewar-companion.png"
    else
        echo "  [❌ ERROR] El campo 'Icon' del archivo .desktop no apunta a la ruta del icono consistente en /usr/share/pixmaps/."
        ERRORS=$((ERRORS + 1))
    fi

    # Validar campo Categories
    if grep -q "^Categories=.*Utility;" "$DESKTOP_FILE" && grep -q "^Categories=.*System;" "$DESKTOP_FILE"; then
        echo "  [✓] Campo 'Categories' contiene las categorías correctas ('Utility;System;')."
    else
        echo "  [❌ ERROR] El campo 'Categories' del archivo .desktop no contiene las categorías recomendadas ('Utility;System;')."
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "  [❌ ERROR] Archivo .desktop ausente en usr/share/applications/."
    ERRORS=$((ERRORS + 1))
fi

echo "-------------------------------------------------------------------------"
echo "=== RESUMEN DE DIAGNÓSTICO ==="
echo "Errores críticos encontrados: $ERRORS"
echo "Advertencias encontradas: $WARNINGS"
echo "-------------------------------------------------------------------------"

if [ $ERRORS -gt 0 ]; then
    echo "[❌ FALLIDO] El paquete no cumple con las directrices de integridad y permisos necesarias para construir un .deb válido."
    echo "Utilice './bare-metal/verify_deb_structure.sh' para ajustar todos los permisos de forma automatizada."
    exit 1
else
    echo "[✔] ÉXITO: El paquete '$PACKAGE_DIR' está en un estado óptimo y es 100% válido para ser empaquetado con dpkg-deb."
    exit 0
fi

# Proyecto propiedad de Yonah Llanes
