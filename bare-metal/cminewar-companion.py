#!/usr/bin/env python3
import os
import sys
import subprocess
import urllib.request
import urllib.error
import threading
import time
import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext

class CMineWarCompanionApp:
    def __init__(self, root):
        self.root = root
        self.root.title("CMineWar OS - Ubuntu Companion App")
        self.root.geometry("720x540")
        self.root.configure(bg="#0c0f1d")
        
        # Estilos y fuentes
        self.font_title = ("Courier", 16, "bold")
        self.font_header = ("Courier", 11, "bold")
        self.font_body = ("Courier", 10)
        self.font_log = ("Courier", 9)
        
        self.accent_bg = "#111625"
        self.text_color = "#e2e8f0"
        self.green_color = "#10b981"
        self.red_color = "#ef4444"
        self.blue_color = "#3b82f6"
        self.purple_color = "#a855f7"
        
        # Variables de estado
        self.server_status_var = tk.StringVar(value="CONSULTANDO...")
        self.service_status_var = tk.StringVar(value="CONSULTANDO...")
        self.firewall_status_var = tk.StringVar(value="CONSULTANDO...")
        
        self.setup_ui()
        
        # Hilo de sondeo para refrescar estado en segundo plano
        self.running = True
        self.status_thread = threading.Thread(target=self.poll_status_loop, daemon=True)
        self.status_thread.start()

    def setup_ui(self):
        # 1. Cabecera Premium
        header_frame = tk.Frame(self.root, bg="#111625", height=60)
        header_frame.pack(fill="x", padx=10, pady=5)
        
        title_label = tk.Label(
            header_frame, 
            text="🐉 CMINEWAR OS - PANEL DE CONTROL COMPANION", 
            font=self.font_title, 
            fg=self.purple_color, 
            bg="#111625"
        )
        title_label.pack(pady=10)
        
        # 2. Panel de Estados de los Subsistemas
        status_frame = tk.LabelFrame(
            self.root, 
            text=" ESTADO DE LOS SUBSISTEMAS ", 
            font=self.font_header, 
            fg=self.text_color, 
            bg="#0c0f1d", 
            bd=1, 
            relief="solid"
        )
        status_frame.pack(fill="x", padx=10, pady=5)
        
        # Configurar columnas
        status_frame.columnconfigure(0, weight=1)
        status_frame.columnconfigure(1, weight=1)
        status_frame.columnconfigure(2, weight=1)
        
        # Estado de la API Web (Vite/Express)
        api_lbl_title = tk.Label(status_frame, text="Servidor Web (API):", font=self.font_body, fg="#888", bg="#0c0f1d")
        api_lbl_title.grid(row=0, column=0, pady=(5, 0))
        self.api_status_label = tk.Label(
            status_frame, 
            textvariable=self.server_status_var, 
            font=self.font_header, 
            fg=self.text_color, 
            bg="#0c0f1d"
        )
        self.api_status_label.grid(row=1, column=0, pady=(0, 10))
        
        # Estado del Servicio de fondo (Systemd)
        srv_lbl_title = tk.Label(status_frame, text="Servicio Systemd:", font=self.font_body, fg="#888", bg="#0c0f1d")
        srv_lbl_title.grid(row=0, column=1, pady=(5, 0))
        self.service_status_label = tk.Label(
            status_frame, 
            textvariable=self.service_status_var, 
            font=self.font_header, 
            fg=self.text_color, 
            bg="#0c0f1d"
        )
        self.service_status_label.grid(row=1, column=1, pady=(0, 10))
        
        # Estado del Cortafuegos (iptables / WAN)
        fw_lbl_title = tk.Label(status_frame, text="Aislamiento Red (WAN):", font=self.font_body, fg="#888", bg="#0c0f1d")
        fw_lbl_title.grid(row=0, column=2, pady=(5, 0))
        self.firewall_status_label = tk.Label(
            status_frame, 
            textvariable=self.firewall_status_var, 
            font=self.font_header, 
            fg=self.text_color, 
            bg="#0c0f1d"
        )
        self.firewall_status_label.grid(row=1, column=2, pady=(0, 10))

        # 3. Panel de Acciones y Controles Rápidos
        controls_frame = tk.LabelFrame(
            self.root, 
            text=" CONTROLES DE ADMINISTRACIÓN ", 
            font=self.font_header, 
            fg=self.text_color, 
            bg="#0c0f1d", 
            bd=1, 
            relief="solid"
        )
        controls_frame.pack(fill="x", padx=10, pady=5)
        
        # Fila 1 de botones
        btn_start = tk.Button(
            controls_frame, 
            text="🟢 INICIAR SERVICIO", 
            font=self.font_body, 
            bg="#0e2316", 
            fg=self.green_color, 
            activebackground=self.green_color,
            activeforeground="#000",
            bd=1, 
            relief="solid", 
            command=self.start_service
        )
        btn_start.pack(side="left", fill="x", expand=True, padx=5, pady=10)
        
        btn_stop = tk.Button(
            controls_frame, 
            text="🔴 DETENER SERVICIO", 
            font=self.font_body, 
            bg="#2c0f11", 
            fg=self.red_color, 
            activebackground=self.red_color,
            activeforeground="#000",
            bd=1, 
            relief="solid", 
            command=self.stop_service
        )
        btn_stop.pack(side="left", fill="x", expand=True, padx=5, pady=10)
        
        btn_block_wan = tk.Button(
            controls_frame, 
            text="🔒 AISLAR WAN (CORTAFUEGOS)", 
            font=self.font_body, 
            bg="#1b1c1e", 
            fg="#eab308", 
            activebackground="#eab308",
            activeforeground="#000",
            bd=1, 
            relief="solid", 
            command=self.block_wan
        )
        btn_block_wan.pack(side="left", fill="x", expand=True, padx=5, pady=10)
        
        btn_allow_wan = tk.Button(
            controls_frame, 
            text="🔓 PERMITIR WAN (CONECTADO)", 
            font=self.font_body, 
            bg="#0f172a", 
            fg=self.blue_color, 
            activebackground=self.blue_color,
            activeforeground="#000",
            bd=1, 
            relief="solid", 
            command=self.allow_wan
        )
        btn_allow_wan.pack(side="left", fill="x", expand=True, padx=5, pady=10)
        
        # Fila 2 de botones extra
        extra_frame = tk.Frame(self.root, bg="#0c0f1d")
        extra_frame.pack(fill="x", padx=10, pady=5)
        
        btn_web = tk.Button(
            extra_frame, 
            text="🌐 ABRIR INTERFAZ WEB (LOCAL:3000)", 
            font=self.font_body, 
            bg="#111625", 
            fg="#38bdf8", 
            activebackground="#38bdf8",
            activeforeground="#000",
            bd=1, 
            relief="solid", 
            command=self.open_web_ui
        )
        btn_web.pack(side="left", fill="x", expand=True, padx=5, pady=5)
        
        btn_refresh = tk.Button(
            extra_frame, 
            text="🔄 REPRODUCIR LOGS", 
            font=self.font_body, 
            bg="#111625", 
            fg="#f43f5e", 
            activebackground="#f43f5e",
            activeforeground="#000",
            bd=1, 
            relief="solid", 
            command=self.refresh_logs
        )
        btn_refresh.pack(side="left", fill="x", expand=False, padx=5, pady=5)

        # 4. Terminal de Logs de Instalación / Servidor
        logs_frame = tk.LabelFrame(
            self.root, 
            text=" CONSOLA DE SALIDA & TELEMETRÍA DE INSTALACIÓN ", 
            font=self.font_header, 
            fg=self.text_color, 
            bg="#0c0f1d", 
            bd=1, 
            relief="solid"
        )
        logs_frame.pack(fill="both", expand=True, padx=10, pady=5)
        
        self.logs_text = scrolledtext.ScrolledText(
            logs_frame, 
            bg="#030712", 
            fg="#a3e635", 
            insertbackground="#a3e635",
            font=self.font_log,
            bd=0
        )
        self.logs_text.pack(fill="both", expand=True, padx=5, pady=5)
        
        self.write_log("[+] Companion App de CMineWar OS inicializada con éxito.\n[+] Sondeando estado de servidores locales...")

    def poll_status_loop(self):
        """ Bucle que se ejecuta en segundo plano sondeando el estado de la máquina local """
        while self.running:
            # 1. Comprobar servidor Express en puerto 3000
            server_online = False
            try:
                # Intento de lectura de estado local con timeout corto
                req = urllib.request.Request("http://localhost:3000/api/cminewar/install-status")
                with urllib.request.urlopen(req, timeout=1.5) as response:
                    if response.status == 200:
                        server_online = True
            except Exception:
                pass
            
            if server_online:
                self.server_status_var.set("ONLINE (ACTIVO)")
                self.api_status_label.configure(fg=self.green_color)
            else:
                self.server_status_var.set("DESCONECTADO")
                self.api_status_label.configure(fg=self.red_color)
                
            # 2. Comprobar servicio systemd
            service_active = False
            try:
                # Comprobar si el servicio systemd está activo
                status_res = subprocess.run(
                    ["systemctl", "is-active", "cminewar.service"],
                    capture_output=True, text=True
                )
                if status_res.stdout.strip() == "active":
                    service_active = True
            except Exception:
                pass
                
            if service_active:
                self.service_status_var.set("CORRIENDO (OK)")
                self.service_status_label.configure(fg=self.green_color)
            else:
                self.service_status_var.set("INACTIVO")
                self.service_status_label.configure(fg=self.red_color)
                
            # 3. Comprobar estado del cortafuegos de red (iptables OUTPUT policy)
            fw_blocked = False
            try:
                rules_res = subprocess.run(
                    ["sudo", "iptables", "-S", "OUTPUT"],
                    capture_output=True, text=True
                )
                if "-P OUTPUT DROP" in rules_res.stdout:
                    fw_blocked = True
            except Exception:
                pass
                
            if fw_blocked:
                self.firewall_status_var.set("AISLADO (MÁXIMA SEGURIDAD)")
                self.firewall_status_label.configure(fg="#eab308")
            else:
                self.firewall_status_var.set("CONECTADO A WAN (LIBRE)")
                self.firewall_status_label.configure(fg=self.blue_color)
                
            time.sleep(2.5)

    def write_log(self, text):
        self.logs_text.insert(tk.END, text + "\n")
        self.logs_text.see(tk.END)

    def run_admin_command(self, cmd_list, success_msg):
        """ Ejecuta un comando requiriendo privilegios sudo """
        def task():
            self.write_log(f"[*] Ejecutando: {' '.join(cmd_list)}")
            try:
                res = subprocess.run(cmd_list, capture_output=True, text=True)
                if res.returncode == 0:
                    self.write_log(f"[✓] {success_msg}")
                    if res.stdout:
                        self.write_log(res.stdout.strip())
                else:
                    self.write_log(f"[❌] Error ({res.returncode}): {res.stderr.strip()}")
            except Exception as e:
                self.write_log(f"[❌] Excepción al ejecutar comando: {str(e)}")
        
        threading.Thread(target=task, daemon=True).start()

    def start_service(self):
        self.run_admin_command(
            ["sudo", "systemctl", "start", "cminewar.service"],
            "Servicio CMineWar OS (cminewar.service) iniciado correctamente."
        )

    def stop_service(self):
        self.run_admin_command(
            ["sudo", "systemctl", "stop", "cminewar.service"],
            "Servicio CMineWar OS detenido con éxito."
        )

    def block_wan(self):
        if command_exists("cminewar-firewall"):
            self.run_admin_command(
                ["sudo", "cminewar-firewall", "block"],
                "Acceso WAN bloqueado por cortafuegos. Red local abierta."
            )
        else:
            self.write_log("[!] Advertencia: El comando 'cminewar-firewall' no se detecta en el sistema. Ejecútelo como root.")

    def allow_wan(self):
        if command_exists("cminewar-firewall"):
            self.run_admin_command(
                ["sudo", "cminewar-firewall", "allow"],
                "Acceso WAN habilitado de forma libre."
            )
        else:
            self.write_log("[!] Advertencia: El comando 'cminewar-firewall' no se detecta en el sistema.")

    def open_web_ui(self):
        import webbrowser
        self.write_log("[*] Lanzando interfaz en el navegador del host...")
        webbrowser.open("http://localhost:3000")

    def refresh_logs(self):
        """ Lee las últimas líneas del archivo de instalación de logs y las muestra en pantalla """
        log_file = "/tmp/cminewar_install_log.txt"
        if os.path.exists(log_file):
            try:
                with open(log_file, "r") as f:
                    lines = f.readlines()[-40:] # Obtener últimas 40 líneas
                self.logs_text.delete("1.0", tk.END)
                self.write_log(f"=== REPRODUCIENDO ÚLTIMOS LOGS DE INSTALACIÓN ({log_file}) ===")
                for line in lines:
                    self.logs_text.insert(tk.END, line)
                self.logs_text.see(tk.END)
            except Exception as e:
                self.write_log(f"[❌] Error leyendo log de instalación: {str(e)}")
        else:
            self.write_log(f"[!] Archivo de log '{log_file}' no encontrado en el sistema actual.")

    def close(self):
        self.running = False
        self.root.destroy()

def command_exists(name):
    from shutil import which
    return which(name) is not None

def main():
    root = tk.Tk()
    app = CMineWarCompanionApp(root)
    root.protocol("WM_DELETE_WINDOW", app.close)
    root.mainloop()

if __name__ == "__main__":
    main()
