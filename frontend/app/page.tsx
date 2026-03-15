"use client";
import { Button } from "@/components/ui/button";
import { TextareaBn } from "@/components/ui/textarea-bn";
import { useEffect, useRef, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import MarkdownRenderer from "@/components/markdown-renderer";
import { ArrowUp, DownloadIcon } from "lucide-react";
import Header from "@/components/header";
import Dropdown from "@/components/dropdown";
import Image from "next/image";

const models = [
  {
    value: "llama3",
    type: "chat",
    description:
      "Ask anything about general knowledge, coding, or even math problems. A versatile model for a wide range of tasks.",
    loadingText: "AI is typing...",
  },
  {
    value: "gemma3:4b",
    type: "chat",
    description:
      "A powerful model designed for complex reasoning and in-depth conversations. Ideal for technical discussions, problem-solving, and detailed explanations.",
    loadingText: "AI is typing...",
  },
  {
    value: "x/flux2-klein:4b",
    type: "image",
    description:
      "Image generation model for creating visuals from text prompts.",
    loadingText: "Generating Image...",
  },
];

const BASE_URL = "http://127.0.0.1:8000";

export default function Home() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const chatref = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const [imageUrl, setImageUrl] = useState("");

  const [selectedItem, setSelectedItem] = useState(models[0]);

  const handleImageGeneration = async () => {
    try {
      setMessage("");
      setLoading(true);
      const res = await fetch(`${BASE_URL}/generate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: message, model: selectedItem.value }),
      });
      const data = await res.json();
      setImageUrl(data.image_url);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log("Error generating image:", error);
      setError("Failed to generate image. Please try again.");
    }
  };

  const handleImageDownload = () => {
    if (!imageUrl) return;

    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = "generated_image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGetChatResponse = async () => {
    if (selectedItem.value === "x/flux2-klein:4b") {
      await handleImageGeneration();
      return;
    }

    try {
      setMessage("");
      setLoading(true);
      const res = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON?.stringify({ message, model: selectedItem?.value }),
      });
      const reader = res.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      let result = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        const chunk = decoder.decode(value);
        result += chunk;
        setResponse(result);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching chat response:", error);
    }
  };

  const handleScroll = () => {
    const chatContainer = chatref.current;
    if (!chatContainer) return;

    const { scrollTop, scrollHeight, clientHeight } = chatContainer;

    setAutoScroll(scrollHeight - scrollTop - clientHeight < 50);
  };

  useEffect(() => {
    if (autoScroll && chatref.current) {
      console.log("Auto-scrolling to bottom");
      chatref.current.scrollTop = chatref.current.scrollHeight;
    }
  }, [autoScroll, response]);

  return (
    <div className="">
      <div className="m-auto max-w-5xl h-screen flex flex-col items-center justify-between">
        <Header />
        <div
          ref={chatref}
          onScroll={handleScroll}
          className="flex-1 mb-24 overflow-auto z-10 text-xs p-4 max-w-3xl w-full"
        >
          {!loading && !response && (
            <>
              <div className="relative h-full w-full flex items-center justify-center">
                <div className="flex flex-col gap-2 p-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-4xl">
                  <h1 className="text-2xl font-bold text-center from-purple-600 via-pink-600 to-blue-600 bg-linear-to-r bg-clip-text text-transparent">
                    Start the conversation
                  </h1>
                  <p className="text-center from-purple-600 via-pink-600 to-blue-600 bg-linear-to-r bg-clip-text text-transparent">
                    Generate images or chat with AI models.
                  </p>
                </div>
              </div>
            </>
          )}
          {selectedItem.type === "image" ? (
            imageUrl && (
              <div className="relative top-2 right-0 w-3/5 flex flex-col gap-2 justify-end ">
                <Image
                  loading="lazy"
                  width={100}
                  height={100}
                  src={imageUrl}
                  alt="Generated"
                  className="w-full h-full rounded-lg object-contain"
                />
                <Button
                  className="absolute bottom-2 right-2 cursor-pointer"
                  size="xs"
                  variant="outline"
                  onClick={handleImageDownload}
                >
                  <DownloadIcon />
                </Button>
              </div>
            )
          ) : (
            <div>
              <MarkdownRenderer response={response} />
            </div>
          )}
        </div>
        <div className="fixed m-4 z-50 border w-full bottom-0 mx-5 max-w-2xl p-2 flex gap-2 justify-between items-end bg-white/50 backdrop-blur-sm rounded-lg">
          <div>
            {loading && (
              <div className="flex flex-col gap-2 absolute p-4 shadow-2xl bottom-24 left-4 py-1 text-xs text-gray-400 bg-black rounded-4xl">
                <div className="flex gap-2">
                  <Spinner />
                  <span>{selectedItem.loadingText}</span>
                </div>
                {/* <div className="w-full h-1 rounded-4xl bg-linear-to-r from-blue-500 via-purple-500 to-pink-500" /> */}
              </div>
            )}
          </div>
          {error && (
            <div className="absolute p-4 shadow-2xl bottom-24 left-4 py-1 text-xs text-red-500 bg-black rounded-4xl">
              {error}
            </div>
          )}
          <TextareaBn
            className="text-xs max-h-80 resize-none"
            value={message}
            placeholder={selectedItem.description}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div>
            <Dropdown
              list={models}
              selected={selectedItem}
              setSelected={setSelectedItem}
            />
          </div>
          <Button
            disabled={loading || !message}
            size="sm"
            variant="default"
            className="text-xs"
            onClick={handleGetChatResponse}
          >
            <ArrowUp size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
