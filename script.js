document.addEventListener('DOMContentLoaded', () => {

    // ------------------- //
    // SÉLECTION DU DOM    //
    // ------------------- //
    const taskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const taskCounter = document.getElementById('task-counter');
    const filterContainer = document.querySelector('.filters');
    const themeSwitch = document.getElementById('theme-switch');
    const navContainer = document.querySelector('.app-nav');
    const views = document.querySelectorAll('.view');
    const customSelect = document.querySelector('.custom-select');
    const customSelectTrigger = document.querySelector('.custom-select__trigger');
    const customOptions = document.querySelector('.custom-options');

    // ------------------- //
    // ÉTAT DE L'APPLICATION //
    // ------------------- //
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentTheme = localStorage.getItem('theme') || 'light';
    let currentLang = localStorage.getItem('lang') || 'en';
    let translations = {};
    let availableLanguages = [];

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
                    <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="${translations.completeTaskAria || 'Mark as completed'}">
                    <span>${task.text}</span>
                </div>
                <button class="delete-btn" aria-label="${translations.deleteTaskAria || 'Delete task'}">
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
        if (!translations.taskRemaining) return;
        const activeTasks = tasks.filter(task => !task.completed).length;
        const taskString = activeTasks === 1 ? translations.taskRemaining : translations.tasksRemaining;
        taskCounter.textContent = `${activeTasks} ${taskString}`;
    }

    /**
     * Applique le thème (clair ou sombre).
     */
    function applyTheme() {
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeSwitch.checked = true;
        } else {
            document.body.classList.remove('dark-theme');
            themeSwitch.checked = false;
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

    /**
     * Applique la langue sélectionnée à l'interface.
     */
    function applyLanguage() {
        document.querySelectorAll('[data-i18n-key]').forEach(element => {
            const key = element.dataset.i18nKey;
            if (translations[key]) {
                const translation = translations[key];
                if (element.tagName === 'INPUT' && element.placeholder) {
                    element.placeholder = translation;
                } else if (element.hasAttribute('aria-label') && element.tagName === 'BUTTON') {
                    element.setAttribute('aria-label', translation);
                } else {
                    element.textContent = translation;
                }
            }
        });
        updateTaskCount();
        renderTasks();
    }

    /**
     * Charge et peuple les options de langue.
     */
    async function populateLanguageOptions() {
        customOptions.innerHTML = ''; // Vide les options existantes
        for (const langCode of availableLanguages) {
            try {
                const response = await fetch(`lang/${langCode}.json`);
                const langData = await response.json();
                const option = document.createElement('span');
                option.classList.add('custom-option');
                option.dataset.value = langCode;
                option.textContent = langData.languageName || langCode;
                customOptions.appendChild(option);
            } catch (error) {
                console.error(`Failed to load language data for ${langCode}:`, error);
            }
        }
        // Mettre à jour le texte du déclencheur après avoir peuplé les options
        updateSelectTriggerText(currentLang);
    }

    /**
     * Met à jour le texte du déclencheur du sélecteur de langue.
     * @param {string} lang - Le code de la langue.
     */
    function updateSelectTriggerText(lang) {
        const selectedOption = document.querySelector(`.custom-option[data-value="${lang}"]`);
        if (selectedOption) {
            customSelectTrigger.querySelector('span').textContent = selectedOption.textContent;
        }
    }

    /**
     * Change la langue et sauvegarde la préférence.
     * @param {string} lang - Le code de la langue.
     */
    async function setLanguage(lang) {
        if (!availableLanguages.includes(lang)) {
            lang = 'en'; // Langue par défaut
        }
        currentLang = lang;
        localStorage.setItem('lang', lang);

        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) throw new Error(`Could not fetch lang/${lang}.json`);
            translations = await response.json();
            applyLanguage();
            updateSelectTriggerText(lang);
        } catch (error) {
            console.error("Failed to load language file:", error);
            if (lang !== 'en') {
                await setLanguage('en');
            }
        }
    }

    /**
     * Change la vue affichée (Tâches ou Paramètres).
     * @param {string} viewId - L'ID de la vue à afficher.
     */
    function switchView(viewId) {
        // Masquer toutes les vues
        views.forEach(view => {
            view.classList.remove('active-view');
        });

        // Afficher la vue sélectionnée
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.add('active-view');
        }

        // Mettre à jour l'état actif des boutons de navigation
        document.querySelectorAll('.app-nav .nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.view === viewId) {
                btn.classList.add('active');
            }
        });
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

    // Gestion du changement de thème
    themeSwitch.addEventListener('change', toggleTheme);

    // Gestion de la navigation par onglets
    navContainer.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const viewId = e.target.dataset.view;
            if (viewId) {
                switchView(viewId);
            }
        }
    });

    // Gestion du sélecteur de langue personnalisé
    customSelectTrigger.addEventListener('click', () => {
        customSelect.classList.toggle('open');
    });

    customOptions.addEventListener('click', (e) => {
        if (e.target.classList.contains('custom-option')) {
            const lang = e.target.dataset.value;
            customSelect.classList.remove('open');
            requestAnimationFrame(() => {
                setLanguage(lang);
            });
        }
    });

    window.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            customSelect.classList.remove('open');
        }
    });

    // Initialisation
    async function initialize() {
        try {
            const response = await fetch('lang/languages.json');
            availableLanguages = await response.json();
        } catch (error) {
            console.error('Could not load languages.json', error);
            availableLanguages = ['en']; // Fallback to English
        }

        await populateLanguageOptions();
        await setLanguage(currentLang);
        applyTheme();
        // renderTasks() est déjà appelé dans applyLanguage
    }

    initialize();
});