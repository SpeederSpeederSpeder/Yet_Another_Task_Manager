document.addEventListener('DOMContentLoaded', () => {

    // ------------------- //
    // SÉLECTION DU DOM    //
    // ------------------- //
    const taskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const taskCounter = document.getElementById('task-counter');
    const progressBar = document.getElementById('progress-bar');
    const emptyState = document.getElementById('empty-state');
    const clearCompletedBtn = document.getElementById('clear-completed');
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
        updateProgress();
    }

    /**
     * Met à jour la barre de progression.
     */
    function updateProgress() {
        if (tasks.length === 0) {
            progressBar.style.width = '0%';
            return;
        }
        const completedCount = tasks.filter(t => t.completed).length;
        const progress = (completedCount / tasks.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    /**
     * Affiche les tâches dans le DOM en fonction du filtre actif.
     */
    function renderTasks() {
        taskList.innerHTML = ''; 
        
        const filteredTasks = tasks.filter(task => {
            if (currentFilter === 'active') return !task.completed;
            if (currentFilter === 'completed') return task.completed;
            return true;
        });

        if (tasks.length === 0) {
            emptyState.style.display = 'flex';
            emptyState.querySelector('p').dataset.i18nKey = 'emptyStateText';
            emptyState.querySelector('p').textContent = translations.emptyStateText || 'No tasks yet!';
            taskList.style.display = 'none';
        } else if (filteredTasks.length === 0) {
            emptyState.style.display = 'flex';
            emptyState.querySelector('p').dataset.i18nKey = 'noFilterResults';
            emptyState.querySelector('p').textContent = translations.noFilterResults || 'No tasks match this filter.';
            taskList.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            taskList.style.display = 'block';
        }

        filteredTasks.forEach(task => {
            const taskElement = document.createElement('li');
            taskElement.classList.add('task-item');
            if (task.completed) taskElement.classList.add('completed');
            taskElement.dataset.id = task.id;

            taskElement.innerHTML = `
                <div class="task-content">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} aria-label="${translations.completeTaskAria || 'Mark as completed'}">
                    <span>${task.text}</span>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit-btn" aria-label="${translations.editTaskAria || 'Edit task'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button class="action-btn delete-btn" aria-label="${translations.deleteTaskAria || 'Delete task'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            `;
            taskList.appendChild(taskElement);
        });

        updateTaskCount();
        updateProgress();
    }

    /**
     * Ajoute une nouvelle tâche.
     */
    function addTask(text) {
        if (text.trim() === '') return;
        const newTask = { id: Date.now(), text: text, completed: false };
        tasks.push(newTask);
        saveTasks();
        renderTasks();
    }

    function toggleTask(id) {
        tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
        saveTasks();
        renderTasks();
    }

    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
    }

    function editTask(id, newText) {
        if (newText.trim() === '') return;
        tasks = tasks.map(task => task.id === id ? { ...task, text: newText } : task);
        saveTasks();
        renderTasks();
    }

    function enterEditMode(taskElement) {
        const span = taskElement.querySelector('.task-content span');
        const currentText = span.textContent;
        const taskId = Number(taskElement.dataset.id);

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentText;
        input.classList.add('task-input'); // Reuse some styles
        input.style.padding = '4px 8px';
        input.style.fontSize = '0.95rem';

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') editTask(taskId, input.value);
            else if (e.key === 'Escape') renderTasks();
        });

        span.replaceWith(input);
        input.focus();
        input.select();
    }

    function updateTaskCount() {
        const activeTasks = tasks.filter(task => !task.completed).length;
        const taskString = (
            (activeTasks === 1 ? translations.taskRemaining : translations.tasksRemaining)
            || (activeTasks === 1 ? 'task remaining' : 'tasks remaining')
        );
        taskCounter.textContent = `${activeTasks} ${taskString}`;
        
        // Hide/Show Clear Completed button
        const hasCompleted = tasks.some(t => t.completed);
        clearCompletedBtn.style.display = hasCompleted ? 'block' : 'none';
    }

    function applyTheme() {
        if (currentTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeSwitch.checked = true;
        } else {
            document.body.classList.remove('dark-theme');
            themeSwitch.checked = false;
        }
    }

    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        applyTheme();
    }

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
        renderTasks();
    }

    async function populateLanguageOptions() {
        customOptions.innerHTML = '';
        
        // Fetch all language names in parallel for better performance
        const langPromises = availableLanguages.map(async (langCode) => {
            try {
                const response = await fetch(`lang/${langCode}.json`);
                if (!response.ok) return { code: langCode, name: langCode };
                const data = await response.json();
                return { code: langCode, name: data.languageName || langCode };
            } catch {
                return { code: langCode, name: langCode };
            }
        });

        const langResults = await Promise.all(langPromises);

        langResults.forEach(lang => {
            const option = document.createElement('span');
            option.classList.add('custom-option');
            option.dataset.value = lang.code;
            option.textContent = lang.name;
            customOptions.appendChild(option);
        });

        updateSelectTriggerText(currentLang);
    }

    function updateSelectTriggerText(lang) {
        const selectedOption = document.querySelector(`.custom-option[data-value="${lang}"]`);
        if (selectedOption) {
            customSelectTrigger.querySelector('span').textContent = selectedOption.textContent;
        }
    }

    async function setLanguage(lang) {
        if (!availableLanguages.includes(lang)) lang = 'en';
        currentLang = lang;
        localStorage.setItem('lang', lang);
        try {
            const response = await fetch(`lang/${lang}.json`);
            translations = await response.json();
            applyLanguage();
            updateSelectTriggerText(lang);
        } catch (error) { console.error(error); }
    }

    function switchView(viewId) {
        views.forEach(view => view.classList.remove('active-view'));
        const activeView = document.getElementById(viewId);
        if (activeView) activeView.classList.add('active-view');
        document.querySelectorAll('.app-nav .nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === viewId);
        });
    }

    // ------------------- //
    // ÉCOUTEURS D'ÉVÉNEMENTS //
    // ------------------- //
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addTask(taskInput.value);
        taskInput.value = '';
    });

    taskList.addEventListener('click', (e) => {
        const taskElement = e.target.closest('.task-item');
        if (!taskElement) return;
        const taskId = Number(taskElement.dataset.id);

        if (e.target.closest('.delete-btn')) {
            taskElement.style.opacity = '0';
            taskElement.style.transform = 'translateX(20px)';
            setTimeout(() => deleteTask(taskId), 300);
        } else if (e.target.closest('.edit-btn')) {
            enterEditMode(taskElement);
        } else {
            toggleTask(taskId);
        }
    });

    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(t => !t.completed);
        saveTasks();
        renderTasks();
    });

    filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-btn');
        if (btn) {
            currentFilter = btn.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b === btn));
            renderTasks();
        }
    });

    themeSwitch.addEventListener('change', toggleTheme);
    navContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.nav-btn');
        if (btn) switchView(btn.dataset.view);
    });

    customSelectTrigger.addEventListener('click', () => customSelect.classList.toggle('open'));
    customOptions.addEventListener('click', (e) => {
        const opt = e.target.closest('.custom-option');
        if (opt) {
            customSelect.classList.remove('open');
            setLanguage(opt.dataset.value);
        }
    });

    window.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) customSelect.classList.remove('open');
    });

    async function initialize() {
        try {
            const response = await fetch('lang/languages.json');
            availableLanguages = await response.json();
        } catch { availableLanguages = ['en']; }
        await populateLanguageOptions();
        await setLanguage(currentLang);
        applyTheme();
    }

    initialize();
});
