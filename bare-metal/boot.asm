; =========================================================================
;                CLAWOS MASTER BOOT RECORD (MBR) BOOTLOADER
;               Compatible con BIOS Legacy x86 (Real Mode 16-bit)
; =========================================================================
; Para compilar: nasm -f bin boot.asm -o boot.bin
; Para probar en emulador: qemu-system-i386 -fda boot.bin
; Para flashear a USB (¡CUIDADO! Reemplaza sdX con tu USB real): 
;   sudo dd if=boot.bin of=/dev/sdX bs=512 conv=notrunc && sync
; =========================================================================

org 0x7C00          ; Dirección estándar de carga del sector de arranque por la BIOS
bits 16             ; Modo de ejecución de 16-bits (Modo Real Intel)

start:
    ; Configurar los registros de segmento con valores seguros
    cli             ; Deshabilitar interrupciones
    xor ax, ax      ; Poner AX a cero del tirón
    mov ds, ax
    mov es, ax
    mov ss, ax
    mov sp, 0x7C00  ; La pila crece hacia abajo desde el inicio del cargador
    sti             ; Habilitar interrupciones de nuevo

    ; Limpiar pantalla de consola y cambiar a modo texto estándar de 80x25
    mov ax, 3
    int 0x10

    ; Cambiar color de fondo/fuente (opcional, por defecto negro con gris)
    ; Llamamos a la macro para imprimir la pantalla de bienvenida de clawOS
    mov si, logo_header
    call print_string

    mov si, logo_dragon
    call print_string

    mov si, text_welcome
    call print_string

    mov si, text_instructions
    call print_string

hang:
    ; Bucle infinito de lectura de teclado e interacción simulada del Kernel
    call read_keystroke
    
    ; El usuario presionó una tecla, vamos a simular reiniciar la CPU física al presionar 'r' o 'R'
    cmp al, 'r'
    je reboot_machine
    cmp al, 'R'
    je reboot_machine
    
    ; De lo contrario, imprimir la tecla y seguir esperando
    mov ah, 0x0E
    int 0x10
    jmp hang

; =========================================================================
; SUBRUTINAS
; =========================================================================

; Función para imprimir una cadena de texto terminada en cero (Null-terminated)
print_string:
    push ax
    push bx
    mov ah, 0x0E    ; Función BIOS teletype para escribir caracter
    mov bh, 0x00    ; Página de video 0
    mov bl, 0x0A    ; Color verde claro para las fuentes impresas

.next_char:
    lodsb           ; Carga el siguiente byte apuntado por SI en AL, e incrementa SI
    cmp al, 0       ; ¿Es el fin de la cadena?
    je .done
    int 0x10        ; Llamar a interrupción de video de BIOS
    jmp .next_char

.done:
    pop bx
    pop ax
    ret

; Leer una pulsación del teclado (espera síncrona de BIOS)
read_keystroke:
    mov ah, 0x00
    int 0x16        ; Interrupción de teclado BIOS, retorna el caracter ASCII en AL
    ret

; Reiniciar físicamente el ordenador de manera limpia mediante el comando de la BIOS
reboot_machine:
    mov si, text_reboot
    call print_string
    
    ; Pequeña espera por hardware
    mov cx, 0x001E
.wait_loop:
    push cx
    xor cx, cx
.wait_inner:
    nop
    loop .wait_inner
    pop cx
    loop .wait_loop

    ; Lanzar salto directo al vector de reinicio en caliente de la BIOS (F000:FFF0)
    jmp 0xFFFF:0x0000

; =========================================================================
; STRINGS & DATOS DE TEXTOS
; =========================================================================

logo_header db "================================================================================", 13, 10
            db "                 [ clawOS v1.1.2 - NUCLEO DIRECTO BARE-METAL ]", 13, 10
            db "================================================================================", 13, 10, 0

logo_dragon db "          ,      ,", 13, 10
            db "         /(    /(", 13, 10
            db "        // \ _/ \\          *   BIENVENIDO AL DESVELE DEL DRAGON    *", 13, 10
            db "       / ( /_` \\ ) \", 13, 10
            db "      /  _//   \\_  \", 13, 10
            db "     ()_ (     ) _()        Kernel 16-bits Real Mode cargado en DS/ES", 13, 10
            db "    /   __\\___/__   \", 13, 10
            db "   / _/ \\_  _ /  \\_ \", 13, 10
            db "  (_/     \\/     \\_)", 13, 10, 13, 10, 0

text_welcome db " [+] El cargador de arranque Legacy MBR ha inicializado las pilas lógicas.", 13, 10
             db " [+] Direccionamiento físico alineado perfectamente en 0x7C00.", 13, 10
             db " [+] Microcontroladores del ordenador activos y bajo supervisión del emulador.", 13, 10, 13, 10, 0

text_instructions db " Escribe cualquier texto directamente en tu teclado bare-metal.", 13, 10
                  db " > PRESIONA 'R' EN TU TECLADO PARA REINICIAR LA COMPUTADORA FISICA.", 13, 10, 13, 10
                  db " Consola abierta (claw_kernel_sh)> ", 0

text_reboot db 13, 10, " [/] Solicitud de reinicio por hardware aceptada. Reiniciando ordenador...", 13, 10, 0

; =========================================================================
; RELLENO Y FIRMA MBR
; =========================================================================

times 510-($-$$) db 0   ; Rellenar el resto del sector con ceros para completar exactamente 510 bytes

dw 0xAA55               ; Firma de arranque obligatoria por especificación BIOS (últimos 2 bytes del sector de 512)
