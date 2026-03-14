const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const userRoutes = require('./routes/UserRoutes');
const connectDB = require('./config/db');
const cookieParser = require('cookie-parser');
const chatRoutes = require('./routes/chatRoutes');
const cors = require('cors');
const cron = require('node-cron');
const { sendDailyReminders } = require('./controllers/notificationController');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(express.json());
app.use(cors({
  origin: [ "https://d1b25710g4zbqm.cloudfront.net" ,"http://localhost:5173" ],// frontend URL during development
  credentials: true // <-- important to allow cookies
}));
// Root route
app.get('/', (req, res) => {
    res.send('Mental Health Platform API is running. Access /api/health for status.');
});

app.use('/api/moods',require('./routes/MoodRoutes'));
app.use('/api/auth',userRoutes);
app.use('/api/chat', chatRoutes); 
app.use('/api/journal', require('./routes/JournalRoutes'));
app.use('/api/goals', require('./routes/GoalRoutes'));
app.use('/api/crisis', require('./routes/CrisisRoutes'));
app.use('/api/sentiment', require('./routes/SentimentRoutes'));
app.use('/api/weekly-report', require('./routes/WeeklyReportRoutes'));
app.use('/api/exercises', require('./routes/ExerciseRoutes'));
app.use('/api/notifications', require('./routes/NotificationRoutes'));
app.use('/api/sleep', require('./routes/SleepRoutes'));
app.use('/api/analytics', require('./routes/AnalyticsRoutes'));

cron.schedule('* * * * *', () => {
    sendDailyReminders();
});


connectDB();
app.listen(PORT, () => {
    console.log(`Server is listening   port ${PORT}`);
});