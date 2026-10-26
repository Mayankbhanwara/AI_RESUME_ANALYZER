require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const resumeRoutes = require('./routes/resume');

const app = express();

connectDB();
console.log('API Key loaded:', process.env.OPENROUTER_API_KEY);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/resume', resumeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));