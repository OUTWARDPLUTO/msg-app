const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src', 'locales');

const en = {
  nav: {
    overview: 'Overview',
    members: 'Members',
    attendance: 'Attend.',
    store: 'Store',
    more: 'More'
  },
  settings: {
    title: 'App Settings',
    generalPreferences: 'General Preferences',
    appTheme: 'App Theme',
    darkModeEnabled: 'Dark mode enabled',
    lightModeEnabled: 'Light mode enabled',
    btnLight: '☀️ Light',
    btnDark: '🌙 Dark',
    weightUnits: 'Weight Units',
    weightUnitsDesc: 'Units for products and records',
    weekStartsOn: 'Week Starts On',
    weekStartsOnDesc: 'Calendar and reports layout',
    ownerNotifications: 'Owner Notifications',
    pushNotifications: 'Push Notifications',
    pushNotificationsDesc: 'Receive alerts on device',
    attendanceAlerts: 'Attendance Alerts',
    attendanceAlertsDesc: 'When members check in',
    subscriptionAlerts: 'Subscription Alerts',
    subscriptionAlertsDesc: 'Notify when memberships are expiring',
    languagePreference: 'Language Preference',
    languagePreferenceDesc: 'Select the language for reports and the app interface.'
  }
};

const translations = {
  'en-IN': en,
  'en-US': en,
  'en-GB': en,
  'hi-IN': {
    nav: { overview: 'अवलोकन', members: 'सदस्य', attendance: 'उपस्थिति', store: 'स्टोर', more: 'अधिक' },
    settings: {
      title: 'ऐप सेटिंग्स', generalPreferences: 'सामान्य प्राथमिकताएं', appTheme: 'ऐप थीम',
      darkModeEnabled: 'डार्क मोड सक्षम है', lightModeEnabled: 'लाइट मोड सक्षम है',
      btnLight: '☀️ लाइट', btnDark: '🌙 डार्क',
      weightUnits: 'वजन इकाइयां', weightUnitsDesc: 'उत्पादों और रिकॉर्ड के लिए इकाइयां',
      weekStartsOn: 'सप्ताह शुरू होता है', weekStartsOnDesc: 'कैलेंडर और रिपोर्ट लेआउट',
      ownerNotifications: 'मालिक सूचनाएं', pushNotifications: 'पुश सूचनाएं', pushNotificationsDesc: 'डिवाइस पर अलर्ट प्राप्त करें',
      attendanceAlerts: 'उपस्थिति अलर्ट', attendanceAlertsDesc: 'जब सदस्य चेक-इन करते हैं',
      subscriptionAlerts: 'सदस्यता अलर्ट', subscriptionAlertsDesc: 'सदस्यता समाप्त होने पर सूचित करें',
      languagePreference: 'भाषा प्राथमिकता', languagePreferenceDesc: 'रिपोर्ट और ऐप इंटरफ़ेस के लिए भाषा चुनें।'
    }
  },
  'es-ES': {
    nav: { overview: 'Resumen', members: 'Miembros', attendance: 'Asistencia', store: 'Tienda', more: 'Más' },
    settings: {
      title: 'Ajustes de la aplicación', generalPreferences: 'Preferencias generales', appTheme: 'Tema',
      darkModeEnabled: 'Modo oscuro activado', lightModeEnabled: 'Modo claro activado',
      btnLight: '☀️ Claro', btnDark: '🌙 Oscuro',
      weightUnits: 'Unidades de peso', weightUnitsDesc: 'Unidades para productos',
      weekStartsOn: 'Semana empieza el', weekStartsOnDesc: 'Calendario y reportes',
      ownerNotifications: 'Notificaciones del propietario', pushNotifications: 'Notificaciones push', pushNotificationsDesc: 'Recibir alertas en el dispositivo',
      attendanceAlerts: 'Alertas de asistencia', attendanceAlertsDesc: 'Cuando los miembros registran su entrada',
      subscriptionAlerts: 'Alertas de suscripción', subscriptionAlertsDesc: 'Avisar cuando expiren',
      languagePreference: 'Preferencia de idioma', languagePreferenceDesc: 'Seleccione el idioma de la aplicación.'
    }
  },
  'fr-FR': {
    nav: { overview: 'Aperçu', members: 'Membres', attendance: 'Présence', store: 'Boutique', more: 'Plus' },
    settings: {
      title: 'Paramètres', generalPreferences: 'Préférences générales', appTheme: 'Thème',
      darkModeEnabled: 'Mode sombre activé', lightModeEnabled: 'Mode clair activé',
      btnLight: '☀️ Clair', btnDark: '🌙 Sombre',
      weightUnits: 'Unités de poids', weightUnitsDesc: 'Unités pour les produits',
      weekStartsOn: 'La semaine commence', weekStartsOnDesc: 'Calendrier et rapports',
      ownerNotifications: 'Notifications', pushNotifications: 'Notifications push', pushNotificationsDesc: 'Recevoir des alertes',
      attendanceAlerts: 'Alertes de présence', attendanceAlertsDesc: 'Quand les membres pointent',
      subscriptionAlerts: 'Alertes d\'abonnement', subscriptionAlertsDesc: 'Notifier l\'expiration',
      languagePreference: 'Préférence de langue', languagePreferenceDesc: 'Sélectionnez la langue de l\'application.'
    }
  },
  'de-DE': {
    nav: { overview: 'Übersicht', members: 'Mitglieder', attendance: 'Anwesenheit', store: 'Laden', more: 'Mehr' },
    settings: {
      title: 'Einstellungen', generalPreferences: 'Allgemeine Einstellungen', appTheme: 'App-Design',
      darkModeEnabled: 'Dunkelmodus aktiv', lightModeEnabled: 'Heller Modus aktiv',
      btnLight: '☀️ Hell', btnDark: '🌙 Dunkel',
      weightUnits: 'Gewichtseinheiten', weightUnitsDesc: 'Einheiten für Produkte',
      weekStartsOn: 'Wochenstart', weekStartsOnDesc: 'Kalender- und Berichtslayout',
      ownerNotifications: 'Benachrichtigungen', pushNotifications: 'Push-Benachrichtigungen', pushNotificationsDesc: 'Benachrichtigungen auf dem Gerät empfangen',
      attendanceAlerts: 'Anwesenheitsalarme', attendanceAlertsDesc: 'Wenn Mitglieder einchecken',
      subscriptionAlerts: 'Abo-Benachrichtigungen', subscriptionAlertsDesc: 'Bei Ablauf benachrichtigen',
      languagePreference: 'Spracheinstellungen', languagePreferenceDesc: 'Wählen Sie die Sprache für die App.'
    }
  },
  'mr-IN': {
    nav: { overview: 'आढावा', members: 'सदस्य', attendance: 'उपस्थिती', store: 'स्टोअर', more: 'अधिक' },
    settings: {
      title: 'अॅप सेटिंग्ज', generalPreferences: 'सामान्य प्राधान्ये', appTheme: 'अॅप थीम',
      darkModeEnabled: 'डार्क मोड सक्षम', lightModeEnabled: 'लाइट मोड सक्षम',
      btnLight: '☀️ लाइट', btnDark: '🌙 डार्क',
      weightUnits: 'वजन एकके', weightUnitsDesc: 'उत्पादनांसाठी एकके',
      weekStartsOn: 'आठवडा सुरू होतो', weekStartsOnDesc: 'कॅलेंडर लेआउट',
      ownerNotifications: 'मालक सूचना', pushNotifications: 'पुश सूचना', pushNotificationsDesc: 'डिव्हाइसवर सूचना मिळवा',
      attendanceAlerts: 'उपस्थिती सूचना', attendanceAlertsDesc: 'जेव्हा सदस्य चेक-इन करतात',
      subscriptionAlerts: 'सदस्यता सूचना', subscriptionAlertsDesc: 'सदस्यता संपल्यावर कळवा',
      languagePreference: 'भाषा प्राधान्य', languagePreferenceDesc: 'अॅपची भाषा निवडा.'
    }
  },
  'gu-IN': {
    nav: { overview: 'ઝાંખી', members: 'સભ્યો', attendance: 'હાજરી', store: 'સ્ટોર', more: 'વધુ' },
    settings: { title: 'એપ્લિકેશન સેટિંગ્સ', generalPreferences: 'સામાન્ય પસંદગીઓ', appTheme: 'થીમ', darkModeEnabled: 'ડાર્ક મોડ ચાલુ', lightModeEnabled: 'લાઇટ મોડ ચાલુ', btnLight: '☀️ લાઇટ', btnDark: '🌙 ડાર્ક', weightUnits: 'વજન એકમો', weightUnitsDesc: 'એકમો', weekStartsOn: 'અઠવાડિયું શરૂ થાય છે', weekStartsOnDesc: 'કૅલેન્ડર', ownerNotifications: 'માલિક સૂચનાઓ', pushNotifications: 'પુશ સૂચનાઓ', pushNotificationsDesc: 'ચેતવણીઓ મેળવો', attendanceAlerts: 'હાજરી ચેતવણીઓ', attendanceAlertsDesc: 'ચેક-ઇન પર', subscriptionAlerts: 'સબ્સ્ક્રિપ્શન ચેતવણીઓ', subscriptionAlertsDesc: 'સમાપ્તિ પર સૂચના', languagePreference: 'ભાષા પસંદગી', languagePreferenceDesc: 'ભાષા પસંદ કરો.' }
  },
  'pa-IN': {
    nav: { overview: 'ਸੰਖੇਪ', members: 'ਮੈਂਬਰ', attendance: 'ਹਾਜ਼ਰੀ', store: 'ਸਟੋਰ', more: 'ਹੋਰ' },
    settings: { title: 'ਐਪ ਸੈਟਿੰਗਜ਼', generalPreferences: 'ਆਮ ਤਰਜੀਹਾਂ', appTheme: 'ਥੀਮ', darkModeEnabled: 'ਡਾਰਕ ਮੋਡ', lightModeEnabled: 'ਲਾਈਟ ਮੋਡ', btnLight: '☀️ ਲਾਈਟ', btnDark: '🌙 ਡਾਰਕ', weightUnits: 'ਵਜ਼ਨ ਇਕਾਈਆਂ', weightUnitsDesc: 'ਉਤਪਾਦਾਂ ਲਈ', weekStartsOn: 'ਹਫ਼ਤਾ ਸ਼ੁਰੂ', weekStartsOnDesc: 'ਕੈਲੰਡਰ', ownerNotifications: 'ਮਾਲਕ ਸੂਚਨਾਵਾਂ', pushNotifications: 'ਪੁਸ਼ ਸੂਚਨਾਵਾਂ', pushNotificationsDesc: 'ਅਲਰਟ ਪ੍ਰਾਪਤ ਕਰੋ', attendanceAlerts: 'ਹਾਜ਼ਰੀ ਅਲਰਟ', attendanceAlertsDesc: 'ਚੈੱਕ-ਇਨ ਵੇਲੇ', subscriptionAlerts: 'ਮੈਂਬਰਸ਼ਿਪ ਅਲਰਟ', subscriptionAlertsDesc: 'ਸਮਾਪਤੀ ਵੇਲੇ', languagePreference: 'ਭਾਸ਼ਾ', languagePreferenceDesc: 'ਭਾਸ਼ਾ ਚੁਣੋ' }
  },
  'ta-IN': {
    nav: { overview: 'கண்ணோட்டம்', members: 'உறுப்பினர்கள்', attendance: 'வருகை', store: 'கடை', more: 'மேலும்' },
    settings: { title: 'பயன்பாட்டு அமைப்புகள்', generalPreferences: 'பொது விருப்பங்கள்', appTheme: 'தீம்', darkModeEnabled: 'டார்க் மோட்', lightModeEnabled: 'லைட் மோட்', btnLight: '☀️ லைட்', btnDark: '🌙 டார்க்', weightUnits: 'எடை அலகுகள்', weightUnitsDesc: 'அலகுகள்', weekStartsOn: 'வாரம் தொடங்கும்', weekStartsOnDesc: 'நாள்காட்டி', ownerNotifications: 'அறிவிப்புகள்', pushNotifications: 'புஷ் அறிவிப்புகள்', pushNotificationsDesc: 'அறிவிப்புகளைப் பெறு', attendanceAlerts: 'வருகை அறிவிப்புகள்', attendanceAlertsDesc: 'செக்-இன் செய்யும் போது', subscriptionAlerts: 'சந்தா அறிவிப்புகள்', subscriptionAlertsDesc: 'காலாவதியாகும் போது', languagePreference: 'மொழி விருப்பம்', languagePreferenceDesc: 'மொழியைத் தேர்ந்தெடுக்கவும்' }
  },
  'te-IN': {
    nav: { overview: 'అవలోకనం', members: 'సభ్యులు', attendance: 'హాజరు', store: 'స్టోర్', more: 'మరింత' },
    settings: { title: 'యాప్ సెట్టింగ్‌లు', generalPreferences: 'సాధారణ ప్రాధాన్యతలు', appTheme: 'థీమ్', darkModeEnabled: 'డార్క్ మోడ్', lightModeEnabled: 'లైట్ మోడ్', btnLight: '☀️ లైట్', btnDark: '🌙 డార్క్', weightUnits: 'బరువు యూనిట్లు', weightUnitsDesc: 'యూనిట్లు', weekStartsOn: 'వారం ప్రారంభం', weekStartsOnDesc: 'క్యాలెండర్', ownerNotifications: 'నోటిఫికేషన్లు', pushNotifications: 'పుష్ నోటిఫికేషన్లు', pushNotificationsDesc: 'అలర్ట్‌లను పొందండి', attendanceAlerts: 'హాజరు అలర్ట్‌లు', attendanceAlertsDesc: 'చెక్-ఇన్ చేసినప్పుడు', subscriptionAlerts: 'సబ్‌స్క్రిప్షన్ అలర్ట్‌లు', subscriptionAlertsDesc: 'గడువు ముగిసినప్పుడు', languagePreference: 'భాష', languagePreferenceDesc: 'భాషను ఎంచుకోండి' }
  },
  'ja-JP': {
    nav: { overview: '概要', members: 'メンバー', attendance: '出席', store: 'ストア', more: 'もっと' },
    settings: { title: '設定', generalPreferences: '一般設定', appTheme: 'テーマ', darkModeEnabled: 'ダークモード', lightModeEnabled: 'ライトモード', btnLight: '☀️ ライト', btnDark: '🌙 ダーク', weightUnits: '重量単位', weightUnitsDesc: '製品の単位', weekStartsOn: '週の始まり', weekStartsOnDesc: 'カレンダー', ownerNotifications: '通知', pushNotifications: 'プッシュ通知', pushNotificationsDesc: 'デバイスで受信', attendanceAlerts: '出席アラート', attendanceAlertsDesc: 'チェックイン時', subscriptionAlerts: 'サブスクリプション通知', subscriptionAlertsDesc: '期限切れ時', languagePreference: '言語', languagePreferenceDesc: '言語を選択' }
  },
  'zh-CN': {
    nav: { overview: '概览', members: '会员', attendance: '出勤', store: '商店', more: '更多' },
    settings: { title: '设置', generalPreferences: '常规设置', appTheme: '主题', darkModeEnabled: '深色模式', lightModeEnabled: '浅色模式', btnLight: '☀️ 浅色', btnDark: '🌙 深色', weightUnits: '重量单位', weightUnitsDesc: '产品单位', weekStartsOn: '每周开始于', weekStartsOnDesc: '日历', ownerNotifications: '通知', pushNotifications: '推送通知', pushNotificationsDesc: '在设备上接收', attendanceAlerts: '出勤提醒', attendanceAlertsDesc: '签到时', subscriptionAlerts: '订阅提醒', subscriptionAlertsDesc: '到期时', languagePreference: '语言', languagePreferenceDesc: '选择语言' }
  },
  'ar-SA': {
    nav: { overview: 'ملخص', members: 'الأعضاء', attendance: 'حضور', store: 'متجر', more: 'المزيد' },
    settings: { title: 'الإعدادات', generalPreferences: 'تفضيلات عامة', appTheme: 'المظهر', darkModeEnabled: 'الوضع الداكن', lightModeEnabled: 'الوضع الفاتح', btnLight: '☀️ فاتح', btnDark: '🌙 داكن', weightUnits: 'وحدات الوزن', weightUnitsDesc: 'وحدات', weekStartsOn: 'يبدأ الأسبوع', weekStartsOnDesc: 'التقويم', ownerNotifications: 'إشعارات', pushNotifications: 'إشعارات الدفع', pushNotificationsDesc: 'استلام التنبيهات', attendanceAlerts: 'تنبيهات الحضور', attendanceAlertsDesc: 'عند تسجيل الدخول', subscriptionAlerts: 'تنبيهات الاشتراك', subscriptionAlertsDesc: 'عند انتهاء الصلاحية', languagePreference: 'اللغة', languagePreferenceDesc: 'اختر لغة' }
  }
};

if (!fs.existsSync(localesDir)) {
  fs.mkdirSync(localesDir, { recursive: true });
}

Object.keys(translations).forEach(lang => {
  const langDir = path.join(localesDir, lang);
  if (!fs.existsSync(langDir)) {
    fs.mkdirSync(langDir);
  }
  fs.writeFileSync(path.join(langDir, 'translation.json'), JSON.stringify(translations[lang], null, 2));
});

console.log('Successfully generated translation files for 15 languages!');
