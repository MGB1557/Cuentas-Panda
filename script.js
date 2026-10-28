// ==========================================
// 1. CONFIGURACIÓN DE FIREBASE (¡Pon tus claves aquí!)
// ==========================================
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Variables globales
let usuarioActualId = null;

// ==========================================
// 2. CONTROL DE SESIÓN (LOGIN / REGISTRO)
// ==========================================

// Registrar nuevo usuario
function registrarUsuario() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      alert("¡Cuenta creada con éxito! Bienvenido.");
    })
    .catch((error) => {
      alert("Error al registrarse: " + error.message);
    });
}

// Iniciar sesión
function iniciarSesion() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Éxito al entrar
    })
    .catch((error) => {
      alert("Error al entrar: " + error.message);
    });
}

// Cerrar sesión
function cerrarSesion() {
  auth.signOut().then(() => {
    alert("Sesión cerrada.");
  });
}

// Vigilar si el usuario está conectado o no
auth.onAuthStateChanged((user) => {
  const pantallaLogin = document.getElementById("pantallaLogin");
  const pantallaApp = document.getElementById("pantallaApp");

  if (user) {
    // ¡Usuario conectado! Ocultamos login y mostramos la app
    usuarioActualId = user.uid;
    if (pantallaLogin) pantallaLogin.style.display = "none";
    if (pantallaApp) pantallaApp.style.display = "block";

    // Cargamos los datos de ESTE usuario desde Firebase
    cargarMovimientos();
  } else {
    // Nadie ha iniciado sesión. Mostramos el login y ocultamos la app
    usuarioActualId = null;
    if (pantallaLogin) pantallaLogin.style.display = "flex";
    if (pantallaApp) pantallaApp.style.display = "none";
  }
});

// ==========================================
// 3. ICONOS Y MENSAJES DEL PANDA
// ==========================================

const iconosCategorias = {
    comida: '🍔',
    vivienda: '🏠',
    servicios: '⚡',
    transporte: '🚗',
    ocio: '🎉',
    nomina: '💼'
};

function actualizarMensajePanda(balanceTotal) {
    const elMensaje = document.getElementById('mensajePanda');
    if (!elMensaje) return;

    if (balanceTotal > 500) {
        elMensaje.textContent = "¡Menuda salud financiera! Vamos viento en popa. 🚀";
    } else if (balanceTotal >= 0) {
        elMensaje.textContent = "Todo bajo control. Sigue administrando bien tus gastos. 👍";
    } else {
        elMensaje.textContent = "¡Cuidado! Estamos en números rojos este mes. ⚠️";
    }
}

// ==========================================
// 4. GESTIÓN DE MOVIMIENTOS EN LA NUBE (FIREBASE)
// ==========================================

// Control del formulario para guardar nuevos movimientos en Firestore
const formMovimiento = document.getElementById('formMovimiento');
if (formMovimiento) {
    formMovimiento.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!usuarioActualId) {
            alert("Debes iniciar sesión para guardar movimientos.");
            return;
        }

        const concepto = document.getElementById('concepto').value;
        const monto = parseFloat(document.getElementById('monto').value);
        const categoria = document.getElementById('categoria').value;
        const tipo = document.getElementById('tipo').value;

        // Si es gasto se guarda como negativo
        const cantidadFinal = tipo === 'gasto' ? -Math.abs(monto) : Math.abs(monto);

        // Guardamos directamente en la base de datos de Firebase vinculada al usuario
        db.collection("movimientos").add({
            usuarioId: usuarioActualId, // <-- Clave para aislar los datos por usuario
            concepto: concepto,
            monto: cantidadFinal,
            categoria: categoria,
            tipo: tipo,
            fecha: new Date().toLocaleDateString(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            formMovimiento.reset();
        })
        .catch((error) => {
            console.error("Error al guardar en la nube: ", error);
        });
    });
}

// Función para eliminar un movimiento de Firebase por su ID de documento
function eliminarMovimiento(id) {
    const confirmar = confirm("¿Seguro que quieres eliminar este movimiento?");
    if (!confirmar) return;

    db.collection("movimientos").doc(id).delete()
        .then(() => {
            console.log("Movimiento eliminado de la nube");
        })
        .catch((error) => {
            console.error("Error al eliminar: ", error);
        });
}

// Cargar en tiempo real los movimientos de Firebase del usuario actual
function cargarMovimientos() {
    if (!usuarioActualId) return;

    db.collection("movimientos")
        .where("usuarioId", "==", usuarioActualId) // Solo los del usuario conectado
        .onSnapshot((querySnapshot) => {
            const movimientos = [];
            querySnapshot.forEach((doc) => {
                movimientos.push({ id: doc.id, ...doc.data() });
            });

            // Actualizamos la pantalla con los datos de Firebase
            actualizarPantallaFinanzas(movimientos);
        });
}

// Función principal para renderizar el historial y los contadores
function actualizarPantallaFinanzas(movimientos = []) {
    const listaMovimientos = document.getElementById('listaMovimientos');
    const totalBalanceEl = document.getElementById('totalBalance');
    const totalIngresosEl = document.getElementById('totalIngresos');
    const totalGastosEl = document.getElementById('totalGastos');

    let balance = 0;
    let ingresos = 0;
    let gastos = 0;

    if (movimientos.length === 0) {
        if (listaMovimientos) {
            listaMovimientos.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">No hay movimientos todavía. ¡Añade el primero arriba! 📝</p>`;
        }
    } else {
        let html = '';
        // Ordenar por fecha o mostrar directamente
        movimientos.forEach(mov => {
            if (mov.monto > 0) {
                ingresos += mov.monto;
            } else {
                gastos += Math.abs(mov.monto);
            }
            balance += mov.monto;

            const icono = iconosCategorias[mov.categoria] || '📌';
            const claseTipo = mov.monto >= 0 ? 'ingreso' : 'gasto';
            const signoFormato = mov.monto >= 0 ? '+' : '';

            html += `
                <div class="item-movimiento ${claseTipo}" style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                    <div class="item-detalles" style="display: flex; align-items: center; gap: 10px;">
                        <span style="font-size: 1.5rem;">${icono}</span>
                        <div>
                            <strong>${mov.concepto}</strong>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${mov.fecha || ''}</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div class="item-monto" style="color: ${mov.monto >= 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">
                            ${signoFormato}${mov.monto.toFixed(2)} €
                        </div>
                        <button onclick="eliminarMovimiento('${mov.id}')" title="Eliminar movimiento" style="background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px;" class="btn-borrar">🗑️</button>
                    </div>
                </div>
            `;
        });

        if (listaMovimientos) {
            listaMovimientos.innerHTML = html;
        }
    }

    // Actualizar contadores
    if (totalBalanceEl) totalBalanceEl.textContent = `${balance.toFixed(2)} €`;
    if (totalIngresosEl) totalIngresosEl.textContent = `+${ingresos.toFixed(2)} €`;
    if (totalGastosEl) totalGastosEl.textContent = `-${gastos.toFixed(2)} €`;

    // Mensaje dinámico del Panda
    actualizarMensajePanda(balance);
}

// --- GESTIÓN DEL MODO OSCURO ---
const btnToggleDarkMode = document.getElementById('btnToggleDarkMode');
const btnToggleDarkModeModal = document.getElementById('btnToggleDarkModeModal');

function aplicarModoOscuro(esOscuro) {
    if (esOscuro) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    const icono = esOscuro ? '☀️' : '🌙';
    if (btnToggleDarkMode) btnToggleDarkMode.textContent = icono;
    if (btnToggleDarkModeModal) btnToggleDarkModeModal.textContent = icono;
    localStorage.setItem('modoOscuroFinanzas', esOscuro);
}

const estadoGuardadoOscuro = localStorage.getItem('modoOscuroFinanzas') === 'true';
aplicarModoOscuro(estadoGuardadoOscuro);

if (btnToggleDarkMode) {
    btnToggleDarkMode.addEventListener('click', () => {
        const estadoActual = document.body.classList.contains('dark-mode');
        aplicarModoOscuro(!estadoActual);
    });
}

if (btnToggleDarkModeModal) {
    btnToggleDarkModeModal.addEventListener('click', () => {
        const estadoActual = document.body.classList.contains('dark-mode');
        aplicarModoOscuro(!estadoActual);
    });
}

// --- LÓGICA DE APERTURA / CIERRE DEL MANUAL DE USO ---
const btnAbrirManual = document.getElementById('btnAbrirManual');
const btnCerrarManual = document.getElementById('btnCerrarManual');
const modalManual = document.getElementById('modalManual');

if (btnAbrirManual && btnCerrarManual && modalManual) {
    btnAbrirManual.addEventListener('click', () => {
        modalManual.classList.remove('hidden');
    });

    btnCerrarManual.addEventListener('click', () => {
        modalManual.classList.add('hidden');
    });

    window.addEventListener('click', (e) => {
        if (e.target === modalManual) {
            modalManual.classList.add('hidden');
        }
    });
}

// --- BORRAR TODOS LOS DATOS DEL USUARIO EN LA NUBE ---
const btnBorrarTodo = document.getElementById('btnBorrarTodo');

if (btnBorrarTodo) {
    btnBorrarTodo.addEventListener('click', async () => {
        const confirmar = confirm("⚠️ ¿Estás seguro de que quieres borrar TODOS tus movimientos de la nube? Esta acción no se puede deshacer.");
        
        if (confirmar && usuarioActualId) {
            try {
                const snapshot = await db.collection("movimientos").where("usuarioId", "==", usuarioActualId).get();
                const batch = db.batch();
                snapshot.docs.forEach((doc) => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
                alert("¡Todos tus datos han sido borrados de la nube!");
            } catch (error) {
                console.error("Error al borrar todo: ", error);
            }
        }
    });
}