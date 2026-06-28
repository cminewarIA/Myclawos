# Guía de Construcción Bare-Metal de CMineWar OS (BIOS UEFI / Legacy)

Esta carpeta contiene los archivos fuentes reales de bajo nivel y las recetas de empaquetado del sistema operativo para poder **arrancar y ejecutar CMineWar OS de forma nativa directamente en el hardware físico de tu ordenador (bare-metal)**.

---

## 💡 Clarificación Crucial: ¿Es CMineWar OS una Simulación o es Real?

Este proyecto consta de **dos partes organizadas con absoluta honestidad de ingeniería**:

1. **La Interfaz de Desarrollo que ves en tu Pantalla:** Es una aplicación interactiva en tiempo real (SPA con React + Node.js) diseñada para emular y programar la UX/UI de CMineWar OS. Corre en un contenedor en la nube y sirve para "sandboxear" la apariencia de la interfaz.
2. **Los archivos nativos de esta carpeta (`/bare-metal`):** Son **totalmente reales e instalables sobre el hardware**. Aquí tienes el binario de carga MBR (`boot.asm`), el cargador de arranque nativo UEFI en C (`uefi_loader.c`), y la receta de empaquetado ISO (`build_iso.sh`) que utiliza un kernel Linux real optimizado para empaquetar toda esta interfaz web de la aplicación y ejecutarla de forma auto-arrancable directamente sobre el ordenador en pantalla completa, sin Windows o macOS por debajo.

---

## 📶 Compatibilidad con Componentes Físicos: WiFi, Bluetooth y LTE / Móvil (LLT)

Para que el sistema sea un **sistema "CMineWar-To-Go" 100% funcional** capaz de arrancar en cualquier placa madre y detectar inalámbricos de inmediato, la ISO Linux se construye empaquetando los siguientes controladores y sub-sistemas libres de firmware oficiales del kernel upstream:

### 1. Controladores de Bluetooth (`Bluetooth`)
*   **Pila de Protocolo:** `bluez` y `bluez-utils`.
*   **Firmware inyectado en `/lib/firmware`:** Controladores universales de Broadcom (`brcm/`), Intel Wireless Bluetooth (`intel/`), y Realtek (`rtlbt/`).
*   **Servicio de Arranque:** Activado por defecto en la construcción mediante:
    ```bash
    systemctl enable bluetooth.service
    ```

### 2. Controladores de Red Inalámbrica (`WiFi`)
*   **Suministrador de Conexión:** `NetworkManager` junto a la suite `wpa_supplicant`.
*   **Firmware inyectado en `/lib/firmware`:**
    *   Chips Intel Centrino/Wireless-AC: `iwlwifi-*.ucode`
    *   Chips Realtek (compatibles con la gran mayoría de dongles USB y módulos de laptop): `rtlwifi/`
    *   Soporte Broadcom (MacBooks antiguos, portátiles HP/Dell): `brcm/` y `b43/`
    *   Drivers de Atheros (Qualcomm): `ath10k/`, `ath11k/`

### 3. Conectividad Móvil Banda Ancha (`LTE / LTE-M / 4G / 5G`)
*   **Suministrador de Módems:** `ModemManager` y `usb-modeswitch` (para auto-conmutar módems USB de modo almacenamiento a modo interfaz de datos).
*   **Protocolos de comunicación de chipsets físicos:** `libqmi` (módems Qualcomm Gobi/LTE), `libmbim` (módems LTE genéricos modernos) y el driver del kernel `cdc_ether` / `qmi_wwan`.
*   **Servicio de Arranque:**
    ```bash
    systemctl enable ModemManager.service
    ```
    (Gestionará de inmediato la activación de tarjetas SIM y módems embebidos en el portátil para darte internet celular de inmediato).

---

## Estructura de Archivos Bare-Metal creados
*   `boot.asm` - Cargador de arranque Master Boot Record (MBR) escrito en **Ensamblador puro (16-bit x86 ASM)** para sistemas con BIOS Legacy antiguos o sistemas modernos con CSM (Compatibility Support Module) activado.
*   `uefi_loader.c` - Cargador de arranque UEFI de 64 bits en **C nativo**, que usa la especificación e inicializa los buffers gráficos del ordenador físico antes de invocar la interfaz visual.
*   `build_iso.sh` - Script de construcción en Bash que detenta el blueprint para empaquetar de forma real esta aplicación React en una distribución minimalista auto-arrancable (Kiosko) utilizando **Alpine Linux** con X11 y Chromium.

---

## Método 1: Ejecutar el cargador de arranque Legacy de 16-bits (boot.asm)
Este es el cargador de arranque en hardware real que emite por pantalla la estructura del dragón de CMineWar OS impreso en código máquina nativo.

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

## Método 2: Crear una ISO real Kiosk de CMineWar OS que arranque directamente en UEFI
La forma estándar y profesional en la que sistemas operativos web (como ChromeOS) corren en bare-metal es utilizando un micro-kernel Linux configurado en modo **Kiosco de pantalla completa**, el cual arranca el servidor ligero local de Node.js y un navegador en pantalla completa optimizado al máximo por hardware para el renderizado acelerado de la interfaz.

### Pasos para ensamblar tu propia ISO Kiosk con Alpine Linux:

1. **Instalar dependencias necesarias de empaquetado en tu entorno de desarrollo Linux**:
   ```bash
   sudo apt-get install xorriso squashfs-tools mtools syslinux-utils -y
   ```

2. **Compilar la interfaz de CMineWar OS**:
   ```bash
   npm run build
   ```
   Esto generará los archivos estáticos en la carpeta `dist/`.

3. **Configurar el Auto-arranque de X11**:
   La receta incluida coloca el archivo `autostart` de `/tmp/cminewaros-iso-build/autostart` en tu configuración de pantalla completa del gestor de ventanas ligero (`openbox`). Este levanta primero el backend de Node (`node dist/server.cjs &`), espera 3 segundos para garantizar el amarre del puerto, y luego inicia Chromium apuntando directamente al puerto local para evitar problemas de CORS y carga de activos (`/assets`):
   ```bash
   chromium-browser --kiosk --no-sandbox http://localhost:3000
   ```

4. **Quemar la ISO resultante a tu USB**:
   Puedes utilizar herramientas visuales seguras como **BalenaEtcher**, **Rufus**, o el comando tradicional `dd`:
   ```bash
   sudo dd if=cminewarOS-live.iso of=/dev/sdX bs=4M status=progress && sync
   ```

Configura la UEFI de tu ordenador para deshabilitar el "Secure Boot" y arranca de inmediato en la majestuosidad acelerada de CMineWar OS bare-metal.

---

## Método 3: Ejecución Dinámica y Servidora en Debian GNU/Linux

Si en lugar de un Live CD de Alpine deseas ejecutar CMineWar OS de forma continua sobre tu distribución familiar **Debian** (actuando como servidor central en tu hogar u oficina), hemos incorporado un motor de automatización y cortafuego específico para Debian.

Cualquier dispositivo en tu red local (LAN) —incluyendo el móvil, emulador o tablet— podrá acceder a la interfaz web tecleando la dirección IP de tu servidor Debian en el puerto `3000`.

### 1. Instalación Automática y Control de Systemd:
Hemos provisto el script de automatización nativo `/bare-metal/install_debian_service.sh` que instala Node.js, compila el front-end con Vite, y registra un servicio de systemd para arrancar clawOS de fondo a través de `node dist/server.cjs` en el puerto `3000`.

Para activarlo en tu máquina Debian real, ejecuta:
```bash
chmod +x bare-metal/install_debian_service.sh
sudo ./bare-metal/install_debian_service.sh
```

Esto habilitará el daemon `cminewar.service`. Puedes controlarlo mediante:
```bash
# Comprobar el estado del servidor
sudo systemctl status cminewar.service

# Detener o iniciar el servicio
sudo systemctl stop cminewar.service
sudo systemctl start cminewar.service
```

### 2. Aislamiento Total de Internet (Anti-WAN Firewall) en Debian:
El instalador despliega una regla de aislamiento local en `/usr/local/bin/cminewar-firewall`. Al invocar este comando se utiliza `iptables` para rechazar la salida WAN (Internet), pero manteniendo intactas las redes privadas locales (LAN 192.168.0.0/16, 172.16.0.0/12, 10.0.0.0/8):

*   **Bloquear el acceso de CMineWar OS to Internet (pero mantener LAN de casa):**
    ```bash
    sudo cminewar-firewall block
    ```
*   **Volver a admitir acceso libre a Internet:**
    ```bash
    sudo cminewar-firewall allow
    ```
*   **Comprobar el filtrado y reglas vigentes:**
    ```bash
    sudo cminewar-firewall status
    ```

### 3. Persistencia de Ventanas y Estado del Escritorio:
Con el fin de evitar la pérdida del estado de tu espacio de trabajo al recargar o conectar desde un dispositivo móvil de la red LAN, CMineWar OS almacena en los metadatos del perfil del cliente (a través del `localStorage` persistentente del navegador) las posiciones relativas de cada ventana, los layouts activos, las coordenadas x-y y el foco activo. Esto asegura que tu escritorio se mantenga intacto tras suspender o reiniciar tu plataforma Debian.

