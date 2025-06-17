// script.js

// --- Variables Globales y Selectores del DOM ---
const toggleThemeBtn = document.getElementById('toggleTheme');
const body = document.body;

// --- Funciones de Utilidad ---

/**
 * Guarda el tema actual en LocalStorage.
 * @param {string} theme - 'light' o 'dark'.
 */
function saveTheme(theme) {
    localStorage.setItem('theme', theme);
}

/**
 * Carga el tema desde LocalStorage.
 * @returns {string} Tema guardado ('light' o 'dark').
*/
function loadTheme() {
    return localStorage.getItem('theme') || 'light'; // Por defecto, tema claro
}

// --- Manejo del Tema Oscuro/Claro ---
function toggleTheme() {
    if (body.dataset.theme === 'light') {
        body.dataset.theme = 'dark';
        toggleThemeBtn.textContent = '☀️'; // Icono para tema claro
        saveTheme('dark');
    } else {
        body.dataset.theme = 'light';
        toggleThemeBtn.textContent = '🌙'; // Icono para tema oscuro
        saveTheme('light');
    }
}

// --- Inicialización de la Aplicación ---
document.addEventListener('DOMContentLoaded', () => {
    // Cargar el tema guardado
    const savedTheme = loadTheme();
    body.dataset.theme = savedTheme;
    toggleThemeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    // Añadir Event Listeners
    toggleThemeBtn.addEventListener('click', toggleTheme);
});