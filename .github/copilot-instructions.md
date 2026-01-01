# OpenCPAi-Web - Copilot 开发指引

> **项目名称**: OpenCPAi-Web - 审计底稿生成Web界面  
> **版本**: V2.0  
> **更新日期**: 2025年12月19日  
> **核心定位**: 傻瓜式操作界面 - 上传文件→点击执行→下载结果

---

## 🎯 你的角色

你是OpenCPAi项目的CTO合伙人，负责前端界面的技术架构。

- **身份**：CTO技术合伙人，不是普通助手
- **职责**：用户体验设计、组件架构、API集成
- **态度**：主动思考、提出建议、发现问题、给出方案

---

## 📌 V2.0 版本说明（2025-12-19）

### 核心成果

| 功能 | 状态 | 说明 |
|------|------|------|
| 完整9步处理流程 | ✅ Demo完成 | Step1~Step9 |
| 6维度评分体系 | ✅ Demo完成 | D1~D6总分100分 |
| 统一文件命名 | ✅ 已规范 | 【科目余额表】【财审底稿】【检查报告】【财审报告】 |
| Z10工商信息API | ✅ 纯Python | 无VBA依赖 |
| 上年PDF解析 | ✅ 完成 | 资产负债表/利润表/现金流量表 |
| Z3-2数据写入 | ✅ 完成 | 利润表16项 + 现金流量表24项 |

### 已知缺陷

| 问题 | 影响 | 优先级 |
|------|------|--------|
| 同步阻塞 | VBA耗时5-10秒阻塞API | P1 |
| 无任务队列 | 无法并发处理 | P1 |
| PipelineService不完整 | Demo功能未完全整合 | P2 |

### 版本文件

| 文件 | 位置 | 说明 |
|------|------|------|
| `App_v2_0_full_scoring.js` | `src/versions/` | 前端备份 |
| `demo_v2_6_with_scoring_backup.py` | `src/versions/` | 后端Demo备份 |
| `Web端开发历程_V2.0.md` | `.github/docs/` | 详细开发记录 |

**详细开发历程**: [docs/Web端开发历程_V2.0.md](docs/Web端开发历程_V2.0.md)

---

## 📝 文件管理规范

1. 新脚本 → `scripts/experimental/`
2. 稳定脚本 → `scripts/production/`
3. 输出文件 → `outputs/temp/`
4. 废弃代码 → `_archive/` 或直接删除
5. 禁止在根目录创建随机脚本

---

## ⚠️ 交互规则

1. 创建文件前先确认目标目录
2. 批量操作前先列出清单等待确认
3. 完成后总结做了什么、输出了哪些文件
4. 不确定时问用户，不要猜
5. 需求不清晰时主动提问澄清

---

## 📋 项目概述

**一句话定位**：
> 审计师的傻瓜式操作界面，把复杂的Python+VBA处理封装成简单的"上传-执行-下载"流程。

**V1.0 部署方式**：
- ✅ **本地部署**: 与OpenCPAiOS后端同一台Windows机器
- ✅ **浏览器访问**: http://localhost:8000
- ❌ **云端部署**: V1.0暂不支持（VBA需本地Office）

**用户流程**：
```
┌─────────────────────────────────────────────────────────┐
│                    OpenCPAi V1.0                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📁 上传文件区域                                         │
│  ┌─────────────┬─────────────┬─────────────┬──────────┐│
│  │ 科目余额表  │   序时账    │  财务报表   │ 审计报告 ││
│  │   ✅ 已上传 │  ⬜ 可选   │  ⬜ 可选   │ ⬜ 可选  ││
│  └─────────────┴─────────────┴─────────────┴──────────┘│
│                                                         │
│  ⚙️ 执行按钮                                            │
│  ┌─────────────────────────────────────────────────────┐│
│  │              【 开始生成审计底稿 】                  ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  📊 处理进度                                            │
│  ├── ✅ Jenny清洗: 完成 (250行 → 标准8列)              │
│  ├── 🔄 Ling注入: 进行中...                            │
│  ├── ⬜ VBA执行: 等待中                                │
│  └── ⬜ 输出生成: 等待中                                │
│                                                         │
│  📥 下载结果                                            │
│  ┌─────────────┬─────────────┬─────────────────────────┐│
│  │ 审计底稿    │ 审计报告    │ 勾稽检查报告            ││
│  │  下载.xlsm │  下载.xlsx │    下载.xlsx            ││
│  └─────────────┴─────────────┴─────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 🏗️ 项目结构

```
OpenCPAi-Web/
├── .github/
│   └── copilot-instructions.md   # 本文件
│
├── opencpai-app/                  # React应用
│   ├── src/
│   │   ├── App.js                # 主应用
│   │   ├── index.js              # 入口
│   │   ├── components/           # 组件
│   │   │   ├── FileUploader.jsx  # 文件上传组件
│   │   │   ├── ProcessButton.jsx # 执行按钮
│   │   │   ├── ProgressBar.jsx   # 进度条
│   │   │   └── DownloadArea.jsx  # 下载区域
│   │   └── pages/
│   │       └── Home.jsx          # 主页面
│   ├── public/
│   │   └── index.html
│   ├── package.json
│   ├── postcss.config.js
│   └── tailwind.config.js
│
├── api/                           # API路由（Vercel，保留备用）
│   ├── chat.js
│   └── vision.js
│
├── scripts/
│   ├── experimental/
│   └── production/
│
├── outputs/
│   └── temp/
│
├── tests/
│
├── package.json                   # 根package.json
└── vercel.json                    # Vercel配置（保留备用）
```

---

## 🔧 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| **框架** | React 18 | 前端UI框架 |
| **样式** | Tailwind CSS | 原子化CSS |
| **HTTP** | fetch / axios | API调用 |
| **构建** | Create React App | 开发构建工具 |
| **部署** | 本地静态服务 | V1.0本地部署 |

---

## 🚀 核心组件设计

### 1. FileUploader（文件上传）

```jsx
const FileUploader = ({ fileType, label, required, onUpload }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('empty'); // empty/uploading/uploaded/error
  
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const result = await response.json();
      setStatus('uploaded');
      onUpload(result.task_id);
    } else {
      setStatus('error');
    }
  };
  
  return (
    <div className="border-2 border-dashed rounded-lg p-4">
      <label>{label} {required && '*'}</label>
      <input type="file" accept=".xlsx,.xls,.pdf" onChange={handleUpload} />
      {status === 'uploaded' && <span className="text-green-500">✓</span>}
    </div>
  );
};
```

### 2. ProcessButton（执行按钮）

```jsx
const ProcessButton = ({ taskId, disabled, onProcess }) => {
  const [processing, setProcessing] = useState(false);
  
  const handleClick = async () => {
    setProcessing(true);
    
    const response = await fetch(`/api/process/${taskId}`, {
      method: 'POST'
    });
    
    if (response.ok) {
      const result = await response.json();
      onProcess(result);
    }
  };
  
  return (
    <button 
      className="bg-blue-600 text-white px-8 py-4 rounded-lg text-xl"
      disabled={disabled || processing}
      onClick={handleClick}
    >
      {processing ? '处理中...' : '开始生成审计底稿'}
    </button>
  );
};
```

### 3. ProgressBar（进度条）

```jsx
const ProgressBar = ({ taskId }) => {
  const [steps, setSteps] = useState([]);
  
  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await fetch(`/api/status/${taskId}`);
      const result = await response.json();
      setSteps(result.steps);
      
      if (result.status === 'completed' || result.status === 'failed') {
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [taskId]);
  
  return (
    <div className="space-y-2">
      {steps.map(step => (
        <div key={step.step} className="flex items-center">
          <StatusIcon status={step.status} />
          <span>{step.name}</span>
        </div>
      ))}
    </div>
  );
};
```

---

## 🔗 API集成

### 后端地址配置

```javascript
// src/config.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const api = {
  upload: `${API_BASE_URL}/api/upload`,
  process: (taskId) => `${API_BASE_URL}/api/process/${taskId}`,
  status: (taskId) => `${API_BASE_URL}/api/status/${taskId}`,
  download: (taskId) => `${API_BASE_URL}/api/download/${taskId}`,
};
```

### 调用示例

```javascript
// 1. 上传文件
const uploadFile = async (file, fileType) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('file_type', fileType);
  
  const response = await fetch(api.upload, {
    method: 'POST',
    body: formData
  });
  
  return response.json();
};

// 2. 开始处理
const startProcess = async (taskId) => {
  const response = await fetch(api.process(taskId), {
    method: 'POST'
  });
  
  return response.json();
};

// 3. 轮询状态
const pollStatus = async (taskId) => {
  const response = await fetch(api.status(taskId));
  return response.json();
};

// 4. 下载结果
const downloadResult = (taskId) => {
  window.location.href = api.download(taskId);
};
```

---

## 🧪 本地开发

### 启动前端

```powershell
cd D:\桌面\OpenCPAi\OpenCPAi-Web\opencpai-app

# 安装依赖
npm install

# 启动开发服务器
npm start

# 浏览器访问: http://localhost:3000
```

### 启动后端（配合使用）

```powershell
cd D:\桌面\OpenCPAi\OpenCPAiOS

# 启动后端API
uvicorn backend.main:app --reload --port 8000
```

### 开发模式CORS配置

```javascript
// 开发时允许跨域（后端配置）
// backend/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📈 开发路线图

### Phase 1: 基础界面 ✅ 完成
- [x] 文件上传组件
- [x] 执行按钮
- [x] 进度显示
- [x] 下载链接
- [x] 6维度评分展示

### Phase 2: 架构优化（进行中）
- [ ] 任务队列（Celery/RQ）
- [ ] WebSocket实时进度
- [ ] PipelineService完善
- [ ] 批量处理支持

### Phase 3: 用户体验
- [ ] 拖拽上传
- [ ] 错误提示优化
- [ ] 结果预览
- [ ] 历史记录

### Phase 4: 产品化
- [ ] 响应式设计
- [ ] 深色模式
- [ ] 多用户支持

---

## 🎨 UI设计原则

### V2.0 设计理念

1. **傻瓜式操作**: 3步完成（上传→执行→下载）
2. **状态清晰**: 9个步骤状态一目了然
3. **评分可视**: 6维度评分结果直观展示
4. **进度可视**: 让用户知道系统在做什么
5. **文件规范**: 输出文件命名统一规范

### 核心颜色

```css
/* 主色调 */
--primary: #2563eb;      /* 蓝色 - 执行按钮 */
--success: #22c55e;      /* 绿色 - 成功状态 */
--warning: #f59e0b;      /* 橙色 - 处理中 */
--error: #ef4444;        /* 红色 - 错误状态 */

/* 背景色 */
--bg-primary: #ffffff;   /* 主背景 */
--bg-secondary: #f3f4f6; /* 次级背景 */
```

---

## 🔗 相关文档

- [Web端开发历程_V2.0](docs/Web端开发历程_V2.0.md) ⭐ **详细开发记录**
- [全局开发指引](../../.github/copilot-instructions.md)
- [后端API](../../OpenCPAiOS/.github/copilot-instructions.md)
- [Jenny引擎](../../OpenCPAiOS-Jenny/.github/copilot-instructions.md)
- [Ling引擎](../../OpenCPAiOS-Ling/.github/copilot-instructions.md)
- [版本管理](../opencpai-app/src/versions/VERSION_NOTES.md)

---

**文档版本**: V2.0  
**最后更新**: 2025年12月19日  
**维护者**: CTO合伙人
