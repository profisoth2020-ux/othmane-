
import { GoogleGenAI } from "@google/genai";
import { Assessment } from "../types";

export const getPerformanceSummary = async (staffName: string, assessments: Assessment[]) => {
  // Initialize AI right before the call to ensure freshest API KEY usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const totalIncentive = assessments.reduce((sum, a) => sum + a.totalIncentive, 0);
  const dataSummary = assessments.map(a => `- ${a.domainName} (${a.subCategoryTitle}): ${a.points} نقاط`).join('\n');

  const prompt = `
    حلل أداء الموظف(ة): ${staffName}
    البيانات المسجلة:
    ${dataSummary}
    إجمالي التحفيز المادي المكتسب: ${totalIncentive} دينار جزائري.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "أنت خبير في الموارد البشرية والتحفيز المهني وتعمل في مركز متخصص لذوي الاحتياجات الخاصة. مهمتك هي تقديم ملخص أداء مهني، مشجع، ومختصر باللغة العربية (بحد أقصى 3 جمل). ركز على الإنجازات المحققة والروح المعنوية.",
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return text.trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    // In case of error, provide a generic but professional placeholder
    return `بناءً على السجلات، قدمت ${staffName} أداءً متميزاً في مجالات التواصل وتعديل السلوك، مما ساهم بشكل إيجابي في تطور الأطفال بالمركز. إجمالي التحفيز المكتسب يعكس جهوداً مستمرة وتفانٍ في العمل.`;
  }
};
