import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildKnowledgeContext } from './vet-knowledge';

export type AIVetProvider = 'gemini' | 'openai' | 'free';

export interface AIVetChatMessage {
  role: 'user' | 'ai';
  content: string;
  format?: 'text' | 'html';
}

interface GenerateAIVetResponseInput {
  provider: AIVetProvider;
  apiKey: string;
  systemPrompt: string;
  chatHistory: AIVetChatMessage[];
  signal?: AbortSignal;
}

const ALLOWED_HTML_TAGS = new Set([
  'section',
  'p',
  'strong',
  'em',
  'ul',
  'ol',
  'li',
  'h3',
  'h4',
  'br',
]);

function valueOrFallback(value: unknown, fallback = 'Not provided') {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function plainTextFromHtml(html: string) {
  if (typeof window !== 'undefined' && 'DOMParser' in window) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent?.replace(/\s+/g, ' ').trim() || '';
  }

  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function sanitizeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node as HTMLElement;
  const tagName = element.tagName.toLowerCase();
  const children = Array.from(element.childNodes).map(sanitizeNode).join('');

  if (!ALLOWED_HTML_TAGS.has(tagName)) {
    return children;
  }

  if (tagName === 'br') return '<br>';
  return `<${tagName}>${children}</${tagName}>`;
}

export function sanitizeAIVetHtml(rawHtml: string) {
  const withoutCodeFence = rawHtml
    .replace(/^```html\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  if (typeof window === 'undefined' || !('DOMParser' in window)) {
    return escapeHtml(withoutCodeFence);
  }

  const doc = new DOMParser().parseFromString(withoutCodeFence, 'text/html');
  return Array.from(doc.body.childNodes).map(sanitizeNode).join('').trim();
}

export function aiVetMessageToPlainText(message: AIVetChatMessage) {
  return message.format === 'html' ? plainTextFromHtml(message.content) : message.content;
}

export function buildPetCareContext(profile: any, userMessage: string) {
  const petName = valueOrFallback(profile?.petName || profile?.name, 'the pet');
  const petType = valueOrFallback(profile?.petType, 'pet');
  const petBreed = valueOrFallback(profile?.breed, 'unknown breed');
  const knowledgeContext = buildKnowledgeContext(petType, petBreed, userMessage);

  const profileLines = [
    `Pet parent: ${valueOrFallback(profile?.parentName, 'pet parent')}`,
    `Pet: ${petName}`,
    `Species/type: ${petType}`,
    `Breed: ${petBreed}`,
    `Age: ${valueOrFallback(profile?.age, 'unknown age')}`,
    `Weight: ${valueOrFallback(profile?.weight, 'unknown weight')}`,
    `Gender: ${valueOrFallback(profile?.gender, 'unknown gender')}`,
    `Diet: ${valueOrFallback(profile?.dietaryPreferences)}`,
    `Medical history: ${valueOrFallback(profile?.medicalHistory || profile?.additionalDetails, 'No known issues provided')}`,
    `Surgical history: ${valueOrFallback(profile?.surgicalHistory)}`,
    `Care roadmap: ${valueOrFallback(profile?.cachedRoadmap, 'No roadmap generated yet')}`,
  ];

  return {
    petName,
    petType,
    petBreed,
    trustedContext: profileLines.join('\n'),
    knowledgeContext,
  };
}

export function buildAIVetSystemPrompt(profile: any, userMessage: string) {
  const { petName, trustedContext, knowledgeContext } = buildPetCareContext(profile, userMessage);

  return `You are Pawl, the Primary AI Veterinarian inside Planet Animal Hospital.
Planet Animal Hospital is the trusted data source. Use only the authorized pet context and the reference veterinary knowledge below to personalize your answer.

VOICE AND PERSONALITY:
- Warm, trustworthy, premium, and calm.
- Speak like a caring veterinary partner, not a generic chatbot.
- Use gentle Indian English naturally, including "ji" when it feels appropriate.
- Be proactive and ask one useful follow-up question when needed.
- Dynamically match verbosity to urgency: very brief and directive in emergencies, moderately detailed only when explaining a calculation or when the parent asks for detail.
- Do not recap the pet's full profile, age, weight, medical history, surgical history, or roadmap unless that specific detail directly changes the guidance.
- Acknowledge that the profile is available in one short phrase, then focus on the pet parent's current concern.

LANGUAGE ADAPTATION:
- Mirror the pet parent's communication style.
- If they use English, reply in clear English.
- If they use Hindi, reply in natural Hindi.
- If they mix Hindi and English, reply in natural Hinglish without sounding gimmicky.
- Keep medical terms clear and explain them simply in the same language mix.
- Do not force Hindi words into an English message unless the parent is already using that style.

CRITICAL SAFETY RULES:
1. Do not diagnose. Explain possibilities and recommend an in-person veterinary exam for confirmation.
2. Do not prescribe medications or dosages. Suggest discussing treatment options with a veterinarian.
3. For emergency symptoms such as difficulty breathing, collapse, severe bleeding, bloating, inability to urinate, poisoning, or seizures, tell the pet parent to come to the hospital immediately or seek emergency care now. If the situation sounds immediately life-threatening, prioritize action over explanation.
4. Include a brief disclaimer that this guidance does not replace professional veterinary care.
5. If the app data is missing or uncertain, say so clearly instead of guessing.

CHOCOLATE INGESTION PROTOCOL:
- Do not give a blanket answer. First determine species, pet weight, chocolate type, approximate amount eaten, time since ingestion, symptoms, and whether the product also contains xylitol, raisins, macadamia nuts, coffee/espresso beans, caffeine, or wrappers.
- If any of those data are missing, say exactly what is missing instead of inventing an estimate.
- Ground risk estimates in the reference knowledge: darker/bitter chocolate has more methylxanthines; Merck reports mild signs in dogs around 20 mg/kg methylxanthines, cardiotoxic effects around 40-50 mg/kg, and seizures at 60 mg/kg or higher.
- If enough information is provided, give a rough risk category, not a definitive clearance. Always say a veterinarian or veterinary poison-control service should confirm the calculation.
- Remind the parent that the pet should be shown to a veterinarian regardless of amount, but small low-risk exposures can be triaged while arranging veterinary review.
- Never recommend inducing vomiting, activated charcoal, or home remedies unless a veterinarian has specifically instructed it.

OUTPUT CONTRACT:
- Return a safe HTML fragment only. Do not use Markdown.
- Use only these tags: <section>, <h3>, <h4>, <p>, <strong>, <em>, <ul>, <ol>, <li>, <br>.
- Do not include attributes, links, images, scripts, styles, tables, forms, or iframes.
- Keep the answer concise: one short summary paragraph plus short next steps.
- Use this structure when it fits:
  <section><h3>What I am seeing for ${petName}</h3><p>...</p><h4>Next steps</h4><ul><li>...</li></ul><p>...</p></section>

AUTHORIZED PLANET ANIMAL HOSPITAL PET CONTEXT:
${trustedContext}

REFERENCE VETERINARY KNOWLEDGE:
${knowledgeContext}`;
}

export async function generateAIVetResponse({
  provider,
  apiKey,
  systemPrompt,
  chatHistory,
  signal,
}: GenerateAIVetResponseInput) {
  let firstUserSeen = false;
  const providerHistory = chatHistory.filter((msg) => {
    if (msg.role === 'user') firstUserSeen = true;
    return firstUserSeen;
  });

  if (provider === 'gemini' || provider === 'free') {
    const ai = new GoogleGenerativeAI(apiKey);
    const chatContents = providerHistory.map((msg) => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: aiVetMessageToPlainText(msg) }],
    }));

    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent({
      contents: chatContents,
      generationConfig: { maxOutputTokens: 360, temperature: 0.55 },
    });

    return sanitizeAIVetHtml(result.response.text());
  }

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...providerHistory.map((msg) => ({
      role: msg.role === 'ai' ? ('assistant' as const) : ('user' as const),
      content: aiVetMessageToPlainText(msg),
    })),
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 360,
      temperature: 0.55,
    }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data = await res.json();
  return sanitizeAIVetHtml(data.choices?.[0]?.message?.content || '');
}
