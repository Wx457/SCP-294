// api/getCup.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

/** -------- utils -------- */
function setCORS(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function ymdNow(timeZone = "America/New_York") {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function sanitizeName(name) {
  const s = (name ?? "").toString().trim();
  if (!s) return "";
  const ok = /^[\p{L}\p{M}\p{N}\s.'-]{1,80}$/u.test(s);
  return ok ? s : "";
}

function sanitizeKey(s) {
  const x = (s ?? "").toString().trim();
  if (!x) return "";
  return x.length > 50 ? x.slice(0, 50) : x;
}

function jsonInline(str = "") {
  // Deal with inline text enclosed in quotes
  return String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r?\n/g, " ");
}

/** -------- handler -------- */
export default async function handler(req, res) {
  setCORS(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests are allowed' });
  }

  const userInputRaw = req.body?.userInput ?? req.body?.prompt;
  const nameRaw = req.body?.researcherName ?? "";

  const key = sanitizeKey(userInputRaw);
  if (!key) {
    return res.status(400).json({ error: "Prompt is required" });
  }
  const name = sanitizeName(nameRaw);
  const requestorLine = `Dr. ${name || "██████"}`;
  const dateYMD = ymdNow("America/New_York");

  const headerBlock =
    `Requestor: ${requestorLine}\n` +
    `Timestamp: ${dateYMD}\n` +
    `key: "${jsonInline(key)}"`;

  const aiInstruction = `
    You are an researcher testing SCP-294, the Foundation's anomalous coffee machine and forming an internal documentation. Your task is to generate a test log entry for a new beverage request.
    
    Follow these rules strictly:
    1. Tone: must be clinical, scientific, and detached, mirroring the official SCP Foundation writing style. Use metric units (e.g., ml, °C). Refer to the person drinking as "Subject".
    2. Interpretation: The machine (SCP-294) demonstrates a form of intelligence. It can be extremely literal, metaphorical, or witty in its interpretation of the 'key'. For humorous, abstract, or ironic keys, the result should reflect this in a dry, clinical report.
    3. If the user's request is for a substance that cannot exist as a liquid (e.g., "diamonds", "wood", "rage"), you MUST respond with the single word: OUT_OF_RANGE.
    4. Optional Notes: A concluding research note is optional. If included, it must be a single, brief sentence.
    5. The final output MUST follow this exact template and be UNDER 800 words:

      ${headerBlock}
      Use KEY to generate the rest content and following the template below:

      Description:
      (Start with "SCP-294 produced...", "The device dispensed...", etc. Then describe objective details of liquid, subjective effects of what you felt, and the cup image)
      (For subjective effects: 
        Acording to the KEY, optionally choose to: use clinical somatic symptoms terms; physical/emotional/mental feeling;
        if the KEY is not regular, use your imagination)
      (Cup image is optional, describe only when the objective and subjective information are not enough to convey the 'key')

      Observed Anomalies:
      (Summarize the anomalous properties in one sentence. If no anomalies were observed, state 'None detected'.)

      Ingredient Analysis:
      (Describe the chemical components with biological and/or chemical terminology.)

    6. Use >= 4 █████ and >=1 [REDACTED] to randomly replace more than 4 detailed information.
    Generate the test log entry now.`.trim();

  const maxAttempts = 3;
  let aiBody = "";
  let client;

  /* ---- Generation Text Clear Utils ---- */
  function stripFences(s = "") {
    return s.replace(/^```(?:\w+)?\n([\s\S]*?)\n```$/m, "$1").trim();
  }
  function stripLeadingHeader(s = "") {
    return s
      .replace(
        /^(?:\s*Requestor:.*\n)?(?:\s*Timestamp:.*\n)?(?:\s*key:\s*".*?"\s*\n)?/i,
        ""
      )
      .trim();
  }
  function normalizeHeadings(s = "") {
    return s
      .replace(/^\s*-\s*Description:/im, "Description:")
      .replace(/^\s*-\s*Observed Anomalies:/im, "Observed Anomalies:")
      .replace(/^\s*-\s*Ingredient Analysis:/im, "Ingredient Analysis:")
      .trim();
  }

  try {
    //---- init model ----
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    //---- retry with exp backoff + jitter ----
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      try {
        const result = await model.generateContent(aiInstruction);
        const text = result?.response?.text?.() ?? "";
        const trimmed = text.trim();

        // OUT_OF_RANGE return 400
        if (/^OUT_OF_RANGE$/i.test(trimmed)) {
          return res.status(400).json({ error: "Failed to create a liquid from the requested substance." });
        }
        // Clean return value
        aiBody = normalizeHeadings(stripLeadingHeader(stripFences(trimmed)));
        if (aiBody) break;
      } catch (error) {
        const status = error?.status ?? error?.response?.status;
        const isRetryable = status === 503 || status === 429;
        if (isRetryable && attempt < maxAttempts - 1) {
          const backoff = 1500 * 2 ** attempt + Math.floor(Math.random() * 500);
          console.error(`AI temporarily unavailable. Retry ${attempt + 1}/${maxAttempts} in ${backoff}ms`);
          await new Promise((r) => setTimeout(r, backoff));
          continue;
        }
        throw error;
      }
    }

    if (!aiBody) {
      return res.status(502).json({ message: "Failed to get a valid response from AI after multiple attempts." });
    }
    
    // ---- assemble final text: header + body ----
    const finalText = `${headerBlock}\n\n${aiBody}`;

    // ---- save to MongoDB ----
    const uri = process.env.MONGODB_URI;
    client = new MongoClient(uri);
    await client.connect();

    const db = client.db("scp294");
    const col = db.collection("test_logs");

    const newLog = {
      requestor: requestorLine, // e.g., "Dr. ██████" or "Dr. Ada Lovelace"
      timestamp_ymd: dateYMD,
      input_key: key,
      document_text: finalText,
      // model: "gemini-1.5-flash-latest",
      // out_of_range: false,
    };

    await col.insertOne(newLog);

    // ---- respond ----
    return res.status(200).json({ 
      description: finalText,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  } finally {
    if (client) {
      await client.close();
    }
  }
}