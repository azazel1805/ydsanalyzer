const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text, imageData, imageMimeType } = JSON.parse(event.body);

    if (!text && !imageData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Lütfen analiz için bir metin veya resim sağlayın.' }) };
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    const prompt = `
      Sen YDS, YÖKDİL ve TOEFL gibi İngilizce yeterlilik sınavlarında uzman bir eğitmensin.
      Sana bir soru metni veya sorunun fotoğrafı verilecek. Görevin bu soruyu detaylıca analiz etmek ve cevabını MUTLAKA aşağıdaki JSON formatında sunmaktır.
      Başka hiçbir metin ekleme, sadece ve sadece geçerli bir JSON objesi döndür.
      
      JSON Yapısı:
      {
        "konu": "Sorunun ana konusu (Örn: Tense Uyumu, Preposition, Bağlaçlar, Kelime Bilgisi, Phrasal Verbs)",
        "dogruCevap": "Doğru seçeneğin harfi veya kelimesi (Örn: 'C) because of')",
        "detayliAciklama": "Doğru cevabın neden doğru olduğunu, cümlenin anlamını, hangi dilbilgisi kuralının geçerli olduğunu adım adım, kapsamlı bir şekilde açıkla. Açıklamada geçen önemli kalıpları ve kelimeleri not al. Satır atlaması için '\\n' kullan.",
        "digerSecenekler": [
          {
            "secenek": "A) despite",
            "aciklama": "Bu seçeneğin neden yanlış olduğunu açıkla. Örneğin, 'despite bir edattır ve kendisinden sonra isim/Ving alır, ancak burada tam bir cümle (clause) var, bu yüzden uygun değil.'"
          },
          {
            "secenek": "B) although",
            "aciklama": "Bu seçeneğin neden yanlış olduğunu açıkla."
          }
        ],
        "kalıplar": [
          {
            "kalip": "Açıklama metninde geçen önemli bir kalıp veya kelime (Örn: 'in terms of')",
            "aciklama": "Bu kalıbın anlamını, kullanım yerlerini ve örnek cümlelerini içeren detaylı bir açıklama. (Örn: 'in terms of', '...bakımından', '...açısından' anlamına gelir ve bir konuyu belirli bir yönden ele alırken kullanılır. Örnek: In terms of difficulty, this exam was easier than the last one.)"
          },
          {
            "kalip": "Başka bir önemli kalıp (Örn: 'cope with')",
            "aciklama": "'cope with' bir phrasal verb'dür ve '...ile başa çıkmak, üstesinden gelmek' anlamına gelir. Zor bir durumla mücadele etmeyi ifade eder. Örnek: She is learning to cope with her new responsibilities."
          }
        ]
      }

      Analiz edilecek soru aşağıdadır:
    `;

    // === DEĞİŞİKLİĞİN YAPILDIĞI YER ===
    // 'parts' dizisini boş başlatıyoruz ve her elemanı doğru obje formatında ekliyoruz.
    const requestParts = [];
    
    // 1. Parça: Bizim talimatlarımız (prompt)
    requestParts.push({ text: prompt });

    // 2. Parça: Kullanıcının gönderdiği metin veya resim
    if (text) {
      requestParts.push({ text: text });
    } else if (imageData && imageMimeType) {
      // Resim objesi zaten doğru formatta olduğu için ona dokunmuyoruz.
      requestParts.push({
        inlineData: {
          data: imageData,
          mimeType: imageMimeType
        }
      });
    }
    // === DEĞİŞİKLİK SONU ===

    const result = await model.generateContent({ contents: [{ parts: requestParts }] });
    const responseText = result.response.text();
    
    let jsonResponse;
    try {
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        jsonResponse = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("Gemini'den gelen cevap JSON formatına çevrilemedi. Ham Cevap:", responseText);
        throw new Error("Yapay zeka geçerli bir formatta cevap vermedi. Lütfen tekrar deneyin.");
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonResponse),
    };

  } catch (error) {
    console.error('Netlify fonksiyonunda bir hata oluştu:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Yapay zeka sunucusunda genel bir sorun oluştu.' }),
    };
  }
};
