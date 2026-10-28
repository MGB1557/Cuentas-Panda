import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCqCMljp7j2XPyZ4GoeWDJScpHEmgIvfBc",
    authDomain: "cuentas-panda-mgb.firebaseapp.com",
    projectId: "cuentas-panda-mgb",
    storageBucket: "cuentas-panda-mgb.appspot.com",
    messagingSenderId: "146815332219",
    appId: "1:146815332219:web:..." 
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- 1. CONTROL AUTOMÁTICO DE VISIBILIDAD DE PANTALLAS ---
onAuthStateChanged(auth, (user) => {
    const loginSection = document.getElementById('pantallaLogin');
    const appSection = document.getElementById('pantallaApp');

    if (user) {
        if (loginSection) loginSection.style.display = 'none';
        if (appSection) appSection.style.display = 'block';
        console.log("Usuario dentro de la sesión:", user.email);
    } else {
        if (loginSection) loginSection.style.display = 'block';
        if (appSection) appSection.style.display = 'none';
        console.log("Sesión no iniciada");
    }
});

// --- 2. FUNCIONES DE AUTENTICACIÓN (Expuestas al HTML) ---
window.iniciarSesion = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Por favor, introduce tu correo y contraseña.");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("¡Sesión iniciada con éxito!", userCredential.user);
        })
        .catch((error) => {
            console.error("Error al iniciar sesión:", error.message);
            alert("Error al iniciar sesión: " + error.message);
        });
};

window.registrarUsuario = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Por favor, introduce un correo y contraseña para registrarte.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("¡Cuenta creada con éxito!");
            console.log("Usuario registrado:", userCredential.user);
        })
        .catch((error) => {
            console.error("Error al registrar usuario:", error.message);
            alert("Error al registrar: " + error.message);
        });
};

window.cerrarSesion = function() {
    signOut(auth).then(() => {
        alert("Sesión cerrada correctamente");
    }).catch((error) => {
        console.error("Error al cerrar sesión:", error);
    });
};

// --- 3. INTERACCIONES DE LA INTERFAZ (Manual, Modo Oscuro y Formulario) ---
document.addEventListener("DOMContentLoaded", () => {
    
    // --- MANUAL DE USO ---
    const btnAbrirManual = document.getElementById('btnAbrirManual');
    const btnCerrarManual = document.getElementById('btnCerrarManual');
    const modalManual = document.getElementById('modalManual');

    if (btnAbrirManual && modalManual) {
        btnAbrirManual.addEventListener('click', () => {
            modalManual.classList.remove('hidden');
            modalManual.style.display = 'flex';
        });
    }

    if (btnCerrarManual && modalManual) {
        btnCerrarManual.addEventListener('click', () => {
            modalManual.classList.add('hidden');
            modalManual.style.display = 'none';
        });
    }

    // --- MODO OSCURO (Luna) ---
    const btnToggleDarkMode = document.getElementById('btnToggleDarkMode');
    const btnToggleDarkModeModal = document.getElementById('btnToggleDarkModeModal');

    const alternarModoOscuro = () => {
        document.body.classList.toggle('dark-mode');
    };

    if (btnToggleDarkMode) btnToggleDarkMode.addEventListener('click', alternarModoOscuro);
    if (btnToggleDarkModeModal) btnToggleDarkModeModal.addEventListener('click', alternarModoOscuro);

    // --- FORMULARIO DE MOVIMIENTOS ---
    const formMovimiento = document.getElementById('formMovimiento');
    if (formMovimiento) {
        formMovimiento.addEventListener('submit', (e) => {
            e.preventDefault();
            const concepto = document.getElementById('concepto').value;
            const monto = document.getElementById('monto').value;
            
            console.log("Nuevo movimiento:", concepto, monto);
            alert(`Movimiento guardado: ${concepto} (${monto}€)`);
            formMovimiento.reset();
        });
    }
});
