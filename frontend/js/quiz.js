// File: frontend/js/quiz.js

// Define quizModule globally
window.quizModule = {
  state: {
      isQuizInProgress: false,
      quizResults: null,
      currentAnswers: null
  },

  getQuizData() {
      return {
          answers: this.state.currentAnswers,
          score: this.state.quizResults?.score || null,
          passed: this.state.quizResults?.passed || false
      };
  },

  async loadQuiz(labId) {
      try {
          console.log('Loading quiz for lab:', labId);
          const response = await fetch(`http://localhost:5000/api/quiz/quadratic`);
          
          if (!response.ok) {
              throw new Error('Failed to load quiz');
          }
          
          const questions = await response.json();
          this.renderQuiz(questions);
      } catch (error) {
          console.error('Error loading quiz:', error);
          this.showError('Gagal memuat kuis. Silakan coba lagi.');
      }
  },

  renderQuiz(questions) {
      const quizContainer = document.getElementById('quiz-container');
      if (!quizContainer) {
          console.error('Quiz container not found');
          return;
      }

      const html = this.generateQuizHTML(questions);
      quizContainer.innerHTML = html;
      this.attachQuizListeners();
  },

  generateQuizHTML(questions) {
      return `
          <div class="quiz-section">
              <h3>Kuis Pemahaman</h3>
              <form id="quiz-form">
                  ${this.generateMultipleChoiceHTML(questions.multiple_choice)}
                  ${this.generateShortAnswerHTML(questions.short_answer)}
                  <div class="quiz-controls">
                      <button type="submit" class="submit-quiz">Submit Jawaban</button>
                  </div>
              </form>
          </div>
      `;
  },

  generateMultipleChoiceHTML(questions) {
      return `
          <div class="multiple-choice-section">
              <h4>Pilihan Ganda</h4>
              ${questions.map((q, index) => `
                  <div class="question-container">
                      <p class="question">${index + 1}. ${q.question}</p>
                      <div class="options">
                          ${q.options.map((option, optIndex) => `
                              <div class="option">
                                  <input type="radio" 
                                         name="mc-${index}" 
                                         id="mc-${index}-${optIndex}"
                                         value="${optIndex}">
                                  <label for="mc-${index}-${optIndex}">${option}</label>
                              </div>
                          `).join('')}
                      </div>
                  </div>
              `).join('')}
          </div>
      `;
  },

  generateShortAnswerHTML(questions) {
      return `
          <div class="short-answer-section">
              <h4>Isian Singkat</h4>
              ${questions.map((q, index) => `
                  <div class="question-container">
                      <p class="question">${index + 1}. ${q.question}</p>
                      <input type="text" 
                             name="sa-${index}" 
                             class="short-answer-input" 
                             placeholder="Ketik jawaban Anda">
                  </div>
              `).join('')}
          </div>
      `;
  },

  attachQuizListeners() {
      const form = document.getElementById('quiz-form');
      if (form) {
          form.addEventListener('submit', (e) => this.handleSubmit(e));
      }
  },

  async handleSubmit(event) {
      event.preventDefault();
      const answers = this.collectAnswers();
      this.state.currentAnswers = answers;
      
      try {
          const result = await window.quizDataModule.submitQuizAnswers('quadratic', answers);
          this.state.quizResults = result;
          this.showQuizResult(result);
      } catch (error) {
          console.error('Error submitting quiz:', error);
          this.showError('Gagal mengirim jawaban. Silakan coba lagi.');
      }
  },

  collectAnswers() {
      const form = document.getElementById('quiz-form');
      const multipleChoiceAnswers = [];
      const shortAnswers = [];

      // Collect multiple choice answers
      const mcInputs = form.querySelectorAll('[name^="mc-"]');
      mcInputs.forEach(input => {
          if (input.checked) {
              const index = input.name.split('-')[1];
              multipleChoiceAnswers[index] = parseInt(input.value);
          }
      });

      // Collect short answers
      const saInputs = form.querySelectorAll('[name^="sa-"]');
      saInputs.forEach(input => {
          const index = input.name.split('-')[1];
          shortAnswers[index] = input.value.trim();
      });

      return {
          multiple_choice: multipleChoiceAnswers,
          short_answer: shortAnswers
      };
  },

  showQuizResult(result) {
      const quizContainer = document.getElementById('quiz-container');
      const html = `
          <div class="quiz-result">
              <h3>Hasil Kuis</h3>
              <p class="score">Nilai: ${result.score}/17</p>
              <p class="status">${result.passed ? 
                  'Selamat! Anda telah lulus kuis ini.' : 
                  'Maaf, Anda belum lulus kuis ini.'}</p>
              <p class="attempts">Jumlah percobaan: ${result.attempts}</p>
              ${!result.passed ? `
                  <button onclick="quizModule.loadQuiz('quadratic')" class="retry-quiz">
                      Coba Lagi
                  </button>
              ` : ''}
          </div>
      `;
      quizContainer.innerHTML = html;
  },

  showError(message) {
      const quizContainer = document.getElementById('quiz-container');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'quiz-error';
      errorDiv.textContent = message;
      
      quizContainer.insertBefore(errorDiv, quizContainer.firstChild);
      setTimeout(() => errorDiv.remove(), 5000);
  }
};