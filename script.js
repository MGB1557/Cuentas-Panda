import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Escuchar cambios de estado de sesión (se ejecuta automáticamente al cargar o iniciar sesión)
onAuthStateChanged(auth, (user) => {
    const loginSection = document.getElementById('login-section') || document.getElementById('login-box');
    const appSection = document.getElementById('app-section') || document.getElementById('app-box');

    if (user) {
        // Usuario logueado: Oculta Login, muestra App
        if (loginSection) loginSection.style.display = 'none';
        if (appSection) appSection.style.display = 'block';
        console.log("Usuario dentro de la app:", user.email);
    } else {
        // Sin sesión: Muestra Login, oculta App
        if (loginSection) loginSection.style.display = 'block';
        if (appSection) appSection.style.display = 'none';
        console.log("No hay usuario autenticado");
    }
});

// Función para Cerrar Sesión
window.cerrarSesion = function() {
    signOut(auth).then(() => {
        alert("Sesión cerrada");
    }).catch((error) => {
        console.error("Error al salir:", error);
    });
};
