import asyncio
import base64
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from fastapi.responses import Response
from agent import agent_response
import uvicorn
from Sarvam import sarvam_tts
from fastapi.middleware.cors import CORSMiddleware
from websocket import set_active_connection, reset_active_connection


app=FastAPI()
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])

@app.post("/croissant")
def croissant(query: str, model_name: str, thread_id: str, image: UploadFile | None = File(None)) -> str:
    image_bytes = image.file.read() if image is not None else None
    image_media_type = image.content_type if image is not None else None
    return agent_response(query, image_bytes, image_media_type, model_name, thread_id)

@app.websocket("/croissant")
async def croissant_websocket(websocket: WebSocket):
    await websocket.accept()
    token = set_active_connection(websocket)
    try:
        data = await websocket.receive_json()
        encoded_image = data.get("image")
        image_bytes = base64.b64decode(encoded_image) if encoded_image else None

        result = await asyncio.to_thread(
            agent_response,
            data["query"],
            image_bytes,
            data.get("image_media_type"),
            data["model_name"],
            data["thread_id"],
        )
        await websocket.send_json({"type": "result", "content": result})
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        await websocket.send_json({"type": "error", "content": str(exc)})
    finally:
        reset_active_connection(token)

@app.post("/speak")
def speak(text: str, language: str = "en-US") -> Response:
    return Response(content=sarvam_tts(text, language), media_type="audio/mpeg")

@app.get("/health")
def is_it_alive():
    return {"status":"alive"}

if __name__ == "__main__":
    uvicorn.run(app,host="0.0.0.0",port=8000)
