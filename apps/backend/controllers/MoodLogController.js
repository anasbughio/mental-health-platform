const MoodLog = require('../models/MoodLog');

// 1. Create a new Mood Log
exports.createMoodLog = async (req, res) => {
    try {
        // Grab the data the user sent in the request body
        const { moodScore, notes, emotions } = req.body;

        // Create the new log, automatically linking it to the logged-in user
        const newMoodLog = new MoodLog({
            user: req.user.id, // This comes directly from your 'protect' middleware!
            moodScore,
            notes,
            emotions
        });

        const savedLog = await newMoodLog.save();

        res.status(201).json({
            status: 'success',
            message: 'Mood log saved successfully!',
            data: savedLog
        });

    } catch (error) {
        console.error('[DEBUG] Error creating mood log:', error.message);
        res.status(400).json({
            status: 'fail',
            message: error.message
        });
    }
};

// 2. Get all Mood Logs for the logged-in user
exports.getMyMoodLogs = async (req, res) => {
    try {
        // Find all logs where the 'user' field matches the logged-in user's ID
        // .sort({ createdAt: -1 }) puts the newest logs at the top
        const logs = await MoodLog.find({ user: req.user.id }).sort({ createdAt: -1 });

        res.status(200).json({
            status: 'success',
            results: logs.length,
            data: logs
        });
    } catch (error) {
        console.error('[DEBUG] Error fetching mood logs:', error.message);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};