import { RadioBrowserApi } from "radio-browser-api";

const SERVER_MIRRORS = [
  "https://de1.api.radio-browser.info",
  "https://fi1.api.radio-browser.info",
  "https://de2.api.radio-browser.info",
  "https://nl1.api.radio-browser.info"
];

async function selectBestMirror(): Promise<string> {
  console.log("Starting mirror selection process...");

  for (let i = 0; i < SERVER_MIRRORS.length; i++) {
    const server = SERVER_MIRRORS[i];
    console.log(`Testing mirror ${i + 1}/${SERVER_MIRRORS.length}: ${server}`);

    try {
      const testApi = new RadioBrowserApi("RadioGlobeApp/1.0");
      testApi.setBaseUrl(server);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Mirror test timeout")), 5000);
      });

      const testPromise = testApi.searchStations({
        limit: 1,
        hideBroken: true
      });

      await Promise.race([testPromise, timeoutPromise]);

      console.log(`✅ Mirror ${server} is working!`);
      return server;

    } catch (testError) {
      console.warn(`❌ Mirror ${server} failed:`, {
        message: testError instanceof Error ? testError.message : String(testError),
        stack: testError instanceof Error ? testError.stack : undefined
      });

      // Add small delay before trying next mirror
      if (i < SERVER_MIRRORS.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  console.error("All mirrors failed! Using fallback.");
  return "https://de1.api.radio-browser.info";
}

export default selectBestMirror;