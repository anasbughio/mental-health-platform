const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.sendMessage = async (req, res) => {
    try {
        // The React frontend will send the new message AND the past conversation history
        const { message, history } = req.body;

        // Initialize the model with a strict personality
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: "You are a highly empathetic, non-judgmental mental health companion. Your goal is to use active listening to help the user process their feelings. Do not try to diagnose them. Keep your responses conversational, warm, and concise (1 to 3 sentences maximum)."
        });

        // Start the chat using the history provided by the frontend
        const chat = model.startChat({
            history: history || []
        });

        // Send the user's newest message to the AI
        const result = await chat.sendMessage(message);
        const aiResponse = result.response.text();

        // Send the AI's reply back to React
        res.status(200).json({
            status: 'success',
            reply: aiResponse
        });

    } catch (error) {
        console.error("Error in AI Chat:", error);
        res.status(500).json({ 
            status: 'error', 
            message: 'The AI companion is currently unavailable.' 
        });
    }
};