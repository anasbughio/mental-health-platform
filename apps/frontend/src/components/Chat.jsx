import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../config/axios';
import CrisisBanner from './CrisisBanner';

const INITIAL_GREETING = { text: "Hi there. I'm your AI companion. How are you feeling right now?", isUser: false };

export default function Chat() {
    const [messages, setMessages] = useState([INITIAL_GREETING]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [crisisData, setCrisisData] = useState(null);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const loadHistory = async () => {
            try {
                const response = await api.get('/chat/history');
                const dbMessages = response.data.data;
                if (dbMessages.length > 0) {
                    const uiMessages = dbMessages.map(msg => ({
                        text: msg.text,
                        isUser: msg.role === 'user'
                    }));
                    setMessages([INITIAL_GREETING, ...uiMessages]);
                }
            } catch (err) {
                if (err.response?.status === 401) navigate('/login');
            }
        };
        loadHistory();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const checkForDistress = async (text) => {
        try {
            const res = await api.post('/crisis/detect', { text });
            const data = res.data.data;
            if (data.isDistressed && data.severity !== 'none') {
                setCrisisData({ severity: data.severity });
            }
        } catch {
            // Fail silently
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        const userText = input;
        setInput('');
        setMessages(prev => [...prev, { text: userText, isUser: true }]);
        setIsLoading(true);
        checkForDistress(userText);
        try {
            const response = await api.post('/chat', { message: userText });
            setMessages(prev => [...prev, { text: response.data.reply, isUser: false }]);
        } catch (err) {
            if (err.response?.status === 401) navigate('/login');
            else setMessages(prev => [...prev, { text: "Sorry, I'm having trouble connecting right now.", isUser: false }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', height: '80vh' }}>
            {crisisData && <CrisisBanner severity={crisisData.severity} onDismiss={() => setCrisisData(null)} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                <h2>AI Companion</h2>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <Link to="/crisis" style={{ fontSize: '13px', color: '#dc2626', fontWeight: '600', textDecoration: 'none' }}>🆘 Crisis Help</Link>
                    <Link to="/dashboard" style={{ textDecoration: 'none', color: '#007BFF', fontWeight: 'bold' }}>&larr; Dashboard</Link>
                </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {messages.map((msg, index) => (
                    <div key={index} style={{ alignSelf: msg.isUser ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                        <div style={{ padding: '12px 16px', borderRadius: '18px', backgroundColor: msg.isUser ? '#007BFF' : '#eef2ff', color: msg.isUser ? 'white' : '#333', borderBottomRightRadius: msg.isUser ? '4px' : '18px', borderBottomLeftRadius: msg.isUser ? '18px' : '4px', border: msg.isUser ? 'none' : '1px solid #c7d2fe', lineHeight: '1.4' }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && <div style={{ alignSelf: 'flex-start', color: '#888', fontStyle: 'italic', fontSize: '14px' }}>Companion is typing...</div>}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." disabled={isLoading} style={{ flex: 1, padding: '12px', borderRadius: '24px', border: '1px solid #ccc', outline: 'none' }} />
                <button type="submit" disabled={isLoading || !input.trim()} style={{ padding: '0 20px', borderRadius: '24px', backgroundColor: input.trim() && !isLoading ? '#28a745' : '#ccc', color: 'white', border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Send</button>
            </form>
        </div>
    );
}