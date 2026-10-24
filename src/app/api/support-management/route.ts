import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface SupportContactData {
  badge: string;
  title: string;
  subtitle: string;
  salesTitle?: string;
  salesDescription?: string;
  salesEmail?: string;
  supportTitle?: string;
  email: string;
  emailDescription: string;
  visitTitle?: string;
  office: string;
  officeDescription: string;
  callTitle?: string;
  phone: string;
  phoneDescription: string;
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
  badge: string;
  title: string;
  subtitle?: string;
  lastUpdated: string;
  sections: SupportLegalSection[];
}

export interface SupportManagementPayload {
  contact: SupportContactData;
  faqs?: SupportFaqItem[];
  privacyPolicy: SupportLegalData;
  terms: SupportLegalData;
}

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'support-management-store.json');

const DEFAULT_SUPPORT_FAQS: SupportFaqItem[] = [
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

const DEFAULT_SUPPORT_DATA: SupportManagementPayload = {
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
        content: 'Veuz Safety E-Commerce ("we", "our", "us") values your trust and is dedicated to safeguarding your personal data in accordance with Saudi Data Protection Law (PDPL) and international cybersecurity standards.',
      },
      {
        id: 'sec-pp-2',
        title: '2. Information We Collect',
        content: 'We collect information necessary to process safety gear transactions, verify corporate procurement accounts, and fulfill doorstep shipments across Saudi Arabia and the GCC.',
      },
      {
        id: 'sec-pp-3',
        title: '3. How Your Information Is Used',
        content: 'Your information is utilized solely to fulfill orders, issue compliant VAT tax invoices, dispatch safety compliance notices, and improve our digital procurement systems.',
      },
      {
        id: 'sec-pp-4',
        title: '4. Data Security & Regional Storage',
        content: 'All transactional traffic is encrypted with enterprise-grade 256-bit TLS protocols. Customer profiles and order histories are stored in secure cloud infrastructure within certified regional data centers.',
      },
      {
        id: 'sec-pp-5',
        title: '5. Contact Our Privacy Officer',
        content: 'If you have inquiries regarding your personal data or wish to request data deletion, contact our Data Protection Office at privacy@veuz-safety.com.',
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
        content: 'By accessing or purchasing safety gear, personal protective equipment (PPE), or industrial accessories through Veuz Safety E-Commerce, you acknowledge and agree to adhere to these commercial terms.',
      },
      {
        id: 'sec-tc-2',
        title: '2. Product Standards & Fitment',
        content: 'All safety gear complies with recognized international benchmarks (such as EN, CE, ANSI, and OSHA standards).',
      },
      {
        id: 'sec-tc-3',
        title: '3. Returns, Exchanges & Sizing Guarantee',
        content: 'Products in unsoiled, unused condition with original packaging, tags, and certification manuals intact may be returned or exchanged within 14 calendar days of delivery.',
      },
      {
        id: 'sec-tc-4',
        title: '4. Corporate Procurement & Invoicing',
        content: 'Credit terms and bulk supply orders are governed by registered commercial contracts.',
      },
    ],
  },
};

function sanitizeFaqs(rawFaqs: any[]): SupportFaqItem[] {
  if (!Array.isArray(rawFaqs)) return DEFAULT_SUPPORT_FAQS;
  return rawFaqs
    .filter((f) => f && typeof f === 'object')
    .map((f, idx) => ({
      id: String(f.id || `faq-${idx + 1}`),
      icon: String(f.icon || 'smile').trim(),
      question: String(f.question || '').trim(),
      answer: String(f.answer || '').trim(),
    }))
    .filter((f) => f.question || f.answer);
}

function readSupportData(): SupportManagementPayload {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.contact && parsed.privacyPolicy && parsed.terms) {
        return {
          contact: { ...DEFAULT_SUPPORT_DATA.contact, ...parsed.contact },
          faqs: Array.isArray(parsed.faqs) ? sanitizeFaqs(parsed.faqs) : DEFAULT_SUPPORT_DATA.faqs,
          privacyPolicy: {
            badge: parsed.privacyPolicy.badge || DEFAULT_SUPPORT_DATA.privacyPolicy.badge,
            title: parsed.privacyPolicy.title || DEFAULT_SUPPORT_DATA.privacyPolicy.title,
            subtitle: parsed.privacyPolicy.subtitle || DEFAULT_SUPPORT_DATA.privacyPolicy.subtitle,
            lastUpdated: parsed.privacyPolicy.lastUpdated || DEFAULT_SUPPORT_DATA.privacyPolicy.lastUpdated,
            sections: Array.isArray(parsed.privacyPolicy.sections) ? parsed.privacyPolicy.sections : DEFAULT_SUPPORT_DATA.privacyPolicy.sections,
          },
          terms: {
            badge: parsed.terms.badge || DEFAULT_SUPPORT_DATA.terms.badge,
            title: parsed.terms.title || DEFAULT_SUPPORT_DATA.terms.title,
            subtitle: parsed.terms.subtitle || DEFAULT_SUPPORT_DATA.terms.subtitle,
            lastUpdated: parsed.terms.lastUpdated || DEFAULT_SUPPORT_DATA.terms.lastUpdated,
            sections: Array.isArray(parsed.terms.sections) ? parsed.terms.sections : DEFAULT_SUPPORT_DATA.terms.sections,
          },
        };
      }
    }
  } catch (error) {
    console.error('Error reading support management store:', error);
  }
  return DEFAULT_SUPPORT_DATA;
}

function writeSupportData(data: SupportManagementPayload): boolean {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing support management store:', error);
    return false;
  }
}

export async function GET() {
  const data = readSupportData();
  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || !body.contact || !body.privacyPolicy || !body.terms) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload: contact, privacyPolicy, and terms objects are required.' },
        { status: 400 }
      );
    }

    const sanitizedContact: SupportContactData = {
      badge: String(body.contact.badge || 'WE ARE HERE TO HELP').trim(),
      title: String(body.contact.title || "We’d love to hear from you").trim(),
      subtitle: String(body.contact.subtitle || 'Our friendly team is always here to chat.').trim(),
      salesTitle: String(body.contact.salesTitle || 'Chat to sales').trim(),
      salesDescription: String(body.contact.salesDescription || 'Speak to our friendly team.').trim(),
      salesEmail: String(body.contact.salesEmail || 'sales@veuz-safety.com').trim(),
      supportTitle: String(body.contact.supportTitle || 'Chat to support').trim(),
      email: String(body.contact.email || 'support@veuz-safety.com').trim(),
      emailDescription: String(body.contact.emailDescription || "We're here to help.").trim(),
      visitTitle: String(body.contact.visitTitle || 'Visit us').trim(),
      office: String(body.contact.office || '100 King Fahd Road, Khobar Shamaliya, KSA').trim(),
      officeDescription: String(body.contact.officeDescription || 'Come say hello at our safety office HQ.').trim(),
      callTitle: String(body.contact.callTitle || 'Call us').trim(),
      phone: String(body.contact.phone || '+966 13 888 1234').trim(),
      phoneDescription: String(body.contact.phoneDescription || 'Mon-Fri from 8am to 5pm.').trim(),
      imageUrl: '',
      formPrivacyText: '',
    };

    const sanitizedFaqs = sanitizeFaqs(body.faqs);

    const sanitizeSections = (sections: any[]): SupportLegalSection[] => {
      if (!Array.isArray(sections)) return [];
      return sections
        .filter((s) => s && typeof s === 'object')
        .map((s, idx) => ({
          id: String(s.id || `sec-${idx + 1}`),
          title: String(s.title || '').trim(),
          content: String(s.content || '').trim(),
        }))
        .filter((s) => s.title || s.content);
    };

    const sanitizedPrivacyPolicy: SupportLegalData = {
      badge: String(body.privacyPolicy.badge || 'DATA PROTECTION & COMPLIANCE').trim(),
      title: String(body.privacyPolicy.title || 'Privacy Policy').trim(),
      subtitle: String(body.privacyPolicy.subtitle || DEFAULT_SUPPORT_DATA.privacyPolicy.subtitle || '').trim(),
      lastUpdated: String(body.privacyPolicy.lastUpdated || 'October 2026').trim(),
      sections: sanitizeSections(body.privacyPolicy.sections),
    };

    const sanitizedTerms: SupportLegalData = {
      badge: String(body.terms.badge || 'LEGAL & COMMERCIAL TERMS').trim(),
      title: String(body.terms.title || 'Terms & Conditions').trim(),
      subtitle: String(body.terms.subtitle || DEFAULT_SUPPORT_DATA.terms.subtitle || '').trim(),
      lastUpdated: String(body.terms.lastUpdated || 'October 2026').trim(),
      sections: sanitizeSections(body.terms.sections),
    };

    const fullPayload: SupportManagementPayload = {
      contact: sanitizedContact,
      faqs: sanitizedFaqs,
      privacyPolicy: sanitizedPrivacyPolicy,
      terms: sanitizedTerms,
    };

    const written = writeSupportData(fullPayload);
    if (!written) {
      return NextResponse.json({ success: false, message: 'Failed to write data file' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Support management updated successfully', data: fullPayload });
  } catch (err: any) {
    console.error('Error in support-management API:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
