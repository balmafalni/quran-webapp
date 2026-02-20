import fs from "node:fs";
import path from "node:path";

const IN_TXT = path.resolve("./tanzil-simple-txt-2.txt");
const OUT_JSON = path.resolve("./quran-simple.json");

// Surah names (English + Arabic)
const SURAH_NAMES = [
  ["Al-Fatihah","الفاتحة"],["Al-Baqarah","البقرة"],["Aal-E-Imran","آل عمران"],["An-Nisa","النساء"],["Al-Ma'idah","المائدة"],
  ["Al-An'am","الأنعام"],["Al-A'raf","الأعراف"],["Al-Anfal","الأنفال"],["At-Tawbah","التوبة"],["Yunus","يونس"],
  ["Hud","هود"],["Yusuf","يوسف"],["Ar-Ra'd","الرعد"],["Ibrahim","إبراهيم"],["Al-Hijr","الحجر"],
  ["An-Nahl","النحل"],["Al-Isra","الإسراء"],["Al-Kahf","الكهف"],["Maryam","مريم"],["Taha","طه"],
  ["Al-Anbiya","الأنبياء"],["Al-Hajj","الحج"],["Al-Mu'minun","المؤمنون"],["An-Nur","النور"],["Al-Furqan","الفرقان"],
  ["Ash-Shu'ara","الشعراء"],["An-Naml","النمل"],["Al-Qasas","القصص"],["Al-Ankabut","العنكبوت"],["Ar-Rum","الروم"],
  ["Luqman","لقمان"],["As-Sajdah","السجدة"],["Al-Ahzab","الأحزاب"],["Saba","سبأ"],["Fatir","فاطر"],
  ["Ya-Sin","يس"],["As-Saffat","الصافات"],["Sad","ص"],["Az-Zumar","الزمر"],["Ghafir","غافر"],
  ["Fussilat","فصلت"],["Ash-Shura","الشورى"],["Az-Zukhruf","الزخرف"],["Ad-Dukhan","الدخان"],["Al-Jathiyah","الجاثية"],
  ["Al-Ahqaf","الأحقاف"],["Muhammad","محمد"],["Al-Fath","الفتح"],["Al-Hujurat","الحجرات"],["Qaf","ق"],
  ["Adh-Dhariyat","الذاريات"],["At-Tur","الطور"],["An-Najm","النجم"],["Al-Qamar","القمر"],["Ar-Rahman","الرحمن"],
  ["Al-Waqi'ah","الواقعة"],["Al-Hadid","الحديد"],["Al-Mujadila","المجادلة"],["Al-Hashr","الحشر"],["Al-Mumtahanah","الممتحنة"],
  ["As-Saff","الصف"],["Al-Jumu'ah","الجمعة"],["Al-Munafiqun","المنافقون"],["At-Taghabun","التغابن"],["At-Talaq","الطلاق"],
  ["At-Tahrim","التحريم"],["Al-Mulk","الملك"],["Al-Qalam","القلم"],["Al-Haqqah","الحاقة"],["Al-Ma'arij","المعارج"],
  ["Nuh","نوح"],["Al-Jinn","الجن"],["Al-Muzzammil","المزمل"],["Al-Muddaththir","المدثر"],["Al-Qiyamah","القيامة"],
  ["Al-Insan","الإنسان"],["Al-Mursalat","المرسلات"],["An-Naba","النبأ"],["An-Nazi'at","النازعات"],["Abasa","عبس"],
  ["At-Takwir","التكوير"],["Al-Infitar","الانفطار"],["Al-Mutaffifin","المطففين"],["Al-Inshiqaq","الانشقاق"],["Al-Buruj","البروج"],
  ["At-Tariq","الطارق"],["Al-A'la","الأعلى"],["Al-Ghashiyah","الغاشية"],["Al-Fajr","الفجر"],["Al-Balad","البلد"],
  ["Ash-Shams","الشمس"],["Al-Layl","الليل"],["Ad-Duha","الضحى"],["Ash-Sharh","الشرح"],["At-Tin","التين"],
  ["Al-Alaq","العلق"],["Al-Qadr","القدر"],["Al-Bayyinah","البينة"],["Az-Zalzalah","الزلزلة"],["Al-Adiyat","العاديات"],
  ["Al-Qari'ah","القارعة"],["At-Takathur","التكاثر"],["Al-Asr","العصر"],["Al-Humazah","الهمزة"],["Al-Fil","الفيل"],
  ["Quraysh","قريش"],["Al-Ma'un","الماعون"],["Al-Kawthar","الكوثر"],["Al-Kafirun","الكافرون"],["An-Nasr","النصر"],
  ["Al-Masad","المسد"],["Al-Ikhlas","الإخلاص"],["Al-Falaq","الفلق"],["An-Nas","الناس"]
];

function parseTxt2(raw) {
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const surahs = Array.from({ length: 114 }, (_, i) => {
    const [en, ar] = SURAH_NAMES[i] ?? [`Surah ${i+1}`, `سورة ${i+1}`];
    return { number: i + 1, name_en: en, name_ar: ar, ayahs: [] };
  });

  for (const line of lines) {
    const parts = line.includes("|") ? line.split("|") : line.split("\t");
    if (parts.length < 3) continue;

    const s = Number(parts[0]);
    const a = Number(parts[1]);
    const text = parts.slice(2).join(line.includes("|") ? "|" : "\t"); // verbatim

    if (!Number.isFinite(s) || !Number.isFinite(a) || s < 1 || s > 114 || a < 1) continue;
    surahs[s - 1].ayahs.push({ n: a, text });
  }

  if (!surahs.every(s => s.ayahs.length > 0)) {
    throw new Error("Parsed data incomplete. Ensure you downloaded Tanzil Simple txt-2 (with aya numbers).");
  }
  return surahs;
}

function main() {
  if (!fs.existsSync(IN_TXT)) {
    console.error(`❌ Missing: ${IN_TXT}`);
    console.error("Put Tanzil Simple txt-2 in project root as: tanzil-simple-txt-2.txt");
    process.exit(1);
  }

  const raw = fs.readFileSync(IN_TXT, "utf8");
  const surahs = parseTxt2(raw);

  const out = {
    meta: {
      source: "Tanzil.net",
      textType: "Simple",
      format: "txt-2",
      license: "CC BY 3.0",
      note: "Text is verbatim from Tanzil. Do not change the Arabic text. Include attribution + link to tanzil.net."
    },
    surahs
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(out), "utf8");
  console.log(`✅ Wrote ${OUT_JSON}`);
}

main();