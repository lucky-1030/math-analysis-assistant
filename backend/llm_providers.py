"""LLM 统一接口层 - 支持多种 AI 模型提供商"""

import os
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class LLMProvider(ABC):
    """LLM 提供者抽象基类"""

    @abstractmethod
    def chat_completion(self, system_prompt: str, user_message: str, **kwargs) -> str:
        """调用模型，返回文本回复"""
        pass

    @property
    @abstractmethod
    def name(self) -> str:
        """提供者名称"""
        pass

    @property
    def is_configured(self) -> bool:
        """是否已配置（有 API Key）"""
        return True


class AnthropicProvider(LLMProvider):
    """Claude / Anthropic"""

    def __init__(self, api_key: Optional[str] = None, model: str = "claude-3-5-sonnet-20241022"):
        self.api_key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        self.model = model or os.environ.get("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022")
        self._client = None

    @property
    def name(self) -> str:
        return "anthropic"

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def _get_client(self):
        if self._client is None:
            from anthropic import Anthropic
            self._client = Anthropic(api_key=self.api_key)
        return self._client

    def chat_completion(self, system_prompt: str, user_message: str, **kwargs) -> str:
        client = self._get_client()
        response = client.messages.create(
            model=self.model,
            max_tokens=kwargs.get("max_tokens", 4000),
            temperature=kwargs.get("temperature", 0.2),
            system=system_prompt,
            messages=[{"role": "user", "content": user_message}],
        )
        return response.content[0].text


class DeepSeekProvider(LLMProvider):
    """DeepSeek"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "deepseek-chat",
        base_url: str = "https://api.deepseek.com",
    ):
        self.api_key = api_key or os.environ.get("DEEPSEEK_API_KEY")
        self.model = model or os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")
        self.base_url = base_url or os.environ.get("DEEPSEEK_BASE_URL", "https://api.deepseek.com")

    @property
    def name(self) -> str:
        return "deepseek"

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def chat_completion(self, system_prompt: str, user_message: str, **kwargs) -> str:
        import httpx

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "max_tokens": kwargs.get("max_tokens", 4000),
            "temperature": kwargs.get("temperature", 0.2),
        }

        with httpx.Client(timeout=120.0) as client:
            response = client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]


class OpenAIProvider(LLMProvider):
    """OpenAI / 兼容 OpenAI 接口的模型（如 Azure、智谱等）"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o",
        base_url: str = "https://api.openai.com/v1",
    ):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.model = model or os.environ.get("OPENAI_MODEL", "gpt-4o")
        self.base_url = base_url or os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")

    @property
    def name(self) -> str:
        return "openai"

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key)

    def chat_completion(self, system_prompt: str, user_message: str, **kwargs) -> str:
        import httpx

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "max_tokens": kwargs.get("max_tokens", 4000),
            "temperature": kwargs.get("temperature", 0.2),
        }

        with httpx.Client(timeout=120.0) as client:
            response = client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]


class MockProvider(LLMProvider):
    """模拟提供者 - 用于测试，不调用真实 API"""

    @property
    def name(self) -> str:
        return "mock"

    @property
    def is_configured(self) -> bool:
        return True

    def chat_completion(self, system_prompt: str, user_message: str, **kwargs) -> str:
        # 返回一个简单的模拟响应
        return json.dumps({
            "nodes": [
                {
                    "id": "mock_def_1",
                    "label": "模拟定义",
                    "type": "definition",
                    "content": "这是一个模拟的知识点，用于测试系统。",
                    "chapter": "测试章节",
                }
            ],
            "edges": [],
        }, ensure_ascii=False)


# ===== 工厂函数 =====

PROVIDERS = {
    "anthropic": AnthropicProvider,
    "deepseek": DeepSeekProvider,
    "openai": OpenAIProvider,
    "mock": MockProvider,
}


def get_provider(provider_name: Optional[str] = None) -> LLMProvider:
    """
    根据配置获取 LLM 提供者实例
    """
    name = (provider_name or os.environ.get("LLM_PROVIDER", "mock")).lower()

    if name not in PROVIDERS:
        raise ValueError(f"不支持的 LLM 提供者: {name}。支持的选项: {list(PROVIDERS.keys())}")

    return PROVIDERS[name]()


def list_available_providers() -> Dict[str, bool]:
    """
    列出所有可用的提供者及其配置状态
    """
    return {
        name: provider().is_configured
        for name, provider in PROVIDERS.items()
    }
