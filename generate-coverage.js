const fs = require('fs').promises;
const path = require('path');
const v8toIstanbul = require('v8-to-istanbul');
const reports = require('istanbul-reports');
const { createContext } = require('istanbul-lib-report');
const { createCoverageMap } = require('istanbul-lib-coverage');

const coverageDir = path.join(process.cwd(), 'coverage/temp'); // Playwright raw v8 coverage
const istanbulCoverageDir = path.join(process.cwd(), 'coverage/frontend'); // Final report output

async function convertCoverage() {
  // Exit if no coverage data exists
  try {
    await fs.access(coverageDir);
  } catch {
    console.log('No coverage data found. Please run "npm run test-frontend" first.');
    return;
  }

  const coverageMap = createCoverageMap();
  const files = await fs.readdir(coverageDir);

  // Define only YOUR files to be included in the report
  const allowedFiles = ['william.js', 'index.js'];

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const v8Coverage = JSON.parse(await fs.readFile(path.join(coverageDir, file), 'utf-8'));

    for (const entry of v8Coverage) {
      if (!entry.url || !entry.source) continue;

      let pathname;
      try {
        pathname = entry.url.startsWith('http') || entry.url.startsWith('file://')
          ? new URL(entry.url).pathname
          : entry.url;
      } catch {
        pathname = entry.url;
      }

      // Get the actual filename (e.g., 'william.js')
      const fileName = path.basename(pathname);

      // --- FILTERING LOGIC ---
      // Only process the file if it is in our allowed list
      if (!allowedFiles.includes(fileName)) {
        continue; 
      }

      // Handle Windows file paths for the converter
      const filePath = entry.url.startsWith('file://')
        ? pathname.replace(/^\/([a-zA-Z]:)/, '$1') 
        : pathname;

      try {
        // We use "public/js/" prefix to help the reporter find the source files
        const converter = v8toIstanbul("public/js/" + fileName, 0, { source: entry.source });
        await converter.load();
        converter.applyCoverage(entry.functions);
        coverageMap.merge(converter.toIstanbul());
      } catch (err) {
        console.warn(`Skipping coverage for ${fileName}: ${err.message}`);
      }
    }
  }

  if (!Object.keys(coverageMap.data).length) {
    console.log('No relevant coverage data was converted. Check if your test hit william.js or index.js.');
    return;
  }

  // Ensure output directory exists
  try {
    await fs.access(istanbulCoverageDir);
  } catch {
    await fs.mkdir(istanbulCoverageDir, { recursive: true });
  }

  // Generate HTML and lcov reports
  const context = createContext({ dir: istanbulCoverageDir, coverageMap });
  ['html', 'lcovonly'].forEach(type => reports.create(type).execute(context));

  console.log(`Success! Coverage report generated in: ${istanbulCoverageDir}`);
}

convertCoverage();