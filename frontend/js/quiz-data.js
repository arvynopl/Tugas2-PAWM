window.quizModule = {
    currentQuiz: null,
  
    async loadQuiz(labId) {
      try {
        console.log('Loading quiz for:', labId);
        this.currentQuiz = {
          question_bank: {
            multiple_choice: [
              {
                id: 1,
                question: "How does the coefficient 'a' affect the parabola?",
                options: [
                  "Controls vertical shift",
                  "Controls horizontal shift", 
                  "Controls width and direction",
                  "Controls axis of symmetry"
                ],
                correct_answer: 2
              },
              {
                id: 2, 
                question: "What determines if a parabola opens upward or downward?",
                options: [
                  "The value of c",
                  "The value of b",
                  "The sign of a",
                  "The vertex point"
                ],
                correct_answer: 2
              }
            ],
            short_answer: [
              {
                id: 3,
                question: "What point on a parabola is called its vertex?",
                correct_answer: "The highest or lowest point"
              }
            ]
          }
        };
        await this.renderQuiz();
      } catch (error) {
        console.error('Error loading quiz:', error);
        throw error;
      }
    },
  
    async renderQuiz() {
      const quizContainer = document.getElementById('quiz-container');
      if (!this.currentQuiz || !this.currentQuiz.question_bank) {
        console.error('No quiz data available');
        return;
      }
  
      let html = '<form id="quiz-form">';
      
      // Multiple choice section
      if (this.currentQuiz.question_bank.multiple_choice) {
        html += '<div class="multiple-choice-section">';
        html += '<h4>Multiple Choice Questions</h4>';
        
        this.currentQuiz.question_bank.multiple_choice.forEach((q, idx) => {
          html += `
            <div class="question-container">
              <p class="question">${q.question}</p>
              <div class="options">
                ${q.options.map((option, optIdx) => `
                  <div class="option">
                    <input type="radio" 
                           name="mc_${idx}" 
                           id="mc_${idx}_${optIdx}"
                           value="${optIdx}">
                    <label for="mc_${idx}_${optIdx}">${option}</label>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        });
        html += '</div>';
      }
  
      // Short answer section
      if (this.currentQuiz.question_bank.short_answer) {
        html += '<div class="short-answer-section">';
        html += '<h4>Short Answer Questions</h4>';
        
        this.currentQuiz.question_bank.short_answer.forEach((q, idx) => {
          html += `
            <div class="question-container">
              <p class="question">${q.question}</p>
              <input type="text" class="short-answer-input" name="sa_${idx}">
            </div>
          `;
        });
        html += '</div>';
      }
  
      html += `
        <div class="quiz-controls">
          <button type="submit" class="submit-quiz">Submit Quiz</button>
        </div>
      </form>`;
  
      quizContainer.innerHTML = html;
  
      // Add submit handler
      const form = document.getElementById('quiz-form');
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    },
  
    getQuizData() {
      return this.currentQuiz;
    }
  };