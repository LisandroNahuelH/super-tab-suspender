import { formatExtensionTitle } from "./capitalize-word-initials.mjs";

export const CANONICAL_EXTENSION_NAME =
  "Súper Tab Suspender Premium11: Free RAM, Auto Suspend Idle Tabs";

export const CANONICAL_EXTENSION_DESCRIPTION =
  "Suspends tabs by showing a lightweight restore page.";

/** Localized Chrome Web Store titles (max 75 characters). */
export const LOCALIZED_EXTENSION_NAMES = {
  am: "Súper Tab Suspender Premium11: RAM ነፃ፣ ትሮችን አቁም",
  ar: "Súper Tab Suspender Premium11: وفّر RAM وعلّق التبويبات الخاملة",
  bg: "Súper Tab Suspender Premium11: Освободи RAM, Спирай Неактивни Табове",
  bn: "Súper Tab Suspender Premium11: RAM খালি, নিষ্ক্রিয় ট্যাব স্থগিত",
  ca: "Súper Tab Suspender Premium11: Allibera RAM, Suspèn Pestanyes Inactives",
  cs: "Súper Tab Suspender Premium11: Uvolni RAM, Pozastav Neaktivní Karty",
  da: "Súper Tab Suspender Premium11: Frigør RAM, Paus Inaktive Faner",
  de: "Súper Tab Suspender Premium11: RAM Freigeben, Inaktive Tabs Pausieren",
  el: "Súper Tab Suspender Premium11: Ελευθέρωσε RAM, Αναστολή Καρτελών",
  es: "Súper Tab Suspender Premium11: Libera RAM, Suspende Pestañas Inactivas",
  et: "Súper Tab Suspender Premium11: Vabasta RAM, Peata Passiivsed Sakid",
  fa: "Súper Tab Suspender Premium11: آزادسازی RAM، تعلیق تب‌های بیکار",
  fi: "Súper Tab Suspender Premium11: Vapauta RAM, Keskeytä Joutilaat Välilehdet",
  fil: "Súper Tab Suspender Premium11: Free RAM, I-Suspend Idle Tabs",
  fr: "Súper Tab Suspender Premium11: Libère La RAM, Suspend Les Onglets Inactifs",
  gu: "Súper Tab Suspender Premium11: RAM મુક્ત, નિષ્ક્રિય ટેબ અટકાવો",
  he: "Súper Tab Suspender Premium11: שחרר RAM, השעה כרטיסיות לא פעילות",
  hi: "Súper Tab Suspender Premium11: RAM खाली करें, निष्क्रिय टैब सस्पेंड",
  hr: "Súper Tab Suspender Premium11: Oslobodi RAM, Obustavi Neaktivne Kartice",
  hu: "Súper Tab Suspender Premium11: RAM Felszabadítás, Üresjáratú Lapok",
  id: "Súper Tab Suspender Premium11: Bebaskan RAM, Tangguhkan Tab Idle",
  it: "Súper Tab Suspender Premium11: Libera RAM, Sospendi Schede Inattive",
  ja: "Súper Tab Suspender Premium11: RAM解放、アイドルタブを自動停止",
  kn: "Súper Tab Suspender Premium11: RAM ಮುಕ್ತ, ನಿಷ್ಕ್ರಿಯ ಟ್ಯಾಬ್ ಸಸ್ಪೆಂಡ್",
  ko: "Súper Tab Suspender Premium11: RAM 확보, 유휴 탭 자동 일시중지",
  lt: "Súper Tab Suspender Premium11: Atlaisvink RAM, Sustabdyk Neaktyvius",
  lv: "Súper Tab Suspender Premium11: Atbrīvo RAM, Apturi Dīkstāves Cilnes",
  ml: "Súper Tab Suspender Premium11: RAM മോചിപ്പിക്കുക, നിഷ്‌ക്രിയ ടാബ്",
  mr: "Súper Tab Suspender Premium11: RAM मोकळे, निष्क्रिय टॅब सस्पेंड",
  ms: "Súper Tab Suspender Premium11: Bebaskan RAM, Tangguh Tab Melahu",
  nl: "Súper Tab Suspender Premium11: Maak RAM Vrij, Pauzeer Inactieve Tabs",
  no: "Súper Tab Suspender Premium11: Frigjør RAM, Paus Inaktive Faner",
  pl: "Súper Tab Suspender Premium11: Zwolnij RAM, Wstrzymaj Bezczynne Karty",
  pt_BR: "Súper Tab Suspender Premium11: Liberar RAM, Suspender Abas Ociosas",
  pt_PT: "Súper Tab Suspender Premium11: Libertar RAM, Suspender Separadores",
  ro: "Súper Tab Suspender Premium11: Eliberează RAM, Suspendă File Inactive",
  ru: "Súper Tab Suspender Premium11: Освободи RAM, Спящие Вкладки",
  sk: "Súper Tab Suspender Premium11: Uvoľni RAM, Pozastav Neaktívne Karty",
  sl: "Súper Tab Suspender Premium11: Sprosti RAM, Zaustavi Nedejavne Zavihke",
  sr: "Súper Tab Suspender Premium11: Oslobodi RAM, Obustavi Neaktivne Kartice",
  sv: "Súper Tab Suspender Premium11: Frigör RAM, Pausa Inaktiva Flikar",
  sw: "Súper Tab Suspender Premium11: Komboa RAM, Simamisha Tab Zisizotumika",
  ta: "Súper Tab Suspender Premium11: RAM விடுவி, செயலற்ற தாவல் நிறுத்து",
  te: "Súper Tab Suspender Premium11: RAM ఖాళీ, నిష్క్రియ ట్యాబ్ సస్పెండ్",
  th: "Súper Tab Suspender Premium11: เพิ่ม RAM ระงับแท็บที่ไม่ใช้",
  tr: "Súper Tab Suspender Premium11: RAM Boşalt, Boş Sekmeleri Askıya Al",
  uk: "Súper Tab Suspender Premium11: Звільни RAM, Призупини Неактивні",
  vi: "Súper Tab Suspender Premium11: Giải Phóng RAM, Treo Tab Nhàn Rỗi",
  zh_CN: "Súper Tab Suspender Premium11: 释放内存，自动挂起闲置标签",
  zh_TW: "Súper Tab Suspender Premium11: 釋放記憶體，自動暫停閒置分頁"
};

export function resolveExtensionName(locale) {
  const raw = LOCALIZED_EXTENSION_NAMES[locale] ?? CANONICAL_EXTENSION_NAME;
  return formatExtensionTitle(locale, raw);
}

for (const [locale, name] of Object.entries({
  en: CANONICAL_EXTENSION_NAME,
  ...LOCALIZED_EXTENSION_NAMES
})) {
  if (name.length > 75) {
    throw new Error(`manifest-store-copy: [${locale}] extensionName exceeds 75 (${name.length}).`);
  }
}

if (CANONICAL_EXTENSION_DESCRIPTION.length > 132) {
  throw new Error(
    `manifest-store-copy: canonical extensionDescription exceeds 132 (${CANONICAL_EXTENSION_DESCRIPTION.length}).`
  );
}
