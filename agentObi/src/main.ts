import { app, BrowserWindow, ipcMain } from 'electron';
import { OpenRouter, tool } from '@openrouter/agent';
import dotenv from 'dotenv';
import path from 'node:path';
import { z } from 'zod';
import started from 'electron-squirrel-startup';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const weatherTool = tool({
  name: 'get_weather',
  description: 'Get the current weather for a location',
  inputSchema: z.object({
    location: z.string().describe('City name'),
  }),
  execute: async ({ location }) => {
    return { temperature: 72, condition: 'sunny', location };
  },
});

type WeatherDemoResult = {
  input: string;
  model: string;
  text: string;
};

const runWeatherDemo = async (): Promise<WeatherDemoResult> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  /*const resolvedModel =
    typeof model === 'string' && model.trim() !== ''
      ? model.trim()
      : 'google/gemma-4-31b-it:free';*/
  const resolvedModel =
    typeof model === 'string' && model.trim() !== ''
      ? 'apodex/apodex-1.1-mini:free'
      : 'google/gemma-4-31b-it:free';
  const input = 'What is the weather in San Francisco?';

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not set.');
  }

  const openrouter = new OpenRouter({ apiKey });
  const result = openrouter.callModel({
    model: resolvedModel,
    input,
    tools: [weatherTool],
  });
  const text = await result.getText();

  return {
    input,
    model: resolvedModel,
    text,
  };
};

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

ipcMain.handle('openrouter:runWeatherDemo', async () => runWeatherDemo());

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
