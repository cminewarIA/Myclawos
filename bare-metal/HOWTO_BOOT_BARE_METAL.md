# Guía de Construcción Bare-Metal de clawOS (BIOS UEFI / Legacy)

Esta carpeta contiene los archivos fuentes reales de bajo nivel y las recetas de empaquetado del sistema operativo para poder **arrancar y ejecutar clawOS de forma nativa directamente en el hardware físico de tu ordenador (bare-metal)**.

---

## Estructura de Archivos Bare-Metal creados
*   `boot.asm` - Cargador de arranque Master Boot Record (MBR) escrito en **Ensamblador puro (16-bit x86 ASM)** para sistemas con BIOS Legacy antiguos o sistemas modernos con CSM (Compatibility Support Module) activado.
*   `uefi_loader.c` - Cargador de arranque UEFI de 64 bits en **C nativo**, que usa la especificación e inicializa los buffers gráficos del ordenador físico antes de invocar la interfaz visual.
*   `build_iso.sh` - Script de construcción en Bash que detenta el blueprint para empaquetar de forma real esta aplicación React en una distribución minimalista auto-arrancable (Kiosko) utilizando **Alpine Linux** con X11 y Chromium.

---

## Método 1: Ejecutar el cargador de arranque Legacy de 16-bits (boot.asm)
Este es el cargador de arranque en hardware real que emite por pantalla la estructura del dragón de clawOS impreso en código máquina nativo.

### 1. Requisitos para compilar en Linux / macOS:
Instala un compilador de ensamblador de la familia x86 como `nasm` y un emulador veloz como `qemu`:
```bash
# Ubuntu / Debian
sudo apt-get install nasm qemu-system-x86 -y

# macOS
brew install nasm qemu
```

### 2. Compilar el sector de arranque de 512 bytes:
```bash
nasm -f bin boot.asm -o boot.bin
```

### 3. Probar el archivo binario bootloader en QEMU:
```bash
qemu-system-i386 -fda boot.bin
```

### 4. Flashear la USB física de tu ordenador para arrancar directamente (Bare-Metal):
> **⚠️ ADVERTENCIA CRÍTICA:** Asegúrate de verificar minuciosamente en qué unidad vas a escribir. Reemplaza `sdX` con tu disco USB desmontado (ej. `/dev/sdb`, `/dev/sdc`). Escribir en la unidad incorrecta destruirá datos de tus discos duros principales.

```bash
sudo dd if=boot.bin of=/dev/sdX bs=512 conv=notrunc && sync
```
Una vez flasheado, apaga tu ordenador, conéctalo a un puerto USB, enciende el ordenador y presiona repetidamente la tecla del menú de arranque de tu placa madre (F12, F11, F8 o Esc) y selecciona **Arrancar vía dispositivo USB Legacy / CSM**.

---

## Método 2: Crear una ISO real Kiosk de clawOS que arranque directamente en UEFI
La forma estándar y profesional en la que sistemas operativos web (como ChromeOS) corren en bare-metal es utilizando un micro-kernel Linux configurado en modo **Kiosco de pantalla completa**, el cual arranca el servidor ligero local de Node.js y un navegador en pantalla completa optimizado al máximo por hardware para el renderizado acelerado de la interfaz.

### Pasos para ensamblar tu propia ISO Kiosk con Alpine Linux:

1. **Instalar dependencias necesarias de empaquetado en tu entorno de desarrollo Linux**:
   ```bash
   sudo apt-get install xorriso squashfs-tools mtools syslinux-utils -y
   ```

2. **Compilar la interfaz de clawOS**:
   ```bash
   npm run build
   ```
   Esto generará los archivos estáticos en la carpeta `dist/`.

3. **Configurar el Auto-arranque de X11**:
   La receta incluida coloca el archivo `autostart` de `/tmp/clawos-iso-build/autostart` en tu configuración de pantalla completa del gestor de ventanas ligero (`openbox`), que levanta Chromium de modo kiosco con los parámetros:
   ```bash
   chromium-browser --kiosk --no-sandbox file:///opt/clawos/dist/index.html
   ```

4. **Quemar la ISO resultante a tu USB**:
   Puedes utilizar herramientas visuales seguras como **BalenaEtcher**, **Rufus**, o el comando tradicional `dd`:
   ```bash
   sudo dd if=clawos-live.iso of=/dev/sdX bs=4M status=progress && sync
   ```

Configura la UEFI de tu ordenador para deshabilitar el "Secure Boot" y arranca de inmediato en la majestuosidad acelerada de clawOS bare-metal.
