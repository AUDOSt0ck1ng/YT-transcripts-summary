from fastapi import FastAPI
import os
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "chrome-extension://epfaoddkielfaichiifjkbocnmlkmmdg"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 有需要的話可以自己改一下。
# @app.get("/get-llm-key")
# def get_openai_api_key():
#     # 返回儲存在伺服器上的 API 金鑰
#     return os.getenv("LLM_KEY")

# @app.get("/get-llm-host")
# def get_llm_host():
#     # 返回儲存在伺服器上的 API 金鑰
#     return os.getenv("LLM_HOST")


# 定義一個 API 路由來返回 LLM model
@app.get("/get-llm-model")
def get_llm_model():
    return os.getenv("LLM_MODEL")


# 定義一個 API 路由來返回 API 金鑰
@app.get("/get-openai-api-key")
def get_openai_api_key():
    # 返回儲存在伺服器上的 API 金鑰
    return os.getenv("OPENAI_API_KEY")

@app.get("/get-x-rapidapi-key")
def get_x_rapidapi_key():
    # 返回儲存在伺服器上的 API 金鑰
    return os.getenv("x-rapidapi-key")

@app.get("/get-x-rapidapi-host")
def get_x_rapidapi_host():
    # youtube-transcripts.p.rapidapi.com 查特定影片字幕(如果有提供的話)。
    return "youtube-transcripts.p.rapidapi.com"

# 啟動本地服務器
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=59999)
