import { 
    getAuth,
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Asegurar que auth está inicializado (necesitas tener tu app de firebase configurada antes)
// const auth = getAuth(app); -> (Asegúrate de que 'auth' está declarado aquí arriba)

// EXPORTAR FUNCIONES AL HTML (Soluciona el error ReferenceError)
window.iniciarSesion = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Por favor, rellena todos los campos.");
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
        alert("Por favor, rellena todos los campos para registrarte.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("¡Cuenta creada con éxito!");
            console.log("Usuario registrado:", userCredential.user);
        })
        .catch((error) => {
            console.error("Error al registrar:", error.message);
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
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// --- CONTROL AUTOMÁTICO DE PANTALLAS ---
onAuthStateChanged(auth, (user) => {
    // Busca los contenedores por los nombres más comunes (puedes ajustar el ID en tu HTML si usas otro)
    const loginSection = document.getElementById('login-section') || document.getElementById('login-box') || document.getElementById('seccionLogin');
    const appSection = document.getElementById('app-section') || document.getElementById('app-box') || document.getElementById('pantallaPrincipal');

    if (user) {
        // Usuario logueado: Oculta la entrada, muestra la app
        if (loginSection) loginSection.style.display = 'none';
        if (appSection) appSection.style.display = 'block';
    } else {
        // Sin sesión: Muestra la entrada, oculta la app
        if (loginSection) loginSection.style.display = 'block';
        if (appSection) appSection.style.display = 'none';
    }
});

// --- FUNCIÓN DE INICIO DE SESIÓN ---
window.iniciarSesion = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Por favor, rellena todos los campos.");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("¡Sesión iniciada con éxito!", userCredential.user);
            // El cambio de pantalla lo hace automáticamente el onAuthStateChanged de arriba
        })
        .catch((error) => {
            console.error("Error al iniciar sesión:", error.message);
            alert("Error al iniciar sesión: " + error.message);
        });
};

// --- FUNCIÓN DE REGISTRO ---
window.registrarUsuario = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Por favor, rellena todos los campos para registrarte.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("¡Cuenta creada con éxito!");
            console.log("Usuario registrado:", userCredential.user);
            // El cambio de pantalla lo hace automáticamente el onAuthStateChanged de arriba
        })
        .catch((error) => {
            console.error("Error al registrar:", error.message);
            alert("Error al registrar: " + error.message);
        });
};

// --- FUNCIÓN PARA CERRAR SESIÓN ---
window.cerrarSesion = function() {
    signOut(auth).then(() => {
        alert("Sesión cerrada correctamente");
    }).catch((error) => {
        console.error("Error al cerrar sesión:", error);
    });
};
