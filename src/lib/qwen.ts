import OpenAI from "openai";

export async function qwenVision(
  imageUrl: string,
  prompt: string,
  apiKey: string,
  model: string = "qwen/qwen2.5-vl-72b-instruct"
): Promise<string> {
  // Unset proxy to avoid regional blocks
  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const b64 = imageUrl.startsWith("data:")
    ? imageUrl.split(",")[1]
    : imageUrl;

  const resp = await client.chat.completions.create({
    model: model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: b64.startsWith("http")
                ? imageUrl
                : `data:image/jpeg;base64,${b64}`,
            },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
    max_tokens: 512,
  });

  return resp.choices[0].message.content || "";
}
