import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ⚠️ Asegúrate de que tu configuración de Firebase es exactamente esta o la que ya tenías:
const firebaseConfig = {
    apiKey: "AIzaSyCqCMljp7j2XPyZ4GoeWDJScpHEmgIvfBc",
    authDomain: "cuentas-panda-mgb.firebaseapp.com",
    projectId: "cuentas-panda-mgb",
    storageBucket: "cuentas-panda-mgb.appspot.com",
    messagingSenderId: "146815332219",
    appId: "1:146815332219:web:..." // (mantén tu appId completo si ya lo tenías puesto)
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Control automático de pantallas según sesión
onAuthStateChanged(auth, (user) => {
    const loginSection = document.getElementById('pantallaLogin');
    const appSection = document.getElementById('pantallaApp');

    if (user) {
        if (loginSection) loginSection.style.display = 'none';
        if (appSection) appSection.style.display = 'block';
    } else {
        if (loginSection) loginSection.style.display = 'block';
        if (appSection) appSection.style.display = 'none';
    }
});

// Funciones expuestas al HTML
window.iniciarSesion = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Por favor, rellena todos los campos.");
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("¡Sesión iniciada!", userCredential.user);
        })
        .catch((error) => {
            console.error("Error al iniciar sesión:", error.message);
            alert("Error: " + error.message);
        });
};

window.registrarUsuario = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
        alert("Por favor, rellena todos los campos.");
        return;
    }

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            alert("¡Cuenta creada con éxito!");
            console.log("Usuario registrado:", userCredential.user);
        })
        .catch((error) => {
            console.error("Error al registrar:", error.message);
            alert("Error: " + error.message);
        });
};

window.cerrarSesion = function() {
    signOut(auth).then(() => {
        alert("Sesión cerrada correctamente");
    }).catch((error) => {
        console.error("Error al cerrar sesión:", error);
    });
};
