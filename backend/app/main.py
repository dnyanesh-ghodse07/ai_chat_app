import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.services.ollama_services import chat_with_ollama, generate_image_with_ollama
from pydantic import BaseModel

load_dotenv()

app = FastAPI()

allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    model: str = "llama3"  # Default model, can be overridden by the client

class ImageRequest(BaseModel):
    prompt: str
    model: str = "x/flux2-klein:4b"  # Default image generation model
    

@app.get('/')
def read_root():
    return {"message": "Welcome to the AI Chat API!"}


@app.post('/chat')
def chat(request: ChatRequest):
    generator = chat_with_ollama(request.message, request.model)
    
    return StreamingResponse(generator, media_type="text/event-stream")

@app.post('/generate-image')
def generate_image(request: ImageRequest):
    result = generate_image_with_ollama(request.prompt, request.model)
    return result
