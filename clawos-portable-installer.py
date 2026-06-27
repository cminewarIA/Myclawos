#!/usr/bin/env python3
"""
ClawOS Portable Installer
Instala un sistema operativo Linux real en un disco portátil (estilo Windows To Go)
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def run_cmd(cmd, check=True, shell=False):
    print(f"[EJECUTANDO] {cmd}")
    result = subprocess.run(cmd, shell=shell, check=check, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout.strip())
    return result

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
    if os.geteuid() != 0:
        print("Este script debe ejecutarse como root (usa sudo).")
        sys.exit(1)

    print("=" * 60)
    print("     ClawOS Portable Installer v1.0")
    print("     Instala un Linux real en disco portátil")
    print("=" * 60)

    list_disks()

    target_disk = input("\nIntroduce el disco objetivo (ej: sdb, sdc): ").strip()
    if not target_disk.startswith("sd") and not target_disk.startswith("nvme"):
        print("Disco no válido.")
        sys.exit(1)

    full_disk = f"/dev/{target_disk}"

    print(f"\n¡ATENCIÓN! Se borrará completamente el disco: {full_disk}")
    if not confirm_action("¿Estás SEGURO de que quieres continuar?"):
        print("Operación cancelada.")
        sys.exit(0)

    # === CONFIGURACIÓN ===
    hostname = input("Hostname del sistema [clawos-portable]: ").strip() or "clawos-portable"
    username = input("Nombre de usuario [clawuser]: ").strip() or "clawuser"
    password = input("Contraseña del usuario: ").strip()

    enable_persistence = input("¿Activar persistencia? (s/n) [s]: ").lower() != "n"

    print("\nIniciando instalación real...")

    # 1. Particionado
    print("\n[1/7] Particionando disco...")
    run_cmd(f"parted -s {full_disk} mklabel gpt")
    run_cmd(f"parted -s {full_disk} mkpart ESP fat32 1MiB 512MiB")
    run_cmd(f"parted -s {full_disk} set 1 esp on")
    run_cmd(f"parted -s {full_disk} mkpart primary ext4 512MiB 100%")

    efi_part = f"{full_disk}1"
    root_part = f"{full_disk}2"

    # 2. Formateo
    print("\n[2/7] Formateando particiones...")
    run_cmd(f"mkfs.vfat -F32 {efi_part}")
    run_cmd(f"mkfs.ext4 -F {root_part}")

    # 3. Montaje
    print("\n[3/7] Montando sistema de archivos...")
    mount_point = "/mnt/clawos"
    os.makedirs(mount_point, exist_ok=True)
    run_cmd(f"mount {root_part} {mount_point}")
    os.makedirs(f"{mount_point}/boot/efi", exist_ok=True)
    run_cmd(f"mount {efi_part} {mount_point}/boot/efi")

    # 4. debootstrap (base Debian)
    print("\n[4/7] Instalando sistema base con debootstrap...")
    run_cmd(f"debootstrap --arch amd64 bookworm {mount_point} http://deb.debian.org/debian")

    # 5. Configuración básica
    print("\n[5/7] Configurando sistema...")
    
    # fstab
    fstab_content = f"""UUID=$(blkid -s UUID -o value {root_part}) / ext4 errors=remount-ro 0 1
UUID=$(blkid -s UUID -o value {efi_part}) /boot/efi vfat umask=0077 0 1
"""
    with open(f"{mount_point}/etc/fstab", "w") as f:
        f.write(fstab_content)

    # hostname
    with open(f"{mount_point}/etc/hostname", "w") as f:
        f.write(hostname)

    # hosts
    with open(f"{mount_point}/etc/hosts", "w") as f:
        f.write(f"127.0.0.1\tlocalhost\n127.0.1.1\t{hostname}\n")

    # 6. Instalar kernel y GRUB (portable)
    print("\n[6/7] Instalando kernel y GRUB para modo portable...")
    
    chroot_cmd = f"chroot {mount_point}"
    
    run_cmd(f"{chroot_cmd} apt update")
    run_cmd(f"{chroot_cmd} apt install -y linux-image-amd64 grub-efi-amd64 efibootmgr")
    
    # Instalar GRUB en el disco (no en /dev/sda del host)
    run_cmd(f"{chroot_cmd} grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=ClawOS --removable {full_disk}")
    run_cmd(f"{chroot_cmd} update-grub")

    # Crear usuario
    run_cmd(f"{chroot_cmd} useradd -m -s /bin/bash {username}")
    run_cmd(f"{chroot_cmd} echo '{username}:{password}' | chpasswd")
    run_cmd(f"{chroot_cmd} usermod -aG sudo {username}")

    # 7. Finalización
    print("\n[7/7] Finalizando instalación...")
    run_cmd(f"umount -R {mount_point}")

    print("\n" + "="*60)
    print("✅ INSTALACIÓN COMPLETADA")
    print(f"El disco {full_disk} ahora contiene ClawOS portable.")
    print("Puedes desconectarlo y bootearlo en cualquier PC compatible.")
    print("="*60)

if __name__ == "__main__":
    main()
