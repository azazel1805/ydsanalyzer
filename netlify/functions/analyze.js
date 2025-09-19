const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Frontend'den artık 'selectedSoruTipi' alanını da alıyoruz.
    const { text, imageData, imageMimeType, selectedSoruTipi } = JSON.parse(event.body);

    if (!text && !imageData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Lütfen analiz için bir metin veya resim sağlayın.' }) };
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    // === DİNAMİK PROMPT OLUŞTURMA BÖLÜMÜ ===
    let prompt;
    const basePromptStart = `
      Sen YDS, YÖKDİL ve e-YDS gibi Türkiye'deki İngilizce yeterlilik sınavlarında uzmanlaşmış, deneyimli bir soru analisti ve eğitmensin.
      Sana bir YDS sorusu verilecek. Görevin, bu soruyu detaylıca analiz etmek ve cevabını MUTLAKA ve SADECE aşağıda tanımlanan JSON formatında sunmaktır.
      Başka hiçbir metin veya açıklama ekleme.
    `;

    const jsonStructure = `
      JSON Yapısı:
      {
        "soruTipi": "Analiz edilen sorunun tipi",
        "konu": "Sorunun daha spesifik konusu (Örn: Zıtlık Bağlacı, Perfect Modals, Kelime Anlamı, Zaman Uyumu)",
        "dogruCevap": "Doğru seçeneğin harfi ve içeriği (Örn: 'E) prevalence')",
        "detayliAciklama": "Doğru cevabın neden doğru olduğunu, soru kökündeki ipuçlarını, cümlenin Türkçe anlamını ve ilgili dilbilgisi kuralını adım adım, kapsamlı bir şekilde açıkla. Satır atlaması için '\\n' kullan.",
        "digerSecenekler": [
          { "secenek": "A) utilisation", "aciklama": "Bu seçeneğin neden yanlış olduğunu açıkla." }
        ],
        "kalıplar": [
          { "kalip": "vary according to", "aciklama": "Bu kalıbın anlamını, kullanım yerlerini ve örnek cümlelerini içeren detaylı bir açıklama." }
        ]
      }
    `;

    const finalInstruction = `\nŞimdi, sana vereceğim soruyu bu yapıya sadık kalarak analiz et. Analiz edilecek soru aşağıdadır:`;

    if (selectedSoruTipi && selectedSoruTipi !== 'auto') {
      // KULLANICI BİR TİP SEÇTİYSE: Gemini'ye direkt komut verilir.
      prompt = `
        ${basePromptStart}
        Sana verilen sorunun tipi kullanıcı tarafından '${selectedSoruTipi}' olarak belirtildi.
        Tüm analizini bu soru tipinin gerekliliklerine odaklanarak yap. 'soruTipi' alanını JSON çıktısında '${selectedSoruTipi}' olarak doldur.
        ${jsonStructure}
        ${finalInstruction}
      `;
    } else {
      // OTOMATİK ALGILAMA (VARSAYILAN): Gemini'ye soru tipini bulması söylenir.
      const soruTipleriListesi = `
        - Kelime Bilgisi (Vocabulary / Phrasal Verb)
        - Gramer (Tense, Modal, Preposition, etc.)
        - Bağlaçlar (Conjunctions)
        - Cloze Test
        - Cümle Tamamlama (Sentence Completion)
        - Çeviri (İngilizce-Türkçe / Türkçe-İngilizce)
        - Paragraf Soruları (Reading Comprehension)
        - Diyalog Tamamlama (Dialogue Completion)
        - Anlamca En Yakın Cümle (Restatement)
        - Paragraf Tamamlama (Paragraph Completion)
        - Anlam Bütünlüğünü Bozan Cümle (Irrelevant Sentence)
      `;
      prompt = `
        ${basePromptStart}
        İlk olarak, soruyu incele ve 'soruTipi' alanını aşağıdaki listeden en uygun olanıyla doldur:
        ${soruTipleriListesi}
        Ardından analizinin geri kalanını bu tipe uygun şekilde tamamla.
        ${jsonStructure}
        ${finalInstruction}
      `;
    }

    const requestParts = [];
    requestParts.push({ text: prompt });

    if (text) {
      requestParts.push({ text: text });
    } else if (imageData && imageMimeType) {
      requestParts.push({
        inlineData: {
          data: imageData,
          mimeType: imageMimeType
        }
      });
    }

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
