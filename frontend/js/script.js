// File frontend/js/script.js

const debugLog = (area, message, data) => {
    console.group(`Debug: ${area}`);
    console.log(message);
    if (data) console.log('Data:', data);
    console.groupEnd();
};

async function fetchAndDisplayUserName() {
    try {
      const userNameElement = document.getElementById('user-name');
      if (!userNameElement) return;
      
      const name = await window.api.getUserName();
      userNameElement.textContent = name;
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  }

document.addEventListener('DOMContentLoaded', fetchAndDisplayUserName);

const labModule = {
    // Initial state
    state: {
        coefficients: {
            a: 1,
            b: 0,
            c: 0
        },
        graphState: {
            scale: 1,
            offsetX: 0,
            offsetY: 0
        }
    },

    // Initialize the module
    init() {
        console.log('Initializing lab module...');
        
        // Load progress and set up other event listeners
        this.loadProgress().then(() => {
            this.setupEventListeners();
            console.log('Lab module initialized successfully');
        }).catch(error => {
            console.error('Failed to initialize lab module:', error);
            this.showMessage('Failed to initialize lab. Please refresh the page.', 'error');
        });
    },

    // Set up event listeners for all controls
    setupEventListeners() {
        // Coefficient A controls
        const coeffASlider = document.getElementById('coefficientA');
        const coeffAInput = document.getElementById('coefficientAValue');
        
        coeffASlider.addEventListener('input', (e) => {
            this.updateCoefficient('a', e.target.value);
            coeffAInput.value = e.target.value;
        });
        
        coeffAInput.addEventListener('change', (e) => {
            const value = this.clampValue(e.target.value, -5, 5);
            this.updateCoefficient('a', value);
            coeffASlider.value = value;
            coeffAInput.value = value;
        });

        // Coefficient B controls
        const coeffBSlider = document.getElementById('coefficientB');
        const coeffBInput = document.getElementById('coefficientBValue');
        
        coeffBSlider.addEventListener('input', (e) => {
            this.updateCoefficient('b', e.target.value);
            coeffBInput.value = e.target.value;
        });
        
        coeffBInput.addEventListener('change', (e) => {
            const value = this.clampValue(e.target.value, -5, 5);
            this.updateCoefficient('b', value);
            coeffBSlider.value = value;
            coeffBInput.value = value;
        });

        // Coefficient C controls
        const coeffCSlider = document.getElementById('coefficientC');
        const coeffCInput = document.getElementById('coefficientCValue');
        
        coeffCSlider.addEventListener('input', (e) => {
            this.updateCoefficient('c', e.target.value);
            coeffCInput.value = e.target.value;
        });
        
        coeffCInput.addEventListener('change', (e) => {
            const value = this.clampValue(e.target.value, -5, 5);
            this.updateCoefficient('c', value);
            coeffCSlider.value = value;
            coeffCInput.value = value;
        });

        // Save progress button
        const saveButton = document.getElementById('saveProgress');
        if (saveButton) {
            saveButton.addEventListener('click', () => this.saveProgress());
        }

        // Set up the event listener for the quiz form submission
        const quizForm = document.getElementById('quiz-form');
        if (quizForm) {
            quizForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleQuizSubmit();
            });
        }
    },

    // Update coefficient and redraw graph
    updateCoefficient(coeff, value) {
        debugLog('Coefficients', `Updating ${coeff} to ${value}`, this.state.coefficients);
        this.state.coefficients[coeff] = parseFloat(value);
        
        // Add error checking
        if (isNaN(this.state.coefficients[coeff])) {
            console.error('Invalid coefficient value');
            return;
        }
        
        debugLog('Graph Update', 'Updating equation with new values', this.state.coefficients);
        
        try {
            graphModule.updateEquation(
                this.state.coefficients.a,
                this.state.coefficients.b,
                this.state.coefficients.c
            );
            graphModule.draw();
        } catch (error) {
            console.error('Error updating graph:', error);
        }
    },

    // Clamp value between min and max
    clampValue(value, min, max) {
        const num = parseFloat(value);
        if (isNaN(num)) return 0;
        return Math.min(Math.max(num, min), max);
    },

    // Load saved progress from server
    async loadProgress() {
        try {
            const labId = 'quadratic';
            const progressData = await api.getProgress(labId);
            
            // Update state with validated data from API
            this.state = {
                ...this.state,
                coefficients: progressData.coefficients,
                graphState: progressData.graph_state,
                quiz_score: progressData.quiz_score,
                is_completed: progressData.quiz_score >= 10 // Derive completion status from quiz score
            };
            
            // Update UI and graph
            this.updateUIFromState();
            
            if (window.graphModule) {
                Object.assign(window.graphModule, progressData.graph_state);
                window.graphModule.draw();
            }
    
            return true;
        } catch (error) {
            console.error('Error loading progress:', error);
            this.showMessage(error.message || 'Failed to load progress', 'error');
            return false;
        }
    },

    // Save progress to server
    async saveProgress(quizData = null) {
        try {
            this.showLoading(true);
            console.log('Starting progress save...');
    
            const saveData = {
                labId: 'quadratic',
                coefficients: {
                    a: parseFloat(document.getElementById('coefficientAValue').value) || 0,
                    b: parseFloat(document.getElementById('coefficientBValue').value) || 0,
                    c: parseFloat(document.getElementById('coefficientCValue').value) || 0
                },
                graph_state: {
                    scale: graphModule.scale || 1,
                    offsetX: graphModule.offsetX || 0,
                    offsetY: graphModule.offsetY || 0
                }
            };
    
            // Add quiz data if present
            if (quizData) {
                saveData.quiz_answers = quizData.answers || null;
                saveData.quiz_score = quizData.score || null;
                saveData.completed_at = quizData.passed ? new Date().toISOString() : null;
                saveData.is_completed = Boolean(quizData.passed);
            }
    
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }
    
            const response = await fetch('http://localhost:5000/api/progress/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(saveData)
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save progress');
            }
    
            const result = await response.json();
            console.log('Save successful:', result);
    
            // Update the state and UI with the new completion status
            this.state.isCompleted = saveData.is_completed;
            this.updateUIFromState();
    
            this.showMessage('Progress berhasil disimpan', 'success');
    
        } catch (error) {
            console.error('Save progress error:', error);
            this.showMessage(error.message || 'Failed to save progress', 'error');
            throw error;
        } finally {
            this.showLoading(false);
        }
    },

    // Update UI controls from state
    updateUIFromState() {
        try {
            // Update coefficients
            ['a', 'b', 'c'].forEach(coeff => {
                const value = this.state.coefficients[coeff];
                const slider = document.getElementById(`coefficient${coeff.toUpperCase()}`);
                const input = document.getElementById(`coefficient${coeff.toUpperCase()}Value`);
                
                if (slider && input) {
                    slider.value = value;
                    input.value = value;
                }
            });
    
            // Update equation and graph
            if (window.graphModule) {
                window.graphModule.setCoefficients(
                    this.state.coefficients.a,
                    this.state.coefficients.b,
                    this.state.coefficients.c
                );
                window.graphModule.draw();
            }

            // Update completion status display
            const saveButton = document.getElementById('saveProgress');
            const existingBadge = document.querySelector('.completion-badge');
            
            if (this.state.is_completed) {
                if (saveButton) {
                    saveButton.classList.add('completed');
                }
                
                if (!existingBadge) {
                    const newBadge = document.createElement('div');
                    newBadge.className = 'completion-badge';
                    newBadge.textContent = '✓ Lulus';
                    document.querySelector('.lab-title')?.appendChild(newBadge);
                }
            } else {
                if (saveButton) {
                    saveButton.classList.remove('completed');
                }
                if (existingBadge) {
                    existingBadge.remove();
                }
            }
        } catch (error) {
            console.error('Error updating UI from state:', error);
            this.showMessage('Error updating display', 'error');
        }
    },

    // Show message to user
    showMessage(message, type = 'info') {
        const messageDisplay = document.getElementById('messageDisplay');
        if (messageDisplay) {
            messageDisplay.textContent = message;
            messageDisplay.className = `message ${type} show`;
            setTimeout(() => {
                messageDisplay.classList.remove('show');
            }, 3000);
        }
    },

    // Show/hide loading overlay
    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    },
};

const handleQuizSubmit = async () => {
    const quizData = await quizModule.getQuizData();
    if (quizData.passed) {
        await labModule.saveProgress(quizData);
    }
}

// Set up the event listener for the quiz form submission
const quizForm = document.getElementById('quiz-form');
if (quizForm) {
    quizForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleQuizSubmit();
    });
}

// Make labModule globally accessible
window.labModule = labModule;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing lab module...');
    // Initialize the labModule
    labModule.init();

    // Initialize the quizModule
    quizModule.loadQuiz('quadratic');
});

// Handle beforeunload event to warn about unsaved changes
window.addEventListener('beforeunload', (e) => {
    // Check if there are unsaved changes
    // This is a simple example - you might want to implement more sophisticated change tracking
    const currentState = {
        a: document.getElementById('coefficientAValue').value,
        b: document.getElementById('coefficientBValue').value,
        c: document.getElementById('coefficientCValue').value
    };

    if (JSON.stringify(currentState) !== JSON.stringify(labModule.state.coefficients)) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// Search bar functionality
const searchInput = document.getElementById('searchInput');
const labCards = document.querySelectorAll('.lab-card');

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    labCards.forEach((card) => {
        const title = card.querySelector('.lab-info h3').textContent.toLowerCase();
        if (title.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
});

// Lab card redirection and alert messages
function redirectToLab(labCard) {
    const labTitle = labCard.getAttribute('data-title');
    if (labTitle === 'Persamaan Kuadrat') {
        window.location.href = 'page-virtual-lab.html';
    } else {
        showAlert(labCard);
    }
}

function showAlert(labCard) {
    const labTitle = labCard.getAttribute('data-title');
    alert(`Lab virtual "${labTitle}" masih dalam tahap pembangunan.`);
}