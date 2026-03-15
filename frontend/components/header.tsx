import React from "react";
// import { Button } from "./ui/button";

export default function Header() {
  return (
    <header className="w-full flex justify-center items-center p-4">
      <div className="text-center">
        <h1 className="font-bold">AI chat</h1>
        <p className="text-xs">Powered by Ollama</p>
      </div>
      <div>
        {/* <Button size="xs" variant="outline" className="text-xs"> */}
        {/* Chat History */}
        {/* </Button> */}
      </div>
    </header>
  );
}
