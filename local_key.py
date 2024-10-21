from fastapi import FastAPI, HTTPException
import os
from pydantic import BaseModel
from openai import AsyncOpenAI
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生產環境中應該設置為特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["http://localhost", "chrome-extension://epfaoddkielfaichiifjkbocnmlkmmdg"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],

api_client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def llm_chat(messages: List[Dict[str, str]]):
    
    response = await api_client.chat.completions.create(
        model=os.getenv("LLM_MODEL"),
        messages=messages
    )
    return response

class ChatMessages(BaseModel):
    messages: List[Dict[str, str]]  # 調整為 List[Dict[str, str]] 以匹配請求格式

@app.post("/api/chat")
async def chat(ChatMessages: ChatMessages):
    try:
        # 使用OpenAI API進行對話
        response = await llm_chat(ChatMessages.messages)
        # 提取AI的回覆
        ai_reply = f'{response.choices[0].message.content} \n(total tokens: {response.usage.total_tokens})'
        
        return {"reply": ai_reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# @app.post("/api/summary")
# async def summary(chat_message: ChatMessage):
#     messages = chat_message.messages  # 直接使用請求中的 messages
#     try:
#         # 使用LLM模型進行對話
#         response = await chat(messages)
    
#         # 提取LLM的回覆
#         llm_reply = f'{response.choices[0].message.content} \n(total tokens: {response.usage.total_tokens})'
        
#         return {"reply": llm_reply}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# 啟動本地服務器
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
