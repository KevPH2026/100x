# 100x 后台管理系统 PRD

## 1. 现状

当前 `/admin` 页面是一个纯技术配置面板（1200行），只管理：
- API Keys（OpenRouter / MiniMax / Novart）
- 模型选择
- Prompt 模板编辑
- 场景/营销目标/情绪预设

**缺失**：没有用户管理、素材管理、数据统计、配额运营等业务管理能力。

## 2. 产品目标

把 `/admin` 从"开发者配置页"升级为"运营后台"，让 Mr.K 能：
- 看到谁在用、用了多少
- 管理用户配额和权限
- 审核素材质量
- 监控系统健康度

## 3. 信息架构

```
/admin
├── 📊 概览 Dashboard（默认页）
├── 👥 用户管理
├── 🎨 素材库
├── 🎫 邀请码管理
└── ⚙️ 系统配置（现有功能重构）
```

---

## 4. 功能详设

### 4.1 概览 Dashboard（默认页）

**目的**：一眼看清产品健康度

| 指标 | 数据来源 | 说明 |
|------|---------|------|
| 总用户数 | `users` count | 含注册时间趋势（7日/30日） |
| 活跃用户 | `assets` where created > 7d | 7天内生成过素材的用户 |
| 总素材数 | `assets` count | 含今日新增 |
| 今日生成量 | `assets` where today | 当日生成数 |
| 平均生成/用户 | 素材数/用户数 | 人均消费 |
| 配额使用率 | sum(quotaUsed)/sum(quotaTotal) | 整体消耗进度 |
| API 调用成功率 | 最近100次生成的成功/失败比 | 需新增日志表 |

**图表**（简单柱状图）：
- 最近7天每日生成量
- 最近7天每日新用户

---

### 4.2 用户管理

**列表字段**：

| 字段 | 来源 | 说明 |
|------|------|------|
| 邮箱 | users.email | 主键 |
| 姓名 | users.name | 可空 |
| 配额 | quotaTotal | 总量 |
| 已用 | quotaUsed | 已消耗 |
| 剩余 | quotaTotal - quotaUsed | 计算 |
| 邀请码 | inviteCode.code | 来源 |
| 素材数 | count(assets) | 关联 |
| 注册时间 | createdAt | 排序 |

**操作**：
- 🔍 搜索（按邮箱/姓名）
- ➕ 调整配额（手动增减 quotaTotal）
- 🚫 禁用/启用（新增 `disabled` 字段）
- 👁 查看详情（跳转用户素材列表）

---

### 4.3 素材库

**列表字段**：

| 字段 | 来源 | 说明 |
|------|------|------|
| 缩略图 | assets.imageUrl | 100px 预览 |
| 品牌 | assets.brandName | — |
| 平台 | assets.platform | — |
| 场景 | assets.sceneLabel | — |
| 尺寸 | assets.aspectRatio | — |
| 用户 | users.email | 关联 |
| 时间 | assets.createdAt | 倒序 |

**操作**：
- 🔍 搜索（品牌/用户邮箱）
- 🏷 筛选（平台/时间范围）
- 🗑 删除（从 Blob + DB 双删）
- 📥 下载原图

---

### 4.4 邀请码管理

**列表字段**：

| 字段 | 来源 | 说明 |
|------|------|------|
| 邀请码 | invite_codes.code | — |
| 配额 | invite_codes.quota | 分配张数 |
| 备注 | invite_codes.note | 给谁的 |
| 状态 | usedAt 是否为空 | 已用/未用 |
| 使用者 | users.email | 关联 |
| 创建时间 | createdAt | — |

**操作**：
- ➕ 批量生成（指定数量+配额+备注前缀）
- 🗑 删除未使用的码
- 📋 复制邀请码到剪贴板

---

### 4.5 系统配置（现有功能重构）

保持现有配置能力，改为 Tab 布局：

| Tab | 内容 |
|-----|------|
| 生图配置 | Provider选择 / Model / Key / Prompt模板 |
| 场景预设 | 场景列表CRUD / 营销目标 / 情绪 / 紧迫感 |
| 品牌设置 | 品牌名 / Tagline / 水印开关 |

---

## 5. 数据库变更

```sql
-- users 表新增字段
ALTER TABLE users ADD COLUMN "disabled" BOOLEAN NOT NULL DEFAULT false;

-- 新增操作日志表（用于统计成功率）
CREATE TABLE admin_logs (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT NOT NULL,        -- 'generate' | 'refine' | 'scrape' | 'register'
  userId      TEXT,                 -- 关联用户（可空）
  status      TEXT NOT NULL,        -- 'success' | 'error'
  error       TEXT,                 -- 错误信息
  provider    TEXT,                 -- 'novart' | 'minimax'
  duration    INT,                  -- 耗时(ms)
  "createdAt" TIMESTAMP DEFAULT now()
);
```

## 6. API 设计

### 新增接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/stats` | Dashboard 统计数据 |
| GET | `/api/admin/users` | 用户列表（分页+搜索） |
| PATCH | `/api/admin/users/[id]` | 更新用户（配额/禁用） |
| GET | `/api/admin/assets` | 素材列表（分页+筛选） |
| DELETE | `/api/admin/assets/[id]` | 删除素材 |
| GET | `/api/admin/invites` | 邀请码列表 |
| POST | `/api/admin/invites` | 批量生成邀请码 |
| DELETE | `/api/admin/invites/[id]` | 删除邀请码 |

所有 `/api/admin/*` 接口需要验证 `ADMIN_PASSWORD`（复用现有 admin verify 机制）。

## 7. UI 设计原则

- **Linear/Stripe 风格**：深色背景、克制边框、Tailwind class、不加 glow/blur/orb
- **侧边栏导航**：左侧固定 200px 侧栏，右侧内容区
- **表格**：简洁行式表格，hover 高亮，无多余装饰
- **操作反馈**：toast 提示（成功/失败），不弹 dialog

## 8. 优先级

| 优先级 | 功能 | 工时估计 |
|--------|------|---------|
| P0 | Dashboard 概览 | 2h |
| P0 | 用户管理（列表+配额调整） | 2h |
| P0 | 邀请码管理 | 1.5h |
| P1 | 素材库 | 2h |
| P1 | 操作日志（admin_logs） | 1h |
| P2 | 系统配置重构（Tab化） | 1.5h |

**MVP = P0（Dashboard + 用户管理 + 邀请码），约 5.5h**

## 9. 不做什么

- ❌ 不做角色权限（只有 admin 一种角色，密码验证）
- ❌ 不做实时推送/WS（刷新页面即可）
- ❌ 不做导出 Excel（MVP不需要）
- ❌ 不做用户端管理（用户看自己的素材在 /dashboard，不在 admin）
