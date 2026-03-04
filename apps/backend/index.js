const express = require('express');
const app = express();

// We map port 3000 to port 80 in our GitHub Actions SSM command
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.send('Mental Health Platform API is running. Access /api/health for status.');
});

// Standard DevOps Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'The containerized API is live and responding!',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`Server is listening   port ${PORT}`);
});