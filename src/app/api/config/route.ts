import { NextRequest, NextResponse } from "next/server";
import { readAppConfig, writeAppConfig, DEFAULT_PROMPT_WITH_REF, DEFAULT_PROMPT_NO_REF, DEFAULT_REFINE_PROMPT, DEFAULT_SCENES, DEFAULT_MARKETING_GOALS, DEFAULT_MOODS, DEFAULT_URGENCIES } from "@/lib/app-config";

// GET: 返回服务端配置（不暴露 key 明文）
export async function GET() {
  const config = await readAppConfig();
  return NextResponse.json({
    configured: {
      openrouter: !!config.openrouter?.apiKey,
      minimax: !!config.minimax?.apiKey,
      openai: !!config.openai?.apiKey,
    },
    models: {
      visionModel: config.openrouter?.visionModel || "qwen/qwen2.5-vl-72b-instruct",
      copyModel: config.openrouter?.copyModel || "openai/gpt-4o",
      imageModel: config.minimax?.imageModel || "image-01",
      visionTemp: config.openrouter?.visionTemp ?? 0.7,
      copyTemp: config.openrouter?.copyTemp ?? 0.8,
      visionMaxTokens: config.openrouter?.visionMaxTokens ?? 2048,
      copyMaxTokens: config.openrouter?.copyMaxTokens ?? 1024,
    },
    image: {
      aspectRatio: config.image?.aspectRatio || "1:1",
      quality: config.image?.quality || "medium",
      style: config.image?.style || "auto",
    },
    prompts: {
      visionTemplate: config.prompts?.visionTemplate || "",
      copyTemplate: config.prompts?.copyTemplate || "",
    },
    output: {
      language: config.output?.language || "zh",
      variations: config.output?.variations || 1,
    },
    features: {
      enableLogoWatermark: config.features?.enableLogoWatermark ?? false,
      enableAutoRetry: config.features?.enableAutoRetry ?? true,
      enableMultiFormat: config.features?.enableMultiFormat ?? false,
    },
    branding: {
      brandName: config.branding?.brandName || "100x",
      brandTagline: config.branding?.brandTagline || "AI灵感创作平台",
    },
    adforge: {
      apiKey: !!config.openai?.apiKey,
      baseUrl: config.openai?.baseUrl || "https://api.openai.com/v1",
      model: config.openai?.imageModel || "gpt-image-2",
    },
    adforge100x: {
      imageProvider: config.adforge100x?.imageProvider || "minimax",
      novartConfigured: !!config.adforge100x?.novartKey,
      novartBaseUrl: config.adforge100x?.novartBaseUrl || "https://www.novartspace.art",
      novartModel: config.adforge100x?.novartModel || "nova-image-2",
      minimaxModel: config.adforge100x?.minimaxModel || "image-01",
      promptTemplate: config.adforge100x?.promptTemplate || DEFAULT_PROMPT_WITH_REF,
      promptTemplateNoRef: config.adforge100x?.promptTemplateNoRef || DEFAULT_PROMPT_NO_REF,
      refinePromptTemplate: config.adforge100x?.refinePromptTemplate || DEFAULT_REFINE_PROMPT,
      scenes: config.adforge100x?.scenes && config.adforge100x.scenes.length > 0 ? config.adforge100x.scenes : DEFAULT_SCENES,
      marketingGoals: config.adforge100x?.marketingGoals && config.adforge100x.marketingGoals.length > 0 ? config.adforge100x.marketingGoals : DEFAULT_MARKETING_GOALS,
      moods: config.adforge100x?.moods && config.adforge100x.moods.length > 0 ? config.adforge100x.moods : DEFAULT_MOODS,
      urgencies: config.adforge100x?.urgencies && config.adforge100x.urgencies.length > 0 ? config.adforge100x.urgencies : DEFAULT_URGENCIES,
    },
    agentRuntime: config.agentRuntime || undefined,
    quotas: config.quotas || undefined,
    pricing: config.pricing || undefined,
    updatedAt: config.updatedAt,
  });
}

function verifyAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
  if (!ADMIN_PASSWORD) return false;
  // Support both Bearer token and cookie-based admin auth
  if (auth === `Bearer ${ADMIN_PASSWORD}`) return true;
  const cookie = req.cookies.get("admin_token")?.value;
  return cookie === ADMIN_PASSWORD;
}

export async function PUT(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const existing = await readAppConfig();

    const updated = {
      ...existing,
      openrouter: {
        ...existing.openrouter,
        apiKey: body.openrouterKey?.trim() || existing.openrouter?.apiKey || "",
        enabled: body.openrouterEnabled ?? true,
        visionModel: body.visionModel || existing.openrouter?.visionModel || "qwen/qwen2.5-vl-72b-instruct",
        copyModel: body.copyModel || existing.openrouter?.copyModel || "openai/gpt-4o",
        visionTemp: body.visionTemp ?? existing.openrouter?.visionTemp ?? 0.7,
        copyTemp: body.copyTemp ?? existing.openrouter?.copyTemp ?? 0.8,
        visionMaxTokens: body.visionMaxTokens ?? existing.openrouter?.visionMaxTokens ?? 2048,
        copyMaxTokens: body.copyMaxTokens ?? existing.openrouter?.copyMaxTokens ?? 1024,
      },
      minimax: {
        ...existing.minimax,
        apiKey: body.minimaxKey?.trim() || existing.minimax?.apiKey || "",
        enabled: body.minimaxEnabled ?? true,
        imageModel: body.imageModel || existing.minimax?.imageModel || "image-01",
      },
      image: {
        aspectRatio: body.imageAspectRatio || existing.image?.aspectRatio || "1:1",
        quality: body.imageQuality || existing.image?.quality || "medium",
        style: body.imageStyle || existing.image?.style || "auto",
      },
      prompts: {
        visionTemplate: body.visionPromptTemplate || existing.prompts?.visionTemplate || "",
        copyTemplate: body.copyPromptTemplate || existing.prompts?.copyTemplate || "",
      },
      output: {
        language: body.outputLanguage || existing.output?.language || "zh",
        variations: body.outputVariations ?? existing.output?.variations ?? 1,
      },
      features: {
        enableLogoWatermark: body.enableLogoWatermark ?? existing.features?.enableLogoWatermark ?? false,
        enableAutoRetry: body.enableAutoRetry ?? existing.features?.enableAutoRetry ?? true,
        enableMultiFormat: body.enableMultiFormat ?? existing.features?.enableMultiFormat ?? false,
      },
      openai: {
        ...existing.openai,
        apiKey: body.openaiKey?.trim() || existing.openai?.apiKey || "",
        baseUrl: body.openaiBaseUrl?.trim() || existing.openai?.baseUrl || "https://api.openai.com/v1",
        imageModel: body.openaiImageModel || existing.openai?.imageModel || "gpt-image-2",
      },
      branding: {
        brandName: body.brandName || existing.branding?.brandName || "100x",
        brandTagline: body.brandTagline || existing.branding?.brandTagline || "AI灵感创作平台",
      },
      adforge100x: {
        ...existing.adforge100x,
        imageProvider: body.adforge100x_imageProvider || existing.adforge100x?.imageProvider || "minimax",
        novartKey: body.adforge100x_novartKey?.trim() || existing.adforge100x?.novartKey || "",
        novartBaseUrl: body.adforge100x_novartBaseUrl?.trim() || existing.adforge100x?.novartBaseUrl || "https://www.novartspace.art",
        novartModel: body.adforge100x_novartModel || existing.adforge100x?.novartModel || "nova-image-2",
        minimaxModel: body.adforge100x_minimaxModel || existing.adforge100x?.minimaxModel || "image-01",
        promptTemplate: typeof body.adforge100x_promptTemplate === "string" ? body.adforge100x_promptTemplate : (existing.adforge100x?.promptTemplate ?? ""),
        promptTemplateNoRef: typeof body.adforge100x_promptTemplateNoRef === "string" ? body.adforge100x_promptTemplateNoRef : (existing.adforge100x?.promptTemplateNoRef ?? ""),
        refinePromptTemplate: typeof body.adforge100x_refinePromptTemplate === "string" ? body.adforge100x_refinePromptTemplate : (existing.adforge100x?.refinePromptTemplate ?? ""),
        scenes: Array.isArray(body.adforge100x_scenes) ? body.adforge100x_scenes : (existing.adforge100x?.scenes || []),
        marketingGoals: Array.isArray(body.adforge100x_marketingGoals) ? body.adforge100x_marketingGoals : (existing.adforge100x?.marketingGoals || []),
        moods: Array.isArray(body.adforge100x_moods) ? body.adforge100x_moods : (existing.adforge100x?.moods || []),
        urgencies: Array.isArray(body.adforge100x_urgencies) ? body.adforge100x_urgencies : (existing.adforge100x?.urgencies || []),
      },
      quotas: body.quotas || existing.quotas || undefined,
      pricing: body.pricing || existing.pricing || undefined,
      updatedAt: new Date().toISOString(),
      updatedBy: "admin",
    };

    await writeAppConfig(updated);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[config PUT] error", err);
    return NextResponse.json({ error: "更新失败: " + (err?.message || "unknown") }, { status: 500 });
  }
}
