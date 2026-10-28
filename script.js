// 1. Configuración e inicialización única de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCqCMLjp7j2XPyZ4GoeWDJScpHEmgIvFBc",
    authDomain: "cuentas-panda-mgb.firebaseapp.com",
    projectId: "cuentas-panda-mgb",
    storageBucket: "cuentas-panda-mgb.firebasestorage.app",
    messagingSenderId: "399635180894",
    appId: "1:399635180894:web:9be92a7e815a4b9a50b3cf"
};

// Comprobamos si ya hay una app inicializada para evitar errores
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 2. Funciones de Autenticación
function iniciarSesion() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Sesión iniciada con éxito:", userCredential.user);
            alert("¡Bienvenido a PandaZen Finanzas!");
        })
        .catch((error) => {
            console.error("Error al iniciar sesión:", error.message);
            alert("Error: " + error.message);
        });
}

function registrarUsuario() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log("Usuario registrado con éxito:", userCredential.user);
            alert("¡Cuenta creada con éxito!");
        })
        .catch((error) => {
            console.error("Error al registrar:", error.message);
            alert("Error: " + error.message);
        });
}
