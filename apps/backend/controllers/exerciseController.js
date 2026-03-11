const { GoogleGenerativeAI } = require('@google/generative-ai');
const ExerciseLog = require('../models/ExerciseLog');
const MoodLog = require('../models/MoodLog');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Static Exercise Library ───────────────────────────────────────────────────
const EXERCISES = [
    // ── BREATHING ─────────────────────────────────────────────────────────────
    {
        id: 'box-breathing',
        name: 'Box Breathing',
        category: 'breathing',
        emoji: '🌬️',
        duration: 5,
        difficulty: 'beginner',
        bestFor: ['anxiety', 'stress', 'overwhelm', 'panic'],
        moodRange: [1, 6],
        description: 'A powerful technique used by Navy SEALs to calm the nervous system instantly.',
        steps: [
            { instruction: 'Breathe IN slowly through your nose', duration: 4, type: 'inhale' },
            { instruction: 'HOLD your breath gently', duration: 4, type: 'hold' },
            { instruction: 'Breathe OUT slowly through your mouth', duration: 4, type: 'exhale' },
            { instruction: 'HOLD before the next breath', duration: 4, type: 'hold' },
        ],
        cycles: 4,
        tip: 'Keep your shoulders relaxed. If 4 seconds feels too long, start with 3.',
    },
    {
        id: '478-breathing',
        name: '4-7-8 Breathing',
        category: 'breathing',
        emoji: '💨',
        duration: 4,
        difficulty: 'beginner',
        bestFor: ['insomnia', 'anxiety', 'anger', 'exhaustion'],
        moodRange: [1, 5],
        description: 'Dr. Andrew Weil\'s technique that acts like a natural tranquilizer for the nervous system.',
        steps: [
            { instruction: 'Breathe IN quietly through your nose', duration: 4, type: 'inhale' },
            { instruction: 'HOLD your breath', duration: 7, type: 'hold' },
            { instruction: 'Exhale completely through your mouth', duration: 8, type: 'exhale' },
        ],
        cycles: 4,
        tip: 'The exhale is twice as long as the inhale — this activates your parasympathetic nervous system.',
    },
    {
        id: 'belly-breathing',
        name: 'Diaphragmatic Breathing',
        category: 'breathing',
        emoji: '🫁',
        duration: 5,
        difficulty: 'beginner',
        bestFor: ['stress', 'sadness', 'loneliness', 'calm'],
        moodRange: [3, 8],
        description: 'Deep belly breathing that activates the relaxation response and reduces cortisol.',
        steps: [
            { instruction: 'Place one hand on chest, one on belly. Breathe IN so only your belly rises.', duration: 5, type: 'inhale' },
            { instruction: 'Breathe OUT slowly, feeling your belly fall', duration: 6, type: 'exhale' },
        ],
        cycles: 6,
        tip: 'Your chest should stay relatively still. All the movement comes from your belly.',
    },

    // ── MEDITATION ────────────────────────────────────────────────────────────
    {
        id: 'body-scan',
        name: 'Body Scan Meditation',
        category: 'meditation',
        emoji: '🧘',
        duration: 10,
        difficulty: 'beginner',
        bestFor: ['stress', 'anxiety', 'numbness', 'overwhelm', 'exhaustion'],
        moodRange: [1, 7],
        description: 'Progressively scan each part of your body to release physical tension and reconnect with yourself.',
        steps: [
            { instruction: 'Close your eyes. Take 3 deep breaths to settle in.', duration: 30, type: 'prepare' },
            { instruction: 'Bring awareness to your feet and toes. Notice any sensation — warmth, tingling, tension. Don\'t try to change anything, just observe.', duration: 60, type: 'focus' },
            { instruction: 'Move attention up to your calves and knees. Breathe into any tightness you find.', duration: 60, type: 'focus' },
            { instruction: 'Scan your thighs, hips, and lower back. This area holds a lot of stress — breathe into it.', duration: 60, type: 'focus' },
            { instruction: 'Notice your belly rising and falling. Move awareness to your chest and shoulders.', duration: 60, type: 'focus' },
            { instruction: 'Scan your arms, hands, and fingers. Let go of any gripping.', duration: 60, type: 'focus' },
            { instruction: 'Bring attention to your neck, face, and scalp. Relax your jaw. Soften your eyes.', duration: 60, type: 'focus' },
            { instruction: 'Now hold awareness of your whole body at once. Take 3 final deep breaths.', duration: 30, type: 'finish' },
        ],
        cycles: 1,
        tip: 'There is no "doing it wrong." If your mind wanders, gently guide it back without judgment.',
    },
    {
        id: 'loving-kindness',
        name: 'Loving-Kindness Meditation',
        category: 'meditation',
        emoji: '💙',
        duration: 8,
        difficulty: 'beginner',
        bestFor: ['loneliness', 'shame', 'sadness', 'anger', 'self-criticism'],
        moodRange: [1, 6],
        description: 'A Buddhist practice that cultivates compassion for yourself and others — proven to reduce depression.',
        steps: [
            { instruction: 'Sit comfortably. Think of someone who loves you unconditionally. Feel their warmth.', duration: 60, type: 'prepare' },
            { instruction: 'Direct kindness toward YOURSELF. Silently repeat: "May I be happy. May I be healthy. May I be safe. May I live with ease."', duration: 90, type: 'focus' },
            { instruction: 'Now send that warmth to someone you love. "May you be happy. May you be healthy. May you be safe."', duration: 90, type: 'focus' },
            { instruction: 'Extend to a neutral person — maybe a stranger. Send them the same wishes.', duration: 60, type: 'focus' },
            { instruction: 'Now extend to all beings everywhere. "May all beings be happy. May all beings be free."', duration: 60, type: 'finish' },
        ],
        cycles: 1,
        tip: 'It\'s okay if you feel resistance when directing kindness to yourself — that\'s normal. Stay with it gently.',
    },
    {
        id: 'mindful-observation',
        name: 'Mindful Observation',
        category: 'meditation',
        emoji: '👁️',
        duration: 5,
        difficulty: 'beginner',
        bestFor: ['anxiety', 'rumination', 'overthinking', 'overwhelm'],
        moodRange: [3, 9],
        description: 'A simple practice: pick one object and study it with complete attention for 5 minutes.',
        steps: [
            { instruction: 'Pick any nearby object — a plant, a cup, your hand. Hold it or look at it.', duration: 30, type: 'prepare' },
            { instruction: 'Study it as if you\'ve never seen it before. Notice its colors, textures, shadows, edges.', duration: 60, type: 'focus' },
            { instruction: 'Notice the weight, temperature, or texture if you\'re holding it. Engage all your senses.', duration: 60, type: 'focus' },
            { instruction: 'When your mind drifts (it will), gently bring it back to the object. No frustration.', duration: 90, type: 'focus' },
            { instruction: 'Notice how you feel now compared to when you started.', duration: 30, type: 'finish' },
        ],
        cycles: 1,
        tip: 'The simpler the object, the better. This works well with a candle flame or running water.',
    },

    // ── CBT ───────────────────────────────────────────────────────────────────
    {
        id: 'thought-record',
        name: 'Thought Record',
        category: 'cbt',
        emoji: '📝',
        duration: 10,
        difficulty: 'intermediate',
        bestFor: ['anxiety', 'sadness', 'shame', 'anger', 'overthinking'],
        moodRange: [1, 6],
        description: 'A core CBT tool that helps you examine and reframe distorted thoughts.',
        steps: [
            { instruction: 'Identify the situation: Write down exactly what happened or what you\'re worried about. Just facts, no interpretation.', duration: 120, type: 'write' },
            { instruction: 'Identify the automatic thought: What went through your mind? "I am..." / "This means..." / "They think..."', duration: 120, type: 'write' },
            { instruction: 'Identify the emotion and rate its intensity 0-100%', duration: 60, type: 'write' },
            { instruction: 'Examine the evidence FOR the thought. What facts support it?', duration: 90, type: 'write' },
            { instruction: 'Examine the evidence AGAINST the thought. What facts contradict it?', duration: 90, type: 'write' },
            { instruction: 'Create a balanced thought: A more realistic perspective that accounts for both sides.', duration: 120, type: 'write' },
            { instruction: 'Re-rate your emotion intensity. Has it shifted?', duration: 30, type: 'reflect' },
        ],
        cycles: 1,
        tip: 'The goal isn\'t to think positively — it\'s to think accurately. Balanced thoughts are more helpful than positive ones.',
    },
    {
        id: 'behavioral-activation',
        name: 'Behavioral Activation',
        category: 'cbt',
        emoji: '⚡',
        duration: 5,
        difficulty: 'beginner',
        bestFor: ['sadness', 'numbness', 'exhaustion', 'loneliness', 'overwhelm'],
        moodRange: [1, 5],
        description: 'A CBT technique that breaks the depression cycle by scheduling small, achievable activities.',
        steps: [
            { instruction: 'Think of 3 activities that used to bring you even slight pleasure or a sense of accomplishment — however small.', duration: 90, type: 'think' },
            { instruction: 'Choose ONE that feels most achievable TODAY. It can be tiny: making tea, a 5-minute walk, texting a friend.', duration: 60, type: 'decide' },
            { instruction: 'Schedule it: Write down exactly WHEN you\'ll do it today. Be specific — "3pm I will walk to the end of my street."', duration: 60, type: 'plan' },
            { instruction: 'Remind yourself: you don\'t have to feel like doing it first. Action creates motivation, not the other way around.', duration: 60, type: 'reflect' },
        ],
        cycles: 1,
        tip: 'Depression tells you activities won\'t help until you feel better. BA flips this — you act first, feeling follows.',
    },
    {
        id: 'cognitive-reframing',
        name: 'Cognitive Reframing',
        category: 'cbt',
        emoji: '🔄',
        duration: 7,
        difficulty: 'intermediate',
        bestFor: ['anxiety', 'anger', 'sadness', 'fear', 'shame'],
        moodRange: [1, 6],
        description: 'Learn to identify cognitive distortions and shift your perspective on challenging situations.',
        steps: [
            { instruction: 'Name the distressing thought as clearly as possible.', duration: 60, type: 'identify' },
            { instruction: 'Identify the distortion type:\n- All-or-nothing thinking ("always/never")\n- Catastrophizing ("worst case")\n- Mind reading ("they think...")\n- Personalization ("my fault")\n- Should statements ("I should...")', duration: 90, type: 'categorize' },
            { instruction: 'Ask: "What would I say to a close friend who had this thought?" Write that response.', duration: 90, type: 'reframe' },
            { instruction: 'Ask: "In 5 years, how much will this matter?" This creates distance from the thought.', duration: 60, type: 'reframe' },
            { instruction: 'Write a reframed version of the original thought using the insights above.', duration: 90, type: 'write' },
        ],
        cycles: 1,
        tip: 'You\'re not trying to eliminate the thought — you\'re changing its meaning and your relationship to it.',
    },

    // ── GROUNDING ─────────────────────────────────────────────────────────────
    {
        id: '54321-grounding',
        name: '5-4-3-2-1 Grounding',
        category: 'grounding',
        emoji: '🖐️',
        duration: 5,
        difficulty: 'beginner',
        bestFor: ['anxiety', 'panic', 'dissociation', 'overwhelm', 'fear'],
        moodRange: [1, 5],
        description: 'A sensory grounding technique that instantly anchors you to the present moment.',
        steps: [
            { instruction: 'Look around and name 5 things you can SEE. Say them out loud or in your head.', duration: 30, type: 'sense' },
            { instruction: 'Name 4 things you can physically FEEL right now (chair beneath you, clothes on skin, air temperature).', duration: 30, type: 'sense' },
            { instruction: 'Name 3 things you can HEAR in this moment.', duration: 30, type: 'sense' },
            { instruction: 'Name 2 things you can SMELL (or 2 things you like the smell of).', duration: 30, type: 'sense' },
            { instruction: 'Name 1 thing you can TASTE right now.', duration: 20, type: 'sense' },
            { instruction: 'Take 3 slow deep breaths. Notice how you feel compared to a minute ago.', duration: 30, type: 'finish' },
        ],
        cycles: 1,
        tip: 'This works because it\'s impossible to feel panic and focus on your senses simultaneously. Do it as many times as needed.',
    },
    {
        id: 'safe-place',
        name: 'Safe Place Visualization',
        category: 'grounding',
        emoji: '🏡',
        duration: 8,
        difficulty: 'beginner',
        bestFor: ['trauma', 'anxiety', 'fear', 'sadness', 'overwhelm'],
        moodRange: [1, 6],
        description: 'Create a mental sanctuary you can return to whenever you feel overwhelmed.',
        steps: [
            { instruction: 'Close your eyes. Imagine a place where you feel completely safe and calm — real or imagined.', duration: 60, type: 'visualize' },
            { instruction: 'Look around your safe place. What do you see? Notice every detail — colors, light, shapes.', duration: 60, type: 'visualize' },
            { instruction: 'What sounds are there? Maybe silence, nature, gentle music. Let them wash over you.', duration: 60, type: 'visualize' },
            { instruction: 'Feel the temperature of the air. What does the ground feel like beneath you?', duration: 60, type: 'visualize' },
            { instruction: 'Feel the safety and peace of this place. Know you can return here anytime.', duration: 60, type: 'finish' },
        ],
        cycles: 1,
        tip: 'The more vividly you build this place, the more powerful it becomes as a tool.',
    },

    // ── MOVEMENT ──────────────────────────────────────────────────────────────
    {
        id: 'progressive-muscle',
        name: 'Progressive Muscle Relaxation',
        category: 'movement',
        emoji: '💪',
        duration: 10,
        difficulty: 'beginner',
        bestFor: ['stress', 'anxiety', 'anger', 'tension', 'insomnia'],
        moodRange: [1, 7],
        description: 'Systematically tense and release muscle groups to release physical stress stored in the body.',
        steps: [
            { instruction: 'Sit or lie down comfortably. Take 3 deep breaths.', duration: 30, type: 'prepare' },
            { instruction: 'FEET: Curl your toes tightly for 5 seconds... then release. Notice the difference.', duration: 15, type: 'tense' },
            { instruction: 'CALVES: Flex your calf muscles for 5 seconds... then release completely.', duration: 15, type: 'tense' },
            { instruction: 'THIGHS: Squeeze your thigh muscles for 5 seconds... then let go.', duration: 15, type: 'tense' },
            { instruction: 'STOMACH: Tighten your core for 5 seconds... then release. Feel the warmth.', duration: 15, type: 'tense' },
            { instruction: 'HANDS: Make tight fists for 5 seconds... then open and spread your fingers wide.', duration: 15, type: 'tense' },
            { instruction: 'ARMS: Flex your biceps for 5 seconds... then drop your arms loose.', duration: 15, type: 'tense' },
            { instruction: 'SHOULDERS: Shrug them to your ears for 5 seconds... then let them drop completely.', duration: 15, type: 'tense' },
            { instruction: 'FACE: Scrunch every muscle — eyes, nose, jaw — for 5 seconds... then release.', duration: 15, type: 'tense' },
            { instruction: 'Scan your whole body. Notice how different it feels. Take 3 final deep breaths.', duration: 60, type: 'finish' },
        ],
        cycles: 1,
        tip: 'The contrast between tension and release is what creates relaxation. Don\'t skip the tension phase.',
    },
];

// ── GET /api/exercises ────────────────────────────────────────────────────────
// Returns all exercises, optionally filtered by category
exports.getExercises = async (req, res) => {
    try {
        const { category } = req.query;
        let list = EXERCISES;
        if (category && category !== 'all') {
            list = EXERCISES.filter(e => e.category === category);
        }
        res.status(200).json({ status: 'success', data: list });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch exercises.' });
    }
};

// ── GET /api/exercises/recommend ─────────────────────────────────────────────
// Returns AI-recommended exercises based on current mood
exports.getRecommendations = async (req, res) => {
    try {
        const userId = req.user.id;
        const { moodScore, emotions } = req.query;

        // Get last mood log if no score passed
        let score = moodScore ? Number(moodScore) : null;
        let currentEmotions = emotions ? emotions.split(',') : [];

        if (!score) {
            const lastMood = await MoodLog.findOne({ user: userId }).sort({ createdAt: -1 });
            if (lastMood) {
                score = lastMood.moodScore;
                currentEmotions = lastMood.emotions || [];
            }
        }

        // Filter exercises by mood range
        const suitable = score
            ? EXERCISES.filter(e => score >= e.moodRange[0] && score <= e.moodRange[1])
            : EXERCISES;

        // If no AI key or no score, just return top 4 suitable exercises
        if (!score || suitable.length <= 4) {
            return res.status(200).json({
                status: 'success',
                data: { recommended: suitable.slice(0, 4), aiReason: null }
            });
        }

        // Use AI to pick the best 3 and explain why
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const availableIds = suitable.map(e => `${e.id} (${e.name}, ${e.category})`).join(', ');

        const prompt = `A mental health app user has a mood score of ${score}/10 and is feeling: ${currentEmotions.join(', ') || 'unspecified'}.

Available exercises: ${availableIds}

Pick the 3 BEST exercise IDs for this person right now and explain why in one warm sentence.
Return ONLY valid JSON, no markdown:
{
  "recommended": ["exercise-id-1", "exercise-id-2", "exercise-id-3"],
  "reason": "one warm sentence explaining why these are best for them right now"
}`;

        const result = await model.generateContent(prompt);
        let raw = result.response.text().trim().replace(/```json|```/g, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch {
            parsed = { recommended: suitable.slice(0, 3).map(e => e.id), reason: null };
        }

        const recommendedExercises = parsed.recommended
            .map(id => EXERCISES.find(e => e.id === id))
            .filter(Boolean);

        // Fill up to 4 if AI returned fewer
        if (recommendedExercises.length < 4) {
            suitable.forEach(e => {
                if (recommendedExercises.length < 4 && !recommendedExercises.find(r => r.id === e.id)) {
                    recommendedExercises.push(e);
                }
            });
        }

        res.status(200).json({
            status: 'success',
            data: { recommended: recommendedExercises, aiReason: parsed.reason || null }
        });

    } catch (err) {
        console.error('Recommendation error:', err.message);
        // Fallback — return first 4 exercises
        res.status(200).json({
            status: 'success',
            data: { recommended: EXERCISES.slice(0, 4), aiReason: null }
        });
    }
};

// ── POST /api/exercises/log ───────────────────────────────────────────────────
exports.logExercise = async (req, res) => {
    try {
        const { exerciseId, moodBefore, moodAfter, notes } = req.body;
        const exercise = EXERCISES.find(e => e.id === exerciseId);
        if (!exercise) return res.status(404).json({ status: 'error', message: 'Exercise not found.' });

        const log = await ExerciseLog.create({
            user: req.user.id,
            exerciseId,
            exerciseName: exercise.name,
            category: exercise.category,
            durationMinutes: exercise.duration,
            moodBefore: moodBefore || null,
            moodAfter: moodAfter || null,
            notes: notes || '',
        });

        res.status(201).json({ status: 'success', data: log });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to log exercise.' });
    }
};

// ── GET /api/exercises/history ────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
    try {
        const logs = await ExerciseLog.find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .limit(30);
        res.status(200).json({ status: 'success', data: logs });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Failed to fetch history.' });
    }
};