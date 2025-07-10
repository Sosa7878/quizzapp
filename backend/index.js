const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');
const adminRoutes = require('./routes/admin');
const notesRoutes = require('./routes/notes');

console.log('authRoutes:', authRoutes);
console.log('quizRoutes:', quizRoutes);
console.log('adminRoutes:', adminRoutes);
console.log('notesRoutes:', notesRoutes);

const app = express();
const PORT = 4000;

require('./db');

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api', quizRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', notesRoutes);

app.get('/', (req, res) => {
  res.send('Quiz API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});