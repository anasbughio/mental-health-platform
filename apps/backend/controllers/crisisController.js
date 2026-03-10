const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Static crisis resources by region ────────────────────────────────────────
const CRISIS_RESOURCES = [
    {
        name: 'International Association for Suicide Prevention',
        number: 'https://www.iasp.info/resources/Crisis_Centres/',
        description: 'Directory of crisis centres worldwide',
        available: '24/7',
        region: 'Global',
    },
    {
        name: 'Crisis Text Line',
        number: 'Text HOME to 741741',
        description: 'Free, 24/7 crisis support via text',
        available: '24/7',
        region: 'US / UK / Canada / Ireland',
    },
    {
        name: 'National Suicide Prevention Lifeline',
        number: '988',
        description: 'Call or text 988 for free, confidential support',
        available: '24/7',
        region: 'United States',
    },
    {
        name: 'Samaritans',
        number: '116 123',
        description: 'Confidential emotional support for anyone in distress',
        available: '24/7',
        region: 'UK & Ireland',
    },
    {
        name: 'Lifeline Australia',
        number: '13 11 14',
        description: 'Crisis support and suicide prevention',
        available: '24/7',
        region: 'Australia',
    },
    {
        name: 'iCall',
        number: '9152987821',
        description: 'Psychosocial support helpline',
        available: 'Mon–Sat 8am–10pm',
        region: 'India',
    },
    {
        name: 'Vandrevala Foundation',
        number: '1860-2662-345',
        description: '24/7 mental health helpline',
        available: '24/7',
        region: 'India',
    },
    {
        name: 'Befrienders Worldwide',
        number: 'https://www.befrienders.org',
        description: 'Find a local helpline in your country',
        available: 'Varies by location',
        region: 'Global',
    },
];

// ── POST /api/crisis/detect ───────────────────────────────────────────────────
// Analyzes a piece of text and returns whether it contains distress signals
exports.detectDistress = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim().length < 3) {
            return res.status(200).json({ status: 'success', data: { isDistressed: false } });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are a mental health safety monitor. Analyze this text for signs of:
- Suicidal ideation or self-harm intentions
- Severe emotional crisis or hopelessness
- Expressions of wanting to hurt themselves or others
- Statements suggesting they may not be safe

Text: "${text}"

Respond ONLY with a valid JSON object in this exact format, nothing else:
{"isDistressed": true/false, "severity": "none/mild/moderate/severe", "reason": "brief explanation or empty string"}

Be conservative — only flag genuine crisis signals, NOT general sadness or stress.`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

        // Strip markdown code fences if present
        responseText = responseText.replace(/```json|```/g, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(responseText);
        } catch {
            parsed = { isDistressed: false, severity: 'none', reason: '' };
        }

        res.status(200).json({
            status: 'success',
            data: {
                isDistressed: parsed.isDistressed || false,
                severity: parsed.severity || 'none',
                reason: parsed.reason || '',
                resources: parsed.isDistressed ? CRISIS_RESOURCES : [],
            }
        });

    } catch (error) {
        console.error('Error in distress detection:', error);
        // Fail safe — never crash, just return not distressed
        res.status(200).json({ status: 'success', data: { isDistressed: false } });
    }
};

// ── GET /api/crisis/resources ─────────────────────────────────────────────────
// Always return full crisis resources list
exports.getResources = async (req, res) => {
    res.status(200).json({
        status: 'success',
        data: CRISIS_RESOURCES,
    });
};