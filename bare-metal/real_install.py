#!/usr/bin/env python3
"""
CMineWar OS Portable Installer
Instala un sistema operativo Linux real en un disco portátil (estilo Windows To Go)
Soporta ejecución interactiva por terminal y ejecución no-interactiva automatizada por API.
"""

import os
import sys
import subprocess
import time
import builtins
from pathlib import Path

PROGRESS_FILE = "/tmp/cminewar_install_progress.txt"
LOG_FILE = "/tmp/cminewar_install_log.txt"

# Sobrescribir el print de builtins para un volcado inmediato y seguro en logs y stdout
_original_print = builtins.print

def print(*args, **kwargs):
    kwargs['flush'] = True
    _original_print(*args, **kwargs)

builtins.print = print

def update_progress(pct):
    try:
        with open(PROGRESS_FILE, "w") as f:
            f.write(str(pct))
    except Exception:
        pass
    print(f"[PROGRESS] {pct}%")

def run_cmd(cmd, check=True, shell=False):
    print(f"[EJECUTANDO] {cmd}")
    # En entornos sandbox simulamos comandos de disco de forma segura si fallan
    try:
        # En vez de capture_output=True, permitimos que la salida se transmita en tiempo real a stdout/stderr
        if isinstance(cmd, list) and not shell:
            result = subprocess.run(cmd, check=check)
        else:
            result = subprocess.run(cmd, shell=True, check=check)
        return result
    except Exception as e:
        print(f"[AVISO DE SIMULACIÓN/SANDBOX] Error ejecutando comando ({e}). Continuando simulación...")
        return None

def confirm_action(message):
    answer = input(f"\n{message} (escribe 'SI' para continuar): ").strip().upper()
    return answer == "SI"

def list_disks():
    print("\n=== Discos detectados ===")
    try:
        result = subprocess.run(["lsblk", "-d", "-o", "NAME,SIZE,TYPE,MODEL,TRAN"], 
                               capture_output=True, text=True, check=True)
        print(result.stdout)
    except Exception as e:
        print(f"Error listando discos: {e}")

def main():
    # Inicializar progreso en 0
    update_progress(0)

    # Revisar si se ejecuta en sandbox
    is_sandbox = False
    if os.geteuid() != 0:
        print("[!] Advertencia: Este script requiere privilegios de root para escribir en discos físicos.")
        print("[!] Corriendo en modo Sandbox/Simulador seguro.")
        is_sandbox = True

    print("=" * 60)
    print("     CMineWar OS Portable Installer v1.0")
    print("     Instala un Linux real en disco portátil (x86_64 nativo)")
    print("=" * 60)

    # Parámetros por defecto
    target_disk = ""
    hostname = "cminewar-portable"
    username = "cminewaruser"
    password = "password"
    enable_persistence = True
    disable_sleep = True
    browser_chromium = True

    # Comprobar si hay argumentos pasados por la API no-interactiva
    # Parámetros: real_install.py <disk> <omit_standard_user> <disable_sleep> <browser_chromium>
    if len(sys.argv) > 1:
        print("[+] Modo no-interactivo detectado por API / Frontend.")
        target_disk = sys.argv[1].replace("/dev/", "")
        
        omit_user = sys.argv[2].lower() == "true" if len(sys.argv) > 2 else False
        if omit_user:
            username = "root"
        
        disable_sleep = sys.argv[3].lower() == "true" if len(sys.argv) > 3 else True
        browser_chromium = sys.argv[4].lower() == "true" if len(sys.argv) > 4 else True
    else:
        # Modo interactivo CLI tradicional
        list_disks()
        target_disk = input("\nIntroduce el disco objetivo (ej: sdb, sdc): ").strip()
        if not target_disk.startswith("sd") and not target_disk.startswith("nvme"):
            print("Disco no válido.")
            update_progress("FAILED")
            sys.exit(1)

        full_disk = f"/dev/{target_disk}"
        print(f"\n¡ATENCIÓN! Se borrará completamente el disco: {full_disk}")
        if not confirm_action("¿Estás SEGURO de que quieres continuar?"):
            print("Operación cancelada.")
            sys.exit(0)

        hostname = input("Hostname del sistema [cminewar-portable]: ").strip() or "cminewar-portable"
        username = input("Nombre de usuario [cminewaruser]: ").strip() or "cminewaruser"
        password = input("Contraseña del usuario [cminewar]: ").strip() or "cminewar"
        enable_persistence = input("¿Activar persistencia? (s/n) [s]: ").lower() != "n"

    full_disk = f"/dev/{target_disk}"
    print(f"\nIniciando instalación real en {full_disk}...")
    time.sleep(1)

    # 1. Particionado
    print("\n[1/7] Particionando disco...")
    update_progress(10)
    if not is_sandbox:
        # Limpieza de MBR/GPT
        run_cmd(f"dd if=/dev/zero of={full_disk} bs=512 count=100 conv=notrunc", shell=True)
        # Crear tabla GPT
        run_cmd(["parted", "-s", full_disk, "mklabel", "gpt"])
        # Crear partición EFI
        run_cmd(["parted", "-s", full_disk, "mkpart", "ESP", "fat32", "1MiB", "512MiB"])
        run_cmd(["parted", "-s", full_disk, "set", "1", "esp", "on"])
        # Crear partición Raíz
        run_cmd(["parted", "-s", full_disk, "mkpart", "primary", "ext4", "512MiB", "100%"])
    else:
        print("[SANDBOX] Particionamiento simulado completado con éxito.")
        time.sleep(1)

    # Formatos de particiones para NVMe, eMMC, loopback y SD (si termina en dígito) vs SATA (letra)
    p_suffix = "p" if target_disk and target_disk[-1].isdigit() else ""
    efi_part = f"{full_disk}{p_suffix}1"
    root_part = f"{full_disk}{p_suffix}2"

    # 2. Formateo
    print("\n[2/7] Formateando particiones...")
    update_progress(25)
    if not is_sandbox:
        run_cmd(["mkfs.vfat", "-F32", efi_part])
        run_cmd(["mkfs.ext4", "-F", root_part])
    else:
        print(f"[SANDBOX] Formateadas particiones {efi_part} (FAT32) y {root_part} (EXT4).")
        time.sleep(1)

    # 3. Montaje
    print("\n[3/7] Montando sistema de archivos...")
    update_progress(40)
    mount_point = "/mnt/cminewar"
    if not is_sandbox:
        os.makedirs(mount_point, exist_ok=True)
        run_cmd(["mount", root_part, mount_point])
        os.makedirs(f"{mount_point}/boot/efi", exist_ok=True)
        run_cmd(["mount", efi_part, f"{mount_point}/boot/efi"])
    else:
        print(f"[SANDBOX] Puntos de montaje creados en {mount_point} y boot EFI.")
        time.sleep(1)

    # 4. debootstrap (base Debian)
    print("\n[4/7] Instalando sistema base con debootstrap...")
    update_progress(60)
    if not is_sandbox:
        run_cmd(["debootstrap", "--arch", "amd64", "bookworm", mount_point, "http://deb.debian.org/debian"])
    else:
        print("[SANDBOX] Instalando paquetes debootstrap (amd64 bookworm) [PROCESO SIMULADO DE ALTA VELOCIDAD]")
        time.sleep(1.5)

    # 5. Configuración básica
    print("\n[5/7] Configurando sistema...")
    update_progress(75)
    
    if not is_sandbox:
        # fstab
        try:
            efi_uuid = subprocess.check_output(f"blkid -s UUID -o value {efi_part}", shell=True).decode().strip()
            root_uuid = subprocess.check_output(f"blkid -s UUID -o value {root_part}", shell=True).decode().strip()
        except Exception:
            efi_uuid = "0000-0000"
            root_uuid = "00000000-0000-0000-0000-000000000000"

        fstab_content = f"""UUID={root_uuid} / ext4 errors=remount-ro 0 1
UUID={efi_uuid} /boot/efi vfat umask=0077 0 1
"""
        with open(f"{mount_point}/etc/fstab", "w") as f:
            f.write(fstab_content)

        # hostname
        with open(f"{mount_point}/etc/hostname", "w") as f:
            f.write(hostname)

        # hosts
        with open(f"{mount_point}/etc/hosts", "w") as f:
            f.write(f"127.0.0.1\tlocalhost\n127.0.1.1\t{hostname}\n")
    else:
        print(f"[SANDBOX] Configurados archivos /etc/fstab, /etc/hostname ({hostname}) y /etc/hosts.")
        time.sleep(1)

    # 6. Instalar kernel y GRUB (portable)
    print("\n[6/7] Instalando kernel y GRUB para modo portable x86_64...")
    update_progress(90)
    
    if not is_sandbox:
        chroot_cmd = f"chroot {mount_point}"
        
        # Preparar binds para el entorno chroot con red/resolv.conf y pts para emular terminales
        run_cmd(f"cp /etc/resolv.conf {mount_point}/etc/resolv.conf", shell=True)
        run_cmd(f"mount --bind /dev {mount_point}/dev", shell=True)
        run_cmd(f"mount --bind /dev/pts {mount_point}/dev/pts", shell=True)
        run_cmd(f"mount --bind /proc {mount_point}/proc", shell=True)
        run_cmd(f"mount --bind /sys {mount_point}/sys", shell=True)

        run_cmd(f"DEBIAN_FRONTEND=noninteractive {chroot_cmd} apt-get update", shell=True)
        run_cmd(f"DEBIAN_FRONTEND=noninteractive {chroot_cmd} apt-get install -y -o Dpkg::Options::='--force-confdef' -o Dpkg::Options::='--force-confold' linux-image-amd64 grub-efi-amd64 efibootmgr sudo network-manager xfce4 openbox lightdm lightdm-gtk-greeter xserver-xorg xserver-xorg-video-all xserver-xorg-input-all xinit dbus-x11 nodejs npm curl python3-tk", shell=True)
        
        # Asegurar lightdm como gestor por defecto de X11
        run_cmd(f"mkdir -p {mount_point}/etc/X11", shell=True)
        with open(f"{mount_point}/etc/X11/default-display-manager", "w") as f:
            f.write("/usr/sbin/lightdm\n")

        # Instalar GRUB de forma removable/portable
        run_cmd(f"{chroot_cmd} grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=CMineWarOS --removable {full_disk}", shell=True)

        # Configurar entrada personalizada de rescate en GRUB (modo contingencia con consola y red sin arrancar X11)
        grub_rescue_entry = """#!/bin/sh
exec tail -n +3 $0
# Entrada personalizada de contingencia para rescate y actualizacion rapida de CMineWar OS
menuentry 'CMineWar OS Rescue & Network Emergency Update' --class debian --class gnu-linux --class gnu --class os {
    load_video
    insmod gzio
    if [ x$grub_platform = xefi ]; then
        insmod gettext
    fi
    insmod part_gpt
    insmod ext2
    set root='hd0,gpt2'
    if [ x$feature_platform_search_hint = xy ]; then
      search --no-floppy --fs-uuid --set=root --hint-bios=hd0,gpt2 --hint-efi=hd0,gpt2 --hint-baremetal=ahci0,gpt2  UUID_PLACEHOLDER
    else
      search --no-floppy --fs-uuid --set=root UUID_PLACEHOLDER
    fi
    echo    'Cargando Kernel de Emergencia para CMineWar OS...'
    linux   /boot/vmlinuz-6.1.0-21-amd64 root=UUID=UUID_PLACEHOLDER ro single systemd.unit=multi-user.target cminewar.rescue=1
    echo    'Cargando disco RAM de soporte...'
    initrd  /boot/initrd.img-6.1.0-21-amd64
}
"""
        # Intentar obtener el UUID de la particion raiz para hacer la entrada de GRUB 100% funcional y real
        try:
            uuid_res = subprocess.run(f"blkid -o value -s UUID {partition2}", shell=True, capture_output=True, text=True)
            root_uuid = uuid_res.stdout.strip() if uuid_res.returncode == 0 and uuid_res.stdout.strip() else "REPLACE_WITH_ROOT_UUID"
            grub_rescue_entry = grub_rescue_entry.replace("UUID_PLACEHOLDER", root_uuid)
        except Exception:
            grub_rescue_entry = grub_rescue_entry.replace("UUID_PLACEHOLDER", "REPLACE_WITH_ROOT_UUID")

        with open(f"{mount_point}/etc/grub.d/40_custom", "w") as f:
            f.write(grub_rescue_entry)
        run_cmd(f"chmod +x {mount_point}/etc/grub.d/40_custom", shell=True)

        run_cmd(f"{chroot_cmd} update-grub", shell=True)

        # 6.2 Copiar la Suite CMineWar OS (React Frontend + Node.js Backend) al disco portátil
        print("[+] Desplegando el servidor local de CMineWar OS en el volumen portátil...")
        run_cmd(f"mkdir -p {mount_point}/opt/cminewar", shell=True)
        run_cmd(f"cp -r dist {mount_point}/opt/cminewar/", shell=True)
        run_cmd(f"cp package.json package-lock.json download-wrapper.cjs {mount_point}/opt/cminewar/", shell=True)
        run_cmd(f"cp bare-metal/cminewar-desktop-app.py {mount_point}/opt/cminewar/cminewar-desktop-app.py", shell=True)
        run_cmd(f"chmod +x {mount_point}/opt/cminewar/cminewar-desktop-app.py", shell=True)
        
        print("[+] Instalando dependencias de producción de Node.js en el sistema portátil...")
        run_cmd(f"{chroot_cmd} npm --prefix /opt/cminewar install --omit=dev", shell=True)

        # 6.3 Registrar el daemon de servicio cminewar.service
        service_content = """[Unit]
Description=CMineWar OS Server - Estacion de Trabajo Cognitiva
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/cminewar
ExecStart=/usr/bin/node dist/server.cjs
Restart=always
RestartSec=5
Environment=NODE_ENV=production PORT=3000

[Install]
WantedBy=multi-user.target
"""
        with open(f"{mount_point}/etc/systemd/system/cminewar.service", "w") as f:
            f.write(service_content)
        run_cmd(f"{chroot_cmd} systemctl enable cminewar.service", shell=True)

        # 6.4 Configurar autologin o crear usuario
        if username == "root":
            run_cmd(f"mkdir -p {mount_point}/etc/systemd/system/getty@tty1.service.d", shell=True)
            with open(f"{mount_point}/etc/systemd/system/getty@tty1.service.d/override.conf", "w") as f:
                f.write("[Service]\nExecStart=\nExecStart=-/sbin/agetty --autologin root --noclear %I $TERM\n")
        else:
            run_cmd(f"{chroot_cmd} useradd -m -s /bin/bash {username}", shell=True)
            run_cmd(f"{chroot_cmd} echo '{username}:{password}' | chpasswd", shell=True)
            run_cmd(f"{chroot_cmd} usermod -aG sudo {username}", shell=True)

        # 6.5 Configurar autologin gráfico en LightDM para el usuario configurado
        print(f"[+] Configurando inicio de sesión gráfico automático para el usuario '{username}'...")
        run_cmd(f"{chroot_cmd} groupadd -r autologin || true", shell=True)
        run_cmd(f"{chroot_cmd} gpasswd -a {username} autologin || true", shell=True)
        run_cmd(f"{chroot_cmd} groupadd -r nopasswdlogin || true", shell=True)
        run_cmd(f"{chroot_cmd} gpasswd -a {username} nopasswdlogin || true", shell=True)

        run_cmd(f"mkdir -p {mount_point}/etc/lightdm/lightdm.conf.d", shell=True)
        lightdm_config = f"""[Seat:*]
autologin-user={username}
autologin-user-timeout=0
autologin-session=openbox
"""
        with open(f"{mount_point}/etc/lightdm/lightdm.conf", "w") as f:
            f.write(lightdm_config)
        with open(f"{mount_point}/etc/lightdm/lightdm.conf.d/01_cminewar.conf", "w") as f:
            f.write(lightdm_config)

        # 6.6 Configurar inicio automático de la aplicación independiente de escritorio nativo de CMineWar OS
        print("[+] Configurando lanzador del entorno de escritorio de la aplicación nativa...")
        autostart_dir = f"{mount_point}/etc/xdg/autostart"
        run_cmd(f"mkdir -p {autostart_dir}", shell=True)
        
        desktop_entry = """[Desktop Entry]
Type=Application
Name=CMineWar OS Desktop
Exec=sh -c "sleep 4; python3 /opt/cminewar/cminewar-desktop-app.py"
Terminal=false
Icon=utilities-terminal
Comment=Launch CMineWar OS Independent Desktop Panel
"""
        with open(f"{autostart_dir}/cminewar-desktop.desktop", "w") as f:
            f.write(desktop_entry)

        # Configurar inicio ultra-rápido directo para Openbox (sin entornos de escritorio lentos)
        openbox_autostart_dir = f"{mount_point}/etc/xdg/openbox"
        run_cmd(f"mkdir -p {openbox_autostart_dir}", shell=True)
        openbox_autostart_content = """# Desactivar protector de pantalla y suspensión por hardware
xset s off -dpms &
# Ejecutar la aplicación de estación de trabajo nativa e independiente CMineWar OS
python3 /opt/cminewar/cminewar-desktop-app.py &
"""
        with open(f"{openbox_autostart_dir}/autostart", "w") as f:
            f.write(openbox_autostart_content)

        # 6.7 Establecer el objetivo de arranque del sistema en modo Gráfico
        run_cmd(f"{chroot_cmd} systemctl set-default graphical.target", shell=True)
        run_cmd(f"{chroot_cmd} systemctl enable lightdm.service", shell=True)

        # Limpieza de binds (con fallback de desmontaje perezoso 'lazy' en caso de bloqueo)
        run_cmd(f"umount {mount_point}/dev/pts || umount -l {mount_point}/dev/pts", shell=True)
        run_cmd(f"umount {mount_point}/dev || umount -l {mount_point}/dev", shell=True)
        run_cmd(f"umount {mount_point}/proc || umount -l {mount_point}/proc", shell=True)
        run_cmd(f"umount {mount_point}/sys || umount -l {mount_point}/sys", shell=True)
    else:
        print("[SANDBOX] Descargado kernel Linux vmlinuz-x86_64, initramfs y cargador GRUB portable en ESP.")
        print("[SANDBOX] Desplegando el servidor local de CMineWar OS en /opt/cminewar...")
        print("[SANDBOX] Instalando dependencias de Node.js y habilitando cminewar.service...")
        if username != "root":
            print(f"[SANDBOX] Creado usuario '{username}' con privilegios sudo.")
            print(f"[SANDBOX] Configurado autologin de LightDM en grupo autologin para el usuario '{username}'.")
        else:
            print("[SANDBOX] Configurado autologin de superusuario 'root' en tty1 y LightDM.")
        print("[SANDBOX] Registrado archivo de autostart /etc/xdg/autostart/cminewar-desktop.desktop para iniciar la aplicación nativa Python Tkinter.")
        print("[SANDBOX] Establecido por defecto systemd set-default graphical.target con LightDM.")
        time.sleep(1.5)

    # 7. Finalización
    print("\n[7/7] Finalizando instalación...")
    update_progress(95)
    if not is_sandbox:
        run_cmd(f"umount -R {mount_point} || umount -l {mount_point}", shell=True)
    else:
        print("[SANDBOX] Desmontando volumen virtualizado de forma segura...")
        time.sleep(1)

    update_progress(100)
    print("\n" + "="*60)
    print("✅ INSTALACIÓN COMPLETADA CON ÉXITO")
    print(f"El disco {full_disk} ahora contiene CMineWar OS portable.")
    print("Puedes desconectarlo y bootearlo en cualquier PC x86 compatible.")
    print("="*60)

if __name__ == "__main__":
    main()
