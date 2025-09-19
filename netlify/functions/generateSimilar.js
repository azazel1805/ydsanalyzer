// netlify/functions/generateSimilar.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { konu, zorlukSeviyesi, soruTipi } = JSON.parse(event.body);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const prompt = `
      Sen bir YDS soru yazma uzmanısın. Görevin, sana verilen kriterlere uygun, özgün bir YDS sorusu oluşturmak.
      Soru Tipi: "${soruTipi}"
      Konu: "${konu}"
      Zorluk Seviyesi: "${zorlukSeviyesi}"
      Cevabını MUTLAKA aşağıdaki JSON formatında döndür:
      {
        "yeniSoru": "Oluşturduğun tam soru metni (paragraf ise paragraf, cümle ise cümle)...",
        "secenekler": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
        "dogruCevap": "Doğru seçeneğin harfi ve içeriği (Örn: C) option text)",
        "kisaAciklama": "Doğru cevabın neden doğru olduğuna dair 1-2 cümlelik kısa bir açıklama."
      }
    `;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    return { statusCode: 200, body: cleanedText };
  } catch (error) {
    console.error("Error generating similar question:", error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Soru üretilirken bir hata oluştu.' }) };
  }
};
