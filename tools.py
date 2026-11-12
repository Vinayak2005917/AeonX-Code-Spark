from langchain.tools import tool
from websocket import send_text_event, send_as_component

@tool("send_text", description="add text to the response")
def send_text(text: str) -> str:
    print("Send text : ", text)
    send_text_event(text)
    return "Text sent successfully"

@tool("send_component", description="add a component to the response")
def send_component(name: str, props: dict) -> str:
    print("Send component : ", name, props)
    send_as_component(name, props)
    return "Component sent successfully"
