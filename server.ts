import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route first
app.post("/api/oracle", async (req, res) => {
  try {
    const { speechText } = req.body;
    if (!speechText || typeof speechText !== "string" || !speechText.trim()) {
      return res.status(400).json({ error: "Missing morning thoughts text proclamation!" });
    }

    const systemInstruction = `You are the Royal Oracle, a wise fantasy advisor in a medieval RPG kingdom. The user has just spoken their morning thoughts. Your job is to: (1) Extract 1–3 clear action items from what they said and format them as royal decrees. (2) Identify if any recurring stressor or distraction was mentioned. (3) Give one short motivational line in a regal, fantasy tone. Keep your entire response under 120 words. Format strictly as JSON with this exact key structure: { "decrees": string[], "stressor": string | null, "blessing": string }`;

    const userPrompt = `The traveler's morning proclamation is: "${speechText}"`;

    // 1. Try Claude if ANTHROPIC_API_KEY is configured
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        console.log("Oracle routing request via Claude API...");
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 500,
            system: systemInstruction,
            messages: [
              {
                role: "user",
                content: userPrompt,
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const contentText = data.content?.[0]?.text || "";
          const jsonMatch = contentText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed.decrees) && typeof parsed.blessing === "string") {
              return res.json(parsed);
            }
          }
        } else {
          console.warn("Claude API returned non-200 status:", response.status);
        }
      } catch (e) {
        console.error("Claude API execution failed, falling back to Gemini:", e);
      }
    }

    // 2. Fallback / Default: Gemini (Native workspace environment API key)
    if (process.env.GEMINI_API_KEY) {
      console.log("Oracle routing request via Gemini API...");
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decrees: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "1-3 clear action items formatted as royal decrees (e.g., 'Thou shalt read the history scroll today.')",
              },
              stressor: {
                type: Type.STRING,
                description: "The recurring stressor/distraction mentioned, or null if none",
              },
              blessing: {
                type: Type.STRING,
                description: "Regal fantasy encouragement/blessing",
              },
            },
            required: ["decrees", "stressor", "blessing"],
          },
        },
      });

      const contentText = response.text || "";
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json(parsed);
      } else {
        const parsed = JSON.parse(contentText);
        return res.json(parsed);
      }
    }

    throw new Error("No active AI API keys configured inside the server settings!");
  } catch (err) {
    console.error("Oracle execution failure:", err);
    return res.status(500).json({ error: "The Oracle's vision is clouded today. Return tomorrow." });
  }
});

app.post("/api/verify-journal", async (req, res) => {
  try {
    const { journalText } = req.body;
    if (!journalText || typeof journalText !== "string" || !journalText.trim()) {
      return res.status(400).json({ error: "Thy journal reflection is blank, traveler! Speak thy thoughts." });
    }

    const systemInstruction = `You are the Royal Grand Scholar, an ancient scribe evaluating of the traveler's daily mindfulness log. 
    Evaluate their writing and return:
    1. A reflection grade from D to S-Tier (e.g. S, A, B, C, D) based on depth and focus.
    2. A brief, wise fantasy commentary encouraging their habits.
    3. An RPG name for a 'focus scroll' matching their topic.
    Keep your response short and elegant, under 100 words. Format strictly as JSON with the key structure: { "grade": string, "comment": string, "scrollTitle": string }`;

    const userPrompt = `The traveler's journal reflection: "${journalText}"`;

    if (process.env.GEMINI_API_KEY) {
      console.log("Journal grading routed via Gemini API...");
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              grade: {
                type: Type.STRING,
                description: "The evaluation grade: D, C, B, A, or S",
              },
              comment: {
                type: Type.STRING,
                description: "Wise medieval scholar commentary",
              },
              scrollTitle: {
                type: Type.STRING,
                description: "Imaginary medieval scroll focus name (e.g., 'Scroll of Celestial Time')",
              },
            },
            required: ["grade", "comment", "scrollTitle"],
          },
        },
      });

      const contentText = response.text || "";
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         const parsed = JSON.parse(jsonMatch[0]);
         return res.json(parsed);
      } else {
         const parsed = JSON.parse(contentText);
         return res.json(parsed);
      }
    }

    // Default static mock if API key isn't active
    return res.json({
      grade: "A-Tier",
      comment: "A magnificent declaration, traveler! Thy focus shines bright in the halls of mastery.",
      scrollTitle: "Scroll of Mindful Clarity"
    });
  } catch (err) {
    console.error("Journal grading failure:", err);
    return res.status(500).json({ error: "The Grand Scholar's sight is temporarily blurred." });
  }
});

app.post("/api/verify-proof", async (req, res) => {
  try {
    const { questTitle, questDesc, proofText } = req.body;
    if (!questTitle || !proofText) {
      return res.status(400).json({ error: "Missing quest details or proof proclamation text!" });
    }

    const systemInstruction = `You are the Kingdom High Archivist, a wise sentinel verifying the traveler's proof of completing their RPG quests.
    Evaluate the user's written description of proof against the quest title ("${questTitle}") and quest objective/description ("${questDesc || ""}").
    Identify if they actually completed the quest or if their description is too brief, vague, lazy, or nonsensical.
    Your evaluation must result in:
    1. verified: boolean (true if they provided reasonable, realistic evidence of completion; false if it's too short/vague/nonsensical).
    2. scholarMessage: string (a short, wise medieval fantasy comment explaining your evaluation under 45 words. Speak with medieval/regal tones, using terms like "thy", "deeds", "noble" etc.).
    Format strictly as JSON with this exact key structure: { "verified": boolean, "scholarMessage": string }`;

    const userPrompt = `Quest: "${questTitle}" (${questDesc || ""})\nTraveler's Written Proof: "${proofText}"`;

    if (process.env.GEMINI_API_KEY) {
      console.log("Proof verification routed via Gemini API...");
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verified: {
                type: Type.BOOLEAN,
                description: "True if proof is genuine and detailed, false if insufficient",
              },
              scholarMessage: {
                type: Type.STRING,
                description: "Wise medieval scholar commentary evaluating the proof",
              },
            },
            required: ["verified", "scholarMessage"],
          },
        },
      });

      const contentText = response.text || "";
      const jsonMatch = contentText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
         const parsed = JSON.parse(jsonMatch[0]);
         return res.json(parsed);
      } else {
         const parsed = JSON.parse(contentText);
         return res.json(parsed);
      }
    }

    // Default static mock if API key isn't active
    const isValid = proofText.trim().split(/\s+/).length >= 5;
    return res.json({
      verified: isValid,
      scholarMessage: isValid 
        ? "Truly a noble deed! Thy written testimonies bear witness of thy stamina and effort. Progression granted."
        : "Thy text is brief and lacking detail, traveler! Speak more of thy labor that I may vouch for thy soul."
    });
  } catch (err) {
    console.error("Proof grading failure:", err);
    return res.status(500).json({ error: "The High Archivist's archives are temporarily offline." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
