const { test } = require("@playwright/test");
const fs = require("fs").promises;
const path = require("path");

// Global array to store JavaScript coverage data across tests
let jsCoverage = [];

// Directory where coverage files will be saved
const coverageDir = path.join(process.cwd(), "coverage/temp");

test.beforeEach(async ({ page, browserName }) => {
  // Only enable JS coverage for Chromium browsers since coverage is browser-specific
  if (browserName === "chromium") {
    // Start collecting JavaScript coverage for the page
    await page.coverage.startJSCoverage();
  }
});

test.afterEach(async ({ page, browserName }, testInfo) => {
  if (browserName === "chromium") {
    // Stop JS coverage collection for the page
    const coverage = await page.coverage.stopJSCoverage();

    // Append the coverage data for this test to the global array
    jsCoverage.push(...coverage);

    // Ensure coverage folder exists
    try {
      await fs.access(coverageDir);
    } catch {
      await fs.mkdir(coverageDir, { recursive: true });
    }

    // Generate a file path to save the coverage JSON
    const filePath = path.join(
      coverageDir,
      `v8-coverage-${testInfo.title.replace(/[\W_]+/g, "-")}.json`
    );

    // Save the coverage data into a structured JSON file
    await fs.writeFile(filePath, JSON.stringify(coverage));
  }
});
