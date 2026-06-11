const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');

// Run every day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running daily LinkedIn scrape...');
  const scraperPath = path.join(__dirname, 'linkedin-scraper.js');
  
  exec(`node "${scraperPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Stderr: ${stderr}`);
      return;
    }
    console.log(`Stdout: ${stdout}`);
  });
});

console.log('LinkedIn Scraper Scheduler is running...');
