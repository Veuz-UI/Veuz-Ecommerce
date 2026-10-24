'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  fetchFooterSetup,
  saveFooterSetup,
  FooterSetupData,
  FooterFeatureItem,
  FooterAppDownloadItem,
  FooterPaymentMethodItem,
  FooterSocialLinkItem,
  DEFAULT_FOOTER_SETUP,
} from '@/services/footerSetupService';
import { useToast } from '@/context/ToastContext';

export default function FooterSetupDashboardPage() {
  const [footerData, setFooterData] = useState<FooterSetupData>(DEFAULT_FOOTER_SETUP);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'features' | 'columns' | 'apps' | 'payments' | 'social'>('features');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // New item modal / form states
  const [showAddSocialModal, setShowAddSocialModal] = useState(false);
  const [newSocialPlatform, setNewSocialPlatform] = useState('youtube');
  const [newSocialName, setNewSocialName] = useState('YouTube');
  const [newSocialUrl, setNewSocialUrl] = useState('https://youtube.com');

  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPaymentName, setNewPaymentName] = useState('');
  const [newPaymentCode, setNewPaymentCode] = useState('');

  const [showAddAppModal, setShowAddAppModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppSubText, setNewAppSubText] = useState('EXPLORE IT ON');
  const [newAppUrl, setNewAppUrl] = useState('');

  // System Confirmation Modals (Replaces native browser confirm)
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{
    id: string;
    type: 'app' | 'payment' | 'social';
    name: string;
  } | null>(null);

  const { showToast } = useToast();

  // Lock body scroll whenever any modal is open
  useEffect(() => {
    const isModalOpen =
      showAddSocialModal ||
      showAddPaymentModal ||
      showAddAppModal ||
      showResetConfirmModal ||
      !!deleteConfirmItem;
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showAddSocialModal, showAddPaymentModal, showAddAppModal, showResetConfirmModal, deleteConfirmItem]);

  // Load from API & Cache
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchFooterSetup();
      setFooterData(data);
    } catch (err: any) {
      console.error('Error loading footer setup:', err);
      showToast('danger', 'Failed to load footer setup data.');
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
      const res = await saveFooterSetup(footerData);
      if (res.success) {
        showToast('success', res.message || 'Footer setup successfully saved and updated on storefront!');
      } else {
        showToast('danger', res.message || 'Failed to save footer setup.');
      }
    } catch (err: any) {
      console.error('Save error:', err);
      showToast('danger', 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Open system reset confirmation modal
  const handleReset = () => {
    setShowResetConfirmModal(true);
  };

  const handleConfirmReset = () => {
    setFooterData(DEFAULT_FOOTER_SETUP);
    setShowResetConfirmModal(false);
    showToast('info', 'Reset to defaults. Remember to click "Save Changes" to apply.');
  };

  // Execute deletion confirmed from system modal
  const handleExecuteDelete = () => {
    if (!deleteConfirmItem) return;
    if (deleteConfirmItem.type === 'app') {
      setFooterData((prev) => ({
        ...prev,
        appDownload: {
          ...prev.appDownload,
          apps: prev.appDownload.apps.filter((a) => a.id !== deleteConfirmItem.id),
        },
      }));
      showToast('info', 'App download button removed.');
    } else if (deleteConfirmItem.type === 'payment') {
      setFooterData((prev) => ({
        ...prev,
        paymentMethods: {
          ...prev.paymentMethods,
          methods: prev.paymentMethods.methods.filter((m) => m.id !== deleteConfirmItem.id),
        },
      }));
      showToast('info', 'Payment method badge removed.');
    } else if (deleteConfirmItem.type === 'social') {
      setFooterData((prev) => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          links: prev.socialLinks.links.filter((s) => s.id !== deleteConfirmItem.id),
        },
      }));
      showToast('info', 'Social link removed.');
    }
    setDeleteConfirmItem(null);
  };

  // ----------------------------------------------------
  // Feature Highlights Handlers (Top 4 Cards)
  // ----------------------------------------------------
  const handleToggleFeaturesSectionVisibility = (isVisible: boolean) => {
    setFooterData((prev) => ({
      ...prev,
      features: {
        ...(prev.features || DEFAULT_FOOTER_SETUP.features!),
        isVisible,
      },
    }));
  };

  const handleToggleFeatureItemVisibility = (itemId: string) => {
    setFooterData((prev) => {
      const currentFeatures = prev.features || DEFAULT_FOOTER_SETUP.features!;
      return {
        ...prev,
        features: {
          ...currentFeatures,
          items: currentFeatures.items.map((item) =>
            item.id === itemId ? { ...item, isVisible: !item.isVisible } : item
          ),
        },
      };
    });
  };

  const handleUpdateFeatureText = (itemId: string, field: 'title' | 'subtitle', value: string) => {
    setFooterData((prev) => {
      const currentFeatures = prev.features || DEFAULT_FOOTER_SETUP.features!;
      return {
        ...prev,
        features: {
          ...currentFeatures,
          items: currentFeatures.items.map((item) =>
            item.id === itemId ? { ...item, [field]: value } : item
          ),
        },
      };
    });
  };

  const renderFeatureIcon = (icon: string) => {
    switch (icon) {
      case 'pickup':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4" />
            <path d="M21 9c0 1.66-1.34 3-3 3s-3-1.34-3-3c0 1.66-1.34 3-3 3s-3-1.34-3-3c0 1.66-1.34 3-3 3s-3-1.34-3-3" />
            <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
            <path d="M10 21v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5" />
          </svg>
        );
      case 'shipping':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7.5 4.27 9 5.15" />
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
          </svg>
        );
      case 'payment':
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="20" height="13" rx="2.5" />
            <circle cx="12" cy="12.5" r="2.5" />
            <path d="M6 10h.01M18 15h.01" />
          </svg>
        );
      case 'help':
      default:
        return (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 14h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6a10 10 0 0 1 20 0v6a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h2" />
          </svg>
        );
    }
  };

  // ----------------------------------------------------
  // Link Columns Handlers (Navigation, Categories, Common, Support)
  // ----------------------------------------------------
  const handleUpdateColumnTitle = (colId: string, title: string) => {
    setFooterData((prev) => {
      const currentCols = prev.linkColumns?.columns || DEFAULT_FOOTER_SETUP.linkColumns!.columns;
      return {
        ...prev,
        linkColumns: {
          isVisible: prev.linkColumns?.isVisible !== false,
          columns: currentCols.map((col) => (col.id === colId ? { ...col, title } : col)),
        },
      };
    });
  };

  const handleToggleColumnVisibility = (colId: string) => {
    setFooterData((prev) => {
      const currentCols = prev.linkColumns?.columns || DEFAULT_FOOTER_SETUP.linkColumns!.columns;
      return {
        ...prev,
        linkColumns: {
          isVisible: prev.linkColumns?.isVisible !== false,
          columns: currentCols.map((col) => (col.id === colId ? { ...col, isVisible: !col.isVisible } : col)),
        },
      };
    });
  };

  // ----------------------------------------------------
  // App Download Handlers
  // ----------------------------------------------------
  const handleToggleAppVisibility = (appId: string) => {
    setFooterData((prev) => ({
      ...prev,
      appDownload: {
        ...prev.appDownload,
        apps: prev.appDownload.apps.map((app) =>
          app.id === appId ? { ...app, isVisible: !app.isVisible } : app
        ),
      },
    }));
  };

  const handleUpdateAppUrl = (appId: string, url: string) => {
    setFooterData((prev) => ({
      ...prev,
      appDownload: {
        ...prev.appDownload,
        apps: prev.appDownload.apps.map((app) =>
          app.id === appId ? { ...app, url } : app
        ),
      },
    }));
  };

  const handleAddApp = () => {
    if (!newAppName.trim() || !newAppUrl.trim()) {
      showToast('warning', 'Please provide an App Store name and URL.');
      return;
    }

    const newApp: FooterAppDownloadItem = {
      id: `app-${Date.now()}`,
      name: newAppName.trim(),
      subText: newAppSubText.trim() || 'DOWNLOAD NOW',
      url: newAppUrl.trim(),
      isVisible: true,
    };

    setFooterData((prev) => ({
      ...prev,
      appDownload: {
        ...prev.appDownload,
        apps: [...prev.appDownload.apps, newApp],
      },
    }));

    setNewAppName('');
    setNewAppUrl('');
    setShowAddAppModal(false);
    showToast('success', `${newApp.name} added to footer apps!`);
  };

  const handleDeleteApp = (appId: string) => {
    setFooterData((prev) => ({
      ...prev,
      appDownload: {
        ...prev.appDownload,
        apps: prev.appDownload.apps.filter((app) => app.id !== appId),
      },
    }));
    showToast('info', 'App download button removed.');
  };

  // ----------------------------------------------------
  // Payment Methods Handlers
  // ----------------------------------------------------
  const handleTogglePaymentVisibility = (paymentId: string) => {
    setFooterData((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        methods: prev.paymentMethods.methods.map((method) =>
          method.id === paymentId ? { ...method, isVisible: !method.isVisible } : method
        ),
      },
    }));
  };

  const handleUpdatePaymentLink = (paymentId: string, linkUrl: string) => {
    setFooterData((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        methods: prev.paymentMethods.methods.map((method) =>
          method.id === paymentId ? { ...method, linkUrl } : method
        ),
      },
    }));
  };

  const handleAddPayment = () => {
    if (!newPaymentName.trim()) {
      showToast('warning', 'Please enter a payment method name.');
      return;
    }

    const code = newPaymentCode.trim() || newPaymentName.toLowerCase().replace(/\s+/g, '-');
    const newPayment: FooterPaymentMethodItem = {
      id: `pay-${Date.now()}`,
      name: newPaymentName.trim(),
      code,
      isVisible: true,
      linkUrl: '#',
    };

    setFooterData((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        methods: [...prev.paymentMethods.methods, newPayment],
      },
    }));

    setNewPaymentName('');
    setNewPaymentCode('');
    setShowAddPaymentModal(false);
    showToast('success', `${newPayment.name} added to payment methods!`);
  };

  const handleDeletePayment = (paymentId: string) => {
    setFooterData((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        methods: prev.paymentMethods.methods.filter((m) => m.id !== paymentId),
      },
    }));
    showToast('info', 'Payment method badge removed.');
  };

  // ----------------------------------------------------
  // Social Links Handlers
  // ----------------------------------------------------
  const handleToggleSocialVisibility = (socialId: string) => {
    setFooterData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        links: prev.socialLinks.links.map((link) =>
          link.id === socialId ? { ...link, isVisible: !link.isVisible } : link
        ),
      },
    }));
  };

  const handleUpdateSocialUrl = (socialId: string, url: string) => {
    setFooterData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        links: prev.socialLinks.links.map((link) =>
          link.id === socialId ? { ...link, url } : link
        ),
      },
    }));
  };

  const handleAddSocialLink = () => {
    if (!newSocialUrl.trim()) {
      showToast('warning', 'Please provide a valid URL for the social channel.');
      return;
    }

    const newSocial: FooterSocialLinkItem = {
      id: `social-${Date.now()}`,
      name: newSocialName.trim() || newSocialPlatform.toUpperCase(),
      platform: newSocialPlatform,
      url: newSocialUrl.trim(),
      isVisible: true,
    };

    setFooterData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        links: [...prev.socialLinks.links, newSocial],
      },
    }));

    setNewSocialUrl('');
    setShowAddSocialModal(false);
    showToast('success', `${newSocial.name} added to social channels!`);
  };

  const handleDeleteSocial = (socialId: string) => {
    setFooterData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        links: prev.socialLinks.links.filter((s) => s.id !== socialId),
      },
    }));
    showToast('info', 'Social link removed.');
  };

  const renderAppIcon = (app: FooterAppDownloadItem, size = 18) => {
    const isApple =
      app.id === 'app-store' ||
      app.id.toLowerCase().includes('apple') ||
      app.name.toLowerCase().includes('apple') ||
      app.name.toLowerCase().includes('app store');

    const isGoogle =
      app.id === 'google-play' ||
      app.id.toLowerCase().includes('google') ||
      app.id.toLowerCase().includes('play') ||
      app.name.toLowerCase().includes('google') ||
      app.name.toLowerCase().includes('play');

    if (isApple) {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8.8086 14.9194l6.1107-11.0368c.0837-.1513.1682-.302.2437-.4584.0685-.142.1267-.2854.1646-.4403.0803-.3259.0588-.6656-.066-.9767-.1238-.3095-.3417-.5678-.6201-.7355a1.4175 1.4175 0 0 0-.921-.1924c-.3207.043-.6135.1935-.8443.4288-.1094.1118-.1996.2361-.2832.369-.092.1463-.175.2979-.259.4492l-.3864.6979-.3865-.6979c-.0837-.1515-.1667-.303-.2587-.4492-.0837-.1329-.1739-.2572-.2835-.369-.2305-.2353-.5233-.3857-.844-.429a1.4181 1.4181 0 0 0-.921.1926c-.2784.1677-.4964.426-.6203.7355-.1246.311-.1461.6508-.066.9767.038.155.0962.2984.1648.4403.0753.1564.1598.307.2437.4584l1.248 2.2543-4.8625 8.7825H2.0295c-.1676 0-.3351-.0007-.5026.0092-.1522.009-.3004.0284-.448.0714-.3108.0906-.5822.2798-.7783.548-.195.2665-.3006.5929-.3006.9279 0 .3352.1057.6612.3006.9277.196.2683.4675.4575.7782.548.1477.043.296.0623.4481.0715.1675.01.335.009.5026.009h13.0974c.0171-.0357.059-.1294.1-.2697.415-1.4151-.6156-2.843-2.0347-2.843zM3.113 18.5418l-.7922 1.5008c-.0818.1553-.1644.31-.2384.4705-.067.1458-.124.293-.1611.452-.0785.3346-.0576.6834.0645 1.0029.1212.3175.3346.583.607.7549.2727.172.5891.2416.9013.1975.3139-.044.6005-.1986.8263-.4402.1072-.1148.1954-.2424.2772-.3787.0902-.1503.1714-.3059.2535-.4612L6 19.4636c-.0896-.149-.9473-1.4704-2.887-.9218m20.5861-3.0056a1.4707 1.4707 0 0 0-.779-.5407c-.1476-.0425-.2961-.0616-.4483-.0705-.1678-.0099-.3352-.0091-.503-.0091H18.648l-4.3891-7.817c-.6655.7005-.9632 1.485-1.0773 2.1976-.1655 1.0333.0367 2.0934.546 3.0004l5.2741 9.3933c.084.1494.167.299.2591.4435.0837.131.1739.2537.2836.364.231.2323.5238.3809.8449.4232.3192.0424.643-.0244.9217-.1899.2784-.1653.4968-.4204.621-.7257.1246-.3072.146-.6425.0658-.9641-.0381-.1529-.0962-.2945-.165-.4346-.0753-.1543-.1598-.303-.2438-.4524l-1.216-2.1662h1.596c.1677 0 .3351.0009.5029-.009.1522-.009.3007-.028.4483-.0705a1.4707 1.4707 0 0 0 .779-.5407A1.5386 1.5386 0 0 0 24 16.452a1.539 1.539 0 0 0-.3009-.9158Z" />
        </svg>
      );
    }

    if (isGoogle) {
      return (
        <svg width={size} height={Math.round(size * 1.1)} viewBox="0 0 512 512">
          <path fill="#4285F4" d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1z" />
          <path fill="#34A853" d="M47 37.6C44.1 43.1 42.5 49.8 42.5 57.3v397.4c0 7.5 1.6 14.2 4.5 19.7L252.7 268.7 47 37.6z" />
          <path fill="#FBBC04" d="M425.2 216.5l-40 23-59.9-5.2-60-60 159.9 42.2z" />
          <path fill="#EA4335" d="M325.3 277.7l60.1 60.1-280.8 161.2 220.7-221.3z" />
          <path fill="#FBBC04" d="M465.1 239.5l-39.9-23-40.4 40.4 40.4 40.4 40.9-23.5c14.2-8.2 14.2-26.1-1-34.3z" />
        </svg>
      );
    }

    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    );
  };

  const renderPaymentBadgePreview = (method: FooterPaymentMethodItem, height = '28px') => {
    const code = (method.code || '').toLowerCase();

    if (code === 'apple-pay' || code === 'applepay') {
      return (
        <span
          className="pay-badge apple-pay-badge"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            height,
            padding: '4px 10px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Apple Pay"
        >
          <svg width="34" height="16" viewBox="4.5 7.8 17.5 9" fill="#000000" style={{ display: 'block' }}>
            <path d="M8.86 8.018c-.3.016-.668.199-.88.456-.191.22-.36.58-.316.918.338.03.675-.169.888-.418.205-.258.345-.603.308-.955z M11.067 8.438v5.493h.852v-1.877h1.18c1.078 0 1.835-.739 1.835-1.812 0-1.07-.742-1.805-1.808-1.805zm.852.719h.982c.739 0 1.161.396 1.161 1.089 0 .692-.422 1.092-1.164 1.092h-.979z M7.913 9.457c-.45.01-.83.28-1.05.28-.235 0-.593-.264-.981-.257a1.446 1.446 0 0 0-1.23.747c-.527.908-.139 2.255.374 2.995.249.366.549.769.944.754.373-.014.52-.242.973-.242.454 0 .586.242.98.235.41-.007.667-.366.915-.733.286-.417.403-.82.41-.841-.007-.008-.79-.308-.797-1.209-.008-.754.615-1.113.644-1.135-.352-.52-.9-.578-1.09-.593a1.123 1.123 0 0 0-.092-.002z M16.117 9.854c-.99 0-1.606.533-1.652 1.256h.777c.072-.358.369-.586.845-.586.502 0 .803.266.803.711v.309l-1.097.064c-.951.054-1.488.484-1.488 1.184 0 .72.548 1.207 1.332 1.207.526 0 1.032-.281 1.264-.727h.019v.659h.788v-2.76c0-.803-.62-1.317-1.591-1.317zm-1.167 2.189v.316c0 .521-.45.917-1.024.917-.442 0-.731-.228-.731-.579 0-.342.278-.56.769-.593z M18.057 9.926l1.446 4.009c0 .003-.073.24-.073.247-.125.41-.33.571-.711.571-.069 0-.206 0-.267-.015v.666c.06.011.267.019.335.019.83 0 1.226-.312 1.568-1.283l1.5-4.214h-.868l-1.012 3.259h-.015l-1.013-3.26z" />
          </svg>
        </span>
      );
    }

    if (code === 'mc' || code === 'mastercard') {
      return (
        <span
          className="pay-badge mc-badge"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            height,
            padding: '3px 8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Mastercard"
        >
          <svg width="26" height="16" viewBox="0 0 36 24">
            <circle cx="13" cy="12" r="10" fill="#EB001B" />
            <circle cx="23" cy="12" r="10" fill="#F79E1B" fillOpacity="0.9" />
          </svg>
        </span>
      );
    }

    if (code === 'g-pay' || code === 'google-pay') {
      return (
        <span
          className="pay-badge g-pay-badge"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            height,
            padding: '4px 8px',
            color: '#5f6368',
            fontWeight: 700,
            fontSize: '11.5px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#4285F4', fontWeight: '900', marginRight: '2px' }}>G</span> Pay
        </span>
      );
    }

    if (code === 'tabby') {
      return (
        <span
          className="pay-badge tabby-badge"
          style={{
            backgroundColor: '#3bfdbb',
            color: '#000000',
            fontWeight: 800,
            fontSize: '12px',
            borderRadius: '6px',
            height,
            padding: '4px 8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          tabby
        </span>
      );
    }

    if (code === 'tamara') {
      return (
        <span
          className="pay-badge tamara-badge"
          style={{
            backgroundColor: '#ffedd5',
            color: '#9a3412',
            fontWeight: 800,
            fontSize: '11.5px',
            border: '1px solid #fed7aa',
            borderRadius: '6px',
            height,
            padding: '4px 8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          tamara
        </span>
      );
    }

    if (code === 'visa') {
      return (
        <span
          className="pay-badge visa-badge"
          style={{
            backgroundColor: '#ffffff',
            color: '#1a1f71',
            fontWeight: 900,
            fontStyle: 'italic',
            fontSize: '13px',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            height,
            padding: '4px 8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          VISA
        </span>
      );
    }

    if (code === 'amex') {
      return (
        <span
          className="pay-badge amex-badge"
          style={{
            backgroundColor: '#006fcf',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '10.5px',
            letterSpacing: '0.5px',
            borderRadius: '6px',
            height,
            padding: '4px 8px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          AMEX
        </span>
      );
    }

    return (
      <span
        className="pay-badge"
        style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #cbd5e1',
          color: '#0f172a',
          fontWeight: 700,
          borderRadius: '6px',
          height,
          padding: '4px 8px',
          fontSize: '11.5px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {method.name}
      </span>
    );
  };

  if (isLoading) {
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
          <p className="mt-3 text-muted fs-14 mb-0">Loading Footer Setup...</p>
        </div>
      </div>
    );
  }

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
            <span className="text-dark fw-bold">Footer Setup</span>
          </div>

          {/* 2. Page Header & Actions Bar */}
          <div className="d-flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
            <div>
              <h2
                className="fw-bold text-dark"
                style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a', marginBottom: '8px' }}
              >
                Footer Setup
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Manage links, toggles, and visibility for App Download, Payment Methods, and Social Channels.
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold"
                onClick={loadData}
                disabled={isLoading || isSaving}
                style={{
                  borderRadius: '8px',
                  padding: '9px 18px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #d1d5db',
                  color: '#0f172a',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
                  transition: 'all 0.2s ease',
                }}
              >
                <iconify-icon icon="solar:restart-bold" class={`fs-16 ${isLoading ? 'spin' : ''}`}></iconify-icon>
                <span>Refresh</span>
              </button>

              <button
                type="button"
                className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold text-white"
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #0f172a',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  boxShadow: '0 2px 4px rgba(15, 23, 42, 0.1)',
                }}
              >
                {isSaving ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <iconify-icon icon="solar:check-read-linear" class="fs-16"></iconify-icon>
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>

      {/* 3. Section Navigation Tabs */}
      <ul className="nav nav-pills gap-2 mb-4 p-2 bg-light rounded-3" style={{ border: '1px solid #e2e8f0' }}>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fs-13 fw-semibold px-4 py-2 d-flex align-items-center gap-2 ${activeTab === 'features' ? 'active shadow-sm' : 'text-dark'}`}
            onClick={() => setActiveTab('features')}
            style={activeTab === 'features' ? { backgroundColor: '#0f172a', color: '#fff' } : {}}
          >
            <iconify-icon icon="solar:shop-2-broken"></iconify-icon>
            <span>Feature Highlights ({(footerData.features?.items || DEFAULT_FOOTER_SETUP.features!.items).filter((f) => f.isVisible).length}/{(footerData.features?.items || DEFAULT_FOOTER_SETUP.features!.items).length})</span>
          </button>
        </li>

        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fs-13 fw-semibold px-4 py-2 d-flex align-items-center gap-2 ${activeTab === 'columns' ? 'active shadow-sm' : 'text-dark'}`}
            onClick={() => setActiveTab('columns')}
            style={activeTab === 'columns' ? { backgroundColor: '#0f172a', color: '#fff' } : {}}
          >
            <iconify-icon icon="solar:widget-2-broken"></iconify-icon>
            <span>Footer Links ({(footerData.linkColumns?.columns || DEFAULT_FOOTER_SETUP.linkColumns!.columns).filter((c) => c.isVisible).length}/4 Columns)</span>
          </button>
        </li>

        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fs-13 fw-semibold px-4 py-2 d-flex align-items-center gap-2 ${activeTab === 'apps' ? 'active shadow-sm' : 'text-dark'}`}
            onClick={() => setActiveTab('apps')}
            style={activeTab === 'apps' ? { backgroundColor: '#0f172a', color: '#fff' } : {}}
          >
            <iconify-icon icon="solar:smartphone-broken"></iconify-icon>
            <span>Download Our App ({footerData.appDownload.apps.filter((a) => a.isVisible).length}/{footerData.appDownload.apps.length})</span>
          </button>
        </li>

        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fs-13 fw-semibold px-4 py-2 d-flex align-items-center gap-2 ${activeTab === 'payments' ? 'active shadow-sm' : 'text-dark'}`}
            onClick={() => setActiveTab('payments')}
            style={activeTab === 'payments' ? { backgroundColor: '#0f172a', color: '#fff' } : {}}
          >
            <iconify-icon icon="solar:card-2-broken"></iconify-icon>
            <span>Payment Methods ({footerData.paymentMethods.methods.filter((m) => m.isVisible).length}/{footerData.paymentMethods.methods.length})</span>
          </button>
        </li>

        <li className="nav-item">
          <button
            type="button"
            className={`nav-link fs-13 fw-semibold px-4 py-2 d-flex align-items-center gap-2 ${activeTab === 'social' ? 'active shadow-sm' : 'text-dark'}`}
            onClick={() => setActiveTab('social')}
            style={activeTab === 'social' ? { backgroundColor: '#0f172a', color: '#fff' } : {}}
          >
            <iconify-icon icon="solar:share-circle-broken"></iconify-icon>
            <span>Stay Connected ({footerData.socialLinks.links.filter((s) => s.isVisible).length}/{footerData.socialLinks.links.length})</span>
          </button>
        </li>
      </ul>

      {/* 4. Tab 0: Feature Highlights */}
      {activeTab === 'features' && (() => {
        const currentFeatures = footerData.features || DEFAULT_FOOTER_SETUP.features!;
        const activeCount = currentFeatures.items.filter((i) => i.isVisible).length;

        return (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-bottom px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Top Feature Highlights</h5>
                <p className="text-muted fs-13 mb-0">
                  Update text, activate, or hide any of the 4 benefit cards. When any card is hidden, the remaining cards automatically divide the space and cover the area evenly.
                </p>
              </div>

              <div className="d-flex align-items-center gap-3">
                <span className="badge bg-light text-dark border px-2.5 py-1.5 fs-12 fw-semibold">
                  {activeCount} of {currentFeatures.items.length} Active
                </span>

                <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="featuresSectionToggle"
                    checked={currentFeatures.isVisible}
                    onChange={(e) => handleToggleFeaturesSectionVisibility(e.target.checked)}
                    style={{ width: '42px', height: '22px', cursor: 'pointer' }}
                  />
                  <label className="form-check-label fs-13 fw-semibold" htmlFor="featuresSectionToggle" style={{ cursor: 'pointer' }}>
                    {currentFeatures.isVisible ? 'Section Enabled' : 'Section Hidden'}
                  </label>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              <div className="row g-4">
                {currentFeatures.items.map((item, idx) => (
                  <div key={item.id} className="col-12 col-md-6">
                    <div
                      className="rounded-4 border h-100 position-relative shadow-sm"
                      style={{
                        padding: '24px',
                        backgroundColor: item.isVisible ? '#ffffff' : '#f8fafc',
                        borderColor: item.isVisible ? '#e2e8f0' : '#f1f5f9',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Card Header: Icon + Status Toggle */}
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                        <div className="d-flex align-items-center gap-3">
                          <span
                            className="d-flex align-items-center justify-content-center rounded-3"
                            style={{
                              width: '46px',
                              height: '46px',
                              backgroundColor: item.isVisible ? '#eff6ff' : '#f1f5f9',
                              border: item.isVisible ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                              flexShrink: 0,
                            }}
                          >
                            {renderFeatureIcon(item.icon)}
                          </span>
                          <div>
                            <span className="badge bg-light text-secondary border fs-11 fw-semibold mb-1">
                              Card #{idx + 1}
                            </span>
                            <h6 className="fw-bold mb-0 fs-15" style={{ color: item.isVisible ? '#0f172a' : '#94a3b8' }}>
                              {item.title || 'Feature Card'}
                            </h6>
                          </div>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          <span className={`fs-12 fw-semibold ${item.isVisible ? 'text-success' : 'text-muted'}`}>
                            {item.isVisible ? 'Active' : 'Hidden'}
                          </span>
                          <div className="form-check form-switch m-0 d-flex align-items-center">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              checked={item.isVisible}
                              onChange={() => handleToggleFeatureItemVisibility(item.id)}
                              style={{ width: '42px', height: '22px', cursor: 'pointer' }}
                              title={item.isVisible ? 'Click to hide card' : 'Click to activate card'}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card Form: Title & Subtitle Edit Inputs */}
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <label className="form-label fs-12 fw-semibold text-secondary mb-1.5">
                            Heading Title Text
                          </label>
                          <input
                            type="text"
                            className="form-control fs-13 py-2 px-3"
                            value={item.title}
                            onChange={(e) => handleUpdateFeatureText(item.id, 'title', e.target.value)}
                            placeholder="e.g. Free in-store pick up"
                            disabled={!item.isVisible}
                            style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                          />
                        </div>

                        <div>
                          <label className="form-label fs-12 fw-semibold text-secondary mb-1.5">
                            Subtitle / Tagline Text
                          </label>
                          <input
                            type="text"
                            className="form-control fs-13 py-2 px-3"
                            value={item.subtitle}
                            onChange={(e) => handleUpdateFeatureText(item.id, 'subtitle', e.target.value)}
                            placeholder="e.g. 24/7 Amazing services"
                            disabled={!item.isVisible}
                            style={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>

              {/* Informational Guidance Alert */}
              <div
                className="mt-4 p-3 rounded-3 d-flex align-items-center gap-2.5"
                style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' }}
              >
                <iconify-icon icon="solar:info-circle-bold" class="fs-20 flex-shrink-0"></iconify-icon>
                <span className="fs-13">
                  <strong>Automatic Responsive Space Division:</strong> When 4 cards are active, they render as 4 equal columns. If any cards are hidden (e.g. only 2 active), the remaining cards automatically divide the entire width 50% / 50% to cover the whole footer area smoothly on desktop, tablet, and mobile.
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 5. Tab 1: Footer Link Columns (Navigation, Categories, Common Pages, Support) */}
      {activeTab === 'columns' && (() => {
        const columns = footerData.linkColumns?.columns || DEFAULT_FOOTER_SETUP.linkColumns!.columns;

        const getColumnDetails = (type: string) => {
          switch (type) {
            case 'navigation':
              return {
                badge: 'MAIN STORE PAGES',
                badgeBg: '#e0f2fe',
                badgeColor: '#0284c7',
                desc: 'Main storefront pages and shopping destinations (excluding product categories).',
                previewItems: ['Home', 'All Products', 'New Arrivals', 'Hot Sales', 'Limited Offers', 'Most Searched'],
              };
            case 'categories':
              return {
                badge: 'LIVE STORE CATEGORIES',
                badgeBg: '#ecfdf5',
                badgeColor: '#059669',
                desc: 'Dynamically connected to active catalog categories configured under Shop Settings → Categories.',
                previewItems: ['Safety Helmet', 'Safety Shoes', 'Cut Gloves', 'Safety Goggles', 'Ear Protection', 'Respirators', 'Fall Harness', '+ All Categories'],
              };
            case 'common':
              return {
                badge: 'CATEGORIES (BALANCE / ROW 2)',
                badgeBg: '#fef3c7',
                badgeColor: '#d97706',
                desc: 'Displays the balance/remaining categories without a heading, ending with "View all categories".',
                previewItems: ['Respirators', 'Fall Harness', 'PPE KIT', 'Safety Bags', 'View all categories'],
              };
            case 'support':
            default:
              return {
                badge: 'SUPPORT & POLICIES',
                badgeBg: '#f1f5f9',
                badgeColor: '#475569',
                desc: 'Customer assistance, policies, returns, and delivery information.',
                previewItems: ['Contact Us', 'Returns & Exchanges', 'Shipping & Delivery', 'Help Center', 'Privacy Policy', 'Terms of Service'],
              };
          }
        };

        return (
          <div className="card border-0 shadow-sm rounded-4 mb-4">
            <div className="card-header bg-white border-bottom px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <h5 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Footer 4-Column Navigation & Links</h5>
                <p className="text-muted fs-13 mb-0">
                  Manage heading titles and visibility for the 4 link columns connected across the storefront footer
                </p>
              </div>

              <div className="d-flex align-items-center gap-2">
                <span
                  className="badge bg-light text-dark border fs-12 fw-semibold"
                  style={{ borderRadius: '3px', padding: '5px 12px' }}
                >
                  {columns.filter((c) => c.isVisible).length} / 4 Columns Enabled
                </span>
              </div>
            </div>

            <div className="card-body p-4">
              <div className="row g-4">
                {columns.map((col, idx) => {
                  const details = getColumnDetails(col.type);

                  return (
                    <div key={col.id || idx} className="col-12 col-md-6 col-xl-3">
                      <div
                        className="p-3.5 rounded-3 border h-100 d-flex flex-column justify-content-between transition-all"
                        style={{
                          backgroundColor: col.isVisible ? '#ffffff' : '#f8fafc',
                          borderColor: col.isVisible ? '#cbd5e1' : '#e2e8f0',
                          boxShadow: col.isVisible ? '0 2px 8px rgba(15, 23, 42, 0.04)' : 'none',
                        }}
                      >
                        <div>
                          {/* Column Header & Switch */}
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <span
                              className="badge fs-11 fw-bold"
                              style={{
                                backgroundColor: details.badgeBg,
                                color: details.badgeColor,
                                borderRadius: '3px',
                                padding: '4px 8px',
                              }}
                            >
                              COLUMN {idx + 1}: {details.badge}
                            </span>

                            <div className="form-check form-switch m-0">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                role="switch"
                                id={`colSwitch-${col.id}`}
                                checked={col.isVisible}
                                onChange={() => handleToggleColumnVisibility(col.id)}
                                style={{ width: '38px', height: '20px', cursor: 'pointer' }}
                              />
                            </div>
                          </div>

                          {/* Column Title Input */}
                          <div className="mb-3">
                            <label className="form-label fs-12 fw-semibold text-secondary mb-1">
                              Column Heading Title
                            </label>
                            <input
                              type="text"
                              className="form-control fs-13 py-1.5 px-2.5"
                              value={col.title}
                              disabled={!col.isVisible}
                              onChange={(e) => handleUpdateColumnTitle(col.id, e.target.value)}
                              placeholder="e.g. Navigation"
                              style={{ borderRadius: '6px' }}
                            />
                          </div>

                          <p className="text-muted fs-12 mb-3" style={{ lineHeight: 1.45 }}>
                            {details.desc}
                          </p>

                          {/* Connected Items List Preview */}
                          <div className="p-2.5 rounded-2 bg-light border">
                            <div className="fs-11 fw-bold text-muted text-uppercase mb-1.5" style={{ letterSpacing: '0.5px' }}>
                              Connected Links ({details.previewItems.length})
                            </div>
                            <ul className="list-unstyled mb-0 fs-12 text-dark">
                              {details.previewItems.map((item, itemIdx) => (
                                <li key={itemIdx} className="d-flex align-items-center gap-1.5 py-0.5 text-truncate">
                                  <span style={{ color: details.badgeColor, fontSize: '10px' }}>•</span>
                                  <span className="text-truncate">{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-top d-flex align-items-center justify-content-between fs-11 text-muted">
                          <span>Status:</span>
                          <strong className={col.isVisible ? 'text-success' : 'text-danger'}>
                            {col.isVisible ? 'Visible on Storefront' : 'Hidden'}
                          </strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informational Guidance */}
              <div
                className="mt-4 p-3 rounded-3 d-flex align-items-center gap-2.5"
                style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}
              >
                <iconify-icon icon="solar:info-circle-bold" class="fs-20 flex-shrink-0"></iconify-icon>
                <span className="fs-13">
                  <strong>Live Storefront Synchronization:</strong> Navigation links update in real-time based on your Shop Settings menus. Categories update dynamically from your catalog. All common pages (About Us, Blogs, Contact Us, Order Tracking, Policies) are fully responsive and functional.
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 6. Tab 2: Download Our App */}
      {activeTab === 'apps' && (
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-header bg-white border-bottom px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Download Our App Section</h5>
              <p className="text-muted fs-13 mb-0">Configure store links and badges for mobile app installations</p>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="appDownloadSectionToggle"
                  checked={footerData.appDownload.isVisible}
                  onChange={(e) =>
                    setFooterData((prev) => ({
                      ...prev,
                      appDownload: { ...prev.appDownload, isVisible: e.target.checked },
                    }))
                  }
                  style={{ width: '42px', height: '22px', cursor: 'pointer' }}
                />
                <label className="form-check-label fs-13 fw-semibold" htmlFor="appDownloadSectionToggle" style={{ cursor: 'pointer' }}>
                  {footerData.appDownload.isVisible ? 'Section Enabled' : 'Section Hidden'}
                </label>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                onClick={() => setShowAddAppModal(true)}
              >
                <iconify-icon icon="solar:add-circle-linear"></iconify-icon>
                <span>Add App Store</span>
              </button>
            </div>
          </div>

          <div className="card-body p-4">
            {/* Section Title Input */}
            <div className="mb-4">
              <label className="form-label fs-13 fw-semibold text-secondary">Section Heading Title</label>
              <input
                type="text"
                className="form-control fs-14"
                style={{ maxWidth: '420px', borderRadius: '8px' }}
                value={footerData.appDownload.sectionTitle}
                onChange={(e) =>
                  setFooterData((prev) => ({
                    ...prev,
                    appDownload: { ...prev.appDownload, sectionTitle: e.target.value },
                  }))
                }
                placeholder="e.g. Download Our App"
              />
            </div>

            {/* List of Apps */}
            <div className="row g-3">
              {footerData.appDownload.apps.map((app) => (
                <div key={app.id} className="col-12 col-md-6">
                  <div
                    className="p-3 rounded-3 border h-100"
                    style={{
                      backgroundColor: app.isVisible ? '#ffffff' : '#f8fafc',
                      borderColor: app.isVisible ? '#cbd5e1' : '#e2e8f0',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div className="d-flex align-items-center gap-2">
                        {app.id === 'app-store' || app.id.toLowerCase().includes('apple') ? (
                          <span
                            className="d-flex align-items-center justify-content-center rounded-2"
                            style={{
                              width: '34px',
                              height: '34px',
                              background: 'linear-gradient(135deg, #2997ff 0%, #0071e3 100%)',
                              boxShadow: '0 2px 6px rgba(0, 113, 227, 0.35)',
                              flexShrink: 0,
                            }}
                          >
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
                              <path d="M8.8086 14.9194l6.1107-11.0368c.0837-.1513.1682-.302.2437-.4584.0685-.142.1267-.2854.1646-.4403.0803-.3259.0588-.6656-.066-.9767-.1238-.3095-.3417-.5678-.6201-.7355a1.4175 1.4175 0 0 0-.921-.1924c-.3207.043-.6135.1935-.8443.4288-.1094.1118-.1996.2361-.2832.369-.092.1463-.175.2979-.259.4492l-.3864.6979-.3865-.6979c-.0837-.1515-.1667-.303-.2587-.4492-.0837-.1329-.1739-.2572-.2835-.369-.2305-.2353-.5233-.3857-.844-.429a1.4181 1.4181 0 0 0-.921.1926c-.2784.1677-.4964.426-.6203.7355-.1246.311-.1461.6508-.066.9767.038.155.0962.2984.1648.4403.0753.1564.1598.307.2437.4584l1.248 2.2543-4.8625 8.7825H2.0295c-.1676 0-.3351-.0007-.5026.0092-.1522.009-.3004.0284-.448.0714-.3108.0906-.5822.2798-.7783.548-.195.2665-.3006.5929-.3006.9279 0 .3352.1057.6612.3006.9277.196.2683.4675.4575.7782.548.1477.043.296.0623.4481.0715.1675.01.335.009.5026.009h13.0974c.0171-.0357.059-.1294.1-.2697.415-1.4151-.6156-2.843-2.0347-2.843zM3.113 18.5418l-.7922 1.5008c-.0818.1553-.1644.31-.2384.4705-.067.1458-.124.293-.1611.452-.0785.3346-.0576.6834.0645 1.0029.1212.3175.3346.583.607.7549.2727.172.5891.2416.9013.1975.3139-.044.6005-.1986.8263-.4402.1072-.1148.1954-.2424.2772-.3787.0902-.1503.1714-.3059.2535-.4612L6 19.4636c-.0896-.149-.9473-1.4704-2.887-.9218m20.5861-3.0056a1.4707 1.4707 0 0 0-.779-.5407c-.1476-.0425-.2961-.0616-.4483-.0705-.1678-.0099-.3352-.0091-.503-.0091H18.648l-4.3891-7.817c-.6655.7005-.9632 1.485-1.0773 2.1976-.1655 1.0333.0367 2.0934.546 3.0004l5.2741 9.3933c.084.1494.167.299.2591.4435.0837.131.1739.2537.2836.364.231.2323.5238.3809.8449.4232.3192.0424.643-.0244.9217-.1899.2784-.1653.4968-.4204.621-.7257.1246-.3072.146-.6425.0658-.9641-.0381-.1529-.0962-.2945-.165-.4346-.0753-.1543-.1598-.303-.2438-.4524l-1.216-2.1662h1.596c.1677 0 .3351.0009.5029-.009.1522-.009.3007-.028.4483-.0705a1.4707 1.4707 0 0 0 .779-.5407A1.5386 1.5386 0 0 0 24 16.452a1.539 1.539 0 0 0-.3009-.9158Z" />
                            </svg>
                          </span>
                        ) : (
                          <span
                            className="d-flex align-items-center justify-content-center rounded-2 bg-dark text-white"
                            style={{ width: '34px', height: '34px', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.25)', flexShrink: 0 }}
                          >
                            {renderAppIcon(app, 18)}
                          </span>
                        )}
                        <div>
                          <h6 className="fw-bold mb-0 fs-14">{app.name}</h6>
                          <span className="text-muted fs-11">{app.subText || 'STORE'}</span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={app.isVisible}
                            onChange={() => handleToggleAppVisibility(app.id)}
                            style={{ width: '38px', height: '20px', cursor: 'pointer' }}
                            title={app.isVisible ? 'Visible in footer (Click to hide)' : 'Hidden (Click to show)'}
                          />
                        </div>

                        {!['app-store', 'google-play'].includes(app.id) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger p-1"
                            onClick={() => setDeleteConfirmItem({ id: app.id, type: 'app', name: app.name })}
                            title="Delete app store button"
                          >
                            <iconify-icon icon="solar:trash-bin-trash-bold" width="16"></iconify-icon>
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="form-label fs-12 fw-medium text-muted mb-1">Target Download Link (URL)</label>
                      <input
                        type="url"
                        className="form-control fs-13"
                        value={app.url}
                        onChange={(e) => handleUpdateAppUrl(app.id, e.target.value)}
                        placeholder="https://..."
                        style={{ borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Payment Methods */}
      {activeTab === 'payments' && (
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-header bg-white border-bottom px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Payment Method Badges</h5>
              <p className="text-muted fs-13 mb-0">Show, hide, and add payment partner badges displayed to customers</p>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="paymentSectionToggle"
                  checked={footerData.paymentMethods.isVisible}
                  onChange={(e) =>
                    setFooterData((prev) => ({
                      ...prev,
                      paymentMethods: { ...prev.paymentMethods, isVisible: e.target.checked },
                    }))
                  }
                  style={{ width: '42px', height: '22px', cursor: 'pointer' }}
                />
                <label className="form-check-label fs-13 fw-semibold" htmlFor="paymentSectionToggle" style={{ cursor: 'pointer' }}>
                  {footerData.paymentMethods.isVisible ? 'Section Enabled' : 'Section Hidden'}
                </label>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                onClick={() => setShowAddPaymentModal(true)}
              >
                <iconify-icon icon="solar:add-circle-linear"></iconify-icon>
                <span>Add Payment Method</span>
              </button>
            </div>
          </div>

          <div className="card-body p-4">
            {/* Section Title Input */}
            <div className="mb-4">
              <label className="form-label fs-13 fw-semibold text-secondary">Section Heading Title</label>
              <input
                type="text"
                className="form-control fs-14"
                style={{ maxWidth: '420px', borderRadius: '8px' }}
                value={footerData.paymentMethods.sectionTitle}
                onChange={(e) =>
                  setFooterData((prev) => ({
                    ...prev,
                    paymentMethods: { ...prev.paymentMethods, sectionTitle: e.target.value },
                  }))
                }
                placeholder="e.g. Payment Method"
              />
            </div>

            {/* List of Payments */}
            <div className="table-responsive border rounded-3 overflow-hidden">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light fs-12 text-uppercase text-secondary">
                  <tr>
                    <th style={{ width: '70px' }}>Status</th>
                    <th style={{ width: '120px' }}>Badge</th>
                    <th>Payment Name</th>
                    <th>Optional Info Link</th>
                    <th style={{ width: '110px' }} className="text-end">Visibility</th>
                  </tr>
                </thead>
                <tbody className="fs-13">
                  {footerData.paymentMethods.methods.map((method) => (
                    <tr key={method.id} style={{ opacity: method.isVisible ? 1 : 0.45 }}>
                      <td>
                        <span className={`badge ${method.isVisible ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-muted'}`}>
                          {method.isVisible ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td>
                        {renderPaymentBadgePreview(method, '26px')}
                      </td>
                      <td className="fw-bold" style={{ color: '#0f172a' }}>
                        {method.name}
                      </td>
                      <td>
                        <input
                          type="text"
                          className="form-control form-control-sm fs-12"
                          value={method.linkUrl || ''}
                          onChange={(e) => handleUpdatePaymentLink(method.id, e.target.value)}
                          placeholder="e.g. # or https://..."
                          style={{ maxWidth: '280px' }}
                        />
                      </td>
                      <td className="text-end">
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          <div className="form-check form-switch m-0">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              role="switch"
                              checked={method.isVisible}
                              onChange={() => handleTogglePaymentVisibility(method.id)}
                              style={{ width: '38px', height: '20px', cursor: 'pointer' }}
                              title={method.isVisible ? 'Hide from footer' : 'Show in footer'}
                            />
                          </div>

                          {!['tabby', 'tamara', 'visa', 'mastercard', 'apple-pay', 'google-pay', 'amex'].includes(method.id) && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger p-1"
                              onClick={() => setDeleteConfirmItem({ id: method.id, type: 'payment', name: method.name })}
                              title="Delete method"
                            >
                              <iconify-icon icon="solar:trash-bin-trash-bold" width="16"></iconify-icon>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. Tab 3: Stay Connected (Social Links) */}
      {activeTab === 'social' && (
        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-header bg-white border-bottom px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div>
              <h5 className="fw-bold mb-1" style={{ color: '#0f172a' }}>Stay Connected (Social Channels)</h5>
              <p className="text-muted fs-13 mb-0">Configure your official social media channels, links, and icons</p>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id="socialSectionToggle"
                  checked={footerData.socialLinks.isVisible}
                  onChange={(e) =>
                    setFooterData((prev) => ({
                      ...prev,
                      socialLinks: { ...prev.socialLinks, isVisible: e.target.checked },
                    }))
                  }
                  style={{ width: '42px', height: '22px', cursor: 'pointer' }}
                />
                <label className="form-check-label fs-13 fw-semibold" htmlFor="socialSectionToggle" style={{ cursor: 'pointer' }}>
                  {footerData.socialLinks.isVisible ? 'Section Enabled' : 'Section Hidden'}
                </label>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                onClick={() => setShowAddSocialModal(true)}
              >
                <iconify-icon icon="solar:add-circle-linear"></iconify-icon>
                <span>Add Social Link</span>
              </button>
            </div>
          </div>

          <div className="card-body p-4">
            {/* Section Title Input */}
            <div className="mb-4">
              <label className="form-label fs-13 fw-semibold text-secondary">Section Heading Title</label>
              <input
                type="text"
                className="form-control fs-14"
                style={{ maxWidth: '420px', borderRadius: '8px' }}
                value={footerData.socialLinks.sectionTitle}
                onChange={(e) =>
                  setFooterData((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, sectionTitle: e.target.value },
                  }))
                }
                placeholder="e.g. Stay Connected"
              />
            </div>

            {/* List of Social Channels */}
            <div className="row g-3">
              {footerData.socialLinks.links.map((link) => (
                <div key={link.id} className="col-12 col-md-6 col-lg-4">
                  <div
                    className="p-3 rounded-3 border h-100"
                    style={{
                      backgroundColor: link.isVisible ? '#ffffff' : '#f8fafc',
                      borderColor: link.isVisible ? '#cbd5e1' : '#e2e8f0',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className="rounded-circle d-flex align-items-center justify-content-center text-white"
                          style={{ width: '32px', height: '32px', backgroundColor: '#0f172a' }}
                        >
                          <iconify-icon
                            icon={
                              link.platform === 'facebook'
                                ? 'ri:facebook-fill'
                                : link.platform === 'x'
                                ? 'ri:twitter-x-fill'
                                : link.platform === 'instagram'
                                ? 'ri:instagram-line'
                                : link.platform === 'linkedin'
                                ? 'ri:linkedin-fill'
                                : link.platform === 'tiktok'
                                ? 'ri:tiktok-fill'
                                : link.platform === 'youtube'
                                ? 'ri:youtube-fill'
                                : link.platform === 'whatsapp'
                                ? 'ri:whatsapp-fill'
                                : 'solar:link-round-linear'
                            }
                            width="16"
                          ></iconify-icon>
                        </span>
                        <h6 className="fw-bold mb-0 fs-14">{link.name}</h6>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={link.isVisible}
                            onChange={() => handleToggleSocialVisibility(link.id)}
                            style={{ width: '38px', height: '20px', cursor: 'pointer' }}
                            title={link.isVisible ? 'Visible (Click to hide)' : 'Hidden (Click to show)'}
                          />
                        </div>

                        {!['facebook', 'x', 'instagram', 'linkedin', 'tiktok'].includes(link.id) && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger p-1"
                            onClick={() => setDeleteConfirmItem({ id: link.id, type: 'social', name: link.name })}
                            title="Delete social channel"
                          >
                            <iconify-icon icon="solar:trash-bin-trash-bold" width="16"></iconify-icon>
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="form-label fs-11 text-muted mb-1">Profile Link URL</label>
                      <input
                        type="url"
                        className="form-control form-control-sm fs-12"
                        value={link.url}
                        onChange={(e) => handleUpdateSocialUrl(link.id, e.target.value)}
                        placeholder="https://..."
                        style={{ borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
        </div>
      </div>

      {/* ========================================================
          MODAL: ADD SOCIAL LINK
         ======================================================== */}
      {showAddSocialModal && mounted && typeof document !== 'undefined' && createPortal(
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
              setShowAddSocialModal(false);
            }
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              margin: 'auto',
              position: 'relative',
              zIndex: 10,
            }}
          >
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white">
              <div className="modal-header border-bottom px-4 py-3 bg-white">
                <h5 className="modal-title fw-bold" style={{ color: '#0f172a' }}>Add Social Channel</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddSocialModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-white">
                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">Choose Platform</label>
                  <select
                    className="form-select fs-13"
                    value={newSocialPlatform}
                    onChange={(e) => {
                      const plat = e.target.value;
                      setNewSocialPlatform(plat);
                      if (plat === 'youtube') {
                        setNewSocialName('YouTube');
                        setNewSocialUrl('https://youtube.com');
                      } else if (plat === 'whatsapp') {
                        setNewSocialName('WhatsApp');
                        setNewSocialUrl('https://wa.me/');
                      } else if (plat === 'pinterest') {
                        setNewSocialName('Pinterest');
                        setNewSocialUrl('https://pinterest.com');
                      } else if (plat === 'snapchat') {
                        setNewSocialName('Snapchat');
                        setNewSocialUrl('https://snapchat.com');
                      } else if (plat === 'telegram') {
                        setNewSocialName('Telegram');
                        setNewSocialUrl('https://t.me/');
                      } else {
                        setNewSocialName('Custom Channel');
                        setNewSocialUrl('https://');
                      }
                    }}
                  >
                    <option value="youtube">YouTube</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="pinterest">Pinterest</option>
                    <option value="snapchat">Snapchat</option>
                    <option value="telegram">Telegram</option>
                    <option value="custom">Other / Custom</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">Display Name</label>
                  <input
                    type="text"
                    className="form-control fs-13"
                    value={newSocialName}
                    onChange={(e) => setNewSocialName(e.target.value)}
                    placeholder="e.g. YouTube"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">Account / Page URL</label>
                  <input
                    type="url"
                    className="form-control fs-13"
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="modal-footer px-4 py-3 bg-light border-top d-flex align-items-center justify-content-end" style={{ gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary fs-13 px-3 py-2 fw-medium"
                  style={{ borderRadius: '7px' }}
                  onClick={() => setShowAddSocialModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary fs-13 px-4 py-2 fw-semibold"
                  style={{ backgroundColor: '#0f172a', borderColor: '#0f172a', borderRadius: '7px' }}
                  onClick={handleAddSocialLink}
                >
                  Add Social Link
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: ADD PAYMENT METHOD
         ======================================================== */}
      {showAddPaymentModal && mounted && typeof document !== 'undefined' && createPortal(
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
              setShowAddPaymentModal(false);
            }
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              margin: 'auto',
              position: 'relative',
              zIndex: 10,
            }}
          >
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white">
              <div className="modal-header border-bottom px-4 py-3 bg-white">
                <h5 className="modal-title fw-bold" style={{ color: '#0f172a' }}>Add Payment Method Badge</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddPaymentModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-white">
                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">Payment Method Name</label>
                  <input
                    type="text"
                    className="form-control fs-13"
                    value={newPaymentName}
                    onChange={(e) => setNewPaymentName(e.target.value)}
                    placeholder="e.g. Mada, STC Pay, PayPal, Klarna"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">Badge Code / Slug (Optional)</label>
                  <input
                    type="text"
                    className="form-control fs-13"
                    value={newPaymentCode}
                    onChange={(e) => setNewPaymentCode(e.target.value)}
                    placeholder="e.g. mada, stc-pay"
                  />
                </div>
              </div>
              <div className="modal-footer px-4 py-3 bg-light border-top d-flex align-items-center justify-content-end" style={{ gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary fs-13 px-3 py-2 fw-medium"
                  style={{ borderRadius: '7px' }}
                  onClick={() => setShowAddPaymentModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary fs-13 px-4 py-2 fw-semibold"
                  style={{ backgroundColor: '#0f172a', borderColor: '#0f172a', borderRadius: '7px' }}
                  onClick={handleAddPayment}
                >
                  Add Payment Method
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          MODAL: ADD APP STORE
         ======================================================== */}
      {showAddAppModal && mounted && typeof document !== 'undefined' && createPortal(
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
              setShowAddAppModal(false);
            }
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              width: '100%',
              margin: 'auto',
              position: 'relative',
              zIndex: 10,
            }}
          >
            <div className="modal-content rounded-4 border-0 shadow-lg overflow-hidden bg-white">
              <div className="modal-header border-bottom px-4 py-3 bg-white">
                <h5 className="modal-title fw-bold" style={{ color: '#0f172a' }}>Add Mobile Store Badge</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddAppModal(false)}></button>
              </div>
              <div className="modal-body p-4 bg-white">
                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">Store Title</label>
                  <input
                    type="text"
                    className="form-control fs-13"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                    placeholder="e.g. AppGallery (Huawei)"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">Sub-text on Button</label>
                  <input
                    type="text"
                    className="form-control fs-13"
                    value={newAppSubText}
                    onChange={(e) => setNewAppSubText(e.target.value)}
                    placeholder="e.g. EXPLORE IT ON"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fs-13 fw-semibold">Store Download URL</label>
                  <input
                    type="url"
                    className="form-control fs-13"
                    value={newAppUrl}
                    onChange={(e) => setNewAppUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="modal-footer px-4 py-3 bg-light border-top d-flex align-items-center justify-content-end" style={{ gap: '12px' }}>
                <button
                  type="button"
                  className="btn btn-outline-secondary fs-13 px-3 py-2 fw-medium"
                  style={{ borderRadius: '7px' }}
                  onClick={() => setShowAddAppModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary fs-13 px-4 py-2 fw-semibold"
                  style={{ backgroundColor: '#0f172a', borderColor: '#0f172a', borderRadius: '7px' }}
                  onClick={handleAddApp}
                >
                  Add Store Button
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          SYSTEM MODAL: RESET DEFAULTS CONFIRMATION
         ======================================================== */}
      {showResetConfirmModal && mounted && typeof document !== 'undefined' && createPortal(
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
          <div
            style={{
              maxWidth: '440px',
              width: '100%',
              margin: 'auto',
              position: 'relative',
              zIndex: 10,
            }}
          >
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
                <iconify-icon icon="solar:restart-bold" class="fs-28"></iconify-icon>
              </div>

              <h4 className="fs-18 fw-bold text-dark mb-2">Reset Footer Setup?</h4>
              <p className="text-muted fs-13 mb-4" style={{ lineHeight: 1.5 }}>
                Are you sure you want to reset all footer setup to the default links and visibility? Custom mobile stores, custom payment badges, and extra social channels will be restored to original factory defaults.
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
                  className="btn btn-danger fs-13 px-4 py-2 fw-semibold d-flex align-items-center gap-1.5"
                  style={{ borderRadius: '8px', backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                  onClick={handleConfirmReset}
                >
                  <iconify-icon icon="solar:restart-bold" class="fs-16"></iconify-icon>
                  <span>Yes, Reset Defaults</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ========================================================
          SYSTEM MODAL: DELETE ITEM CONFIRMATION
         ======================================================== */}
      {deleteConfirmItem && mounted && typeof document !== 'undefined' && createPortal(
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
              setDeleteConfirmItem(null);
            }
          }}
        >
          <div
            style={{
              maxWidth: '440px',
              width: '100%',
              margin: 'auto',
              position: 'relative',
              zIndex: 10,
            }}
          >
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

              <h4 className="fs-18 fw-bold text-dark mb-2">Delete &quot;{deleteConfirmItem.name}&quot;?</h4>
              <p className="text-muted fs-13 mb-4" style={{ lineHeight: 1.5 }}>
                Are you sure you want to remove this item from your footer setup? This action will remove it once you click Save Changes.
              </p>

              <div className="d-flex align-items-center justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-outline-secondary fs-13 px-4 py-2 fw-medium"
                  style={{ borderRadius: '8px' }}
                  onClick={() => setDeleteConfirmItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger fs-13 px-4 py-2 fw-semibold d-flex align-items-center gap-1.5"
                  style={{ borderRadius: '8px', backgroundColor: '#dc2626', borderColor: '#dc2626' }}
                  onClick={handleExecuteDelete}
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
    </>
  );
}
