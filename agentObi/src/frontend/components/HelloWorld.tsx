import { useState } from "react";

export function HelloWorld() {
  const [message, setMessage] = useState("Click the button.");

  const runHelloWorld = async () => {
    try {
      const response = await window.helloWorld.runHelloWorld();
      setMessage(response);
    } catch (error: unknown) {
      setMessage(
        error instanceof Error ? error.message : "An unknown error occurred."
      );
    }
  };

  return (
    <main className="app-shell">
      <h1>Hello World</h1>
      <button
        className="run-button"
        type="button"
        onClick={runHelloWorld}
      >
        Run hello world
      </button>
      <section className="result-panel">
        <pre className="result-output">{message}</pre>
      </section>
    </main>
  );
}
