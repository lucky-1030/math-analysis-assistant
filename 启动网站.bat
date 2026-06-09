@echo off
echo ================================
echo   数学分析学习助手 - 启动中...
echo ================================
echo.

cd /d "%~dp0backend"
echo [1/2] 启动后端 (localhost:8000)...
start "Backend" cmd /c "python -m uvicorn main:app --host 0.0.0.0 --port 8000"

cd /d "%~dp0"
echo [2/2] 启动前端 (localhost:5173)...
start "Frontend" cmd /c "npm run dev"

echo.
echo ================================
echo   启动完成！
echo   请在浏览器打开:
echo   http://localhost:5173
echo ================================
echo.
echo 不要关闭本窗口，按任意键可以停止...
pause >nul
