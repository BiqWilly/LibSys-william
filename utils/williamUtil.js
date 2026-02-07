// William's responsibility: DELETE books

const fs = require('fs').promises;
const path = require('path');

const BOOK_FILE = path.join(__dirname, 'books.json');
const TEMPLATE_FILE = path.join(__dirname, 'books.template.json');

let deleteTimestamps = [];
let locked = false;


// rate limit check for DELETE
function spamGuardActive() {
  return locked;
}


// register delete attempt
function registerDeleteAttempt() {
  const now = Date.now();
  deleteTimestamps.push(now);
  deleteTimestamps = deleteTimestamps.filter(t => now - t <= 10000);

  // if 4 successful deletes in 10s, 5th attempt will lock the delete button for 25s
  if (deleteTimestamps.length >= 4 && !locked) {
    locked = true;
    setTimeout(() => {
      locked = false;
      deleteTimestamps = [];
    }, 30000);
  }
}

// read books from JSON file
async function readBooksFile() {
  try {
    const raw = await fs.readFile(BOOK_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    // only handle file not found, let other errors propagate
    if (e.code !== 'ENOENT') {
      throw e;
    }
    
    // fallback template
    try {
      const tpl = await fs.readFile(TEMPLATE_FILE, 'utf8');
      await fs.writeFile(BOOK_FILE, tpl, 'utf8');
      return JSON.parse(tpl);
    } catch {
      await fs.writeFile(BOOK_FILE, JSON.stringify({ books: [] }, null, 2), 'utf8');
      return { books: [] };
    }
  }
}

// write updated books to JSON file
async function writeBooksFile(data) {
  await fs.writeFile(BOOK_FILE, JSON.stringify(data, null, 2), 'utf8');
}


// DELETE /books?title=...
async function deleteBook(req, res) {
  try {
    if (spamGuardActive()) return res.status(429).json({ success: false, message: "Do not spam: wait 30s" });

    const { title } = req.query;
    if (!title) return res.status(400).json({ success: false, message: "missing parameter: title" });

    const data = await readBooksFile();
    const beforeCount = data.books.length;
    data.books = data.books.filter(b => b.title !== title);
    registerDeleteAttempt();

    if (data.books.length === beforeCount) return res.status(404).json({ success: false, message: "book not found" });

    await writeBooksFile(data);
    return res.status(200).json({ success: true, message: "book successfully deleted" });
  } catch (err) {
    console.error("deleteBook error:", err);
    return res.status(500).json({ success: false, message: "something went wrong — try again later" });
  }
}

// reset spam guard  for testing
function resetSpamGuard() {
  deleteTimestamps = [];
  locked = false;
}

module.exports = {
  readBooksFile,
  writeBooksFile,
  spamGuardActive,
  registerDeleteAttempt,
  deleteBook,
  resetSpamGuard
};
