// File: js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // All your existing script.js code here
  });

async function fetchAndDisplayUserName() {
    try {
      const response = await fetch('/api/user/name', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch user name');
      }
  
      const { name } = await response.json();
      document.getElementById('user-name').textContent = name;
    } catch (error) {
      console.error('Error fetching user name:', error);
      document.getElementById('user-name').textContent = 'Guest';
    }
  }
  
  window.addEventListener('DOMContentLoaded', fetchAndDisplayUserName);

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

function redirectToLab(labCard) {
    const labTitle = labCard.getAttribute('data-title');
    if (labTitle === 'Persamaan Kuadrat') {
        window.location.href = 'page-virtual-lab.html';
    } else {
        // Add logic for other lab cards
        showAlert(labCard);
    }
}

function showAlert(labCard) {
    const labTitle = labCard.getAttribute('data-title');
    alert(`Lab virtual "${labTitle}" masih dalam tahap pembangunan. Tolong periksa di lain waktu untuk pembaharuan di masa mendatang.`);
}

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
        this.setupEventListeners();
        this.loadProgress();
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
        saveButton.addEventListener('click', () => this.saveProgress());

        const quizForm = document.getElementById('quiz-form');
        if (quizForm) {
            quizForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleQuizSubmit();
            });
        }
        
        const retryQuizButton = document.getElementById('retry-quiz');
        if (retryQuizButton) {
            retryQuizButton.addEventListener('click', () => {
                quizModule.loadQuiz('quadratic');
            });
        }
    },

    // Update coefficient and redraw graph
    updateCoefficient(coeff, value) {
        this.state.coefficients[coeff] = parseFloat(value);
        graphModule.updateEquation(
            this.state.coefficients.a,
            this.state.coefficients.b,
            this.state.coefficients.c
        );
        graphModule.draw();
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
            const response = await fetch(`http://localhost:5000/api/progress/${labId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load progress');
            }

            const data = await response.json();
            
            // Update state with saved values
            if (data.coefficients) {
                this.state.coefficients = data.coefficients;
                this.updateUIFromState();
            }

            if (data.graph_state) {
                this.state.graphState = data.graph_state;
                graphModule.scale = data.graph_state.scale;
                graphModule.offsetX = data.graph_state.offsetX;
                graphModule.offsetY = data.graph_state.offsetY;
                graphModule.draw();
            }

            if (window.quizModule) {
                if (data.quiz_answers && data.quiz_score !== null) {
                    window.quizModule.showQuizResult({
                        score: data.quiz_score,
                        passed: data.quiz_score >= 10,
                        answers: data.quiz_answers
                    });
                } else {
                    window.quizModule.loadQuiz(labId);
                }
            }

        } catch (error) {
            console.error('Error loading progress:', error);
            this.showMessage('Gagal memuat progress sebelumnya', 'error');
        }
    },

    // Save progress to server
    async saveProgress() {
        try {
            this.showLoading(true);
    
            // Update graph state before saving
            this.state.graphState = {
                scale: graphModule.scale,
                offsetX: graphModule.offsetX,
                offsetY: graphModule.offsetY
            };
    
            // Get quiz data if available
            const quizData = window.quizModule ? window.quizModule.getQuizData() : null;
    
            const response = await fetch('http://localhost:5000/api/progress/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    labId: 'quadratic',
                    coefficients: this.state.coefficients,
                    graph_state: this.state.graphState,
                    quiz_answers: quizData?.answers || null,
                    quiz_score: quizData?.score || null,
                    completed_at: quizData?.passed ? new Date().toISOString() : null
                })
            });
    
            if (!response.ok) {
                throw new Error('Failed to save progress');
            }
    
            this.showMessage('Progress berhasil disimpan', 'success');
        } catch (error) {
            console.error('Error saving progress:', error);
            this.showMessage('Gagal menyimpan progress', 'error');
        } finally {
            this.showLoading(false);
        }
    },

    // Update UI controls from state
    updateUIFromState() {
        // Update sliders and inputs
        document.getElementById('coefficientA').value = this.state.coefficients.a;
        document.getElementById('coefficientAValue').value = this.state.coefficients.a;
        
        document.getElementById('coefficientB').value = this.state.coefficients.b;
        document.getElementById('coefficientBValue').value = this.state.coefficients.b;
        
        document.getElementById('coefficientC').value = this.state.coefficients.c;
        document.getElementById('coefficientCValue').value = this.state.coefficients.c;
    
        // Update equation display
        graphModule.updateEquation(
            this.state.coefficients.a,
            this.state.coefficients.b,
            this.state.coefficients.c
        );
    
        // Update quiz UI if module is available
        if (window.quizModule) {
            const quizData = window.quizModule.getQuizData();
            const quizContainer = document.getElementById('quiz-container');
            const quizResult = document.getElementById('quiz-result');
            
            if (quizContainer && quizResult) {
                if (quizData.passed) {
                    quizContainer.style.display = 'none';
                    quizResult.style.display = 'block';
                } else {
                    quizContainer.style.display = 'block';
                    quizResult.style.display = 'none';
                }
            }
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

    // Handle quiz submission
    async handleQuizSubmit() {
        const result = await quizModule.submitQuiz();
        if (result.passed) {
            await this.saveProgress();
        }
    }
};

// Make labModule globally accessible
window.labModule = labModule;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.labModule.init();
    
    // Initialize quiz if module is available
    if (window.quizModule && typeof window.quizModule.loadQuiz === 'function') {
        window.quizModule.loadQuiz('quadratic');
    }
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