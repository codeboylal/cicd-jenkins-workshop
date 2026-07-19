const express = require('express');
const cors = require('cors');
const { pool, waitForDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'tasktracker-backend' });
});

app.get('/api/tasks', async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
  res.json(result.rows);
});

app.post('/api/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const result = await pool.query(
    'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
    [title.trim()]
  );
  res.status(201).json(result.rows[0]);
});

app.patch('/api/tasks/:id/toggle', async (req, res) => {
  const result = await pool.query(
    'UPDATE tasks SET done = NOT done WHERE id = $1 RETURNING *',
    [req.params.id]
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'task not found' });
  }
  res.json(result.rows[0]);
});

app.delete('/api/tasks/:id', async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

waitForDb()
  .then(() => {
    app.listen(PORT, () => console.log(`tasktracker-backend listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
