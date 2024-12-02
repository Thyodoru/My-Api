const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Endpoint para autenticação
router.post('/auth', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).send('Credenciais inválidas');
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ token });
});

// Endpoint para consulta de dados em conjuntos
router.get('/users', authenticateToken, async (req, res) => {
    const users = await User.find();
    res.json(users);
});

// Endpoint para consulta de item individual por seu atributo de identificação
router.get('/users/:id', authenticateToken, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.sendStatus(404);
    res.json(user);
});

// Endpoint para gravação de um novo item no cadastro/BD
router.post('/users', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser  = new User({ username, email, password: hashedPassword });
    await newUser .save();
    res.status(201).json(newUser );
});

router.put('/users/:id', authenticateToken, async (req, res) => {
    try {
        const updatedUser  = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedUser ) {
            return res.sendStatus(404); // Retorna 404 se o usuário não for encontrado
        }
        res.json(updatedUser ); // Retorna o usuário atualizado
    } catch (error) {
        console.error(error);
        res.sendStatus(500); // Retorna 500 em caso de erro no servidor
    }
});