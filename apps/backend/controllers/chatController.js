// controllers/chatController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ChatHistory = require('../models/ChatHistory');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id; // from auth middleware

        // Load this user's chat history from DB
        let chatDoc = await ChatHistory.findOne({ user: userId });
        if (!chatDoc) {
            chatDoc = await ChatHistory.create({ user: userId, messages: [] });
        }

        // Format history for Gemini (exclude any corrupt entries)
        const formattedHistory = chatDoc.messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.text }]
        }));

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: `You are a highly empathetic, non-judgmental mental health companion. 
Your goal is to use active listening to help the user process their feelings. 
Do not try to diagnose them. Keep your responses conversational, warm, and concise (1 to 3 sentences maximum).`
        });

        const chat = model.startChat({ history: formattedHistory });
        const result = await chat.sendMessage(message);
        const aiResponse = result.response.text();

        // Persist both the user message and AI reply to DB
        chatDoc.messages.push({ role: 'user', text: message });
        chatDoc.messages.push({ role: 'model', text: aiResponse });
        await chatDoc.save();

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

// GET /chat/history — load past messages for the logged-in user
exports.getChatHistory = async (req, res) => {
    try {
        const chatDoc = await ChatHistory.findOne({ user: req.user.id });
        const messages = chatDoc ? chatDoc.messages : [];

        res.status(200).json({
            status: 'success',
            data: messages
        });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch chat history.'
        });
    }
};