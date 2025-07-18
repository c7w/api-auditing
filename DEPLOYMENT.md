# API 审计系统部署文档

## 系统要求

- Python 3.8+
- Node.js 18+
- PostgreSQL 12+ 或 SQLite（开发环境）

## 项目部署

### 1. 获取代码
```bash
# 克隆项目（或从其他机器拷贝）
git clone <repository-url>
cd api-auditing

# 或者直接拷贝项目文件夹
```

### 2. 后端部署

#### 2.1 创建虚拟环境
```bash
# 在项目根目录
python3 -m venv venv

# 激活虚拟环境
# macOS/Linux:
source venv/bin/activate
```

#### 2.2 安装依赖
```bash
pip install -r requirements.txt
```

#### 2.3 数据库配置

**开发环境（SQLite）:**
```bash
mkdir -p logs
python manage.py migrate
python manage.py createsuperuser
```

#### 2.4 启动后端服务
```bash
# 开发环境
python manage.py runserver 0.0.0.0:20004

# 生产环境建议使用 gunicorn
pip install gunicorn
gunicorn core.wsgi:application --bind 0.0.0.0:20004 --threads 8
```

### 3. 前端部署

#### 3.1 安装依赖
```bash
cd frontend
npm install
```

#### 3.2 启动前端服务

**开发环境:**
```bash
npm run dev
```

**生产环境:**
```bash
# 构建生产版本
npm run build

# 使用静态文件服务器
npm install -g serve
serve -s dist -l 20005

# 或者使用 nginx 等 Web 服务器托管 dist 目录
```
