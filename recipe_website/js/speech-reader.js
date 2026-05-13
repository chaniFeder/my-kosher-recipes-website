const SpeechReader = (function() {
    const synth = window.speechSynthesis;
    let instructionElements = []; 
    let currentStepIndex = 0;
    let isPaused = false;
    let delayTime = 3000; 
    let hebrewVoice = null; 

    let updateButtonsCallback = () => {}; 
    
    if (synth) {
        const loadVoices = () => {
            const voices = synth.getVoices();
            hebrewVoice = voices.find(voice => voice.lang === 'he-IL' || voice.lang === 'he');
        };
        synth.onvoiceschanged = loadVoices;
        loadVoices(); 
    }


    function setDelay(ms) {
        delayTime = ms;
    }

    function setUpdateButtonsCallback(callback) {
        updateButtonsCallback = callback;
    }

    function clearHighlight() {
        if (instructionElements && instructionElements.length > 0) {
            instructionElements.forEach(el => el.classList.remove('highlight-step'));
        }
    }

    function highlightStep(element) {
        clearHighlight();
        element.classList.add('highlight-step');
    }

    function readInstructions() {
        if (!instructionElements || instructionElements.length === 0) return;

        if (currentStepIndex < instructionElements.length) {
            const element = instructionElements[currentStepIndex];
            const textToRead = element.textContent; 

            highlightStep(element);

            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.voice = hebrewVoice;

            utterance.onend = () => {
                currentStepIndex++;
                
                setTimeout(readInstructions, delayTime); 
            };

            synth.speak(utterance);
        } else {
            stopReading();
        }
    }

    function startReading(startStepIndex = 0) {
        if (!synth) {
            alert('שגיאה: דפדפן זה אינו תומך בהקראה קולית.');
            return;
        }
        
        if (currentStepIndex !== startStepIndex || !isPaused) {
            synth.cancel();
            isPaused = false;
            currentStepIndex = startStepIndex;
            readInstructions();
        } else if (isPaused) {
            isPaused = false;
            synth.resume();
        } 
        
        updateButtonsCallback('reading');
    }

    function pauseReading() {
        if (synth.speaking) {
            synth.pause();
            isPaused = true;
            updateButtonsCallback('paused');
        }
    }

    function stopReading() {
        if (synth.speaking) {
            synth.cancel();
        }
        isPaused = false;
        currentStepIndex = 0;
        clearHighlight();
        updateButtonsCallback('stopped');
    }

    function setInstructions(elements) {
        instructionElements = elements;
        currentStepIndex = 0;
        isPaused = false;
        clearHighlight();
    }

    return {
        setInstructions: setInstructions,
        start: startReading,
        pause: pauseReading,
        stop: stopReading,
        setDelay: setDelay,
        setUpdateButtonsCallback: setUpdateButtonsCallback,
        get isReading() {
            return synth.speaking && !isPaused;
        }
    };
})();