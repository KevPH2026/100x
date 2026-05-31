# IdeaLab 产品 Context Document
> 整理时间：2026-04-20
> 整理人：Hermes (AI Agent #001)

---

## 一、项目基本信息

**产品名称：** IdeaLab
**域名：** idealab.now
**产品定位：** AI 灵感创作平台 —— 把原材料（素材）变成可发布的营销内容（文案+设计稿）
**一句话描述：** 丢入素材，5分钟出可用的营销文案和设计稿

**曾用名：** CopyForge（已废弃）

---

## 二、核心功能

### 2.1 用户主流程（5步向导）

```
Step 1: 上传素材
  - 支持：文件上传（图片/PDF/DOC）、链接粘贴（URL）、直接文本输入
  - 可以同时上传多个素材
  - 每个素材可删除

Step 2: 选择场景
  - 朋友圈素材、小红书、抖音、微博、电商主图、品牌故事 等

Step 3: 选择风格
  - 风格标签多选：高级感、接地气、专业、活泼、简约、炫酷 等

Step 4: 选择受众 + 明确目标
  - 受众：老板、白领、宝妈、年轻人等
  - 目标：种草、转化、品牌曝光、活动推广

Step 5: AI 生成
  - 文案生成（3条不同角度）
  - 设计稿生成（配套风格）
  - 支持下载 PNG
```

### 2.2 后端架构（3模型Pipeline）

```
用户素材
   ↓
[qwen-vl-72B via OpenRouter] → 视觉解析，提取素材中的关键信息
   ↓
[GPT-4o via OpenRouter] → 生成3条不同角度的营销文案
   ↓
[MiniMax image-01] → 根据文案+风格生成配套设计稿
   ↓
输出：文案 + 设计图
```

---

## 三、技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 16 (App Router) |
| UI 组件 | shadcn/ui + Tailwind CSS |
| 状态管理 | Zustand |
| 后端 | Next.js API Routes |
| 视觉解析 | qwen2.5-vl-72B (OpenRouter) |
| 文案生成 | GPT-4o (OpenRouter) |
| 图片生成 | MiniMax image-01 |
| 存储（规划） | Supabase |
| 状态管理 | Zustand |

**环境变量 (.env.local)：**
```
OPENROUTER_API_KEY=sk-or-v2-...
MINIMAX_API_KEY=sk-cp-...
```

---

## 四、当前代码结构

```
/Users/mac/projects/copyforge/
├── src/
│   ├── app/
│   │   ├── page.tsx              # 入口 → AppShell
│   │   ├── layout.tsx           # 根布局，metadata
│   │   ├── globals.css          # CSS变量/主题
│   │   └── api/
│   │       └── generate/route.ts # 生成API（3模型pipeline）
│   ├── components/
│   │   ├── HomePage.tsx         # 首页 + 向导壳（二合一）
│   │   ├── StepIndicator.tsx    # 步骤进度条
│   │   ├── Step1_Materials.tsx  # 素材上传
│   │   ├── Step2_Scene.tsx      # 场景选择
│   │   ├── Step3_Style.tsx      # 风格选择
│   │   ├── Step4_Audience.tsx   # 受众+目标
│   │   ├── Step5_Generating.tsx  # 生成+结果展示
│   │   └── ui/                  # shadcn/ui组件
│   └── lib/
│       ├── store.ts              # Zustand状态存储
│       └── qwen.ts               # qwen-vl视觉解析封装
├── package.json
└── next.config.ts
```

**状态管理（Zustand store.ts）：**
- materials: 素材列表
- scene: 场景类型
- style: 风格标签数组
- audience: 受众
- goal: 目标
- generatedCopy: 生成的文案
- generatedImage: 生成的设计图URL
- step: 当前步骤（1-5）

---

## 五、已有设计资产

### 5.1 首页设计（已生成，需落地）
设计图存放：`/tmp/idealab_design/`
- `dark_elegant.jpg` — 深色优雅风格
- `warm_creative.jpg` — 暖色创意风格
- `glassmorphism_modern.jpg` — 毛玻璃现代风格 ← **推荐方向**
- `bold_edgy.jpg` — 锐利前卫风格

### 5.2 Logo（待生成）
- 用户要求：灯泡（💡）图标
- 用户喜欢 AI 产品的科技感+创意感
- 已下载参考图：`/tmp/idealab_logo/`（3个方向待选）

---

## 六、首页改版需求（进行中）

### 用户反馈：
1. **太丑** — 原版设计不够炫酷
2. **缺首页** — 需要一个完整的 landing page，不只是工具入口
3. **更营销** — 要把客户痛点和场景说清楚
4. **Logo** — 要用灯泡图标，不是"IL"字母

### 改版方向：
- **参考风格：** 深色背景 + 霓虹渐变 + 动态粒子效果 + 大字体排版
- **主色调：** 紫色渐变 (#7c3aed → #4f46e5)
- **背景：** 深色（深紫/近黑）
- **强调：** 霓虹紫、荧光蓝
- **情绪：** 炫酷、科技、前沿

### 首页结构（待实现）：
```
顶部导航（固定）
  ↓
Hero Section（大标题 + 副标题 + CTA + 动态背景效果）
  ↓
Pain Points（3个客户痛点）
  ↓
How It Works（4步流程，配图/动画）
  ↓
Use Cases（6个场景卡片）
  ↓
Features（核心能力，图标+描述）
  ↓
Social Proof（评价/数据）
  ↓
Bottom CTA（再次引导转化）
  ↓
Footer
```

### 客户痛点（待填入）：
- 有素材不会用
- 设计师档期排不开
- 文案写不出
- 效率低、出品质量不稳

---

## 七、待完成任务

| 优先级 | 任务 | 状态 |
|--------|------|------|
| P0 | 生成灯泡 Logo（AI风格） | 待做 |
| P0 | 落地深色炫酷版首页 | 进行中 |
| P0 | 集成 Supabase 存储 | 待做 |
| P1 | 生成更多设计变体 | 待做 |
| P1 | 部署到 Vercel/now | 待做 |
| P2 | 完善 Step3/Step4 组件细节 | 待优化 |
| P2 | 响应式适配 | 待做 |

---

## 八、用户画像 & 沟通偏好

**用户：** Mr.K（KevPH2026）
- 中企跨境业务负责人
- 懂产品、懂营销、有审美
- 沟通风格：直接、结果导向、讨厌废话
- 语言：中文
- 要求：随时汇报进展，不要等

**沟通风格偏好：**
- 发文字不要语音
- 直接说结论，少客套
- 思维散点式，先记录后应用

---

## 九、开发规范（来自 SOUL.md）

- 结果导向，直接上线
- 不要等用户问，主动汇报
- 遇到问题先尝试解决，再问
- 决策前描述方案，不要只问"你想要什么"
- 文案要有情绪张力和反转，不写官话

---

## 十、API 关键参数

### MiniMax 图片生成
```
POST https://api.minimax.chat/v1/image_generation
{
  "model": "image-01",
  "prompt": "...",
  "aspect_ratio": "16:9",
  "resolution": "1024x1024"
}
Response: { "data": { "image_urls": ["https://..."] } }
注意：图片URL约24小时过期，需及时下载
```

### OpenRouter qwen-vl（视觉解析）
```
POST https://openrouter.ai/api/v1/chat/completions
Model: qwen/qwen2.5-vl-72b-instruct
注意：需关闭代理 proxies={"http": None, "https": None}
```

### OpenAI GPT-4o（文案生成）
```
POST https://openrouter.ai/api/v1/chat/completions
Model: openai/gpt-4o
```

---

## 十一、对话历史关键决策记录

| 日期 | 决策 | 背景 |
|------|------|------|
| 2026-04-20 | 弃用 CopyForge，改名 IdeaLab | 用户觉得名字不够好 |
| 2026-04-20 | 注册域名 idealab.now | 用户已注册 |
| 2026-04-20 | 确定 glassmorphism modern 风格 | 作为首页设计方向 |
| 2026-04-20 | 用户要求深色炫酷版 | 觉得浅色不够炫 |
| 2026-04-20 | 确定灯泡为 Logo 主元素 | 用户喜欢 AI 灯泡概念 |
| 2026-04-20 | 首页要更营销化 | 痛点+场景要说清楚 |

---

*本文件由 Hermes 整理，供另一 Agent 接手开发使用。*
*如需补充信息，请查阅 /Users/mac/projects/copyforge/ 下的源代码。*
