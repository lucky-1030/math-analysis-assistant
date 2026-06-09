"""PDF 解析模块：提取文本和结构化内容"""

import fitz  # PyMuPDF
from pathlib import Path
from typing import List, Dict, Any


def parse_pdf(file_path: str | Path) -> Dict[str, Any]:
    """
    解析 PDF 文件，提取文本、章节结构和页面信息
    """
    doc = fitz.open(str(file_path))
    total_pages = len(doc)

    # 提取全文
    full_text = ""
    pages = []

    for page_num in range(total_pages):
        page = doc[page_num]
        text = page.get_text()

        # 清理文本
        text = text.strip()
        if text:
            pages.append({
                "page_num": page_num + 1,
                "text": text,
            })
            full_text += f"\n\n--- 第{page_num + 1}页 ---\n\n{text}"

    doc.close()

    return {
        "total_pages": total_pages,
        "full_text": full_text.strip(),
        "pages": pages,
        "success": True,
        "error": None,
    }


def chunk_text(text: str, max_chars: int = 4000) -> List[str]:
    """
    将长文本分块，适合送入 LLM
    """
    chunks = []
    current_chunk = ""

    # 按段落分割
    paragraphs = text.split("\n\n")

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue

        if len(current_chunk) + len(para) > max_chars:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = para
        else:
            current_chunk += "\n\n" + para

    if current_chunk:
        chunks.append(current_chunk.strip())

    return chunks


def extract_text_from_bytes(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    从上传的字节流中解析 PDF
    """
    import tempfile
    import os

    # 保存为临时文件
    suffix = Path(filename).suffix.lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        if suffix == ".pdf":
            result = parse_pdf(tmp_path)
        elif suffix in [".txt", ".md"]:
            with open(tmp_path, "r", encoding="utf-8") as f:
                text = f.read()
            result = {
                "total_pages": 1,
                "full_text": text,
                "pages": [{"page_num": 1, "text": text}],
                "success": True,
                "error": None,
            }
        else:
            result = {
                "total_pages": 0,
                "full_text": "",
                "pages": [],
                "success": False,
                "error": f"不支持的文件格式: {suffix}",
            }
    except Exception as e:
        result = {
            "total_pages": 0,
            "full_text": "",
            "pages": [],
            "success": False,
            "error": str(e),
        }
    finally:
        os.unlink(tmp_path)

    return result
