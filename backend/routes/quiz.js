// File backend/routes/quiz.js

const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Retrieve quiz questions
router.get('/:labId', authMiddleware, async (req, res) => {
    try {
        const { labId } = req.params;
        const result = await pool.query(
            'SELECT question_bank FROM quizzes WHERE lab_id = $1',
            [labId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        res.json(result.rows[0].question_bank);
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({
            error: 'Gagal menyimpan jawaban kuis',
            details: error.message
        });
    }
});

// Submit quiz answers
router.post('/:labId/submit', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        const { labId } = req.params;
        const { answers } = req.body;
        const nim = req.user.nim;

        console.log('Received quiz submission:', {
            labId,
            nim,
            answers: JSON.stringify(answers)
        });

        await client.query('BEGIN');

        // Get quiz data and current attempts
        const quizResult = await client.query(
            'SELECT question_bank FROM quizzes WHERE lab_id = $1',
            [labId]
        );

        if (quizResult.rows.length === 0) {
            throw new Error('Quiz not found');
        }

        const questionBank = quizResult.rows[0].question_bank;
        let score = 0;
        let mcScore = 0;
        let saScore = 0;

        // Calculate score for multiple-choice questions
        if (questionBank.multiple_choice && answers.multiple_choice) {
            for (let i = 0; i < questionBank.multiple_choice.length; i++) {
                const q = questionBank.multiple_choice[i];
                const userAnswer = answers.multiple_choice[i];
                const isCorrect = userAnswer === q.correct_answer;
                if (isCorrect) {
                    mcScore += 3;
                }
                console.log(`MC Q${i + 1}: User answered ${userAnswer}, correct is ${q.correct_answer}, isCorrect: ${isCorrect}`);
            }
        }

        // Calculate score for short-answer questions
        if (questionBank.short_answer && answers.short_answer) {
            for (let i = 0; i < questionBank.short_answer.length; i++) {
                const q = questionBank.short_answer[i];
                const userAnswer = answers.short_answer[i]?.toLowerCase()?.trim();
                const correctAnswer = q.correct_answer.toLowerCase();
                const isCorrect = userAnswer === correctAnswer;
                if (isCorrect) {
                    saScore += 4;
                }
                console.log(`SA Q${i + 1}: User answered "${userAnswer}", correct is "${correctAnswer}", isCorrect: ${isCorrect}`);
            }
        }

        score = mcScore + saScore;
        const passed = score >= 10;
        const now = new Date().toISOString();

        // Update progress
        const updateResult = await client.query(
            `UPDATE lab_progress 
            SET 
                quiz_answers = $1,
                quiz_score = $2,
                quiz_attempt_count = COALESCE(quiz_attempt_count, 0) + 1,
                last_attempt_at = $3,
                completed_at = CASE WHEN $4 = true THEN $3 ELSE completed_at END,
                is_completed = CASE WHEN $4 = true THEN true ELSE is_completed END
            WHERE nim = $5 AND lab_id = $6
            RETURNING *`,
            [
                answers,
                score,
                now,
                passed,
                nim,
                labId
            ]
        );

        await client.query('COMMIT');

        console.log('Quiz submission successful:', {
            score,
            passed,
            attempts: updateResult.rows[0].quiz_attempt_count
        });

        return res.json({
            score,
            passed,
            attempts: updateResult.rows[0].quiz_attempt_count,
            mcScore,
            saScore,
            message: `Nilai kuis Anda: ${score}/17${passed ? ' - Selamat! Anda telah lulus.' : ''}`
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error submitting quiz:', error);
        res.status(500).json({
            error: 'Gagal menyimpan jawaban kuis',
            details: error.message
        });
    } finally {
        client.release();
    }
});

module.exports = router;