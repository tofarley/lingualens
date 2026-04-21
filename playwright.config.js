// playwright.config.js                                                                                                                                                                                                                                                                                                                                                                                                                           
const { defineConfig } = require('@playwright/test');
                                                                                                                                                                                                                                                                                                                                                                                                                                                  
module.exports = defineConfig({                           
  projects: [
    {
      name: 'chrome',
      use: {
        channel: undefined,
        executablePath: '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',
      },
    },
  ],
});
