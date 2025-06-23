
const toggleThemeBtn = document.getElementById('toggleTheme');
const body = document.body;

const transactionForm = document.getElementById('transactionForm');
const transactionNameInput = document.getElementById('transactionName');
const transactionAmountInput = document.getElementById('transactionAmount');
const transactionCategorySelect = document.getElementById('transactionCategory');
const transactionTypeSelect = document.getElementById('transactionType');
const transactionListUl = document.querySelector('#transactionList ul');

const saldoDisponibleSpan = document.getElementById('saldoDisponible');
const totalEgresoSpan = document.getElementById('totalEgreso');
const totalIngresoSpan = document.getElementById('totalIngreso');

const perfilIngresoSpan = document.getElementById('perfilIngreso');
const perfilEgresoSpan = document.getElementById('perfilEgreso');
const perfilSaldoSpan = document.getElementById('perfilSaldo');
const perfilAhorrosSpan = document.getElementById('Ahorros'); // 

let transactions = []; // Array para almacenar


let barChart, lineChart, pieChart;

// --- Funciones de Utilidad ---

/**
 * Genera un ID único para cada transacción.
 * @returns {string} ID único.
 */
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

/**
 * Guarda las transacciones en LocalStorage.
 */
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

/**
 * Carga las transacciones desde LocalStorage.
 * @returns {Array} Array de transacciones.
 */
function loadTransactions() {
    const storedTransactions = localStorage.getItem('transactions');
    return storedTransactions ? JSON.parse(storedTransactions) : [];
}

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

// --- Funciones de Lógica de Negocio ---

/**
 * Agrega una nueva transacción.
 * @param {Event} e - Evento de submit del formulario.
 */
function addTransaction(e) {
    e.preventDefault(); // Prevenir el envío del formulario

    const name = transactionNameInput.value.trim();
    const amount = parseFloat(transactionAmountInput.value);
    const category = transactionCategorySelect.value;
    const type = transactionTypeSelect.value;

    // Validaciones
    if (!name || isNaN(amount) || amount <= 0 || category === 'Seleccionar...' || type === 'Seleccionar...') {
        alert('Por favor, completa todos los campos con valores válidos.');
        return;
    }

    const newTransaction = {
        id: generateId(),
        name,
        amount: amount,
        category,
        type,
        date: new Date().toISOString().split('T')[0] // dias mes ano no tengo ene aaaaaa
    };

    transactions.push(newTransaction);
    saveTransactions(); // Guardar después de añadir
    renderTransactions(); // Volver a renderizar la lista
    updateSummary(); // Actualizar el resumen
    updateCharts(); // Actualizar los gráficos

    // Limpiar el formulario
    transactionForm.reset();
    transactionCategorySelect.value = 'Seleccionar...';
    transactionTypeSelect.value = 'Seleccionar...';
}

/**
 * Elimina una transacción por su ID.
 * @param {string} id - ID de la transacción a eliminar.
 */
function deleteTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    saveTransactions(); // Guardar después de eliminar
    renderTransactions();
    updateSummary();
    updateCharts();
}

/**
 * Calcula y actualiza el saldo, ingresos y egresos totales.
 */
function updateSummary() {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalSavings = 0;

    transactions.forEach(t => {
        if (t.type === 'Ingreso') {
            totalIncome += t.amount;
        } else if (t.type === 'Egreso') {
            totalExpense += t.amount;
        }

        //Categoría específica para ahorros
        if (t.category === 'Ahorros' && t.type === 'Egreso') {
            totalSavings += t.amount;
        }
    });

    const currentBalance = totalIncome - totalExpense;

    // Actualizar Dashboard
    saldoDisponibleSpan.textContent = currentBalance.toFixed(2);
    totalEgresoSpan.textContent = totalExpense.toFixed(2);
    totalIngresoSpan.textContent = totalIncome.toFixed(2);

    // Actualizar Perfil
    perfilIngresoSpan.textContent = totalIncome.toFixed(2);
    perfilEgresoSpan.textContent = totalExpense.toFixed(2);
    perfilSaldoSpan.textContent = currentBalance.toFixed(2);
    perfilAhorrosSpan.textContent = totalSavings.toFixed(2);
}

function renderTransactions() {
    transactionListUl.innerHTML = ''; // Limpiar lista existente

    if (transactions.length === 0) {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item text-center text-muted';
        listItem.textContent = 'No hay transacciones registradas.';
        transactionListUl.appendChild(listItem);
        return;
    }

    transactions.forEach(t => {
        const listItem = document.createElement('li');
        listItem.className = `list-group-item d-flex justify-content-between align-items-center ${t.type === 'Ingreso' ? 'list-group-item-success' : 'list-group-item-danger'}`;
        listItem.innerHTML = `
            <div>
                <strong>${t.name}</strong>
                <br>
                <small class="text-muted">${t.category} - ${t.date}</small>
            </div>
            <div>
                <span>$${t.amount.toFixed(2)}</span>
                <button class="btn btn-sm btn-danger ml-2" data-id="${t.id}">X</button>
            </div>
        `;
        transactionListUl.appendChild(listItem);
    });

    // Añadir event listeners a los botones de eliminar
    transactionListUl.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', (e) => {
            const idToDelete = e.target.dataset.id;
            deleteTransaction(idToDelete);
        });
    });
}

/**
 * Inicia o actualiza los gráficos Chart.js.
 */
function updateCharts() {
    // Preparar datos para los gráficos
    const categories = ['Alimentación', 'Transporte', 'Entretenimiento', 'Otros', 'Ahorros'];
    const expenseByCategory = {};
    const monthlyData = {}; // Para el gráfico de línea
    let totalExpensesSum = 0; // Para el gráfico de la torta

    categories.forEach(cat => expenseByCategory[cat] = 0);

    transactions.forEach(t => {
        if (t.type === 'Egreso') {
            expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            totalExpensesSum += t.amount;

            // Para gráfico de línea (ej. gastos mensuales)
            const month = t.date.substring(0, 7); // YYYY-MM
            monthlyData[month] = (monthlyData[month] || 0) + t.amount;
        }
    });

    const barChartData = categories.map(cat => expenseByCategory[cat]);
    const pieChartData = categories.filter(cat => expenseByCategory[cat] > 0).map(cat => expenseByCategory[cat]);
    const pieChartLabels = categories.filter(cat => expenseByCategory[cat] > 0);

    // Ordenar datos mensuales para el gráfico de línea
    const sortedMonthlyLabels = Object.keys(monthlyData).sort();
    const sortedMonthlyValues = sortedMonthlyLabels.map(month => monthlyData[month]);


    // --- Bar Chart (Gastos por Categoría) ---
    const barCtx = document.getElementById('barChart').getContext('2d');
    if (barChart) barChart.destroy(); // Destruir instancia anterior si existe
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [{
                label: 'Gastos por Categoría',
                data: barChartData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(54, 162, 235, 0.6)',
                    'rgba(255, 206, 86, 0.6)',
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(153, 102, 255, 0.6)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ],
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

    // --- Line Chart (Gastos Mensuales) ---
    const lineCtx = document.getElementById('lineChart').getContext('2d');
    if (lineChart) lineChart.destroy(); // Destruir instancia anterior si existe
    lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: sortedMonthlyLabels,
            datasets: [{
                label: 'Gastos Mensuales',
                data: sortedMonthlyValues,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.1
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

    // --- Pie Chart (Distribución de Gastos) ---
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    if (pieChart) pieChart.destroy(); // Destruir instancia anterior si existe
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: pieChartLabels,
            datasets: [{
                label: 'Distribución de Gastos',
                data: pieChartData,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += `$${context.parsed.toFixed(2)}`;
                                if (totalExpensesSum > 0) {
                                    const percentage = ((context.parsed / totalExpensesSum) * 100).toFixed(2);
                                    label += ` (${percentage}%)`;
                                }
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
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

    // Cargar transacciones al inicio
    transactions = loadTransactions();
    renderTransactions();
    updateSummary();
    updateCharts(); // Iniciar gráficos al cargar la página

    // Añadir Event Listeners
    transactionForm.addEventListener('submit', addTransaction);
    toggleThemeBtn.addEventListener('click', toggleTheme);

    // Lógica para desplazamiento suave de la navegación (opcional, pero mejora UX)
    document.querySelectorAll('a.nav-link').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});