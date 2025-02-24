const express = require('express'); 
const app = express(); 
const port = 3000;

const mariadb = require("mariadb"); 
const pool = mariadb.createPool({
   host: 'localhost', 
   user: 'root', 
   password: 'root', 
   database: 'sample', 
   port: 3306, 
   connectionLimit: 5 
});

const { body, param, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

app.use(express.json());

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
app.get('/students/:id', async (req, res) => {
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
app.post('/students', async (req, res) => {
    try {
        const { name, email, age } = req.body;
        const conn = await pool.getConnection();
        const result = await conn.query("INSERT INTO students (name, email, age) VALUES (?, ?, ?)", [sanitizeHtml(name), email, age]);
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
app.patch('/students/:id', async (req, res) => {
    try {
        const { email } = req.body;
        const conn = await pool.getConnection();
        const result = await conn.query("UPDATE students SET email = ? WHERE id = ?", [email, req.params.id]);
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
app.delete('/students/:id', async (req, res) => {
    try {
        const conn = await pool.getConnection();
        const result = await conn.query("DELETE FROM students WHERE id = ?", [req.params.id]);
        conn.release();
        res.json({ message: "Student deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log('Server running at http://localhost:${port}');
    console.log('Swagger Docs available at http://localhost:${port}/api-docs');
});