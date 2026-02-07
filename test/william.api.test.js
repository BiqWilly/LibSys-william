// william.api.test.js (API testing)
const request = require("supertest");
const fs = require("fs").promises;
const path = require("path");
const { app, server } = require("../index");
const williamUtil = require("../utils/williamUtil");

const BOOK_FILE = path.join(__dirname, "../utils/books.json");

// DUMMY DATA for API consistency
// DUMMY DATA for simplicity and consistency
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

describe("William's Delete Feature – API Test", () => {
  let originalBooks;

  beforeAll(async () => {
    // Backup real data
    try {
      originalBooks = await fs.readFile(BOOK_FILE, "utf8");
    } catch (e) {
      originalBooks = JSON.stringify({ books: [] });
    }
  });

  afterAll(async () => {
    // Restore real data and close server
    await fs.writeFile(BOOK_FILE, originalBooks, "utf8");
    await server.close();
  });

  beforeEach(async () => {
    // 1. Reset Spam Guard state
    if (williamUtil.resetSpamGuard) {
      williamUtil.resetSpamGuard();
    }
    // 2. Reset JSON file to Dummy Data
    await fs.writeFile(BOOK_FILE, JSON.stringify(DUMMY_BOOKS), "utf8");
  });

  // --- API TEST CASES---

  // Test Case 1: Missing Parameter Validation
  test("DELETE /delete-book should return 400 if title missing", async () => {
    const res = await request(app).delete("/delete-book");

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("missing parameter: title");
  });

  // Test Case 2: Non-Existent Resource
  test("DELETE /delete-book should return 404 if book not found", async () => {
    const res = await request(app)
      .delete("/delete-book")
      .query({ title: "NonExistentBook" });

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toContain("book not found");
  });

  // Test Case 3: Successful Deletion (Integration Path)
  test("DELETE /delete-book should return 200 on successful deletion", async () => {
    const res = await request(app)
      .delete("/delete-book")
      .query({ title: "The Maze Runner" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain("book successfully deleted");
  });

  // Test Case 4: Network-Level Rate Limiting (429)
  test("DELETE /delete-book should return 429 when spamming the API", async () => {
    // Send 4 requests quickly to trigger the lock
    const title = "1984";
    for (let i = 0; i < 4; i++) {
      await request(app).delete("/delete-book").query({ title });
    }

    // The 5th request should hit the 429 status
    const res = await request(app)
      .delete("/delete-book")
      .query({ title });

    expect(res.statusCode).toBe(429);
    expect(res.body.message).toContain("Do not spam");
  });
});