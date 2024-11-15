// File: backend/routes/progress.js

const router = require('express').Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Save progress
router.post('/save', authMiddleware, async (req, res) => {
    try {
        const { labId, coefficients, graph_state, quiz_answers, quiz_score, completed_at } = req.body;
        const nim = req.user.nim;  // This comes from the auth middleware
        
        // Insert or update progress
        const result = await pool.query(`
            INSERT INTO lab_progress 
                (nim, lab_id, coefficients, graph_state, quiz_answers, quiz_score, completed_at)
            VALUES 
                ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (nim, lab_id) 
            DO UPDATE SET 
                coefficients = $3,
                graph_state = $4,
                quiz_answers = $5,
                quiz_score = $6,
                completed_at = $7,
                last_modified = CURRENT_TIMESTAMP
            RETURNING *
        `, [nim, labId, coefficients, graph_state, quiz_answers, quiz_score, completed_at]);
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(400).json({ error: 'Failed to save progress' });
        }
    } catch (error) {
        console.error('Progress save error:', error);
        res.status(500).json({ 
            error: 'Failed to save progress',
            details: error.message 
        });
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
                completed_at 
             FROM lab_progress 
             WHERE nim = $1 AND lab_id = $2`,
            [nim, labId]
        );
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            // Return default values if no progress exists
            res.json({
                nim: nim,
                lab_id: labId,
                coefficients: {"a": 1, "b": 0, "c": 0},
                graph_state: {"scale": 1, "offsetX": 0, "offsetY": 0},
                quiz_answers: null,
                quiz_score: null,
                completed_at: null
            });
        }
    } catch (error) {
        console.error('Progress retrieval error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;