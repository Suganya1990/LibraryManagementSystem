const express = require('express');
const oracledb = require('oracledb');
const router = express.Router();
const { getConnection } = require('../db/oracle');
const { fetchAllFromCursor } = require('../utils/oracle-helper');

/* =========================================
   CREATE
========================================= */
router.post('/addbooks', async (req, res) => {
  const { title, author, genre, isbn, pub_year } = req.body || {};
  if (!title || !author) {
    return res.status(400).json({ message: 'title and author are required' });
  }

  let conn;
  try {
    conn = await getConnection();
   await conn.execute(
  `BEGIN add_book_sp(:title, :author, :genre, :isbn, :pub_year); END;`,
  {
    title: String(title).trim(),
    author: String(author).trim(),
    genre: genre != null ? String(genre).trim() : null,  // <-- added
    isbn:  isbn  != null ? String(isbn).trim()  : null,
    pub_year: pub_year != null ? Number(pub_year) : null,
  },
  { autoCommit: true }
);
    res.status(201).json({ success: true, message: 'BOOK SUCCESSFULLY ADDED' });
  } catch (err) {
    console.error('addbooks error:', err);
    res.status(500).json({ message: 'ERROR ADDING BOOK', detail: String(err) });
  } finally {
    try { await conn?.close(); } catch {}
  }
});

/* =========================================
   READ ALL (REF CURSOR)
========================================= */
router.get('/getbooks', async (_req, res) => {
    debugger;             
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `BEGIN get_books_sp(:rc); END;`,
      { rc: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } }
    );
    const rows = await fetchAllFromCursor(result.outBinds.rc);
    res.json(rows);
  } catch (err) {
    console.error('getbooks error:', err);
    res.status(500).json({ message: 'ERROR FETCHING BOOKS', detail: String(err) });
  } finally {
    try { await conn?.close(); } catch {}
  }
});

/* =========================================
   READ ONE BY ID (REF CURSOR)
========================================= */
router.get('/book/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid book id' });

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `BEGIN get_book_sp(:id, :rc); END;`,
      {
        id,
        rc: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR }
      }
    );
    const rows = await fetchAllFromCursor(result.outBinds.rc);
    if (!rows.length) return res.status(404).json({ error: 'Book not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('get book error:', err);
    res.status(500).json({ error: 'ERROR FETCHING BOOK', detail: String(err) });
  } finally {
    try { await conn?.close(); } catch {}
  }
});

/* =========================================
   UPDATE (partial)
========================================= */
router.put('/updatebook/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid book id' });

  const { title, author, genre, isbn, pub_year } = req.body || {};
  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `BEGIN update_book_sp(:id, :title, :author, :genre, :isbn, :pub_year); END;`,
      {
        id,
        title: title == null ? null : String(title).trim(),
        author: author == null ? null : String(author).trim(),
        genre: genre == null ? null : String(genre).trim(),
        isbn:  isbn  == null ? null : String(isbn).trim(),
        pub_year: pub_year == null ? null : Number(pub_year)
      },
      { autoCommit: true }
    );

    // return updated row
    const result = await conn.execute(
      `BEGIN get_book_sp(:id, :rc); END;`,
      { id, rc: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } }
    );
    const rows = await fetchAllFromCursor(result.outBinds.rc);
    res.status(200).json({ message: 'Book updated', book: rows[0] || null });
  } catch (err) {
    // forward “Book not found” application error nicely
    if (String(err).includes('-20001')) {
      return res.status(404).json({ error: 'Book not found' });
    }
    console.error('update error:', err);
    res.status(500).json({ error: 'Failed to update book', detail: String(err) });
  } finally {
    try { await conn?.close(); } catch {}
  }
});

/* =========================================
   DELETE (child rows handled in SP)
========================================= */
router.delete('/deletebook/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid book id' });

  let conn;
  try {
    conn = await getConnection();
    await conn.execute(
      `BEGIN delete_book_sp(:id); END;`,
      { id },
      { autoCommit: true }
    );
    res.status(200).json({ message: 'Book deleted' });
  } catch (err) {
    if (String(err).includes('-20002')) {
      return res.status(404).json({ error: 'Book not found' });
    }
    // If your SP didn’t delete children and FK blocks:
    if (String(err).includes('ORA-02292')) {
      return res.status(409).json({ error: 'Cannot delete: book has related records.' });
    }
    console.error('delete error:', err);
    res.status(500).json({ error: 'Failed to delete book', detail: String(err) });
  } finally {
    try { await conn?.close(); } catch {}
  }
});

module.exports = router;
