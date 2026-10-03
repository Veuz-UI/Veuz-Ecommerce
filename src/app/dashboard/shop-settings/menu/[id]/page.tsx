'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchShopSettings, saveShopSettings } from '@/services/shopSettingsService';
import { MainMenuItem, SubMenuColumn, SubMenuColumnItem, MenuBanner } from '@/data/defaultShopSettings';
import { useToast } from '@/context/ToastContext';
import { validateImageFile, compressImage } from '@/utils/imageSecurity';

export default function MenuEditPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = params?.id as string;
  const isNew = menuId === 'new';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  // Delete confirmation modal state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'column' | 'item';
    colId: string;
    itemId?: string;
    name: string;
  } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [hasMegaMenu, setHasMegaMenu] = useState(true);
  const [isHotDeal, setIsHotDeal] = useState(false);
  const [badge, setBadge] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Columns & Banner
  const [columns, setColumns] = useState<SubMenuColumn[]>([]);
  const [banner, setBanner] = useState<MenuBanner>({
    enabled: true,
    showBtn: true,
    image: '/assets/imgs/banner/banner-menu.png',
    tag: 'Hot deals',
    title: "Don't miss Trending",
    priceNote: 'Save up to 50%',
    discountBadge: '25% off',
    btnText: 'Shop now',
    btnLink: '/products',
  });

  // State for adding a new column
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColTitle, setNewColTitle] = useState('');
  const [newColLink, setNewColLink] = useState('');

  // State for editing a column title/link
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editColTitle, setEditColTitle] = useState('');
  const [editColLink, setEditColLink] = useState('');

  // State for adding item to a specific column
  const [addingItemColId, setAddingItemColId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemLink, setNewItemLink] = useState('');

  // State for editing an item inside a column
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemLink, setEditItemLink] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const settings = await fetchShopSettings();
        if (!isNew) {
          const found = settings.mainMenu.find((m) => m.id === menuId);
          if (found) {
            setName(found.name);
            setLink(found.link);
            setHasMegaMenu(found.hasMegaMenu);
            setIsHotDeal(!!found.isHotDeal);
            setBadge(found.badge || '');
            setIsActive(found.isActive !== false);
            setColumns(found.columns ? JSON.parse(JSON.stringify(found.columns)) : []);
            if (found.banner) {
              const loadedBanner = JSON.parse(JSON.stringify(found.banner));
              setBanner({
                ...loadedBanner,
                showBtn: loadedBanner.showBtn !== false,
              });
            }
          } else {
            showToast('danger', 'Menu item not found.');
          }
        } else {
          if (settings.mainMenu.length >= 6) {
            showToast('danger', 'Maximum 6 main menu items allowed. Please remove or edit existing menus.');
          }
          setName('');
          setLink('/products');
          setHasMegaMenu(true);
          setIsHotDeal(false);
          setBadge('');
          setIsActive(true);
          setColumns([
            {
              id: `col-${Date.now()}-1`,
              title: 'Featured Collection',
              link: '/products',
              items: [
                { id: `item-1`, name: 'Sample Item 1', link: '/products' },
                { id: `item-2`, name: 'Sample Item 2', link: '/products' },
                { id: `item-3`, name: 'Sample Item 3', link: '/products' },
              ],
            },
          ]);
        }
      } catch (err: any) {
        showToast('danger', err.message || 'Failed to load menu details.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [menuId, isNew]);

  // Image Upload Handler with Strict Validation & Canvas Compression
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Strict Validation (File Type, Extension, Max 5MB Size)
    const validation = validateImageFile(file, 5 * 1024 * 1024);
    if (!validation.valid) {
      showToast('danger', validation.error || 'Invalid image file.');
      return;
    }

    setIsUploading(true);
    try {
      // 2. Client-side Canvas Compression (Max 1600px width/height, 0.85 quality WebP)
      const compressedFile = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
        mimeType: 'image/webp',
      });

      // Show immediate local preview
      const previewUrl = URL.createObjectURL(compressedFile);
      setBanner((prev) => ({ ...prev, image: previewUrl }));

      // 3. Upload to secure backend API
      const formData = new FormData();
      formData.append('file', compressedFile);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success && data.url) {
        setBanner((prev) => ({ ...prev, image: data.url }));
        showToast('success', 'Banner image uploaded successfully!');
      } else {
        showToast('warning', data.message || 'Image preview set locally.');
      }
    } catch (err: any) {
      showToast('warning', 'Banner preview applied.');
    } finally {
      setIsUploading(false);
    }
  };

  // Column Actions
  const handleAddColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColTitle.trim()) {
      showToast('danger', 'Please enter a column title.');
      return;
    }
    if (columns.length >= 3) {
      showToast('danger', 'Maximum 3 columns allowed for mega-menu.');
      return;
    }

    const newCol: SubMenuColumn = {
      id: `col-${Date.now()}`,
      title: newColTitle.trim(),
      link: newColLink.trim() || '/products',
      items: [],
    };

    setColumns([...columns, newCol]);
    setNewColTitle('');
    setNewColLink('');
    setShowAddColumn(false);
    showToast('success', `Column "${newCol.title}" created.`);
  };

  const handleStartEditColumn = (col: SubMenuColumn) => {
    setEditingColId(col.id);
    setEditColTitle(col.title);
    setEditColLink(col.link);
  };

  const handleSaveEditColumn = (colId: string) => {
    if (!editColTitle.trim()) {
      showToast('danger', 'Column title cannot be empty.');
      return;
    }

    setColumns((prev) =>
      prev.map((col) => (col.id === colId ? { ...col, title: editColTitle.trim(), link: editColLink.trim() || '/products' } : col))
    );
    setEditingColId(null);
    showToast('success', 'Column title updated.');
  };

  // Execute deletion confirmed from modal
  const handleExecuteDelete = () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget.type === 'column') {
      const colTitle = deleteConfirmTarget.name;
      setColumns((prev) => prev.filter((col) => col.id !== deleteConfirmTarget.colId));
      showToast('danger', `Column "${colTitle}" deleted successfully.`, 'Deleted Successfully');
    } else if (deleteConfirmTarget.type === 'item' && deleteConfirmTarget.itemId) {
      const itemName = deleteConfirmTarget.name;
      setColumns((prev) =>
        prev.map((col) =>
          col.id === deleteConfirmTarget.colId
            ? {
                ...col,
                items: col.items.filter((it) => it.id !== deleteConfirmTarget.itemId),
              }
            : col
        )
      );
      showToast('danger', `Sub-item "${itemName}" deleted successfully.`, 'Deleted Successfully');
    }

    setDeleteConfirmTarget(null);
  };

  // Item Actions inside Columns
  const handleAddItemToCol = (colId: string) => {
    if (!newItemName.trim()) {
      showToast('danger', 'Please enter an item name.');
      return;
    }

    const newItem: SubMenuColumnItem = {
      id: `item-${Date.now()}`,
      name: newItemName.trim(),
      link: newItemLink.trim() || '/products',
    };

    setColumns((prev) =>
      prev.map((col) => (col.id === colId ? { ...col, items: [...col.items, newItem] } : col))
    );

    setNewItemName('');
    setNewItemLink('');
    setAddingItemColId(null);
    showToast('success', 'Sub-menu item added.');
  };

  const handleStartEditItem = (item: SubMenuColumnItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.name);
    setEditItemLink(item.link);
  };

  const handleSaveEditItem = (colId: string, itemId: string) => {
    if (!editItemName.trim()) {
      showToast('danger', 'Item name cannot be empty.');
      return;
    }

    setColumns((prev) =>
      prev.map((col) =>
        col.id === colId
          ? {
              ...col,
              items: col.items.map((it) =>
                it.id === itemId ? { ...it, name: editItemName.trim(), link: editItemLink.trim() || '/products' } : it
              ),
            }
          : col
      )
    );

    setEditingItemId(null);
    showToast('success', 'Item updated.');
  };

  // Save Final Menu Configuration
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('danger', 'Please enter a menu title.');
      return;
    }

    setIsSaving(true);
    try {
      const settings = await fetchShopSettings();
      let updatedMenu = [...settings.mainMenu];

      if (isNew) {
        if (updatedMenu.length >= 6) {
          showToast('danger', 'Maximum 6 main menu items allowed.');
          setIsSaving(false);
          return;
        }

        const newMenuItem: MainMenuItem = {
          id: `menu-${Date.now()}`,
          name: name.trim(),
          link: link.trim() || '/products',
          hasMegaMenu,
          isHotDeal,
          badge: badge.trim() || undefined,
          isActive,
          columns: hasMegaMenu ? columns : undefined,
          banner: hasMegaMenu ? banner : undefined,
        };
        updatedMenu.push(newMenuItem);
      } else {
        updatedMenu = updatedMenu.map((m) =>
          m.id === menuId
            ? {
                ...m,
                name: name.trim(),
                link: link.trim() || m.link,
                hasMegaMenu,
                isHotDeal,
                badge: badge.trim() || undefined,
                isActive,
                columns: hasMegaMenu ? columns : undefined,
                banner: hasMegaMenu ? banner : undefined,
              }
            : m
        );
      }

      const res = await saveShopSettings({
        ...settings,
        mainMenu: updatedMenu,
      });

      if (res.success) {
        showToast('success', 'Main menu and mega-menu settings saved successfully! Storefront updated.');
        setTimeout(() => {
          router.push('/dashboard/shop-settings');
        }, 900);
      } else {
        showToast('danger', res.message || 'Failed to save menu settings.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>

      {/* Main Full Width White Card (Classic White Look) */}
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

          {/* Breadcrumb & Navigation Bar */}
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4 pb-3 border-bottom" style={{ borderColor: '#e2e8f0' }}>
            <div>
              <div className="d-flex align-items-center text-muted fs-13" style={{ marginBottom: '24px', gap: '10px' }}>
                <Link href="/dashboard" className="text-muted text-decoration-none">
                  Dashboard
                </Link>
                <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
                <Link href="/dashboard/shop-settings" className="text-muted text-decoration-none">
                  Shop Settings
                </Link>
                <iconify-icon icon="solar:alt-arrow-right-linear" class="fs-13"></iconify-icon>
                <span className="text-dark fw-bold">
                  {isNew ? 'Add Main Menu' : `Configure: ${name || 'Menu'}`}
                </span>
              </div>
              <h2 className="fw-bold text-dark" style={{ fontSize: '23px', letterSpacing: '-0.4px', color: '#0f172a', marginBottom: '8px' }}>
                {isNew ? 'Create Main Navigation Menu' : `Configure Menu & Sub-Menu: ${name}`}
              </h2>
              <p className="text-muted fs-14 mb-0" style={{ color: '#64748b' }}>
                Manage mega menu columns (Col 1, 2, 3), add/edit/delete sub-items, and upload promotional banner images.
              </p>
            </div>

            <Link
              href="/dashboard/shop-settings"
              className="btn btn-sm d-flex align-items-center gap-2 fs-13 fw-semibold"
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
              <iconify-icon icon="solar:arrow-left-linear" class="fs-16"></iconify-icon>
              <span>Back to Shop Settings</span>
            </Link>
          </div>

          {isLoading ? (
            <div className="dashboard-loading-stable text-center py-5">
              <div className="spinner-border text-dark" role="status"></div>
              <p className="text-muted fs-14 mt-2">Loading menu configuration...</p>
            </div>
          ) : (
            <form onSubmit={handleSaveMenu}>
              
              {/* Section 1: Basic Menu Configuration (White Card, Classic Look) */}
              <div
                className="p-4 mb-4 rounded-3"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                }}
              >
                <div className="d-flex align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9', gap: '16px' }}>
                  <span
                    className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                    style={{ width: '40px', height: '40px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                  >
                    <iconify-icon icon="solar:widget-bold" class="fs-20" style={{ color: '#0f172a' }}></iconify-icon>
                  </span>
                  <div>
                    <h4 className="fw-bold text-dark fs-15 mb-0">Primary Menu Settings</h4>
                    <p className="text-muted fs-12 mb-0" style={{ marginTop: '2px' }}>General navigation parameters</p>
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label fs-13 fw-semibold text-dark mb-2">
                      Menu Title <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control fs-14"
                      placeholder="e.g. Gift Products, Accessories"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      style={{
                        borderRadius: '8px',
                        padding: '10px 16px',
                        borderColor: '#cbd5e1',
                        height: '46px',
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fs-13 fw-semibold text-dark mb-2">
                      Target Destination URL <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control fs-14"
                      placeholder="e.g. /products or /offer"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      required
                      style={{
                        borderRadius: '8px',
                        padding: '10px 16px',
                        borderColor: '#cbd5e1',
                        height: '46px',
                      }}
                    />
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fs-13 fw-semibold text-dark mb-2">
                      Badge Text (Optional)
                    </label>
                    <input
                      type="text"
                      className="form-control fs-14"
                      placeholder="e.g. HOT, NEW, 20% OFF"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      style={{
                        borderRadius: '8px',
                        padding: '10px 16px',
                        borderColor: '#cbd5e1',
                        height: '46px',
                      }}
                    />
                  </div>

                  {/* 1. Enable Mega Menu */}
                  <div className="col-md-4 pt-1">
                    <div
                      className="d-flex align-items-center justify-content-between p-3.5 p-md-4 rounded-3 border h-100"
                      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)' }}
                    >
                      <div className="pe-3">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span
                            className="d-inline-block rounded-circle"
                            style={{ width: '8px', height: '8px', backgroundColor: hasMegaMenu ? '#16a34a' : '#94a3b8' }}
                          ></span>
                          <span className="fs-14 fw-bold text-dark">Enable Mega Menu</span>
                          <span
                            className="badge fs-11 fw-semibold ms-1"
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: hasMegaMenu ? '#f0fdf4' : '#f1f5f9',
                              color: hasMegaMenu ? '#16a34a' : '#64748b',
                              border: hasMegaMenu ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                            }}
                          >
                            {hasMegaMenu ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <p className="text-muted fs-12 mb-0">Expandable 3-column dropdown & banner</p>
                      </div>
                      <div className="form-check form-switch m-0 flex-shrink-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={hasMegaMenu}
                          onChange={(e) => setHasMegaMenu(e.target.checked)}
                          style={{
                            cursor: 'pointer',
                            width: '2.8em',
                            height: '1.4em',
                            backgroundColor: hasMegaMenu ? '#16a34a' : '#cbd5e1',
                            borderColor: hasMegaMenu ? '#16a34a' : '#cbd5e1',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Hot Deal Highlight */}
                  <div className="col-md-4 pt-1">
                    <div
                      className="d-flex align-items-center justify-content-between p-3.5 p-md-4 rounded-3 border h-100"
                      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)' }}
                    >
                      <div className="pe-3">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span
                            className="d-inline-block rounded-circle"
                            style={{ width: '8px', height: '8px', backgroundColor: isHotDeal ? '#f97316' : '#94a3b8' }}
                          ></span>
                          <span className="fs-14 fw-bold text-dark">Hot Deal Highlight</span>
                          <span
                            className="badge fs-11 fw-semibold ms-1"
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: isHotDeal ? '#fff7ed' : '#f1f5f9',
                              color: isHotDeal ? '#ea580c' : '#64748b',
                              border: isHotDeal ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                            }}
                          >
                            {isHotDeal ? 'Hot Deal' : 'Standard'}
                          </span>
                        </div>
                        <p className="text-muted fs-12 mb-0">Orange flame icon & highlight in nav</p>
                      </div>
                      <div className="form-check form-switch m-0 flex-shrink-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={isHotDeal}
                          onChange={(e) => setIsHotDeal(e.target.checked)}
                          style={{
                            cursor: 'pointer',
                            width: '2.8em',
                            height: '1.4em',
                            backgroundColor: isHotDeal ? '#f97316' : '#cbd5e1',
                            borderColor: isHotDeal ? '#f97316' : '#cbd5e1',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Active Status */}
                  <div className="col-md-4 pt-1">
                    <div
                      className="d-flex align-items-center justify-content-between p-3.5 p-md-4 rounded-3 border h-100"
                      style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)' }}
                    >
                      <div className="pe-3">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span
                            className="d-inline-block rounded-circle"
                            style={{ width: '8px', height: '8px', backgroundColor: isActive ? '#16a34a' : '#94a3b8' }}
                          ></span>
                          <span className="fs-14 fw-bold text-dark">Active Status</span>
                          <span
                            className="badge fs-11 fw-semibold ms-1"
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              backgroundColor: isActive ? '#f0fdf4' : '#f1f5f9',
                              color: isActive ? '#16a34a' : '#64748b',
                              border: isActive ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                            }}
                          >
                            {isActive ? 'Visible' : 'Hidden'}
                          </span>
                        </div>
                        <p className="text-muted fs-12 mb-0">Show this menu in header storefront nav</p>
                      </div>
                      <div className="form-check form-switch m-0 flex-shrink-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          style={{
                            cursor: 'pointer',
                            width: '2.8em',
                            height: '1.4em',
                            backgroundColor: isActive ? '#16a34a' : '#cbd5e1',
                            borderColor: isActive ? '#16a34a' : '#cbd5e1',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Mega Menu Columns & Promotional Banner (when Mega Menu is active) */}
              {hasMegaMenu && (
                <div className="row g-4">
                  
                  {/* Left: Columns Section (Col 1, Col 2, Col 3) (White Background & Classic Look) */}
                  <div className="col-lg-7">
                    <div
                      className="p-4 rounded-3 h-100"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                        <div className="d-flex align-items-center" style={{ gap: '16px' }}>
                          <span
                            className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                            style={{ width: '40px', height: '40px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                          >
                            <iconify-icon icon="solar:align-vertical-spacing-bold" class="fs-20" style={{ color: '#0f172a' }}></iconify-icon>
                          </span>
                          <div>
                            <h4 className="fw-bold text-dark fs-15 mb-0">Sub-Menu Columns</h4>
                            <p className="text-muted fs-12 mb-0" style={{ marginTop: '2px' }}>Max 3 columns. Each column contains a group of links.</p>
                          </div>
                        </div>
                        <span
                          className={`badge ${columns.length >= 3 ? 'bg-danger text-white' : 'bg-dark text-white'} fs-12 fw-bold`}
                          style={{ padding: '6px 12px', borderRadius: '6px' }}
                        >
                          {columns.length} / 3 Columns
                        </span>
                      </div>

                      {/* Columns List */}
                      <div className="d-flex flex-column gap-3 mb-4">
                        {columns.map((col, cIdx) => {
                          const isEditingCol = editingColId === col.id;
                          const isAddingItem = addingItemColId === col.id;

                          return (
                            <div
                              key={col.id}
                              className="p-4 bg-white rounded-3 border"
                              style={{
                                borderColor: '#e2e8f0',
                                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.02)',
                              }}
                            >
                              
                              {/* Column Header */}
                              {isEditingCol ? (
                                <div
                                  className="p-4 bg-white rounded-3 border mb-3.5 shadow-sm"
                                  style={{
                                    borderColor: '#cbd5e1',
                                    backgroundColor: '#ffffff',
                                  }}
                                >
                                  <div className="d-flex align-items-center justify-content-between mb-3 pb-2.5 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="badge bg-dark text-white fs-11 fw-bold" style={{ padding: '5px 10px', borderRadius: '6px' }}>
                                        Editing
                                      </span>
                                      <h6 className="fs-14 fw-bold text-dark mb-0">Edit Column #{cIdx + 1}: {col.title}</h6>
                                    </div>
                                    <span className="text-muted fs-12">Update column title &amp; navigation target</span>
                                  </div>
                                  <div className="row g-3 align-items-end">
                                    <div className="col-md-5">
                                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                                        Column Title <span className="text-danger">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control fs-13"
                                        value={editColTitle}
                                        onChange={(e) => setEditColTitle(e.target.value)}
                                        placeholder="e.g. Corporate Gifts"
                                        style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1', padding: '10px 14px' }}
                                      />
                                    </div>
                                    <div className="col-md-5">
                                      <label className="form-label fs-13 fw-semibold text-dark mb-2">
                                        Header Target Link <span className="text-danger">*</span>
                                      </label>
                                      <input
                                        type="text"
                                        className="form-control fs-13"
                                        value={editColLink}
                                        onChange={(e) => setEditColLink(e.target.value)}
                                        placeholder="e.g. /products"
                                        style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1', padding: '10px 14px' }}
                                      />
                                    </div>
                                    <div className="col-md-2 d-flex gap-2 justify-content-end align-items-center pb-1">
                                      <button
                                        type="button"
                                        className="btn btn-sm d-flex align-items-center justify-content-center"
                                        onClick={() => handleSaveEditColumn(col.id)}
                                        title="Save Title"
                                        style={{
                                          borderRadius: '7px',
                                          width: '40px',
                                          height: '40px',
                                          backgroundColor: '#16a34a',
                                          borderColor: '#16a34a',
                                          color: '#ffffff',
                                          boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
                                        }}
                                      >
                                        <iconify-icon icon="solar:check-circle-bold" class="fs-20 text-white"></iconify-icon>
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm d-flex align-items-center justify-content-center"
                                        onClick={() => setEditingColId(null)}
                                        title="Cancel"
                                        style={{
                                          borderRadius: '7px',
                                          width: '40px',
                                          height: '40px',
                                          backgroundColor: '#dc2626',
                                          borderColor: '#dc2626',
                                          color: '#ffffff',
                                          boxShadow: '0 2px 4px rgba(220, 38, 38, 0.25)',
                                        }}
                                      >
                                        <iconify-icon icon="solar:close-circle-bold" class="fs-20 text-white"></iconify-icon>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className="d-flex align-items-center justify-content-between p-3 rounded-3 mb-3 border"
                                  style={{
                                    backgroundColor: '#f8fafc',
                                    borderColor: '#e2e8f0',
                                  }}
                                >
                                  <div className="d-flex align-items-center gap-3">
                                    <span
                                      className="badge bg-dark text-white fs-12 fw-bold"
                                      style={{ padding: '6px 11px', borderRadius: '6px' }}
                                    >
                                      Col {cIdx + 1}
                                    </span>
                                    <div>
                                      <div className="d-flex align-items-center gap-2">
                                        <span className="fs-14 fw-bold text-dark">{col.title}</span>
                                        <span className="badge bg-white text-secondary border fs-11 fw-normal" style={{ padding: '3px 8px', borderRadius: '5px' }}>
                                          {col.items.length} sub-items
                                        </span>
                                      </div>
                                      <div className="text-muted fs-12 mt-0.5">{col.link}</div>
                                    </div>
                                  </div>

                                  {/* Actions: Edit always yellow background icon-only, Delete light red icon-only on exact same vertical line */}
                                  <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                    <button
                                      type="button"
                                      className="btn btn-sm d-flex align-items-center justify-content-center"
                                      onClick={() => handleStartEditColumn(col)}
                                      title="Edit Column Title"
                                      style={{
                                        borderRadius: '7px',
                                        width: '34px',
                                        height: '34px',
                                        backgroundColor: '#fef3c7',
                                        color: '#b45309',
                                        border: '1px solid #fde68a',
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      <iconify-icon icon="solar:pen-new-square-linear" class="fs-16"></iconify-icon>
                                    </button>

                                    <button
                                      type="button"
                                      className="btn btn-sm d-flex align-items-center justify-content-center text-danger"
                                      onClick={() => setDeleteConfirmTarget({ type: 'column', colId: col.id, name: col.title })}
                                      title="Delete Column"
                                      style={{
                                        borderRadius: '7px',
                                        width: '34px',
                                        height: '34px',
                                        backgroundColor: '#fee2e2',
                                        color: '#dc2626',
                                        border: '1px solid #fecaca',
                                        transition: 'all 0.15s ease',
                                      }}
                                    >
                                      <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-16"></iconify-icon>
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Items Inside Column */}
                              <div className="d-flex flex-column gap-2.5 mb-3">
                                {col.items.length === 0 ? (
                                  <div className="text-muted fs-13 text-center py-3.5 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                                    No sub-menu links yet. Add one below.
                                  </div>
                                ) : (
                                  col.items.map((it, itIdx) => {
                                    const isEditingThisItem = editingItemId === it.id;

                                    if (isEditingThisItem) {
                                      return (
                                        <div
                                          key={it.id}
                                          className="p-3.5 p-md-4 bg-white rounded-3 border shadow-sm"
                                          style={{ borderColor: '#cbd5e1' }}
                                        >
                                          <div className="d-flex align-items-center justify-content-between mb-2.5 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                                            <div className="d-flex align-items-center gap-2">
                                              <span className="badge bg-light text-secondary border fs-11 fw-normal" style={{ padding: '3px 8px', borderRadius: '4px' }}>
                                                Editing Link #{itIdx + 1}
                                              </span>
                                              <h6 className="fs-13 fw-bold text-dark mb-0">{it.name}</h6>
                                            </div>
                                            <span className="text-muted fs-12">Edit name &amp; destination</span>
                                          </div>
                                          <div className="row g-3 align-items-end">
                                            <div className="col-md-5">
                                              <label className="form-label fs-13 fw-semibold text-dark mb-1.5">
                                                Item Title <span className="text-danger">*</span>
                                              </label>
                                              <input
                                                type="text"
                                                className="form-control fs-13"
                                                value={editItemName}
                                                onChange={(e) => setEditItemName(e.target.value)}
                                                placeholder="e.g. Executive Pens"
                                                style={{ height: '42px', borderRadius: '7px', borderColor: '#cbd5e1', padding: '10px 14px' }}
                                              />
                                            </div>
                                            <div className="col-md-5">
                                              <label className="form-label fs-13 fw-semibold text-dark mb-1.5">
                                                Target Link <span className="text-danger">*</span>
                                              </label>
                                              <input
                                                type="text"
                                                className="form-control fs-13"
                                                value={editItemLink}
                                                onChange={(e) => setEditItemLink(e.target.value)}
                                                placeholder="e.g. /products"
                                                style={{ height: '42px', borderRadius: '7px', borderColor: '#cbd5e1', padding: '10px 14px' }}
                                              />
                                            </div>
                                            <div className="col-md-2 d-flex gap-2 justify-content-end align-items-center pb-1">
                                              <button
                                                type="button"
                                                className="btn btn-sm d-flex align-items-center justify-content-center"
                                                onClick={() => handleSaveEditItem(col.id, it.id)}
                                                title="Save Item"
                                                style={{
                                                  borderRadius: '7px',
                                                  width: '38px',
                                                  height: '38px',
                                                  backgroundColor: '#16a34a',
                                                  borderColor: '#16a34a',
                                                  color: '#ffffff',
                                                  boxShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
                                                }}
                                              >
                                                <iconify-icon icon="solar:check-circle-bold" class="fs-18 text-white"></iconify-icon>
                                              </button>
                                              <button
                                                type="button"
                                                className="btn btn-sm d-flex align-items-center justify-content-center"
                                                onClick={() => setEditingItemId(null)}
                                                title="Cancel"
                                                style={{
                                                  borderRadius: '7px',
                                                  width: '38px',
                                                  height: '38px',
                                                  backgroundColor: '#dc2626',
                                                  borderColor: '#dc2626',
                                                  color: '#ffffff',
                                                  boxShadow: '0 1px 2px rgba(220, 38, 38, 0.2)',
                                                }}
                                              >
                                                <iconify-icon icon="solar:close-circle-bold" class="fs-18 text-white"></iconify-icon>
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div
                                        key={it.id}
                                        className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-white border"
                                        style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)', transition: 'all 0.15s ease' }}
                                      >
                                        <div className="d-flex align-items-center gap-3">
                                          <span
                                            className="rounded-circle text-muted border d-flex align-items-center justify-content-center fs-12 fw-bold flex-shrink-0"
                                            style={{ width: '28px', height: '28px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                                          >
                                            {itIdx + 1}
                                          </span>
                                          <div>
                                            <div className="fs-14 fw-bold text-dark">{it.name}</div>
                                            <div className="text-muted fs-12 mt-0.5">{it.link}</div>
                                          </div>
                                        </div>

                                        {/* Actions: Edit always yellow background icon-only, Delete light red icon-only on exact same level */}
                                        <div className="d-flex align-items-center gap-2 flex-shrink-0">
                                          <button
                                            type="button"
                                            className="btn btn-sm d-flex align-items-center justify-content-center"
                                            onClick={() => handleStartEditItem(it)}
                                            title="Edit Item"
                                            style={{
                                              borderRadius: '7px',
                                              width: '34px',
                                              height: '34px',
                                              backgroundColor: '#fef3c7',
                                              color: '#b45309',
                                              border: '1px solid #fde68a',
                                              transition: 'all 0.15s ease',
                                            }}
                                          >
                                            <iconify-icon icon="solar:pen-new-square-linear" class="fs-16"></iconify-icon>
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-sm d-flex align-items-center justify-content-center text-danger"
                                            onClick={() => setDeleteConfirmTarget({ type: 'item', colId: col.id, itemId: it.id, name: it.name })}
                                            title="Delete Item"
                                            style={{
                                              borderRadius: '7px',
                                              width: '34px',
                                              height: '34px',
                                              backgroundColor: '#fee2e2',
                                              color: '#dc2626',
                                              border: '1px solid #fecaca',
                                              transition: 'all 0.15s ease',
                                            }}
                                          >
                                            <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-16"></iconify-icon>
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>

                              {/* Add Item Form in this Column */}
                              {isAddingItem ? (
                                <div className="p-3.5 p-md-4 bg-white rounded-3 border border-dashed border-2 mt-3" style={{ borderColor: '#0f172a' }}>
                                  <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                                    <h6 className="fs-13 fw-bold text-dark mb-0">Add Item to &quot;{col.title}&quot;</h6>
                                    <span className="text-muted fs-12">New link entry</span>
                                  </div>
                                  <div className="row g-3 mb-3">
                                    <div className="col-md-6">
                                      <label className="form-label fs-12 fw-semibold text-dark mb-1">Item Title <span className="text-danger">*</span></label>
                                      <input
                                        type="text"
                                        className="form-control fs-13"
                                        placeholder="e.g. Executive Pens"
                                        value={newItemName}
                                        onChange={(e) => setNewItemName(e.target.value)}
                                        style={{ height: '42px', borderRadius: '7px', borderColor: '#cbd5e1' }}
                                      />
                                    </div>
                                    <div className="col-md-6">
                                      <label className="form-label fs-12 fw-semibold text-dark mb-1">Target URL <span className="text-danger">*</span></label>
                                      <input
                                        type="text"
                                        className="form-control fs-13"
                                        placeholder="e.g. /products?cat=pens"
                                        value={newItemLink}
                                        onChange={(e) => setNewItemLink(e.target.value)}
                                        style={{ height: '42px', borderRadius: '7px', borderColor: '#cbd5e1' }}
                                      />
                                    </div>
                                  </div>
                                  <div className="d-flex align-items-center gap-2.5">
                                    <button
                                      type="button"
                                      className="btn btn-sm fs-13 px-4 py-2 fw-semibold text-white"
                                      style={{ backgroundColor: '#0f172a', borderRadius: '7px' }}
                                      onClick={() => handleAddItemToCol(col.id)}
                                    >
                                      Add Item
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-light border fs-13 px-3 py-2"
                                      style={{ borderRadius: '7px', borderColor: '#d1d5db' }}
                                      onClick={() => {
                                        setAddingItemColId(null);
                                        setNewItemName('');
                                        setNewItemLink('');
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm d-flex align-items-center justify-content-center gap-2 w-100 py-2.5 mt-2 fs-13 fw-semibold text-dark"
                                  style={{
                                    borderRadius: '7px',
                                    border: '1.5px dashed #cbd5e1',
                                    backgroundColor: '#ffffff',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onClick={() => {
                                    setAddingItemColId(col.id);
                                    setNewItemName('');
                                    setNewItemLink('');
                                  }}
                                >
                                  <iconify-icon icon="solar:add-circle-bold" class="fs-17"></iconify-icon>
                                  <span>+ Add Item to &quot;{col.title}&quot;</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Column Button / Form */}
                      {columns.length < 3 ? (
                        showAddColumn ? (
                          <div className="p-4 bg-white rounded-3 border border-dashed border-2" style={{ borderColor: '#0f172a' }}>
                            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                              <div className="d-flex align-items-center gap-2">
                                <span className="badge bg-dark text-white fs-11 fw-bold" style={{ padding: '5px 9px', borderRadius: '5px' }}>
                                  New Column
                                </span>
                                <h6 className="fs-14 fw-bold text-dark mb-0">
                                  Mega Menu Column (#{columns.length + 1} of 3)
                                </h6>
                              </div>
                              <span className="text-muted fs-12">Slot {columns.length + 1} of 3</span>
                            </div>

                            <div className="row g-3 mb-3.5">
                              <div className="col-md-6">
                                <label className="form-label fs-13 fw-semibold text-dark mb-1.5">
                                  Column Title <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control fs-13"
                                  placeholder="e.g. Corporate Gifts"
                                  value={newColTitle}
                                  onChange={(e) => setNewColTitle(e.target.value)}
                                  style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1', padding: '10px 14px' }}
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label fs-13 fw-semibold text-dark mb-1.5">
                                  Header Link <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control fs-13"
                                  placeholder="e.g. /products"
                                  value={newColLink}
                                  onChange={(e) => setNewColLink(e.target.value)}
                                  style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1', padding: '10px 14px' }}
                                />
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-3">
                              <button
                                type="button"
                                className="btn btn-sm fs-13 px-4 py-2 fw-semibold text-white"
                                style={{ backgroundColor: '#0f172a', borderRadius: '7px', padding: '10px 22px' }}
                                onClick={handleAddColumn}
                              >
                                Create Column
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-light border fs-13 px-3 py-2"
                                style={{ borderRadius: '7px', borderColor: '#d1d5db', padding: '10px 18px' }}
                                onClick={() => {
                                  setShowAddColumn(false);
                                  setNewColTitle('');
                                  setNewColLink('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-sm d-flex align-items-center justify-content-center gap-2 w-100 py-3 fs-13 fw-bold text-dark"
                            style={{
                              borderRadius: '8px',
                              border: '1.5px dashed #0f172a',
                              backgroundColor: '#ffffff',
                              color: '#0f172a',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                              transition: 'all 0.2s ease',
                            }}
                            onClick={() => setShowAddColumn(true)}
                          >
                            <iconify-icon icon="solar:add-circle-bold" class="fs-18"></iconify-icon>
                            <span>+ Add Sub-Menu Column (Slot {columns.length + 1} of 3)</span>
                          </button>
                        )
                      ) : (
                        <div
                          className="alert alert-info py-2.5 px-3.5 fs-13 mb-0 d-flex align-items-center"
                          style={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', gap: '14px' }}
                        >
                          <iconify-icon icon="solar:info-circle-bold" class="fs-20 text-muted flex-shrink-0"></iconify-icon>
                          <span className="text-secondary">Maximum 3 sub-menu columns reached.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Promotional Banner Configuration & Upload (White Background & Classic Look) */}
                  <div className="col-lg-5">
                    <div
                      className="p-4 rounded-3 h-100"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                        <div className="d-flex align-items-center" style={{ gap: '16px' }}>
                          <span
                            className="rounded-3 d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                            style={{ width: '40px', height: '40px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
                          >
                            <iconify-icon icon="solar:gallery-bold" class="fs-20" style={{ color: '#0f172a' }}></iconify-icon>
                          </span>
                          <div>
                            <h4 className="fw-bold text-dark fs-15 mb-0">Right-Side Promo Banner</h4>
                            <p className="text-muted fs-12 mb-0" style={{ marginTop: '2px' }}>Upload banner file and adjust offer text</p>
                          </div>
                        </div>
                        <div className="form-check form-switch m-0">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={banner.enabled}
                            onChange={(e) => setBanner((prev) => ({ ...prev, enabled: e.target.checked }))}
                            style={{
                              cursor: 'pointer',
                              width: '2.8em',
                              height: '1.4em',
                              backgroundColor: banner.enabled ? '#16a34a' : '#cbd5e1',
                              borderColor: banner.enabled ? '#16a34a' : '#cbd5e1',
                            }}
                          />
                        </div>
                      </div>

                      {banner.enabled ? (
                        <>
                          {/* 1. Image Upload Box */}
                          <div className="mb-4">
                            <label className="form-label fs-13 fw-semibold text-dark mb-2">
                              Banner Image (Upload File) <span className="text-danger">*</span>
                            </label>
                            
                            <input
                              type="file"
                              ref={fileInputRef}
                              accept="image/*"
                              onChange={handleImageFileChange}
                              style={{ display: 'none' }}
                            />

                            <div
                              onClick={() => fileInputRef.current?.click()}
                              className="p-4 text-center rounded-3 bg-white border border-dashed border-2 cursor-pointer transition-all"
                              style={{
                                cursor: 'pointer',
                                borderColor: '#cbd5e1',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                              }}
                            >
                              {isUploading ? (
                                <div className="py-3">
                                  <div className="spinner-border spinner-border-sm text-dark mb-2" role="status"></div>
                                  <div className="fs-13 text-muted">Uploading banner image...</div>
                                </div>
                              ) : (
                                <div className="py-2">
                                  <iconify-icon icon="solar:cloud-upload-bold" class="fs-36 text-dark mb-2"></iconify-icon>
                                  <div className="fs-14 fw-bold text-dark mb-1">Click to browse or upload banner image</div>
                                  <div className="fs-12 text-muted">PNG, JPG, WEBP (Recommended: 300x380 px)</div>
                                </div>
                              )}
                            </div>

                            {banner.image && (
                              <div className="d-flex align-items-center justify-content-between p-3 mt-3 bg-white rounded-3 border" style={{ borderColor: '#e2e8f0' }}>
                                <div className="d-flex align-items-center gap-3">
                                  <img
                                    src={banner.image}
                                    alt="Preview"
                                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '7px', border: '1px solid #e2e8f0' }}
                                  />
                                  <div>
                                    <div className="fs-13 fw-bold text-dark text-truncate" style={{ maxWidth: '180px' }}>
                                      Banner Image
                                    </div>
                                    <div className="fs-11 text-muted text-truncate" style={{ maxWidth: '180px' }}>
                                      {banner.image}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-sm fs-12 py-1.5 px-3 text-danger fw-semibold"
                                  style={{ borderRadius: '7px', backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}
                                  onClick={() => setBanner((prev) => ({ ...prev, image: '/assets/imgs/banner/banner-menu.png' }))}
                                >
                                  Reset Default
                                </button>
                              </div>
                            )}
                          </div>

                          {/* 2. Text Content Fields with standard gap-3 */}
                          <div className="row g-3 mb-4">
                            <div className="col-6">
                              <label className="form-label fs-13 fw-semibold text-dark mb-1.5">Tagline</label>
                              <input
                                type="text"
                                className="form-control fs-13"
                                placeholder="e.g. Hot deals"
                                value={banner.tag}
                                onChange={(e) => setBanner((prev) => ({ ...prev, tag: e.target.value }))}
                                style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1' }}
                              />
                              <div className="text-muted fs-11 mt-1">Single line max (truncated with ...)</div>
                            </div>
                            <div className="col-6">
                              <label className="form-label fs-13 fw-semibold text-dark mb-1.5">Discount Badge</label>
                              <input
                                type="text"
                                className="form-control fs-13"
                                placeholder="e.g. 25% off"
                                value={banner.discountBadge || ''}
                                onChange={(e) => setBanner((prev) => ({ ...prev, discountBadge: e.target.value }))}
                                style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1' }}
                              />
                            </div>

                            <div className="col-12">
                              <label className="form-label fs-13 fw-semibold text-dark mb-1.5">Headline Title</label>
                              <input
                                type="text"
                                className="form-control fs-13"
                                placeholder="e.g. Don't miss Trending"
                                value={banner.title}
                                onChange={(e) => setBanner((prev) => ({ ...prev, title: e.target.value }))}
                                style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1' }}
                              />
                              <div className="text-muted fs-11 mt-1">Max 2 lines in storefront (truncated with ...)</div>
                            </div>

                            <div className="col-12">
                              <label className="form-label fs-13 fw-semibold text-dark mb-1.5">Price / Offer Note</label>
                              <input
                                type="text"
                                className="form-control fs-13"
                                placeholder="e.g. Save up to 50%"
                                value={banner.priceNote || ''}
                                onChange={(e) => setBanner((prev) => ({ ...prev, priceNote: e.target.value }))}
                                style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1' }}
                              />
                              <div className="text-muted fs-11 mt-1">Max 2 lines in storefront (truncated with ...)</div>
                            </div>

                            {/* Option to show or hide button */}
                            <div className="col-12">
                              <div
                                className="d-flex align-items-center justify-content-between p-3 rounded-3 border"
                                style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                              >
                                <div className="d-flex align-items-center gap-2.5">
                                  <span
                                    className="rounded-circle d-flex align-items-center justify-content-center text-dark flex-shrink-0"
                                    style={{ width: '32px', height: '32px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                                  >
                                    <iconify-icon icon="solar:cursor-square-bold" class="fs-16"></iconify-icon>
                                  </span>
                                  <div>
                                    <div className="fs-13 fw-bold text-dark">Call-to-Action Button</div>
                                    <div className="fs-11 text-muted">Show or hide the action button on the banner</div>
                                  </div>
                                </div>
                                <div className="form-check form-switch m-0 flex-shrink-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={banner.showBtn !== false}
                                    onChange={(e) => setBanner((prev) => ({ ...prev, showBtn: e.target.checked }))}
                                    style={{
                                      cursor: 'pointer',
                                      width: '2.5em',
                                      height: '1.25em',
                                      backgroundColor: banner.showBtn !== false ? '#16a34a' : '#cbd5e1',
                                      borderColor: banner.showBtn !== false ? '#16a34a' : '#cbd5e1',
                                    }}
                                  />
                                </div>
                              </div>
                            </div>

                            {banner.showBtn !== false && (
                              <>
                                <div className="col-6">
                                  <label className="form-label fs-13 fw-semibold text-dark mb-1.5">Button Text</label>
                                  <input
                                    type="text"
                                    className="form-control fs-13"
                                    placeholder="e.g. Shop now"
                                    value={banner.btnText}
                                    onChange={(e) => setBanner((prev) => ({ ...prev, btnText: e.target.value }))}
                                    style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1' }}
                                  />
                                </div>

                                <div className="col-6">
                                  <label className="form-label fs-13 fw-semibold text-dark mb-1.5">Button Target Link</label>
                                  <input
                                    type="text"
                                    className="form-control fs-13"
                                    placeholder="e.g. /products"
                                    value={banner.btnLink}
                                    onChange={(e) => setBanner((prev) => ({ ...prev, btnLink: e.target.value }))}
                                    style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1' }}
                                  />
                                </div>
                              </>
                            )}
                          </div>

                          {/* 3. Live Visual Banner Preview */}
                          <div className="border rounded-3 p-3.5 bg-white" style={{ borderColor: '#e2e8f0', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)' }}>
                            <div className="d-flex align-items-center justify-content-between mb-2.5">
                              <span className="fs-12 fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.6px' }}>
                                Live Storefront Preview
                              </span>
                              <span className="badge bg-light text-secondary border fs-11 fw-normal" style={{ padding: '3px 8px', borderRadius: '4px' }}>
                                Preview
                              </span>
                            </div>
                            <div
                              style={{
                                position: 'relative',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                height: '185px',
                                backgroundColor: '#f1f5f9',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                              }}
                            >
                              <img
                                src={banner.image || '/assets/imgs/banner/banner-menu.png'}
                                alt="Banner"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '14px',
                                  left: '16px',
                                  color: '#253D4E',
                                  maxWidth: '70%',
                                }}
                              >
                                {banner.tag && (
                                  <div
                                    style={{
                                      fontSize: '12px',
                                      color: '#ff7518',
                                      fontWeight: 'bold',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      maxWidth: '100%',
                                      display: 'block',
                                    }}
                                    title={banner.tag}
                                  >
                                    {banner.tag}
                                  </div>
                                )}
                                <div
                                  style={{
                                    fontSize: '15px',
                                    fontWeight: '800',
                                    lineHeight: 1.25,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    wordBreak: 'break-word',
                                  }}
                                  title={banner.title}
                                >
                                  {banner.title}
                                </div>
                                {banner.priceNote && (
                                  <div
                                    style={{
                                      fontSize: '13px',
                                      color: '#3BB77E',
                                      fontWeight: '700',
                                      marginTop: '3px',
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      wordBreak: 'break-word',
                                    }}
                                    title={banner.priceNote}
                                  >
                                    {banner.priceNote}
                                  </div>
                                )}
                                {banner.showBtn !== false && (
                                  <div
                                    style={{
                                      display: 'inline-block',
                                      marginTop: '10px',
                                      padding: '5px 12px',
                                      fontSize: '12px',
                                      fontWeight: 'bold',
                                      backgroundColor: '#3BB77E',
                                      color: '#ffffff',
                                      borderRadius: '5px',
                                    }}
                                  >
                                    {banner.btnText || 'Shop now'}
                                  </div>
                                )}
                              </div>
                              {banner.discountBadge && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    top: '12px',
                                    right: '12px',
                                    backgroundColor: '#FDC839',
                                    color: '#253D4E',
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                  }}
                                >
                                  {banner.discountBadge}
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div
                          className="d-flex flex-column align-items-center justify-content-center text-center p-5 rounded-3 border"
                          style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0', minHeight: '340px' }}
                        >
                          <span
                            className="rounded-circle d-flex align-items-center justify-content-center text-muted mb-3"
                            style={{ width: '56px', height: '56px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0' }}
                          >
                            <iconify-icon icon="solar:gallery-wide-linear" class="fs-28 text-muted"></iconify-icon>
                          </span>
                          <h6 className="fs-14 fw-bold text-dark mb-1">Promo Banner is Disabled</h6>
                          <p className="text-muted fs-13 mb-0" style={{ maxWidth: '300px' }}>
                            Toggle the switch above to display an image banner and promotional offer on the right side of the storefront dropdown.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* Bottom Actions Bar: Cancel and Save Changes Together on Right Side */}
              <div className="d-flex align-items-center justify-content-end gap-3 pt-4 mt-4 border-top" style={{ borderColor: '#e2e8f0' }}>
                <Link
                  href="/dashboard/shop-settings"
                  className="btn btn-sm btn-light border fs-14 fw-semibold text-secondary"
                  style={{
                    borderRadius: '8px',
                    padding: '10px 22px',
                    backgroundColor: '#ffffff',
                    borderColor: '#d1d5db',
                    color: '#334155',
                  }}
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-sm fs-14 fw-semibold text-white d-flex align-items-center gap-2.5"
                  style={{
                    borderRadius: '8px',
                    padding: '10px 26px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #0f172a',
                    boxShadow: '0 2px 4px rgba(15, 23, 42, 0.25)',
                  }}
                >
                  {isSaving && <div className="spinner-border spinner-border-sm" role="status"></div>}
                  <iconify-icon icon="solar:diskette-bold" class="fs-18 text-white"></iconify-icon>
                  <span>{isNew ? 'Create Main Menu' : 'Save Menu Changes'}</span>
                </button>
              </div>

            </form>
          )}

        </div>
      </div>

      {/* Delete Confirmation Modal for Column or Item */}
      {deleteConfirmTarget && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
            <div
              className="modal-content border-0 shadow-lg"
              style={{
                borderRadius: '14px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="modal-body p-4 text-center">
                <div
                  className="rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: '56px', height: '56px' }}
                >
                  <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-28"></iconify-icon>
                </div>
                <h4 className="fw-bold text-dark mb-1.5" style={{ fontSize: '18px' }}>
                  Delete {deleteConfirmTarget.type === 'column' ? 'Mega Menu Column' : 'Sub-Menu Item'}?
                </h4>
                <p className="text-muted fs-14 mb-4">
                  Are you sure you want to remove &quot;{deleteConfirmTarget.name}&quot;?
                  {deleteConfirmTarget.type === 'column'
                    ? ' All items in this column will also be removed.'
                    : ' This item will be removed from the column.'}
                </p>
                <div className="d-flex align-items-center justify-content-center gap-3">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border px-4 py-2 fs-14 fw-semibold text-secondary"
                    onClick={() => setDeleteConfirmTarget(null)}
                    style={{ borderRadius: '8px', minWidth: '110px' }}
                  >
                    No, Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger px-4 py-2 fs-14 fw-semibold d-flex align-items-center gap-2"
                    onClick={handleExecuteDelete}
                    style={{ borderRadius: '8px', minWidth: '130px' }}
                  >
                    <iconify-icon icon="solar:trash-bin-trash-bold" class="fs-16"></iconify-icon>
                    <span>Yes, Delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
