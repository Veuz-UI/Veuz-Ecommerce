'use client';

export interface SupportContactData {
  badge: string;
  title: string;
  subtitle: string;
  // Card 1: Chat to sales
  salesTitle?: string;
  salesDescription?: string;
  salesEmail?: string;
  // Card 2: Chat to support
  supportTitle?: string;
  emailDescription: string;
  email: string;
  // Card 3: Visit us
  visitTitle?: string;
  officeDescription: string;
  office: string;
  // Card 4: Call us
  callTitle?: string;
  phoneDescription: string;
  phone: string;
  // Optional / backwards compatibility
  imageUrl?: string;
  formPrivacyText?: string;
}

export interface SupportFaqItem {
  id: string;
  icon?: string;
  question: string;
  answer: string;
}

export interface SupportLegalSection {
  id: string;
  title: string;
  content: string;
}

export interface SupportLegalData {
  badge?: string;
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  sections: SupportLegalSection[];
}

export interface SupportManagementData {
  contact: SupportContactData;
  faqs?: SupportFaqItem[];
  privacyPolicy: SupportLegalData;
  terms: SupportLegalData;
}

const STORAGE_KEY = 'veuz_support_management_cache';
export const SUPPORT_MANAGEMENT_EVENT = 'veuz:support-management-updated';

export const DEFAULT_SUPPORT_FAQS: SupportFaqItem[] = [
  {
    id: 'faq-1',
    icon: 'smile',
    question: 'Is there a free trial or sample evaluation available?',
    answer:
      'Yes, we provide corporate clients and safety managers with sample kits for PPE evaluation and site wear trials. Contact our team to request a sample pack and schedule an onboarding review.',
  },
  {
    id: 'faq-2',
    icon: 'layers',
    question: 'Can I change my plan or bulk order schedule later?',
    answer:
      'Yes, you can easily modify your delivery frequency, amend bulk quantities, or pause standing orders at any time through your corporate dashboard or by notifying your dedicated account manager.',
  },
  {
    id: 'faq-3',
    icon: 'card',
    question: 'What is your cancellation and returns policy?',
    answer:
      'We provide a 14-day hassle-free return and exchange guarantee on all unworn equipment in original packaging with safety tags intact. For sizing exchanges on safety footwear or gloves, we arrange complimentary courier pickup.',
  },
  {
    id: 'faq-4',
    icon: 'pencil',
    question: 'Can customized corporate billing and PO info be added to invoices?',
    answer:
      'Yes, we issue ZATCA-compliant e-invoices with your company VAT registration number, purchase order (PO) reference, project code, and specific billing address.',
  },
  {
    id: 'faq-5',
    icon: 'truck',
    question: 'How fast do you deliver industrial safety gear across Saudi Arabia?',
    answer:
      'Standard delivery across the Eastern Province (Khobar, Dammam, Jubail) takes 1-2 business days. Central (Riyadh) and Western (Jeddah, Yanbu) regions take 2-4 business days. Same-day emergency courier is available for urgent site compliance.',
  },
  {
    id: 'faq-6',
    icon: 'shield',
    question: 'Are all helmets, shoes, and gear certified to international safety standards?',
    answer:
      'Absolutely. Every PPE product is certified under OSHA, EN, CE, or ANSI/ISEA standards. Mill test reports and compliance certificates are available upon request for corporate site safety audits.',
  },
];

export const DEFAULT_SUPPORT_MANAGEMENT: SupportManagementData = {
  contact: {
    badge: 'WE ARE HERE TO HELP',
    title: "We’d love to hear from you",
    subtitle: 'Our friendly team is always here to chat and assist you with all your industrial safety needs.',
    salesTitle: 'Chat to sales',
    salesDescription: 'Speak to our friendly team.',
    salesEmail: 'sales@veuz-safety.com',
    supportTitle: 'Chat to support',
    email: 'support@veuz-safety.com',
    emailDescription: 'Our friendly team is here to help.',
    visitTitle: 'Visit us',
    office: '100 King Fahd Road, Khobar Shamaliya, KSA',
    officeDescription: 'Come say hello at our safety office HQ.',
    callTitle: 'Call us',
    phone: '+966 13 888 1234',
    phoneDescription: 'Mon-Fri from 8am to 5pm.',
    imageUrl: '',
    formPrivacyText: '',
  },
  faqs: DEFAULT_SUPPORT_FAQS,
  privacyPolicy: {
    badge: 'DATA PROTECTION & COMPLIANCE',
    title: 'Privacy Policy',
    subtitle: 'Our code of conduct, data protection commitments, and privacy pledge for our customers and platform members.',
    lastUpdated: 'October 2026',
    sections: [
      {
        id: 'sec-pp-1',
        title: '1. Overview & Commitment',
        content: 'Veuz Safety E-Commerce ("we", "our", "us") values your trust and is dedicated to safeguarding your personal data in accordance with Saudi Data Protection Law (PDPL) and international cybersecurity standards. This policy outlines how your information is collected, processed, and secured when utilizing our safety procurement services.',
      },
      {
        id: 'sec-pp-2',
        title: '2. Information We Collect',
        content: 'We collect information necessary to process safety gear transactions, verify corporate procurement accounts, and fulfill doorstep shipments across Saudi Arabia and the GCC: Full name, business organization name, contact telephone, delivery location, and encrypted transaction records processed through certified payment gateways.',
      },
      {
        id: 'sec-pp-3',
        title: '3. How Your Information Is Used',
        content: 'Your information is utilized solely to fulfill orders, issue compliant VAT tax invoices, dispatch safety compliance notices or equipment recalls, and improve our digital procurement systems. We never sell, rent, or lease your personal data to third-party marketing entities.',
      },
      {
        id: 'sec-pp-4',
        title: '4. Data Security & Regional Storage',
        content: 'All transactional traffic is encrypted with enterprise-grade 256-bit TLS protocols. Customer profiles, procurement logs, and order histories are stored in secure cloud infrastructure within certified regional data centers adhering to CITC guidelines.',
      },
      {
        id: 'sec-pp-5',
        title: '5. Contact Our Privacy Officer',
        content: 'If you have inquiries regarding your personal data or wish to request data access, correction, or deletion, contact our Data Protection Office at privacy@veuz-safety.com or call our toll-free assistance line.',
      },
    ],
  },
  terms: {
    badge: 'LEGAL & COMMERCIAL TERMS',
    title: 'Terms & Conditions',
    subtitle: 'Our commercial terms, purchasing policies, and customer agreement for our products and services.',
    lastUpdated: 'October 2026',
    sections: [
      {
        id: 'sec-tc-1',
        title: '1. Acceptance of Terms',
        content: 'By accessing or purchasing safety gear, personal protective equipment (PPE), or industrial accessories through Veuz Safety E-Commerce, you acknowledge and agree to adhere to these commercial terms and conditions.',
      },
      {
        id: 'sec-tc-2',
        title: '2. Product Standards & Fitment',
        content: 'All safety gear complies with recognized international benchmarks (such as EN, CE, ANSI, and OSHA standards). Buyers and employers remain responsible for selecting equipment appropriate for their specific workplace hazard levels, atmospheric temperatures, and chemical exposures.',
      },
      {
        id: 'sec-tc-3',
        title: '3. Returns, Exchanges & Sizing Guarantee',
        content: 'Products in unsoiled, unused condition with original packaging, tags, and certification manuals intact may be returned or exchanged within 14 calendar days of delivery. Custom safety-printed items (e.g. corporate logo hard hats) are non-refundable unless manufacturing defects exist.',
      },
      {
        id: 'sec-tc-4',
        title: '4. Pricing, VAT & Invoicing',
        content: 'All prices are listed in Saudi Riyals (SAR) and include standard VAT as mandated by ZATCA regulations. ZATCA-compliant electronic tax invoices (Fatoora QR format) are automatically issued upon dispatch.',
      },
      {
        id: 'sec-tc-5',
        title: '5. Governing Law & Jurisdiction',
        content: 'These terms are governed by the commercial regulations of the Kingdom of Saudi Arabia. Disputes are subject to the jurisdiction of the competent courts in the Eastern Province.',
      },
    ],
  },
};

export function getCachedSupportManagement(): SupportManagementData {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.contact && parsed.privacyPolicy && parsed.terms) {
          return parsed;
        }
      }
    } catch {
      // Ignore cache read errors
    }
  }
  return DEFAULT_SUPPORT_MANAGEMENT;
}

export async function fetchSupportManagement(): Promise<SupportManagementData> {
  const cached = getCachedSupportManagement();
  try {
    const res = await fetch('/api/support-management', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const fullData: SupportManagementData = {
          contact: { ...DEFAULT_SUPPORT_MANAGEMENT.contact, ...json.data.contact },
          privacyPolicy: { ...DEFAULT_SUPPORT_MANAGEMENT.privacyPolicy, ...json.data.privacyPolicy },
          terms: { ...DEFAULT_SUPPORT_MANAGEMENT.terms, ...json.data.terms },
        };
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fullData));
        }
        return fullData;
      }
    }
  } catch (error) {
    console.warn('Could not fetch support management from API, falling back to cache:', error);
  }
  return cached;
}

export async function saveSupportManagement(
  data: SupportManagementData
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/support-management', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (result.success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent(SUPPORT_MANAGEMENT_EVENT, { detail: data }));
      }
      return { success: true, message: result.message || 'Saved successfully!' };
    }
    return { success: false, message: result.message || 'Failed to save support management data.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network error while saving.' };
  }
}
