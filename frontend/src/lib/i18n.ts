/**
 * Comprehensive Multilingual Localization Engine (i18n).
 * Covers English, Hindi (हिंदी), and Marathi (मराठी) across the entire user interface.
 */

export type SupportedLanguage = 'en-IN' | 'hi-IN' | 'mr-IN';

export interface TranslationDictionary {
  brandTitle: string;
  brandTagline: string;
  verifiedGazettes: string;
  adminModeButton: string;
  executiveHudButton: string;
  searchCommand: string;
  detectWard: string;
  detectingWard: string;
  wardDetected: string;
  newSession: string;
  newChat: string;
  chatHistoryTitle: string;
  today: string;
  previous7Days: string;
  older: string;
  noHistory: string;
  sessionsCount: string;
  deleteSessionConfirm: string;
  clearHistory: string;
  inputPlaceholder: string;
  listeningVoice: string;
  audioToggleOn: string;
  audioToggleOff: string;
  sendQuery: string;
  verifiedCitations: string;
  statutorySlaTriage: string;
  bentoGrievanceTitle: string;
  bentoGrievanceDesc: string;
  bentoTaxTitle: string;
  bentoTaxDesc: string;
  bentoSafetyTitle: string;
  bentoSafetyDesc: string;
  bentoBuildingTitle: string;
  bentoBuildingDesc: string;
  pillPropertyTax: string;
  pillWaterBurst: string;
  pillSanitation: string;
  pillBuildingPermits: string;
  welcomeMessage: string;
}

export const TRANSLATIONS: Record<SupportedLanguage, TranslationDictionary> = {
  'en-IN': {
    brandTitle: 'NAGRIK',
    brandTagline: 'Statutory Civic Core • 2026 Gazettes Verified',
    verifiedGazettes: '2026 Municipal Gazettes Verified',
    adminModeButton: 'Ward Admin',
    executiveHudButton: 'Executive HUD',
    searchCommand: 'Search',
    detectWard: 'Detect My Ward',
    detectingWard: 'Locating...',
    wardDetected: 'Ward Detected',
    newSession: 'New Session',
    newChat: 'New Chat',
    chatHistoryTitle: 'Recent Inquiries',
    today: 'Today',
    previous7Days: 'Previous 7 Days',
    older: 'Older Inquiries',
    noHistory: 'No past inquiries stored',
    sessionsCount: 'Stored (Max 20)',
    deleteSessionConfirm: 'Delete this session?',
    clearHistory: 'Clear History',
    inputPlaceholder: 'Ask about property tax, water bills, building permits, or report a civic issue...',
    listeningVoice: 'Listening to regional citizen speech...',
    audioToggleOn: 'Audio Voice Enabled',
    audioToggleOff: 'Enable Audio Voice',
    sendQuery: 'Send Inquiry',
    verifiedCitations: 'Verified Citations:',
    statutorySlaTriage: 'Statutory SLA Triage Engine',
    bentoGrievanceTitle: 'Automated Grievance Classification & Docketing',
    bentoGrievanceDesc: 'Categorizes complaints across 10 municipal departments, computes statutory SLA countdowns (4h emergency to 48h civil), and generates official verifiable dockets.',
    bentoTaxTitle: 'Property Tax & 10% Rebate Formula',
    bentoTaxDesc: 'Section 128 calculations, early bird payment deadlines, and verified statutory receipt procedures.',
    bentoSafetyTitle: 'Life-Safety Emergency Interceptor',
    bentoSafetyDesc: 'Deterministic gates intercept building collapses, gas leaks, and live wire snaps before running vector search.',
    bentoBuildingTitle: 'Building Plan Approvals (OBPAS) & Setback Standards',
    bentoBuildingDesc: 'Official statutory setback standards, auto-DCR scrutinies, occupancy certificates, and 15-day clearance SLAs for residential plots.',
    pillPropertyTax: 'Property Tax 10% Rebate',
    pillWaterBurst: 'Report Water Burst (4h SLA)',
    pillSanitation: 'Sanitation Bylaw Fines',
    pillBuildingPermits: 'Building Plan Permits (OBPAS)',
    welcomeMessage: 'Welcome to **Nagrik AI (नागरिक AI)** — your official Municipal Operating System & Concierge.\n\nAll intelligence is grounded deterministically in **2026 Municipal Gazettes**, **Property Tax Bylaws**, **Water Supply Charters**, and **Building Regulations** with zero hallucination.\n\nAsk any municipal inquiry below or select a statutory service to begin.',
  },
  'hi-IN': {
    brandTitle: 'नागरिक',
    brandTagline: 'वैधानिक नागरिक कोर • २०२६ राजपत्र प्रमाणित',
    verifiedGazettes: '२०२६ नगरपालिका राजपत्र प्रमाणित',
    adminModeButton: 'वार्ड एडमिन',
    executiveHudButton: 'कार्यकारी डैशबोर्ड',
    searchCommand: 'खोजें',
    detectWard: 'वार्ड का पता लगाएं',
    detectingWard: 'स्थान खोज रहे हैं...',
    wardDetected: 'वार्ड की पहचान हुई',
    newSession: 'नया सत्र',
    newChat: 'नई बातचीत',
    chatHistoryTitle: 'हालिया पूछताछ',
    today: 'आज',
    previous7Days: 'पिछले ७ दिन',
    older: 'पुरानी पूछताछ',
    noHistory: 'कोई पिछला इतिहास नहीं',
    sessionsCount: 'सहेजे गए (अधिकतम २०)',
    deleteSessionConfirm: 'क्या आप इस सत्र को हटाना चाहते हैं?',
    clearHistory: 'इतिहास साफ़ करें',
    inputPlaceholder: 'संपत्ति कर, पानी के बिल, भवन अनुमति के बारे में पूछें या नागरिक समस्या दर्ज करें...',
    listeningVoice: 'नागरिक आवाज सुनी जा रही है...',
    audioToggleOn: 'ध्वनि प्रतिक्रिया सक्रिय',
    audioToggleOff: 'ध्वनि प्रतिक्रिया चालू करें',
    sendQuery: 'पूछताछ भेजें',
    verifiedCitations: 'सत्यापित संदर्भ:',
    statutorySlaTriage: 'वैधानिक SLA ट्राइएज इंजन',
    bentoGrievanceTitle: 'स्वचालित शिकायत वर्गीकरण एवं डॉकेटिंग',
    bentoGrievanceDesc: '१० नगरपालिका विभागों में शिकायतों को वर्गीकृत करता है, वैधानिक SLA समयसीमा की गणना करता है और आधिकारिक डॉकेट तैयार करता है।',
    bentoTaxTitle: 'संपत्ति कर एवं १०% छूट नियम',
    bentoTaxDesc: 'धारा १२८ के तहत कर गणना, समयपूर्व भुगतान छूट एवं आधिकारिक रसीद प्रक्रिया।',
    bentoSafetyTitle: 'जीवन-सुरक्षा आपातकालीन इंटरसेप्टर',
    bentoSafetyDesc: 'भवन ढहने, गैस रिसाव या बिजली के तार टूटने पर तत्काल आपातकालीन प्रतिक्रिया।',
    bentoBuildingTitle: 'भवन योजना स्वीकृति (OBPAS) एवं सेटबैक मानक',
    bentoBuildingDesc: 'आवासीय भूखंडों हेतु आधिकारिक सेटबैक मानक एवं १५ कार्यदिवस की वैधानिक स्वीकृति SLA।',
    pillPropertyTax: 'संपत्ति कर १०% छूट',
    pillWaterBurst: 'पानी रिसाव रिपोर्ट (४ घंटे SLA)',
    pillSanitation: 'स्वच्छता उपनियम जुर्माना',
    pillBuildingPermits: 'भवन योजना अनुमति (OBPAS)',
    welcomeMessage: '**नागरिक AI (Nagrik AI)** में आपका स्वागत है — आपका आधिकारिक नगरपालिका संचालन तंत्र एवं नागरिक सहायक।\n\nसभी जानकारी **२०२६ नगरपालिका राजपत्र**, **संपत्ति कर उपनियम**, **जल आपूर्ति चार्टर** एवं **भवन विनियमों** पर आधारित है।\n\nनीचे अपनी नागरिक पूछताछ दर्ज करें या सेवा का चयन करें।',
  },
  'mr-IN': {
    brandTitle: 'नागरिक',
    brandTagline: 'वैधानिक नागरी गाभा • २०२६ राजपत्र प्रमाणित',
    verifiedGazettes: '२०२६ महापालिका राजपत्र प्रमाणित',
    adminModeButton: 'वॉर्ड ॲडमिन',
    executiveHudButton: 'कार्यकारी डॅशबोर्ड',
    searchCommand: 'शोधा',
    detectWard: 'माझा प्रभाग शोधा',
    detectingWard: 'स्थान शोधत आहे...',
    wardDetected: 'प्रभाग ओळखला',
    newSession: 'नवीन सत्र',
    newChat: 'नवीन संभाषण',
    chatHistoryTitle: 'मागील विचारणा',
    today: 'आज',
    previous7Days: 'मागील ७ दिवस',
    older: 'जुनी विचारणा',
    noHistory: 'कोणताही मागील इतिहास नाही',
    sessionsCount: 'साठवलेले (कमाल २०)',
    deleteSessionConfirm: 'हे सत्र हटवायचे आहे का?',
    clearHistory: 'इतिहास पुसा',
    inputPlaceholder: 'मालमत्ता कर, पाणी देयके, बांधकाम परवानगी विचारा किंवा तक्रार नोंदवा...',
    listeningVoice: 'नागरी आवाज ऐकत आहे...',
    audioToggleOn: 'ध्वनी प्रतिसाद सुरू',
    audioToggleOff: 'ध्वनी प्रतिसाद सुरू करा',
    sendQuery: 'विचारणा पाठवा',
    verifiedCitations: 'प्रमाणित संदर्भ:',
    statutorySlaTriage: 'वैधानिक SLA ट्राइएज इंजिन',
    bentoGrievanceTitle: 'स्वयंचलित तक्रार वर्गीकरण व डॉकेट निर्मिती',
    bentoGrievanceDesc: '१० महापालिका विभागांमध्ये तक्रारींचे वर्गीकरण करते, वैधानिक SLA वेळेची मोजणी करते आणि अधिकृत डॉकेट तयार करते.',
    bentoTaxTitle: 'मालमत्ता कर व १०% सवलत सूत्र',
    bentoTaxDesc: 'कलम १२८ नुसार कर आकारणी, मुदतपूर्व भरणा सवलत आणि अधिकृत पावती कार्यपद्धती.',
    bentoSafetyTitle: 'जीव-सुरक्षा आणीबाणी नियंत्रक',
    bentoSafetyDesc: 'इमारत कोसळणे, गॅस गळती किंवा विजेची तार तुटल्यास तातडीने आणीबाणी सेवा सूचना.',
    bentoBuildingTitle: 'बांधकाम नकाशा मंजुरी (OBPAS) व सेटबॅक नियम',
    bentoBuildingDesc: 'निवासी भूखंडांसाठी अधिकृत सेटबॅक नियम आणि १५ कामकाजाच्या दिवसांची मंजुरी SLA.',
    pillPropertyTax: 'मालमत्ता कर १०% सवलत',
    pillWaterBurst: 'पाणी गळती तक्रार (४ तास SLA)',
    pillSanitation: 'स्वच्छता पोटनियम दंड',
    pillBuildingPermits: 'बांधकाम परवानग्या (OBPAS)',
    welcomeMessage: '**नागरिक AI (Nagrik AI)** मध्ये आपले स्वागत आहे — आपली अधिकृत महापालिका संचालन प्रणाली व नागरी सहाय्यक.\n\nसर्व माहिती **२०२६ महापालिका राजपत्रे**, **मालमत्ता कर पोटनियम**, **पाणीपुरवठा सनद** आणि **बांधकाम नियमावली**वर पूर्णपणे आधारित आहे.\n\nखाली आपली नागरी विचारणा नोंदवा किंवा सेवा निवडा.',
  },
};

export function getTranslation(lang: string): TranslationDictionary {
  if (lang.startsWith('hi')) return TRANSLATIONS['hi-IN'];
  if (lang.startsWith('mr')) return TRANSLATIONS['mr-IN'];
  return TRANSLATIONS['en-IN'];
}
