"""LLM 知识点提取模块 - 使用统一接口层"""

import json
from typing import Dict, Any, List
from llm_providers import get_provider, LLMProvider


EXTRACTION_PROMPT = """你是一个数学教材分析专家。请从以下数学教材内容中提取知识点，整理成结构化的知识图谱。

## 提取要求

1. **节点类型**（必须严格分类）：
   - definition: 定义
   - theorem: 定理
   - lemma: 引理
   - corollary: 推论
   - concept: 概念/性质
   - example: 例题/例子

2. **每个节点必须包含**：
   - id: 英文小写，用下划线连接（如 limit_definition, cauchy_theorem）
   - label: 中文名称
   - type: 上述类型之一
   - content: 核心内容摘要（100-300字），保留关键定义陈述和公式，不要写完整证明过程
   - chapter: 所属章节
   - page: 页码（如果有）

3. **关系提取**（只在同一内容块内提取明显的关系）：
   - prerequisite: 前置知识（A 是 B 的前提）
   - implies: 蕴含/导出（A 推出 B）
   - applies: 应用（A 应用于 B）
   - generalizes: 推广（A 是 B 的推广）
   - equivalent: 等价（A 和 B 等价）

4. **注意**：
   - 保留数学公式的原始 LaTeX 格式（$...$ 或 $$...$$）
   - content 不要包含完整证明或冗长推导，保持简洁
   - 每个知识点只提取一次，避免重复
   - 关系必须有意义，不要强行建立关系

## 输出格式

必须以 JSON 格式输出，不要有任何其他文字：

{
  "nodes": [
    {
      "id": "...",
      "label": "...",
      "type": "definition|theorem|lemma|corollary|concept|example",
      "content": "...",
      "chapter": "...",
      "page": "..."
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "node_id_1",
      "target": "node_id_2",
      "type": "prerequisite|implies|applies|generalizes|equivalent",
      "label": "..."
    }
  ]
}
"""


def _log_debug(msg: str) -> None:
    """安全写入调试日志"""
    try:
        with open("llm_debug.log", "a", encoding="utf-8") as dbg:
            dbg.write(msg + "\n")
    except Exception:
        pass


def _extract_single(content: str, chapter_title: str, provider) -> Dict[str, Any]:
    """单次 LLM 调用提取知识点"""
    prompt = EXTRACTION_PROMPT + "\n\n## 教材内容\n\n" + content

    try:
        raw_text = provider.chat_completion(
            system_prompt="你是一个专业的数学教材分析助手，擅长从教材中提取结构化知识点。",
            user_message=prompt,
            max_tokens=8192,
            temperature=0.2,
        )

        raw_text = raw_text.strip()

        # 去掉 markdown 代码块包裹
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        raw_text = raw_text.strip()

        _log_debug(f"[RAW] length={len(raw_text)} last200={raw_text[-200:]!r}")

        data = json.loads(raw_text)

        nodes = data.get("nodes", [])
        edges = data.get("edges", [])

        for node in nodes:
            if "chapter" not in node or not node["chapter"]:
                node["chapter"] = chapter_title

        for i, edge in enumerate(edges):
            if "id" not in edge or not edge["id"]:
                edge["id"] = f"e{i+1}"

        return {
            "success": True,
            "error": None,
            "nodes": nodes,
            "edges": edges,
            "provider": provider.name,
        }

    except json.JSONDecodeError as e:
        _log_debug(f"[JSON ERROR] {e}")
        return {
            "success": False,
            "error": f"JSON 解析失败: {str(e)}",
            "nodes": [],
            "edges": [],
            "provider": provider.name,
        }
    except Exception as e:
        _log_debug(f"[LLM ERROR] {e}")
        return {
            "success": False,
            "error": f"LLM 调用失败: {str(e)}",
            "nodes": [],
            "edges": [],
            "provider": provider.name,
        }


def _chunk_text(text: str, max_chars: int = 6000) -> List[str]:
    """简单分块，按段落分割"""
    chunks = []
    current = ""
    for para in text.split("\n\n"):
        para = para.strip()
        if not para:
            continue
        if len(current) + len(para) > max_chars:
            if current:
                chunks.append(current.strip())
            current = para
        else:
            current += "\n\n" + para
    if current:
        chunks.append(current.strip())
    return chunks


def extract_knowledge(content: str, chapter_title: str = "") -> Dict[str, Any]:
    """
    调用配置的 LLM 从文本中提取知识点。
    文本过长时自动分块，合并结果。
    """
    try:
        provider = get_provider()
    except ValueError as e:
        return {"success": False, "error": str(e), "nodes": [], "edges": []}

    if not provider.is_configured:
        return {
            "success": False,
            "error": f"LLM 提供者 '{provider.name}' 未配置 API Key",
            "nodes": [],
            "edges": [],
        }

    _log_debug(f"[EXTRACT] provider={provider.name} content_len={len(content)}")

    # 短文本直接提取
    if len(content) <= 10000:
        result = _extract_single(content, chapter_title, provider)
        _log_debug(f"[SINGLE] success={result['success']} nodes={len(result['nodes'])} edges={len(result['edges'])}")
        return result

    # 长文本分块提取
    chunks = _chunk_text(content, max_chars=6000)
    _log_debug(f"[CHUNKED] chunks={len(chunks)}")

    all_nodes: List[Dict] = []
    all_edges: List[Dict] = []
    seen_node_ids = set()
    seen_edge_ids = set()

    for i, chunk in enumerate(chunks):
        result = _extract_single(chunk, chapter_title, provider)
        _log_debug(f"[CHUNK {i}] success={result['success']} nodes={len(result['nodes'])} edges={len(result['edges'])}")

        if result["success"]:
            for node in result["nodes"]:
                if node.get("id") and node["id"] not in seen_node_ids:
                    seen_node_ids.add(node["id"])
                    all_nodes.append(node)
            for edge in result["edges"]:
                eid = edge.get("id") or f"{edge.get('source')}->{edge.get('target')}"
                if eid not in seen_edge_ids:
                    seen_edge_ids.add(eid)
                    all_edges.append(edge)

    _log_debug(f"[MERGED] total_nodes={len(all_nodes)} total_edges={len(all_edges)}")

    return {
        "success": True,
        "error": None,
        "nodes": all_nodes,
        "edges": all_edges,
        "provider": provider.name,
        "raw_response": f"分块提取完成，共 {len(chunks)} 块，合并后 {len(all_nodes)} 个节点",
    }


def generate_study_path(nodes: List[Dict], edges: List[Dict]) -> List[Dict]:
    """
    基于知识图谱生成学习路径
    """
    if not nodes:
        return []

    in_degree = {node["id"]: 0 for node in nodes}
    for edge in edges:
        if edge.get("type") == "prerequisite":
            in_degree[edge["target"]] = in_degree.get(edge["target"], 0) + 1

    sorted_nodes = sorted(nodes, key=lambda n: in_degree.get(n["id"], 0))

    path = []
    for i, node in enumerate(sorted_nodes):
        days = 2 if node["type"] in ["theorem", "concept"] else 1
        reasons = {
            "definition": "基础概念，先理解再推进",
            "theorem": "核心定理，需要花时间理解证明",
            "lemma": "辅助工具，理解即可",
            "corollary": "简单推导，快速过",
            "concept": "概念辨析，需要消化",
            "example": "通过例子巩固理解",
        }
        path.append({
            "id": node["id"],
            "title": node["label"],
            "days": days,
            "reason": reasons.get(node["type"], "重点复习"),
        })

    return path
