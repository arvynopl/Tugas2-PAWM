const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Save progress
router.post('/save', authMiddleware, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { labId, coefficients, graph_state, quiz_answers, quiz_score } = req.body;
        const nim = req.user.nim;
        
        if (!labId) {
            return res.status(400).json({ error: 'Lab ID is required' });
        }

        // Calculate completion status based on quiz score
        const is_completed = quiz_score >= 10;
        const completed_at = is_completed ? new Date().toISOString() : null;

        // Insert or update progress
        const result = await client.query(`
            INSERT INTO lab_progress 
                (nim, lab_id, coefficients, graph_state, quiz_answers, quiz_score, is_completed, completed_at)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (nim, lab_id) 
            DO UPDATE SET 
                coefficients = EXCLUDED.coefficients,
                graph_state = EXCLUDED.graph_state,
                quiz_answers = COALESCE(EXCLUDED.quiz_answers, lab_progress.quiz_answers),
                quiz_score = COALESCE(EXCLUDED.quiz_score, lab_progress.quiz_score),
                is_completed = EXCLUDED.is_completed,
                completed_at = COALESCE(EXCLUDED.completed_at, lab_progress.completed_at),
                last_modified = CURRENT_TIMESTAMP
            RETURNING *
        `, [
            nim,
            labId,
            coefficients,
            graph_state,
            quiz_answers,
            quiz_score,
            is_completed,
            completed_at
        ]);

        await client.query('COMMIT');
        
        res.json({
            message: 'Progress saved successfully',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Progress save error:', error);
        res.status(500).json({
            error: 'Failed to save progress',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// Get progress
router.get('/:labId', authMiddleware, async (req, res) => {
    try {
        const nim = req.user.nim;
        const labId = req.params.labId;
        
        const result = await pool.query(
            `SELECT 
                coefficients, 
                graph_state, 
                quiz_answers, 
                quiz_score, 
                completed_at,
                quiz_attempt_count,
                is_completed
             FROM lab_progress 
             WHERE nim = $1 AND lab_id = $2`,
            [nim, labId]
        );
        
        if (result.rows.length > 0) {
            const data = result.rows[0];
            // Ensure completion status matches quiz requirement
            data.is_completed = data.quiz_score >= 10;
            res.json(data);
        } else {
            res.json({
                coefficients: {"a": 1, "b": 0, "c": 0},
                graph_state: {"scale": 1, "offsetX": 0, "offsetY": 0},
                quiz_answers: null,
                quiz_score: null,
                completed_at: null,
                quiz_attempt_count: 0,
                is_completed: false
            });
        }
    } catch (error) {
        console.error('Progress retrieval error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;