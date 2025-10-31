// Archivo: index.js

// --- BLOQUE 1: CONEXIÓN Y AUTENTICACIÓN ---

// 1.1 Importa el cliente de Supabase
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// 1.2 Configura tus credenciales de Supabase
const SUPABASE_URL = "https://nsafgmewbapvvvfiixbn.supabase.co"; // Reemplaza esto
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zYWZnbWV3YmFwdnZ2ZmlpeGJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NzUxNDUsImV4cCI6MjA3NzM1MTE0NX0.Hzhtn0pBzL6TaqeX0IdtFwF51T_hBlFbuR0ogPH5ZpY"; // Reemplaza esto

// 1.3 Crea el cliente de Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 1.4 Referencias a elementos del DOM
const loginPage = document.getElementById("login-page");
const appContainer = document.getElementById("app-container");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutButton = document.getElementById("logout-button");
const allSections = document.querySelectorAll(".section");
const navLinks = document.querySelectorAll(".nav__link");

// 1.5 Manejo de la sesión
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    // Usuario ha iniciado sesión
    loginPage.style.display = "none";
    appContainer.style.display = "block";
    // Carga los datos iniciales
    loadDashboardData();
    loadPersonas();
    loadRegistros();
    showView("dashboard"); // Muestra el dashboard por defecto
  } else {
    // Usuario no ha iniciado sesión
    loginPage.style.display = "flex";
    appContainer.style.display = "none";
  }
});

// 1.6 Event Listener para el formulario de Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    loginError.textContent = `Error: ${error.message}`;
    loginError.style.display = "block";
  } else {
    loginError.style.display = "none";
  }
});

// 1.7 Event Listener para Cerrar Sesión
logoutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

// --- BLOQUE 2: NAVEGACIÓN DE LA APP ---

// 2.1 Función para mostrar vistas/secciones
function showView(viewId) {
  // 1. Oculta todas las secciones
  allSections.forEach((section) => {
    section.style.display = "none";
  });
  // 2. Muestra la sección solicitada
  const activeSection = document.getElementById(viewId);
  if (activeSection) {
    activeSection.style.display = "block";
  }
  // 3. Actualiza la clase activa en el menú
  navLinks.forEach((link) => {
    link.classList.remove("nav__link--active");
    if (link.dataset.section === viewId) {
      link.classList.add("nav__link--active");
    }
  });
}

// 2.2 Event Listeners para la navegación
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const sectionId = e.currentTarget.dataset.section;
    showView(sectionId);
  });
});

// --- BLOQUE 3: LÓGICA DE DATOS (PERSONAS) ---

const peopleList = document.getElementById("people-list");
const addPersonButton = document.getElementById("add-person-button");

// 3.1 Cargar y mostrar personas
async function loadPersonas() {
  const { data: personas, error } = await supabase.from("personas").select("*");

  if (error) {
    console.error("Error cargando personas:", error);
    return;
  }

  // Limpia la lista antes de volver a pintarla
  peopleList.innerHTML = "";

  // Pinta cada persona en la lista
  personas.forEach((persona) => {
    const cardHTML = `
            <article class="person-card" data-userid="${persona.id}">
                <div class="person-card__avatar"></div>
                <div class="person-card__info">
                    <h3 class="person-card__name">${persona.nombre}</h3>
                    <span class="person-card__role">${
                      persona.rol
                    } (Huella ID: ${persona.fingerprint_id || "N/A"})</span>
                </div>
                <div class="person-card__status">
                    <span class="icon" title="Acceso con Huella">🖐️</span>
                </div>
                <button class="person-card__action-button person-card__action-button--delete" data-id="${
                  persona.id
                }">
                    🗑️
                </button>
            </article>
        `;
    peopleList.innerHTML += cardHTML;
  });

  // Añadir event listeners a los nuevos botones de eliminar
  document
    .querySelectorAll(".person-card__action-button--delete")
    .forEach((button) => {
      button.addEventListener("click", (e) => {
        const id = e.currentTarget.dataset.id;
        // Pedir confirmación antes de borrar
        if (confirm("¿Estás seguro de que quieres eliminar a esta persona?")) {
          deletePerson(id);
        }
      });
    });
}

// 3.2 Eliminar una persona
async function deletePerson(id) {
  const { error } = await supabase.from("personas").delete().eq("id", id);

  if (error) {
    console.error("Error al eliminar persona:", error);
    alert("Error al eliminar persona.");
  } else {
    alert("Persona eliminada.");
    loadPersonas(); // Recarga la lista
  }
}

// 3.3 Añadir una persona
addPersonButton.addEventListener("click", async () => {
  const nombre = prompt("Nombre de la nueva persona:");
  if (!nombre) return; // Si el usuario cancela

  const rol = prompt("Rol (Ej: Residente, Administrador):", "Residente");
  if (!rol) return;

  // ¡Importante! Este ID debe ser el que te da el sensor AS680
  const fingerprint_id_str = prompt(
    "ID de la huella (dado por el sensor AS680):"
  );
  if (!fingerprint_id_str) return;

  const fingerprint_id = parseInt(fingerprint_id_str);

  const { error } = await supabase.from("personas").insert({
    nombre: nombre,
    rol: rol,
    fingerprint_id: fingerprint_id,
  });

  if (error) {
    console.error("Error al añadir persona:", error);
    alert(`Error: ${error.message}`);
  } else {
    alert("Persona añadida.");
    loadPersonas(); // Recarga la lista
  }
});

// --- BLOQUE 4: LÓGICA DE DATOS (REGISTROS Y DASHBOARD) ---

const logsTableBody = document.getElementById("logs-table-body");

// 4.1 Cargar y mostrar registros
async function loadRegistros() {
  // Hacemos un "JOIN" para traer el nombre de la persona
  const { data: registros, error } = await supabase
    .from("registros")
    .select(
      `
            created_at,
            estado,
            metodo,
            detalles,
            personas ( nombre ) 
        `
    )
    .order("created_at", { ascending: false }) // Mostrar más nuevos primero
    .limit(20); // Limitar a los últimos 20 registros

  if (error) {
    console.error("Error cargando registros:", error);
    return;
  }

  logsTableBody.innerHTML = ""; // Limpiar tabla

  registros.forEach((log) => {
    const fecha = new Date(log.created_at).toLocaleString("es-MX");

    // El nombre puede ser un objeto (si se encontró) o null
    const nombrePersona = log.personas
      ? log.personas.nombre
      : log.detalles || "Desconocido";

    const estadoClass =
      log.estado === "Exitoso" ? "status--success" : "status--failed";

    const rowHTML = `
            <tr class="logs__row">
                <td data-label="Fecha">${fecha}</td>
                <td data-label="Persona">${nombrePersona}</td>
                <td data-label="Estado">
                    <span class="status ${estadoClass}">${log.estado}</span>
                </td>
                <td data-label="Método">${log.metodo}</td>
            </tr>
        `;
    logsTableBody.innerHTML += rowHTML;
  });
}

// 4.2 Cargar datos del Dashboard (Tus tarjetas)
// Esta es una función de ejemplo, puedes hacerla tan compleja como quieras
async function loadDashboardData() {
  // Simplemente actualizamos las tarjetas con datos de ejemplo
  // En un futuro, harías consultas a Supabase para obtener estos conteos
  document.querySelector('.card__data[data-id="accesos-hoy"]').textContent =
    "...";
  document.querySelector('.card__data[data-id="fallidos-hoy"]').textContent =
    "...";

  // Ejemplo: Contar personas
  const { count: personasCount, error } = await supabase
    .from("personas")
    .select("*", { count: "exact", head: true }); // Solo cuenta, no trae datos

  if (personasCount) {
    document.querySelector(
      '.card__data[data-id="personas-activas"]'
    ).textContent = personasCount;
  }

  // (Asegúrate de añadir 'data-id' a tus <p class="card__data"> en el HTML)
  // Ej: <p class="card__data" data-id="personas-activas">5</p>
}

// --- BLOQUE 5: LÓGICA DE DESBLOQUEO (TECLADO) ---

const keypadDisplay = document.querySelector(".unlock-keypad__display");
const keypadButtons = document.querySelectorAll(".unlock-keypad__button");
const submitCodeButton = document.querySelector('[data-action="submit-code"]');
let currentCode = "";
const CODE_LENGTH = 6;

// 5.1 Actualizar el display del teclado
function updateKeypadDisplay() {
  const digits = keypadDisplay.querySelectorAll(".unlock-keypad__digit");
  digits.forEach((digit, index) => {
    if (index < currentCode.length) {
      digit.textContent = "•"; // Muestra un punto en lugar del número
      digit.classList.add("unlock-keypad__digit--filled"); // (Puedes añadir esta clase en CSS)
    } else {
      digit.textContent = "";
      digit.classList.remove("unlock-keypad__digit--filled");
    }
  });
  // (Modifiqué el HTML que te di antes, los <span> ahora están vacíos
  // en lugar de ser guiones, para poder poner el '•' dentro)
}
// (Asegúrate que tu HTML del display sea: <span class="unlock-keypad__digit"></span>)

// 5.2 Event Listeners para los botones del teclado
keypadButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.key;
    const action = button.dataset.action;

    if (key && currentCode.length < CODE_LENGTH) {
      currentCode += key;
    } else if (action === "clear") {
      currentCode = "";
    } else if (action === "confirm") {
      submitCode(); // Llama a la función de envío
    }
    updateKeypadDisplay();
  });
});

// 5.3 Event Listener para el botón "Desbloquear"
submitCodeButton.addEventListener("click", submitCode);

// 5.4 Función para enviar el código (LOGS)
async function submitCode() {
  if (currentCode.length === 0) return;

  // Aquí iría la lógica para VALIDAR el código
  // Por ahora, solo registraremos el intento.
  const esExitoso = currentCode === "123456"; // ¡Código de prueba!

  const { error } = await supabase.from("registros").insert({
    estado: esExitoso ? "Exitoso" : "Fallido",
    metodo: "App Web",
    detalles: `Intento con código: ${currentCode}`,
  });

  if (error) {
    alert("Error al registrar intento.");
  } else {
    alert(esExitoso ? "¡Desbloqueado (simulado)!" : "Código incorrecto.");
  }

  currentCode = "";
  updateKeypadDisplay();
  loadRegistros(); // Recarga los logs
}

// Inicializa la primera vista (será anulado por el onAuthStateChange)
showView("dashboard");
