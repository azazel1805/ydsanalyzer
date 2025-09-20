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

    let prompt;
    const multiQuestionTypes = ["Cloze Test", "Paragraf Soruları (Reading Comprehension)"];
    const isMultiQuestion = multiQuestionTypes.includes(selectedSoruTipi);

    const basePromptStart = `
      Sen YDS, YÖKDİL ve e-YDS sınavlarında uzmanlaşmış, son derece dikkatli bir soru analisti ve eğitmensin.
      Sana bir YDS sorusu verilecek. Görevin, bu soruyu detaylıca analiz etmek ve cevabını MUTLAKA ve SADECE geçerli bir JSON objesi olarak sunmaktır.
      Cevabının başına veya sonuna asla metin veya markdown ('''json) ekleme. Sadece saf JSON döndür.

      **ANALİZ İÇİN KRİTİK NOTLAR:**
      1.  **Zaman Zarflarına Dikkat Et:** Cümledeki 'until now', 'so far', 'ago' gibi zaman ifadelerini tespit et ve analizinde kullan. 'until now' genellikle Present Perfect Tense (have/has V3) gerektirir.
      2.  **Bağlaçlara Odaklan:** Zıtlık (but, although), sebep-sonuç (because, due to) gibi bağlaçların anlamsal ilişkisini vurgula.
      3.  **Anlam Bütünlüğünü Bozan Cümle Sorularında:** Paragrafın **ana temasını TEK BİR CÜMLEDE** özetle. Sonra her bir cümlenin bu ana temayla doğrudan ilişkili olup olmadığını kontrol et. Konunun genelinden (örn: tarih) daha spesifik bir alt konuya (örn: tarihi mekanların dijital canlandırılması) odaklanıldığını gözden kaçırma. Sadece anahtar kelime tekrarına değil, **fikir akışına** odaklan.
`;
        const finalInstruction = `\nAnaliz edilecek metin aşağıdadır:`;

    if (isMultiQuestion) {
      // ÇOKLU SORU (CLOZE TEST / PARAGRAF) İÇİN PROMPT
      const multiJsonStructure = `
        {
          "soruTipi": "Cloze Test",
          "anaParagraf": "Soruların dayandığı ana paragrafın tam metni. Boşlukları (---) olarak bırak.",
          "analizler": [
            {
              "soruNumarasi": "Sorunun numarası (Örn: 3)",
              "konu": "Bu spesifik sorunun konusu (Örn: Preposition)",
              "zorlukSeviyesi": "Kolay/Orta/Zor",
              "dogruCevap": "Doğru seçenek (Örn: C) With)",
              "detayliAciklama": "Bu sorunun neden doğru olduğunun açıklaması.",
              "digerSecenekler": [ { "secenek": "A) At", "aciklama": "Neden yanlış olduğu." } ],
              "kalıplar": []
            }
          ]
        }
      `;
      prompt = `
        ${basePromptStart}
        Sana verilen soru tipi '${selectedSoruTipi}'. Bu, birden çok numaralı soru içeren bir paragraf demektir.
        Görevin: Paragraftaki TÜM numaralı soruları bul ve HER BİRİ için ayrı ayrı analiz yap.
        Tüm analizleri, aşağıdaki JSON yapısına uygun olarak, 'analizler' dizisinin içine yerleştirerek TEK BİR JSON objesi olarak döndür.
        ${multiJsonStructure}
        ${finalInstruction}
      `;
    }
    else if (selectedSoruTipi === 'Anlam Bütünlüğünü Bozan Cümle (Irrelevant Sentence)') {
    const irrelevantSentenceJsonStructure = `
      {
        "soruTipi": "Anlam Bütünlüğünü Bozan Cümle (Irrelevant Sentence)",
        "analizSüreci": {
            "adim_1_ana_tema": "Paragrafın ana temasını veya odak noktasını tek bir cümle ile özetle.",
            "adim_2_cumle_1_iliskisi": "1. cümlenin bu ana temayla ilişkisini açıkla.",
            "adim_3_cumle_2_iliskisi": "2. cümlenin bir önceki cümleyle ve ana temayla ilişkisini açıkla.",
            "adim_4_cumle_3_iliskisi": "3. cümlenin bir önceki cümleyle ve ana temayla ilişkisini açıkla.",
            "adim_5_cumle_4_iliskisi": "4. cümlenin bir önceki cümleyle ve ana temayla ilişkisini açıkla.",
            "adim_6_cumle_5_iliskisi": "5. cümlenin bir önceki cümleyle ve ana temayla ilişkisini açıkla.",
            "adim_7_sonuc": "Yukarıdaki adımlara dayanarak, hangi cümlenin fikir akışını bozduğunu ve nedenini net bir şekilde belirt."
        },
        "konu": "Paragrafın genel konusu",
        "zorlukSeviyesi": "Kolay/Orta/Zor",
        "dogruCevap": "Doğru seçeneğin harfi ve numarası (Örn: D) IV)",
        "detayliAciklama": "'adim_7_sonuc' bölümünde ulaştığın nihai açıklamayı buraya yaz.",
        "digerSecenekler": [
            { "secenek": "A) I", "aciklama": "Bu cümlenin neden akışı bozmadığını kısaca belirt." },
            { "secenek": "B) II", "aciklama": "Bu cümlenin neden akışı bozmadığını kısaca belirt." }
        ],
        "kalıplar": []
      }
    `;
    prompt = `
        ${basePromptStart}
        Sana verilen soru tipi 'Anlam Bütünlüğünü Bozan Cümle'.
        Bu soruyu çözmek için, senden ADIM ADIM bir analiz süreci izlemeni istiyorum.
        Analizini doğrudan yapmak yerine, cevabını aşağıdaki JSON yapısını doldurarak oluştur.
        Özellikle 'analizSüreci' objesini adım adım doldurman çok önemli. Bu süreç, doğru sonuca ulaşmanı sağlayacaktır.
        'detayliAciklama' alanına, 'analizSüreci.adim_7_sonuc' bölümünde vardığın sonucu yaz.
        
        JSON Yapısı:
        ${irrelevantSentenceJsonStructure}
        ${finalInstruction}
    `;
} 
    else {
      // TEKLİ SORU İÇİN PROMPT
      const singleJsonStructure = `
        {
          "soruTipi": "Analiz edilen sorunun tipi",
          "konu": "Sorunun spesifik konusu",
          "zorlukSeviyesi": "Kolay/Orta/Zor",
          "dogruCevap": "Doğru seçenek",
          "detayliAciklama": "Detaylı açıklama.",
          "digerSecenekler": [ { "secenek": "A) despite", "aciklama": "Neden yanlış." } ],
          "kalıplar": [ { "kalip": "in terms of", "aciklama": "Kalıp açıklaması." } ]
        }
      `;
      
      if (selectedSoruTipi && selectedSoruTipi !== 'auto') {
        // Kullanıcı bir tip seçtiyse
        prompt = `${basePromptStart}\nKullanıcı sorunun tipini '${selectedSoruTipi}' olarak belirtti. Analizini buna göre yap. JSON çıktısında 'soruTipi' alanını '${selectedSoruTipi}' olarak doldur.\n${singleJsonStructure}${finalInstruction}`;
      } else {
        // Otomatik algılama
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
        prompt = `${basePromptStart}\nİlk olarak sorunun tipini belirle ve 'soruTipi' alanını şu listeden doldur:\n${soruTipleriListesi}\nSonra analizini bu tipe uygun şekilde yap.\n${singleJsonStructure}${finalInstruction}`;
      }
    }

    const requestParts = [{ text: prompt }];
    if (text) { requestParts.push({ text: text }); } 
    else if (imageData && imageMimeType) {
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
