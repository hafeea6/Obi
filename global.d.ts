declare module "*.css";

interface Window {
  helloWorld: {
    runHelloWorld: () => Promise<string>;
  };
}
