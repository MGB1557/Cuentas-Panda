// Importar los módulos necesarios de Firebase SDK modular
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuración de tu aplicación web de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCqCMLjp7j2XPyZ4GoeWDJScpHEmgIvFBc",
    authDomain: "cuentas-panda-mgb.firebaseapp.com",
    projectId: "cuentas-panda-mgb",
    storageBucket: "cuentas-panda-mgb.firebasestorage.app",
    messagingSenderId: "399635180894",
    appId: "1:399635180894:web:9be92a7e815a4b9a50b3cf"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Funciones de Autenticación
window.iniciarSesion = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Sesión iniciada con éxito:", userCredential.user);
            alert("¡Bienvenido a PandaZen Finanzas!");
        })
        .catch((error) => {
            console.error("Error al iniciar sesión:", error.message);
            alert("Error: " + error.message);
        });
}

window.registrarUsuario = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            console.log("Usuario registrado con éxito:", userCredential.user);
            alert("¡Cuenta creada con éxito!");
        })
        .catch((error) => {
            console.error("Error al registrar:", error.message);
            alert("Error: " + error.message);
        });
}
