'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  fetchSupportManagement,
  saveSupportManagement,
  SupportManagementData,
  SupportLegalSection,
  SupportFaqItem,
  DEFAULT_SUPPORT_MANAGEMENT,
  DEFAULT_SUPPORT_FAQS,
} from '@/services/supportManagementService';
import { useToast } from '@/context/ToastContext';

export default function SupportManagementDashboardPage() {
  const [data, setData] = useState<SupportManagementData>(DEFAULT_SUPPORT_MANAGEMENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'contact' | 'faqs' | 'privacy' | 'terms'>('contact');
  const [mounted, setMounted] = useState(false);

  // Modal / Confirm States
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionContent, setNewSectionContent] = useState('');
  const [deleteConfirmSection, setDeleteConfirmSection] = useState<{
    id: string;
    title: string;
    tab: 'privacy' | 'terms';
  } | null>(null);

  // FAQ Modal States
  const [showAddFaqModal, setShowAddFaqModal] = useState(false);
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqIcon, setNewFaqIcon] = useState('smile');
  const [deleteConfirmFaq, setDeleteConfirmFaq] = useState<{
    id: string;
    question: string;
  } | null>(null);

  const { showToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll lock when modal is open
  useEffect(() => {
    const isModalOpen =
      showResetConfirmModal ||
      showAddSectionModal ||
      showAddFaqModal ||
      !!deleteConfirmSection ||
      !!deleteConfirmFaq;
    if (isModalOpen) {
      const orig = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = orig;
      };
    }
  }, [showResetConfirmModal, showAddSectionModal, showAddFaqModal, deleteConfirmSection, deleteConfirmFaq]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetchSupportManagement();
      setData(result);
    } catch (err: any) {
      console.error('Error loading support management data:', err);
      showToast('danger', 'Failed to load support management data.');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveSupportManagement(data);
      if (res.success) {
        showToast('success', res.message || 'Support management updated successfully!');
      } else {
        showToast('danger', res.message || 'Failed to save changes.');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      showToast('danger', 'Error connecting to server.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleResetToDefault = () => {
    setData(JSON.parse(JSON.stringify(DEFAULT_SUPPORT_MANAGEMENT)));
    setShowResetConfirmModal(false);
    showToast('info', 'Reset to system default settings. Click "Save Changes" to apply.');
  };

  // Section handling for Privacy & Terms
  const handleAddSection = () => {
    if (!newSectionTitle.trim() && !newSectionContent.trim()) {
      showToast('warning', 'Please enter section title and content.');
      return;
    }

    const newSection: SupportLegalSection = {
      id: `sec-${Date.now()}`,
      title: newSectionTitle.trim() || 'New Section',
      content: newSectionContent.trim(),
    };

    if (activeTab === 'privacy') {
      setData((prev) => ({
        ...prev,
        privacyPolicy: {
          ...prev.privacyPolicy,
          sections: [...prev.privacyPolicy.sections, newSection],
        },
      }));
    } else if (activeTab === 'terms') {
      setData((prev) => ({
        ...prev,
        terms: {
          ...prev.terms,
          sections: [...prev.terms.sections, newSection],
        },
      }));
    }

    setNewSectionTitle('');
    setNewSectionContent('');
    setShowAddSectionModal(false);
    showToast('success', 'New section added. Remember to click "Save Changes".');
  };

  const handleDeleteSection = () => {
    if (!deleteConfirmSection) return;
    const { id, tab } = deleteConfirmSection;

    if (tab === 'privacy') {
      setData((prev) => ({
        ...prev,
        privacyPolicy: {
          ...prev.privacyPolicy,
          sections: prev.privacyPolicy.sections.filter((s) => s.id !== id),
        },
      }));
    } else if (tab === 'terms') {
      setData((prev) => ({
        ...prev,
        terms: {
          ...prev.terms,
          sections: prev.terms.sections.filter((s) => s.id !== id),
        },
      }));
    }

    setDeleteConfirmSection(null);
    showToast('info', 'Section removed.');
  };

  const handleMoveSection = (index: number, direction: 'up' | 'down', tab: 'privacy' | 'terms') => {
    const list = tab === 'privacy' ? [...data.privacyPolicy.sections] : [...data.terms.sections];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    if (tab === 'privacy') {
      setData((prev) => ({ ...prev, privacyPolicy: { ...prev.privacyPolicy, sections: list } }));
    } else {
      setData((prev) => ({ ...prev, terms: { ...prev.terms, sections: list } }));
    }
  };

  const handleUpdateSection = (index: number, field: 'title' | 'content', value: string, tab: 'privacy' | 'terms') => {
    if (tab === 'privacy') {
      const list = [...data.privacyPolicy.sections];
      list[index] = { ...list[index], [field]: value };
      setData((prev) => ({ ...prev, privacyPolicy: { ...prev.privacyPolicy, sections: list } }));
    } else {
      const list = [...data.terms.sections];
      list[index] = { ...list[index], [field]: value };
      setData((prev) => ({ ...prev, terms: { ...prev.terms, sections: list } }));
    }
  };

  // FAQ Handlers
  const currentFaqs = data.faqs || DEFAULT_SUPPORT_FAQS;

  const handleAddFaq = () => {
    if (!newFaqQuestion.trim() && !newFaqAnswer.trim()) {
      showToast('warning', 'Please enter both question and answer.');
      return;
    }

    const newFaq: SupportFaqItem = {
      id: `faq-${Date.now()}`,
      icon: newFaqIcon,
      question: newFaqQuestion.trim() || 'New FAQ Question',
      answer: newFaqAnswer.trim(),
    };

    setData((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || DEFAULT_SUPPORT_FAQS), newFaq],
    }));

    setNewFaqQuestion('');
    setNewFaqAnswer('');
    setNewFaqIcon('smile');
    setShowAddFaqModal(false);
    showToast('success', 'New FAQ added. Click "Save Changes" to apply.');
  };

  const handleDeleteFaq = () => {
    if (!deleteConfirmFaq) return;
    const { id } = deleteConfirmFaq;

    setData((prev) => ({
      ...prev,
      faqs: (prev.faqs || DEFAULT_SUPPORT_FAQS).filter((f) => f.id !== id),
    }));

    setDeleteConfirmFaq(null);
    showToast('info', 'FAQ removed. Remember to click "Save Changes".');
  };

  const handleMoveFaq = (index: number, direction: 'up' | 'down') => {
    const list = [...currentFaqs];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    setData((prev) => ({ ...prev, faqs: list }));
  };

  const handleUpdateFaq = (index: number, field: 'question' | 'answer' | 'icon', value: string) => {
    const list = [...currentFaqs];
    list[index] = { ...list[index], [field]: value };
    setData((prev) => ({ ...prev, faqs: list }));
  };

  if (!mounted || isLoading) {
    return (
      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="card-body p-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-muted fs-14 mb-0">Loading Support Management...</p>
        </div>
      </div>
    );
  }

  const livePageHref =
    activeTab === 'contact' || activeTab === 'faqs'
      ? '/contact'
      : activeTab === 'privacy'
      ? '/privacy-policy'
      : '/terms';

  return (
    <>
      {/* ========================================================
          MAIN WHITE BACKGROUND CARD (Matching Other Dashboard Pages)
         ======================================================== */}
      <div
        className="card border-0 mb-4"
        style={{
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div className="card-body p-4 p-md-4">
          {/* 1. Breadcrumbs Navigation */}
          <div className="d-flex align-items-center text-muted fs-13" style={{ marginBottom: '22px', gap: '10px' }}>
            <Link href="/dashboard" className="text-muted text-decoration-none">
              Dashboard
            </Link>
            <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
            <span className="text-dark fw-bold">Support Management</span>
          </div>

          {/* 2. Page Header & Actions Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
            <div>
              <h2
                className="fw-bold text-dark"
                style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a', marginBottom: '8px' }}
              >
                Support Management
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Configure and maintain storefront content for Contact Us, FAQs, Privacy Policy, and Terms &amp; Conditions.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold"
                onClick={loadData}
                disabled={isLoading || isSaving}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#334155',
                  borderRadius: '8px',
                  padding: '8px 14px',
                }}
              >
                <iconify-icon icon="solar:restart-bold" class="fs-16"></iconify-icon>
                <span>Discard Changes</span>
              </button>

              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold"
                onClick={() => setShowResetConfirmModal(true)}
                disabled={isLoading || isSaving}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #fed7aa',
                  color: '#c2410c',
                  borderRadius: '8px',
                  padding: '8px 14px',
                }}
              >
                <iconify-icon icon="solar:refresh-circle-bold" class="fs-16"></iconify-icon>
                <span>Reset Defaults</span>
              </button>

              <Link
                href={livePageHref}
                target="_blank"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f172a',
                  borderRadius: '8px',
                  padding: '8px 14px',
                }}
              >
                <iconify-icon icon="solar:square-top-down-broken" class="fs-16"></iconify-icon>
                <span>View Storefront</span>
              </Link>

              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold text-white shadow-sm"
                onClick={handleSave}
                disabled={isLoading || isSaving}
                style={{
                  backgroundColor: '#0f172a',
                  borderColor: '#0f172a',
                  borderRadius: '8px',
                  padding: '8px 18px',
                }}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <iconify-icon icon="solar:diskette-bold" class="fs-16"></iconify-icon>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. Section Navigation Tabs (Contact Us, FAQs, Privacy Policy, Terms & Conditions) */}
          <ul className="nav nav-pills gap-2 p-1.5 rounded-3 mb-4 border" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link fs-13 fw-semibold px-4 py-2 d-flex align-items-center gap-2 ${
                  activeTab === 'contact' ? 'active shadow-sm' : 'text-dark'
                }`}
                onClick={() => setActiveTab('contact')}
                style={
                  activeTab === 'contact'
                    ? { backgroundColor: '#0f172a', color: '#fff', borderRadius: '6px' }
                    : { borderRadius: '6px' }
                }
              >
                <iconify-icon icon="solar:chat-round-call-bold" class="fs-16"></iconify-icon>
                <span>Contact Us</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                className={`nav-link fs-13 fw-semibold px-4 py-2 d-flex align-items-center gap-2 ${
                  activeTab === 'faqs' ? 'active shadow-sm' : 'text-dark'
                }`}
                onClick={() => setActiveTab('faqs')}
                style={
                  activeTab === 'faqs'
                    ? { backgroundColor: '#0f172a', color: '#fff', borderRadius: '6px' }
                    : { borderRadius: '6px' }
                }
              >
                <iconify-icon icon="solar:question-circle-bold" class="fs-16"></iconify-icon>
                <span>FAQs ({currentFaqs.length})</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                className={`nav-link fs-13 fw-semibold px-4 py-2 d-flex align-items-center gap-2 ${
                  activeTab === 'privacy' ? 'active shadow-sm' : 'text-dark'
                }`}
                onClick={() => setActiveTab('privacy')}
                style={
                  activeTab === 'privacy'
                    ? { backgroundColor: '#0f172a', color: '#fff', borderRadius: '6px' }
                    : { borderRadius: '6px' }
                }
              >
                <iconify-icon icon="solar:shield-check-bold" class="fs-16"></iconify-icon>
                <span>Privacy Policy ({data.privacyPolicy.sections.length})</span>
              </button>
            </li>

            <li className="nav-item">
              <button
                type="button"
                className={`nav-link fs-13 fw-semibold px-4 py-2 d-flex align-items-center gap-2 ${
                  activeTab === 'terms' ? 'active shadow-sm' : 'text-dark'
                }`}
                onClick={() => setActiveTab('terms')}
                style={
                  activeTab === 'terms'
                    ? { backgroundColor: '#0f172a', color: '#fff', borderRadius: '6px' }
                    : { borderRadius: '6px' }
                }
              >
                <iconify-icon icon="solar:document-text-bold" class="fs-16"></iconify-icon>
                <span>Terms &amp; Conditions ({data.terms.sections.length})</span>
              </button>
            </li>
          </ul>

          {/* ========================================================
              TAB 1: CONTACT US MANAGEMENT (Full Width, No Image Input)
             ======================================================== */}
          {activeTab === 'contact' && (
            <div className="d-flex flex-column gap-4">
              {/* Card 1: Header & Identity */}
              <div
                className="card border-0 shadow-sm rounded-4 overflow-hidden"
                style={{ border: '1px solid #e2e8f0' }}
              >
                <div className="card-header bg-light border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary-subtle text-primary fw-bold px-2 py-1 fs-12">SECTION 1</span>
                    <span className="fw-bold fs-14 text-dark">Page Title &amp; Subtitle</span>
                  </div>
                </div>
                <div className="card-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">Eyebrow / Badge Text</label>
                      <input
                        type="text"
                        className="form-control fs-13"
                        style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        value={data.contact.badge}
                        onChange={(e) =>
                          setData({ ...data, contact: { ...data.contact, badge: e.target.value } })
                        }
                        placeholder="e.g. Contact Us!"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">Main Heading</label>
                      <input
                        type="text"
                        className="form-control fs-13"
                        style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        value={data.contact.title}
                        onChange={(e) =>
                          setData({ ...data, contact: { ...data.contact, title: e.target.value } })
                        }
                        placeholder="e.g. We’d love to hear from you"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">Subtitle / Welcome Message</label>
                      <textarea
                        className="form-control fs-13"
                        style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        rows={2}
                        value={data.contact.subtitle}
                        onChange={(e) =>
                          setData({ ...data, contact: { ...data.contact, subtitle: e.target.value } })
                        }
                        placeholder="e.g. Our friendly team is always here to chat and assist you with all your industrial safety needs."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: 4 Storefront Contact Channels Cards */}
              <div
                className="card border-0 shadow-sm rounded-4 overflow-hidden"
                style={{ border: '1px solid #e2e8f0' }}
              >
                <div className="card-header bg-light border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary-subtle text-primary fw-bold px-2 py-1 fs-12">SECTION 2</span>
                    <span className="fw-bold fs-14 text-dark">Storefront 4 Contact Cards</span>
                  </div>
                </div>
                <div className="card-body p-4 bg-white">
                  <div className="row g-4">
                    {/* Card 1: Chat to sales */}
                    <div className="col-lg-6 col-12">
                      <div
                        className="border rounded-4 h-100"
                        style={{
                          backgroundColor: '#fbfbfd',
                          borderColor: '#eaecf0',
                          padding: '24px',
                          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
                        }}
                      >
                        <div className="d-flex align-items-center gap-2.5 mb-3 pb-2.5 border-bottom" style={{ borderColor: '#eaecf0' }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '32px', height: '32px', backgroundColor: '#eff6ff', color: '#2563eb' }}
                          >
                            <iconify-icon icon="solar:chat-line-bold" class="fs-16"></iconify-icon>
                          </div>
                          <div>
                            <span className="fw-bold fs-14 text-dark d-block">Card 1: Chat to Sales</span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Card Title</label>
                          <input
                            type="text"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.salesTitle || 'Chat to sales'}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, salesTitle: e.target.value } })
                            }
                            placeholder="Chat to sales"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Card Subtitle / Description</label>
                          <input
                            type="text"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.salesDescription || 'Speak to our friendly team.'}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, salesDescription: e.target.value } })
                            }
                            placeholder="Speak to our friendly team."
                          />
                        </div>
                        <div className="mb-0">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Sales Email Address</label>
                          <input
                            type="email"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.salesEmail || 'sales@veuz-safety.com'}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, salesEmail: e.target.value } })
                            }
                            placeholder="sales@veuz-safety.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Chat to support */}
                    <div className="col-lg-6 col-12">
                      <div
                        className="border rounded-4 h-100"
                        style={{
                          backgroundColor: '#fbfbfd',
                          borderColor: '#eaecf0',
                          padding: '24px',
                          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
                        }}
                      >
                        <div className="d-flex align-items-center gap-2.5 mb-3 pb-2.5 border-bottom" style={{ borderColor: '#eaecf0' }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '32px', height: '32px', backgroundColor: '#eff6ff', color: '#2563eb' }}
                          >
                            <iconify-icon icon="solar:dialog-bold" class="fs-16"></iconify-icon>
                          </div>
                          <div>
                            <span className="fw-bold fs-14 text-dark d-block">Card 2: Chat to Support</span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Card Title</label>
                          <input
                            type="text"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.supportTitle || 'Chat to support'}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, supportTitle: e.target.value } })
                            }
                            placeholder="Chat to support"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Card Subtitle / Description</label>
                          <input
                            type="text"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.emailDescription || "Our friendly team is here to help."}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, emailDescription: e.target.value } })
                            }
                            placeholder="Our friendly team is here to help."
                          />
                        </div>
                        <div className="mb-0">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Support Email Address</label>
                          <input
                            type="email"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.email}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, email: e.target.value } })
                            }
                            placeholder="support@veuz-safety.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Visit us */}
                    <div className="col-lg-6 col-12">
                      <div
                        className="border rounded-4 h-100"
                        style={{
                          backgroundColor: '#fbfbfd',
                          borderColor: '#eaecf0',
                          padding: '24px',
                          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
                        }}
                      >
                        <div className="d-flex align-items-center gap-2.5 mb-3 pb-2.5 border-bottom" style={{ borderColor: '#eaecf0' }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '32px', height: '32px', backgroundColor: '#eff6ff', color: '#2563eb' }}
                          >
                            <iconify-icon icon="solar:map-point-bold" class="fs-16"></iconify-icon>
                          </div>
                          <div>
                            <span className="fw-bold fs-14 text-dark d-block">Card 3: Visit Us (Location)</span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Card Title</label>
                          <input
                            type="text"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.visitTitle || 'Visit us'}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, visitTitle: e.target.value } })
                            }
                            placeholder="Visit us"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Card Subtitle / Note</label>
                          <input
                            type="text"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.officeDescription || 'Come say hello at our safety office HQ.'}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, officeDescription: e.target.value } })
                            }
                            placeholder="Come say hello at our safety office HQ."
                          />
                        </div>
                        <div className="mb-0">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Office Location Address</label>
                          <input
                            type="text"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.office}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, office: e.target.value } })
                            }
                            placeholder="100 King Fahd Road, Khobar Shamaliya, KSA"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Card 4: Call us */}
                    <div className="col-lg-6 col-12">
                      <div
                        className="border rounded-4 h-100"
                        style={{
                          backgroundColor: '#fbfbfd',
                          borderColor: '#eaecf0',
                          padding: '24px',
                          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
                        }}
                      >
                        <div className="d-flex align-items-center gap-2.5 mb-3 pb-2.5 border-bottom" style={{ borderColor: '#eaecf0' }}>
                          <div
                            className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                            style={{ width: '32px', height: '32px', backgroundColor: '#eff6ff', color: '#2563eb' }}
                          >
                            <iconify-icon icon="solar:phone-calling-bold" class="fs-16"></iconify-icon>
                          </div>
                          <div>
                            <span className="fw-bold fs-14 text-dark d-block">Card 4: Call Us (Telephone)</span>
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Card Title</label>
                          <input
                            type="text"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.callTitle || 'Call us'}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, callTitle: e.target.value } })
                            }
                            placeholder="Call us"
                          />
                        </div>
                        <div className="mb-3">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Card Subtitle / Operating Hours</label>
                          <input
                            type="text"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.phoneDescription || 'Mon-Fri from 8am to 5pm.'}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, phoneDescription: e.target.value } })
                            }
                            placeholder="Mon-Fri from 8am to 5pm."
                          />
                        </div>
                        <div className="mb-0">
                          <label className="form-label fs-12 fw-semibold text-dark mb-1.5">Contact Phone Number</label>
                          <input
                            type="text"
                            className="form-control fs-13"
                            style={{ borderColor: '#cbd5e1', borderRadius: '8px', padding: '9px 12px' }}
                            value={data.contact.phone}
                            onChange={(e) =>
                              setData({ ...data, contact: { ...data.contact, phone: e.target.value } })
                            }
                            placeholder="+966 13 888 1234"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: FAQ MANAGEMENT
             ======================================================== */}
          {activeTab === 'faqs' && (
            <div className="d-flex flex-column gap-3">
              <div
                className="card border-0 shadow-sm rounded-4 overflow-hidden mb-2"
                style={{ border: '1px solid #e2e8f0' }}
              >
                <div className="card-header bg-light border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
                  <div>
                    <span className="fw-bold fs-14 text-dark">Storefront Frequently Asked Questions</span>
                    <span className="text-muted fs-12 ms-2">({currentFaqs.length} total items)</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddFaqModal(true)}
                    className="btn btn-sm text-white d-flex align-items-center gap-1.5 font-13 fw-semibold shadow-sm"
                    style={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 16px',
                    }}
                  >
                    <iconify-icon icon="solar:add-circle-broken" class="fs-16"></iconify-icon>
                    <span>Add FAQ</span>
                  </button>
                </div>
              </div>

              {/* FAQ Items List */}
              {currentFaqs.map((faq, idx) => (
                <div
                  key={faq.id || idx}
                  className="card border-0 shadow-sm rounded-4 overflow-hidden"
                  style={{ border: '1px solid #e2e8f0' }}
                >
                  <div className="card-header bg-light border-bottom px-4 py-2.5 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2">
                      <span
                        className="badge font-12 fw-semibold"
                        style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '4px', padding: '4px 8px' }}
                      >
                        FAQ #{idx + 1}
                      </span>
                      <span className="badge bg-secondary-subtle text-dark font-12 fw-medium text-capitalize">
                        Icon: {faq.icon || 'smile'}
                      </span>
                      <span className="fw-bold fs-13 text-dark text-truncate" style={{ maxWidth: '400px' }}>
                        {faq.question || 'Untitled Question'}
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-light border py-1 px-2"
                        disabled={idx === 0}
                        onClick={() => handleMoveFaq(idx, 'up')}
                        title="Move Up"
                        style={{ borderRadius: '6px' }}
                      >
                        <iconify-icon icon="solar:arrow-up-broken" class="fs-14"></iconify-icon>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border py-1 px-2"
                        disabled={idx === currentFaqs.length - 1}
                        onClick={() => handleMoveFaq(idx, 'down')}
                        title="Move Down"
                        style={{ borderRadius: '6px' }}
                      >
                        <iconify-icon icon="solar:arrow-down-broken" class="fs-14"></iconify-icon>
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-light border py-1 px-2 text-danger"
                        onClick={() =>
                          setDeleteConfirmFaq({
                            id: faq.id,
                            question: faq.question,
                          })
                        }
                        title="Delete FAQ"
                        style={{ borderRadius: '6px' }}
                      >
                        <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-14"></iconify-icon>
                      </button>
                    </div>
                  </div>

                  <div className="card-body p-4 bg-white">
                    <div className="row g-3 mb-3">
                      <div className="col-md-9">
                        <label className="form-label fs-13 fw-semibold text-dark mb-1">Question</label>
                        <input
                          type="text"
                          className="form-control fs-13 fw-semibold"
                          style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                          value={faq.question}
                          onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                          placeholder="Enter FAQ Question..."
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label fs-13 fw-semibold text-dark mb-1">Icon Style</label>
                        <select
                          className="form-select fs-13"
                          style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                          value={faq.icon || 'smile'}
                          onChange={(e) => handleUpdateFaq(idx, 'icon', e.target.value)}
                        >
                          <option value="smile">Smile Face (General / Trial)</option>
                          <option value="layers">Layers (Plans / Bulk)</option>
                          <option value="card">Card (Payments / Refunds)</option>
                          <option value="pencil">Pencil (Invoicing / PO)</option>
                          <option value="truck">Truck (Shipping / Delivery)</option>
                          <option value="shield">Shield (Certification / Standards)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">Answer</label>
                      <textarea
                        className="form-control fs-13"
                        style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        rows={3}
                        value={faq.answer}
                        onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                        placeholder="Enter comprehensive answer text..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ========================================================
              TAB 3: PRIVACY POLICY MANAGEMENT
             ======================================================== */}
          {activeTab === 'privacy' && (
            <>
              {/* Privacy Document Header Card */}
              <div
                className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden"
                style={{ border: '1px solid #e2e8f0' }}
              >
                <div className="card-header bg-light border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
                  <span className="fw-bold fs-14 text-dark">Document Metadata</span>
                  <button
                    type="button"
                    onClick={() => setShowAddSectionModal(true)}
                    className="btn btn-sm text-white d-flex align-items-center gap-1.5 font-13 fw-semibold"
                    style={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 16px',
                    }}
                  >
                    <iconify-icon icon="solar:add-circle-broken" class="fs-16"></iconify-icon>
                    <span>Add Section</span>
                  </button>
                </div>
                <div className="card-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">Document Title</label>
                      <input
                        type="text"
                        className="form-control fs-13"
                        style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        value={data.privacyPolicy.title}
                        onChange={(e) =>
                          setData({
                            ...data,
                            privacyPolicy: { ...data.privacyPolicy, title: e.target.value },
                          })
                        }
                        placeholder="Privacy Policy"
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">Subtitle / Header Description</label>
                      <input
                        type="text"
                        className="form-control fs-13"
                        style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        value={data.privacyPolicy.subtitle || ''}
                        onChange={(e) =>
                          setData({
                            ...data,
                            privacyPolicy: { ...data.privacyPolicy, subtitle: e.target.value },
                          })
                        }
                        placeholder="Our code of conduct, data protection commitments, and privacy pledge for our customers and platform members."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections List */}
              <div className="d-flex flex-column gap-3 mb-4">
                {data.privacyPolicy.sections.map((section, idx) => (
                  <div
                    key={section.id}
                    className="card border-0 shadow-sm rounded-4 overflow-hidden"
                    style={{ border: '1px solid #e2e8f0' }}
                  >
                    <div className="card-header bg-light border-bottom px-4 py-2.5 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge font-12 fw-semibold"
                          style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '3px', padding: '4px 8px' }}
                        >
                          Section #{idx + 1}
                        </span>
                        <span className="fw-bold fs-13 text-dark">{section.title || 'Untitled Section'}</span>
                      </div>

                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-light border py-1 px-2"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, 'up', 'privacy')}
                          title="Move Up"
                          style={{ borderRadius: '6px' }}
                        >
                          <iconify-icon icon="solar:arrow-up-broken" class="fs-14"></iconify-icon>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border py-1 px-2"
                          disabled={idx === data.privacyPolicy.sections.length - 1}
                          onClick={() => handleMoveSection(idx, 'down', 'privacy')}
                          title="Move Down"
                          style={{ borderRadius: '6px' }}
                        >
                          <iconify-icon icon="solar:arrow-down-broken" class="fs-14"></iconify-icon>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border py-1 px-2 text-danger"
                          onClick={() =>
                            setDeleteConfirmSection({
                              id: section.id,
                              title: section.title,
                              tab: 'privacy',
                            })
                          }
                          title="Delete Section"
                          style={{ borderRadius: '6px' }}
                        >
                          <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-14"></iconify-icon>
                        </button>
                      </div>
                    </div>

                    <div className="card-body p-4 bg-white">
                      <div className="mb-3">
                        <label className="form-label fs-13 fw-semibold text-dark mb-1">Section Heading</label>
                        <input
                          type="text"
                          className="form-control fs-13 fw-semibold"
                          style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                          value={section.title}
                          onChange={(e) => handleUpdateSection(idx, 'title', e.target.value, 'privacy')}
                          placeholder="e.g. 1. Overview & Commitment"
                        />
                      </div>

                      <div>
                        <label className="form-label fs-13 fw-semibold text-dark mb-1">Section Content</label>
                        <textarea
                          className="form-control fs-13"
                          style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                          rows={3}
                          value={section.content}
                          onChange={(e) => handleUpdateSection(idx, 'content', e.target.value, 'privacy')}
                          placeholder="Enter legal terms and descriptions..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ========================================================
              TAB 4: TERMS & CONDITIONS MANAGEMENT
             ======================================================== */}
          {activeTab === 'terms' && (
            <>
              {/* Terms Document Header Card */}
              <div
                className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden"
                style={{ border: '1px solid #e2e8f0' }}
              >
                <div className="card-header bg-light border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
                  <span className="fw-bold fs-14 text-dark">Document Metadata</span>
                  <button
                    type="button"
                    onClick={() => setShowAddSectionModal(true)}
                    className="btn btn-sm text-white d-flex align-items-center gap-1.5 font-13 fw-semibold"
                    style={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 16px',
                    }}
                  >
                    <iconify-icon icon="solar:add-circle-broken" class="fs-16"></iconify-icon>
                    <span>Add Section</span>
                  </button>
                </div>
                <div className="card-body p-4 bg-white">
                  <div className="row g-3">
                    <div className="col-md-4">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">Document Title</label>
                      <input
                        type="text"
                        className="form-control fs-13"
                        style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        value={data.terms.title}
                        onChange={(e) =>
                          setData({
                            ...data,
                            terms: { ...data.terms, title: e.target.value },
                          })
                        }
                        placeholder="Terms & Conditions"
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">Subtitle / Header Description</label>
                      <input
                        type="text"
                        className="form-control fs-13"
                        style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        value={data.terms.subtitle || ''}
                        onChange={(e) =>
                          setData({
                            ...data,
                            terms: { ...data.terms, subtitle: e.target.value },
                          })
                        }
                        placeholder="Our commercial terms, purchasing policies, and customer agreement for our products and services."
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections List */}
              <div className="d-flex flex-column gap-3 mb-4">
                {data.terms.sections.map((section, idx) => (
                  <div
                    key={section.id}
                    className="card border-0 shadow-sm rounded-4 overflow-hidden"
                    style={{ border: '1px solid #e2e8f0' }}
                  >
                    <div className="card-header bg-light border-bottom px-4 py-2.5 d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="badge font-12 fw-semibold"
                          style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '3px', padding: '4px 8px' }}
                        >
                          Section #{idx + 1}
                        </span>
                        <span className="fw-bold fs-13 text-dark">{section.title || 'Untitled Section'}</span>
                      </div>

                      <div className="d-flex align-items-center gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-light border py-1 px-2"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, 'up', 'terms')}
                          title="Move Up"
                          style={{ borderRadius: '6px' }}
                        >
                          <iconify-icon icon="solar:arrow-up-broken" class="fs-14"></iconify-icon>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border py-1 px-2"
                          disabled={idx === data.terms.sections.length - 1}
                          onClick={() => handleMoveSection(idx, 'down', 'terms')}
                          title="Move Down"
                          style={{ borderRadius: '6px' }}
                        >
                          <iconify-icon icon="solar:arrow-down-broken" class="fs-14"></iconify-icon>
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-light border py-1 px-2 text-danger"
                          onClick={() =>
                            setDeleteConfirmSection({
                              id: section.id,
                              title: section.title,
                              tab: 'terms',
                            })
                          }
                          title="Delete Section"
                          style={{ borderRadius: '6px' }}
                        >
                          <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-14"></iconify-icon>
                        </button>
                      </div>
                    </div>

                    <div className="card-body p-4 bg-white">
                      <div className="mb-3">
                        <label className="form-label fs-13 fw-semibold text-dark mb-1">Section Heading</label>
                        <input
                          type="text"
                          className="form-control fs-13 fw-semibold"
                          style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                          value={section.title}
                          onChange={(e) => handleUpdateSection(idx, 'title', e.target.value, 'terms')}
                          placeholder="e.g. 1. Acceptance of Terms"
                        />
                      </div>

                      <div>
                        <label className="form-label fs-13 fw-semibold text-dark mb-1">Section Content</label>
                        <textarea
                          className="form-control fs-13"
                          style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                          rows={3}
                          value={section.content}
                          onChange={(e) => handleUpdateSection(idx, 'content', e.target.value, 'terms')}
                          placeholder="Enter legal terms and descriptions..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ========================================================
          SYSTEM MODAL: ADD SECTION (PORTAL)
         ======================================================== */}
      {showAddSectionModal &&
        mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            tabIndex={-1}
            style={{
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999999,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddSectionModal(false);
              }
            }}
          >
            <div style={{ maxWidth: '580px', width: '100%', margin: 'auto', position: 'relative', zIndex: 10 }}>
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white">
                <div className="modal-header border-bottom px-4 py-3 bg-light d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:document-add-bold" class="fs-20 text-primary"></iconify-icon>
                    <h5 className="modal-title fs-16 fw-bold text-dark mb-0">
                      Add New {activeTab === 'privacy' ? 'Privacy Policy' : 'Terms'} Section
                    </h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddSectionModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fs-13 fw-semibold text-dark mb-1">
                      Section Title / Heading <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control fs-13"
                      style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                      value={newSectionTitle}
                      onChange={(e) => setNewSectionTitle(e.target.value)}
                      placeholder="e.g. 6. User Obligations & Safety Compliance"
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label fs-13 fw-semibold text-dark mb-1">
                      Section Content / Clauses <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control fs-13"
                      style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                      rows={6}
                      value={newSectionContent}
                      onChange={(e) => setNewSectionContent(e.target.value)}
                      placeholder="Enter legal clauses, detailed policy points, or commercial terms..."
                    />
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light d-flex align-items-center justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary fs-13 px-4 py-2 fw-medium"
                    style={{ borderRadius: '8px' }}
                    onClick={() => setShowAddSectionModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary fs-13 px-4 py-2 fw-semibold text-white"
                    style={{
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      borderColor: '#0f172a',
                    }}
                    onClick={handleAddSection}
                  >
                    Add Section
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================
          SYSTEM MODAL: ADD FAQ (PORTAL)
         ======================================================== */}
      {showAddFaqModal &&
        mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            tabIndex={-1}
            style={{
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999999,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAddFaqModal(false);
              }
            }}
          >
            <div style={{ maxWidth: '580px', width: '100%', margin: 'auto', position: 'relative', zIndex: 10 }}>
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white">
                <div className="modal-header border-bottom px-4 py-3 bg-light d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <iconify-icon icon="solar:question-circle-bold" class="fs-20 text-primary"></iconify-icon>
                    <h5 className="modal-title fs-16 fw-bold text-dark mb-0">Add New FAQ Question</h5>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddFaqModal(false)}
                    aria-label="Close"
                  ></button>
                </div>

                <div className="modal-body p-4">
                  <div className="row g-3 mb-3">
                    <div className="col-md-8">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">
                        Question <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control fs-13"
                        style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        value={newFaqQuestion}
                        onChange={(e) => setNewFaqQuestion(e.target.value)}
                        placeholder="e.g. Do you provide corporate credit terms?"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label fs-13 fw-semibold text-dark mb-1">Icon Style</label>
                      <select
                        className="form-select fs-13"
                        style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                        value={newFaqIcon}
                        onChange={(e) => setNewFaqIcon(e.target.value)}
                      >
                        <option value="smile">Smile Face</option>
                        <option value="layers">Layers (Plans)</option>
                        <option value="card">Card (Payment)</option>
                        <option value="pencil">Pencil (Invoice)</option>
                        <option value="truck">Truck (Shipping)</option>
                        <option value="shield">Shield (Quality)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label fs-13 fw-semibold text-dark mb-1">
                      Answer / Explanation <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control fs-13"
                      style={{ borderColor: '#cbd5e1', borderRadius: '8px' }}
                      rows={5}
                      value={newFaqAnswer}
                      onChange={(e) => setNewFaqAnswer(e.target.value)}
                      placeholder="Enter detailed answer text that will display when users expand this accordion item..."
                    />
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3 bg-light d-flex align-items-center justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary fs-13 px-4 py-2 fw-medium"
                    style={{ borderRadius: '8px' }}
                    onClick={() => setShowAddFaqModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary fs-13 px-4 py-2 fw-semibold text-white"
                    style={{
                      borderRadius: '8px',
                      backgroundColor: '#0f172a',
                      borderColor: '#0f172a',
                    }}
                    onClick={handleAddFaq}
                  >
                    Add FAQ
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================
          SYSTEM MODAL: DELETE SECTION CONFIRMATION (PORTAL)
         ======================================================== */}
      {deleteConfirmSection &&
        mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            tabIndex={-1}
            style={{
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999999,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setDeleteConfirmSection(null);
              }
            }}
          >
            <div style={{ maxWidth: '440px', width: '100%', margin: 'auto', position: 'relative', zIndex: 10 }}>
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white text-center p-4">
                <div
                  className="mx-auto d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                  }}
                >
                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-28"></iconify-icon>
                </div>

                <h4 className="fs-18 fw-bold text-dark mb-2">Delete Section?</h4>
                <p className="text-muted fs-13 mb-4" style={{ lineHeight: 1.5 }}>
                  Are you sure you want to remove &quot;{deleteConfirmSection.title}&quot;? This action will apply once you click Save Changes.
                </p>

                <div className="d-flex align-items-center justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary fs-13 px-4 py-2 fw-medium"
                    style={{ borderRadius: '8px' }}
                    onClick={() => setDeleteConfirmSection(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger fs-13 px-4 py-2 fw-semibold d-flex align-items-center gap-1.5"
                    style={{ borderRadius: '8px', backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                    onClick={handleDeleteSection}
                  >
                    <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-16"></iconify-icon>
                    <span>Yes, Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================
          SYSTEM MODAL: DELETE FAQ CONFIRMATION (PORTAL)
         ======================================================== */}
      {deleteConfirmFaq &&
        mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            tabIndex={-1}
            style={{
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999999,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setDeleteConfirmFaq(null);
              }
            }}
          >
            <div style={{ maxWidth: '440px', width: '100%', margin: 'auto', position: 'relative', zIndex: 10 }}>
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white text-center p-4">
                <div
                  className="mx-auto d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                  }}
                >
                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-28"></iconify-icon>
                </div>

                <h4 className="fs-18 fw-bold text-dark mb-2">Delete FAQ Item?</h4>
                <p className="text-muted fs-13 mb-4" style={{ lineHeight: 1.5 }}>
                  Are you sure you want to remove &quot;{deleteConfirmFaq.question}&quot;? This action will apply once you click Save Changes.
                </p>

                <div className="d-flex align-items-center justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary fs-13 px-4 py-2 fw-medium"
                    style={{ borderRadius: '8px' }}
                    onClick={() => setDeleteConfirmFaq(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger fs-13 px-4 py-2 fw-semibold d-flex align-items-center gap-1.5"
                    style={{ borderRadius: '8px', backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                    onClick={handleDeleteFaq}
                  >
                    <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-16"></iconify-icon>
                    <span>Yes, Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ========================================================
          SYSTEM MODAL: RESET CONFIRMATION (PORTAL)
         ======================================================== */}
      {showResetConfirmModal &&
        mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            tabIndex={-1}
            style={{
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              zIndex: 9999999,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(5px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflowY: 'auto',
              padding: '1.5rem',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowResetConfirmModal(false);
              }
            }}
          >
            <div style={{ maxWidth: '440px', width: '100%', margin: 'auto', position: 'relative', zIndex: 10 }}>
              <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white text-center p-4">
                <div
                  className="mx-auto d-flex align-items-center justify-content-center mb-3"
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '50%',
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                  }}
                >
                  <iconify-icon icon="solar:danger-triangle-bold" class="fs-28"></iconify-icon>
                </div>

                <h4 className="fs-18 fw-bold text-dark mb-2">Reset to Defaults?</h4>
                <p className="text-muted fs-13 mb-4" style={{ lineHeight: 1.5 }}>
                  This will restore Contact Us, FAQs, Privacy Policy, and Terms &amp; Conditions to their initial presets.
                </p>

                <div className="d-flex align-items-center justify-content-center gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary fs-13 px-4 py-2 fw-medium"
                    style={{ borderRadius: '8px' }}
                    onClick={() => setShowResetConfirmModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-warning fs-13 px-4 py-2 fw-semibold text-dark"
                    style={{ borderRadius: '8px', backgroundColor: '#f59e0b', borderColor: '#f59e0b' }}
                    onClick={handleResetToDefault}
                  >
                    Confirm Reset
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
