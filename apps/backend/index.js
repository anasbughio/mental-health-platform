const express = require('express');
const userRoutes = require('./routes/UserRoutes');
const app = express();
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
const PORT = process.env.PORT || 3000;

app.use(express.json());


// Root route
app.get('/', (req, res) => {
    res.send('Mental Health Platform API is running. Access /api/health for status.');
});

app.use('/api/auth',userRoutes);

connectDB();
app.listen(PORT, () => {
    console.log(`Server is listening  on  port ${PORT}`);
});