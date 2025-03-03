const express = require('express'); 
const axios = require('axios');
const mariadb = require("mariadb"); 
const { body, param, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express(); 
const port = 3000;

app.use(express.json());

// Database Connection Pool
const pool = mariadb.createPool({
   host: 'localhost', 
   user: 'root', 
   password: 'root', 
   database: 'sample', 
   port: 3306, 
   connectionLimit: 5 
});

// Swagger setup
const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Student API",
            version: "1.0.0",
            description: "A simple API for managing students and courses",
        },
    },
    apis: ["./server.js"], 
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Retrieve all students
 *     responses:
 *       200:
 *         description: A list of students.
 */
app.get('/students', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM students");
        conn.release();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Retrieve a student by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The student ID
 *     responses:
 *       200:
 *         description: A student object
 *       404:
 *         description: Student not found
 */
app.get('/students/:id', [
    param('id').isInt().withMessage('Student ID must be an integer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const conn = await pool.getConnection();
        const rows = await conn.query("SELECT * FROM students WHERE id = ?", [req.params.id]);
        conn.release();
        res.json(rows.length ? rows[0] : { message: "Student not found" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Add a new student
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               age:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Student created successfully
 */
app.post('/students', [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Invalid email'),
    body('age').isInt().withMessage('Age must be an integer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { name, email, age } = req.body;
        const sanitizedEmail = sanitizeHtml(email);
        const conn = await pool.getConnection();
        const result = await conn.query("INSERT INTO students (name, email, age) VALUES (?, ?, ?)", 
                                        [sanitizeHtml(name), sanitizedEmail, age]);
        conn.release();
        res.status(201).json({ message: "Student added successfully", studentId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /students/{id}:
 *   patch:
 *     summary: Update a student's email
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Student updated successfully
 */
app.patch('/students/:id', [
    param('id').isInt().withMessage('Student ID must be an integer'),
    body('email').isEmail().withMessage('Invalid email')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email } = req.body;
        const sanitizedEmail = sanitizeHtml(email);
        const conn = await pool.getConnection();
        await conn.query("UPDATE students SET email = ? WHERE id = ?", [sanitizedEmail, req.params.id]);
        conn.release();
        res.json({ message: "Student email updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Delete a student
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The student ID
 *     responses:
 *       200:
 *         description: Student deleted successfully
 */
app.delete('/students/:id', [
    param('id').isInt().withMessage('Student ID must be an integer')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const conn = await pool.getConnection();
        await conn.query("DELETE FROM students WHERE id = ?", [req.params.id]);
        conn.release();
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/say', async (req, res) => {
    try {
        const keyword = req.query.keyword || "nothing";
        const azureFunctionUrl = `https://shashankhfunction123.azurewebsites.net/api/Function?keyword=${keyword}`;
        const response = await axios.get(azureFunctionUrl);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Error calling Azure Function" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Swagger Docs available at http://localhost:${port}/api-docs`);
});
