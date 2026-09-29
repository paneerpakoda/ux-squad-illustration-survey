const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Use localhost instead of github pages
  console.log("Navigating to http://localhost:8002/dist/");
  await page.goto('http://localhost:8002/dist/');

  await page.waitForSelector('h1', { timeout: 10000 });
  
  // 1. Name
  console.log("Step 1: Name");
  await page.fill('#respondent_name', 'Playwright Automated Test');
  await page.click('#next');

  for (let step = 2; step <= 13; step++) {
    console.log(`Step ${step}`);
    await page.waitForTimeout(500); 
    
    const h1 = await page.textContent('h1');
    console.log(`  Heading: ${h1}`);
    
    const option = await page.$('.art-option, .other-option');
    if (option) {
      await option.click();
    } else {
      console.log("  No options found!");
    }
    
    // Type something in the custom reason if it exists
    const textarea = await page.$('textarea[data-custom-detail]');
    if (textarea) {
      await textarea.fill('This is an automated test comment from Playwright.');
    }
    
    if (step === 13) {
      console.log("Submitting final step...");
      await Promise.all([
        page.click('#next').catch(()=>page.click('#next-top')),
        page.waitForSelector('.success h1', { timeout: 15000 })
      ]);
      const successText = await page.textContent('.success p');
      console.log(`Success Message: ${successText}`);
    } else {
      await page.click('#next').catch(()=>page.click('#next-top'));
    }
  }

  await browser.close();
  console.log("Test finished.");
})();
