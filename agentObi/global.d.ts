declare module "*.css";

type WeatherDemoResult = {
  input: string;
  model: string;
  text: string;
};

interface Window {
  openrouterDemo: {
    runWeatherDemo: () => Promise<WeatherDemoResult>;
  };
}
