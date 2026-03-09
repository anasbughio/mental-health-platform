import { useState, useEffect } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import api from '../config/axios';

const EMOTION_TAGS = ['Happy', 'Anxious', 'Calm', 'Overwhelmed', 'Productive', 'Exhausted'];

export default function Dashboard() {
    const [logs, setLogs] = useState([]);
    const [score, setScore] = useState(7);
    const [notes, setNotes] = useState('');
    const [selectedEmotions, setSelectedEmotions] = useState([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const response = await api.get('/moods');
            setLogs(response.data.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to fetch logs. Your session may have expired.');
            if (err.response?.status === 401) {
                navigate('/login'); 
            }
        }
    };

    const toggleEmotion = (emotion) => {
        if (selectedEmotions.includes(emotion)) {
            setSelectedEmotions(selectedEmotions.filter(e => e !== emotion));
        } else {
            setSelectedEmotions([...selectedEmotions, emotion]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Sending the exact data the backend expects!
            await api.post('/moods', {
                moodScore: score,
                notes: notes,
                emotions: selectedEmotions 
            });
            
            // Reset the form
            setScore(7); 
            setNotes('');
            setSelectedEmotions([]);
            
            // Refresh to see the new log and the AI's advice!
            fetchLogs(); 
        } catch (err) {
            console.error(err);
            setError('Failed to save mood log.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
             <h2>Your AI Mood Dashboard</h2>
         <Link to="/chat" style={{ marginRight: '15px', textDecoration: 'none', color: '#007BFF', fontWeight: 'bold' }}>
            Talk to AI. &rarr;
        </Link>
         <Link to="/chat" style={{ marginRight: '15px', textDecoration: 'none', color: '#007BFF', fontWeight: 'bold' }}>
            Talk to AI. &rarr;
        </Link>
      
        
       
                <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Logout
                </button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ border: '1px solid #ddd', padding: '20px', marginBottom: '30px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <h3 style={{ marginTop: 0 }}>How are you feeling today?</h3>
                
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>
                        Mood Score: {score}/10
                    </label>
                    <input 
                        type="range" min="1" max="10" 
                        value={score} 
                        onChange={(e) => setScore(Number(e.target.value))}
                        style={{ width: '100%', cursor: 'pointer' }}
                    />
                </div>

                {/* --- NEW: Emotion Tags --- */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Emotions</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {EMOTION_TAGS.map(emotion => (
                            <button
                                type="button"
                                key={emotion}
                                onClick={() => toggleEmotion(emotion)}
                                style={{
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid #007BFF',
                                    backgroundColor: selectedEmotions.includes(emotion) ? '#007BFF' : 'white',
                                    color: selectedEmotions.includes(emotion) ? 'white' : '#007BFF',
                                    cursor: 'pointer'
                                }}
                            >
                                {emotion}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Journal Entry</label>
                    <textarea 
                        placeholder="Why are you feeling this way? (The AI will read this to give you advice)"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ width: '100%', height: '80px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                </div>

                <button disabled={isSubmitting} type="submit" style={{ padding: '10px 20px', backgroundColor: isSubmitting ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontSize: '16px' }}>
                    {isSubmitting ? 'Analyzing...' : 'Save & Get AI Advice'}
                </button>
            </form>

            <div>
                <h3>Recent Logs</h3>
                {logs.length === 0 ? (
                    <p style={{ color: '#666' }}>No logs yet. Create your first one above!</p>
                ) : (
                    logs.map(log => (
                        <div key={log._id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <strong>Score: {log.moodScore}/10</strong>
                                <span style={{ color: '#888', fontSize: '14px' }}>
                                    {log.emotions?.join(', ')}
                                </span>
                            </div>
                            <p style={{ margin: '0 0 10px 0', color: '#444' }}>{log.notes || <em>No notes provided.</em>}</p>
                            
                            {/* --- NEW: Displaying the AI Advice --- */}
                            {log.aiAdvice && (
                                <div style={{ backgroundColor: '#eef2ff', borderLeft: '4px solid #4f46e5', padding: '12px', borderRadius: '0 4px 4px 0', marginTop: '10px' }}>
                                    <strong style={{ color: '#4f46e5', display: 'block', marginBottom: '5px' }}>✨ AI Companion:</strong>
                                    <p style={{ margin: 0, color: '#333', lineHeight: '1.4' }}>{log.aiAdvice}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}