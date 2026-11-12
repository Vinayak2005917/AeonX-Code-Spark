import asyncio
import base64
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import Response
from agent import agent_response
from grading import create_graded_report
import uvicorn
from Sarvam import sarvam_tts
from fastapi.middleware.cors import CORSMiddleware


app=FastAPI()
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_methods=["*"],allow_headers=["*"])

@app.post("/croissant")
async def croissant(
    query: str = "",
    model_name: str = "openai/gpt-6-luna",
    thread_id: str = "",
    image: UploadFile | None = File(None),
    answer_key_pdf: UploadFile | None = File(None),
    handwritten_pdf: UploadFile | None = File(None),
):
    if answer_key_pdf is not None or handwritten_pdf is not None:
        if answer_key_pdf is None or handwritten_pdf is None:
            raise HTTPException(
                status_code=400,
                detail="Upload both the answer key PDF and the handwritten answers PDF.",
            )
        if image is not None:
            raise HTTPException(
                status_code=400,
                detail="Use the two PDF uploads for grading; do not attach a chat image.",
            )

        answer_key_bytes = await answer_key_pdf.read(25 * 1024 * 1024 + 1)
        handwritten_bytes = await handwritten_pdf.read(25 * 1024 * 1024 + 1)
        if len(answer_key_bytes) > 25 * 1024 * 1024 or len(handwritten_bytes) > 25 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="Each PDF must be 25 MB or smaller.")
        if not answer_key_bytes or not handwritten_bytes:
            raise HTTPException(status_code=400, detail="Both PDF files must be non-empty.")

        try:
            report_pdf = await asyncio.to_thread(
                create_graded_report,
                answer_key_bytes,
                handwritten_bytes,
                model_name,
                query,
            )
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Could not grade this submission: {exc}",
            ) from exc

        return Response(
            content=report_pdf,
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="croissant-graded-report.pdf"'},
        )

    image_bytes = await image.read() if image is not None else None
    image_media_type = image.content_type if image is not None else None
    return await asyncio.to_thread(
        agent_response,
        query,
        image_bytes,
        image_media_type,
        model_name,
        thread_id,
    )

@app.websocket("/croissant")
async def croissant_websocket(websocket: WebSocket):
    await websocket.accept()
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

@app.post("/speak")
def speak(text: str, language: str = "en-US") -> Response:
    return Response(content=sarvam_tts(text, language), media_type="audio/mpeg")

@app.get("/health")
def is_it_alive():
    return {"status":"alive"}

if __name__ == "__main__":
    uvicorn.run(app,host="0.0.0.0",port=8000)
