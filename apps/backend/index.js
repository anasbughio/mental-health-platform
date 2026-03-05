const express = require('express');
const app = express();
const dotenv = require('dotenv');
const mongoose = require('mongoose');
// We map port 3000 to port 80 in our GitHub Actions SSM command
dotenv.config();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.send('Mental Health Platform API is running. Access /api/health for status.');
});

// Standard DevOps Health Check Route
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
        status: 'success',
        message: 'The containerized API is live and responding!',
        timestamp: new Date().toISOString()
    });
});

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('Connected to MongoDB');
}   ).catch((err) => {  
    console.error('Error connecting to MongoDB:', err);
}); 

app.listen(PORT, () => {
    console.log(`Server is listening  on  port ${PORT}`);
});