const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Load config.json
  const configPath = path.join(__dirname, "config.json");
  const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));

  // Load the local HTML file
  const filePath = path.join(__dirname, "index.html");
  await page.goto(`file://${filePath}`, { waitUntil: "networkidle0" });

  // Inject config data into page
  await page.evaluate((data) => {
    window.configData = data;
  }, configData);

  // Wait for content to load and trigger loadResume with injected data
  await page.evaluate(() => {
    if (typeof loadResumeWithData === 'function') {
      loadResumeWithData(window.configData);
    }
  });

  // Wait a bit for rendering
  await new Promise(resolve => setTimeout(resolve, 500));

  // Set viewport to A4 size at 96 DPI (approximate) for consistent rendering
  // A4 is 210mm x 297mm.
  // At 96 DPI: 794px x 1123px
  await page.setViewport({ width: 794, height: 1123 });

  // Emulate print media type to ensure print styles are applied (no background, correct margins)
  await page.emulateMediaType('print');

  console.log("Generating PDF...");
  await page.pdf({
    path: "resume.pdf",
    format: "A4",
    printBackground: true, // This prints the background of the element, but body background is removed by @media print
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  console.log("Generating JPG...");
  // For high quality JPG, we can increase the viewport scale
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.screenshot({
    path: "resume.jpg",
    type: "jpeg",
    quality: 100,
    fullPage: true,
  });

  await browser.close();
  console.log("Done! Created resume.pdf and resume.jpg");
})();
