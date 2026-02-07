// william.util.test.js (unit testing)
const fs = require("fs").promises;
const path = require("path");
const williamUtil = require("../utils/williamUtil");
const { deleteBook, registerDeleteAttempt, resetSpamGuard } = williamUtil;

const BOOK_FILE = path.join(__dirname, "../utils/books.json");

// dummy data for simplicity and consistency
const DUMMY_BOOKS = {
  books: [
{
      "user": "administrator",
      "title": "Pride and Prejudice",
      "author": "Jane Austen",
      "content": "The famous story of Elizabeth Bennet and Mr. Darcy, exploring love, class, and social rules in 19th-century England."
    },
    {
      "user": "administrator",
      "title": "The Girl with the Dragon Tattoo",
      "author": "Stieg Larsson",
      "content": "A journalist and a young computer hacker work together to solve a 40-year-old missing person case from a rich, complicated family."
    },
    {
      "user": "administrator",
      "title": "1984",
      "author": "George Orwell",
      "content": "A warning about a future society ruled by a powerful and watching government, and one man's struggle for freedom and thought."
    },
    {
      "user": "administrator",
      "title": "The Maze Runner",
      "author": "James Dashner",
      "content": "A teenage boy wakes up with no memory inside a huge maze, where he and other teens must fight to survive and find a way out."
    },
    {
      "user": "administrator",
      "title": "The Hobbit",
      "author": "J.R.R. Tolkien",
      "content": "A hobbit named Bilbo Baggins is whisked away into a quest to reclaim a lost kingdom from a dragon."
    },
    {
      "user": "administrator",
      "title": "Atomic Habits",
      "author": "James Clear",
      "content": "A practical guide to building good habits and breaking bad ones, with actionable strategies for lasting change."
    }
  ]
};

describe("William's Delete Feature – Realistic Backend Unit Tests", () => {
  let req, res;
  let originalBooks;

  beforeAll(async () => {
    // Backup real data once just in case
    try {
      originalBooks = await fs.readFile(BOOK_FILE, "utf8");
    } catch (e) {
      originalBooks = JSON.stringify({ books: [] });
    }
    jest.useFakeTimers();
  });

  afterAll(async () => {
    // Restore the user's real data when finished
    await fs.writeFile(BOOK_FILE, originalBooks, "utf8");
    jest.useRealTimers();
  });

  beforeEach(async () => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    if (typeof resetSpamGuard === 'function') {
      resetSpamGuard();
    }

    // ALWAYS reset the file to the DUMMY DATA before each test
    await fs.writeFile(BOOK_FILE, JSON.stringify(DUMMY_BOOKS), "utf8");
  });

  // --- TEST CASES FOR BACKEND TEST ---

  // Test Case 1: Missing Parameter Validation
  test("should return 400 if title is missing before delete", async () => {
    await deleteBook(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "missing parameter: title" })
    );
  });

  // Test Case 2: Rate Limit Enforcement
  test("should return 429 if spam guard is active", async () => {
    for (let i = 0; i < 4; i++) registerDeleteAttempt();

    req.query.title = "1984";
    await deleteBook(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Do not spam: wait 30s" })
    );
  });

  // Test Case 3: Successful Record Deletion
  test("should delete an existing book successfully and return 200", async () => {
    req.query.title = "The Maze Runner"; 
    await deleteBook(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "book successfully deleted" })
    );

    const updatedBooks = JSON.parse(await fs.readFile(BOOK_FILE, "utf8"));
    expect(updatedBooks.books.find((b) => b.title === "The Maze Runner")).toBeUndefined();
  });

  // Test Case 4: Non-Existent Resource
  test("should return 404 if book not found", async () => {
    req.query.title = "NonExistentBook";
    await deleteBook(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "book not found" })
    );
  });

  // Test Case 5: Spam Guard Activation Logic
  test("should trigger spam lock after 4 quick deletes", async () => {
    // Delete 4 different books from our dummy list
    const titles = ["Pride and Prejudice", "1984", "The Hobbit", "Atomic Habits"];

    for (let t of titles) {
      req.query.title = t;
      await deleteBook(req, res);
    }

    // 5th attempt should lock
    req.query.title = "The Alchemist";
    await deleteBook(req, res);

    expect(res.status).toHaveBeenCalledWith(429);
  });

  // Test Case 6: Case Sensitivity Validation
  test("should be case-sensitive and return 404 if casing is wrong", async () => {
    // Database has "The Maze Runner", we send lowercase
    req.query.title = "the maze runner"; 
    
    await deleteBook(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "book not found" })
    );
  });

  // Test Case 7: Empty Database Robustness
  test("should handle an empty database gracefully", async () => {
    // Manually override dummy data with an empty list for this specific test
    await fs.writeFile(BOOK_FILE, JSON.stringify({ books: [] }), "utf8");

    req.query.title = "Any Book";
    await deleteBook(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});