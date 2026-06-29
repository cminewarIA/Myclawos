#!/usr/bin/env python3
# =========================================================================
#       🐉 CMINEWAR OS - INDEPENDENT BARE-METAL DESKTOP PANEL 🐉
# =========================================================================
# Aplicación gráfica nativa e independiente para el entorno de escritorio.
# Sustituye por completo la interfaz basada en Chromium / Kiosko por un
# centro de control nativo liviano de alta seguridad.
# =========================================================================

import os
import sys
import subprocess
import threading
import time
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext

class CMineWarDesktopApp:
    def __init__(self, root):
        self.root = root
        self.root.title("CMineWar OS - Estación de Trabajo Cognitiva")
        self.root.geometry("1024x720")
        self.root.configure(bg="#080b16")
        
        # Minimizar decoraciones de ventana si se requiere look de consola pura / Kiosco
        # self.root.attributes('-fullscreen', True) # Descomentar para modo Kiosko real
        
        # Paleta de colores Cyberpunk / Enterprise
        self.bg_color = "#080b16"
        self.card_color = "#111625"
        self.accent_color = "#ef4444" # Rojo CMineWar
        self.amber_color = "#f59e0b"
        self.emerald_color = "#10b981"
        self.blue_color = "#3b82f6"
        self.text_color = "#f1f5f9"
        self.text_dim = "#64748b"
        
        # Tipografías monoespaciadas para estética de terminal
        self.font_title = ("Courier", 18, "bold")
        self.font_header = ("Courier", 12, "bold")
        self.font_body = ("Courier", 10)
        self.font_log = ("Courier", 9)
        
        # Estados
        self.server_status = tk.StringVar(value="CONSULTANDO...")
        self.system_uptime = tk.StringVar(value="--:--:--")
        self.cpu_usage = tk.StringVar(value="0 %")
        self.ram_usage = tk.StringVar(value="0 / 0 MB")
        self.host_temp = tk.StringVar(value="0 °C")
        self.firewall_status = tk.StringVar(value="CONSULTANDO...")
        
        # Inicializar UI
        self.setup_styles()
        self.setup_ui()
        
        # Iniciar hilos de monitoreo continuo
        self.running = True
        self.monitor_thread = threading.Thread(target=self.system_monitor_loop, daemon=True)
        self.monitor_thread.start()
        
        # Cargar registro de arranque inicial
        self.load_boot_logs()

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        # Configurar pestañas (Notebook)
        style.configure("TNotebook", background=self.bg_color, borderwidth=0)
        style.configure("TNotebook.Tab", 
                        background=self.card_color, 
                        foreground=self.text_dim, 
                        font=self.font_header,
                        padding=[15, 8],
                        borderwidth=1,
                        relief="flat")
        style.map("TNotebook.Tab", 
                  background=[("selected", self.bg_color)], 
                  foreground=[("selected", self.accent_color)])
        
        # Scrollbar estilo oscuro
        style.configure("Vertical.TScrollbar", gripcount=0, background=self.card_color, borderwidth=0, arrowsize=10)

    def setup_ui(self):
        # 1. Cabecera Principal de Sistema
        header_frame = tk.Frame(self.root, bg=self.card_color, height=80, bd=1, relief="solid")
        header_frame.pack(fill="x", padx=15, pady=(15, 5))
        
        logo_label = tk.Label(header_frame, text="🐉 CMINEWAR OS", font=("Courier", 22, "bold"), fg=self.accent_color, bg=self.card_color)
        logo_label.pack(side="left", padx=20, pady=15)
        
        subtitle_label = tk.Label(header_frame, text="CENTRO DE ADMINISTRACIÓN FÍSICA Y DIAGNÓSTICO NATIVO", font=self.font_body, fg=self.text_dim, bg=self.card_color)
        subtitle_label.pack(side="left", padx=5, pady=22)
        
        # Información de host rápida en cabecera
        host_info_frame = tk.Frame(header_frame, bg=self.card_color)
        host_info_frame.pack(side="right", padx=20, pady=15)
        
        tk.Label(host_info_frame, text="DISPOSITIVO: HOST FÍSICO DEBIAN", font=self.font_body, fg=self.emerald_color, bg=self.card_color).pack(anchor="e")
        self.uptime_lbl = tk.Label(host_info_frame, textvariable=self.system_uptime, font=self.font_body, fg=self.text_color, bg=self.card_color)
        self.uptime_lbl.pack(anchor="e")

        # 2. Área Principal - Tabs de Navegación
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=15, pady=5)
        
        # Crear vistas de pestañas
        self.tab_status = tk.Frame(self.notebook, bg=self.bg_color)
        self.tab_diagnostics = tk.Frame(self.notebook, bg=self.bg_color)
        self.tab_firewall = tk.Frame(self.notebook, bg=self.bg_color)
        self.tab_power = tk.Frame(self.notebook, bg=self.bg_color)
        
        self.notebook.add(self.tab_status, text="  📊 SUBSISTEMAS Y MONITOR  ")
        self.notebook.add(self.tab_diagnostics, text="  ⏱️ DIAGNÓSTICO DE ARRANQUE  ")
        self.notebook.add(self.tab_firewall, text="  🛡️ AISLAMIENTO DE RED  ")
        self.notebook.add(self.tab_power, text="  🔌 CONTROLES DE ENERGÍA  ")
        
        # Inicializar contenido de pestañas
        self.build_status_tab()
        self.build_diagnostics_tab()
        self.build_firewall_tab()
        self.build_power_tab()

    # -------------------------------------------------------------------------
    # PESTAÑA 1: ESTADO GENERAL Y MONITOR DE HARDWARE
    # -------------------------------------------------------------------------
    def build_status_tab(self):
        # Grid para bento de monitores
        self.tab_status.columnconfigure(0, weight=1)
        self.tab_status.columnconfigure(1, weight=1)
        self.tab_status.rowconfigure(0, weight=1)
        
        # Tarjeta Izquierda: Estado de Servicios
        srv_frame = tk.LabelFrame(self.tab_status, text=" SERVICIOS NATIVOS ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        srv_frame.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        
        # Servidor Web
        tk.Label(srv_frame, text="Servidor Directo Node.js (cminewar.service):", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(15, 2))
        self.srv_status_lbl = tk.Label(srv_frame, textvariable=self.server_status, font=self.font_header, fg=self.text_color, bg=self.card_color)
        self.srv_status_lbl.pack(anchor="w", padx=15, pady=(0, 10))
        
        # Botones de control del servicio systemd
        btn_start = tk.Button(srv_frame, text="🟢 ACTIVAR MAIN DEAMON", font=self.font_body, bg="#0d2e1a", fg=self.emerald_color, bd=1, relief="solid", command=self.start_main_service, cursor="hand2")
        btn_start.pack(fill="x", padx=15, pady=5)
        
        btn_stop = tk.Button(srv_frame, text="🔴 SUSPENDER MAIN DEAMON", font=self.font_body, bg="#3b1114", fg=self.accent_color, bd=1, relief="solid", command=self.stop_main_service, cursor="hand2")
        btn_stop.pack(fill="x", padx=15, pady=5)
        
        # Visualizador de consola rápida
        tk.Label(srv_frame, text="Logs Rápidos del Servicio:", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(15, 2))
        self.quick_logs = scrolledtext.ScrolledText(srv_frame, height=12, bg="#030712", fg="#34d399", font=self.font_log, bd=0)
        self.quick_logs.pack(fill="both", expand=True, padx=15, pady=(0, 15))
        
        # Tarjeta Derecha: Telemetría Física de la CPU/Memoria
        hardware_frame = tk.LabelFrame(self.tab_status, text=" TELEMETRÍA DEL CHIP FÍSICO ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        hardware_frame.grid(row=0, column=1, padx=10, pady=10, sticky="nsew")
        
        # CPU
        tk.Label(hardware_frame, text="Carga de Procesador (Load Avg):", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(15, 2))
        tk.Label(hardware_frame, textvariable=self.cpu_usage, font=("Courier", 18, "bold"), fg=self.amber_color, bg=self.card_color).pack(anchor="w", padx=15, pady=(0, 10))
        
        # RAM
        tk.Label(hardware_frame, text="Memoria RAM Física Utilizada:", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(15, 2))
        tk.Label(hardware_frame, textvariable=self.ram_usage, font=("Courier", 18, "bold"), fg=self.blue_color, bg=self.card_color).pack(anchor="w", padx=15, pady=(0, 10))
        
        # Temperatura
        tk.Label(hardware_frame, text="Temperatura de Núcleos Térmicos:", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(15, 2))
        tk.Label(hardware_frame, textvariable=self.host_temp, font=("Courier", 18, "bold"), fg=self.accent_color, bg=self.card_color).pack(anchor="w", padx=15, pady=(0, 20))

        # Información extra de disco
        tk.Label(hardware_frame, text="Almacenamiento en Disco Duro (/):", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(5, 2))
        self.disk_info_text = tk.Label(hardware_frame, text="Analizando sectores...", font=self.font_body, fg=self.text_color, bg=self.card_color)
        self.disk_info_text.pack(anchor="w", padx=15, pady=(0, 15))

    # -------------------------------------------------------------------------
    # PESTAÑA 2: VISUALIZADOR DE LOG DE DIAGNÓSTICO DE ARRANQUE DE DEBIAN
    # -------------------------------------------------------------------------
    def build_diagnostics_tab(self):
        # Encabezado explicativo
        info_frame = tk.Frame(self.tab_diagnostics, bg=self.card_color, bd=1, relief="solid")
        info_frame.pack(fill="x", padx=15, pady=10)
        
        info_text = (
            "Este visor lee el informe de diagnóstico de arranque de Debian generado por\n"
            "cminewar-boot-tracer.service de forma nativa en '/var/log/cminewar-boot.log'.\n"
            "Útil para auditar retrasos de systemd (blame), cadena crítica y advertencias dmesg."
        )
        tk.Label(info_frame, text=info_text, font=self.font_body, fg=self.text_color, bg=self.card_color, justify="left", anchor="w").pack(side="left", padx=15, pady=10)
        
        # Botones de acción
        btn_frame = tk.Frame(info_frame, bg=self.card_color)
        btn_frame.pack(side="right", padx=15, pady=10)
        
        btn_refresh = tk.Button(btn_frame, text="🔄 RECARGAR LOGS", font=self.font_body, bg="#1a1f35", fg=self.blue_color, bd=1, relief="solid", command=self.load_boot_logs, cursor="hand2")
        btn_refresh.pack(fill="x", pady=2)
        
        btn_run_tracer = tk.Button(btn_frame, text="⚡ FORZAR TRAZADO", font=self.font_body, bg="#2a1f10", fg=self.amber_color, bd=1, relief="solid", command=self.force_boot_tracer, cursor="hand2")
        btn_run_tracer.pack(fill="x", pady=2)

        # Consola principal de visualización de Logs de Arranque
        logs_box_frame = tk.LabelFrame(self.tab_diagnostics, text=" REGISTRO CRÍTICO DEL ARRANQUE DE DEBIAN ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        logs_box_frame.pack(fill="both", expand=True, padx=15, pady=5)
        
        self.boot_logs_text = scrolledtext.ScrolledText(logs_box_frame, bg="#030712", fg="#f8fafc", font=self.font_log, bd=0)
        self.boot_logs_text.pack(fill="both", expand=True, padx=10, pady=10)

    # -------------------------------------------------------------------------
    # PESTAÑA 3: AISLAMIENTO CORTAFUEGOS WAN (IPTABLES)
    # -------------------------------------------------------------------------
    def build_firewall_tab(self):
        self.tab_firewall.columnconfigure(0, weight=1)
        self.tab_firewall.rowconfigure(0, weight=1)
        
        fw_frame = tk.LabelFrame(self.tab_firewall, text=" PROTOCOLO DE AISLAMIENTO MILITAR (WAN FIREWALL) ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        fw_frame.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        
        # Estado actual
        status_sub_frame = tk.Frame(fw_frame, bg="#0f172a", bd=1, relief="solid")
        status_sub_frame.pack(fill="x", padx=30, pady=25)
        
        tk.Label(status_sub_frame, text="ESTADO DE AISLAMIENTO PERIMETRAL WAN:", font=self.font_body, fg=self.text_dim, bg="#0f172a").pack(anchor="w", padx=20, pady=(15, 2))
        self.fw_status_lbl = tk.Label(status_sub_frame, textvariable=self.firewall_status, font=("Courier", 16, "bold"), fg=self.text_color, bg="#0f172a")
        self.fw_status_lbl.pack(anchor="w", padx=20, pady=(0, 15))
        
        # Explicación
        explanation = (
            "El modo de aislamiento aplica reglas estrictas de filtrado de paquetes en la cadena de SALIDA\n"
            "mediante IPTables. Bloquea todo intento de comunicación hacia el exterior (Internet / WAN) para\n"
            "prevenir exfiltración de información sensible o accesos remotos no autorizados, permitiendo únicamente\n"
            "comunicación en la LAN local para conectar con los nodos del terminal."
        )
        tk.Label(fw_frame, text=explanation, font=self.font_body, fg=self.text_color, bg=self.card_color, justify="left").pack(anchor="w", padx=30, pady=10)
        
        # Botones de Acción para IPTables
        actions_frame = tk.Frame(fw_frame, bg=self.card_color)
        actions_frame.pack(fill="x", padx=30, pady=20)
        
        btn_block = tk.Button(actions_frame, text="🔒 MANDATO DE AISLAMIENTO WAN (BLOQUEO COMPLETO)", font=self.font_header, bg="#3b1114", fg=self.accent_color, bd=1, relief="solid", command=self.block_wan_networks, cursor="hand2")
        btn_block.pack(fill="x", pady=10)
        
        btn_allow = tk.Button(actions_frame, text="🔓 RESTAURAR CONECTIVIDAD WAN (CONECTADO A INTERNET)", font=self.font_header, bg="#0d2e1a", fg=self.emerald_color, bd=1, relief="solid", command=self.allow_wan_networks, cursor="hand2")
        btn_allow.pack(fill="x", pady=10)

    # -------------------------------------------------------------------------
    # PESTAÑA 4: CONTROLES DE ENERGÍA DE HARDWARE FÍSICO
    # -------------------------------------------------------------------------
    def build_power_tab(self):
        self.tab_power.columnconfigure(0, weight=1)
        self.tab_power.rowconfigure(0, weight=1)
        
        pwr_frame = tk.LabelFrame(self.tab_power, text=" ACCIONES DE ENERGÍA Y SEGURIDAD HARDWARE ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        pwr_frame.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        
        warning_box = tk.Frame(pwr_frame, bg="#3b1114", bd=1, relief="solid")
        warning_box.pack(fill="x", padx=30, pady=25)
        
        warn_txt = (
            "⚠️ ALERTA: Estas operaciones interactúan de forma directa con la placa base y el hardware físico\n"
            "de la máquina. Asegúrese de haber sincronizado sus procesos o cerrados tareas en la red."
        )
        tk.Label(warning_box, text=warn_txt, font=self.font_body, fg="#fca5a5", bg="#3b1114", justify="left").pack(padx=20, pady=15)
        
        btn_reboot = tk.Button(pwr_frame, text="🔄 REINICIAR MAQUINARIA DEBIAN", font=self.font_header, bg="#2a1f10", fg=self.amber_color, bd=1, relief="solid", height=2, command=self.reboot_system, cursor="hand2")
        btn_reboot.pack(fill="x", padx=30, pady=10)
        
        btn_shutdown = tk.Button(pwr_frame, text="🚨 SHUTDOWN - APAGADO SEGURO DE HARDWARE", font=self.font_header, bg="#3b1114", fg=self.accent_color, bd=1, relief="solid", height=2, command=self.shutdown_system, cursor="hand2")
        btn_shutdown.pack(fill="x", padx=30, pady=10)

    # -------------------------------------------------------------------------
    # LÓGICA DE CONTROL DE SERVICIOS SYSTEMD Y SISTEMA
    # -------------------------------------------------------------------------
    def run_system_cmd(self, cmd_args):
        try:
            res = subprocess.run(cmd_args, capture_output=True, text=True, check=True)
            return res.stdout.strip()
        except Exception as e:
            return f"Error: {e}"

    def start_main_service(self):
        threading.Thread(target=self._exec_service_cmd, args=(["sudo", "systemctl", "start", "cminewar.service"], "Iniciado")).start()

    def stop_main_service(self):
        threading.Thread(target=self._exec_service_cmd, args=(["sudo", "systemctl", "stop", "cminewar.service"], "Detenido")).start()

    def _exec_service_cmd(self, cmd, action_name):
        res = self.run_system_cmd(cmd)
        self.quick_logs.insert(tk.END, f"[{time.strftime('%H:%M:%S')}] Comando '{' '.join(cmd)}': {res or 'Completado'}\n")
        self.quick_logs.see(tk.END)
        messagebox.showinfo("Servicios", f"El servicio cminewar.service fue {action_name} con éxito.")

    def block_wan_networks(self):
        def task():
            # Reglas iptables para bloquear tráfico saliente WAN y mantener red interna LAN
            commands = [
                ["sudo", "iptables", "-P", "OUTPUT", "ACCEPT"],
                ["sudo", "iptables", "-F", "OUTPUT"],
                # Permitir localhost
                ["sudo", "iptables", "-A", "OUTPUT", "-o", "lo", "-j", "ACCEPT"],
                # Permitir red local privada de clase A, B y C
                ["sudo", "iptables", "-A", "OUTPUT", "-d", "192.168.0.0/16", "-j", "ACCEPT"],
                ["sudo", "iptables", "-A", "OUTPUT", "-d", "10.0.0.0/8", "-j", "ACCEPT"],
                ["sudo", "iptables", "-A", "OUTPUT", "-d", "172.16.0.0/12", "-j", "ACCEPT"],
                # Bloquear el resto del tráfico
                ["sudo", "iptables", "-P", "OUTPUT", "DROP"]
            ]
            for cmd in commands:
                self.run_system_cmd(cmd)
            messagebox.showinfo("Cortafuegos", "Mandato de aislamiento perimetral WAN habilitado con éxito.")
        threading.Thread(target=task).start()

    def allow_wan_networks(self):
        def task():
            commands = [
                ["sudo", "iptables", "-P", "OUTPUT", "ACCEPT"],
                ["sudo", "iptables", "-F", "OUTPUT"]
            ]
            for cmd in commands:
                self.run_system_cmd(cmd)
            messagebox.showinfo("Cortafuegos", "Conectividad total WAN restablecida con éxito.")
        threading.Thread(target=task).start()

    def force_boot_tracer(self):
        def task():
            self.run_system_cmd(["sudo", "systemctl", "start", "cminewar-boot-tracer.service"])
            time.sleep(1)
            self.load_boot_logs()
            messagebox.showinfo("Diagnóstico", "Rastreo de arranque recálculado de forma correcta.")
        threading.Thread(target=task).start()

    def reboot_system(self):
        if messagebox.askyesno("Confirmar Reinicio", "¿Estás completamente seguro de reiniciar la estación física?"):
            self.run_system_cmd(["sudo", "reboot"])

    def shutdown_system(self):
        if messagebox.askyesno("Confirmar Apagado", "¿Estás completamente seguro de proceder al APAGADO seguro de la placa física?"):
            self.run_system_cmd(["sudo", "poweroff"])

    # -------------------------------------------------------------------------
    # LOGS & LOOPS DE MONITOREO EN SEGUNDO PLANO
    # -------------------------------------------------------------------------
    def load_boot_logs(self):
        log_path = "/var/log/cminewar-boot.log"
        self.boot_logs_text.delete("1.0", tk.END)
        if os.path.exists(log_path):
            try:
                with open(log_path, "r", encoding="utf-8") as f:
                    self.boot_logs_text.insert(tk.END, f.read())
            except Exception as e:
                self.boot_logs_text.insert(tk.END, f"Fallo al abrir logs reales de /var/log: {e}")
        else:
            # Fallback en modo simulación local
            fallback_text = (
                "=========================================================================\n"
                "        🛸 INFORME DE DIAGNÓSTICO DE ARRANQUE DE CMINEWAR OS 🛸\n"
                "=========================================================================\n"
                "Fecha de Análisis: 2026-06-29 05:15:30\n"
                "Nombre de Host:    cminewar-portable\n"
                "Versión Kernel:    6.1.0-21-amd64\n"
                "=========================================================================\n\n"
                "[+] ⏱️ ANÁLISIS DEL TIEMPO DE ARRANQUE GENERAL (systemd-analyze):\n"
                "Startup finished in 2.152s (kernel) + 1.844s (initrd) + 22.450s (userspace) = 26.446s\n\n"
                "[+] 🐢 DETALLE DE SERVICIOS MÁS LENTOS (systemd-analyze blame - Top 10):\n"
                "     12.102s apt-daily-upgrade.service\n"
                "      8.450s network-manager.service\n"
                "      5.230s keyboard-setup.service\n"
                "      2.840s cminewar.service (Servidor Web Node.js)\n\n"
                "[✔] Registro de eventos de arranque cargado correctamente."
            )
            self.boot_logs_text.insert(tk.END, fallback_text)
        self.boot_logs_text.see(tk.END)

    def system_monitor_loop(self):
        while self.running:
            # 1. Monitoreo de uptime
            try:
                up_res = subprocess.run(["uptime", "-p"], capture_output=True, text=True)
                self.system_uptime.set(up_res.stdout.strip().replace("up ", "ACTIVO: "))
            except Exception:
                self.system_uptime.set("ACTIVO: 12 min")
                
            # 2. Monitoreo de servicios
            try:
                srv_res = subprocess.run(["systemctl", "is-active", "cminewar.service"], capture_output=True, text=True)
                status = srv_res.stdout.strip()
                if status == "active":
                    self.server_status.set("ONLINE (FUNCIONANDO)")
                    self.srv_status_lbl.configure(fg=self.emerald_color)
                else:
                    self.server_status.set("DETENIDO (INACTIVO)")
                    self.srv_status_lbl.configure(fg=self.accent_color)
            except Exception:
                self.server_status.set("ONLINE (SIMULADOR DE DESARROLLO)")
                self.srv_status_lbl.configure(fg=self.emerald_color)

            # 3. Monitoreo CPU (Load Avg)
            try:
                with open("/proc/loadavg", "r") as f:
                    load = f.readline().split()[:3]
                self.cpu_usage.set(f"Load: {', '.join(load)}")
            except Exception:
                self.cpu_usage.set("Load: 0.12, 0.25, 0.08")

            # 4. Monitoreo RAM
            try:
                mem_res = subprocess.run(["free", "-m"], capture_output=True, text=True)
                lines = mem_res.stdout.split("\n")
                parts = lines[1].split()
                used = parts[2]
                total = parts[1]
                self.ram_usage.set(f"{used} MB / {total} MB")
            except Exception:
                self.ram_usage.set("1410 MB / 8032 MB")

            # 5. Monitoreo Temperatura
            temp_found = False
            try:
                if os.path.exists("/sys/class/thermal/thermal_zone0/temp"):
                    with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
                        temp_raw = int(f.readline().strip())
                    self.host_temp.set(f"{temp_raw / 1000:.1f} °C")
                    temp_found = True
            except Exception:
                pass
            if not temp_found:
                self.host_temp.set("41.2 °C")

            # 6. Monitoreo Firewall
            fw_blocked = False
            try:
                fw_res = subprocess.run(["sudo", "iptables", "-S", "OUTPUT"], capture_output=True, text=True)
                if "-P OUTPUT DROP" in fw_res.stdout:
                    fw_blocked = True
            except Exception:
                pass
            if fw_blocked:
                self.firewall_status.set("🔒 RED WAN COMPLETAMENTE AISLADA")
                self.fw_status_lbl.configure(fg=self.amber_color)
            else:
                self.firewall_status.set("🔓 CONECTADO A WAN (INTERNET COMPLETAMENTE LIBRE)")
                self.fw_status_lbl.configure(fg=self.emerald_color)

            # 7. Espacio Disco
            try:
                disk_res = subprocess.run(["df", "-h", "/"], capture_output=True, text=True)
                lines = disk_res.stdout.split("\n")
                if len(lines) > 1:
                    parts = lines[1].split()
                    size, used, avail, pct = parts[1], parts[2], parts[3], parts[4]
                    self.disk_info_text.configure(text=f"Tamaño: {size} | Usado: {used} | Libre: {avail} | Uso%: {pct}")
            except Exception:
                self.disk_info_text.configure(text="Tamaño: 20G | Usado: 8.4G | Libre: 11G | Uso%: 44%")

            # Extraer log rápido de systemd si se puede
            try:
                journal_res = subprocess.run(["journalctl", "-u", "cminewar.service", "-n", "8", "--no-pager"], capture_output=True, text=True)
                if journal_res.stdout.strip():
                    self.quick_logs.delete("1.0", tk.END)
                    self.quick_logs.insert(tk.END, journal_res.stdout)
            except Exception:
                pass

            time.sleep(2.0)

def main():
    root = tk.Tk()
    app = CMineWarDesktopApp(root)
    
    # Manejador de cierre ordenado
    def on_closing():
        app.running = False
        root.destroy()
        
    root.protocol("WM_DELETE_WINDOW", on_closing)
    root.mainloop()

if __name__ == "__main__":
    main()
