import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signOut 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    onSnapshot, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCqCMljp7j2XPyZ4GoeWDJScpHEmgIvfBc",
    authDomain: "cuentas-panda-mgb.firebaseapp.com",
    projectId: "cuentas-panda-mgb",
    storageBucket: "cuentas-panda-mgb.appspot.com",
    messagingSenderId: "146815332219",
    appId: "1:146815332219:web:..." 
};

// Inicializar Firebase y Firestore
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let usuarioActual = null;

// --- 1. CONTROL AUTOMÁTICO DE VISIBILIDAD DE PANTALLAS ---
onAuthStateChanged(auth, (user) => {
    const loginSection = document.getElementById('pantallaLogin');
    const appSection = document.getElementById('pantallaApp');

    if (user) {
        usuarioActual = user;
        if (loginSection) loginSection.style.display = 'none';
        if (appSection) appSection.style.display = 'block';
        console.log("Usuario dentro de la sesión:", user.email);
        
        // Cargar los movimientos de este usuario en tiempo real
        cargarMovimientos(user.uid);
    } else {
        usuarioActual = null;
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
        .then(() => {
            alert("¡Cuenta creada con éxito!");
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

// --- 3. GESTIÓN DE MOVIMIENTOS EN FIRESTORE ---
function cargarMovimientos(uid) {
    const q = query(collection(db, "movimientos"), where("uid", "==", uid));
    
    onSnapshot(q, (snapshot) => {
        let totalIngresos = 0;
        let totalGastos = 0;
        const listaMovimientosHTML = document.getElementById('listaMovimientos');
        
        if (listaMovimientosHTML) {
            listaMovimientosHTML.innerHTML = '';
        }

        snapshot.forEach((docSnap) => {
            const mov = docSnap.data();
            const id = docSnap.id;
            const montoNum = parseFloat(mov.monto);

            if (mov.tipo === 'ingreso') {
                totalIngresos += montoNum;
            } else {
                totalGastos += montoNum;
            }

            // Pintar en pantalla si existe el contenedor
            if (listaMovimientosHTML) {
                const div = document.createElement('div');
                div.className = `movimiento-item ${mov.tipo}`;
                div.innerHTML = `
                    <span><strong>${mov.concepto}</strong> (${mov.categoria || 'General'})</span>
                    <span>${mov.tipo === 'ingreso' ? '+' : '-'}${montoNum.toFixed(2)} €</span>
                    <button onclick="borrarMovimiento('${id}')" style="background:none; border:none; cursor:pointer;" title="Borrar">❌</button>
                `;
                listaMovimientosHTML.appendChild(div);
            }
        });

        const balanceTotal = totalIngresos - totalGastos;

        // Actualizar tarjetas en el HTML de forma segura
        const elIngresos = document.getElementById('totalIngresos');
        const elGastos = document.getElementById('totalGastos');
        const elBalance = document.getElementById('totalBalance');

        if (elIngresos) elIngresos.innerText = `+${totalIngresos.toFixed(2)} €`;
        if (elGastos) elGastos.innerText = `-${totalGastos.toFixed(2)} €`;
        if (elBalance) elBalance.innerText = `${balanceTotal.toFixed(2)} €`;
    });
}

window.borrarMovimiento = async function(id) {
    try {
        await deleteDoc(doc(db, "movimientos", id));
    } catch (e) {
        console.error("Error al borrar movimiento:", e);
    }
};

// --- 4. INTERACCIONES DE LA INTERFAZ (Manual, Modo Oscuro y Formulario) ---
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
        formMovimiento.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (!usuarioActual) {
                alert("Debes iniciar sesión para guardar movimientos.");
                return;
            }

            const concepto = document.getElementById('concepto').value;
            const monto = document.getElementById('monto').value;
            const categoriaSelect = document.getElementById('categoria');
            const tipoSelect = document.getElementById('tipo');

            const categoria = categoriaSelect ? categoriaSelect.value : 'General';
            const tipo = tipoSelect ? tipoSelect.value : 'gasto';

            try {
                await addDoc(collection(db, "movimientos"), {
                    uid: usuarioActual.uid,
                    concepto: concepto,
                    monto: parseFloat(monto),
                    categoria: categoria,
                    tipo: tipo,
                    fecha: new Date()
                });

                formMovimiento.reset();
                console.log("Movimiento guardado con éxito en Firestore");
            } catch (error) {
                console.error("Error al guardar en Firestore:", error);
                alert("Hubo un error al guardar el movimiento: " + error.message);
            }
        });
    }
});
