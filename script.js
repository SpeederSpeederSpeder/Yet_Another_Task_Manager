document.addEventListener('DOMContentLoaded', () => {

    // ------------------- //
    // SÉLECTION DU DOM    //
    // ------------------- //
    const taskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const taskCounter = document.getElementById('task-counter');
    const filterContainer = document.querySelector('.filters');
    const themeToggleButton = document.querySelector('.theme-toggle');
    const themeIconSun = document.querySelector('.theme-icon-sun');
    const themeIconMoon = document.querySelector('.theme-icon-moon');

    // ------------------- //
    // ÉTAT DE L'APPLICATION //
    // ------------------- //
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentTheme = localStorage.getItem('theme') || 'light';

    // ------------------- //
    // FONCTIONS           //
    // ------------------- //

    /**
     * Sauvegarde les tâches dans le localStorage.
     */
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    /**
     * Affiche les tâches dans le DOM en fonction du filtre actif.
     */
    function renderTasks() {
        taskList.innerHTML = ''; // Vide la liste avant de la reconstruire
        updateTaskCount();

        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true; // 'all'
        });

        filteredTasks.forEach(task => {
            const taskElement = document.createElement('li');
            taskElement.classList.add('task-item');
            taskElement.dataset.id = task.id;

            if (task.completed) {
                taskElement.classList.add('completed');
            }

            taskElement.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="Marquer comme complétée">
                    <span>${task.text}</span>
                </div>
                <button class="delete-btn" aria-label="Supprimer la tâche">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            `;
            taskList.appendChild(taskElement);
        });
    }

    /**
     * Ajoute une nouvelle tâche.
     * @param {string} text - Le contenu de la tâche.
     */
    function addTask(text) {
        if (text.trim() === '') return;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
    }

    /**
     * Bascule l'état de complétion d'une tâche.
     * @param {number} id - L'ID de la tâche.
     */
    function toggleTask(id) {
        tasks = tasks.map(task =>
            task.id === id ? { ...task, completed: !task.completed } : task
        );
        saveTasks();
        renderTasks();
    }

    /**
     * Supprime une tâche.
     * @param {number} id - L'ID de la tâche.
     */
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    /**
     * Met à jour le compteur de tâches actives.
     */
    function updateTaskCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        const taskString = activeTasks === 1 ? 'tâche restante' : 'tâches restantes';
        taskCounter.textContent = `${activeTasks} ${taskString}`;
    }

    /**
     * Applique le thème (clair ou sombre).
     */
    function applyTheme() {
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeIconSun.style.display = 'none';
            themeIconMoon.style.display = 'inline-block';
        } else {
            document.body.classList.remove('dark-theme');
            themeIconSun.style.display = 'inline-block';
            themeIconMoon.style.display = 'none';
        }
    }

    /**
     * Bascule le thème et sauvegarde la préférence.
     */
    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
    }


    // ------------------- //
    // ÉCOUTEURS D'ÉVÉNEMENTS //
    // ------------------- //

    // Ajout de tâche via le formulaire
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(taskInput.value);
        taskInput.value = '';
        taskInput.focus();
    });

    // Gestion des clics sur la liste (complétion et suppression)
    taskList.addEventListener('click', (e) => {
        const taskElement = e.target.closest('.task-item');
        if (!taskElement) return;

        const taskId = Number(taskElement.dataset.id);

        // Clic sur le bouton de suppression
        if (e.target.closest('.delete-btn')) {
            const taskElementToRemove = e.target.closest('.task-item');
            taskElementToRemove.classList.add('removing');
            
            taskElementToRemove.addEventListener('animationend', () => {
                deleteTask(taskId);
            });
        }
        // Clic sur la tâche ou la checkbox
        else {
            toggleTask(taskId);
        }
    });

    // Gestion des clics sur les filtres
    filterContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const filter = e.target.dataset.filter;
            if (filter) {
                currentFilter = filter;
                document.querySelectorAll('.filters .filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                renderTasks();
            }
        }
    });

    // Gestion du clic sur le bouton de thème
    themeToggleButton.addEventListener('click', toggleTheme);

    // Initialisation
    applyTheme();
    renderTasks();
});