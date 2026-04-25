# 使用官方 Python 3.10 slim 镜像
FROM python:3.10-slim

# 设置工作目录为 /app
WORKDIR /app

# 复制当前目录（backend）的所有文件到 /app
COPY . /app

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 暴露 8000 端口
EXPOSE 8000

# 启动 FastAPI 服务
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]