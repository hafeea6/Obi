/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.ts` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('App root element was not found.');
}

app.innerHTML = `
  <main class="app-shell">
    <h1>OpenRouter Weather Demo</h1>
    <p class="app-description">
      Run the configured OpenRouter call from the desktop app.
    </p>
    <button id="run-weather-demo" class="run-button" type="button">
      Run weather call
    </button>
    <p id="status" class="status" aria-live="polite">Ready.</p>
    <section class="result-panel">
      <h2>Result</h2>
      <p><strong>Model:</strong> <span id="model-name">Not run yet</span></p>
      <pre id="result-text" class="result-output">Click the button to run the call.</pre>
    </section>
  </main>
`;

const runButton = document.querySelector<HTMLButtonElement>('#run-weather-demo');
const status = document.querySelector<HTMLParagraphElement>('#status');
const modelName = document.querySelector<HTMLSpanElement>('#model-name');
const resultText = document.querySelector<HTMLPreElement>('#result-text');

if (!runButton || !status || !modelName || !resultText) {
  throw new Error('Required renderer elements were not found.');
}

runButton.addEventListener('click', async () => {
  runButton.disabled = true;
  status.textContent = 'Running OpenRouter call...';

  try {
    const result = await window.openrouterDemo.runWeatherDemo();

    modelName.textContent = result.model;
    resultText.textContent = result.text;
    status.textContent = `Completed prompt: ${result.input}`;
  } catch (error: unknown) {
    modelName.textContent = 'Run failed';
    resultText.textContent =
      error instanceof Error ? error.message : 'An unknown error occurred.';
    status.textContent = 'The OpenRouter call failed.';
  } finally {
    runButton.disabled = false;
  }
});
