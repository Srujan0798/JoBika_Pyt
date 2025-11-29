/**
 * Language Manager for Multi-Language Support (English/Hindi)
 */

class LanguageManager {
    constructor() {
        this.currentLang = localStorage.getItem('jobika_lang') || 'en';
        this.translations = this.initializeTranslations();
        this.applyLanguage(this.currentLang);
    }

    initializeTranslations() {
        return {
            'en': {
                'nav_dashboard': 'Dashboard',
                'nav_jobs': 'Find Jobs',
                'nav_govt': 'Govt Jobs',
                'nav_editor': 'Resume Editor',
                'nav_tracker': 'Applications',
                'nav_coach': 'AI Coach',
                'nav_settings': 'Settings',
                'hero_title': 'Find Your Dream Job in India',
                'hero_subtitle': 'AI-powered job search tailored for you',
                'search_placeholder': 'Search by title, skill, or company...',
                'location_placeholder': 'City or Remote',
                'btn_search': 'Search Jobs',
                'btn_apply': 'Apply Now',
                'btn_save': 'Save',
                'filter_title': 'Filters',
                'filter_location': 'Location',
                'filter_salary': 'Salary',
                'filter_exp': 'Experience',
                'welcome_back': 'Welcome back',
                'match_score': 'Match Score',
                'quick_apply': 'Quick Apply',
                'view_details': 'View Details',
                'job_posted': 'Posted',
                'ctc_lpa': 'LPA',
                'notice_period': 'Notice Period',
                'immediate': 'Immediate',
                'days': 'days'
            },
            'hi': {
                'nav_dashboard': 'डैशबोर्ड',
                'nav_jobs': 'नौकरियां खोजें',
                'nav_govt': 'सरकारी नौकरियां',
                'nav_editor': 'रिज्यूमे एडिटर',
                'nav_tracker': 'आवेदन',
                'nav_coach': 'एआई कोच',
                'nav_settings': 'सेटिंग्स',
                'hero_title': 'भारत में अपनी सपनों की नौकरी पाएं',
                'hero_subtitle': 'आपके लिए तैयार एआई-संचालित नौकरी खोज',
                'search_placeholder': 'शीर्षक, कौशल या कंपनी द्वारा खोजें...',
                'location_placeholder': 'शहर या रिमोट',
                'btn_search': 'नौकरी खोजें',
                'btn_apply': 'अभी आवेदन करें',
                'btn_save': 'सहेजें',
                'filter_title': 'फिल्टर',
                'filter_location': 'स्थान',
                'filter_salary': 'वेतन',
                'filter_exp': 'अनुभव',
                'welcome_back': 'वापसी पर स्वागत है',
                'match_score': 'मैच स्कोर',
                'quick_apply': 'त्वरित आवेदन',
                'view_details': 'विवरण देखें',
                'job_posted': 'पोस्ट किया गया',
                'ctc_lpa': 'लाख प्रति वर्ष',
                'notice_period': 'नोटिस अवधि',
                'immediate': 'तत्काल',
                'days': 'दिन'
            }
        };
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('jobika_lang', lang);
            this.applyLanguage(lang);
            this.updateDirection(lang);
        }
    }

    applyLanguage(lang) {
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (this.translations[lang][key]) {
                if (element.tagName === 'INPUT' && element.getAttribute('placeholder')) {
                    element.placeholder = this.translations[lang][key];
                } else {
                    element.textContent = this.translations[lang][key];
                }
            }
        });

        // Update HTML lang attribute
        document.documentElement.lang = lang;
    }

    updateDirection(lang) {
        // For future support of RTL languages if needed
        document.documentElement.dir = 'ltr';
    }

    getText(key) {
        return this.translations[this.currentLang][key] || key;
    }

    toggleLanguage() {
        const newLang = this.currentLang === 'en' ? 'hi' : 'en';
        this.setLanguage(newLang);
        return newLang;
    }
}

// Initialize
window.languageManager = new LanguageManager();
