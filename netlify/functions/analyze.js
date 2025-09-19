const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { text, imageData, imageMimeType, selectedSoruTipi } = JSON.parse(event.body);

    if (!text && !imageData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Lütfen analiz için bir metin veya resim sağlayın.' }) };
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

    // === DİNAMİK PROMPT OLUŞTURMA ===
    let prompt;
    const multiQuestionTypes = ["Cloze Test", "Paragraf Soruları (Reading Comprehension)"];
    const isMultiQuestion = multiQuestionTypes.includes(selectedSoruTipi);

    const basePromptStart = `
      Sen YDS, YÖKDİL ve e-YDS sınavlarında uzmanlaşmış, deneyimli bir soru analisti ve eğitmensin.
      Sana bir YDS sorusu verilecek. Görevin, bu soruyu detaylıca analiz etmek ve cevabını MUTLAKA ve SADECE JSON formatında sunmaktır.
      Başka hiçbir metin veya açıklama ekleme.
    `;
    const finalInstruction = `\nŞimdi, sana vereceğim soruyu bu yapıya sadık kalarak analiz et. Analiz edilecek soru aşağıdadır:`;

    if (isMultiQuestion) {
      // ÇOKLU SORU TİPLERİ İÇİN PROMPT
      const multiJsonStructure = `
        {
          "soruTipi": "${selectedSoruTipi}",
          "anaParagraf": "Soruların dayandığı ana paragrafın metni buraya gelecek.",
          "analizler": [
            {
              "soruNumarasi": "Sorunun paragraftaki numarası (Örn: 17, 18)",
              "zorlukSeviyesi": "Sorunun YDS standartlarına göre zorluğu (Kolay, Orta, Zor)",
              "konu": "Bu spesifik sorunun konusu",
              "dogruCevap": "Bu sorunun doğru cevabı",
              "detayliAciklama": "Bu sorunun neden doğru olduğu ve paragrafın hangi kısmıyla ilgili olduğu.",
              "digerSecenekler": [ { "secenek": "A)", "aciklama": "Bu seçeneğin neden yanlış olduğu." } ],
              "kalıplar": [ { "kalip": "İlgili kalıp", "aciklama": "Kalıp açıklaması." } ]
            }
          ]
        }
      `;
      prompt = `
        ${basePromptStart}
        Sana verilen soru tipi '${selectedSoruTipi}'. Bu tip, tek bir paragrafa bağlı birden çok soru içerir.
        Lütfen önce ana paragrafı belirle, sonra paragrafla ilgili HER BİR soruyu ayrı ayrı analiz et ve sonucu aşağıdaki JSON formatında bir dizi olarak döndür.
        ${multiJsonStructure}
        ${finalInstruction}
      `;
    } else {
      // TEKLİ SORU TİPLERİ İÇİN PROMPT
       const singleJsonStructure = `
        {
          "soruTipi": "Analiz edilen sorunun tipi",
          "zorlukSeviyesi": "Sorunun YDS standartlarına göre zorluğu (Kolay, Orta, Zor)",
          "konu": "Sorunun spesifik konusu",
          "dogruCevap": "Doğru seçenek",
          "detayliAciklama": "Detaylı açıklama.",
          "digerSecenekler": [ { "secenek": "A)", "aciklama": "Neden yanlış." } ],
          "kalıplar": [ { "kalip": "İlgili kalıp", "aciklama": "Kalıp açıklaması." } ]
        }
      `;
      if (selectedSoruTipi && selectedSoruTipi !== 'auto') {
        prompt = `${basePromptStart}\nKullanıcı sorunun tipini '${selectedSoruTipi}' olarak belirtti. Analizini buna göre yap. JSON çıktısında 'soruTipi' alanını '${selectedSoruTipi}' olarak doldur.\n${singleJsonStructure}${finalInstruction}`;
      } else {
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
        prompt = `${basePromptStart}\nİlk olarak sorunun tipini belirle ve 'soruTipi' alanını şu listeden doldur:\n${soruTipleriListesi}\nSonra analizini yap.\n${singleJsonStructure}${finalInstruction}`;
      }
    }

    const requestParts = [];
    requestParts.push({ text: prompt });

    if (text) {
        requestParts.push({ text: text });
    } else if (imageData && imageMimeType) {
        requestParts.push({ inlineData: { data: imageData, mimeType: imageMimeType } });
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
