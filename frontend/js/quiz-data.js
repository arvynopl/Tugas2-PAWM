// File: frontend/js/quiz-data.js

window.quizDataModule = {
  async fetchQuizData(labId) {
      try {
          const response = await fetch(`http://localhost:5000/api/quiz/${labId}`);
          if (!response.ok) {
              throw new Error('Failed to fetch quiz data');
          }
          return await response.json();
      } catch (error) {
          console.error('Error fetching quiz data:', error);
          throw error;
      }
  },

  async submitQuizAnswers(labId, answers) {
      try {
          const response = await fetch(`http://localhost:5000/api/quiz/${labId}/submit`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ answers })
          });

          if (!response.ok) {
              throw new Error('Failed to submit quiz answers');
          }

          return await response.json();
      } catch (error) {
          console.error('Error submitting quiz answers:', error);
          throw error;
      }
  }
};