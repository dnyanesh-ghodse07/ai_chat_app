import os
from dotenv import load_dotenv
import requests
import json

load_dotenv()

Ollama_API_URL = f"{os.getenv('Ollama_API_URL_BASE')}/api"

def chat_with_ollama(message: str, model: str = "llama3"):

    payload = {
        "model": model,
        "messages": [
            {
                "role" : "user",
                "content": message
            }
        ],
        "stream": True
    }
    try:
        response = requests.post(f"{Ollama_API_URL}/chat", json=payload, stream=True)
        response.raise_for_status()
    
        for line in response.iter_lines():
            
            if line:
                try:
                     data = json.loads(line.decode('utf-8'))

                     if "message" in data:
                        yield data["message"]["content"]
                        
                except json.JSONDecodeError:
                    continue
     
    except requests.exceptions.ConnectionError:
        yield "Error: Cannot connect to Ollama. Is Ollama running?"

    except requests.exceptions.Timeout:
        yield "Error: Ollama request timed out."

    except requests.exceptions.RequestException as e:
        yield f"Error: {str(e)}"



def generate_image_with_ollama(prompt: str, model: str = "x/flux2-klein:4b"):
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    try:
        response = requests.post(f'{Ollama_API_URL}/generate', json=payload)
        response.raise_for_status()
    
        data = response.json()

        if "image" in data and data["image"]:
            return { "image_url": f"data:image/png;base64,{data['image']}" }
        elif "response" in data and data["response"]:
           return { "image_url": f"data:image/png;base64,{data['response']}" }
        else:
            return {"error": "Error: Unexpected response format from Ollama."}
     
    except requests.exceptions.ConnectionError:
        return {"error": "Error: Cannot connect to Ollama. Is Ollama running?"}

    except requests.exceptions.Timeout:
        return {"error": "Error: Ollama request timed out."}

    except requests.exceptions.RequestException as e:
        return f"Error: {str(e)}"