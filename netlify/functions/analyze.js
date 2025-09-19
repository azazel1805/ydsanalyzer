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

    // === YENİ VE GELİŞTİRİLMİŞ YDS'YE ÖZEL PROMPT ===
    const prompt = `
      Sen YDS, YÖKDİL ve e-YDS gibi Türkiye'deki İngilizce yeterlilik sınavlarında uzmanlaşmış, deneyimli bir soru analisti ve eğitmensin.
      Sana bir YDS soru metni veya fotoğrafı verilecek. Görevin, öncelikle sorunun TÜRÜNÜ aşağıda verilen listeden belirlemek ve ardından bu türe uygun, detaylı bir analiz sunmaktır.
      Cevabın MUTLAKA ve SADECE aşağıda tanımlanan JSON formatında olmalıdır. Başka hiçbir metin veya açıklama ekleme.

      İlk olarak, soruyu incele ve 'soruTipi' alanını aşağıdaki listeden en uygun olanıyla doldur:
      - Kelime Bilgisi (Vocabulary / Phrasal Verb)
      - Gramer (Tense, Modal, Preposition, Passive/Active Voice etc.)
      - Bağlaçlar (Conjunctions / Connectors)
      - Cloze Test (Paragrafta boşluk doldurma)
      - Cümle Tamamlama (Sentence Completion)
      - Çeviri (İngilizce-Türkçe / Türkçe-İngilizce)
      - Paragraf Soruları (Reading Comprehension)
      - Diyalog Tamamlama (Dialogue Completion)
      - Anlamca En Yakın Cümle (Restatement)
      - Paragraf Tamamlama (Paragraph Completion)
      - Anlam Bütünlüğünü Bozan Cümle (Irrelevant Sentence)

      Ardından, analizini bu yapıya göre oluştur.
      
      JSON Yapısı:
      {
        "soruTipi": "Belirlediğin soru tipi (yukarıdaki listeden seçilecek)",
        "konu": "Sorunun daha spesifik konusu (Örn: Zıtlık Bağlacı, Perfect Modals, Kelime Anlamı, Zaman Uyumu)",
        "dogruCevap": "Doğru seçeneğin harfi ve içeriği (Örn: 'E) prevalence')",
        "detayliAciklama": "Doğru cevabın neden doğru olduğunu, soru kökündeki ipuçlarını, cümlenin Türkçe anlamını ve ilgili dilbilgisi kuralını adım adım, kapsamlı bir şekilde açıkla. Satır atlaması için '\\n' kullan.",
        "digerSecenekler": [
          {
            "secenek": "A) utilisation",
            "aciklama": "Bu seçeneğin neden yanlış olduğunu, kelimenin anlamını ve bağlama neden uymadığını açıkla."
          },
          {
            "secenek": "B) withdrawal",
            "aciklama": "Bu seçeneğin neden yanlış olduğunu açıkla."
          }
        ],
        "kalıplar": [
          {
            "kalip": "Açıklama metninde geçen önemli bir kalıp veya kelime (Örn: 'vary according to')",
            "aciklama": "Bu kalıbın anlamını, kullanım yerlerini ve örnek cümlelerini içeren detaylı bir açıklama. (Örn: 'vary according to', '...-e göre değişiklik göstermek' anlamına gelir. Örnek: Prices vary according to the season.)"
          }
        ]
      }

      ÖRNEK ANALİZ:
      Soru: "Peanut may very well be the most common food allergy in some populations, but the ---- of a particular food allergy varies according to age and group. A) utilisation B) withdrawal C) precaution D) termination E) prevalence"
      
      Beklenen JSON Cevabı:
      {
        "soruTipi": "Kelime Bilgisi (Vocabulary)",
        "konu": "İsim (Noun) Anlamı ve Bağlam Uyumu",
        "dogruCevap": "E) prevalence",
        "detayliAciklama": "Bu bir kelime bilgisi sorusudur.\\nCümlenin ilk kısmı 'Fıstık, bazı popülasyonlarda en yaygın gıda alerjisi olabilir' derken, ikinci kısmı 'ancak belirli bir gıda alerjisinin ---- yaşa ve gruba göre değişir' diyor. 'but' bağlacı bir zıtlık veya karşılaştırma belirtir. Cümlenin ikinci kısmındaki 'varies according to' (göre değişir) ifadesi, boşluğa 'yaygınlık', 'görülme sıklığı' gibi bir anlam katan bir kelime gelmesi gerektiğini gösteren en önemli ipucudur.\\n'Prevalence' kelimesi 'yaygınlık, sıklık' anlamına geldiği için doğru cevaptır.",
        "digerSecenekler": [
          { "secenek": "A) utilisation", "aciklama": "Anlamı 'kullanım, faydalanma'dır. Bir alerjinin kullanımı anlamsal olarak uygun değildir." },
          { "secenek": "B) withdrawal", "aciklama": "Anlamı 'geri çekilme, para çekme'dir. Cümle bağlamıyla ilgisi yoktur." },
          { "secenek": "C) precaution", "aciklama": "Anlamı 'önlem, tedbir'dir. Bir alerjinin önlemi yaşa göre değişmez, önlemler yaşa göre alınır. Anlamsal olarak yanlıştır." },
          { "secenek": "D) termination", "aciklama": "Anlamı 'sonlandırma, bitirme'dir. Bir alerjinin sonlandırılması bağlama uymaz." }
        ],
        "kalıplar": [
          { "kalip": "vary according to", "aciklama": "'-e göre değişmek/farklılık göstermek' anlamına gelen yaygın bir kalıptır. Örnek: Salaries vary according to experience and qualifications." },
          { "kalip": "may very well be", "aciklama": "'pekala ... olabilir' veya 'büyük bir ihtimalle ...' anlamına gelir ve bir olasılığa vurgu yapmak için kullanılır. Örnek: This may very well be the best solution to our problem." }
        ]
      }

      Şimdi, sana vereceğim soruyu bu yapıya sadık kalarak analiz et. Analiz edilecek soru aşağıdadır:
    `;

    // 'parts' dizisini boş başlatıyoruz ve her elemanı doğru obje formatında ekliyoruz.
    const requestParts = [];
    
    // 1. Parça: Bizim talimatlarımız (prompt)
    requestParts.push({ text: prompt });

    // 2. Parça: Kullanıcının gönderdiği metin veya resim
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

    // Frontend'e göndermeden önce 'soruTipi' alanını da ekleyelim.
    // Eğer Gemini bu alanı eklemezse diye varsayılan bir değer atayabiliriz.
    if (!jsonResponse.soruTipi) {
        jsonResponse.soruTipi = "Genel Analiz";
    }

    // `detayliAciklama` içindeki \n'leri <br> etiketine çevirme işini frontend'e bırakıyoruz.
    // Backend'in temiz veri göndermesi daha iyidir.

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
