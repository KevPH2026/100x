import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { auth } from "@/auth";
import { deductQuota, getUserQuotas } from "@/lib/notion";

// ── Config ──────────────────────────────────────────────────────────────────
const CONFIG_FILE = path.join(process.cwd(), "config", "models.json");

interface Skill {
  id: string;
  name: string;
  description: string;
  models: ("vision" | "copy" | "image")[];
  enabled: boolean;
  freeQuotaUser: number;
}

interface Pricing {
  perTurnPrice: number;
  freeUserTurns: number;
  modelPriceMultiplier: Record<string, number>;
  imageGenerationPrice: number;
  minCharge: number;
  maxSessionCharge: number;
}

interface ServerConfig {
  skills: Skill[];
  pricing: Pricing;
  openrouter: {
    apiKey: string;
    visionModel: string;
    copyModel: string;
  };
  minimax: {
    apiKey: string;
    imageModel: string;
  };
}

function getDefaultConfig(): ServerConfig {
  return {
    skills: [
      { id: "visual_analysis", name: "视觉分析", description: "上传图片，AI 分析画面内容与适用场景", models: ["vision"], enabled: true, freeQuotaUser: 5 },
      { id: "copy_generation", name: "文案生成", description: "基于图片生成配套营销文案", models: ["copy"], enabled: true, freeQuotaUser: 5 },
      { id: "image_generation", name: "图片生成", description: "根据文案生成配套图片", models: ["image"], enabled: true, freeQuotaUser: 2 },
      { id: "full_pipeline", name: "完整工作流", description: "图片→分析→文案→配套图片，一站式生成", models: ["vision", "copy", "image"], enabled: true, freeQuotaUser: 3 },
    ],
    pricing: {
      perTurnPrice: 0.5,
      freeUserTurns: 5,
      modelPriceMultiplier: { "qwen/qwen2.5-vl-72b-instruct": 1.0, "openai/gpt-4o": 1.5, "claude-sonnet-4": 1.2, "image-01": 1.0 },
      imageGenerationPrice: 1.0,
      minCharge: 0.5,
      maxSessionCharge: 50,
    },
    openrouter: { apiKey: process.env.OPENROUTER_API_KEY || "", visionModel: "qwen/qwen2.5-vl-72b-instruct", copyModel: "deepseek/deepseek-chat-v3-0324" },
    minimax: { apiKey: process.env.MINIMAX_API_KEY || "", imageModel: "image-01" },
  };
}

function resolveConfig(): ServerConfig {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, "utf-8");
    const file = JSON.parse(raw);
    const defaults = getDefaultConfig();
    return {
      skills: file.skills || defaults.skills,
      pricing: { ...defaults.pricing, ...(file.pricing || {}) },
      openrouter: {
        apiKey: process.env.OPENROUTER_API_KEY || file.openrouter?.apiKey || defaults.openrouter.apiKey,
        visionModel: file.openrouter?.visionModel || defaults.openrouter.visionModel,
        copyModel: file.openrouter?.copyModel || defaults.openrouter.copyModel,
      },
      minimax: {
        apiKey: process.env.MINIMAX_API_KEY || file.minimax?.apiKey || defaults.minimax.apiKey,
        imageModel: file.minimax?.imageModel || defaults.minimax.imageModel,
      },
    };
  } catch {
    return getDefaultConfig();
  }
}

// ── In-memory session store ─────────────────────────────────────────────────
const sessions = new Map<string, { userId: string; skillId: string; turns: number; charge: number }>();

function calcTurnCost(skill: Skill, modelIds: string[], pricing: Pricing, hasImages: boolean): number {
  let cost = pricing.perTurnPrice;
  for (const m of modelIds) {
    cost *= (pricing.modelPriceMultiplier[m] || 1.0);
  }
  if (hasImages) cost += pricing.imageGenerationPrice;
  return Math.min(Math.max(cost, pricing.minCharge), pricing.maxSessionCharge);
}

// ── GET: list skills + pricing (for dashboard) ─────────────────────────────
export async function GET() {
  const cfg = resolveConfig();
  return NextResponse.json({ skills: cfg.skills, pricing: cfg.pricing });
}

// ── POST: unified generate ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ── Auto-detect auth ────────────────────────────────────────────────
    let session: any = null;
    let isAnonymous = true;
    try {
      session = await auth();
      if (session?.user?.id && session?.user?.email) {
        isAnonymous = false;
      }
    } catch {
      // No auth session → anonymous mode
    }

    const userId = session?.user?.id || null;
    const email = session?.user?.email || null;

    // ── Parse request body ──────────────────────────────────────────────
    // Wizard-style fields (anonymous / wizard)
    const {
      materials,
      scene,
      styleTags,
      audiences,
      goal,
      userOpenRouterKey,
      userMiniMaxKey,
      visionModel,
      copyModel,
      imageModel,
      refinementInstruction,
      previousCopy,
    } = body;

    // Dashboard-style fields (logged-in / skill-based)
    const {
      skillId,
      sessionId: existingSessionId,
      message,
      imageUrl,
      regenerate,
    } = body;

    // ── Resolve config & keys ───────────────────────────────────────────
    const cfg = resolveConfig();

    // Strip surrounding quotes that Vercel env add may introduce
    const stripQuotes = (v?: string) => {
      if (!v) return v;
      const t = v.trim();
      if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
      return t;
    };

    // Key resolution priority: user-provided > env vars > config/models.json
    const effectiveOpenRouterKey =
      stripQuotes(userOpenRouterKey) ||
      stripQuotes(cfg.openrouter.apiKey) ||
      process.env.OPENROUTER_API_KEY?.trim()?.replace(/^["']|["']$/g, "");

    const effectiveMiniMaxKey =
      stripQuotes(userMiniMaxKey) ||
      stripQuotes(cfg.minimax.apiKey);

    // ── Validate keys ───────────────────────────────────────────────────
    if (!effectiveOpenRouterKey) {
      const envVal = process.env.OPENROUTER_API_KEY;
      return NextResponse.json({
        error: "未配置 OpenRouter API Key",
        debug: {
          envSet: !!envVal,
          envLen: envVal?.length,
          envFirst4: envVal?.slice(0,4),
          envLast4: envVal?.slice(-4),
          cfgSet: !!cfg.openrouter.apiKey,
          cfgLen: cfg.openrouter.apiKey?.length,
          cfgFirst4: cfg.openrouter.apiKey?.slice(0,4),
        },
        needKey: "openrouter",
      }, { status: 400 });
    }
    if (!effectiveMiniMaxKey) {
      return NextResponse.json(
        { error: "未配置 MiniMax API Key。请在设置中填入，或联系管理员开启服务端预设。", needKey: "minimax" },
        { status: 400 }
      );
    }

    // ── Resolve models ──────────────────────────────────────────────────
    const effectiveVisionModel = visionModel || cfg.openrouter.visionModel;
    const effectiveCopyModel = copyModel || cfg.openrouter.copyModel;
    const effectiveImageModel = imageModel || cfg.minimax.imageModel;

    // ── Determine mode: skill-based (dashboard) vs wizard-based ─────────
    const isSkillMode = !!skillId;
    let skill: Skill | null = null;
    if (isSkillMode) {
      skill = cfg.skills.find((s: Skill) => s.id === skillId) || null;
      if (!skill || !skill.enabled) {
        return NextResponse.json({ error: "Skill 不存在或已禁用" }, { status: 404 });
      }
    }

    // ── Session management (for logged-in skill mode) ───────────────────
    let sessId: string | null = null;
    let sess: { userId: string; skillId: string; turns: number; charge: number } | null = null;
    if (isSkillMode && !isAnonymous && userId) {
      if (existingSessionId && sessions.has(existingSessionId)) {
        sess = sessions.get(existingSessionId)!;
        if (sess.userId !== userId) {
          return NextResponse.json({ error: "会话不存在" }, { status: 404 });
        }
        sessId = existingSessionId;
      } else {
        sessId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        sess = { userId, skillId, turns: 0, charge: 0 };
        sessions.set(sessId, sess);
      }
    }

    // ── Quota check (logged-in only) ────────────────────────────────────
    let isFreeTurn = true;
    let quotasRemaining = 0;
    let quotaUsed = 0;
    if (!isAnonymous && email) {
      const quota = await getUserQuotas(email);
      const totalFree = skill?.freeQuotaUser || cfg.pricing.freeUserTurns;
      quotaUsed = quota?.turnsUsed || 0;
      quotasRemaining = quota?.quotasRemaining ?? totalFree;
      isFreeTurn = quotaUsed < totalFree;

      if (!isFreeTurn && quotasRemaining <= 0) {
        return NextResponse.json({ error: "免费额度已用完，请充值或使用自己的 API Key" }, { status: 403 });
      }
    }

    // ── Common helper: OpenRouter headers ───────────────────────────────
    const openRouterHeaders = {
      Authorization: `Bearer ${effectiveOpenRouterKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://idealab.now",
      "X-Title": "IdeaLab",
    };

    // ══════════════════════════════════════════════════════════════════════
    // WIZARD MODE (anonymous or wizard-style request)
    // ══════════════════════════════════════════════════════════════════════
    if (!isSkillMode) {
      // ── Parse materials ─────────────────────────────────────────────────
      let materialSummary = "";
      for (const mat of materials || []) {
        if (mat.type === "file" && mat.preview) {
          // Check file extension
          const ext = mat.name?.split(".").pop()?.toLowerCase();
          if (ext === "pdf" && mat.content) {
            // PDF: content field contains base64 data
            try {
              const { extractPdfText } = await import("@/lib/fileParser");
              const buffer = Buffer.from(mat.content, "base64");
              const pdfText = await extractPdfText(buffer);
              materialSummary += pdfText
                ? `\n[PDF] ${mat.name}: ${pdfText}`
                : `\n[PDF] ${mat.name}（无法提取文本）`;
            } catch {
              materialSummary += `\n[PDF] ${mat.name}`;
            }
          } else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext || "")) {
            const { getUnsupportedFileMessage } = await import("@/lib/fileParser");
            materialSummary += `\n${getUnsupportedFileMessage(mat.name)}`;
          } else {
            // Image: use vision model
            try {
              const { qwenVision } = await import("@/lib/qwen");
              const desc = await qwenVision(
                mat.preview,
                `提取这张图片中的所有文字和产品信息，保持关键数据原文。风格：简洁专业。`,
                effectiveOpenRouterKey,
                effectiveVisionModel
              );
              materialSummary += `\n[图片] ${mat.name}: ${desc}`;
            } catch (err) {
              console.error("Vision parse error:", err);
              materialSummary += `\n[文件] ${mat.name}`;
            }
          }
        } else if (mat.type === "link") {
          try {
            const { extractWebContent } = await import("@/lib/scraper");
            const webContent = await extractWebContent(mat.content);
            materialSummary += webContent
              ? `\n[链接内容] ${mat.content}\n${webContent}`
              : `\n[链接] ${mat.content}`;
          } catch {
            materialSummary += `\n[链接] ${mat.content}`;
          }
        } else {
          materialSummary += `\n[文字] ${mat.content}`;
        }
      }

      // ── Build copy prompt ───────────────────────────────────────────────
      const audienceLabel = audiences?.join(", ") || "普通用户";
      const goalLabel = goal || "推广品牌";
      const sceneLabel = scene?.label || scene || "营销推广";
      const sceneWidth = scene?.width || 1080;
      const sceneHeight = scene?.height || 1080;

      // Build refinement context if user is iterating
      const refinementContext = refinementInstruction
        ? `\n\n上一版文案：\n${JSON.stringify(previousCopy || [], null, 2)}\n\n用户调整要求：${refinementInstruction}\n请根据用户要求在上一版基础上改进。`
        : "";

      const copyPrompt = `你是顶级营销文案专家。根据以下素材信息，为"${audienceLabel}"生成3条营销文案。${refinementContext}

素材信息：${materialSummary || "无素材"}
使用场景：${sceneLabel}
目标受众：${audienceLabel}
推广目的：${goalLabel}
风格标签：${styleTags?.join(", ") || "现代简约"}

要求：
- 生成3条不同角度的文案
- 每条包含：主标题（10字内）、副标题（20字内）、正文（30-80字）、行动号召
- 文案要有冲击力，符合新媒体传播特点
- 行动号召要具体有力
- 直接返回JSON数组格式，不要其他内容

格式：
[
  {
    "headline": "主标题",
    "subheadline": "副标题",
    "body": "正文内容",
    "cta": "行动号召"
  }
]`;

      // ── Generate copy ───────────────────────────────────────────────────
      const copyRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: openRouterHeaders,
        body: JSON.stringify({
          model: effectiveCopyModel,
          messages: [{ role: "user", content: copyPrompt }],
          max_tokens: 2000,
        }),
      });

      if (!copyRes.ok) {
        const errText = await copyRes.text();
        console.error("OpenRouter error:", errText);
        return NextResponse.json({ error: `文案生成失败: ${errText.slice(0, 200)}` }, { status: 502 });
      }

      const copyData = await copyRes.json();
      let copyOptions: any[] = [];
      try {
        const raw = copyData.choices?.[0]?.message?.content || "[]";
        const jsonMatch = raw.match(/\[[\s\S]*\]/);
        copyOptions = JSON.parse(jsonMatch ? jsonMatch[0] : "[]");
      } catch {
        copyOptions = [];
      }

      if (copyOptions.length === 0) {
        copyOptions = [
          {
            headline: "灵感触手可及",
            subheadline: "AI 帮你把想法变成现实",
            body: "输入素材，选择场景，AI 自动生成高质量营销文案和配套设计稿。",
            cta: "立即开始创作",
          },
        ];
      }

      // ── Generate image (1 design, single call to fit Vercel Hobby timeout) ──
      const designs: any[] = [];
      const selectedCopy = copyOptions[0] || {};

      try {
        const designPrompt = `Professional marketing poster design for ${sceneLabel}.
Size: ${sceneWidth}x${sceneHeight}px (${scene?.ratio || "1:1"}).
Style: ${styleTags?.join(", ") || "modern, tech, premium"}.
Main headline: ${selectedCopy.headline || "IdeaLab"}
Subtext: ${selectedCopy.subheadline || "AI 驱动的创意内容平台"}
Body text: ${selectedCopy.body || "用 AI 释放创意生产力"}
Call to action: ${selectedCopy.cta || "开始免费使用"}
Target audience: ${audienceLabel}

Color palette: Deep purple (#6B21A8) to indigo (#4F46E5) gradient, with electric blue (#38BDF8) accents.
Design style: Modern, sleek, premium AI SaaS aesthetic. Glassmorphism elements. Neon glow effects.
Make it visually striking and professional marketing material.`;

        const imgRes = await fetch("https://api.minimax.chat/v1/image_generation", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${effectiveMiniMaxKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: effectiveImageModel,
            prompt: designPrompt,
            aspect_ratio: scene?.ratio || "1:1",
          }),
        });

        if (!imgRes.ok) {
          console.error("MiniMax error:", await imgRes.text());
        } else {
          const imgData = await imgRes.json();
          if (imgData.data?.image_urls?.[0]) {
            designs.push({
              id: `design_0_${Date.now()}`,
              imageUrl: imgData.data.image_urls[0],
            });
          }
        }
      } catch (err) {
        console.error("Image gen error:", err);
      }

      if (designs.length === 0) {
        designs.push({
          id: "placeholder_1",
          imageUrl: "",
          placeholder: true,
          label: `${sceneLabel} - ${selectedCopy.headline || "IdeaLab"}`,
        });
      }

      return NextResponse.json({
        copyOptions: copyOptions.map((c: any, i: number) => ({
          ...c,
          id: `copy_${i}_${Date.now()}`,
        })),
        designs,
      });
    }

    // ══════════════════════════════════════════════════════════════════════
    // SKILL MODE (dashboard, logged-in user)
    // ══════════════════════════════════════════════════════════════════════
    if (!skill) {
      return NextResponse.json({ error: "Skill 未找到" }, { status: 404 });
    }

    let visionResult = "";
    let copyResult = "";
    let imageUrls: string[] = [];

    // ── Vision analysis ─────────────────────────────────────────────────
    if (skill.models.includes("vision") && imageUrl) {
      const vr = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: openRouterHeaders,
        body: JSON.stringify({
          model: effectiveVisionModel,
          messages: [
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: imageUrl } },
                { type: "text", text: "分析这张图片：识别主体、场景、风格、构图、色彩、适用行业/平台，给出结构化分析。" },
              ],
            },
          ],
          max_tokens: 2048,
          temperature: 0.7,
        }),
      });
      if (!vr.ok) {
        return NextResponse.json({ error: `视觉分析失败: ${await vr.text()}` }, { status: 500 });
      }
      const vd = await vr.json();
      visionResult = vd.choices?.[0]?.message?.content || "";
    }

    // ── Copy generation ─────────────────────────────────────────────────
    if (skill.models.includes("copy")) {
      const cr = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: openRouterHeaders,
        body: JSON.stringify({
          model: effectiveCopyModel,
          messages: [
            {
              role: "user",
              content: `你是营销文案专家。用户反馈："${message || "无"}"\n视觉参考：${visionResult || "无"}\n要求：接地气、有感染力、能引发共鸣，可有反转。直接输出3个不同角度文案，用---分隔。`,
            },
          ],
          max_tokens: 1024,
          temperature: 0.8,
        }),
      });
      if (!cr.ok) {
        return NextResponse.json({ error: `文案生成失败: ${await cr.text()}` }, { status: 500 });
      }
      const cd = await cr.json();
      copyResult = cd.choices?.[0]?.message?.content || "";
    }

    // ── Image generation ────────────────────────────────────────────────
    if (skill.models.includes("image") && (regenerate || skill.models.length === 1)) {
      const ir = await fetch("https://api.minimax.chat/v1/image_generation", {
        method: "POST",
        headers: { Authorization: `Bearer ${effectiveMiniMaxKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: effectiveImageModel,
          prompt: message || copyResult || "创意营销图片",
          aspect_ratio: "1:1",
          response_format: "url",
        }),
      });
      if (ir.ok) {
        const id = await ir.json();
        const taskId = id.data?.task_id;
        if (taskId) {
          for (let i = 0; i < 20; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const poll = await fetch(
              `https://api.minimax.chat/v1/image_generation/retrieve?task_id=${taskId}`,
              { headers: { Authorization: `Bearer ${effectiveMiniMaxKey}` } }
            );
            const pd = await poll.json();
            if (pd.data?.image_urls?.length > 0) {
              imageUrls = pd.data.image_urls;
              break;
            }
          }
        }
      }
    }

    // ── Calculate cost & update session ─────────────────────────────────
    const modelIds = (skill.models as string[]).map((m) =>
      m === "vision" ? effectiveVisionModel : m === "copy" ? effectiveCopyModel : effectiveImageModel
    );
    const cost = isFreeTurn ? 0 : calcTurnCost(skill, modelIds, cfg.pricing, imageUrls.length > 0);

    if (sess) {
      sess.turns += 1;
      sess.charge += cost;
    }

    // ── Deduct quota for logged-in users ────────────────────────────────
    if (!isAnonymous && isFreeTurn && email) {
      await deductQuota(email);
    }

    return NextResponse.json({
      copyOptions: [],
      designs: [],
      sessionId: sessId,
      turnNumber: sess?.turns || 1,
      result: { vision: visionResult, copy: copyResult, images: imageUrls },
      cost,
      isFreeTurn,
      quotasRemaining: isFreeTurn ? Math.max(0, quotasRemaining - 1) : quotasRemaining,
      quotaInfo: isAnonymous
        ? undefined
        : { remaining: isFreeTurn ? Math.max(0, quotasRemaining - 1) : quotasRemaining, used: quotaUsed + (isFreeTurn ? 1 : 0) },
    });
  } catch (err: any) {
    console.error("Generate error:", err);
    return NextResponse.json({ error: err.message || "生成失败，请重试" }, { status: 500 });
  }
}
