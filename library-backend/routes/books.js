const express = require('express');
const router = express.Router();
const { getConnection } = require('../db/oracle');

// POST /books  -> add a book
router.post('/addbooks', async (req, res) => {
  const { title, author, genre, isbn, pub_year } = req.body;
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
     ` BEGIN add_book_sp(:title, :author,  :isbn, :pub_year); END;`,
      { title, author, isbn, pub_year },
      { autoCommit: true }
    );
    res.status(201).json({ success: true, message: 'BOOK SUCCESSFULLY ADDED' });
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).json({ message: 'ERROR ADDING BOOK', detail: err.message });
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
});

// GET /books -> list books (simple example)
router.get('/getbooks', async (_req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(`SELECT * from lms_books ORDER BY TITLE`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ message: 'ERROR FETCHING BOOKS', detail: err.message });
  } finally {
    if (conn) await conn.close().catch(() => {});
  }
});

module.exports = router;