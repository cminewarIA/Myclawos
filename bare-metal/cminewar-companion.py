#!/usr/bin/env python3
# =========================================================================
#       🐉 CMINEWAR OS - ULTIMATE DUAL-MODE REMOTE COMPANION APP 🐉
# =========================================================================
# Este cliente gráfico nativo en Python y Tkinter permite administrar de
# forma segura cualquier nodo de CMineWar OS en la red local o gestionar
# el host de forma local directa.
#
# Soporta dos modos de operación seleccionables en tiempo real:
# 1. API DE RED (Control Remoto): Se comunica mediante peticiones HTTP REST
#    con el servidor de CMineWar en el puerto 3000 de la máquina destino.
#    ¡Cero errores de systemctl o iptables locales, ideal para clientes remotos!
# 2. MODO SUDO LOCAL: Ejecuta comandos directos del sistema (systemctl,
#    cminewar-firewall, reboot) requiriendo privilegios sudo en este equipo.
# =========================================================================

import os
import sys
import json
import subprocess
import urllib.request
import urllib.error
import threading
import time
import socket
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext

class CMineWarCompanionApp:
    def __init__(self, root):
        self.root = root
        self.root.title("CMineWar OS - Panel de Control Remoto")
        self.root.geometry("820x620")
        self.root.configure(bg="#080b16")
        
        # Cargar icono de la aplicación en la ventana para que se vea el dragón
        try:
            icon_path = "/usr/share/pixmaps/cminewar-companion.png"
            if os.path.exists(icon_path):
                img = tk.PhotoImage(file=icon_path)
                self.root.iconphoto(True, img)
            elif os.path.exists("assets/logo.png"):
                img = tk.PhotoImage(file="assets/logo.png")
                self.root.iconphoto(True, img)
            elif os.path.exists("public/assets/branding/logo.png"):
                img = tk.PhotoImage(file="public/assets/branding/logo.png")
                self.root.iconphoto(True, img)
        except Exception:
            pass
            
        # Paleta de colores Cyberpunk / Enterprise
        self.bg_color = "#080b16"
        self.card_color = "#111625"
        self.accent_color = "#8b5cf6"  # Púrpura CMineWar
        self.amber_color = "#f59e0b"   # Alertas
        self.emerald_color = "#10b981" # Conectado / Éxito
        self.blue_color = "#3b82f6"    # Info
        self.crimson_color = "#ef4444" # Detenido / Error
        self.text_color = "#f1f5f9"
        self.text_dim = "#64748b"
        
        # Tipografías monoespaciadas para estética de terminal
        self.font_title = ("Courier", 16, "bold")
        self.font_header = ("Courier", 11, "bold")
        self.font_body = ("Courier", 10)
        self.font_log = ("Courier", 9)
        
        # Variables de estado y control de conexión
        self.connection_mode = tk.StringVar(value="remote") # "remote" o "local"
        self.node_url_var = tk.StringVar(value="http://localhost:3000")
        self.connection_status_var = tk.StringVar(value="DESCONECTADO (Sondeando...)")
        
        # Telemetría del nodo
        self.server_status_var = tk.StringVar(value="DESCONECTADO")
        self.service_status_var = tk.StringVar(value="DESCONECTADO")
        self.firewall_status_var = tk.StringVar(value="DESCONECTADO")
        self.system_uptime_var = tk.StringVar(value="--:--:--")
        self.cpu_usage_var = tk.StringVar(value="0 %")
        self.ram_usage_var = tk.StringVar(value="0 / 0 MB (0%)")
        self.host_temp_var = tk.StringVar(value="0 °C")
        self.host_info_var = tk.StringVar(value="Dispositivo: Desconectado")
        
        # Habilitar/Deshabilitar banderas de barra de progreso
        self.cpu_percent_num = 0
        self.ram_percent_num = 0
        
        # Construir Interfaz
        self.setup_styles()
        self.setup_ui()
        
        # Iniciar hilo de monitoreo continuo en segundo plano
        self.running = True
        self.monitor_thread = threading.Thread(target=self.poll_status_loop, daemon=True)
        self.monitor_thread.start()

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use('clam')
        
        # Configurar pestañas (Notebook)
        style.configure("TNotebook", background=self.bg_color, borderwidth=0)
        style.configure("TNotebook.Tab", 
                        background=self.card_color, 
                        foreground=self.text_dim, 
                        font=self.font_header,
                        padding=[12, 6],
                        borderwidth=1,
                        relief="flat")
        style.map("TNotebook.Tab", 
                  background=[("selected", self.bg_color)], 
                  foreground=[("selected", self.accent_color)])
        
        # Progressbars
        style.configure("CPU.Horizontal.TProgressbar", thickness=15, troughcolor=self.card_color, background=self.amber_color)
        style.configure("RAM.Horizontal.TProgressbar", thickness=15, troughcolor=self.card_color, background=self.blue_color)

    def setup_ui(self):
        # 1. Cabecera Principal y Selector de Modo
        header_frame = tk.Frame(self.root, bg=self.card_color, bd=1, relief="solid")
        header_frame.pack(fill="x", padx=15, pady=(15, 5))
        
        # Logo
        logo_label = tk.Label(header_frame, text="🐉 CMINEWAR OS", font=("Courier", 18, "bold"), fg=self.accent_color, bg=self.card_color)
        logo_label.pack(side="left", padx=15, pady=10)
        
        # Selector de Modo de Conexión
        selector_frame = tk.Frame(header_frame, bg=self.card_color)
        selector_frame.pack(side="right", padx=15, pady=10)
        
        lbl_mod = tk.Label(selector_frame, text="MODO DE CONTROL:", font=self.font_body, fg=self.text_dim, bg=self.card_color)
        lbl_mod.grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 2))
        
        rb_remote = tk.Radiobutton(
            selector_frame, text="🌐 API de Red (Remoto/Local)", 
            variable=self.connection_mode, value="remote",
            font=self.font_body, fg=self.text_color, bg=self.card_color,
            selectcolor="#0d0f19", activebackground=self.card_color, activeforeground=self.accent_color,
            command=self.on_connection_mode_change
        )
        rb_remote.grid(row=1, column=0, padx=(0, 10))
        
        rb_local = tk.Radiobutton(
            selector_frame, text="🖥️ Sudo Local (En el propio Nodo)", 
            variable=self.connection_mode, value="local",
            font=self.font_body, fg=self.text_color, bg=self.card_color,
            selectcolor="#0d0f19", activebackground=self.card_color, activeforeground=self.accent_color,
            command=self.on_connection_mode_change
        )
        rb_local.grid(row=1, column=1)

        # 2. Panel de Dirección del Nodo y Estado de Conexión
        self.conn_panel = tk.Frame(self.root, bg=self.card_color, bd=1, relief="solid")
        self.conn_panel.pack(fill="x", padx=15, pady=5)
        
        lbl_ip = tk.Label(self.conn_panel, text="Dirección del Nodo:", font=self.font_body, fg=self.text_color, bg=self.card_color)
        lbl_ip.pack(side="left", padx=(15, 5), pady=8)
        
        self.entry_ip = tk.Entry(self.conn_panel, textvariable=self.node_url_var, font=self.font_body, bg="#080b16", fg="#86efac", insertbackground=self.emerald_color, width=28, bd=1, relief="solid")
        self.entry_ip.pack(side="left", padx=5, pady=8)
        
        self.btn_reconnect = tk.Button(
            self.conn_panel, text="⚡ RECONECTAR", font=self.font_body, 
            bg="#0f172a", fg=self.blue_color, activebackground=self.blue_color, activeforeground="#000",
            bd=1, relief="solid", cursor="hand2", command=self.force_reconnect
        )
        self.btn_reconnect.pack(side="left", padx=10, pady=8)
        
        self.lbl_conn_status = tk.Label(self.conn_panel, textvariable=self.connection_status_var, font=self.font_header, fg=self.crimson_color, bg=self.card_color)
        self.lbl_conn_status.pack(side="right", padx=15, pady=8)

        # 3. Pestañas de Navegación del Panel de Control
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill="both", expand=True, padx=15, pady=5)
        
        # Vistas de las Pestañas
        self.tab_monitor = tk.Frame(self.notebook, bg=self.bg_color)
        self.tab_firewall = tk.Frame(self.notebook, bg=self.bg_color)
        self.tab_services = tk.Frame(self.notebook, bg=self.bg_color)
        self.tab_usb = tk.Frame(self.notebook, bg=self.bg_color)
        self.tab_processes = tk.Frame(self.notebook, bg=self.bg_color)
        self.tab_power = tk.Frame(self.notebook, bg=self.bg_color)
        
        self.notebook.add(self.tab_monitor, text="  🔗 CONEXIÓN Y MONITOR  ")
        self.notebook.add(self.tab_firewall, text="  🛡️ CORTAFUEGOS WAN  ")
        self.notebook.add(self.tab_services, text="  ⚙️ DAEMONS Y SERVICIOS  ")
        self.notebook.add(self.tab_usb, text="  💾 DISPOSITIVOS USB  ")
        self.notebook.add(self.tab_processes, text="  📋 PROCESOS Y LOGS  ")
        self.notebook.add(self.tab_power, text="  🔌 CONTROLES DE ENERGÍA  ")
        
        # Construir cada pestaña
        self.build_monitor_tab()
        self.build_firewall_tab()
        self.build_services_tab()
        self.build_usb_tab()
        self.build_processes_tab()
        self.build_power_tab()

    # -------------------------------------------------------------------------
    # TAB 1: TELEMETRÍA Y MONITOR DE HARDWARE
    # -------------------------------------------------------------------------
    def build_monitor_tab(self):
        self.tab_monitor.columnconfigure(0, weight=1)
        self.tab_monitor.columnconfigure(1, weight=1)
        
        # Panel Izquierdo: Estado de Subsistemas Rápidos
        status_sub_frame = tk.LabelFrame(self.tab_monitor, text=" ESTADO DE SUBSISTEMAS DEL NODO ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        status_sub_frame.grid(row=0, column=0, padx=10, pady=10, sticky="nsew")
        
        # API Web Node status
        tk.Label(status_sub_frame, text="Servidor API HTTP (Puerto 3000):", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(15, 2))
        self.lbl_api_status = tk.Label(status_sub_frame, textvariable=self.server_status_var, font=self.font_header, fg=self.text_color, bg=self.card_color)
        self.lbl_api_status.pack(anchor="w", padx=15, pady=(0, 10))
        
        # Systemd Service status
        tk.Label(status_sub_frame, text="Servicio de Fondo (Systemd Daemon):", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(5, 2))
        self.lbl_srv_status = tk.Label(status_sub_frame, textvariable=self.service_status_var, font=self.font_header, fg=self.text_color, bg=self.card_color)
        self.lbl_srv_status.pack(anchor="w", padx=15, pady=(0, 10))
        
        # WAN Isolation status
        tk.Label(status_sub_frame, text="Filtrado Cortafuegos (Aislamiento WAN):", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(5, 2))
        self.lbl_fw_status = tk.Label(status_sub_frame, textvariable=self.firewall_status_var, font=self.font_header, fg=self.text_color, bg=self.card_color)
        self.lbl_fw_status.pack(anchor="w", padx=15, pady=(0, 15))
        
        # Host metadata info string
        self.lbl_host_meta = tk.Label(status_sub_frame, textvariable=self.host_info_var, font=self.font_body, fg=self.blue_color, bg=self.card_color, justify="left")
        self.lbl_host_meta.pack(anchor="w", padx=15, pady=(15, 15))
        
        # Panel Derecho: Gráficas de CPU, RAM y Temp
        telemetry_sub_frame = tk.LabelFrame(self.tab_monitor, text=" TELEMETRÍA DEL HARDWARE ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        telemetry_sub_frame.grid(row=0, column=1, padx=10, pady=10, sticky="nsew")
        
        # CPU
        tk.Label(telemetry_sub_frame, text="Carga de CPU (Procesamiento):", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(15, 2))
        self.lbl_cpu_txt = tk.Label(telemetry_sub_frame, textvariable=self.cpu_usage_var, font=self.font_header, fg=self.amber_color, bg=self.card_color)
        self.lbl_cpu_txt.pack(anchor="w", padx=15)
        self.cpu_bar = ttk.Progressbar(telemetry_sub_frame, style="CPU.Horizontal.TProgressbar", length=220, mode="determinate")
        self.cpu_bar.pack(anchor="w", padx=15, pady=(5, 15))
        
        # Memory
        tk.Label(telemetry_sub_frame, text="Consumo RAM Física:", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(5, 2))
        self.lbl_ram_txt = tk.Label(telemetry_sub_frame, textvariable=self.ram_usage_var, font=self.font_header, fg=self.blue_color, bg=self.card_color)
        self.lbl_ram_txt.pack(anchor="w", padx=15)
        self.ram_bar = ttk.Progressbar(telemetry_sub_frame, style="RAM.Horizontal.TProgressbar", length=220, mode="determinate")
        self.ram_bar.pack(anchor="w", padx=15, pady=(5, 15))
        
        # Temp and Uptime
        tk.Label(telemetry_sub_frame, text="Temperatura del Núcleo:", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(5, 2))
        self.lbl_temp_txt = tk.Label(telemetry_sub_frame, textvariable=self.host_temp_var, font=self.font_header, fg=self.crimson_color, bg=self.card_color)
        self.lbl_temp_txt.pack(anchor="w", padx=15, pady=(0, 15))
        
        tk.Label(telemetry_sub_frame, text="Tiempo de Actividad (Uptime):", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=15, pady=(5, 2))
        self.lbl_uptime_txt = tk.Label(telemetry_sub_frame, textvariable=self.system_uptime_var, font=self.font_header, fg=self.emerald_color, bg=self.card_color)
        self.lbl_uptime_txt.pack(anchor="w", padx=15, pady=(0, 15))

    # -------------------------------------------------------------------------
    # TAB 2: AISLAMIENTO CORTAFUEGOS WAN (ANTI-EXFILTRACIÓN)
    # -------------------------------------------------------------------------
    def build_firewall_tab(self):
        self.tab_firewall.columnconfigure(0, weight=1)
        self.tab_firewall.rowconfigure(0, weight=1)
        
        fw_frame = tk.LabelFrame(self.tab_firewall, text=" PROTOCOLO DE AISLAMIENTO MILITAR (WAN FIREWALL) ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        fw_frame.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        
        # Display state
        status_sub_frame = tk.Frame(fw_frame, bg="#0f172a", bd=1, relief="solid")
        status_sub_frame.pack(fill="x", padx=30, pady=20)
        
        tk.Label(status_sub_frame, text="ESTADO DE AISLAMIENTO EN NODO DEBIAN:", font=self.font_body, fg=self.text_dim, bg="#0f172a").pack(anchor="w", padx=20, pady=(15, 2))
        self.fw_disp_lbl = tk.Label(status_sub_frame, textvariable=self.firewall_status_var, font=("Courier", 15, "bold"), fg=self.text_color, bg="#0f172a")
        self.fw_disp_lbl.pack(anchor="w", padx=20, pady=(0, 15))
        
        # Explanatory text
        explanation = (
            "El modo de aislamiento aplica reglas estrictas de filtrado de paquetes en la cadena de SALIDA\n"
            "del nodo mediante IPTables. Bloquea todo intento de comunicación hacia el exterior (Internet / WAN)\n"
            "para prevenir exfiltración de información sensible o accesos remotos no autorizados.\n"
            "Permite únicamente la comunicación en la LAN local para conectar con los terminales remotos."
        )
        tk.Label(fw_frame, text=explanation, font=self.font_body, fg=self.text_color, bg=self.card_color, justify="left").pack(anchor="w", padx=30, pady=10)
        
        # Buttons
        actions_frame = tk.Frame(fw_frame, bg=self.card_color)
        actions_frame.pack(fill="x", padx=30, pady=15)
        
        btn_block = tk.Button(actions_frame, text="🔒 AISLAR RED WAN (BLOQUEAR INTERNET EN EL NODO)", font=self.font_header, bg="#3b1114", fg=self.crimson_color, bd=1, relief="solid", height=2, command=self.block_wan, cursor="hand2")
        btn_block.pack(fill="x", pady=8)
        
        btn_allow = tk.Button(actions_frame, text="🔓 RESTAURAR CONECTIVIDAD WAN (HABILITAR INTERNET)", font=self.font_header, bg="#0d2e1a", fg=self.emerald_color, bd=1, relief="solid", height=2, command=self.allow_wan, cursor="hand2")
        btn_allow.pack(fill="x", pady=8)

    # -------------------------------------------------------------------------
    # TAB 3: GESTOR DE SERVICIOS Y DAEMONS
    # -------------------------------------------------------------------------
    def build_services_tab(self):
        # Frame del gestor de servicios
        self.tab_services.columnconfigure(0, weight=1)
        self.tab_services.rowconfigure(0, weight=1)
        
        parent_frame = tk.LabelFrame(self.tab_services, text=" GESTIÓN DE DAEMONS SYSTEMD EN EL NODO ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        parent_frame.grid(row=0, column=0, padx=15, pady=15, sticky="nsew")
        
        tk.Label(parent_frame, text="Servicios Administrables en el Nodo de Operación:", font=self.font_body, fg=self.text_dim, bg=self.card_color).pack(anchor="w", padx=20, pady=(15, 10))
        
        # Frame contenedor para la lista de servicios
        self.services_container = tk.Frame(parent_frame, bg=self.card_color)
        self.services_container.pack(fill="both", expand=True, padx=20, pady=10)
        
        # Vamos a inicializar 4 servicios predefinidos en el UI
        self.services_widgets = {}
        self.defined_services = [
            {"id": "cminewar-service", "name": "CMineWar OS Cognitive Daemon", "desc": "Servidor Node.js Express de fondo"},
            {"id": "nginx", "name": "Nginx Web Reverse Proxy", "desc": "Proxy de puertos HTTP públicos"},
            {"id": "ssh", "name": "Secure Shell Daemon (SSH)", "desc": "Acceso remoto seguro de terminal"},
            {"id": "network-manager", "name": "Network Manager Daemon", "desc": "Gestor principal de interfaces y WiFi"}
        ]
        
        for idx, srv in enumerate(self.defined_services):
            srv_frame = tk.Frame(self.services_container, bg="#1a1f35", bd=1, relief="solid")
            srv_frame.pack(fill="x", pady=6)
            
            # Nombre y descripción
            text_frame = tk.Frame(srv_frame, bg="#1a1f35")
            text_frame.pack(side="left", padx=15, pady=10, fill="x", expand=True)
            
            lbl_name = tk.Label(text_frame, text=srv["name"], font=self.font_header, fg=self.text_color, bg="#1a1f35")
            lbl_name.pack(anchor="w")
            lbl_desc = tk.Label(text_frame, text=srv["desc"], font=self.font_log, fg=self.text_dim, bg="#1a1f35")
            lbl_desc.pack(anchor="w")
            
            # Estado badge
            status_badge_var = tk.StringVar(value="DESCONECTADO")
            lbl_status = tk.Label(srv_frame, textvariable=status_badge_var, font=self.font_header, fg=self.text_dim, bg="#1a1f35", width=14, anchor="center")
            lbl_status.pack(side="left", padx=10)
            
            # Botones de control
            btn_start = tk.Button(
                srv_frame, text="🟢 Start", font=self.font_body, bg="#0d2e1a", fg=self.emerald_color, 
                bd=1, relief="solid", width=7, cursor="hand2",
                command=lambda sid=srv["id"]: self.control_node_service(sid, "start")
            )
            btn_start.pack(side="left", padx=4)
            
            btn_stop = tk.Button(
                srv_frame, text="🔴 Stop", font=self.font_body, bg="#3b1114", fg=self.crimson_color, 
                bd=1, relief="solid", width=7, cursor="hand2",
                command=lambda sid=srv["id"]: self.control_node_service(sid, "stop")
            )
            btn_stop.pack(side="left", padx=4)
            
            btn_restart = tk.Button(
                srv_frame, text="🔄 Restart", font=self.font_body, bg="#2a1f10", fg=self.amber_color, 
                bd=1, relief="solid", width=8, cursor="hand2",
                command=lambda sid=srv["id"]: self.control_node_service(sid, "restart")
            )
            btn_restart.pack(side="left", padx=(4, 15))
            
            # Almacenar en una estructura de datos limpia para el actualizador
            srv["ui_lbl_var"] = status_badge_var
            
            # Vamos a reconstruir un panel de control real más flexible para systemd
            # En lugar de Tkinter StringVar directamente en grids rotas, mantenemos un dict de Labels dinámicos:
            if not hasattr(self, 'srv_badge_vars'):
                self.srv_badge_vars = {}
                self.srv_badge_labels = {}
            
            self.srv_badge_vars[srv["id"]] = status_badge_var
            self.srv_badge_labels[srv["id"]] = lbl_status

    # -------------------------------------------------------------------------
    # TAB 4: LISTA DE PROCESOS NATIVOS Y TERMINAL DE LOGS
    # -------------------------------------------------------------------------
    def build_processes_tab(self):
        self.tab_processes.rowconfigure(0, weight=1)
        self.tab_processes.rowconfigure(1, weight=1)
        self.tab_processes.columnconfigure(0, weight=1)
        
        # Panel Superior: Tabla de Procesos Activos del Nodo
        proc_frame = tk.LabelFrame(self.tab_processes, text=" PROCESOS ACTIVOS EN EL NODO (TOP POR CPU) ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        proc_frame.grid(row=0, column=0, padx=15, pady=(15, 5), sticky="nsew")
        
        # Caja de texto ScrolledText con formato de tabla
        self.processes_box = scrolledtext.ScrolledText(proc_frame, bg="#030712", fg="#34d399", font=("Courier", 10), bd=0)
        self.processes_box.pack(fill="both", expand=True, padx=12, pady=12)
        self.processes_box.insert(tk.END, "Sondeando tabla de procesos del núcleo cognitivo...")
        
        # Panel Inferior: Consola de Logs e Historial de Eventos del Cliente
        logs_frame = tk.LabelFrame(self.tab_processes, text=" REGISTRO HISTÓRICO Y AUDITORÍA DE OPERACIONES ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        logs_frame.grid(row=1, column=0, padx=15, pady=(5, 15), sticky="nsew")
        
        self.logs_box = scrolledtext.ScrolledText(logs_frame, bg="#030712", fg="#38bdf8", insertbackground="#38bdf8", font=self.font_log, bd=0)
        self.logs_box.pack(fill="both", expand=True, padx=12, pady=12)
        
        self.write_log("[+] Companion App de CMineWar OS inicializada con éxito.")
        self.write_log("[+] Sincronizada con el pipeline dinámico de versión y compilaciones.")

    # -------------------------------------------------------------------------
    # TAB 5: CONTROLES FÍSICOS DE ENERGÍA Y RECOVERY
    # -------------------------------------------------------------------------
    def build_power_tab(self):
        self.tab_power.columnconfigure(0, weight=1)
        self.tab_power.rowconfigure(0, weight=1)
        
        pwr_frame = tk.LabelFrame(self.tab_power, text=" CONTROL DE ENERGÍA SEGURO DEL HARDWARE ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        pwr_frame.grid(row=0, column=0, padx=20, pady=20, sticky="nsew")
        
        warning_box = tk.Frame(pwr_frame, bg="#3b1114", bd=1, relief="solid")
        warning_box.pack(fill="x", padx=30, pady=25)
        
        warn_txt = (
            "⚠️ ATENCIÓN: Estas acciones enviarán señales ACPI de apagado directo\n"
            "a la placa base y procesador físico del nodo servidor de CMineWar OS.\n"
            "Sincronice todas sus tareas y guarde cambios antes de proceder."
        )
        tk.Label(warning_box, text=warn_txt, font=self.font_body, fg="#fca5a5", bg="#3b1114", justify="left").pack(padx=20, pady=15)
        
        btn_reboot = tk.Button(
            pwr_frame, text="🔄 REINICIAR MAQUINARIA DE CMINEWAR OS", font=self.font_header, 
            bg="#2a1f10", fg=self.amber_color, bd=1, relief="solid", height=2, cursor="hand2",
            command=lambda: self.trigger_power_control("reboot")
        )
        btn_reboot.pack(fill="x", padx=30, pady=10)
        
        btn_shutdown = tk.Button(
            pwr_frame, text="🚨 PROCEDER AL APAGADO SEGURO DE HARDWARE (SHUTDOWN)", font=self.font_header, 
            bg="#3b1114", fg=self.crimson_color, bd=1, relief="solid", height=2, cursor="hand2",
            command=lambda: self.trigger_power_control("shutdown")
        )
        btn_shutdown.pack(fill="x", padx=30, pady=10)

    # -------------------------------------------------------------------------
    # TAB 6: GESTIÓN DE MEDIOS EXTRAÍBLES Y USB
    # -------------------------------------------------------------------------
    def build_usb_tab(self):
        self.tab_usb.columnconfigure(0, weight=1)
        self.tab_usb.rowconfigure(0, weight=1)
        
        usb_frame = tk.LabelFrame(self.tab_usb, text=" DISPOSITIVOS DE ALMACENAMIENTO Y PUERTOS USB ", font=self.font_header, fg=self.text_color, bg=self.card_color, bd=1, relief="solid")
        usb_frame.grid(row=0, column=0, padx=15, pady=15, sticky="nsew")
        
        # Upper control bar with Scan Button
        ctrl_frame = tk.Frame(usb_frame, bg=self.card_color)
        ctrl_frame.pack(fill="x", padx=15, pady=(15, 5))
        
        lbl_info = tk.Label(ctrl_frame, text="Dispositivos detectados en los buses del Nodo:", font=self.font_body, fg=self.text_dim, bg=self.card_color)
        lbl_info.pack(side="left", pady=5)
        
        btn_scan = tk.Button(
            ctrl_frame, text="🔎 ESCANEAR EN TIEMPO REAL", font=self.font_body,
            bg="#0f172a", fg=self.emerald_color, activebackground=self.emerald_color, activeforeground="#000",
            bd=1, relief="solid", cursor="hand2", command=self.scan_usb_devices
        )
        btn_scan.pack(side="right", padx=5)
        
        # Scrolled Text Box for displaying detected USB disks
        self.usb_box = scrolledtext.ScrolledText(usb_frame, bg="#030712", fg="#38bdf8", font=("Courier", 10), bd=0)
        self.usb_box.pack(fill="both", expand=True, padx=15, pady=15)
        self.usb_box.insert(tk.END, "Presione 'ESCANEAR EN TIEMPO REAL' o espere el sondeo automático para listar medios USB...")

    def scan_usb_devices(self):
        """ Forzar el escaneo de dispositivos USB tanto local como remotamente """
        self.write_log("[*] Forzando escaneo de dispositivos de almacenamiento USB y discos...")
        if self.connection_mode.get() == "remote":
            node_url = self.get_node_url()
            url = f"{node_url}/api/cminewar/disks"
            self.write_log(f"[*] Consultando API remota: {url}")
            
            def run():
                try:
                    req = urllib.request.Request(url)
                    with urllib.request.urlopen(req, timeout=2.5) as response:
                        if response.status == 200:
                            data = json.loads(response.read().decode("utf-8"))
                            disks = data.get("disks", [])
                            self.update_usb_tab_data(disks)
                            self.write_log(f"[✓] Se detectaron {len(disks)} dispositivos de almacenamiento en el nodo remoto.")
                except Exception as e:
                    self.write_log(f"[❌] Error consultando discos remotos: {e}")
                    self.update_usb_tab_data([])
            threading.Thread(target=run, daemon=True).start()
        else:
            # Local Sudo / Local Machine scanning
            try:
                # Intentar usar lsblk en formato JSON
                res = subprocess.run(["lsblk", "-J", "-d", "-o", "NAME,SIZE,TYPE,TRAN"], capture_output=True, text=True)
                if res.returncode == 0:
                    data = json.loads(res.stdout)
                    disks = []
                    for dev in data.get("blockdevices", []):
                        if dev.get("type") == "disk":
                            disks.append({
                                "name": dev.get("name"),
                                "size": dev.get("size", "Genérico"),
                                "type": dev.get("type"),
                                "transport": dev.get("tran", "sata")
                            })
                    self.update_usb_tab_data(disks)
                else:
                    # Fallback raw parsing
                    raw_res = subprocess.run(["lsblk", "-d", "-o", "NAME,SIZE,TYPE,TRAN", "-r"], capture_output=True, text=True)
                    lines = raw_res.stdout.strip().split("\n")
                    disks = []
                    for l in lines[1:]:
                        parts = l.strip().split()
                        if len(parts) >= 2:
                            is_disk = "disk" in parts
                            if is_disk:
                                idx = parts.index("disk")
                                disks.append({
                                    "name": parts[0],
                                    "size": parts[1] if idx > 1 else "Genérico",
                                    "type": "disk",
                                    "transport": parts[idx+1] if len(parts) > idx+1 else "sata"
                                })
                    self.update_usb_tab_data(disks)
                self.write_log("[✓] Escaneo local de discos completado con éxito.")
            except Exception as e:
                self.write_log(f"[❌] Error en escaneo local de discos: {e}")
                self.update_usb_tab_data([])

    def update_usb_tab_data(self, disks):
        """ Actualiza la tabla visual de la pestaña USB """
        self.usb_box.delete("1.0", tk.END)
        if not disks:
            self.usb_box.insert(tk.END, "⚠️ No se encontraron dispositivos de almacenamiento físicos conectados.\n")
            self.usb_box.insert(tk.END, "Asegúrese de insertar su memoria USB en los puertos del equipo servidor.")
            return
            
        header = f"{'DISPOSITIVO':<15} | {'TAMAÑO':<10} | {'TIPO':<10} | {'CONEXIÓN / BUS':<15} | {'ESTADO':<15}\n"
        divider = "=" * 70 + "\n"
        body = header + divider
        
        for d in disks:
            name = f"/dev/{d.get('name')}"
            size = d.get("size", "N/A")
            dtype = d.get("type", "disk").upper()
            tran = d.get("transport", "sata").upper()
            
            status = "SISTEMA PRINCIPAL" if tran == "SATA" else "MEDIO REMOVIBLE"
            if tran == "USB":
                status = "✨ USB CONECTADO"
                
            body += f"{name:<15} | {size:<10} | {dtype:<10} | {tran:<15} | {status:<15}\n"
            
        self.usb_box.insert(tk.END, body)

    # -------------------------------------------------------------------------
    # BUCLE DE SONDEO Y ACTUALIZACIÓN EN SEGUNDO PLANO
    # -------------------------------------------------------------------------
    def get_node_url(self):
        url = self.node_url_var.get().strip()
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "http://" + url
        # Strip trailing slash
        if url.endswith("/"):
            url = url[:-1]
        return url

    def set_connection_status(self, connected, message):
        self.connection_status_var.set(message)
        if connected:
            self.lbl_conn_status.configure(fg=self.emerald_color)
            self.server_status_var.set("ONLINE (CONECTADO)")
            self.lbl_api_status.configure(fg=self.emerald_color)
        else:
            self.lbl_conn_status.configure(fg=self.crimson_color)
            self.server_status_var.set("DESCONECTADO")
            self.lbl_api_status.configure(fg=self.crimson_color)

    def reset_telemetry_fields(self):
        self.cpu_usage_var.set("0 % (Desconectado)")
        self.cpu_bar.configure(value=0)
        self.ram_usage_var.set("0 / 0 MB (0%)")
        self.ram_bar.configure(value=0)
        self.host_temp_var.set("0 °C (Desconectado)")
        self.system_uptime_var.set("--:--:--")
        self.host_info_var.set("Dispositivo: Desconectado de la Red")
        self.service_status_var.set("DESCONECTADO")
        self.lbl_srv_status.configure(fg=self.text_dim)
        self.firewall_status_var.set("DESCONECTADO")
        self.lbl_fw_status.configure(fg=self.text_dim)
        
        # Reset services status badge
        for srv_id in self.srv_badge_vars:
            self.srv_badge_vars[srv_id].set("DESCONECTADO")
            self.srv_badge_labels[srv_id].configure(fg=self.text_dim)

    def format_uptime(self, secs):
        if secs < 60:
            return f"{secs}s"
        mins = secs // 60
        if mins < 60:
            return f"{mins}m {secs % 60}s"
        hours = mins // 60
        if hours < 24:
            return f"{hours}h {mins % 60}m"
        days = hours // 24
        return f"{days}d {hours % 24}h {mins % 60}m"

    def update_ui_with_api_data(self, data):
        # CPU
        cpu = data.get("cpu", 5)
        self.cpu_usage_var.set(f"{cpu} %")
        self.cpu_bar.configure(value=cpu)
        
        # Memory
        mem = data.get("memory", {})
        used = mem.get("used", 0)
        total = mem.get("total", 0)
        pct = mem.get("percent", 0)
        self.ram_usage_var.set(f"{used} MB / {total} MB ({pct}%)")
        self.ram_bar.configure(value=pct)
        
        # Temp and Uptime
        temp = data.get("temperature", 41)
        self.host_temp_var.set(f"{temp} °C")
        
        uptime = data.get("uptime", 0)
        self.system_uptime_var.set(self.format_uptime(uptime))
        
        # Host Metadata details
        hostname = data.get("hostname", "Desconocido")
        arch = data.get("arch", "x64")
        platform = data.get("platform", "linux")
        self.host_info_var.set(f"Hostname:  {hostname}\nKernel/SO: {platform} ({arch})\nNodo Core: Real de Producción")
        
        # Firewall
        fw_active = data.get("firewallActive", False)
        if fw_active:
            self.firewall_status_var.set("🔒 AISLADO (MÁXIMA SEGURIDAD)")
            self.lbl_fw_status.configure(fg=self.amber_color)
            self.fw_disp_lbl.configure(fg=self.amber_color)
        else:
            self.firewall_status_var.set("🔓 WAN CONECTADA (INTERNET ABIERTO)")
            self.lbl_fw_status.configure(fg=self.blue_color)
            self.fw_disp_lbl.configure(fg=self.emerald_color)
            
        # Update Service Badges inside services dict
        services_list = data.get("services", [])
        cminewar_srv_active = False
        for srv_status_item in services_list:
            srv_id = srv_status_item.get("id")
            # En la API el servicio systemd de cminewar se reporta bajo "cminewar-service"
            status = srv_status_item.get("status", "inactive")
            
            ui_srv_id = "cminewar-service" if srv_id == "cminewar" else srv_id
            if ui_srv_id in self.srv_badge_vars:
                if status == "active":
                    self.srv_badge_vars[ui_srv_id].set("ACTIVO (OK)")
                    self.srv_badge_labels[ui_srv_id].configure(fg=self.emerald_color)
                    if ui_srv_id == "cminewar-service":
                        cminewar_srv_active = True
                else:
                    self.srv_badge_vars[ui_srv_id].set("INACTIVO")
                    self.srv_badge_labels[ui_srv_id].configure(fg=self.crimson_color)
                    
        if cminewar_srv_active:
            self.service_status_var.set("CORRIENDO (OK)")
            self.lbl_srv_status.configure(fg=self.emerald_color)
        else:
            self.service_status_var.set("INACTIVO / DETENIDO")
            self.lbl_srv_status.configure(fg=self.crimson_color)
            
        # Processes top table formatting
        proc_list = data.get("processes", [])
        proc_header = f"{'PID':<7} | {'PROCESO / COMANDO':<30} | {'CPU%':<8} | {'RAM (MB)':<8}\n"
        proc_divider = "-" * 62 + "\n"
        proc_text = proc_header + proc_divider
        for p in proc_list[:12]: # Top 12 processes
            pid = p.get("pid", 0)
            name = p.get("name", "sys")[:28]
            cpu_val = p.get("cpu", 0.0)
            ram_val = p.get("ram", 0)
            proc_text += f"{pid:<7} | {name:<30} | {cpu_val:<8.1f} | {ram_val:<8} MB\n"
            
        # Update ScrolledText safely on Tkinter thread
        self.processes_box.delete("1.0", tk.END)
        self.processes_box.insert(tk.END, proc_text)

    # -------------------------------------------------------------------------
    # LOCAL BASH SUDO DEBBUGING FALLBACK
    # -------------------------------------------------------------------------
    def poll_local_status(self):
        """ Sondeo local utilizando llamadas subprocess bash en este equipo """
        try:
            # 1. Comprobar systemd cminewar.service
            srv_res = subprocess.run(["systemctl", "is-active", "cminewar"], capture_output=True, text=True)
            srv_active = srv_res.stdout.strip() == "active"
            if srv_active:
                self.service_status_var.set("CORRIENDO (OK)")
                self.lbl_srv_status.configure(fg=self.emerald_color)
                if "cminewar-service" in self.srv_badge_vars:
                    self.srv_badge_vars["cminewar-service"].set("ACTIVO (OK)")
                    self.srv_badge_labels["cminewar-service"].configure(fg=self.emerald_color)
            else:
                self.service_status_var.set("INACTIVO")
                self.lbl_srv_status.configure(fg=self.crimson_color)
                if "cminewar-service" in self.srv_badge_vars:
                    self.srv_badge_vars["cminewar-service"].set("INACTIVO")
                    self.srv_badge_labels["cminewar-service"].configure(fg=self.crimson_color)
            
            # Polling other local services
            other_services = ["nginx", "ssh", "network-manager"]
            for srv in other_services:
                sys_srv = "NetworkManager" if srv == "network-manager" else srv
                status_res = subprocess.run(["systemctl", "is-active", sys_srv], capture_output=True, text=True)
                is_ok = status_res.stdout.strip() == "active"
                if srv in self.srv_badge_vars:
                    self.srv_badge_vars[srv].set("ACTIVO (OK)" if is_ok else "INACTIVO")
                    self.srv_badge_labels[srv].configure(fg=self.emerald_color if is_ok else self.crimson_color)

            # 2. Comprobar firewall
            fw_blocked = False
            try:
                fw_res = subprocess.run(["sudo", "iptables", "-S", "OUTPUT"], capture_output=True, text=True)
                fw_blocked = "-P OUTPUT DROP" in fw_res.stdout
            except Exception:
                pass
                
            if fw_blocked:
                self.firewall_status_var.set("🔒 AISLADO (MÁXIMA SEGURIDAD)")
                self.lbl_fw_status.configure(fg=self.amber_color)
                self.fw_disp_lbl.configure(fg=self.amber_color)
            else:
                self.firewall_status_var.set("🔓 WAN CONECTADA (INTERNET ABIERTO)")
                self.lbl_fw_status.configure(fg=self.blue_color)
                self.fw_disp_lbl.configure(fg=self.emerald_color)

            # 3. Telemetría de hardware local
            # CPU Load
            try:
                with open("/proc/loadavg", "r") as f:
                    load = float(f.readline().split()[0])
                cores = os.cpu_count() or 1
                cpu_pct = min(int((load / cores) * 100), 100)
            except Exception:
                cpu_pct = 15 # Simulated local default
            self.cpu_usage_var.set(f"{cpu_pct} %")
            self.cpu_bar.configure(value=cpu_pct)
            
            # Memoria RAM
            total_mb = 8032
            used_mb = 1420
            pct = 17
            try:
                mem_res = subprocess.run(["free", "-m"], capture_output=True, text=True)
                lines = mem_res.stdout.split("\n")
                if len(lines) > 1:
                    parts = lines[1].split()
                    total_mb = int(parts[1])
                    used_mb = int(parts[2])
                    pct = int((used_mb / total_mb) * 100)
            except Exception:
                pass
            self.ram_usage_var.set(f"{used_mb} MB / {total_mb} MB ({pct}%)")
            self.ram_bar.configure(value=pct)
            
            # Temp and Uptime
            temp_val = 42
            try:
                if os.path.exists("/sys/class/thermal/thermal_zone0/temp"):
                    with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
                        temp_val = int(f.readline().strip()) / 1000
            except Exception:
                pass
            self.host_temp_var.set(f"{temp_val:.1f} °C")
            
            # Uptime
            uptime_secs = 600
            try:
                with open("/proc/uptime", "r") as f:
                    uptime_secs = int(float(f.readline().split()[0]))
            except Exception:
                pass
            self.system_uptime_var.set(self.format_uptime(uptime_secs))
            
            # Host meta
            self.host_info_var.set(f"Hostname:  {socket.gethostname()}\nKernel/SO: {sys.platform} ({os.uname().machine if hasattr(os, 'uname') else 'x64'})\nNodo Core: Host Físico de Depuración")
            self.set_connection_status(True, "MODO LOCAL DIRECTO")

            # Local processes lists
            try:
                output = subprocess.run(["ps", "-eo", "pid,comm,%cpu,%mem", "--sort=-%cpu"], capture_output=True, text=True).stdout
                lines = output.strip().split("\n")[:10] # first 10
                # build format table
                proc_divider = "-" * 62 + "\n"
                proc_text = f"{'PID':<7} | {'PROCESO LOCAL':<30} | {'CPU%':<8} | {'RAM (MB)':<8}\n" + proc_divider
                for l in lines[1:]:
                    parts = l.strip().split()
                    if len(parts) >= 4:
                        proc_text += f"{parts[0]:<7} | {parts[1][:28]:<30} | {float(parts[2]):<8.1f} | {int(float(parts[3]) * total_mb / 100):<8} MB\n"
                self.processes_box.delete("1.0", tk.END)
                self.processes_box.insert(tk.END, proc_text)
            except Exception:
                pass

        except Exception as e:
            self.set_connection_status(False, f"FALLO COMPROBACIÓN LOCAL: {str(e)[:40]}")

    def poll_status_loop(self):
        while self.running:
            if self.connection_mode.get() == "remote":
                node_url = self.get_node_url()
                try:
                    req = urllib.request.Request(f"{node_url}/api/cminewar/system-metrics")
                    with urllib.request.urlopen(req, timeout=1.8) as response:
                        if response.status == 200:
                            data = json.loads(response.read().decode("utf-8"))
                            self.update_ui_with_api_data(data)
                            self.set_connection_status(True, "CONECTADO A API")
                        else:
                            self.set_connection_status(False, f"Error HTTP: {response.status}")
                            self.reset_telemetry_fields()
                except Exception as e:
                    self.set_connection_status(False, "DESCONECTADO (Sondeando...)")
                    self.reset_telemetry_fields()
                
                # Consultar discos remotos de forma asíncrona sutil para la pestaña USB
                try:
                    req_disks = urllib.request.Request(f"{node_url}/api/cminewar/disks")
                    with urllib.request.urlopen(req_disks, timeout=1.5) as response_disks:
                        if response_disks.status == 200:
                            disks_data = json.loads(response_disks.read().decode("utf-8"))
                            self.update_usb_tab_data(disks_data.get("disks", []))
                except Exception:
                    pass
            else:
                self.poll_local_status()
                # Consultar discos locales de forma sutil para la pestaña USB
                try:
                    res = subprocess.run(["lsblk", "-J", "-d", "-o", "NAME,SIZE,TYPE,TRAN"], capture_output=True, text=True)
                    if res.returncode == 0:
                        data = json.loads(res.stdout)
                        disks = []
                        for dev in data.get("blockdevices", []):
                            if dev.get("type") == "disk":
                                disks.append({
                                    "name": dev.get("name"),
                                    "size": dev.get("size", "Genérico"),
                                    "type": dev.get("type"),
                                    "transport": dev.get("tran", "sata")
                                })
                        self.update_usb_tab_data(disks)
                    else:
                        raw_res = subprocess.run(["lsblk", "-d", "-o", "NAME,SIZE,TYPE,TRAN", "-r"], capture_output=True, text=True)
                        lines = raw_res.stdout.strip().split("\n")
                        disks = []
                        for l in lines[1:]:
                            parts = l.strip().split()
                            if len(parts) >= 2:
                                is_disk = "disk" in parts
                                if is_disk:
                                    idx = parts.index("disk")
                                    disks.append({
                                        "name": parts[0],
                                        "size": parts[1] if idx > 1 else "Genérico",
                                        "type": "disk",
                                        "transport": parts[idx+1] if len(parts) > idx+1 else "sata"
                                    })
                        self.update_usb_tab_data(disks)
                except Exception:
                    pass
                
            time.sleep(2.5)

    def force_reconnect(self):
        self.write_log("[*] Forzando re-conexión e inicializando telemetría de red...")
        # Clean background polling triggers instant retry
        self.set_connection_status(False, "Sondeando...")

    def on_connection_mode_change(self):
        mode = self.connection_mode.get()
        self.write_log(f"[+] Cambiado a modo de operación: {mode.upper()}")
        if mode == "local":
            self.entry_ip.configure(state="disabled")
            self.btn_reconnect.configure(state="disabled")
        else:
            self.entry_ip.configure(state="normal")
            self.btn_reconnect.configure(state="normal")
        self.reset_telemetry_fields()

    def write_log(self, text):
        self.logs_box.insert(tk.END, f"[{time.strftime('%H:%M:%S')}] {text}\n")
        self.logs_box.see(tk.END)

    # -------------------------------------------------------------------------
    # OPERACIONES Y ACCIONES DE RED COMPAÑERAS (POSTS API / SUDO LOCAL)
    # -------------------------------------------------------------------------
    def run_local_admin_command(self, cmd_list, success_msg):
        """ Ejecuta un comando bash con privilegios locales sudo en hilo asíncrono """
        def run():
            try:
                self.write_log(f"[*] Ejecutando local: {' '.join(cmd_list)}")
                res = subprocess.run(cmd_list, capture_output=True, text=True)
                if res.returncode == 0:
                    self.write_log(f"[✓] {success_msg}")
                    if res.stdout:
                        self.write_log(res.stdout.strip())
                else:
                    err_msg = res.stderr.strip() or f"Código de retorno {res.returncode}"
                    self.write_log(f"[❌] Falló: {err_msg}")
                    messagebox.showerror("Error Local", f"No se pudo completar la operación local:\n{err_msg}")
            except Exception as e:
                self.write_log(f"[❌] Excepción en comando local: {str(e)}")
                messagebox.showerror("Excepción", f"Excepción al ejecutar comando local:\n{e}")
        threading.Thread(target=run, daemon=True).start()

    def async_api_post(self, url, data_dict, success_msg):
        """ Envía una petición POST de forma asíncrona a la API del nodo remoto """
        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(data_dict).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=3.5) as res:
                res_data = json.loads(res.read().decode("utf-8"))
                if not res_data.get("success", True):
                    msg = res_data.get("message", res_data.get("error", "Fallo desconocido"))
                    self.write_log(f"[❌] Falló en el Nodo: {msg}")
                    messagebox.showerror("Error de Servicio", msg)
                else:
                    msg = res_data.get("message", success_msg)
                    self.write_log(f"[✓] API del Nodo responde: {msg}")
                    messagebox.showinfo("Servidor", msg)
        except urllib.error.HTTPError as e:
            try:
                body = e.read().decode("utf-8")
                res_data = json.loads(body)
                msg = res_data.get("error", res_data.get("message", str(e)))
                self.write_log(f"[❌] Error en llamada API a '{url}': {msg}")
                messagebox.showerror("Error de Servidor", f"El servidor respondió con un error:\n{msg}")
            except Exception:
                err_str = str(e)
                self.write_log(f"[❌] Error en llamada API a '{url}': {err_str}")
                messagebox.showerror("Fallo de Red API", f"No se pudo completar la llamada al nodo remoto.\nDetalle: {err_str}")
        except Exception as e:
            err_str = str(e)
            self.write_log(f"[❌] Error en llamada API a '{url}': {err_str}")
            messagebox.showerror("Fallo de Red API", f"No se pudo completar la llamada al nodo remoto.\nVerifique que el nodo esté encendido y respondiendo.\nDetalle: {err_str}")

    def control_node_service(self, service_id, action):
        """ Activa/Detiene/Reinicia un daemon de sistema en el nodo """
        if self.connection_mode.get() == "remote":
            node_url = self.get_node_url()
            url = f"{node_url}/api/cminewar/services/control"
            payload = {"serviceId": service_id, "action": action}
            self.write_log(f"[*] Enviando comando API de servicio: {action} {service_id}")
            threading.Thread(target=self.async_api_post, args=(url, payload, f"Daemon {service_id} {action}ed correctamente."), daemon=True).start()
        else:
            # Local Sudo Debugging
            sys_srv_name = "cminewar" if service_id == "cminewar-service" else service_id
            if sys_srv_name == "network-manager":
                sys_srv_name = "NetworkManager"
            cmd = ["sudo", "systemctl", action, sys_srv_name]
            self.run_local_admin_command(cmd, f"Servicio local '{sys_srv_name}' cambiado a '{action}' con éxito.")

    def block_wan(self):
        """ Activa aislamiento militar anti-WAN """
        if self.connection_mode.get() == "remote":
            node_url = self.get_node_url()
            url = f"{node_url}/api/cminewar/firewall/toggle"
            payload = {"action": "block"}
            self.write_log("[*] Solicitando bloqueo de tráfico WAN al nodo remoto...")
            threading.Thread(target=self.async_api_post, args=(url, payload, "El nodo remoto ha bloqueado el tráfico WAN con éxito."), daemon=True).start()
        else:
            # Local Sudo
            self.run_local_admin_command(["sudo", "cminewar-firewall", "block"], "Tráfico WAN bloqueado localmente mediante iptables.")

    def allow_wan(self):
        """ Desactiva aislamiento militar anti-WAN """
        if self.connection_mode.get() == "remote":
            node_url = self.get_node_url()
            url = f"{node_url}/api/cminewar/firewall/toggle"
            payload = {"action": "allow"}
            self.write_log("[*] Solicitando liberación de tráfico WAN al nodo remoto...")
            threading.Thread(target=self.async_api_post, args=(url, payload, "El nodo remoto ha restablecido acceso a Internet."), daemon=True).start()
        else:
            # Local Sudo
            self.run_local_admin_command(["sudo", "cminewar-firewall", "allow"], "Tráfico WAN restablecido localmente en iptables.")

    def trigger_power_control(self, action):
        """ Reinicia o apaga la máquina física del nodo """
        act_esp = "reiniciar" if action == "reboot" else "apagar"
        if not messagebox.askyesno("Confirmar Acción", f"¿Está completamente seguro de que desea {act_esp.upper()} el hardware del nodo?"):
            return
            
        if self.connection_mode.get() == "remote":
            node_url = self.get_node_url()
            url = f"{node_url}/api/cminewar/system/power"
            payload = {"action": action}
            self.write_log(f"[!] Transmitiendo comando ACPI de {action.upper()} al nodo remoto...")
            threading.Thread(target=self.async_api_post, args=(url, payload, f"Orden de {action.upper()} enviada al nodo físico."), daemon=True).start()
        else:
            # Local Sudo
            cmd = ["sudo", "reboot"] if action == "reboot" else ["sudo", "poweroff"]
            self.run_local_admin_command(cmd, f"Ejecutando {action} física en este equipo...")

    def close(self):
        self.running = False
        self.root.destroy()

def main():
    root = tk.Tk()
    app = CMineWarCompanionApp(root)
    root.protocol("WM_DELETE_WINDOW", app.close)
    root.mainloop()

if __name__ == "__main__":
    main()

# Proyecto propiedad de Yonah Llanes
