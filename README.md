# 后台管理前端 (Vue 3 + Naive UI)

## 环境要求

- Node.js >= 18
- pnpm >= 8

## 开发环境

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

开发环境使用 `.env` 文件（已配置代理）。如需修改后端地址，编辑 `.env.test`：

```
VITE_SERVICE_BASE_URL=http://your-backend-url/api/admin
```

### 3. 启动开发服务器

```bash
pnpm dev
```

访问 `http://localhost:9527`

## 生产部署

### 1. 构建

```bash
pnpm build
```

构建产物在 `dist/` 目录。

### 2. 部署到服务器

将 `dist/` 目录内容上传到 Web 服务器。

### 3. Nginx 配置

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;
    root /path/to/admin_ui/dist;
    index index.html;

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理（如果前后端不同域名）
    location /api/ {
        proxy_pass http://api.yourdomain.com/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 静态资源缓存
    location /assets {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 4. 环境变量

生产环境编辑 `.env.prod`：

```
VITE_SERVICE_BASE_URL=https://api.yourdomain.com/api/admin
```

## 提示音文件

`public/static/` 目录下放置提示音 mp3 文件：
- `dingdong.mp3` - 默认提示音
- `yingbi.mp3` - 金币掉落声
- `jingming.mp3` - 急促警报
- `changming.mp3` - 急促警报（长鸣）

## 目录结构

```
src/
├── components/     # 公共组件
├── hooks/          # 组合式函数
├── layouts/        # 布局组件
├── locales/        # 国际化
├── router/         # 路由配置
├── service/        # API 服务
├── store/          # 状态管理
├── views/          # 页面组件
└── utils/          # 工具函数
```
