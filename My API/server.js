const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB conectado'))
    .catch(err => console.log(err));

// Middleware para autenticação
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Endpoint para autenticação
app.post('/auth', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
        return res.status(401).send('Credenciais inválidas');
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
});

// Endpoint para consulta de dados em conjuntos
app.get('/users', authenticateToken, async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// Endpoint para consulta de item individual por seu atributo de identificação
app.get('/users/:id', authenticateToken, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.sendStatus(404);
    res.json(user);
});

// Endpoint para gravação de um novo item no cadastro/BD
app.post('/users', async (req, res) => {
    const { username, email, password } = req.body;
    const newUser  = new User({ username, email, password });
    await newUser .save();
    res.status(201).json(newUser );
});

// Endpoint para alterar um item inteiro no cadastro/BD
app.put('/users/:id', authenticateToken, async (req, res) => {
    const updatedUser  = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedUser ) return res.sendStatus(404);
    res.json(updatedUser );
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});