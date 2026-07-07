// cambio de color en inputs interactuando con Tailwind v4
const inputs = document.querySelectorAll('#screen-1 input');
const btnCerrar = document.querySelector('.cerrar');
const body = document.body;

inputs.forEach(input => {
    input.addEventListener('focus', () => {
        // Añade clases de fondo, outline y sombra de Tailwind v4
        const parent = input.closest('.relative');
        parent.classList.add('!bg-white', 'outline-2', 'outline-brand-a-primary', 'shadow-md');
    });
    input.addEventListener('blur', () => {
        const parent = input.closest('.relative');
        parent.classList.remove('!bg-white', 'outline-2', 'outline-brand-a-primary', 'shadow-md');
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
        originScreen: 'screen-2', 
        stream: null 
    },

    // CONFIGURACIÓN DE MARCOS
    frames: [
        "src/imgs/marco_1.png",
        "src/imgs/marco_2.png",
        "src/imgs/marco_3.png"
    ],
    
    // 1. NAVEGACIÓN Y RUTEO BÁSICO
    navigate: function(targetScreenId, isBack = null) {
        const currentScreen = document.querySelector('.screen.active');
        const nextScreen = document.getElementById(targetScreenId);

        if (!nextScreen || currentScreen === nextScreen) return;

        let back = isBack;
        if (back === null && window.event) {
            const trigger = window.event.target.closest('.btn');
            back = trigger ? trigger.classList.contains('btn-secondary') : false;
        }
        if (back === null) back = false;

        if (targetScreenId !== 'screen-3a') this.stopCamera();

        if (currentScreen && currentScreen.id === 'screen-2') {
            back = false;
        }

        // Transiciones mapeadas a las animaciones del @theme de Tailwind v4
        const exitClass = back ? 'animate-slide-out-right' : 'animate-slide-out-left';
        const enterClass = back ? 'animate-slide-in-left' : 'animate-slide-in-right';

        if (currentScreen) {
            currentScreen.classList.add(exitClass);
            nextScreen.classList.add('active', enterClass);

            setTimeout(() => {
                currentScreen.classList.remove('active', exitClass);
                nextScreen.classList.remove(enterClass);
            }, 500);
        } else {
            nextScreen.classList.add('active');
        }

        // Lógica de visualización del Header con clases funcionales
        const header = document.getElementById('main-header');
        const body = document.body;
        if (targetScreenId === 'screen-1' || targetScreenId === 'screen-6') {
            header.style.display = 'none';
            body.style.padding = '0 4%'; 
        } else {
            header.style.display = 'flex';
            body.style.padding = '0'; 
        }

        if (targetScreenId === 'screen-3a') {
            this.startCamera();
        }
        if (targetScreenId === 'screen-4') {
            this.initFrameSelection();
        }
        if (targetScreenId === 'screen-1') {
            document.getElementById('email').value = '';
        }
    },

    // 2. LÓGICA DE LOGIN
    handleLogin: function() {
                const emailInput = document.getElementById('email').value.trim();
                const errEmail = document.getElementById('error-email');

                errEmail.style.display = 'none';

                let isValid = true;

                // Expresión regular estándar para validar la estructura de un correo electrónico
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailInput || !emailRegex.test(emailInput)) {
                    errEmail.style.display = 'block';
                    isValid = false;
                }

                if (isValid) {
                    this.navigate('screen-2', false);
                }
            },

    // 3. LÓGICA DE CÁMARA (Pantalla 3A)
    startCamera: async function() {
        const video = document.getElementById('video-element');
        try {
            this.state.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' } 
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
        const canvas = document.createElement('canvas');
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
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
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const size = Math.min(img.width, img.height);
                canvas.width = 800; 
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
        this.state.selectedFrameIndex = 0; 
        this.updateFramePreview();
        this.renderFramesList();
    },

    renderFramesList: function() {
        const container = document.getElementById('frames-container');
        container.innerHTML = ''; 

        this.frames.forEach((frameSrc, index) => {
            const isSelected = index === this.state.selectedFrameIndex;
            const div = document.createElement('div');
            
            // Inyección de clases de Tailwind v4 adaptadas dinámicamente
            div.className = `flex-1 aspect-square border-2 rounded-lg cursor-pointer relative bg-[#f2f2f2] transition-all duration-300 overflow-hidden ${
                isSelected ? 'border-brand-b-primary bg-[#e6f8f1] opacity-80 shadow-[0_4px_10px_rgba(4,63,151,0.3)]' : 'border-transparent'
            }`;
            div.onclick = () => this.selectFrame(index);
            
            const img = document.createElement('img');
            img.src = frameSrc;
            img.className = "w-full h-full object-contain";
            
            const check = document.createElement('div');
            // Gestión visual del check icon adaptado con utilidades v4
            check.className = `absolute top-1 right-1 w-6 h-6 bg-[#10b981] text-white rounded-full flex items-center justify-center text-xs z-10 ${
                isSelected ? 'flex' : 'hidden'
            }`;
            check.innerHTML = '&#10003;'; 

            div.appendChild(img);
            div.appendChild(check);
            container.appendChild(div);
        });
    },

    selectFrame: function(index) {
        this.state.selectedFrameIndex = index;
        this.updateFramePreview();
        this.renderFramesList(); 
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
        const canvas = document.createElement('canvas');
        canvas.width = 800; 
        canvas.height = 800;
        const ctx = canvas.getContext('2d');

        const photoImg = new Image();
        photoImg.onload = () => {
            ctx.drawImage(photoImg, 0, 0, 800, 800);
            
            const frameImg = new Image();
            frameImg.onload = () => {
                ctx.drawImage(frameImg, 0, 0, 800, 800);
                
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
        
        const link = document.createElement('a');
        link.href = imgSrc;
        link.download = 'mi_foto_pichincha.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.navigate('screen-6');
    }
};