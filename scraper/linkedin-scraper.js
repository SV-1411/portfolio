const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

puppeteer.use(StealthPlugin());

async function scrapeLinkedIn() {
  const profileUrl = process.env.LINKEDIN_URL;
  if (!profileUrl) {
    console.error("LINKEDIN_URL not found in .env");
    return;
  }

  console.log("Starting Scraper...");
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  try {
    // We recommend using session cookies to avoid login issues
    // Set cookie if available
    if (process.env.LI_AT_COOKIE) {
      await page.setCookie({
        name: "li_at",
        value: process.env.LI_AT_COOKIE,
        domain: ".www.linkedin.com"
      });
    }

    await page.goto(profileUrl, { waitUntil: 'networkidle2' });

    // Check if login is required
    if (page.url().includes('login')) {
      console.log("Login required. Attempting login...");
      await page.type('#username', process.env.LINKEDIN_USER);
      await page.type('#password', process.env.LINKEDIN_PASS);
      await page.click('[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    const data = await page.evaluate(() => {
      const getText = (selector) => document.querySelector(selector)?.innerText.trim() || "";
      
      const experience = Array.from(document.querySelectorAll('#experience ~ .pvs-list__outer-container > ul > li')).map(li => {
        const title = li.querySelector('.t-bold span')?.innerText || "";
        const company = li.querySelector('.t-14.t-normal span')?.innerText.split(' · ')[0] || "";
        const date = li.querySelector('.t-14.t-normal.t-black--light span')?.innerText || "";
        return { title, company, date };
      });

      return {
        name: getText('.text-heading-xlarge'),
        headline: getText('.text-body-medium'),
        about: getText('#about ~ .display-flex .pv-shared-text-with-see-more span'),
        experience
      };
    });

    data.lastUpdated = new Date().toISOString();
    
    const outputPath = path.join(__dirname, '../public/profile-data.json');
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log("Profile data updated successfully!");

  } catch (err) {
    console.error("Scraping failed:", err);
  } finally {
    await browser.close();
  }
}

scrapeLinkedIn();
