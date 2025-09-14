import { GoogleGenAI } from '@google/genai';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

export function cleanAIResponse(raw) {
    return raw.replace(/```json/g, "").replace(/```/g, "").trim();
}

export async function getIntent(segment) {
    const prompt = `
Translate this JSON segment into a structured human-readable targeting description.
Return ONLY valid JSON that matches this schema:

{
  "intent": string   // human-readable text like "customers with spend less than ₹5000"
}

Segment:
${JSON.stringify(segment, null, 2)}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        const parsedResponse = JSON.parse(cleanAIResponse(response.text));
        // console.log(parsedResponse)

        return parsedResponse.intent;

    } catch (error) {
        console.error("Error generating or parsing intent:", error);
        return '';
    }
}




export async function getCampaignSummary(campaignName, intent, segment, audience, sent, fail) {
    const prompt = `
Summarize this campaign in a concise, human-readable way.
Your focus is to give as much detail as possible to the user(analyst) at 1 glance.
Give a % success of delivery hits, if no segment used no need to mention it.
Do not give extra details that is not relevant to marketing or analyst
Give a personalized message which is very human readable.

Details:
- Campaign Name: ${campaignName}
- Targeting intent: ${intent}
- Segment: ${JSON.stringify(segment, null, 2)}
- Audience size: ${audience}
- Messages sent: ${sent}
- Messages failed: ${fail}
- Pecentage Success: ${(sent / audience) * 100}

Return ONLY valid JSON in the following format:

{
  "summary": string
}

Example:
{
  "summary" : "Your Happy Holidays! campaign reached 1,284 users. 1,140 messages were delivered. Customers with
> ₹10K spend had a 95% delivery rate."
}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: prompt,
        });

        const rawText = response.text;
        console.log("Raw AI summary:", rawText);

        const cleanText = cleanAIResponse(rawText);
        const parsed = JSON.parse(cleanText);
        return parsed.summary;
    } catch (err) {
        console.error("Error generating or parsing campaign summary:", err);
        return `Campaign for intent "${intent}" targeting ${audience} customers. Sent: ${sent}, Failed: ${fail}.`;
    }
}