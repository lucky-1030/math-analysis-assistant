"""Vercel Serverless Function 入口 — FastAPI 应用"""

import sys
import os

# 确保能找到 backend 模块
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app
