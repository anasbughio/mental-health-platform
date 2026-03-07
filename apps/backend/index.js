const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const userRoutes = require('./routes/UserRoutes');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.send('Mental Health Platform API is running. Access /api/health for status.');
});

app.use('/api/moods',require('./routes/MoodRoutes'));
app.use('/api/auth',userRoutes);
connectDB();
app.listen(PORT, () => {
    console.log(`Server is listening  port ${PORT}`);
});