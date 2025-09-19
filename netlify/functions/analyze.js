// Google'ın yapay zeka SDK'sını projemize dahil ediyoruz.
const { GoogleGenerativeAI } = require("@google/generative-ai");

// API anahtarımızı Netlify'da ayarladığımız ortam değişkeninden (environment variable) güvenli bir şekilde alıyoruz.
// Bu anahtar asla frontend koduna (tarayıcıya) gitmez.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Netlify'ın bu fonksiyonu çalıştırması için gereken ana handler fonksiyonu.
exports.handler = async (event) => {
  // Güvenlik ve standartlar gereği sadece POST metoduyla gelen istekleri kabul ediyoruz.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Kodumuzun tamamını bir try-catch bloğu içine alıyoruz.
  // Bu sayede herhangi bir beklenmedik hata olursa, uygulama çökmez ve kullanıcıya anlamlı bir mesaj dönebiliriz.
  try {
    // Frontend'den gelen isteğin body'sini JSON formatından objeye çeviriyoruz.
    const { text, imageData, imageMimeType } = JSON.parse(event.body);

    // Eğer kullanıcı ne metin ne de resim göndermediyse, 400 Bad Request hatası döndürüyoruz.
    if (!text && !imageData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Lütfen analiz için bir metin veya resim sağlayın.' }) };
    }
    
    // Kullanacağımız yapay zeka modelini seçiyoruz. gemini-1.5-pro-latest en güncel ve yetenekli modeldir.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    // === YAPAY ZEKAYA GÖNDERİLECEK KOMUT (PROMPT) - EN KRİTİK BÖLÜM ===
    // Yapay zekanın ne yapacağını, hangi rolde olacağını ve cevabını HANGİ FORMATTA vermesi gerektiğini burada net bir şekilde tanımlıyoruz.
    // JSON formatını zorunlu kılmak, frontend'de veriyi işlememizi çok kolaylaştırır.
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

    // Gemini API'sine gönderilecek isteğin parçalarını hazırlıyoruz.
    const requestParts = [prompt];
    if (text) {
        requestParts.push(text);
    }
    if (imageData && imageMimeType) {
        requestParts.push({
            inlineData: {
                data: imageData,
                mimeType: imageMimeType
            }
        });
    }

    // Hazırladığımız isteği Gemini API'sine gönderiyoruz.
    const result = await model.generateContent({ contents: [{ parts: requestParts }] });
    const responseText = result.response.text();
    
    // Gemini'den gelen cevabı JSON'a çevirmek için ayrı bir try-catch bloğu kullanıyoruz.
    // Bazen API, JSON yerine bir hata metni dönebilir. Bu durumun fonksiyonu çökertmesini engeller.
    let jsonResponse;
    try {
        // API bazen cevabı ```json ... ``` gibi markdown blokları içinde dönebiliyor. Bunları temizliyoruz.
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        jsonResponse = JSON.parse(cleanedText);
    } catch (parseError) {
        // Eğer cevap JSON'a çevrilemezse, Netlify loglarına ham cevabı yazdırıyoruz. Bu, hata ayıklama için çok değerlidir.
        console.error("Gemini'den gelen cevap JSON formatına çevrilemedi. Ham Cevap:", responseText);
        // Yeni bir hata fırlatarak dıştaki ana catch bloğunun bunu yakalamasını sağlıyoruz.
        throw new Error("Yapay zeka geçerli bir formatta cevap vermedi. Lütfen tekrar deneyin.");
    }

    // Her şey yolunda gittiyse, 200 OK status kodu ile birlikte işlenmiş JSON verisini frontend'e gönderiyoruz.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jsonResponse),
    };

  } catch (error) {
    // Ana try bloğunda herhangi bir hata yakalanırsa (API hatası, JSON parse hatası vb.),
    // bu hatayı Netlify loglarına yazdırıyoruz.
    console.error('Netlify fonksiyonunda bir hata oluştu:', error);
    
    // Kullanıcıya 500 Internal Server Error kodu ile birlikte anlaşılır bir hata mesajı gönderiyoruz.
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Yapay zeka sunucusunda genel bir sorun oluştu.' }),
    };
  }
};
