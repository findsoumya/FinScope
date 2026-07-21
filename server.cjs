var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_config = require("dotenv/config");
var import_vite = require("vite");
var import_genai = require("@google/genai");
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  app.post("/api/parse-text", async (req, res) => {
    try {
      const { text, categories } = req.body;
      if (!text) {
        return res.status(400).json({ error: "No text provided" });
      }
      const categoriesList = JSON.parse(categories || "[]");
      const ai = new import_genai.GoogleGenAI({
        apiKey: req.headers["x-gemini-api-key"] || process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const prompt = `Extract transaction details from the following raw text extracted from a bank statement.
      For each transaction, provide:
      - date (YYYY-MM-DDTHH:mm:ss format if exact time is present in statement, otherwise just YYYY-MM-DD)
      - desc (Pull the Merchant name or a shorter, more relatable description from the raw description. e.g. from "UPI/455232248371/Payment for 668/maprogardenoffl/Yes Bank Ltd" extract "Maprogarden")
      - amount (Absolute numerical amount)
      - type ("Income" or "Expense")
      - account (The bank name, if inferrable, else empty string. Do NOT use account numbers.)
      - note (Any extra details like UPI reference or the original raw description, otherwise empty string)
      - category (Assign the most appropriate category from the following list based on the transaction description. If none match well, suggest a new short category name like "Food", "Transport", "Shopping", etc.).
      
      List of existing categories:
      ${categoriesList.join(", ")}
      
      Text to parse:
      ${text.substring(0, 2e5)} // Support larger bank statements
      `;
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.ARRAY,
            items: {
              type: import_genai.Type.OBJECT,
              properties: {
                date: { type: import_genai.Type.STRING },
                desc: { type: import_genai.Type.STRING },
                amount: { type: import_genai.Type.NUMBER },
                type: { type: import_genai.Type.STRING },
                account: { type: import_genai.Type.STRING },
                note: { type: import_genai.Type.STRING },
                category: { type: import_genai.Type.STRING }
              },
              required: ["date", "desc", "amount", "type", "category"]
            }
          }
        }
      });
      const parsedTransactions = JSON.parse(response.text || "[]");
      res.json({ transactions: parsedTransactions });
    } catch (e) {
      console.error("Text Parsing Error:", e, e.stack);
      res.status(500).json({ error: e.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
