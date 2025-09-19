// netlify/functions/reexplain.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { soru, eskiAciklama } = JSON.parse(event.body);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const prompt = `
      Bir öğrenci, aşağıdaki YDS sorusu için verilen açıklamayı anlamadı.
      Soru: "${soru}"
      Anlaşılmayan Açıklama: "${eskiAciklama}"
      Lütfen bu sorunun çözümünü daha basit bir dille, farklı bir analoji veya örnek kullanarak yeniden açıkla. Cevabın sadece yeni açıklama metni olsun, başka bir şey ekleme.
    `;
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return { statusCode: 200, body: JSON.stringify({ yeniAciklama: responseText }) };
  } catch (error) {
    console.error("Error re-explaining:", error);
    return { statusCode: 500, body: JSON.stringify({ error: 'Açıklama yenilenirken bir hata oluştu.' }) };
  }
};
