'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { fetchShopSettings, saveShopSettings } from '@/services/shopSettingsService';
import { MainMenuItem, SubMenuColumn, SubMenuColumnItem, MenuBanner, ShopCategory } from '@/data/defaultShopSettings';
import { fetchProducts } from '@/services/productsService';
import { ProductItem } from '@/data/categoryProductsData';
import { useToast } from '@/context/ToastContext';
import { validateImageFile, compressImage } from '@/utils/imageSecurity';
import { ClientPortal } from '@/components/common/ClientPortal';

const ALLOWED_MENU_BADGES = ['NEW', 'OFFER', 'LIMITED SALE'];
const BADGE_DESTINATIONS: Record<string, string> = {
  NEW: '/new-arrival-products',
  OFFER: '/offer-products',
  'LIMITED SALE': '/limited-offers',
};

const getWordCount = (value: string) => value.trim() ? value.trim().split(/\s+/).length : 0;

export default function MenuEditPage() {
  const params = useParams();
  const router = useRouter();
  const menuId = params?.id as string;
  const isNew = menuId === 'new';

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { showToast } = useToast();

  // Catalog Sources for Pickers
  const [availableCategories, setAvailableCategories] = useState<ShopCategory[]>([]);
  const [availableProducts, setAvailableProducts] = useState<ProductItem[]>([]);

  // Delete confirmation modal state
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'column' | 'item';
    colId: string;
    itemId?: string;
    name: string;
  } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [link, setLink] = useState('/products');
  const [hasMegaMenu, setHasMegaMenu] = useState(true);
  const [badge, setBadge] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Columns & Banner (Starts empty on create new)
  const [columns, setColumns] = useState<SubMenuColumn[]>([]);
  const [banner, setBanner] = useState<MenuBanner>({
    enabled: false,
    showBtn: false,
    image: '',
    tag: '',
    title: '',
    priceNote: '',
    discountBadge: '',
    btnText: 'Shop now',
    btnLink: '/products',
  });

  // State for editing an item inside a column
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editItemLink, setEditItemLink] = useState('');

  // ========================================================
  // SLIDE-OVER DRAWER STATES (Right-to-Left Off-Canvas)
  // ========================================================
  // 1. Category Drawer for Sub-Menu Columns
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryPage, setCategoryPage] = useState(1);
  const [targetColumnForCategory, setTargetColumnForCategory] = useState<string | null>(null);

  // 2. Product Drawer for Column Sub-Items
  const [showProductDrawer, setShowProductDrawer] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
  const [productPage, setProductPage] = useState(1);
  const [targetColumnForProduct, setTargetColumnForProduct] = useState<string | null>(null);
  const [targetItemForProduct, setTargetItemForProduct] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [settings, prods] = await Promise.all([
          fetchShopSettings(),
          fetchProducts().catch(() => []),
        ]);

        if (settings && Array.isArray(settings.categories)) {
          setAvailableCategories(settings.categories);
        }
        if (Array.isArray(prods)) {
          setAvailableProducts(prods);
        }

        if (!isNew) {
          const found = settings.mainMenu.find((m) => m.id === menuId);
          if (found) {
            setName(found.name);
            setLink(BADGE_DESTINATIONS[found.badge || ''] || found.link || '/products');
            setHasMegaMenu(found.badge ? false : found.hasMegaMenu);
            setBadge(ALLOWED_MENU_BADGES.includes(found.badge || '') ? found.badge || '' : '');
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
          // CREATE NEW: Start completely empty (NO dummy items)
          if (settings.mainMenu.length >= 6) {
            showToast('danger', 'Maximum 6 main menu items allowed. Please remove or edit existing menus.');
          }
          setName('');
          setLink('/products');
          setHasMegaMenu(true);
          setBadge('');
          setIsActive(true);
          setColumns([]);
          setBanner({
            enabled: false,
            showBtn: false,
            image: '',
            tag: '',
            title: '',
            priceNote: '',
            discountBadge: '',
            btnText: 'Shop now',
            btnLink: '/products',
          });
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

    const validation = validateImageFile(file, 5 * 1024 * 1024);
    if (!validation.valid) {
      showToast('danger', validation.error || 'Invalid image file.');
      return;
    }

    setIsUploading(true);
    try {
      const compressedFile = await compressImage(file, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 0.85,
        mimeType: 'image/webp',
      });

      const previewUrl = URL.createObjectURL(compressedFile);
      setBanner((prev) => ({ ...prev, image: previewUrl }));

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

  // ========================================================
  // CATEGORY DRAWER HANDLERS (Select category for column)
  // ========================================================
  const handleOpenCategoryDrawer = (colId?: string) => {
    setTargetColumnForCategory(colId || null);
    setCategorySearch('');
    setCategoryPage(1);
    setShowCategoryDrawer(true);
  };

  const handleSelectCategory = (cat: ShopCategory) => {
    const targetLink = `/products?category=${encodeURIComponent(cat.name)}`;
    if (targetColumnForCategory) {
      const existing = columns.find((col) => col.id === targetColumnForCategory);
      const isSameCategory = existing?.categoryId === cat.id ||
        (!existing?.categoryId && existing?.title.toLowerCase() === cat.name.toLowerCase());
      if (columns.some((col) => col.id !== targetColumnForCategory && col.categoryId === cat.id)) {
        showToast('danger', 'This category is already used by another column.');
        return;
      }
      setColumns((prev) =>
        prev.map((col) =>
          col.id === targetColumnForCategory
            ? { ...col, categoryId: cat.id, title: cat.name, link: targetLink, items: isSameCategory ? col.items : [] }
            : col
        )
      );
      showToast('success', isSameCategory ? `Column updated to "${cat.name}".` : `Category changed to "${cat.name}". Its selected products were cleared.`);
    } else {
      if (columns.length >= 3) {
        showToast('danger', 'Maximum 3 columns allowed for mega-menu.');
        setShowCategoryDrawer(false);
        return;
      }
      const newCol: SubMenuColumn = {
        id: `col-${Date.now()}`,
        categoryId: cat.id,
        title: cat.name,
        link: targetLink,
        items: [],
      };
      setColumns([...columns, newCol]);
      showToast('success', `Added "${cat.name}" column.`);
    }
    setShowCategoryDrawer(false);
  };

  // ========================================================
  // PRODUCT DRAWER HANDLERS (Select product for column item)
  // ========================================================
  const handleOpenProductDrawer = (colId: string, itemId?: string) => {
    setTargetColumnForProduct(colId);
    setTargetItemForProduct(itemId || null);
    setProductSearch('');
    setProductPage(1);

    const col = columns.find((c) => c.id === colId);
    const category = availableCategories.find((c) => c.id === col?.categoryId) || availableCategories.find((c) => c.name.toLowerCase() === col?.title.toLowerCase());
    setProductCategoryFilter(category?.id || '');

    setShowProductDrawer(true);
  };

  const handleSelectProduct = (prod: ProductItem) => {
    if (!targetColumnForProduct) return;
    const targetColumn = columns.find((col) => col.id === targetColumnForProduct);
    if (!targetColumn) return;
    const isDuplicate = targetColumn.items.some((item) =>
      item.id !== targetItemForProduct &&
      (item.productId === prod.id || (!item.productId && item.name === prod.title))
    );
    if (isDuplicate) {
      showToast('danger', 'This product is already selected for this category.');
      return;
    }
    if (!targetItemForProduct && targetColumn.items.length >= 5) {
      showToast('danger', 'Each category can contain a maximum of 5 products.');
      return;
    }
    const prodLink = prod.link || `/product-details?id=${prod.id}`;

    if (targetItemForProduct) {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === targetColumnForProduct
            ? {
                ...col,
                items: col.items.map((it) =>
                  it.id === targetItemForProduct ? { ...it, productId: prod.id, name: prod.title, link: prodLink } : it
                ),
              }
            : col
        )
      );
      showToast('success', `Updated item to "${prod.title}".`);
    } else {
      const newItem: SubMenuColumnItem = {
        id: `item-${Date.now()}`,
        productId: prod.id,
        name: prod.title,
        link: prodLink,
      };
      setColumns((prev) =>
        prev.map((col) => (col.id === targetColumnForProduct ? { ...col, items: [...col.items, newItem] } : col))
      );
      showToast('success', `Added "${prod.title}".`);
    }

    setShowProductDrawer(false);
  };

  // Save Final Menu Configuration
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('danger', 'Please enter a menu title.');
      return;
    }
    const menuTitle = name.trim();
    const wordCount = getWordCount(menuTitle);
    if (wordCount < 2 || wordCount > 3 || menuTitle.length < 10 || menuTitle.length > 15) {
      showToast('danger', 'Menu title must contain 2–3 words and 10–15 characters.');
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
          link: BADGE_DESTINATIONS[badge] || link.trim() || '/products',
          hasMegaMenu: badge ? false : hasMegaMenu,
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
                link: BADGE_DESTINATIONS[badge] || link.trim() || m.link,
                hasMegaMenu: badge ? false : hasMegaMenu,
                isHotDeal: undefined,
                badge: badge.trim() || undefined,
                isActive,
                columns: hasMegaMenu ? columns : undefined,
                banner: hasMegaMenu ? banner : undefined,
              }
            : m
        );
      }

      const saveRes = await saveShopSettings({
        categories: settings.categories,
        mainMenu: updatedMenu,
      });

      if (saveRes.success) {
        showToast('success', isNew ? 'Menu created successfully!' : 'Menu changes saved successfully!', 'Saved');
        router.push('/dashboard/shop-settings');
      } else {
        showToast('danger', saveRes.message || 'Failed to save menu changes.');
      }
    } catch (err: any) {
      showToast('danger', err.message || 'Error occurred while saving menu.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBadgeChange = (nextBadge: string) => {
    setBadge(nextBadge);
    if (nextBadge) {
      setHasMegaMenu(false);
    } else {
      setHasMegaMenu(true);
      setLink('/products');
    }
    if (BADGE_DESTINATIONS[nextBadge]) {
      setLink(BADGE_DESTINATIONS[nextBadge]);
    }
  };

  const destinationFilteredProducts = availableProducts.filter((product) => {
    if (link === '/products?filter=new-arrival' || link === '/new-arrival-products') return product.isNewArrival === true && !product.isSpecialOffer;
    if (link === '/products?filter=special-offers' || link === '/offer-products') return product.isSpecialOffer === true && !product.offerEndDate;
    if (link === '/products?filter=most-searched' || link === '/most-searched-products') return product.isMostSearched === true;
    if (link === '/limited-offers') return product.isSpecialOffer === true && Boolean(product.offerEndDate);
    return true;
  });

  const productBelongsToCategory = (product: ProductItem, category: ShopCategory) =>
    product.categoryId === category.id || product.category?.toLowerCase() === category.name.toLowerCase();

  // All Products exposes every category. Other destinations expose only categories with matching products.
  const destinationCategories = link === '/products'
    ? availableCategories
    : availableCategories.filter((category) =>
      destinationFilteredProducts.some((product) => productBelongsToCategory(product, category))
    );

  // Filtering for Category Drawer
  const filteredCategories = destinationCategories.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );
  const catItemsPerPage = 10;
  const totalCatPages = Math.ceil(filteredCategories.length / catItemsPerPage) || 1;
  const currentCategories = filteredCategories.slice(
    (categoryPage - 1) * catItemsPerPage,
    categoryPage * catItemsPerPage
  );

  // Filtering for Product Drawer
  const selectedProductCategory = availableCategories.find((category) => category.id === productCategoryFilter);
  const filteredProducts = destinationFilteredProducts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase())) ||
      (p.standard && p.standard.toLowerCase().includes(productSearch.toLowerCase()));

    const matchesCategory = !!selectedProductCategory && productBelongsToCategory(p, selectedProductCategory);

    return matchesSearch && matchesCategory;
  });
  const prodItemsPerPage = 10;
  const totalProdPages = Math.ceil(filteredProducts.length / prodItemsPerPage) || 1;
  const currentProducts = filteredProducts.slice(
    (productPage - 1) * prodItemsPerPage,
    productPage * prodItemsPerPage
  );

  const activeColumnForProduct = columns.find((c) => c.id === targetColumnForProduct);
  const selectedProductIds = new Set(
    (activeColumnForProduct?.items || [])
      .filter((item) => item.id !== targetItemForProduct)
      .map((item) => item.productId || availableProducts.find((product) => product.title === item.name)?.id)
      .filter((id): id is string => Boolean(id))
  );

  return (
    <>
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
                Manage mega menu columns, select categories and products from catalog, and configure promo banner.
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
              {/* Section 1: Basic Menu Configuration */}
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
                        onChange={(e) => {
                          const nextName = e.target.value;
                          if (getWordCount(nextName) <= 3) {
                            setName(nextName);
                          }
                        }}
                        minLength={10}
                        maxLength={15}
                        required
                      style={{
                        borderRadius: '8px',
                        padding: '10px 16px',
                        borderColor: '#cbd5e1',
                        height: '46px',
                      }}
                      />
                    <div className={`fs-11 mt-1 ${getWordCount(name) >= 2 && getWordCount(name) <= 3 && name.trim().length >= 10 ? 'text-success' : 'text-muted'}`}>
                      Use 2–3 words and 10–15 characters ({getWordCount(name)} words, {name.trim().length}/15 characters).
                    </div>
                  </div>

                  {/* Target Destination URL (system store pages only) */}
                  <div className="col-md-5">
                    <div className="d-flex align-items-center mb-2">
                      <label className="form-label fs-13 fw-semibold text-dark mb-0">
                        Target Destination URL <span className="text-danger">*</span>
                      </label>
                    </div>

                    <div className="input-group">
                      <select
                        className="form-select fs-13 fw-medium"
                        value={['/products', '/new-arrival-products', '/offer-products', '/most-searched-products', '/limited-offers'].includes(link) ? link : '/products'}
                        onChange={(e) => setLink(e.target.value)}
                        style={{
                          borderRadius: '8px',
                          borderColor: '#cbd5e1',
                          height: '46px',
                          maxWidth: '185px',
                          backgroundColor: '#f8fafc',
                          fontSize: '13px',
                        }}
                      >
                        <optgroup label="System Store Pages">
                          <option value="/products">All Products</option>
                          <option value="/new-arrival-products">New Arrivals</option>
                          <option value="/offer-products">Offer Products</option>
                          <option value="/limited-offers">Limited Offers</option>
                          <option value="/most-searched-products">Most Searched</option>
                        </optgroup>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label fs-13 fw-semibold text-dark mb-2">
                      Badge Text (Optional)
                    </label>
                    <select
                      className="form-select fs-14"
                      value={badge}
                      onChange={(e) => handleBadgeChange(e.target.value)}
                      style={{
                        borderRadius: '8px',
                        padding: '10px 16px',
                        borderColor: '#cbd5e1',
                        height: '46px',
                      }}
                    >
                      <option value="">No Badge</option>
                      <option value="NEW">New</option>
                      <option value="OFFER">Offer</option>
                      <option value="LIMITED SALE">Limited Sale</option>
                    </select>
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
                        <p className="text-muted fs-12 mb-0">{badge ? 'Disabled while a navigation badge is active' : 'Expandable 3-column dropdown & banner'}</p>
                      </div>
                      <div className="form-check form-switch m-0 flex-shrink-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={hasMegaMenu}
                          disabled={Boolean(badge)}
                          onChange={(e) => setHasMegaMenu(e.target.checked)}
                          style={{
                            cursor: badge ? 'not-allowed' : 'pointer',
                            width: '2.8em',
                            height: '1.4em',
                            backgroundColor: hasMegaMenu ? '#16a34a' : '#cbd5e1',
                            borderColor: hasMegaMenu ? '#16a34a' : '#cbd5e1',
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Status */}
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

              {/* Section 2: Mega Menu Columns & Promotional Banner */}
              {hasMegaMenu && (
                <div className="row g-4">
                  {/* Left: Columns Section (Col 1, Col 2, Col 3) */}
                  <div className="col-lg-7">
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
                            <iconify-icon icon="solar:align-vertical-spacing-bold" class="fs-20" style={{ color: '#0f172a' }}></iconify-icon>
                          </span>
                          <div>
                            <h4 className="fw-bold text-dark fs-15 mb-0">Sub-Menu Columns</h4>
                            <p className="text-muted fs-12 mb-0" style={{ marginTop: '2px' }}>
                              Select categories for each column, then pick products from that category.
                            </p>
                          </div>
                        </div>
                        <span
                          className={`badge ${columns.length >= 3 ? 'bg-danger text-white' : 'bg-dark text-white'} fs-12 fw-bold`}
                          style={{ padding: '6px 12px', borderRadius: '6px' }}
                        >
                          {columns.length} / 3 Columns
                        </span>
                      </div>

                      {/* Empty state when no columns exist */}
                      {columns.length === 0 && (
                        <div
                          className="text-center py-5 rounded-3 border border-dashed mb-4"
                          style={{ borderColor: '#cbd5e1', backgroundColor: '#f8fafc', padding: '40px 20px' }}
                        >
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3 text-muted"
                            style={{ width: '56px', height: '56px', backgroundColor: '#f1f5f9' }}
                          >
                            <iconify-icon icon="solar:folder-with-files-bold" class="fs-28 text-muted"></iconify-icon>
                          </div>
                          <h6 className="fw-bold text-dark mb-1">No Sub-Menu Columns Configured</h6>
                          <p className="text-muted fs-13 mb-3" style={{ maxWidth: '420px', margin: '0 auto' }}>
                            Add up to 3 columns representing featured categories. Click below to pick from your category catalog.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenCategoryDrawer()}
                            className="btn btn-dark btn-sm d-inline-flex align-items-center gap-2 px-3 py-2 text-white"
                            style={{ borderRadius: '7px', fontSize: '13px' }}
                          >
                            <iconify-icon icon="solar:folder-with-files-bold" class="fs-16"></iconify-icon>
                            <span>+ Select Category for Column 1</span>
                          </button>
                        </div>
                      )}

                      {/* Columns List */}
                      <div className="d-flex flex-column gap-3 mb-4">
                        {columns.map((col, cIdx) => {
                          return (
                            <div
                              key={col.id}
                              className="p-4 bg-white rounded-3 border"
                              style={{
                                borderColor: '#e2e8f0',
                                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.02)',
                              }}
                            >
                              {/* Category-only column header */}
                              <div className="d-flex align-items-center justify-content-between mb-3 pb-2.5 border-bottom" style={{ borderColor: '#f1f5f9' }}>
                                  <div className="d-flex align-items-center gap-2.5">
                                    <span
                                      className="badge bg-dark text-white fs-11 fw-bold"
                                      style={{ padding: '6px 12px', borderRadius: '6px', letterSpacing: '0.3px' }}
                                    >
                                      Col {cIdx + 1}
                                    </span>
                                    <div>
                                      <div className="d-flex align-items-center gap-2">
                                        <h5 className="fs-15 fw-bold text-dark mb-0">{col.title}</h5>
                                        <span className="badge bg-light text-secondary border fs-11 fw-normal">
                                          {col.items.length} {col.items.length === 1 ? 'sub-item' : 'sub-items'}
                                        </span>
                                      </div>
                                      <span className="text-muted fs-11 font-monospace">{col.link}</span>
                                    </div>
                                  </div>

                                  <div className="d-flex align-items-center gap-1.5">
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-light border text-primary d-flex align-items-center gap-1 px-2.5 py-1"
                                      style={{ borderRadius: '6px', fontSize: '12px' }}
                                      onClick={() => handleOpenCategoryDrawer(col.id)}
                                      title="Select/Change Category"
                                    >
                                      <iconify-icon icon="solar:folder-with-files-bold" class="fs-14"></iconify-icon>
                                      <span>Category</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-light border text-danger d-flex align-items-center justify-content-center"
                                      style={{ width: '32px', height: '32px', borderRadius: '6px' }}
                                      onClick={() =>
                                        setDeleteConfirmTarget({
                                          type: 'column',
                                          colId: col.id,
                                          name: col.title,
                                        })
                                      }
                                      title="Delete Column"
                                    >
                                      <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-15"></iconify-icon>
                                    </button>
                                  </div>
                              </div>

                              {/* Column Items List */}
                              <div className="d-flex flex-column gap-2 mb-2">
                                {col.items.length === 0 && (
                                  <div className="p-3 rounded-2 text-center border border-dashed mb-1" style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                                    <span className="text-muted fs-12">No products in this category yet. Use the Add Product button below.</span>
                                  </div>
                                )}

                                {col.items.map((item, iIdx) => {
                                  const isEditingItem = editingItemId === item.id;

                                  if (isEditingItem) {
                                    return (
                                      <div
                                        key={item.id}
                                        className="p-3 bg-white rounded-3 border mb-2 shadow-sm"
                                        style={{ borderColor: '#cbd5e1' }}
                                      >
                                        <div className="d-flex align-items-center justify-content-between mb-2">
                                          <span className="badge bg-light text-dark border fs-11 fw-semibold">
                                            Editing Item #{iIdx + 1}
                                          </span>
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-light border fs-11 d-flex align-items-center gap-1"
                                            onClick={() => handleOpenProductDrawer(col.id, item.id)}
                                          >
                                            <iconify-icon icon="solar:box-minimalistic-bold" class="fs-13 text-primary"></iconify-icon>
                                            <span>Pick from Catalog</span>
                                          </button>
                                        </div>
                                        <div className="row g-2 align-items-center">
                                          <div className="col-md-5">
                                            <input
                                              type="text"
                                              className="form-control form-control-sm fs-13"
                                              value={editItemName}
                                              onChange={(e) => setEditItemName(e.target.value)}
                                              placeholder="Item Title"
                                              style={{ height: '38px', borderRadius: '6px', borderColor: '#cbd5e1' }}
                                            />
                                          </div>
                                          <div className="col-md-5">
                                            <input
                                              type="text"
                                              className="form-control form-control-sm fs-13"
                                              value={editItemLink}
                                              onChange={(e) => setEditItemLink(e.target.value)}
                                              placeholder="Target Link"
                                              style={{ height: '38px', borderRadius: '6px', borderColor: '#cbd5e1' }}
                                            />
                                          </div>
                                          <div className="col-md-2 d-flex gap-1.5 justify-content-end">
                                            <button
                                              type="button"
                                              className="btn btn-sm text-white d-flex align-items-center justify-content-center"
                                              style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: '#0f172a' }}
                                              onClick={() => handleSaveEditItem(col.id, item.id)}
                                              title="Save"
                                            >
                                              <iconify-icon icon="solar:check-read-bold" class="fs-16"></iconify-icon>
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-light border d-flex align-items-center justify-content-center"
                                              style={{ width: '36px', height: '36px', borderRadius: '6px', color: '#64748b' }}
                                              onClick={() => setEditingItemId(null)}
                                              title="Cancel"
                                            >
                                              <iconify-icon icon="solar:close-circle-linear" class="fs-16"></iconify-icon>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      key={item.id}
                                      className="d-flex align-items-center justify-content-between p-2.5 rounded-2 border bg-white"
                                      style={{ borderColor: '#f1f5f9' }}
                                    >
                                      <div className="d-flex align-items-center gap-2">
                                        <span
                                          className="rounded-circle d-flex align-items-center justify-content-center text-muted"
                                          style={{ width: '22px', height: '22px', backgroundColor: '#f8fafc', fontSize: '11px', border: '1px solid #e2e8f0' }}
                                        >
                                          {iIdx + 1}
                                        </span>
                                        <div>
                                          <span className="fs-13 fw-semibold text-dark d-block" style={{ lineHeight: '1.3' }}>
                                            {item.name}
                                          </span>
                                          <span className="text-muted fs-11 font-monospace">{item.link}</span>
                                        </div>
                                      </div>

                                      <div className="d-flex align-items-center gap-1">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-icon text-warning p-1"
                                          onClick={() => handleOpenProductDrawer(col.id, item.id)}
                                          title="Edit Item"
                                        >
                                          <iconify-icon icon="solar:pen-linear" class="fs-14"></iconify-icon>
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-icon text-danger p-1"
                                          onClick={() =>
                                            setDeleteConfirmTarget({
                                              type: 'item',
                                              colId: col.id,
                                              itemId: item.id,
                                              name: item.name,
                                            })
                                          }
                                          title="Delete Item"
                                        >
                                          <iconify-icon icon="solar:trash-bin-trash-linear" class="fs-14"></iconify-icon>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Products are always chosen from the selected category. */}
                              <div className="d-flex align-items-center gap-2 mt-2">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-dark d-flex align-items-center justify-content-center gap-1.5 flex-grow-1 py-2 text-white"
                                    style={{ borderRadius: '7px', fontSize: '12.5px' }}
                                    onClick={() => handleOpenProductDrawer(col.id)}
                                    disabled={col.items.length >= 5}
                                  >
                                    <iconify-icon icon="solar:box-minimalistic-bold" class="fs-15"></iconify-icon>
                                    <span>{col.items.length >= 5 ? 'Maximum 5 Products Selected' : `+ Add Product (${col.items.length}/5)`}</span>
                                  </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Column Options */}
                      {columns.length < 3 ? (
                          <div className="d-flex align-items-center gap-2">
                            <button
                              type="button"
                              className="btn btn-dark btn-sm d-flex align-items-center justify-content-center gap-2 flex-grow-1 py-3 fs-13 fw-bold text-white"
                              style={{
                                borderRadius: '8px',
                                backgroundColor: '#0f172a',
                                boxShadow: '0 2px 4px rgba(15, 23, 42, 0.15)',
                                transition: 'all 0.2s ease',
                              }}
                              onClick={() => handleOpenCategoryDrawer()}
                            >
                              <iconify-icon icon="solar:folder-with-files-bold" class="fs-17"></iconify-icon>
                              <span>+ Add Column {columns.length + 1} from Categories</span>
                            </button>
                          </div>
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

                  {/* Right: Promotional Banner Configuration & Upload */}
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

                        <div className="form-check form-switch m-0 flex-shrink-0">
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
                          <div className="mb-4">
                            <label className="form-label fs-13 fw-semibold text-dark mb-2">
                              Banner Image (Upload File) <span className="text-danger">*</span>
                            </label>

                            <input
                              type="file"
                              ref={fileInputRef}
                              className="d-none"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={handleImageFileChange}
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
                                  onClick={() => setBanner((prev) => ({ ...prev, image: '' }))}
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>

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
                            </div>

                            <div className="col-6">
                              <label className="form-label fs-13 fw-semibold text-dark mb-1.5">Button Text</label>
                              <input
                                type="text"
                                className="form-control fs-13"
                                placeholder="Shop now"
                                value={banner.btnText}
                                onChange={(e) => setBanner((prev) => ({ ...prev, btnText: e.target.value }))}
                                style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1' }}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label fs-13 fw-semibold text-dark mb-1.5">Button URL</label>
                              <input
                                type="text"
                                className="form-control fs-13"
                                placeholder="/products"
                                value={banner.btnLink}
                                onChange={(e) => setBanner((prev) => ({ ...prev, btnLink: e.target.value }))}
                                style={{ height: '44px', borderRadius: '7px', borderColor: '#cbd5e1' }}
                              />
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
                            Toggle the switch above to display an image banner on the right side of the storefront mega-menu dropdown.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Actions Bar */}
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

      {/* ========================================================
          SLIDE-OVER DRAWER 1: CATEGORY SELECTOR (Right-to-Left)
         ======================================================== */}
      {showCategoryDrawer && (
        <ClientPortal>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(3px)',
              zIndex: 10400,
              transition: 'opacity 0.25s ease',
            }}
            onClick={() => setShowCategoryDrawer(false)}
          />

          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '660px',
              backgroundColor: '#ffffff',
              zIndex: 10500,
              boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'drawerSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Drawer Header */}
            <div className="p-4 border-bottom d-flex align-items-center justify-content-between" style={{ borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center gap-2.5">
                <span
                  className="rounded-3 d-flex align-items-center justify-content-center text-primary"
                  style={{ width: '42px', height: '42px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
                >
                  <iconify-icon icon="solar:folder-with-files-bold" class="fs-22"></iconify-icon>
                </span>
                <div>
                    <h4 className="fw-bold text-dark mb-0 fs-17">
                      {targetColumnForCategory ? 'Change Column Category' : 'Select Category for Column'}
                    </h4>
                  <p className="text-muted fs-12 mb-0">
                    Choose up to 3 different categories available for this menu destination. Changing a column category clears its selected products.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-icon border rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                onClick={() => setShowCategoryDrawer(false)}
                aria-label="Close"
              >
                <iconify-icon icon="solar:close-circle-linear" class="fs-20 text-muted"></iconify-icon>
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-bottom bg-light" style={{ borderColor: '#e2e8f0' }}>
              <div className="position-relative">
                <iconify-icon
                  icon="solar:magnifer-linear"
                  class="fs-18 position-absolute text-muted"
                  style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                ></iconify-icon>
                <input
                  type="text"
                  className="form-control fs-13 ps-5"
                  placeholder="Search categories by name..."
                  value={categorySearch}
                  onChange={(e) => {
                    setCategorySearch(e.target.value);
                    setCategoryPage(1);
                  }}
                  style={{ height: '42px', borderRadius: '8px', borderColor: '#cbd5e1' }}
                />
              </div>
            </div>

            {/* Table View */}
            <div className="flex-grow-1 overflow-auto p-3">
              {filteredCategories.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <iconify-icon icon="solar:folder-error-linear" class="fs-36 mb-2"></iconify-icon>
                  <p className="fs-13 mb-0">No categories found matching your search.</p>
                </div>
              ) : (
                <div className="table-responsive border rounded-3 overflow-hidden">
                  <table className="table table-hover align-middle mb-0 fs-13">
                    <thead style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <tr>
                        <th style={{ width: '40px', padding: '12px 14px' }}>#</th>
                        <th style={{ padding: '12px 14px' }}>Category</th>
                        <th style={{ padding: '12px 14px' }}>Target URL</th>
                        <th style={{ width: '100px', padding: '12px 14px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentCategories.map((cat, idx) => {
                        const rowNum = (categoryPage - 1) * catItemsPerPage + idx + 1;
                        const isUsedByAnotherColumn = columns.some((col) => col.id !== targetColumnForCategory && col.categoryId === cat.id);
                        return (
                          <tr key={cat.id}>
                            <td className="text-muted fw-semibold" style={{ padding: '12px 14px' }}>
                              {rowNum}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div className="d-flex align-items-center gap-2.5">
                                <img
                                  src={cat.image || '/assets/imgs/shop/p1.jpg'}
                                  alt={cat.name}
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    objectFit: 'contain',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    padding: '2px',
                                    backgroundColor: '#ffffff',
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/assets/imgs/shop/p1.jpg';
                                  }}
                                />
                                <div>
                                  <strong className="text-dark d-block fs-13">{cat.name}</strong>
                                  <span className="text-muted fs-11">
                                    {cat.subItems?.length || 0} sub-items configured
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span className="text-muted font-monospace fs-11">
                                {cat.link || `/products?category=${encodeURIComponent(cat.name)}`}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-dark btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 text-white"
                                style={{ borderRadius: '6px', fontSize: '12px' }}
                                onClick={() => handleSelectCategory(cat)}
                                disabled={isUsedByAnotherColumn}
                              >
                                <iconify-icon icon="solar:check-circle-bold" class="fs-14"></iconify-icon>
                                <span>{isUsedByAnotherColumn ? 'Already Used' : 'Select'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="p-3 border-top bg-light d-flex align-items-center justify-content-between" style={{ borderColor: '#e2e8f0' }}>
              <span className="text-muted fs-12">
                Showing {filteredCategories.length > 0 ? (categoryPage - 1) * catItemsPerPage + 1 : 0} to{' '}
                {Math.min(categoryPage * catItemsPerPage, filteredCategories.length)} of {filteredCategories.length} categories
              </span>

              {totalCatPages > 1 && (
                <div className="d-flex align-items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border px-2 py-1"
                    disabled={categoryPage === 1}
                    onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalCatPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`btn btn-sm ${categoryPage === i + 1 ? 'btn-dark text-white' : 'btn-light border'} px-2.5 py-1`}
                      style={{ minWidth: '32px' }}
                      onClick={() => setCategoryPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm btn-light border px-2 py-1"
                    disabled={categoryPage === totalCatPages}
                    onClick={() => setCategoryPage((p) => Math.min(totalCatPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </ClientPortal>
      )}

      {/* ========================================================
          SLIDE-OVER DRAWER 2: PRODUCT SELECTOR (Right-to-Left)
         ======================================================== */}
      {showProductDrawer && (
        <ClientPortal>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(3px)',
              zIndex: 10400,
              transition: 'opacity 0.25s ease',
            }}
            onClick={() => setShowProductDrawer(false)}
          />

          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '100%',
              maxWidth: '720px',
              backgroundColor: '#ffffff',
              zIndex: 10500,
              boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.18)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'drawerSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Drawer Header */}
            <div className="p-4 border-bottom d-flex align-items-center justify-content-between" style={{ borderColor: '#e2e8f0' }}>
              <div className="d-flex align-items-center gap-2.5">
                <span
                  className="rounded-3 d-flex align-items-center justify-content-center text-success"
                  style={{ width: '42px', height: '42px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}
                >
                  <iconify-icon icon="solar:box-minimalistic-bold" class="fs-22"></iconify-icon>
                </span>
                <div>
                  <h4 className="fw-bold text-dark mb-0 fs-17">
                    Select Product for &quot;{activeColumnForProduct?.title || 'Column'}&quot;
                  </h4>
                  <p className="text-muted fs-12 mb-0">
                    Showing products in this category that are available for this menu destination. Each category can contain up to 5 products.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-icon border rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
                onClick={() => setShowProductDrawer(false)}
                aria-label="Close"
              >
                <iconify-icon icon="solar:close-circle-linear" class="fs-20 text-muted"></iconify-icon>
              </button>
            </div>

            {/* Filter Bar */}
            <div className="p-3 border-bottom bg-light" style={{ borderColor: '#e2e8f0' }}>
              <div className="row g-2">
                <div className="col-md-7">
                  <div className="position-relative">
                    <iconify-icon
                      icon="solar:magnifer-linear"
                      class="fs-18 position-absolute text-muted"
                      style={{ left: '14px', top: '50%', transform: 'translateY(-50%)' }}
                    ></iconify-icon>
                    <input
                      type="text"
                      className="form-control fs-13 ps-5"
                      placeholder="Search by title, cert, keyword..."
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setProductPage(1);
                      }}
                      style={{ height: '40px', borderRadius: '8px', borderColor: '#cbd5e1' }}
                    />
                  </div>
                </div>

                <div className="col-md-5">
                  <div className="form-control d-flex align-items-center fs-13 fw-semibold bg-white" style={{ height: '40px', borderRadius: '8px', borderColor: '#cbd5e1' }}>
                    <iconify-icon icon="solar:folder-with-files-bold" class="fs-16 me-2 text-primary"></iconify-icon>
                    {selectedProductCategory?.name || activeColumnForProduct?.title || 'Selected category'}
                  </div>
                </div>
              </div>
            </div>

            {/* Table View */}
            <div className="flex-grow-1 overflow-auto p-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <iconify-icon icon="solar:box-linear" class="fs-36 mb-2"></iconify-icon>
                  <p className="fs-13 mb-0">No products found matching your filter.</p>
                </div>
              ) : (
                <div className="table-responsive border rounded-3 overflow-hidden">
                  <table className="table table-hover align-middle mb-0 fs-13">
                    <thead style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}>
                      <tr>
                        <th style={{ width: '40px', padding: '12px 14px' }}>#</th>
                        <th style={{ padding: '12px 14px' }}>Product</th>
                        <th style={{ padding: '12px 14px' }}>Category</th>
                        <th style={{ padding: '12px 14px' }}>Price</th>
                        <th style={{ width: '100px', padding: '12px 14px', textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.map((prod, idx) => {
                        const rowNum = (productPage - 1) * prodItemsPerPage + idx + 1;
                        const isAlreadySelected = selectedProductIds.has(prod.id);
                        return (
                          <tr key={prod.id}>
                            <td className="text-muted fw-semibold" style={{ padding: '12px 14px' }}>
                              {rowNum}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div className="d-flex align-items-center gap-2.5">
                                <img
                                  src={prod.image || '/assets/imgs/shop/p1.jpg'}
                                  alt={prod.title}
                                  style={{
                                    width: '42px',
                                    height: '42px',
                                    objectFit: 'contain',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    padding: '2px',
                                    backgroundColor: '#ffffff',
                                    flexShrink: 0,
                                  }}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/assets/imgs/shop/p1.jpg';
                                  }}
                                />
                                <div style={{ maxWidth: '240px' }}>
                                  <strong className="text-dark d-block fs-13 text-truncate" title={prod.title}>
                                    {prod.title}
                                  </strong>
                                  {prod.standard && (
                                    <span className="text-muted fs-11 text-truncate d-block">
                                      {prod.standard}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span className="badge bg-light text-dark border fs-11 fw-normal">
                                {prod.category}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span className="fw-bold text-success fs-13">{prod.price}</span>
                            </td>
                            <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                              <button
                                type="button"
                                className="btn btn-dark btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-1.5 text-white"
                                style={{ borderRadius: '6px', fontSize: '12px' }}
                                onClick={() => handleSelectProduct(prod)}
                                disabled={isAlreadySelected || (!targetItemForProduct && (activeColumnForProduct?.items.length || 0) >= 5)}
                              >
                                <iconify-icon icon="solar:check-circle-bold" class="fs-14"></iconify-icon>
                                <span>{isAlreadySelected ? 'Selected' : 'Select'}</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="p-3 border-top bg-light d-flex align-items-center justify-content-between" style={{ borderColor: '#e2e8f0' }}>
              <span className="text-muted fs-12">
                Showing {filteredProducts.length > 0 ? (productPage - 1) * prodItemsPerPage + 1 : 0} to{' '}
                {Math.min(productPage * prodItemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
              </span>

              {totalProdPages > 1 && (
                <div className="d-flex align-items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-sm btn-light border px-2 py-1"
                    disabled={productPage === 1}
                    onClick={() => setProductPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalProdPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`btn btn-sm ${productPage === i + 1 ? 'btn-dark text-white' : 'btn-light border'} px-2.5 py-1`}
                      style={{ minWidth: '32px' }}
                      onClick={() => setProductPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-sm btn-light border px-2 py-1"
                    disabled={productPage === totalProdPages}
                    onClick={() => setProductPage((p) => Math.min(totalProdPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </ClientPortal>
      )}

      {/* Delete Confirmation Modal for Column or Item */}
      {deleteConfirmTarget && (
        <ClientPortal>
          <div
            className="modal fade show d-block"
            style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 10600 }}
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
        </ClientPortal>
      )}
    </>
  );
}
