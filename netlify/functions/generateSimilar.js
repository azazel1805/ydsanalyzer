// netlify/functions/generateSimilar.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { konu, zorlukSeviyesi, soruTipi } = JSON.parse(event.body);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // === GELİŞTİRİLMİŞ PROMPT ===
    const prompt = `
      Sen bir YDS (Yabancı Dil Sınavı) soru yazma uzmanısın.
      Görevin, sana verilen kriterlere uygun, özgün bir YDS sorusu oluşturmak.

      **KRİTİK TALİMATLAR:**
      1.  **Dil:** Soru metni, seçenekler ve doğru cevap MUTLAKA **İNGİLİZCE** olmalıdır.
      2.  **Açıklama Dili:** Sadece "kisaAciklama" bölümü **TÜRKÇE** olabilir.
      3.  **Format:** Cevabını MUTLAKA aşağıdaki JSON formatında, başka hiçbir metin eklemeden döndür.

      **Soru Kriterleri:**
      *   **Soru Tipi:** "${soruTipi}"
      *   **Konu:** "${konu}"
      *   **Zorluk Seviyesi:** "${zorlukSeviyesi}"

      **İstenen JSON Yapısı:**
      {
        "yeniSoru": "Oluşturduğun tam İNGİLİZCE soru metni (paragraf ise paragraf, cümle ise cümle)...",
        "secenekler": [
            "A) İngilizce seçenek 1...", 
            "B) İngilizce seçenek 2...", 
            "C) İngilizce seçenek 3...", 
            "D) İngilizce seçenek 4...", 
            "E) İngilizce seçenek 5..."
        ],
        "dogruCevap": "Doğru seçeneğin harfi ve İNGİLİZCE içeriği (Örn: C) the correct option)",
        "kisaAciklama": "Doğru cevabın neden doğru olduğuna dair 1-2 cümlelik kısa ve TÜRKÇE bir açıklama."
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
