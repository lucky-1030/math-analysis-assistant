"""数学分析学习助手 - FastAPI 后端服务（多模型版本）"""

import json
import os
from typing import Optional
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from pdf_parser import extract_text_from_bytes
from llm_extractor import extract_knowledge, generate_study_path
from llm_providers import list_available_providers, get_provider

# 加载环境变量（.env 文件）
from dotenv import load_dotenv
load_dotenv()

# 创建应用
app = FastAPI(
    title="数学分析学习助手 API",
    description="PDF 解析、知识点提取、学习路径生成（支持多模型: Claude/DeepSeek/OpenAI）",
    version="0.2.1",
)

# CORS 配置 - 开发环境限制 localhost，生产环境从环境变量读取或允许所有
CORS_ORIGINS = os.environ.get(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if os.environ.get("ALLOW_ALL_ORIGINS") == "1" else CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 持久化存储路径
DATA_DIR = Path(__file__).parent / "data"
DATA_FILE = DATA_DIR / "chapters_data.json"


def _load_chapters_db() -> dict:
    """从 JSON 文件加载章节数据库"""
    if DATA_FILE.exists():
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _save_chapters_db(data: dict) -> None:
    """保存章节数据库到 JSON 文件"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# 启动时加载已保存的章节
chapters_db = _load_chapters_db()


# ===== 数据模型 =====

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    sources: Optional[list] = None


# ===== API 端点 =====

@app.get("/api/health")
def health_check():
    """健康检查 - 返回所有可用模型的配置状态"""
    providers = list_available_providers()
    current = os.environ.get("LLM_PROVIDER", "mock")
    current_provider = get_provider()

    return {
        "status": "ok",
        "current_provider": current,
        "current_provider_ready": current_provider.is_configured,
        "available_providers": providers,
        "message": f"当前使用: {current} ({'已配置' if current_provider.is_configured else '未配置'})" if current != "mock" else "当前使用模拟模式（mock），无需 API Key",
    }


@app.get("/api/providers")
def list_providers():
    """列出所有支持的 LLM 提供者"""
    return {
        "providers": {
            "anthropic": {
                "name": "Claude (Anthropic)",
                "env_key": "ANTHROPIC_API_KEY",
                "env_model": "ANTHROPIC_MODEL（可选）",
                "description": "Anthropic Claude 系列模型",
            },
            "deepseek": {
                "name": "DeepSeek",
                "env_key": "DEEPSEEK_API_KEY",
                "env_model": "DEEPSEEK_MODEL（可选，默认 deepseek-chat）",
                "env_base_url": "DEEPSEEK_BASE_URL（可选）",
                "description": "DeepSeek 大模型",
            },
            "openai": {
                "name": "OpenAI",
                "env_key": "OPENAI_API_KEY",
                "env_model": "OPENAI_MODEL（可选，默认 gpt-4o）",
                "env_base_url": "OPENAI_BASE_URL（可选，用于兼容接口如 Azure、智谱）",
                "description": "OpenAI GPT 系列或兼容 OpenAI 接口的模型",
            },
            "mock": {
                "name": "模拟模式",
                "env_key": "无需配置",
                "description": "本地模拟，用于测试前端功能",
            },
        },
        "usage": "设置 LLM_PROVIDER 环境变量为上述名称之一，并配置对应 API Key",
    }


@app.post("/api/parse")
async def parse_document(file: UploadFile = File(...)):
    """
    上传并解析文档，提取知识点
    """
    # 读取文件内容
    content = await file.read()

    if len(content) > 20 * 1024 * 1024:  # 20MB 限制
        raise HTTPException(status_code=413, detail="文件大小超过 20MB 限制")

    # 1. 解析 PDF
    parse_result = extract_text_from_bytes(content, file.filename)

    if not parse_result["success"]:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": parse_result["error"],
                "nodes": [],
                "edges": [],
            },
        )

    # 2. 调用 LLM 提取知识点
    chapter_title = Path(file.filename).stem
    extraction = extract_knowledge(
        content=parse_result["full_text"],
        chapter_title=chapter_title,
    )

    if not extraction["success"]:
        # LLM 失败但 PDF 解析成功，返回解析结果 + 错误信息
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "warning": f"PDF 解析成功，但知识点提取失败: {extraction['error']}",
                "nodes": [],
                "edges": [],
                "full_text_preview": parse_result["full_text"][:500] + "...",
                "total_pages": parse_result["total_pages"],
                "provider": extraction.get("provider"),
            },
        )

    # 3. 生成学习路径
    study_path = generate_study_path(extraction["nodes"], extraction["edges"])

    # 4. 保存到持久化数据库
    chapter_id = f"ch_{len(chapters_db) + 1}"
    chapters_db[chapter_id] = {
        "id": chapter_id,
        "title": chapter_title,
        "filename": file.filename,
        "nodes": extraction["nodes"],
        "edges": extraction["edges"],
        "path": study_path,
        "total_pages": parse_result["total_pages"],
    }
    _save_chapters_db(chapters_db)

    return {
        "success": True,
        "chapter_id": chapter_id,
        "title": chapter_title,
        "nodes": extraction["nodes"],
        "edges": extraction["edges"],
        "path": study_path,
        "total_pages": parse_result["total_pages"],
        "provider": extraction.get("provider"),
    }


@app.get("/api/chapters/{chapter_id}")
def get_chapter(chapter_id: str):
    """获取指定章节的知识点数据"""
    if chapter_id not in chapters_db:
        raise HTTPException(status_code=404, detail="章节不存在")

    chapter = chapters_db[chapter_id]
    return {
        "id": chapter["id"],
        "title": chapter["title"],
        "nodes": chapter["nodes"],
        "edges": chapter["edges"],
        "path": chapter["path"],
        "total_pages": chapter["total_pages"],
    }


@app.get("/api/chapters")
def list_chapters():
    """列出所有已解析的章节"""
    return {
        "chapters": [
            {
                "id": ch["id"],
                "title": ch["title"],
                "node_count": len(ch["nodes"]),
                "edge_count": len(ch["edges"]),
            }
            for ch in chapters_db.values()
        ]
    }


@app.post("/api/chat")
def chat(request: ChatRequest):
    """
    对话答疑 - 使用当前配置的 LLM 提供者
    """
    try:
        provider = get_provider()
    except ValueError as e:
        return JSONResponse(
            status_code=400,
            content={"error": str(e)},
        )

    if not provider.is_configured:
        return JSONResponse(
            status_code=503,
            content={"error": f"LLM 提供者 '{provider.name}' 未配置 API Key"},
        )

    system_prompt = """你是一位专业的数学分析助教。请用中文回答学生的问题。
回答要求：
1. 使用清晰的逻辑结构
2. 数学公式用 LaTeX 格式（$...$ 或 $$...$$）
3. 如果涉及定义或定理，先陈述再解释
4. 给出直观的理解，不要只罗列公式"""

    try:
        reply = provider.chat_completion(
            system_prompt=system_prompt,
            user_message=request.message,
            max_tokens=2000,
            temperature=0.3,
        )

        return {
            "reply": reply,
            "provider": provider.name,
            "sources": [],
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": f"对话失败: {str(e)}"},
        )


# ===== 启动入口 =====

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
