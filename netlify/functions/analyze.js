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
  Sen YDS, YÖKDİL ve e-YDS sınavlarında uzmanlaşmış, son derece dikkatli bir soru analisti ve eğitmensin.
  Sana bir YDS sorusu verilecek. Görevin, bu soruyu detaylıca analiz etmek ve cevabını MUTLAKA ve SADECE JSON formatında sunmaktır.
  Başka hiçbir metin veya açıklama ekleme.

  **ANALİZ İÇİN KRİTİK NOTLAR:**
  1.  **Zaman Zarflarına (Tense Markers) Özellikle Dikkat Et:** Cümledeki 'until now', 'so far', 'since', 'ago', 'last year', 'by the time' gibi zaman ifadelerini tespit et. Bu ifadelerin hangi tense'i gerektirdiğini analizinin merkezine koy. Örneğin, 'until now' veya 'so far' genellikle Present Perfect Tense (have/has V3) gerektirir. Bu kuralı gözden kaçırma.
  2.  **Bağlaçlara Dikkat Et:** 'but', 'however', 'although' (zıtlık), 'because', 'due to' (sebep-sonuç), 'therefore' (sonuç) gibi bağlaçların cümleler arası kurduğu anlamsal ilişkiyi mutlaka vurgula.
  3.  **Kelime Sorularında Bağlamı İncele:** Kelimenin sadece sözlük anlamına değil, cümlenin genel bağlamına uyup uymadığını kontrol et.
`;
    const finalInstruction = `\nŞimdi, sana vereceğim soruyu bu yapıya sadık kalarak analiz et. Analiz edilecek soru aşağıdadır:`;

    if (isMultiQuestion) {
      // ÇOKLU SORU TİPLERİ İÇİN PROMPT
      const multiJsonStructure = `
        {
          "soruTipi": "Cloze Test",
          "anaParagraf": "Soruların dayandığı ana paragrafın tam metni. Boşlukları (---) olarak bırak.",
          "analizler": [
            {
              "soruNumarasi": "3",
              "konu": "Preposition (Edat)",
              "zorlukSeviyesi": "Kolay",
              "dogruCevap": "C) With",
              "detayliAciklama": "'with a 300-year history' kalıbı '300 yıllık bir tarihe sahip olarak' anlamına gelir. Bir özelliğe, bir şeye 'sahip olma' anlamını 'with' edatı verir. Diğer edatlar bu anlamsal bağlantıyı kurmaz.",
              "digerSecenekler": [ 
                { "secenek": "A) At", "aciklama": "Belirli bir noktada bulunma bildirir, 'sahip olma' anlamı vermez." },
                { "secenek": "B) Into", "aciklama": "İçine doğru hareket bildirir, anlamsal olarak uygun değildir." }
              ],
              "kalıplar": []
            },
            {
              "soruNumarasi": "4",
              "konu": "Adverb (Zarf)",
              "zorlukSeviyesi": "Orta",
              "dogruCevap": "A) immensely",
              "detayliAciklama": "Cümle 'Fransız parfümleri ---- geliştirilir' diyor. Boşluğa fiili (developed) niteleyecek bir zarf gelmelidir. 'immensely' kelimesi 'çok büyük ölçüde, son derece' anlamına gelerek cümlenin anlamını en iyi şekilde tamamlar.",
              "digerSecenekler": [ 
                { "secenek": "B) abruptly", "aciklama": "'Aniden' anlamına gelir, bir geliştirme süreci için mantıksızdır." },
                { "secenek": "C) concisely", "aciklama": "'Kısaca, öz bir şekilde' anlamına gelir, anlamsal olarak uymaz." }
              ],
              "kalıplar": []
            }
          ]
        }
      `;
      prompt = `
        ${basePromptStart}
        Sana verilen soru tipi '${selectedSoruTipi}'. Bu format, içinde birden çok numaralandırılmış boşluk bulunan bir paragraf ve her boşluk için ayrı seçenekler içerir.
        Görevin:
        1.  Ana paragrafı tespit et.
        2.  Paragraftaki TÜM numaralı boşlukları (Örn: (3)----, 4., (5)----) ve her birine ait seçenek gruplarını bul.
        3.  HER BİR SORU İÇİN ayrı ve tam bir analiz yap.
        4.  Tüm bu analizleri, aşağıda bir örneği verilen JSON formatında, 'analizler' dizisinin içine ayrı objeler olarak yerleştirerek TEK BİR JSON objesi olarak döndür.
        
        ÖRNEK ÇIKTI YAPISI:
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
