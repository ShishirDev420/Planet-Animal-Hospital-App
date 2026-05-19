import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Medication } from './medicalRecords';

export interface OCRResult {
  success: boolean;
  rawText: string;
  confidence: 'high' | 'medium' | 'low';
  medications: Medication[];
  instructions: string;
  diagnosis: string;
  vetName: string;
  clinicName: string;
  date: string;
  error?: string;
}

const OCR_SYSTEM_PROMPT = `You are a specialized veterinary prescription OCR system for Planet Animal Hospital.

Analyze the provided prescription image and extract all information. Return ONLY valid JSON with this exact schema:

{
  "medications": [{ "name": "", "dosage": "", "frequency": "", "duration": "", "notes": "" }],
  "instructions": "",
  "diagnosis": "",
  "vetName": "",
  "clinicName": "",
  "date": "",
  "confidence": "high|medium|low",
  "notes": ""
}

RULES:
- If handwriting is unclear, set confidence to "low" and mark unclear fields with "[UNCLEAR]"
- For medications: extract name, dosage (e.g. "250mg"), frequency (e.g. "2x daily"), duration (e.g. "7 days")
- For date: convert to YYYY-MM-DD format
- If any field cannot be read, leave it as empty string
- Set "notes" to describe any issues reading the prescription (e.g. "Vet signature illegible", "Dosage partially obscured")
- Be thorough but honest about readability limitations`;

export function getGeminiApiKey(): string | null {
  return localStorage.getItem('planet_animal_gemini_key') || null;
}

export async function parsePrescriptionImage(
  base64Image: string,
  mimeType: string = 'image/jpeg',
): Promise<OCRResult> {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    return {
      success: false,
      rawText: '',
      confidence: 'low',
      medications: [],
      instructions: '',
      diagnosis: '',
      vetName: '',
      clinicName: '',
      date: '',
      error: 'No Gemini API key configured. Add your key in Settings.',
    };
  }

  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: OCR_SYSTEM_PROMPT,
    });

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        return {
          success: true,
          rawText: text,
          confidence: 'low',
          medications: [],
          instructions: text,
          diagnosis: '',
          vetName: '',
          clinicName: '',
          date: '',
          error: 'Could not parse structured data from OCR result.',
        };
      }
    }

    return {
      success: true,
      rawText: text,
      confidence: parsed.confidence || 'medium',
      medications: (parsed.medications || []).map((m: any) => ({
        name: m.name || '',
        dosage: m.dosage || '',
        frequency: m.frequency || '',
        duration: m.duration || '',
        notes: m.notes || '',
      })),
      instructions: parsed.instructions || '',
      diagnosis: parsed.diagnosis || '',
      vetName: parsed.vetName || '',
      clinicName: parsed.clinicName || '',
      date: parsed.date || '',
    };
  } catch (err: any) {
    return {
      success: false,
      rawText: '',
      confidence: 'low',
      medications: [],
      instructions: '',
      diagnosis: '',
      vetName: '',
      clinicName: '',
      date: '',
      error: err.message || 'OCR processing failed. Please try again.',
    };
  }
}
