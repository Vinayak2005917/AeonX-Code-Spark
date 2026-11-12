import os
import base64
from pathlib import Path
from langgraph.checkpoint.memory import InMemorySaver
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from  dotenv import load_dotenv
from tools import send_text, send_component

load_dotenv()
SYSTEM_PROMT=Path("system_promt.md").read_text(encoding="utf-8")

def get_model(model_name:str):
    return ChatOpenAI(
    model=model_name,
    api_key=os.getenv("api_key"),
    base_url="https://api.aicredits.in/v1"
)


def agent_response(query: str, image: bytes | None, image_media_type: str | None, model_name: str, thread_id: str) -> str:
    model=get_model(model_name)

    SANAGPT=create_agent(
        model=model,
        system_prompt= SYSTEM_PROMT,
        tools=[send_text, send_component],
        checkpointer=InMemorySaver()
    )
    thread_config={"configurable":{"thread_id":thread_id}}
    content = query
    if image:
        media_type = image_media_type or "application/octet-stream"
        encoded_image = base64.b64encode(image).decode("ascii")
        content = [
            {"type": "text", "text": query},
            {"type": "image_url", "image_url": {"url": f"data:{media_type};base64,{encoded_image}"}},
        ]
    reponse=SANAGPT.invoke({"messages": [{"role": "user", "content": content}]},thread_config,)
    return reponse["messages"][-1].content

if __name__ == "__main__":
    print(agent_response("Hey,whats the weather today", None, None, "openai/gpt-6-luna", "1"))
