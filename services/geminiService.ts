
import { GoogleGenAI, Type } from "@google/genai";
import { AIScoreResponse } from "../types";

/**
 * Resizes a base64 or blob image to a smaller size to reduce API payload.
 * High-res official artwork and high-DPI canvas drawings can exceed limits.
 */
const resizeImage = (dataUrl: string, maxDim: number = 512): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Draw with white background to ensure transparency doesn't cause issues
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get compressed JPEG to further reduce size
      resolve(canvas.toDataURL('image/jpeg', 0.8).split(',')[1]);
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const getAIScore = async (
  pokemonName: string,
  officialImageUrl: string,
  userDrawingDataUrl: string
): Promise<AIScoreResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  try {
    // 1. Fetch official image
    const offRes = await fetch(officialImageUrl);
    if (!offRes.ok) throw new Error("Failed to fetch official image");
    const offBlob = await offRes.blob();
    const offDataUrl = await blobToDataURL(offBlob);

    // 2. Resize both images to keep payload small and avoid 500/large payload errors
    const [resizedOffBase64, resizedUserBase64] = await Promise.all([
      resizeImage(offDataUrl, 512),
      resizeImage(userDrawingDataUrl, 512)
    ]);

    const systemInstruction = `你是一位毒舌但又富有幽默感的宝可梦艺术评论家。
用户尝试凭记忆画出名为'${pokemonName}'的宝可梦。
你将看到两张图：
1. 官方参考图
2. 用户凭记忆手绘的作品

你的任务：
1. 比较两张图的构图、特征、神态。
2. 给出 0 到 100 的评分（分值越高代表越接近官方形象）。
3. 用一两句极其简短、有梗且幽默的中文进行点评（例如评价其为“毕加索再世”或“这画的是克苏鲁吗？”）。

输出必须是严格的 JSON 格式。`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        {
          parts: [
            { text: "官方参考图：" },
            { inlineData: { mimeType: 'image/jpeg', data: resizedOffBase64 } },
            { text: "用户作品：" },
            { inlineData: { mimeType: 'image/jpeg', data: resizedUserBase64 } },
            { text: "请基于以上对比给出评分和简短点评。输出 JSON 格式。" }
          ]
        }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "相似度评分 0-100" },
            comment: { type: Type.STRING, description: "中文简短幽默点评" }
          },
          required: ["score", "comment"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    const result = JSON.parse(text);
    return result as AIScoreResponse;
  } catch (e: any) {
    console.error("Gemini API Error Details:", e);
    // Return a fallback so the user can still see the result screen
    return { 
      score: Math.floor(Math.random() * 40) + 10, 
      comment: "AI 被你的画作震撼得说不出话来（其实是网络连接超时了），我给你个友情分吧！" 
    };
  }
};
