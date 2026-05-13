let currentUser = null; 
let firstInstructionIndex = 0; 
let currentRecipeId = null; 

let loginForm = null; 
let usernameInput = null; 
let passwordInput = null; 
let errorMessage = null; 

let registerForm = null; 
let regUsernameInput = null; 
let regPasswordInput = null; 
let regPasswordConfirmInput = null; 
let regDelayTimeInput = null; 
let regThemeLightInput = null; 
let regThemeDarkInput = null; 
let registerErrorMessage = null; 

let settingsForm = null; 
let delayTimeInput = null;
let themeLightInput = null;
let themeDarkInput = null;

let recipesContainer = null;
let categoryFilter = null;
let searchInput = null;
let noRecipesMessage = null;
let addRecipeBtn = null; 
let listMessageArea = null; 

let recipeTitleElement = null;
let recipeAuthorElement = null;
let recipeCategoryElement = null;
let recipeDescriptionElement = null;
let ingredientsListElement = null;
let instructionsListElement = null;
let startReadingBtn = null;
let stopReadingBtn = null;
let deleteRecipeBtn = null; 

let addRecipeForm = null;
let addRecipeTitleInput = null;
let addRecipeCategorySelect = null;
let newCategoryGroup = null; 
let newCategoryInput = null; 
let addRecipeDescriptionTextarea = null;
let addRecipeIngredientsTextarea = null;
let addRecipeInstructionsTextarea = null;
let addRecipeErrorMessage = null;


function navigateToScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    if (screenId === 'recipe-list-screen') {
        if (searchInput && categoryFilter) {
            searchInput.value = ''; 
            // 💡 תיקון 1: איפוס מפורש של פילטר הקטגוריות
            categoryFilter.value = 'all';
        }
        renderRecipeList();
    } else if (screenId === 'settings-screen') {
        loadSettingsToForm();
    } else if (screenId === 'add-recipe-screen') {
        populateCategoriesForAddForm();
        if (addRecipeErrorMessage) {
            addRecipeErrorMessage.textContent = '';
        }
    } else if (screenId === 'login-screen') {
        if (errorMessage) {
            errorMessage.textContent = '';
        }
        if (registerErrorMessage) {
            registerErrorMessage.textContent = '';
        }
    }
    
    if (screenId !== 'recipe-view-screen' && typeof SpeechReader !== 'undefined') {
        SpeechReader.stop();
    }
}

function applyTheme(theme) {
    const body = document.body;
    if (theme === 'dark') {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
    } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
    }
}

function showListMessage(message, type) {
    if (!listMessageArea) return;
    
    listMessageArea.textContent = message;
    listMessageArea.className = 'message-area'; 
    listMessageArea.classList.add(type + '-message');
    listMessageArea.style.display = 'block';

    setTimeout(() => {
        listMessageArea.style.display = 'none';
        listMessageArea.textContent = '';
    }, 3000);
}


function handleLogin(e) {
    e.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    const user = authenticateUser(username, password);

    if (user) {
        currentUser = user;
        applyTheme(currentUser.settings.theme);
        if (typeof SpeechReader !== 'undefined') {
            SpeechReader.setDelay(currentUser.settings.delayTime);
        }
        navigateToScreen('recipe-list-screen');
    } else {
        errorMessage.textContent = 'שם משתמש או סיסמא שגויים.';
    }
}

function handleLogout() {
    currentUser = null;
    currentRecipeId = null; 
    applyTheme('light'); 
    navigateToScreen('login-screen');
}

function handleRegister(e) {
    e.preventDefault();
    registerErrorMessage.textContent = '';

    const username = regUsernameInput.value.trim();
    const password = regPasswordInput.value;
    const passwordConfirm = regPasswordConfirmInput.value;
    const delayTime = parseFloat(regDelayTimeInput.value) * 1000; 
    const theme = regThemeLightInput.checked ? 'light' : 'dark'; 

    if (password !== passwordConfirm) {
        registerErrorMessage.textContent = 'אישור הסיסמא אינו תואם.';
        return;
    }
    
    if (isUsernameTaken(username)) {
        registerErrorMessage.textContent = 'שם משתמש זה תפוס. אנא בחר שם אחר.';
        return;
    }

    const initialSettings = {
        delayTime: delayTime, 
        theme: theme 
    };

    const newUser = saveNewUser(username, password, initialSettings);
    
    if (newUser) {
        currentUser = newUser;
        applyTheme(currentUser.settings.theme);
        if (typeof SpeechReader !== 'undefined') {
            SpeechReader.setDelay(currentUser.settings.delayTime);
        }
        navigateToScreen('recipe-list-screen');
    } else {
        registerErrorMessage.textContent = 'שגיאה ברישום המשתמש.';
    }
}

function loadSettingsToForm() {
    if (!currentUser) return;

    delayTimeInput.value = (currentUser.settings.delayTime / 1000).toFixed(1);

    if (currentUser.settings.theme === 'dark') {
        themeDarkInput.checked = true;
    } else {
        themeLightInput.checked = true;
    }
}

function handleSettingsSubmit(e) {
    e.preventDefault();
    if (!currentUser) return;

    const newDelayTime = parseFloat(delayTimeInput.value) * 1000; 
    const newTheme = document.querySelector('input[name="theme"]:checked').value;
    
    const newSettings = {
        delayTime: newDelayTime,
        theme: newTheme
    };

    const success = updateUserSettings(currentUser.username, newSettings);
    
    if (success) {
        currentUser.settings = newSettings;
        applyTheme(newSettings.theme);
        
        if (typeof SpeechReader !== 'undefined') {
            SpeechReader.setDelay(newDelayTime);
        }
        
        navigateToScreen('recipe-list-screen');
        showListMessage('ההגדרות נשמרו בהצלחה!', 'success');
    } else {
        showListMessage('שגיאה בשמירת ההגדרות.', 'error');
    }
}


function populateCategoryFilter() {
    const allRecipes = loadRecipes();
    const categories = new Set(allRecipes.map(r => r.category));

    categoryFilter.innerHTML = '<option value="all">כל הקטגוריות</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

function renderRecipeList() {
    const previousCategory = categoryFilter.value; // 👈 שמור את הבחירה הקודמת לפני שמרנדרים
    populateCategoryFilter(); 

    // 👇 שחזור הבחירה אם היא עדיין קיימת
    if (previousCategory && [...categoryFilter.options].some(o => o.value === previousCategory)) {
        categoryFilter.value = previousCategory;
    } else {
        categoryFilter.value = 'all';
    }

    const allRecipes = loadRecipes();
    const selectedCategory = categoryFilter.value;
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    const filteredRecipes = allRecipes.filter(recipe => {
        const categoryMatch = selectedCategory === 'all' || recipe.category === selectedCategory;
        const searchMatch =
            !searchTerm ||
            recipe.title.toLowerCase().includes(searchTerm) ||
            recipe.description.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm));
        return categoryMatch && searchMatch;
    });

    recipesContainer.innerHTML = ''; 
    
    if (filteredRecipes.length === 0) {
        noRecipesMessage.style.display = 'block';
    } else {
        noRecipesMessage.style.display = 'none';
        
        filteredRecipes.forEach(recipe => {
            const card = document.createElement('div');
            card.classList.add('recipe-card');
            card.addEventListener('click', () => viewRecipe(recipe.id));

            card.innerHTML = `
                <span class="category-tag">${recipe.category}</span>
                <h3>${recipe.title}</h3>
                <p>${recipe.description}</p>
                <small>מאת: ${recipe.author}</small>
            `;
            recipesContainer.appendChild(card);
        });
    }
}


function viewRecipe(id) {
    const recipe = getRecipeById(id);

    if (recipe) {
        currentRecipeId = id; 

        recipeTitleElement.textContent = recipe.title;
        recipeAuthorElement.textContent = recipe.author;
        recipeCategoryElement.textContent = recipe.category;
        recipeDescriptionElement.textContent = recipe.description;

        ingredientsListElement.innerHTML = recipe.ingredients.map(ing => `<li>${ing}</li>`).join('');
        
        instructionsListElement.innerHTML = recipe.instructions.map((ins, index) => 
            `<li data-step-index="${index}" onclick="startReadingFromStep(${index})">${ins}</li>`
        ).join('');
        
        updateSpeechButtons('stopped');
        
        navigateToScreen('recipe-view-screen');

        if (typeof SpeechReader !== 'undefined') {
            const descriptionElement = document.getElementById('recipe-description');
            
            const readingElements = [];

            const descHeader = document.createElement('div');
            descHeader.textContent = "תקציר. " + descriptionElement.textContent;
            descHeader.classList.add('voice-step-element');
            readingElements.push(descHeader);

            const ingHeader = document.createElement('div');
            ingHeader.textContent = "חומרים. "; 
            ingHeader.classList.add('voice-step-element');
            readingElements.push(ingHeader);
            
            const ingredients = Array.from(ingredientsListElement.querySelectorAll('li'));
            ingredients.forEach(el => readingElements.push(el));
            
            const instHeader = document.createElement('div');
            instHeader.textContent = "אופן ההכנה. ";
            instHeader.classList.add('voice-step-element');
            readingElements.push(instHeader);
            
            firstInstructionIndex = readingElements.length; 
            
            const instructions = Array.from(instructionsListElement.querySelectorAll('li'));
            instructions.forEach(el => readingElements.push(el));

            SpeechReader.setInstructions(readingElements);
        }
        
    } else {
        showListMessage('שגיאה: המתכון לא נמצא.', 'error');
        navigateToScreen('recipe-list-screen');
    }
}

function handleStartPauseClick() {
    if (typeof SpeechReader === 'undefined' || !instructionsListElement) return;

    const instructionElements = Array.from(instructionsListElement.querySelectorAll('li'));
    if (instructionElements.length === 0) {
        startReadingBtn.textContent = 'אין הוראות';
        setTimeout(() => updateSpeechButtons('stopped'), 1500);
        return;
    }
    
    if (startReadingBtn.textContent.includes('התחל') || startReadingBtn.textContent.includes('המשך')) {
        SpeechReader.start(1); 
    } else if (startReadingBtn.textContent.includes('השהה')) {
        SpeechReader.pause();
    }
}

function startReadingFromStep(stepIndex) {
    if (typeof SpeechReader !== 'undefined' && instructionsListElement) {
        const adjustedIndex = firstInstructionIndex + stepIndex; 
        
        SpeechReader.start(adjustedIndex); 
    }
}


function updateSpeechButtons(status) {
    if (!startReadingBtn || !stopReadingBtn) return;

    if (status === 'reading') {
        startReadingBtn.textContent = '⏸️ השהה הקראה';
        startReadingBtn.classList.remove('primary-btn');
        startReadingBtn.classList.add('secondary-btn');
        stopReadingBtn.disabled = false;
    } else if (status === 'paused') {
        startReadingBtn.textContent = '▶️ המשך הקראה';
        startReadingBtn.classList.remove('secondary-btn');
        startReadingBtn.classList.add('primary-btn');
        stopReadingBtn.disabled = false;
    } else if (status === 'stopped') {
        startReadingBtn.textContent = '▶️ התחל הקראה';
        startReadingBtn.classList.remove('secondary-btn');
        startReadingBtn.classList.add('primary-btn');
        stopReadingBtn.disabled = true;
    }
}

function handleDeleteRecipe() {
    if (!currentRecipeId) {
        showListMessage('שגיאה: לא נבחר מתכון למחיקה.', 'error');
        return;
    }

    if (confirm('האם אתה בטוח שברצונך למחוק מתכון זה? פעולה זו היא בלתי הפיכה.')) {
        
        const success = deleteRecipe(currentRecipeId); 
        
        if (success) {
            if (typeof SpeechReader !== 'undefined') {
                SpeechReader.stop();
            }
            
            currentRecipeId = null; 
            navigateToScreen('recipe-list-screen');
            showListMessage('המתכון נמחק בהצלחה!', 'success');
        } else {
            showListMessage('שגיאה: המחיקה נכשלה.', 'error');
        }
    }
}

function populateCategoriesForAddForm() {
    const allRecipes = loadRecipes();
    const categories = new Set(allRecipes.map(r => r.category));

    addRecipeCategorySelect.innerHTML = '<option value="" disabled selected>בחר קטגוריה</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        addRecipeCategorySelect.appendChild(option);
    });
    
    const newOption = document.createElement('option');
    newOption.value = 'New';
    newOption.textContent = '--- קטגוריה חדשה ---';
    addRecipeCategorySelect.appendChild(newOption);

    toggleNewCategoryInput();
}

function toggleNewCategoryInput() {
    if (addRecipeCategorySelect.value === 'New') {
        newCategoryGroup.style.display = 'block';
        newCategoryInput.setAttribute('required', 'required');
    } else {
        newCategoryGroup.style.display = 'none';
        newCategoryInput.removeAttribute('required');
        newCategoryInput.value = ''; 
    }
}

function handleAddRecipe(e) {
    e.preventDefault();
    addRecipeErrorMessage.textContent = '';
    
    if (!currentUser) {
        addRecipeErrorMessage.textContent = 'שגיאה: יש להתחבר כדי להוסיף מתכון.';
        return;
    }

    const title = addRecipeTitleInput.value.trim();
    
    let category = addRecipeCategorySelect.value;
    
    if (category === 'New') {
        category = newCategoryInput.value.trim();
        if (!category) {
            addRecipeErrorMessage.textContent = 'אנא הזן שם לקטגוריה החדשה.';
            return;
        }
    } else if (!category) {
        addRecipeErrorMessage.textContent = 'אנא בחר קטגוריה קיימת או הוסף קטגוריה חדשה.';
        return;
    }
    
    const description = addRecipeDescriptionTextarea.value.trim();
    const ingredients = addRecipeIngredientsTextarea.value.split('\n').map(item => item.trim()).filter(item => item !== '');
    const instructions = addRecipeInstructionsTextarea.value.split('\n').map(item => item.trim()).filter(item => item !== '');

    if (!title || !category || !description || ingredients.length === 0 || instructions.length === 0) {
        addRecipeErrorMessage.textContent = 'אנא מלא את כל השדות בצורה תקינה (כולל לפחות מרכיב והוראה אחת).';
        return;
    }
    
    const recipeData = {
        title: title,
        category: category,
        author: currentUser.username, 
        description: description,
        ingredients: ingredients,
        instructions: instructions
    };
    
    const success = saveNewRecipe(recipeData);

    if (success) {
        addRecipeForm.reset(); 
        navigateToScreen('recipe-list-screen');
        showListMessage('המתכון נשמר בהצלחה!', 'success');
    } else {
        addRecipeErrorMessage.textContent = 'אירעה שגיאה בשמירת המתכון.';
    }
}


function initializeApp() {
    loginForm = document.getElementById('login-form');
    usernameInput = document.getElementById('username');
    passwordInput = document.getElementById('password');
    errorMessage = document.getElementById('login-error-message');
    
    settingsForm = document.getElementById('settings-form');
    delayTimeInput = document.getElementById('delay-time');
    themeLightInput = document.getElementById('theme-light');
    themeDarkInput = document.getElementById('theme-dark');
    
    registerForm = document.getElementById('register-form');
    regUsernameInput = document.getElementById('reg-username');
    regPasswordInput = document.getElementById('reg-password');
    regPasswordConfirmInput = document.getElementById('reg-password-confirm');
    regDelayTimeInput = document.getElementById('reg-delay-time');
    regThemeLightInput = document.getElementById('reg-theme-light'); 
    regThemeDarkInput = document.getElementById('reg-theme-dark'); 
    registerErrorMessage = document.getElementById('register-error-message');
    
    recipesContainer = document.getElementById('recipes-container');
    categoryFilter = document.getElementById('category-filter');
    searchInput = document.getElementById('search-input');
    noRecipesMessage = document.getElementById('no-recipes-message');
    addRecipeBtn = document.getElementById('add-recipe-btn'); 
    listMessageArea = document.getElementById('list-message-area'); 

    recipeTitleElement = document.getElementById('recipe-title');
    recipeAuthorElement = document.getElementById('recipe-author');
    recipeCategoryElement = document.getElementById('recipe-category');
    recipeDescriptionElement = document.getElementById('recipe-description');
    ingredientsListElement = document.getElementById('recipe-ingredients-list');
    instructionsListElement = document.getElementById('recipe-instructions-list');
    startReadingBtn = document.getElementById('start-reading-btn');
    stopReadingBtn = document.getElementById('stop-reading-btn');
    deleteRecipeBtn = document.getElementById('delete-recipe-btn'); 

    addRecipeForm = document.getElementById('add-recipe-form');
    addRecipeTitleInput = document.getElementById('add-recipe-title');
    addRecipeCategorySelect = document.getElementById('add-recipe-category');
    newCategoryGroup = document.getElementById('new-category-group'); 
    newCategoryInput = document.getElementById('new-category-input'); 
    addRecipeDescriptionTextarea = document.getElementById('add-recipe-description');
    addRecipeIngredientsTextarea = document.getElementById('add-recipe-ingredients');
    addRecipeInstructionsTextarea = document.getElementById('add-recipe-instructions');
    addRecipeErrorMessage = document.getElementById('add-recipe-error-message');
    
    if (typeof initializeData !== 'undefined') {
        initializeData(); 
    }
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (settingsForm) settingsForm.addEventListener('submit', handleSettingsSubmit);
    if (registerForm) registerForm.addEventListener('submit', handleRegister); 
    if (addRecipeForm) addRecipeForm.addEventListener('submit', handleAddRecipe);

    if (startReadingBtn) startReadingBtn.addEventListener('click', handleStartPauseClick);
    if (stopReadingBtn && typeof SpeechReader !== 'undefined') {
        stopReadingBtn.addEventListener('click', SpeechReader.stop);
    }
    if (deleteRecipeBtn) deleteRecipeBtn.addEventListener('click', handleDeleteRecipe); 
    
    if (typeof SpeechReader !== 'undefined') {
         SpeechReader.setUpdateButtonsCallback(updateSpeechButtons);
    }
   
    if (categoryFilter) categoryFilter.addEventListener('change', renderRecipeList);
    if (searchInput) searchInput.addEventListener('input', renderRecipeList);
    if (addRecipeBtn) addRecipeBtn.addEventListener('click', () => navigateToScreen('add-recipe-screen'));
    if (addRecipeCategorySelect) addRecipeCategorySelect.addEventListener('change', toggleNewCategoryInput);


    navigateToScreen('login-screen');
}

document.addEventListener('DOMContentLoaded', initializeApp);