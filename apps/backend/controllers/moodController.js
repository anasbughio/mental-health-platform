const { GoogleGenerativeAI } = require('@google/generative-ai');
const Mood = require('../models/MoodLog'); // Adjust the path to your Mood model if needed

// Initialize the AI securely using the environment variable your pipeline just injected
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.createMood = async (req, res) => {
    try {
        // Grab the user's input from the React frontend
        const { moodScore, notes, emotions } = req.body;
        let generatedAdvice = null;

        // Only spend compute power asking the AI if the user actually wrote a note
        if (notes && notes.trim() !== '') {
            // We use the fast, lightweight model for quick responses
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // Prompt Engineering: Telling the AI exactly how to behave
           // 2. Inject that context into the prompt!
const prompt = `You are an empathetic, non-judgmental mental health assistant. 
A user just logged their daily mood with a score of ${moodScore} out of 10. 
${emotions}
They wrote this journal entry: "${notes}"

Provide a short, highly supportive response (maximum 3 sentences). 
Validate their exact feelings and offer one small, actionable piece of advice or a cognitive reframe.`;

            // Make the actual call to Google's servers
            const result = await model.generateContent(prompt);
            generatedAdvice = result.response.text();
        }

        // Save everything to MongoDB, including the new AI advice!
        const newMood = await Mood.create({
            user: req.user.id, // Assuming your auth middleware puts the user ID here
            moodScore,
            notes,
            emotions,
            aiAdvice: generatedAdvice // Storing the AI's response in the DB
        });

        res.status(201).json({
            status: 'success',
            data: newMood
        });

    } catch (error) {
        console.error("Error generating AI content or saving to DB:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Failed to process mood log.' 
        });
    }
};