// ==========================================
// CONFIGURACIÓN DE FIREBASE Y VARIABLES GLOBALES
// ==========================================
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
    onSnapshot, 
    deleteDoc, 
    doc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCqCMljp7j2XPyZ4GoeWDJScpHEmgIvfBc",
    authDomain: "cuentas-panda-mgb.firebaseapp.com",
    projectId: "cuentas-panda-mgb",
    storageBucket: "cuentas-panda-mgb.appspot.com",
    messagingSenderId: "146815332219",
    appId: "1:146815332219:web:..." 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let plantillasGastosFijos = [];
let miGraficoGastos = null;
let filtroHistorialActivo = "todos"; // 'todos', 'ingreso' o 'gasto'
let todosLosMovimientosCache = [];   // Caché global para los filtros del desglose

// ==========================================
// 1. AUTENTICACIÓN
// ==========================================
window.iniciarSesion = function() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    signInWithEmailAndPassword(auth, email, password)
        .catch((error) => {
            alert("Error al iniciar sesión: " + error.message);
        });
};

window.registrarUsuario = function() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    createUserWithEmailAndPassword(auth, email, password)
        .then(() => {
            alert("¡Usuario registrado con éxito!");
        })
        .catch((error) => {
            alert("Error al registrarse: " + error.message);
        });
};

window.cerrarSesion = function() {
    signOut(auth).catch((error) => {
        console.error("Error al cerrar sesión", error);
    });
};

onAuthStateChanged(auth, (user) => {
    const pantallaLogin = document.getElementById("pantallaLogin");
    const pantallaApp = document.getElementById("pantallaApp");

    if (user) {
        if (pantallaLogin) pantallaLogin.style.display = "none";
        if (pantallaApp) pantallaApp.style.display = "block";
        cargarMovimientosFirebase();
    } else {
        if (pantallaLogin) pantallaLogin.style.display = "flex";
        if (pantallaApp) pantallaApp.style.display = "none";
    }
});

// ==========================================
// 2. GUARDAR NUEVO MOVIMIENTO
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const formMovimiento = document.getElementById("formMovimiento");
    if (formMovimiento) {
        formMovimiento.addEventListener("submit", async (e) => {
            e.preventDefault();

            const concepto = document.getElementById("concepto").value;
            const monto = parseFloat(document.getElementById("monto").value);
            const categoria = document.getElementById("categoria").value;
            const tipo = document.getElementById("tipo").value;
            const fechaHoy = new Date().toISOString().split('T')[0];

            try {
                await addDoc(collection(db, "movimientos"), {
                    concepto: concepto,
                    monto: monto,
                    categoria: categoria,
                    tipo: tipo,
                    fecha: fechaHoy
                });
                formMovimiento.reset();
            } catch (error) {
                console.error("Error al guardar movimiento:", error);
                alert("Error al guardar movimiento: " + error.message);
            }
        });
    }
});

// ==========================================
// 3. GESTIÓN DE GASTOS FIJOS (PLANTILLAS)
// ==========================================
onSnapshot(collection(db, "gastosFijos"), (snapshot) => {
    plantillasGastosFijos = [];
    const listaContenedor = document.getElementById("listaGastosFijos");
    if (!listaContenedor) return;

    listaContenedor.innerHTML = "";

    snapshot.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() };
        plantillasGastosFijos.push(item);

        const div = document.createElement("div");
        div.className = "movimiento-item";
        div.innerHTML = `
            <div class="movimiento-info">
                <strong>${item.concepto}</strong>
                <span class="movimiento-categoria">${item.categoria}</span>
            </div>
            <div class="movimiento-monto gasto">
                -${item.monto} €
                <button onclick="borrarGastoFijo('${item.id}')" class="btn-borrar">❌</button>
            </div>
        `;
        listaContenedor.appendChild(div);
    });

    if (plantillasGastosFijos.length === 0) {
        listaContenedor.innerHTML = "<p style='text-align: center; color: #7f8c8d;'>No tienes gastos fijos configurados.</p>";
    }
    
    verificarGastosFijosAutomaticos();
});

window.guardarGastoFijo = async function(event) {
    event.preventDefault();
    const concepto = document.getElementById("fijoConcepto").value;
    const monto = parseFloat(document.getElementById("fijoMonto").value);
    const categoria = document.getElementById("fijoCategoria").value;
    const fechaHoy = new Date().toISOString().split('T')[0];

    try {
        // 1. Guardar como plantilla de gasto fijo
        await addDoc(collection(db, "gastosFijos"), {
            concepto: concepto,
            monto: monto,
            categoria: categoria
        });

        // 2. MODIFICAR AQUÍ: Añadir " (Fijo)" para que se vea igual que la nómina
        await addDoc(collection(db, "movimientos"), {
            concepto: concepto + " (Fijo)", // <--- ¡Añadimos esto!
            monto: monto,
            categoria: categoria,
            tipo: "gasto",
            fecha: fechaHoy
        });

        document.getElementById("formGastoFijo").reset();
        alert("¡Gasto fijo guardado y añadido a tus movimientos del mes! 📌");
    } catch (error) {
        console.error("Error al guardar gasto fijo:", error);
    }
};
// ==========================================
// GESTIÓN DE INGRESOS FIJOS (NÓMINA, ETC.)
// ==========================================
let plantillasIngresosFijos = [];

onSnapshot(collection(db, "ingresosFijos"), (snapshot) => {
    plantillasIngresosFijos = [];
    const listaContenedor = document.getElementById("listaIngresosFijos");
    if (!listaContenedor) return; // Si no está en el HTML actual, no da error

    listaContenedor.innerHTML = "";

    snapshot.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() };
        plantillasIngresosFijos.push(item);

        const div = document.createElement("div");
        div.className = "movimiento-item";
        div.innerHTML = `
            <div class="movimiento-info">
                <strong>${item.concepto}</strong>
                <span class="movimiento-categoria">${item.categoria}</span>
            </div>
            <div class="movimiento-monto ingreso">
                +${item.monto} €
                <button onclick="borrarIngresoFijo('${item.id}')" class="btn-borrar">❌</button>
            </div>
        `;
        listaContenedor.appendChild(div);
    });

    if (plantillasIngresosFijos.length === 0) {
        listaContenedor.innerHTML = "<p style='text-align: center; color: #7f8c8d;'>No tienes ingresos fijos configurados.</p>";
    }
    
    verificarIngresosFijosAutomaticos();
});

window.guardarIngresoFijo = async function(event) {
    event.preventDefault();
    const concepto = document.getElementById("ingresoFijoConcepto").value;
    const monto = parseFloat(document.getElementById("ingresoFijoMonto").value);
    const categoria = document.getElementById("ingresoFijoCategoria").value;
    const fechaHoy = new Date().toISOString().split('T')[0];

    try {
        // 1. Guardar como plantilla de ingreso fijo
        await addDoc(collection(db, "ingresosFijos"), {
            concepto: concepto,
            monto: monto,
            categoria: categoria
        });

        // 2. Guardarlo también como movimiento de ingreso del mes actual
        await addDoc(collection(db, "movimientos"), {
            concepto: concepto + " (Fijo)",
            monto: monto,
            categoria: categoria,
            tipo: "ingreso",
            fecha: fechaHoy
        });

        document.getElementById("formIngresoFijo").reset();
        alert("¡Ingreso fijo (nómina) guardado y añadido a tus ingresos del mes! 💰");
    } catch (error) {
        console.error("Error al guardar ingreso fijo:", error);
        alert("Error al guardar el ingreso fijo: " + error.message);
    }
};

window.borrarIngresoFijo = async function(id) {
    if (confirm("¿Quieres eliminar este ingreso fijo de tus plantillas?")) {
        try {
            await deleteDoc(doc(db, "ingresosFijos", id));
        } catch (error) {
            console.error("Error al borrar ingreso fijo:", error);
        }
    }
};

async function verificarIngresosFijosAutomaticos() {
    if (plantillasIngresosFijos.length === 0) return;

    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth();
    const claveMes = `${anioActual}-${mesActual}`;

    const mesYaCargado = localStorage.getItem("ingresosFijosCargados_" + claveMes);

    if (!mesYaCargado) {
        const fechaHoy = fechaActual.toISOString().split('T')[0];

        try {
            const promesas = plantillasIngresosFijos.map(ingreso => {
                return addDoc(collection(db, "movimientos"), {
                    concepto: ingreso.concepto,
                    monto: ingreso.monto,
                    categoria: ingreso.categoria,
                    tipo: "ingreso",
                    fecha: fechaHoy
                });
            });

            await Promise.all(promesas);
            localStorage.setItem("ingresosFijosCargados_" + claveMes, "true");
        } catch (error) {
            console.error("Error al generar ingresos fijos automáticos:", error);
        }
    }
}

window.borrarGastoFijo = async function(id) {
    if (confirm("¿Quieres eliminar este gasto fijo de tus plantillas futuras?")) {
        try {
            await deleteDoc(doc(db, "gastosFijos", id));
        } catch (error) {
            console.error("Error al borrar gasto fijo:", error);
        }
    }
};

async function verificarGastosFijosAutomaticos() {
    if (plantillasGastosFijos.length === 0) return;

    const fechaActual = new Date();
    const anioActual = fechaActual.getFullYear();
    const mesActual = fechaActual.getMonth();
    const claveMes = `${anioActual}-${mesActual}`;

    const mesYaCargado = localStorage.getItem("gastosFijosCargados_" + claveMes);

    if (!mesYaCargado) {
        const fechaHoy = fechaActual.toISOString().split('T')[0];

        try {
            const promesas = plantillasGastosFijos.map(gasto => {
                return addDoc(collection(db, "movimientos"), {
                    concepto: gasto.concepto,
                    monto: gasto.monto,
                    categoria: gasto.categoria,
                    tipo: "gasto",
                    fecha: fechaHoy
                });
            });

            await Promise.all(promesas);
            localStorage.setItem("gastosFijosCargados_" + claveMes, "true");
        } catch (error) {
            console.error("Error al generar gastos fijos automáticos:", error);
        }
    }
}

// ==========================================
// 4. CARGAR MOVIMIENTOS E HISTORIAL (CON LÍMITE SEGURO EN INICIO)
// ==========================================
function cargarMovimientosFirebase() {
    onSnapshot(collection(db, "movimientos"), (snapshot) => {
        const contenedorInicio = document.getElementById("listaMovimientos");
        const contenedorHistorial = document.getElementById("listaMovimientosHistorial");

        if (contenedorInicio) contenedorInicio.innerHTML = "";
        if (contenedorHistorial) contenedorHistorial.innerHTML = "";
        
        let totalIngresos = 0;
        let totalGastos = 0;
        todosLosMovimientosCache = []; 

        let contadorInicio = 0;
        const limiteInicio = 5; // <--- Aquí limitamos los que se ven en Inicio

        snapshot.forEach((docSnap) => {
            const mov = docSnap.data();
            const id = docSnap.id;
            todosLosMovimientosCache.push(mov); 

            const montoNum = parseFloat(mov.monto) || 0;
            if (mov.tipo === "ingreso") {
                totalIngresos += montoNum;
            } else {
                totalGastos += montoNum;
            }

            let fechaLegible = "";
            if (mov.fecha) {
                if (mov.fecha.seconds) {
                    const fechaDate = new Date(mov.fecha.seconds * 1000);
                    fechaLegible = fechaDate.toLocaleDateString();
                } else {
                    fechaLegible = mov.fecha;
                }
            }

            const htmlItem = `
                <div class="movimiento-item">
                    <div class="movimiento-info">
                        <strong>${mov.concepto}</strong>
                        <span class="movimiento-categoria">${mov.categoria || 'General'}</span>
                        <small style="display: block; color: #888;">${fechaLegible}</small>
                    </div>
                    <div class="movimiento-monto ${mov.tipo === 'ingreso' ? 'ingreso' : 'gasto'}">
                        ${mov.tipo === 'ingreso' ? '+' : '-'}${montoNum} €
                        <button onclick="borrarMovimiento('${id}')" class="btn-borrar">❌</button>
                    </div>
                </div>
            `;

            // En Inicio solo metemos los primeros según el límite
            if (contenedorInicio && contadorInicio < limiteInicio) {
                contenedorInicio.insertAdjacentHTML("beforeend", htmlItem);
                contadorInicio++;
            }

            // En Historial se muestran todos
            if (contenedorHistorial) {
                if (filtroHistorialActivo === "todos" || mov.tipo === filtroHistorialActivo) {
                    contenedorHistorial.insertAdjacentHTML("beforeend", htmlItem);
                }
            }
        });

        const elIngresos = document.getElementById("totalIngresos");
        const elGastos = document.getElementById("totalGastos");
        const elBalance = document.getElementById("totalBalance");

        if (elIngresos) elIngresos.textContent = "+" + totalIngresos.toFixed(2) + " €";
        if (elGastos) elGastos.textContent = "-" + totalGastos.toFixed(2) + " €";
        if (elBalance) elBalance.textContent = (totalIngresos - totalGastos).toFixed(2) + " €";

        actualizarGraficaDesglose(todosLosMovimientosCache);
    });
}

window.borrarMovimiento = async function(id) {
    if (confirm("¿Quieres eliminar este movimiento?")) {
        try {
            await deleteDoc(doc(db, "movimientos", id));
        } catch (error) {
            console.error("Error al borrar movimiento:", error);
        }
    }
};

// ==========================================
// 5. GRÁFICA DE BARRAS Y FILTRO DE DESGLOSE (SEGURO CONTRA FORMATOS)
// ==========================================
function actualizarGraficaDesglose(movimientos) {
    const canvas = document.getElementById("graficoGastos");
    if (!canvas) return;

    const selectMes = document.getElementById("filtroMesDesglose");
    const selectAnio = document.getElementById("filtroAnioDesglose");

    const mesSeleccionado = selectMes ? selectMes.value : "todos"; // Ej: "9" (Octubre) o "todos"
    const anioSeleccionado = selectAnio ? selectAnio.value : "2026";

    // Filtrar los movimientos de forma 100% segura
    const movimientosFiltrados = movimientos.filter(mov => {
        if (!mov.fecha) return false;

        let fechaStr = "";

        // Convertir la fecha a formato string "YYYY-MM-DD" sin importar cómo venga de Firebase
        if (typeof mov.fecha === "string") {
            fechaStr = mov.fecha;
        } else if (mov.fecha.seconds) {
            // Es un Timestamp de Firebase
            const d = new Date(mov.fecha.seconds * 1000);
            fechaStr = d.toISOString().split('T')[0];
        } else if (mov.fecha instanceof Date) {
            fechaStr = mov.fecha.toISOString().split('T')[0];
        } else {
            return false;
        }

        const partesFecha = fechaStr.split("-");
        if (partesFecha.length < 3) return false;

        const anioMov = partesFecha[0];                              // Ej: "2026"
        const mesMovNumJS = String(parseInt(partesFecha[1], 10) - 1); // Ej: "10" pasa a "9"

        // 1. Validar año
        if (anioMov !== String(anioSeleccionado)) return false;

        // 2. Validar mes (si no es "todos")
        if (mesSeleccionado !== "todos") {
            if (mesMovNumJS !== String(mesSeleccionado)) {
                return false;
            }
        }

        return true;
    });

    const ctx = canvas.getContext("2d");

    const categorias = {};
    let totalGastoPeriodo = 0;

    movimientosFiltrados.forEach(mov => {
        if (mov.tipo === "gasto") {
            const cat = mov.categoria || "general";
            const montoNum = parseFloat(mov.monto) || 0;
            
            categorias[cat] = (categorias[cat] || 0) + montoNum;
            totalGastoPeriodo += montoNum;
        }
    });

    // Actualizar la caja naranja con el total del periodo
    const elementoTotal = document.getElementById("montoTotalPeriodo"); 
    if (elementoTotal) {
        elementoTotal.textContent = totalGastoPeriodo.toFixed(2) + " €";
    }

    const labels = Object.keys(categorias);
    const data = Object.values(categorias);

    const coloresDisponibles = [
        '#E67E22', // Naranja Panda
        '#27AE60', // Verde
        '#2980B9', // Azul
        '#8E44AD', // Morado
        '#C0392B', // Rojo
        '#F1C40F'  // Amarillo
    ];

    const backgroundColors = labels.map((_, index) => coloresDisponibles[index % coloresDisponibles.length]);

    if (miGraficoGastos) {
        miGraficoGastos.destroy();
    }

    miGraficoGastos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels.length > 0 ? labels : ["Sin gastos"],
            datasets: [{
                label: 'Gastos por Categoría (€)',
                data: data.length > 0 ? data : [0],
                backgroundColor: backgroundColors,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
// Eventos para actualizar al instante al cambiar de mes o año en los selectores
document.addEventListener("DOMContentLoaded", () => {
    const selectMes = document.getElementById("filtroMesDesglose");
    const selectAnio = document.getElementById("filtroAnioDesglose");

    if (selectMes) {
        selectMes.addEventListener("change", () => {
            if (todosLosMovimientosCache.length > 0) {
                actualizarGraficaDesglose(todosLosMovimientosCache);
            }
        });
    }

    if (selectAnio) {
        selectAnio.addEventListener("change", () => {
            if (todosLosMovimientosCache.length > 0) {
                actualizarGraficaDesglose(todosLosMovimientosCache);
            }
        });
    }
});

// ==========================================
// 6. NAVEGACIÓN ENTRE PESTAÑAS
// ==========================================
window.cambiarPestana = function(idTab, elementoBoton) {
    const pestanas = document.querySelectorAll('.tab-content');
    pestanas.forEach(tab => {
        tab.classList.add('hidden');
        tab.classList.remove('active');
    });

    const botones = document.querySelectorAll('.nav-tab-btn');
    botones.forEach(btn => {
        btn.classList.remove('active');
    });

    const tabSeleccionada = document.getElementById(idTab);
    if (tabSeleccionada) {
        tabSeleccionada.classList.remove('hidden');
        tabSeleccionada.classList.add('active');
    }

    if (elementoBoton) {
        elementoBoton.classList.add('active');
    }
};

// ==========================================
// 7. CONTROL DE LA VENTANA MANUAL
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const modalManual = document.getElementById("modalManual");
    const btnAbrirManual = document.getElementById("btnAbrirManual");
    const btnCerrarManual = document.getElementById("btnCerrarManual");

    if (btnAbrirManual && modalManual) {
        btnAbrirManual.addEventListener("click", () => {
            modalManual.classList.remove("hidden");
        });
    }

    if (btnCerrarManual && modalManual) {
        btnCerrarManual.addEventListener("click", () => {
            modalManual.classList.add("hidden");
        });
    }

    if (modalManual) {
        modalManual.addEventListener("click", (e) => {
            if (e.target === modalManual) {
                modalManual.classList.add("hidden");
            }
        });
    }
});

// ==========================================
// 8. MODO OSCURO (LUNA / SOL)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const btnToggleDarkMode = document.getElementById("btnToggleDarkMode");
    const btnToggleDarkModeModal = document.getElementById("btnToggleDarkModeModal");

    function alternarModoOscuro() {
        document.body.classList.toggle("dark-mode");
        const esOscuro = document.body.classList.contains("dark-mode");
        
        const nuevoIcono = esOscuro ? "☀️" : "🌙";
        if (btnToggleDarkMode) btnToggleDarkMode.textContent = nuevoIcono;
        if (btnToggleDarkModeModal) btnToggleDarkModeModal.textContent = nuevoIcono;
        
        // --- FORZAR COLOR EN SELECTS DESDE JS ---
        const todosLosSelects = document.querySelectorAll("select");
        todosLosSelects.forEach(sel => {
            sel.style.color = esOscuro ? "#ffffff" : "#333333";
            sel.style.backgroundColor = esOscuro ? "#1e293b" : "#ffffff";
        });
        // ----------------------------------------

        localStorage.setItem("darkMode", esOscuro ? "enabled" : "disabled");
    }

    if (localStorage.getItem("darkMode") === "enabled") {
        document.body.classList.add("dark-mode");
        if (btnToggleDarkMode) btnToggleDarkMode.textContent = "☀️";
        if (btnToggleDarkModeModal) btnToggleDarkModeModal.textContent = "☀️";
    }

    if (btnToggleDarkMode) {
        btnToggleDarkMode.addEventListener("click", alternarModoOscuro);
    }
    if (btnToggleDarkModeModal) {
        btnToggleDarkModeModal.addEventListener("click", alternarModoOscuro);
    }
});

// ==========================================
// 9. EVENTOS DE FILTRADO EN HISTORIAL (BOTONES)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const botonesFiltro = document.querySelectorAll(".filtros-historial .btn-filtro");

    botonesFiltro.forEach((btn) => {
        btn.addEventListener("click", (e) => {
            botonesFiltro.forEach((b) => b.classList.remove("active"));
            e.target.classList.add("active");
            
            filtroHistorialActivo = e.target.getAttribute("data-filtro");
            
            if (typeof cargarMovimientosFirebase === "function") {
                cargarMovimientosFirebase();
            }
        });
    });
});

// ==========================================
// 10. EVENTOS DE FILTRADO EN DESGLOSE (SELECTORES MES / AÑO)
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const selectMes = document.getElementById("filtroMesDesglose");
    const selectAnio = document.getElementById("filtroAnioDesglose");

    if (selectMes) {
        selectMes.addEventListener("change", () => {
            if (todosLosMovimientosCache.length > 0) {
                actualizarGraficaDesglose(todosLosMovimientosCache);
            }
        });
    }

    if (selectAnio) {
        selectAnio.addEventListener("change", () => {
            if (todosLosMovimientosCache.length > 0) {
                actualizarGraficaDesglose(todosLosMovimientosCache);
            }
        });
    }
});