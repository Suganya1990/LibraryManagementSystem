require('dotenv').config();
const express = require('express');
const cors = require('cors');

const loginRoutes = require('./routes/login');
const bookRoutes = require('./routes/books'); // add later
const { auth } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.use(cors({ origin: 'http://localhost:4200' })); 

// log requests so we see what hits
app.use((req, _res, next) => { console.log(req.method, req.url); next(); });

app.get('/', (_req, res) => res.send('Library API up.'));

app.use('/api', require('./routes/login'));
app.use('/books', require('./routes/books')); // example protect later

app.use((req, res) => res.status(404).json({ message: 'Not found' }));
app.listen(PORT, () => console.log(`Server running http://localhost:${PORT}`));