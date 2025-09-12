// api/getCup.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  let dbConnection;
  let aiText;
  const maxAttempts = 3;

  try {
    // 初始化 AI 模型
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    // AI 调用部分，包含重试逻辑
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      try {
        const aiPrompt = `
                    You are an researcher testing SCP-294, the Foundation's anomalous coffee machine and forming an internal documentation. Your task is to generate a test log entry for a new beverage request.
          
          Follow these rules strictly:
          1. Tone: must be clinical, scientific, and detached, mirroring the official SCP Foundation writing style. Use metric units (e.g., ml, °C). Refer to the person drinking as "Subject".
          2. Interpretation: The machine (SCP-294) demonstrates a form of intelligence. It can be extremely literal, metaphorical, or witty in its interpretation of the 'key'. For humorous, abstract, or ironic keys, the result should reflect this in a dry, clinical report.
          3. If the user's request is for a substance that cannot exist as a liquid (e.g., "diamonds", "wood", "rage"), you MUST respond with the single word: OUT_OF_RANGE.
          4. Optional Notes: A concluding research note is optional. If included, it must be a single, brief sentence.
          5. The final output MUST follow this exact template and be UNDER 800 words:

            Requestor: Dr. ██████
            Timestamp: current local time in "YYYY-MM-DD" format
            key: "[USER_INPUT]"

            Description:
            (Start with "SCP-294 produced...", "The device dispensed...", etc. Then describe objective details of liquid, subjective effects of what you felt, and the cup image)
            (Cup image is optional, describe only when the objective and subjective information are not enough to convey the 'key')

            Observed Anomalies:
            (Summarize the anomalous properties in one sentence. If no anomalies were observed, state 'None detected'.)

            Ingredient Analysis:
            (Describe the chemical components with terminology. Use terms like "Unidentified complex polymers", "Trace elements of [REDACTED]", or "Composition remains unknown.")

          Here is the data for the current request:
          - User's Raw Input: "${prompt}"

          6. Use >= 3 redactions (e.g., █████ or [REDACTED]) to randomly replace several detailed information (like name, number or terminology).
          Generate the test log entry now.
        `;
        const result = await model.generateContent(aiPrompt);
        aiText = result.response.text();
        break; // 如果成功，跳出循环
      } catch (error) {
        // 如果是 503 错误，等待 2 秒后重试
        if (error.status === 503) {
          console.error(`AI服务暂时过载，第 ${attempts + 1} 次重试...`);
          await new Promise(resolve => setTimeout(resolve, 2500));
        } else {
          // 如果是其他错误，直接抛出
          throw error;
        }
      }
    }

    // 检查 AI 是否返回了 "OUT_OF_RANGE"
    if (aiText && aiText.trim() === 'OUT_OF_RANGE') {
      return res.status(400).json({ error: 'Failed to create a liquid from the requested substance.' });
    }

    // 如果多次重试后仍未成功，或者AI返回了空值
    if (!aiText) {
      return res.status(500).json({ message: 'Failed to get a valid response from AI after multiple attempts.' });
    }

    // 初始化数据库客户端
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);

    // 3. 连接数据库并写入文档
    dbConnection = await client.connect();
    const database = dbConnection.db('scp294');
    const collection = database.collection('test_logs');
    
    // 构造要存入数据库的文档
    const newLog = {
      requestor: 'Dr. ██████',
      timestamp: new Date(),
      input_key: prompt,
      document_text: aiText,
    };
    
    await collection.insertOne(newLog);

    // 4. 将 AI 的回复返回给前端
    return res.status(200).json({ description: aiText });
    
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  } finally {
    if (dbConnection) {
      await dbConnection.close();
    }
  }
}