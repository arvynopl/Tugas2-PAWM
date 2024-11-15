// File: backend/routes/quiz.js

const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Get quiz for a specific lab
router.get('/:labId', authMiddleware, async (req, res) => {
    try {
      const { labId } = req.params;
      console.log('Fetching quiz for labId:', labId);
      
      const result = await pool.query(
        'SELECT question_bank FROM quizzes WHERE lab_id = $1',
        [labId]
      );
      
      console.log('Quiz query result:', result);
      
      if (result.rows.length === 0) {
        console.log('Quiz not found for labId:', labId);
        return res.status(404).json({ error: 'Kuis tidak ditemukan' });
      }
      
      res.json(result.rows[0].question_bank);
    } catch (error) {
      console.error('Error fetching quiz:', error);
      res.status(500).json({ error: 'Gagal mengambil data kuis' });
    }
  });

// Submit quiz answers
router.post('/:labId/submit', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const { labId } = req.params;
        const { answers } = req.body;
        const nim = req.user.nim;

        await client.query('BEGIN');

        // Get correct answers
        const quizResult = await client.query(
            'SELECT question_bank FROM quizzes WHERE lab_id = $1',
            [labId]
        );

        if (quizResult.rows.length === 0) {
            throw new Error('Kuis tidak ditemukan');
        }

        const questionBank = quizResult.rows[0].question_bank;
        let score = 0;
        
        // Calculate score
        // Multiple choice questions (3 points each)
        questionBank.multiple_choice.forEach((q, idx) => {
            if (answers.multiple_choice[idx] === q.correct_answer) {
                score += 3;
            }
        });
        
        // Short answer questions (4 points each)
        questionBank.short_answer.forEach((q, idx) => {
            const userAnswer = answers.short_answer[idx]?.toLowerCase().trim();
            const correctAnswer = q.correct_answer.toLowerCase();
            if (userAnswer === correctAnswer) {
                score += 4;
            }
        });

        // Update lab_progress
        await client.query(
            `UPDATE lab_progress 
            SET quiz_answers = $1,
                quiz_score = $2,
                quiz_attempt_count = quiz_attempt_count + 1,
                last_attempt_at = CURRENT_TIMESTAMP,
                completed_at = CASE 
                    WHEN $2 >= 10 THEN CURRENT_TIMESTAMP 
                    ELSE completed_at 
                END
            WHERE nim = $3 AND lab_id = $4`,
            [answers, score, nim, labId]
        );

        await client.query('COMMIT');

        res.json({
            score,
            message: `Nilai kuis Anda: ${score}/17`,
            passed: score >= 10,
            attempts: result.rows[0].quiz_attempt_count + 1
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting quiz:', error);
        res.status(500).json({ error: 'Gagal menyimpan jawaban kuis' });
    } finally {
        client.release();
    }
});

module.exports = router;