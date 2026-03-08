import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/axios'; // Your custom Axios instance that handles the secure cookie

export default function Dashboard() {
    const [logs, setLogs] = useState([]);
    const [score, setScore] = useState(7);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // 1. Automatically fetch the user's logs when the page loads
    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            // Because we set withCredentials: true in api.js, 
            // the browser silently attaches your HTTP-only cookie here!
            const response = await api.get('/moods');
            setLogs(response.data.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to fetch logs. Your session may have expired.');
            // If the backend says "Unauthorized", kick them back to the login screen
            if (err.response?.status === 401) {
                navigate('/login'); 
            }
        }
    };

    // 2. Submit a new mood log
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/moods', {
                moodScore: score,
                notes: notes,
                emotions: [] // Keeping it simple for now
            });
            
            // Reset the form
            setScore(7); 
            setNotes('');
            
            // Refresh the list immediately so the user sees their new log
            fetchLogs(); 
        } catch (err) {
            console.error(err);
            setError('Failed to save mood log.');
        }
    };

    const handleLogout = () => {
        // Clear the UI state and send them back to login
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Your Mood Dashboard</h2>
                <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Logout
                </button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '15px', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>{error}</div>}

            {/* Form to submit a new log */}
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

                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Notes</label>
                    <textarea 
                        placeholder="Any notes about your day?"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ width: '100%', height: '80px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
                    />
                </div>

                <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}>
                    Save Log
                </button>
            </form>

            {/* List displaying past logs */}
            <div>
                <h3>Recent Logs</h3>
                {logs.length === 0 ? (
                    <p style={{ color: '#666' }}>No logs yet. Create your first one above!</p>
                ) : (
                    logs.map(log => (
                        <div key={log._id} style={{ border: '1px solid #eee', padding: '15px', marginBottom: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <strong>Score: {log.moodScore}/10</strong>
                            </div>
                            <p style={{ margin: '0', color: '#444' }}>{log.notes || <em>No notes provided.</em>}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}