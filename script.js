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
let movimientosGlobales = []; // Array global para guardar los datos y usarlos en los filtros

// Mapa de nombres e iconos de categorías
const nombresCategorias = {
    comida: "🍔 Comida / Supermercado",
    vivienda: "🏠 Alquiler / Casa",
    servicios: "⚡ Luz / Agua / Gas",
    transporte: "🚗 Transporte / Gasolina",
    ocio: "🎉 Ocio / Varios",
    nomina: "💼 Nómina / Ingreso"
};

// --- CAMBIO DE PESTAÑAS (NAVEGACIÓN SUPERIOR) ---
window.cambiarPestana = function(idPestana, boton) {
    // Ocultar todas las pestañas
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('active');
    });

    // Mostrar la pestaña elegida
    const pestañaActiva = document.getElementById(idPestana);
    if (pestañaActiva) {
        pestañaActiva.classList.remove('hidden');
        pestañaActiva.classList.add('active');
    }

    // Quitar estilo activo de los botones del menú
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Activar el botón pulsado
    if (boton) {
        boton.classList.add('active');
    }

    // Si cambian a la pestaña de desglose, renderizamos con los filtros actuales
    if (idPestana === 'tabDesglose') {
        window.renderizarDesglose();
    }
    
};

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

// --- 2. FUNCIONES DE AUTENTICACIÓN EXuestas a window ---
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

// --- 3. GESTIÓN DE MOVIMIENTOS Y CARGA DESDE FIRESTORE ---
function cargarMovimientos(uid) {
    const q = query(collection(db, "movimientos"), where("uid", "==", uid));
    
    onSnapshot(q, (snapshot) => {
        let totalIngresos = 0;
        let totalGastos = 0;
        
        movimientosGlobales = []; // Limpiamos y rellenamos el array global

        const listaMovimientosHTML = document.getElementById('listaMovimientos');
        const listaMovimientosHistorialHTML = document.getElementById('listaMovimientosHistorial');

        if (listaMovimientosHTML) listaMovimientosHTML.innerHTML = '';
        if (listaMovimientosHistorialHTML) listaMovimientosHistorialHTML.innerHTML = '';

        snapshot.forEach((docSnap) => {
            const mov = docSnap.data();
            const id = docSnap.id;
            const montoNum = parseFloat(mov.monto) || 0;

            // Guardamos con su ID en el array global
            movimientosGlobales.push({ id, ...mov });

            if (mov.tipo === 'ingreso') {
                totalIngresos += montoNum;
            } else {
                totalGastos += montoNum;
            }

            // Pintar en el Historial / Últimos movimientos
            const nombreCat = nombresCategorias[mov.categoria] || mov.categoria || 'General';
            const itemHtml = `
                <div class="movimiento-item ${mov.tipo}" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-radius: 8px; background: rgba(0, 0, 0, 0.02); margin-bottom: 8px;">
                    <span><strong>${mov.concepto}</strong> <br><small style="opacity:0.7">${nombreCat}</small></span>
                    <span style="color: ${mov.tipo === 'ingreso' ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">
                        ${mov.tipo === 'ingreso' ? '+' : '-'}${montoNum.toFixed(2)} €
                    </span>
                    <button onclick="borrarMovimiento('${id}')" style="background:none; border:none; cursor:pointer;" title="Borrar">❌</button>
                </div>
            `;

            if (listaMovimientosHTML) listaMovimientosHTML.appendChild(createNodeFromHtml(itemHtml));
            if (listaMovimientosHistorialHTML) listaMovimientosHistorialHTML.appendChild(createNodeFromHtml(itemHtml));
        });

        // Actualizar tarjetas de resumen principal
        const balanceTotal = totalIngresos - totalGastos;
        const elIngresos = document.getElementById('totalIngresos');
        const elGastos = document.getElementById('totalGastos');
        const elBalance = document.getElementById('totalBalance');

        if (elIngresos) elIngresos.innerText = `+${totalIngresos.toFixed(2)} €`;
        if (elGastos) elGastos.innerText = `-${totalGastos.toFixed(2)} €`;
        if (elBalance) elBalance.innerText = `${balanceTotal.toFixed(2)} €`;

        // Actualizar la pestaña de Desglose automáticamente al recibir datos
        window.renderizarDesglose();
    });
}

// Función auxiliar para convertir HTML en nodo DOM
function createNodeFromHtml(htmlString) {
    const div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

// --- 4. FUNCIÓN DE DESGLOSE POR MES/AÑO Y ACUMULADO HISTÓRICO ---
let miGrafico = null; // Variable global para la gráfica

window.renderizarDesglose = function() {
    const selectMes = document.getElementById('filtroMesDesglose');
    const selectAnio = document.getElementById('filtroAnioDesglose');
    const listaContenedor = document.getElementById('listaDesglose');
    const totalPeriodoElemento = document.getElementById('montoTotalPeriodo');

    if (!listaContenedor) return;

    const mesSeleccionado = selectMes ? selectMes.value : 'todos';
    const anioSeleccionado = selectAnio ? parseInt(selectAnio.value) : new Date().getFullYear();

    const acumuladoPeriodo = {};
    const acumuladoHistorico = {};
    let granTotalPeriodo = 0;

    // Inicializar categorías de gastos a 0
    Object.keys(nombresCategorias).forEach(cat => {
        if (cat !== 'nomina') {
            acumuladoPeriodo[cat] = 0;
            acumuladoHistorico[cat] = 0;
        }
    });

    // Recorrer los movimientos globales
    if (Array.isArray(movimientosGlobales)) {
        movimientosGlobales.forEach(mov => {
            if (mov.tipo === 'gasto') {
                const cat = mov.categoria || 'ocio';
                const monto = parseFloat(mov.monto) || 0;

                // 1. Sumar al Acumulado Histórico
                if (acumuladoHistorico[cat] !== undefined) {
                    acumuladoHistorico[cat] += monto;
                } else {
                    acumuladoHistorico[cat] = monto;
                }

                // 2. Extraer fecha correctamente de Firestore o Date
                let fechaMov = null;
                if (mov.fecha && typeof mov.fecha.toDate === 'function') {
                    fechaMov = mov.fecha.toDate();
                } else if (mov.fecha && mov.fecha.seconds) {
                    fechaMov = new Date(mov.fecha.seconds * 1000);
                } else if (mov.fecha) {
                    fechaMov = new Date(mov.fecha);
                }

                if (fechaMov && !isNaN(fechaMov.getTime())) {
                    const mesMov = fechaMov.getMonth().toString(); // "0" a "11"
                    const anioMov = fechaMov.getFullYear();

                    const coincideAnio = (anioMov === anioSeleccionado);
                    const coincideMes = (mesSeleccionado === 'todos' || mesMov === mesSeleccionado);

                    if (coincideAnio && coincideMes) {
                        if (acumuladoPeriodo[cat] !== undefined) {
                            acumuladoPeriodo[cat] += monto;
                        } else {
                            acumuladoPeriodo[cat] = monto;
                        }
                        granTotalPeriodo += monto;
                    }
                }
            }
        });
    }

    // Actualizar total mostrado
    if (totalPeriodoElemento) {
        totalPeriodoElemento.textContent = `-${granTotalPeriodo.toFixed(2)} €`;
    }

    // Renderizar tarjetas e ir preparando arrays para Chart.js
    listaContenedor.innerHTML = '';
    const categoriasGastos = Object.keys(nombresCategorias).filter(c => c !== 'nomina');
    
    const etiquetasGrafico = [];
    const valoresGrafico = [];

    categoriasGastos.forEach(cat => {
        const gastoPeriodo = acumuladoPeriodo[cat] || 0;
        const gastoHistorico = acumuladoHistorico[cat] || 0;

        // Añadir solo categorías a la gráfica
        etiquetasGrafico.push(nombresCategorias[cat].replace(/^[^\w\s]+/, '').trim());
        valoresGrafico.push(gastoPeriodo);

        const cardHtml = `
            <div class="categoria-card" style="background: var(--card-bg); border: 1px solid rgba(0,0,0,0.06); border-radius: 12px; padding: 15px; margin-bottom: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.03);">
                <div class="categoria-info-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span class="categoria-nombre" style="font-weight: bold; font-size: 1rem;">${nombresCategorias[cat]}</span>
                    <span class="monto-periodo" style="font-size: 1.1rem; font-weight: 700; color: var(--danger);">-${gastoPeriodo.toFixed(2)} €</span>
                </div>
                <div class="monto-historico-label" style="font-size: 0.8rem; color: #7f8c8d; display: flex; justify-content: space-between; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #ccc;">
                    <span>Acumulado Histórico Total:</span>
                    <strong style="color: var(--text-light);">-${gastoHistorico.toFixed(2)} €</strong>
                </div>
            </div>
        `;
        listaContenedor.appendChild(createNodeFromHtml(cardHtml));
    });

    // --- DIBUJAR O ACTUALIZAR GRÁFICA DE CHART.JS ---
    const ctx = document.getElementById('graficoGastos');
    if (ctx) {
        if (typeof Chart === 'undefined') {
            console.error("Chart.js no está cargado correctamente en el HTML.");
            return;
        }

        if (miGrafico) {
            miGrafico.destroy(); // Destruir instancia anterior
        }

        miGrafico = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: etiquetasGrafico,
                datasets: [{
                    label: 'Gastos (€)',
                    data: valoresGrafico,
                    backgroundColor: [
                        '#e74c3c', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6'
                    ],
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return value + ' €'; }
                        }
                    }
                }
            }
        });
    }
};
window.borrarMovimiento = async function(id) {
    if (confirm("¿Estás seguro de que quieres borrar este movimiento?")) {
        try {
            await deleteDoc(doc(db, "movimientos", id));
            console.log("Movimiento borrado correctamente");
        } catch (e) {
            console.error("Error al borrar movimiento:", e);
        }
    }
};

// --- 5. INTERACCIONES DE LA INTERFAZ ---
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

    // --- MODO OSCURO ---
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

            const categoria = categoriaSelect ? categoriaSelect.value : 'comida';
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

window.borrarTodosLosDatos = async function() {
    // Doble confirmación para evitar disgustos
    const confirmar1 = confirm("⚠️ ¡ATENCIÓN! Vas a borrar TODOS tus movimientos y finanzas guardadas. ¿Estás seguro de que quieres perder todos los datos?");
    if (!confirmar1) return;

    const confirmar2 = confirm("🚨 Último aviso: Esta acción no se puede deshacer. ¿Deseas vaciar por completo tu historial?");
    if (!confirmar2) return;

    try {
        // Recorrer el array global y borrar cada documento de Firestore uno a uno
        const promesas = movimientosGlobales.map(mov => {
            return deleteDoc(doc(db, "movimientos", mov.id));
        });

        await Promise.all(promesas);
        alert("¡Todos los datos han sido borrados correctamente! La cuenta está a cero.");
        console.log("Historial vaciado por completo.");
    } catch (e) {
        console.error("Error al borrar todos los datos:", e);
        alert("Hubo un error al intentar borrar los datos.");
    }
};