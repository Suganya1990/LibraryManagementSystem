require('dotenv').config();
const express = require('express');
const cors = require('cors');

const loginRoutes = require('./routes/login');
const bookRoutes = require('./routes/books'); // add later
const { auth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.send('Library API up.'));

app.use('/api', loginRoutes);
app.use('/books', bookRoutes); // example protect later

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.listen(PORT, () => console.log(`Server running http://localhost:${PORT}`));