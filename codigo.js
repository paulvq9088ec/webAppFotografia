// cambio de color en inputs
        const inputs = document.querySelectorAll('#screen-1 input');
        const btnCerrar = document.querySelector('.cerrar');
        const body = document.body;
        
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.closest('.relative').classList.add('focus');
            });
            input.addEventListener('blur', () => {
                input.closest('.relative').classList.remove('focus');
            });
        });

        if(btnCerrar){
            btnCerrar.addEventListener('click', () => {
                body.style.padding = '0 4%'; // Restaurar padding al cerrar
            });
        }   

        const app = {
            // Estado de la app
            state: {
                userPhotoBase64: null,
                selectedFrameIndex: 0,
                originScreen: 'screen-2', // Para saber de dónde venimos en la pantalla 4
                stream: null // Referencia a la cámara
            },

            // CONFIGURACIÓN DE MARCOS
            // NOTA: Reemplaza estos SVG base64 por las rutas a tus imágenes PNG (ej: '../img/marco1.png')
            frames: [
                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect x='10' y='10' width='380' height='380' fill='none' stroke='%23FFDD00' stroke-width='20'/></svg>",
                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect x='20' y='20' width='360' height='360' fill='none' stroke='%230F265C' stroke-width='15' stroke-dasharray='30,10'/></svg>",
                "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'><rect x='0' y='0' width='400' height='400' fill='none' stroke='%2310b981' stroke-width='30'/><circle cx='40' cy='40' r='20' fill='%2310b981'/><circle cx='360' cy='360' r='20' fill='%2310b981'/></svg>"
            ],

           
            
            // 1. NAVEGACIÓN Y RUTEO BÁSICO
            navigate: function(targetScreenId, isBack = null) {
                const currentScreen = document.querySelector('.screen.active');
                const nextScreen = document.getElementById(targetScreenId);

                if (!nextScreen || currentScreen === nextScreen) return;

                // Detectar dirección si no se especifica explícitamente
                let back = isBack;
                if (back === null && window.event) {
                    const trigger = window.event.target.closest('.btn');
                    back = trigger ? trigger.classList.contains('btn-secondary') : false;
                }
                if (back === null) back = false;

                // Detener cámara si salimos de la pantalla de cámara
                if (targetScreenId !== 'screen-3a') this.stopCamera();

                // Caso especial: En la pantalla 2, ambos botones (Cámara y Galería) 
                // deben animar hacia la izquierda (avanzar), ignorando si es btn-secondary.
                if (currentScreen && currentScreen.id === 'screen-2') {
                    back = false;
                }

                // Clases de animación según dirección
                const exitClass = back ? 'anim-exit-right' : 'anim-exit-left';
                const enterClass = back ? 'anim-enter-left' : 'anim-enter-right';

                if (currentScreen) {
                    currentScreen.classList.add(exitClass);
                    nextScreen.classList.add('active', enterClass);

                    // Limpieza tras terminar la animación (500ms coincide con CSS)
                    setTimeout(() => {
                        currentScreen.classList.remove('active', exitClass);
                        nextScreen.classList.remove(enterClass);
                    }, 500);
                } else {
                    nextScreen.classList.add('active');
                }

                // Lógica de visualización del Header
                const header = document.getElementById('main-header');
                const body = document.body;
                if (targetScreenId === 'screen-1' || targetScreenId === 'screen-6') {
                    header.style.display = 'none';
                    body.style.padding = '0 4%'; // Eliminar padding para que el fondo ocupe toda la pantalla
                } else {
                    header.style.display = 'flex';
                    body.style.padding = '0'; // Eliminar padding para que el fondo ocupe toda la pantalla
                }

                // Disparadores específicos por pantalla
                if (targetScreenId === 'screen-3a') {
                    this.startCamera();
                }
                if (targetScreenId === 'screen-4') {
                    this.initFrameSelection();
                }
                if (targetScreenId === 'screen-1') {
                    // Limpiar formulario al volver al inicio
                    // document.getElementById('fullname').value = '';
                    document.getElementById('email').value = '';
                }
            },

            // 2. LÓGICA DE LOGIN Y GUARDADO DE USUARIO
            handleLogin: function() {
                
                // const nameInput = document.getElementById('fullname').value.trim();
                const emailInput = document.getElementById('email').value.trim();
                
                // const errName = document.getElementById('error-name');
                const errEmail = document.getElementById('error-email');
                
                // errName.style.display = 'none';
                errEmail.style.display = 'none';

                let isValid = true;

                // if (!nameInput) {
                //     errName.style.display = 'block';
                //     isValid = false;
                // }

                if (!emailInput || !emailInput.endsWith('@pichincha.com')) {
                    errEmail.style.display = 'block';
                    isValid = false;
                }

                if (isValid) {
                    // Guardar registro de usuario simulado en localStorage 
                    // (Esto permite luego generar el txt si un administrador lo desea)
                    //this.saveUserRecord(nameInput, emailInput); // Si quieres guardar el email también, descomenta esta línea y ajusta la función saveUserRecord
                    // this.saveUserRecord(nameInput);
                    this.saveUserRecord(emailInput); 
                    this.navigate('screen-2', false);
                }
            },

            //saveUserRecord: function(name, email) { //si deseas guardar el email, ajusta esta función para recibirlo como parámetro
            saveUserRecord: function(email) {
                const record = { email: email, date: new Date().toISOString() };
                let users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                //users.push({ name: name, email: email, date: new Date().toISOString() }); // Si decides guardar el email, usa esta línea
                users.push(record);
                localStorage.setItem('registeredUsers', JSON.stringify(users));
                
                // Enviar también a Google Sheets
                this.sendToGoogleSheets(record);
            },

            // 3. LÓGICA DE CÁMARA (Pantalla 3A)
            startCamera: async function() {
                const video = document.getElementById('video-element');
                try {
                    this.state.stream = await navigator.mediaDevices.getUserMedia({ 
                        video: { facingMode: 'user' } // Prefiere cámara frontal en móviles
                    });
                    video.srcObject = this.state.stream;
                } catch (err) {
                    console.error("Error al acceder a la cámara:", err);
                    alert("No se pudo acceder a la cámara. Revisa los permisos.");
                    this.navigate('screen-2');
                }
            },

            stopCamera: function() {
                if (this.state.stream) {
                    this.state.stream.getTracks().forEach(track => track.stop());
                    this.state.stream = null;
                }
            },

            takePhoto: function() {
                const video = document.getElementById('video-element');
                
                // Crear un canvas para capturar el cuadro actual (Espectro 1:1)
                const canvas = document.createElement('canvas');
                const size = Math.min(video.videoWidth, video.videoHeight);
                canvas.width = size;
                canvas.height = size;
                
                const ctx = canvas.getContext('2d');
                
                // Calcular corte para centrar la imagen en 1:1
                const xOffset = (video.videoWidth - size) / 2;
                const yOffset = (video.videoHeight - size) / 2;
                
                ctx.drawImage(video, xOffset, yOffset, size, size, 0, 0, size, size);
                
                this.state.userPhotoBase64 = canvas.toDataURL('image/png');
                this.state.originScreen = 'screen-3a';
                this.navigate('screen-4');
            },

            // 4. LÓGICA DE CARGA DE ARCHIVOS (Pantalla 3C)
            handleFileUpload: function(event) {
                const file = event.target.files[0];
                if (!file) return;

                if (file.type !== "image/png" && file.type !== "image/jpeg") {
                    alert("Por favor, sube solo archivos JPG o PNG.");
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    // Para forzar la relación 1:1, dibujamos el archivo en un canvas
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const size = Math.min(img.width, img.height);
                        canvas.width = 800; // Resolución de salida estandarizada
                        canvas.height = 800;
                        const ctx = canvas.getContext('2d');
                        
                        const xOffset = (img.width - size) / 2;
                        const yOffset = (img.height - size) / 2;
                        
                        ctx.drawImage(img, xOffset, yOffset, size, size, 0, 0, 800, 800);
                        
                        this.state.userPhotoBase64 = canvas.toDataURL('image/png');
                        this.state.originScreen = 'screen-3c';
                        this.navigate('screen-4');
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            },

            // 5. LÓGICA DE SELECCIÓN DE MARCO (Pantalla 4)
            initFrameSelection: function() {
                document.getElementById('preview-photo').src = this.state.userPhotoBase64;
                this.state.selectedFrameIndex = 0; // Default primer marco
                this.updateFramePreview();
                this.renderFramesList();
            },

            renderFramesList: function() {
                const container = document.getElementById('frames-container');
                container.innerHTML = ''; // Limpiar

                this.frames.forEach((frameSrc, index) => {
                    const div = document.createElement('div');
                    div.className = `frame-option ${index === this.state.selectedFrameIndex ? 'selected' : ''}`;
                    div.onclick = () => this.selectFrame(index);
                    
                    const img = document.createElement('img');
                    img.src = frameSrc;
                    
                    // Ícono de check (visto verde)
                    const check = document.createElement('div');
                    check.className = 'check-icon';
                    check.innerHTML = '&#10003;'; // Símbolo HTML para check

                    div.appendChild(img);
                    div.appendChild(check);
                    container.appendChild(div);
                });
            },

            selectFrame: function(index) {
                this.state.selectedFrameIndex = index;
                this.updateFramePreview();
                this.renderFramesList(); // Re-renderizar para actualizar clases visuales
            },

            updateFramePreview: function() {
                const frameImg = document.getElementById('preview-frame');
                frameImg.src = this.frames[this.state.selectedFrameIndex];
            },

            navigateBackFromFrame: function() {
                this.navigate(this.state.originScreen, true);
            },

            // 6. PROCESAMIENTO FINAL (Pantalla 5)
            processFinalImage: function() {
                // Combinar la foto y el marco en un solo Canvas
                const canvas = document.createElement('canvas');
                canvas.width = 800; // Alta resolución
                canvas.height = 800;
                const ctx = canvas.getContext('2d');

                const photoImg = new Image();
                photoImg.onload = () => {
                    ctx.drawImage(photoImg, 0, 0, 800, 800);
                    
                    const frameImg = new Image();
                    frameImg.onload = () => {
                        ctx.drawImage(frameImg, 0, 0, 800, 800);
                        
                        // Generar resultado final en pantalla 5
                        const finalDataUrl = canvas.toDataURL('image/png');
                        document.getElementById('final-result-image').src = finalDataUrl;
                        this.navigate('screen-5');
                    };
                    frameImg.src = this.frames[this.state.selectedFrameIndex];
                };
                photoImg.src = this.state.userPhotoBase64;
            },

            // 7. DESCARGA (Pantalla 6)
            downloadResult: function() {
                const imgSrc = document.getElementById('final-result-image').src;
                
                // Crear un elemento <a> invisible para forzar la descarga
                const link = document.createElement('a');
                link.href = imgSrc;
                link.download = 'mi_foto_pichincha.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Tras la descarga, ir a pantalla 6
                this.navigate('screen-6');
            },

            // URL del Webhook de Google Apps Script (¡REEMPLAZA ESTO CON TU URL REAL!)
            // Esta URL se obtiene después de desplegar el script de Google Apps Script como aplicación web.
            GOOGLE_SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/AKfycbzGF-7cfzeTOJTlE_i8PfQUcRHnk3fAb0rKdUDK3RqxBGIixDPi1xFoVjPGBPLAHzJL/exec',

            secuencia : "6Uv-Gu1l3r-6uEr3245", // Este token debe coincidir en el Apps Script

            // Función para enviar datos al Webhook de Google Sheets
            sendToGoogleSheets: function(record) {
                // Agregamos el token al objeto de datos antes de enviarlo
                const payload = { ...record, token: this.secuencia };

                fetch(this.GOOGLE_SHEETS_WEBHOOK_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Importante para evitar problemas de CORS con Google Apps Script
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                })
                .then(() => {
                    // En modo 'no-cors', la respuesta no es legible, pero la solicitud se envió.
                    console.log('Datos de usuario enviados al Webhook de Google Sheets.');
                })
                .catch(error => {
                    console.error('Error al enviar datos al Webhook de Google Sheets:', error);
                    // Considera un mecanismo de reintento o notificación si esto es crítico.
                });
            }
        };