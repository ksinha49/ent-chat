@echo off
rem Build and run the frontend and backend locally without Docker.
rem Usage: deploy_local.bat

rem Load optional environment variables (including proxy settings)
if exist ..\.env (
  for /f "usebackq tokens=1,* delims==" %%i in (..\.env) do set "%%i=%%j"
)

pushd %~dp0\packages\frontend
pnpm install
pnpm build
start "frontend" pnpm start
popd

pushd %~dp0\packages\backend
if not exist .venv (
    python -m venv .venv
)
call .venv\Scripts\activate
pip install -r requirements.txt
start "backend" python main.py
deactivate
popd

echo Services started. Press Ctrl+C in each window to stop.
