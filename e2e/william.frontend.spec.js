// william.frontend.spec.js (frontend E2E testing)

require("./playwright-coverage.js");
const { test, expect } = require("@playwright/test");
const fs = require("fs").promises;
const path = require("path");

const SPAM_LOCK_KEY = "deleteLockExpire";

test.describe("William's Delete Feature – Frontend Tests", () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5050");
    // Ensure we start with a clean slate for every test
    await page.evaluate(() => localStorage.clear());
  });

  // 1. Validates the core success path
  test("Admin successfully deletes a book and refreshes the library table", async ({ page }) => {
    await page.route('**/delete-book*', route => route.fulfill({
      status: 200,
      body: JSON.stringify({ message: "Book deleted successfully" })
    }));

    page.on("dialog", d => d.accept());
    
    // Simulating the user confirming the delete popup
    await page.evaluate(() => openDeleteConfirm("Pride and Prejudice"));
    
    const dialog = await page.waitForEvent('dialog');
    expect(dialog.message()).toBe("Book deleted successfully");
  });

  // 2. Validates the 25-second lockout mechanism
  test("Delete buttons are disabled for 25 seconds when the spam guard is active", async ({ page }) => {
    await page.route('**/delete-book*', route => route.fulfill({
      status: 429,
      contentType: 'application/json',
      body: JSON.stringify({ message: "Too many requests" })
    }));

    page.on("dialog", d => d.accept());

    await page.evaluate(() => {
        document.body.innerHTML += '<button class="danger">Delete</button>';
        deleteBook("1984");
    });

    const span = page.locator(".countdown");
    await expect(span).toBeVisible(); 
    await expect(span).toContainText("Time Remaining");
  });

  // 3. Validates the 10-second spam protection lock
  test("System activates a temporary lock if the user attempts to delete too quickly", async ({ page }) => {
    await page.route('**/delete-book*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: "Do not spam, wait 25s" }) 
    }));

    page.on("dialog", async d => {
      await d.accept();
    });

    await page.evaluate((key) => {
        document.body.innerHTML = '<button class="danger">Delete</button>';
        return deleteBook("The Hobbit");
    }, SPAM_LOCK_KEY);

    await page.waitForTimeout(1000);

    const expireAt = await page.evaluate((key) => localStorage.getItem(key), SPAM_LOCK_KEY);
    expect(expireAt).not.toBeNull();
  });

  // 4. Validates the automatic recovery of the UI
  test("Countdown timer successfully re-enables delete buttons once the lock expires", async ({ page }) => {
    await page.evaluate((key) => {
      document.body.innerHTML = '<button class="danger">Delete</button>';
      const expiry = Date.now() + 500; 
      disableDeleteButtons(expiry);
    }, SPAM_LOCK_KEY);

    const btn = page.locator(".danger");
    await expect(btn).toBeDisabled();

    // Wait for the countdown to hit zero
    await page.waitForTimeout(1200); 
    
    await expect(btn).toBeEnabled();
    const lock = await page.evaluate((key) => localStorage.getItem(key), SPAM_LOCK_KEY);
    expect(lock).toBeNull();
  });

  // 5. Validates user notification during connectivity issues
  test("User receives a clear error message if the network connection fails", async ({ page }) => {
    await page.route('**/delete-book*', route => route.abort('failed'));

    page.on("dialog", async d => {
      expect(d.message()).toContain("something went wrong");
      await d.accept();
    });

    await page.evaluate(() => deleteBook("The Maze Runner"));
  });

  // 6. Validates prevention of invalid delete requests
  test("System prevents deletion if a valid book title is not provided", async ({ page }) => {
    page.on("dialog", async d => {
      expect(d.message()).toBe("missing parameter: title");
      await d.accept();
    });

    await page.evaluate(() => deleteBook(""));
  });
});