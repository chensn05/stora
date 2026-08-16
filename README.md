# 五行行星日记 / Planet Diary

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100-009688.svg)

**用五行哲学记录生活，与行星护卫对话心灵**

*Record your life with Five Elements philosophy, chat with planetary guardians*

[English](#english) | [中文](#中文)

</div>

---

## 中文

### ✨ 项目简介

五行行星日记是一款结合中国传统五行哲学与现代 3D 可视化的日记应用。每颗行星代表五行之一（金、木、水、火、土），对应不同的情绪状态。在这里，你可以：

- 🌌 在 3D 太阳系中自由探索五颗行星
- 📝 在不同行星上记录对应的情绪日记
- 🤖 与行星护卫精灵 AI 对话，获得情感支持
- ⚖️ 通过五行平衡图表了解自己的情感分布
- 👥 添加好友，分享可见的日记动态
- 💬 点赞评论，建立情感连接

### 🎨 五行设计

| 行星 | 五行 | 情绪状态 | 护卫精灵 | 性格特点 |
|------|------|----------|----------|----------|
| 水星 | 水 | 闪念 | 辰星 | 灵动、敏捷、话少精准 |
| 金星 | 金 | 好恶 | 太白 | 优雅、清醒、有主见 |
| 火星 | 火 | 上头 | 荧惑 | 热血、直率、充满能量 |
| 木星 | 木 | 生长 | 岁星 | 沉稳、温和、有耐心 |
| 土星 | 土 | 沉淀 | 镇星 | 安静、包容、踏实 |

**五行相生**：水生木 → 木生火 → 火生土 → 土生金 → 金生水  
**五行相克**：水克火 → 火克金 → 金克木 → 木克土 → 土克水

### 🚀 技术栈

**前端**
- React 18 + TypeScript
- Three.js + React Three Fiber（3D 渲染）
- Vite（构建工具）
- Supabase Auth（用户认证）

**后端**
- FastAPI（Python 异步框架）
- PostgreSQL（数据库）
- DeepSeek API（AI 对话）
- PyJWT（JWT 认证）

### 📦 快速开始

#### 方式一：Docker Compose（推荐）

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd planet-diary-opensource

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的配置

# 3. 启动服务
docker-compose up -d

# 4. 访问应用
open http://localhost
```

#### 方式二：本地开发

**前置要求**
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

**后端启动**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # 配置数据库和 API
python run.py
```

**前端启动**
```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

### 🔧 环境配置

复制 `.env.example` 为 `.env`，配置以下变量：

```bash
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=planet_diary

# Supabase（用于用户认证）
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# DeepSeek API（AI 对话）
DEEPSEEK_API_KEY=your_deepseek_key

# 前端环境变量
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 📸 截图

<div align="center">
  <img src="docs/screenshot-solar-system.png" alt="太阳系" width="80%"/>
  <p><em>3D 太阳系主界面</em></p>
  
  <img src="docs/screenshot-planet.png" alt="行星视图" width="80%"/>
  <p><em>行星日记视图</em></p>
  
  <img src="docs/screenshot-earth.png" alt="地球社区" width="80%"/>
  <p><em>地球社区中心</em></p>
</div>

### 🛠️ 部署

#### Vercel 部署（前端）

```bash
cd frontend
npm install
vercel --prod
```

#### Railway/Render 部署（后端）

配置环境变量后，使用 `backend/Dockerfile` 部署。

#### 自建服务器

使用 `docker-compose.yml` 一键部署，包含数据库、后端、前端三个容器。

### 📖 使用指南

1. **注册登录**：使用邮箱注册账号
2. **探索行星**：点击太阳系中的行星进入
3. **记录日记**：在行星页面写下你的心情
4. **选择情绪**：使用 Emoji 标签标记当前情绪
5. **与护卫对话**：点击护卫精灵图片开始 AI 对话
6. **查看平衡**：在地球页面查看五行平衡图表
7. **添加好友**：通过邮箱添加好友，分享可见日记

### 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 📄 开源协议

MIT License

---

## English

### ✨ Introduction

Planet Diary is a journaling app that combines traditional Chinese Five Elements philosophy with modern 3D visualization. Each planet represents one of the five elements (Metal, Wood, Water, Fire, Earth) and corresponds to different emotional states. Here you can:

- 🌌 Explore five planets in a 3D solar system
- 📝 Record mood journals on different planets
- 🤖 Chat with planetary guardian spirits for emotional support
- ⚖️ Understand your emotional distribution through Five Elements balance charts
- 👥 Add friends and share visible diary feeds
- 💬 Like and comment to build emotional connections

### 🎨 Five Elements Design

| Planet | Element | Emotional State | Guardian | Personality |
|--------|---------|-----------------|----------|-------------|
| Mercury | Water | Fleeting Thoughts | Chenxing | Agile, precise, few words |
| Venus | Metal | Likes & Dislikes | Taibai | Elegant, clear-headed, opinionated |
| Mars | Fire | Intense Emotions | Yinghuo | Passionate, direct, energetic |
| Jupiter | Wood | Growth | Suixing | Calm, gentle, patient |
| Saturn | Earth | Reflection | Zhenxing | Quiet,包容, grounded |

**Generating Cycle**: Water → Wood → Fire → Earth → Metal → Water  
**Overcoming Cycle**: Water overcomes Fire → Fire overcomes Metal → Metal overcomes Wood → Wood overcomes Earth → Earth overcomes Water

### 🚀 Tech Stack

**Frontend**
- React 18 + TypeScript
- Three.js + React Three Fiber (3D rendering)
- Vite (build tool)
- Supabase Auth (authentication)

**Backend**
- FastAPI (Python async framework)
- PostgreSQL (database)
- DeepSeek API (AI chat)
- PyJWT (JWT authentication)

### 📦 Quick Start

#### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone the project
git clone <your-repo-url>
cd planet-diary-opensource

# 2. Configure environment variables
cp .env.example .env
# Edit .env file with your configuration

# 3. Start services
docker-compose up -d

# 4. Access the app
open http://localhost
```

#### Option 2: Local Development

**Prerequisites**
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+

**Start Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Configure database and APIs
python run.py
```

**Start Frontend**
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

### 🔧 Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=planet_diary

# Supabase (for authentication)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# DeepSeek API (for AI chat)
DEEPSEEK_API_KEY=your_deepseek_key

# Frontend environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 🛠️ Deployment

#### Vercel (Frontend)
```bash
cd frontend
npm install
vercel --prod
```

#### Railway/Render (Backend)
Configure environment variables and deploy using `backend/Dockerfile`.

#### Self-hosted
Use `docker-compose.yml` for one-click deployment with database, backend, and frontend containers.

### 📖 Usage Guide

1. **Sign Up/Login**: Register with your email
2. **Explore Planets**: Click on planets in the solar system
3. **Write Diaries**: Record your mood on planet pages
4. **Select Emotions**: Use emoji tags to mark current mood
5. **Chat with Guardians**: Click guardian images for AI conversations
6. **View Balance**: Check Five Elements balance chart on Earth page
7. **Add Friends**: Add friends by email and share visible diaries

### 🤝 Contributing

Issues and Pull Requests are welcome!

### 📄 License

MIT License

---

<div align="center">

**Made with ❤️ by the community**

*Embrace your emotions, find your balance*

</div>
