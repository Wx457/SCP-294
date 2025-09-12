// api/getCup.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// 1. 初始化 Gemini AI 模型
// 它会自动从环境变量中读取我们刚才设置的 GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // 使用最新的 Flash 模型，速度快且强大

export default async function handler(req, res) {
  // 【新增】处理浏览器的 CORS 预检请求
  // Vercel 会自动处理一些 CORS 头，但明确处理 OPTIONS 请求是更稳健的做法
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // 或更严格地设为你的前端域名
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    // 直接返回 200 OK，表示允许接下来的 POST 请求
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  try {
    const userInput = req.body.prompt;
    if (!userInput) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // 2. 这是我们之前设计的“指令工程”(Prompt Engineering)
    // 我们在这里告诉 AI 它应该扮演什么角色，以及如何回应
    const prompt = `
      You are an researcher testing SCP-294, the Foundation's anomalous coffee machine and forming an internal documentation. Your task is to generate a test log entry for a new beverage request.
      
      Follow these rules strictly:
      1. Tone: must be clinical, scientific, and detached, mirroring the official SCP Foundation writing style. Use metric units (e.g., ml, °C). Refer to the person drinking as "Subject".
      2. Interpretation: The machine (SCP-294) demonstrates a form of intelligence. It can be extremely literal, metaphorical, or witty in its interpretation of the 'key'. For humorous, abstract, or ironic keys, the result should reflect this in a dry, clinical report.
      3. Use redactions (e.g., █████ or [REDACTED]) for sensitive or mysterious details.
      4. If the user's request is for a substance that cannot exist as a liquid (e.g., "diamonds", "wood", "rage"), you MUST respond with the single word: OUT_OF_RANGE.
      5. Optional Notes: A concluding research note is optional. If included, it must be a single, brief sentence.
      6. The final output MUST follow this exact template and be UNDER 800 words:

        Requestor: Dr. ██████
        Timestamp: "[current local time]"
        key: "[USER_INPUT]"

        Description:
        (Start with "SCP-294 produced...", "The device dispensed...", etc. Then describe objective details of liquid, subjective effects of what you felt, and the cup image)
        (Cup image is optional, describe only when the objective and subjective information are not enough to convey the 'key')

        Observed Anomalies:
        (Summarize the anomalous properties in one sentence. If no anomalies were observed, state 'None detected'.)

        Ingredient Analysis:
        (Describe the chemical components. Use terms like "Unidentified complex polymers", "Trace elements of [REDACTED]", or "Composition remains unknown.")

      Here is the data for the current request:
      - User's Raw Input: "${userInput}"

      Generate the test log entry now.
    `;

    // 3. 调用 AI 模型，并等待它生成内容
    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiText = response.text();

    // 4. 将 AI 真实生成的文本返回给前端
    res.status(200).json({ description: aiText });

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).json({ error: 'Failed to get response from AI.' });
  }
}