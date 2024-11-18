// File frontend/js/quiz.js

const quizModule = {
    async loadQuiz(labId) {
        try {
            const response = await fetch(`http://localhost:5000/api/quiz/${labId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch quiz');
            }

            const questions = await response.json();
            this.renderQuiz(questions);
        } catch (error) {
            console.error('Error loading quiz:', error);
        }
    },

    renderQuiz(questions) {
        const container = document.getElementById('quiz-container');
        if (!container) return;

        const html = `
            <form id="quiz-form">
                ${this.renderMultipleChoice(questions.multiple_choice)}
                ${this.renderShortAnswer(questions.short_answer)}
                <button type="submit" class="submit-quiz">Kirim Jawaban</button>
            </form>
        `;

        container.innerHTML = html;
        
        // Add submit handler
        document.getElementById('quiz-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    },

    renderMultipleChoice(questions) {
        if (!questions?.length) return '';
        
        return `
            <div class="multiple-choice-section">
                <h4>Pilihan Ganda</h4>
                ${questions.map((q, idx) => `
                    <div class="question-container">
                        <p class="question">${idx + 1}. ${q.question}</p>
                        <div class="options">
                            ${q.options.map((option, optIdx) => `
                                <div class="option">
                                    <input type="radio" 
                                           id="mc-${q.id}-${optIdx}" 
                                           name="mc-${q.id}" 
                                           value="${optIdx + 1}">
                                    <label for="mc-${q.id}-${optIdx}">${option}</label>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    renderShortAnswer(questions) {
        if (!questions?.length) return '';
        
        return `
            <div class="short-answer-section">
                <h4>Isian Singkat</h4>
                ${questions.map((q, idx) => `
                    <div class="question-container">
                        <p class="question">${idx + 1}. ${q.question}</p>
                        <input type="text" 
                               class="short-answer-input"
                               name="sa-${q.id}"
                               placeholder="Jawaban Anda">
                    </div>
                `).join('')}
            </div>
        `;
    },

    handleSubmit: async function() {
        try {
            // Collect answers
            const answers = {
                multiple_choice: [],
                short_answer: []
            };
    
            // Get multiple choice answers
            const mcQuestions = document.querySelectorAll('.multiple-choice-section .question-container');
            mcQuestions.forEach((q, idx) => {
                const selected = q.querySelector('input[type="radio"]:checked');
                answers.multiple_choice[idx] = selected ? parseInt(selected.value) : null;
            });

            // Get short answer responses
            const saQuestions = document.querySelectorAll('.short-answer-section .question-container');
            saQuestions.forEach((q, idx) => {
                const input = q.querySelector('.short-answer-input');
                answers.short_answer[idx] = input ? input.value.trim() : '';
            });
    
            const response = await fetch('http://localhost:5000/api/quiz/quadratic/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ answers })
            });
    
            if (!response.ok) {
                throw new Error('Failed to submit quiz');
            }
    
            const result = await response.json();
            
            // Display result
            const resultContainer = document.getElementById('quiz-result');
            if (resultContainer) {
                resultContainer.innerHTML = `
                    <div class="result-message ${result.passed ? 'success' : 'error'}">
                        <h4>Laporan Hasil</h4>
                        <p>Skor: ${result.score}/17</p>
                        <p>Percobaan ke-${result.attempts}</p>
                        ${result.passed ? 
                            '<p class="success">Selamat, Anda telah lulus kuis ini!</p>' : 
                            '<p class="error">Mohon maaf, Anda belum lulus kuis ini.</p>'}
                    </div>
                `;
                resultContainer.style.display = 'block';
            }
    
            if (result.passed) {
                await window.labModule.saveProgress({ 
                    quiz_data: { 
                        answers,
                        score: result.score,
                        passed: result.passed
                    }
                });
            }
        } catch (error) {
            console.error('Quiz submission error:', error);
            window.labModule.showMessage('Failed to submit quiz', 'error');
        }
    },

    showResults(result) {
        const resultContainer = document.getElementById('quiz-result');
        if (!resultContainer) return;

        resultContainer.innerHTML = `
            <div class="quiz-result ${result.passed ? 'success' : 'error'}">
                <h4>${result.message}</h4>
                ${result.passed ? '' : '<button class="retry-quiz" onclick="location.reload()">Try Again</button>'}
            </div>
        `;
        resultContainer.style.display = 'block';
    }
};

window.quizModule = quizModule;