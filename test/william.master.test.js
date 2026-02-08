/**
 * @jest-environment jsdom
 */

//william.master.test.js, a test for full coverage of williamUtil.js, DeleteResourceUtil.js, and william.js (integration testing)

// Node Imports
const fs = require('fs').promises;
const path = require('path');

// Backend Imports
const williamUtil = require('../utils/williamUtil');
const { deleteBook, resetSpamGuard, readBooksFile } = williamUtil;
const { deleteResource } = require('../utils/DeleteResourceUtil');

// Frontend Import
const williamFrontend = require('../public/js/william.js');

// Constants for files
const BOOK_FILE = path.join(__dirname, '../utils/books.json');
const RESOURCES_FILE = path.join(__dirname, '../utils/resources.json');

const DUMMY_BOOKS = {
    "books": [
        { "user": "admin", "title": "Pride and Prejudice", "author": "Jane Austen", "content": "19th-century England." },
        { "user": "admin", "title": "The Girl with the Dragon Tattoo", "author": "Stieg Larsson", "content": "Missing person case." },
        { "user": "admin", "title": "The Maze Runner", "author": "James Dashner", "content": "Memory inside a maze." },
        { "user": "admin", "title": "The Hobbit", "author": "J.R.R. Tolkien", "content": "Quest for a lost kingdom." },
        { "user": "admin", "title": "Atomic Habits", "author": "James Clear", "content": "Building good habits." },
        { "user": "administrator", "title": "Last Book Standing", "author": "James Clark", "content": " hope this books saves the backend test" }
    ]
};

const DUMMY_RESOURCES = [{ id: "1", name: "Resource A" }, { id: "2", name: "Resource B" }];

describe("William's Full Coverage Master Suite", () => {
    let req, res;

    beforeEach(async () => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
        jest.useFakeTimers();

        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        req = { query: {}, params: {} };

        // Setup JSDOM
        document.body.innerHTML = `<button class="danger">Delete</button>`;
        localStorage.clear();
        global.alert = jest.fn();
        global.confirm = jest.fn();
        global.fetch = jest.fn();
        global.loadBooks = jest.fn();

        if (resetSpamGuard) resetSpamGuard();

        // Write fresh data
        await fs.writeFile(BOOK_FILE, JSON.stringify(DUMMY_BOOKS), 'utf8');
        await fs.writeFile(RESOURCES_FILE, JSON.stringify(DUMMY_RESOURCES), 'utf8');
    });

    afterEach(() => {
        // Stop any background timers to prevent worker leaks
        jest.runOnlyPendingTimers();
        for (let i = 1; i < 100; i++) window.clearInterval(i);
        jest.useRealTimers();
    });

    // --- FRONTEND: william.js ---
    describe("Frontend Coverage (william.js)", () => {
        test("Branch: Handle fetch network crash", async () => {
            global.fetch.mockRejectedValue(new Error("Network Failure"));
            await williamFrontend.deleteBook("The Hobbit");
            expect(global.alert).toHaveBeenCalledWith(expect.stringContaining("wrong"));
        });

        test("Branch: User cancels confirm popup", () => {
            global.confirm.mockReturnValue(false);
             // global.confirm.mockReturnValue(true); // Changed to true to test failure for email notification
            williamFrontend.openDeleteConfirm("The Hobbit");
            expect(global.fetch).not.toHaveBeenCalled();
        });
    });

    // --- BACKEND: williamUtil.js ---
    describe("Backend Coverage (williamUtil.js)", () => {
        test("Success Path: Deletes 'The Hobbit'", async () => {
            req.query.title = "The Hobbit";
            await deleteBook(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("Branch: Spam Guard Activation (429)", async () => {
            const titles = ["Pride and Prejudice", "The Girl with the Dragon Tattoo", "The Maze Runner", "The Hobbit"];
            for (let t of titles) {
                req.query.title = t;
                await deleteBook(req, res);
            }
            req.query.title = "Atomic Habits";
            await deleteBook(req, res);
            expect(res.status).toHaveBeenCalledWith(429);
        });

        test("Branch: Book Not Found (404)", async () => {
            req.query.title = "Non-Existent Book";
            await deleteBook(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        test("Catch Block: Force 500 error", async () => {
            // 1. Mock fs.readFile to throw a critical error
            // Using mockImplementation ensures we bypass all try/catches inside readBooksFile
            const spy = jest.spyOn(require('fs').promises, 'readFile').mockImplementation(() => {
                throw new Error("Critical Database Failure");
            });

            req.query.title = "The Hobbit";

            // 2. This will now definitely trigger the catch block in deleteBook
            await deleteBook(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));

            // 3. Cleanup
            spy.mockRestore();
        });
    });

    // --- BACKEND: DeleteResourceUtil.js ---
    describe("Backend Coverage (DeleteResourceUtil.js)", () => {
        test("Success Path: Deletes Resource by ID", async () => {
            req.params.id = "1";
            await deleteResource(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test("Branch: ID not found (404)", async () => {
            req.params.id = "999";
            await deleteResource(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        test("Branch: Handle missing resource file (ENOENT)", async () => {
            const spy = jest.spyOn(fs, 'readFile').mockRejectedValue({ code: 'ENOENT' });
            req.params.id = "1";
            await deleteResource(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
            spy.mockRestore();
        });

        test("Catch Block: Generic error (500)", async () => {
            const spy = jest.spyOn(fs, 'readFile').mockRejectedValue(new Error("Unknown Crash"));
            req.params.id = "1";
            await deleteResource(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            spy.mockRestore();
        });
    });
});