import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  systemInstruction: `You are a medically accurate baby care assistant. All advice must be:
- Clinically grounded and evidence-based
- Referenced to recognised sources (Mayo Clinic, Cleveland Clinic, WHO, NHS, AAP, or Indian Academy of Pediatrics where relevant)
- Appropriate for Indian families and context
- Conservatively worded — avoid definitive medical claims
- Always include a note to consult your paediatrician for personal guidance`,
})

export interface CareTip {
  category: string
  tip: string
  source: string
  detail: string
  disclaimer: string
  icon?: string
}

export interface ProductRecommendation {
  name: string
  reason: string
  budget: { description: string; searchTerm: string; price: string }
  mid: { description: string; searchTerm: string; price: string }
  premium: { description: string; searchTerm: string; price: string }
}

export async function generateCareTips(
  babyName: string,
  gender: string,
  ageWeeks: number,
  avgFeedsPerDay: number,
  avgSleepHoursPerDay: number,
  avgDiapersPerDay: number,
  lastFeedType: string,
  latestWeight?: number
): Promise<CareTip[]> {
  const prompt = `Baby's name is ${babyName} (${gender}), currently ${ageWeeks} weeks old.
Over the last 7 days: averaging ${avgFeedsPerDay} feeds/day, ${avgSleepHoursPerDay} hours sleep/day, ${avgDiapersPerDay} diapers/day.
Last feed type: ${lastFeedType}.${latestWeight ? ` Latest weight: ${latestWeight}kg.` : ''}

Based on this specific profile, generate 5 personalised care tips addressing areas most relevant to ${babyName}'s current patterns.
Cover: feeding, sleep, development, safety, and one area specific to ${ageWeeks} weeks of age.

Return ONLY a JSON array with this exact structure:
[{
  "category": "Feeding",
  "tip": "short tip title",
  "source": "IAP",
  "detail": "2-3 sentence detail",
  "disclaimer": "Always consult your paediatrician for personal guidance.",
  "icon": "🍼"
}]

Source options: Mayo Clinic, Cleveland Clinic, WHO, NHS, AAP, IAP
Icon options: 🍼 for feeding, 😴 for sleep, 🧸 for development, 🛡️ for safety, 💜 for general`

  const result = await geminiModel.generateContent(prompt)
  const text = result.response.text()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON in Gemini response')
  return JSON.parse(jsonMatch[0])
}

export async function generateProductRecommendations(
  babyName: string,
  gender: string,
  ageMonths: number,
  category: string
): Promise<ProductRecommendation[]> {
  const prompt = `${babyName} is a ${gender} baby, ${ageMonths} months old, in India.
Generate 3 age-appropriate product suggestions in the "${category}" category.
Tailor recommendations to gender where relevant.
All prices in INR. Budget <₹500, Mid ₹500–2000, Premium ₹2000+.

Return ONLY a JSON array with this exact structure:
[{
  "name": "Product Name",
  "reason": "Why it's developmentally appropriate at ${ageMonths} months (1 sentence)",
  "budget": { "description": "Product option", "searchTerm": "search query for amazon", "price": "₹200–400" },
  "mid": { "description": "Product option", "searchTerm": "search query for flipkart", "price": "₹800–1200" },
  "premium": { "description": "Product option", "searchTerm": "search query for firstcry", "price": "₹2500–4000" }
}]`

  const result = await geminiModel.generateContent(prompt)
  const text = result.response.text()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON in Gemini response')
  return JSON.parse(jsonMatch[0])
}

export interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export async function generateChatReply(
  messages: ChatMessage[],
  babyContext: { name: string; gender: string; ageMonths: number }
): Promise<string> {
  const chatModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `You are BabyCare AI, a friendly and knowledgeable baby care assistant for Indian parents.

You ONLY answer questions about:
- Baby feeding (breast, bottle, solids, amounts, schedules)
- Diapers (frequency, colour, consistency, what's normal)
- Baby sleep (patterns, naps, night waking, safe sleep)
- Common baby medical conditions (fever, colic, rashes, constipation, colds, teething)
- General baby development and milestones

If asked about anything outside these topics, politely say: "I'm only able to help with baby feeding, sleep, diapers, and common health questions. Please ask your doctor for anything else."

Always:
- Use the baby's name (${babyContext.name}) to personalise answers
- Keep answers concise — 3–5 sentences max
- Reference IAP, WHO, or AAP when giving medical guidance
- End medical answers with: "Always consult your paediatrician for personal advice."
- Be warm, reassuring, and supportive

Context: ${babyContext.name} is a ${babyContext.gender} baby, ${babyContext.ageMonths} months old, in India.`,
  })

  // Rolling window: last 4 messages only
  const history = messages.slice(-4)
  const chat = chatModel.startChat({
    history: history.slice(0, -1).map(m => ({
      role: m.role,
      parts: [{ text: m.content }],
    })),
  })

  const lastMessage = history[history.length - 1]
  const result = await chat.sendMessage(lastMessage.content)
  return result.response.text().trim()
}

export async function generatePregnancyTip(
  parent1Name: string,
  weeksPregnant: number,
  weeksUntilDue: number
): Promise<string> {
  const prompt = `${parent1Name} is ${weeksPregnant} weeks pregnant, ${weeksUntilDue} weeks until due date.
Generate 1 practical, evidence-based tip for this week of pregnancy.
Source it to WHO, NHS, IAP, or Mayo Clinic.
Keep it warm, encouraging, and relevant to Indian context.
Return ONLY the tip as plain text (2-3 sentences).`

  const result = await geminiModel.generateContent(prompt)
  return result.response.text().trim()
}
