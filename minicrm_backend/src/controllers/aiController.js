import { GoogleGenAI } from '@google/genai';
import { cleanAIResponse } from "../aiServices/aiService.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export async function createPersonalizedMessages(req, res) {
    try {
        const { campaignName, campaignObjective } = req.body; // assuming JSON body

        if (!campaignName || !campaignObjective) {
            return res.status(400).json({ message: "campaignName and campaignObjective are required" });
        }

        // Constrain the AI tightly
        const prompt = `
You are an assistant that generates **only JSON** responses.  
Your task is to create **exactly 3 personalized campaign message suggestions**.  

Rules:
- Allowed placeholders: {{name}}, {{email}}, {{city}}, {{phone}}.
- All placeholders already belong to user.  
- Do NOT invent other placeholders.  
- All messages must make sense in a customer context (e.g., "contact us at {{phone}}" is invalid because {{phone}} belongs to the customer).  
- Prefer using {{name}} and {{city}} for personalization.  
- You can use emoji's if it is resonable (depends on user is casual or professional in their objective).
- Keep responses short and campaign-appropriate.  

Campaign objective: "${campaignObjective}"  
Campaign name: "${campaignName}"  

Return JSON only in this shape:
{
  "suggestions": [
    "message 1",
    "message 2",
    "message 3"
  ]
}
    `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        // Try to parse the AI output into JSON
        let suggestionsJson;
        try {
            suggestionsJson = JSON.parse(cleanAIResponse(response.text));
        } catch (parseErr) {
            return res.status(500).json({
                message: "AI response was not valid JSON",
                raw: text,
            });
        }

        res.status(200).json(suggestionsJson);
    } catch (err) {
        console.error("AI error:", err);
        res.status(500).json({ message: `Internal server error: ${err.message}` });
    }
}


const attributes = [
    { label: "Spend", value: "total_spend", type: "number" },
    { label: "Visits", value: "visit", type: "number" },
    { label: "City", value: "city", type: "string" },
    { label: "Last Order in (days)", value: "last_order_date", type: "number" },
];

const operators = {
    number: [">", "<", "=", ">=", "<="],
    string: ["=", "!="],
};

function reorderRules(ruleGroup) {
    const simpleRules = [];
    const nestedGroups = [];

    // Separate rules from groups
    for (const rule of ruleGroup.rules) {
        if (rule.rules) { // This object is a group
            nestedGroups.push(reorderRules(rule)); // Recursively reorder nested groups
        } else { // This is a simple rule
            simpleRules.push(rule);
        }
    }

    // Combine simple rules followed by nested groups
    ruleGroup.rules = simpleRules.concat(nestedGroups);
    return ruleGroup;
}

export async function createDynamicRules(req, res) {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ message: "query is required" });
        }

        // Build the AI prompt
        const prompt = `
You are an AI assistant that builds a dynamic rule tree (ruleGroup) for a campaign based on human text input.

Requirements:
1. There are two types: "group" and "rule".
   - Rule: { id, attribute, operator, value }
   - Group: { id, combinator, rules }
2. Attributes are strictly: ${attributes.map(a => a.value).join(", ")}
3. Operators allowed:
   - number: ${operators.number.join(", ")}
   - string: ${operators.string.join(", ")}
4. Base group is always id "group-root"
5. Maintain **top-down order**:
   - If a group is nested, all current and future rules of its parent must appear **before** the nested group.
6. All ids must be unique; do not invent fields or symbols outside the ones listed.
7. Generate JSON only, with valid structure, starting from the base group:
${JSON.stringify({ id: "group-root", combinator: "AND", rules: [] }, null, 2)}
8. Attributes metadata:
- total_spend: number, valid operators >, <, =, >=, <=
- visit: number, valid operators >, <, =, >=, <=
- city: string, valid operators =, !=
- last_order_date: number (days since last order), valid operators >, <, =, >=, <=

Human instruction: "${query}"

Return **only JSON**, nothing else.
`;

        // Call AI
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        // Clean & parse AI output
        let ruleGroup;
        try {
            ruleGroup = JSON.parse(cleanAIResponse(response.text));
            ruleGroup = reorderRules(ruleGroup);
        } catch (parseErr) {
            console.error("AI response parsing failed:", parseErr);
            return res.status(500).json({ message: "AI response was not valid JSON", raw: response.text });
        }

        // Respond with structured ruleGroup
        res.status(200).json({ ruleGroup });
    } catch (err) {
        console.error("Error generating dynamic rules:", err);
        res.status(500).json({ message: `Internal server error: ${err.message}` });
    }
}