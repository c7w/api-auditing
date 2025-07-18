# API 审计系统部署文档

## 系统要求

- Python 3.8+
- Node.js 18+
- PostgreSQL 12+ 或 SQLite（开发环境）

## 环境安装

### 1. Python 环境

#### macOS
```bash
# 使用 Homebrew 安装 Python
brew install python3

# 或者使用 pyenv 管理多个 Python 版本
brew install pyenv
pyenv install 3.10.0
pyenv global 3.10.0
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv
```

#### CentOS/RHEL
```bash
sudo yum install python3 python3-pip
# 或者使用 dnf (较新版本)
sudo dnf install python3 python3-pip
```

### 2. Node.js 环境

#### 方法一：使用官方安装包
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本（推荐 18.x 或更高版本）
3. 按照安装向导完成安装

#### 方法二：使用包管理器

**macOS (Homebrew):**
```bash
brew install node
```

**Ubuntu/Debian:**
```bash
# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS/RHEL:**
```bash
# 安装 Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### 方法三：使用 NVM (推荐)
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载终端或执行
source ~/.bashrc

# 安装并使用 Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
```

### 3. 验证安装
```bash
python3 --version  # 应该显示 Python 3.8+
node --version      # 应该显示 v18.0.0+
npm --version       # 应该显示 npm 版本
```

## 项目部署

### 1. 获取代码
```bash
# 克隆项目（或从其他机器拷贝）
git clone <repository-url>
cd auditing

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
# Windows:
# venv\Scripts\activate
```

#### 2.2 安装依赖
```bash
pip install -r requirements.txt
```

#### 2.3 数据库配置

**开发环境（SQLite）:**
```bash
# 无需额外配置，Django 会自动创建 SQLite 文件
```

**生产环境（PostgreSQL）:**
```bash
# 安装 PostgreSQL
# Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib

# macOS:
brew install postgresql

# 创建数据库和用户
sudo -u postgres psql
CREATE DATABASE auditing_db;
CREATE USER auditing_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE auditing_db TO auditing_user;
\q

# 修改 core/settings.py 中的数据库配置
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'auditing_db',
        'USER': 'auditing_user',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

#### 2.4 环境变量配置
```bash
# 创建 .env 文件（可选）
cp .env.example .env

# 编辑 .env 文件，设置必要的环境变量
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
```

#### 2.5 数据库迁移
```bash
# 应用数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser
```

#### 2.6 启动后端服务
```bash
# 开发环境
python manage.py runserver 0.0.0.0:8000

# 生产环境建议使用 gunicorn
pip install gunicorn
gunicorn core.wsgi:application --bind 0.0.0.0:8000
```

### 3. 前端部署

#### 3.1 安装依赖
```bash
cd frontend
npm install
```

#### 3.2 环境配置
```bash
# 创建环境配置文件
cp .env.example .env.local

# 编辑 .env.local，设置后端 API 地址
VITE_API_BASE_URL=http://localhost:8000/api
```

#### 3.3 启动前端服务

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
serve -s dist -l 3000

# 或者使用 nginx 等 Web 服务器托管 dist 目录
```

## 服务启动顺序

1. **启动后端服务**
```bash
# 激活虚拟环境
source venv/bin/activate

# 启动 Django 服务
python manage.py runserver 0.0.0.0:8000
```

2. **启动前端服务**
```bash
# 新开一个终端
cd frontend
npm run dev
```

3. **访问应用**
- 前端地址: http://localhost:3000
- 后端 API: http://localhost:8000
- 管理后台: http://localhost:8000/admin

## 生产环境建议

### 1. 反向代理配置 (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django 管理后台
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. 系统服务配置

#### 后端服务 (systemd)
```ini
# /etc/systemd/system/auditing-backend.service
[Unit]
Description=Auditing Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/auditing
Environment=PATH=/path/to/auditing/venv/bin
ExecStart=/path/to/auditing/venv/bin/gunicorn core.wsgi:application --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

#### 启用服务
```bash
sudo systemctl daemon-reload
sudo systemctl enable auditing-backend
sudo systemctl start auditing-backend
sudo systemctl status auditing-backend
```

### 3. 安全配置

1. **设置防火墙规则**
2. **配置 HTTPS**
3. **设置合适的文件权限**
4. **定期备份数据库**

## 常见问题

### 1. 端口冲突
如果默认端口被占用，可以修改：
- 后端: `python manage.py runserver 0.0.0.0:8001`
- 前端: 修改 `vite.config.ts` 中的 `port` 配置

### 2. 依赖安装失败
```bash
# 清理缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Python 依赖
pip cache purge
pip install -r requirements.txt --no-cache-dir
```

### 3. 数据库连接问题
- 检查数据库服务是否启动
- 验证连接参数是否正确
- 确认防火墙设置

### 4. 静态文件问题
```bash
# Django 收集静态文件
python manage.py collectstatic
```

## 维护操作

### 备份数据库
```bash
# SQLite
cp db.sqlite3 backup_$(date +%Y%m%d_%H%M%S).sqlite3

# PostgreSQL
pg_dump auditing_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 更新代码
```bash
# 拉取最新代码
git pull origin main

# 更新后端
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# 更新前端
cd frontend
npm install
npm run build

# 重启服务
sudo systemctl restart auditing-backend
``` 