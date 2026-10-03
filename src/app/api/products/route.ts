import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ProductItem, CATEGORY_PRODUCTS_DATA } from '@/data/categoryProductsData';

const DATA_FILE_PATH = path.join(process.cwd(), 'src', 'data', 'products-store.json');

function readStoredProducts(): ProductItem[] {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const content = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error reading products store:', error);
  }
  return CATEGORY_PRODUCTS_DATA;
}

function writeStoredProducts(data: ProductItem[]): boolean {
  try {
    const dir = path.dirname(DATA_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing products store:', error);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter');
    const id = searchParams.get('id');

    const products = readStoredProducts();

    if (id) {
      const item = products.find((p) => p.id === id);
      if (!item) {
        return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: item });
    }

    let result = [...products];

    // Sort by createdAt desc by default so newly added items show first
    result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (filter === 'new-arrival') {
      result = result.filter((p) => p.isNewArrival !== false && p.isActive !== false);
    } else if (filter === 'most-searched') {
      result = result
        .filter((p) => p.isActive !== false)
        .sort((a, b) => ((b.clicks || 0) + (b.views || 0)) - ((a.clicks || 0) + (a.views || 0)));
    } else if (filter === 'special-offers') {
      result = result.filter((p) => (p.isSpecialOffer === true || Boolean(p.discount)) && p.isActive !== false);
    }

    return NextResponse.json({ success: true, data: result, total: result.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const products = readStoredProducts();

    // 1. Direct array replacement
    if (Array.isArray(body)) {
      const saved = writeStoredProducts(body);
      if (!saved) {
        return NextResponse.json({ success: false, message: 'Failed to write products' }, { status: 500 });
      }
      return NextResponse.json({ success: true, data: body });
    }

    const { action } = body;

    // 2. Track click / view
    if (action === 'click') {
      const { id } = body;
      const targetIndex = products.findIndex((p) => p.id === id);
      if (targetIndex !== -1) {
        products[targetIndex].clicks = (products[targetIndex].clicks || 0) + 1;
        products[targetIndex].views = (products[targetIndex].views || 0) + 1;
        writeStoredProducts(products);
      }
      return NextResponse.json({ success: true });
    }

    // 3. Create new product
    if (action === 'create') {
      const newProductData = body.product;
      if (!newProductData || !newProductData.title) {
        return NextResponse.json({ success: false, message: 'Title is required' }, { status: 400 });
      }

      const newId = newProductData.id || `prod-${Date.now()}`;
      const now = Date.now();

      // Determine pricing & offer calculation
      const originalPrice = Number(newProductData.originalPrice) || Number(newProductData.price?.toString().replace(/[^\d.]/g, '')) || 100;
      const isSpecialOffer = Boolean(newProductData.isSpecialOffer);
      const offerPercent = isSpecialOffer ? (Number(newProductData.offerPercent) || 0) : undefined;
      
      let currentPrice = originalPrice;
      let discountText: string | undefined = undefined;
      let oldPriceText: string | undefined = undefined;

      if (isSpecialOffer && offerPercent && offerPercent > 0) {
        currentPrice = Math.round(originalPrice * (1 - offerPercent / 100));
        discountText = `${offerPercent}% OFF`;
        oldPriceText = `${originalPrice} SR`;
      }

      const formattedPrice = `${currentPrice} SR`;

      const newProduct: ProductItem = {
        id: newId,
        title: newProductData.title.trim(),
        desc: newProductData.desc?.trim() || 'Certified industrial safety supply adhering to national and international safety regulations.',
        category: newProductData.category?.trim() || 'General Safety',
        categoryId: newProductData.categoryId,
        price: formattedPrice,
        oldPrice: oldPriceText,
        discount: discountText,
        rating: newProductData.rating || '5.0',
        reviews: newProductData.reviews || '10',
        image: newProductData.image || '/assets/imgs/shop/p1.jpg',
        badge: newProductData.badge || (isSpecialOffer ? 'Special Offer' : 'New Arrival'),
        badgeClass: isSpecialOffer ? 'sale' : 'new',
        location: newProductData.location || 'Riyadh Central Warehouse',
        standard: newProductData.standard || 'Certified Safety Standard',
        inStock: newProductData.inStock !== false,
        link: newProductData.link || '/product-details',
        originalPrice: originalPrice,
        currentPrice: currentPrice,
        isSpecialOffer: isSpecialOffer,
        offerPercent: offerPercent,
        // Crucial requirement: Newly added product is considered "New Arrival" and shows 1st!
        isNewArrival: true,
        createdAt: now,
        views: Number(newProductData.views) || 1,
        clicks: Number(newProductData.clicks) || 0,
        isActive: newProductData.isActive !== false,
        specifications: Array.isArray(newProductData.specifications) ? newProductData.specifications : [],
        sizes: Array.isArray(newProductData.sizes) ? newProductData.sizes : [],
        colors: Array.isArray(newProductData.colors) ? newProductData.colors : [],
      };

      // Prepend to array so it always shows 1st!
      const updated = [newProduct, ...products];
      writeStoredProducts(updated);

      return NextResponse.json({ success: true, data: newProduct });
    }

    // 4. Update existing product
    if (action === 'update') {
      const updateData = body.product;
      if (!updateData || !updateData.id) {
        return NextResponse.json({ success: false, message: 'Product ID is required for update' }, { status: 400 });
      }

      const targetIndex = products.findIndex((p) => p.id === updateData.id);
      if (targetIndex === -1) {
        return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
      }

      const existing = products[targetIndex];

      const originalPrice = Number(updateData.originalPrice) || Number(updateData.price?.toString().replace(/[^\d.]/g, '')) || existing.originalPrice || 100;
      const isSpecialOffer = Boolean(updateData.isSpecialOffer);
      const offerPercent = isSpecialOffer ? (Number(updateData.offerPercent) || 0) : undefined;
      
      let currentPrice = originalPrice;
      let discountText: string | undefined = undefined;
      let oldPriceText: string | undefined = undefined;

      if (isSpecialOffer && offerPercent && offerPercent > 0) {
        currentPrice = Math.round(originalPrice * (1 - offerPercent / 100));
        discountText = `${offerPercent}% OFF`;
        oldPriceText = `${originalPrice} SR`;
      }

      const formattedPrice = `${currentPrice} SR`;

      const updatedProduct: ProductItem = {
        ...existing,
        ...updateData,
        title: updateData.title !== undefined ? updateData.title.trim() : existing.title,
        desc: updateData.desc !== undefined ? updateData.desc?.trim() : existing.desc,
        category: updateData.category !== undefined ? updateData.category?.trim() : existing.category,
        categoryId: updateData.categoryId !== undefined ? updateData.categoryId : existing.categoryId,
        price: (updateData.price || updateData.originalPrice) ? formattedPrice : existing.price,
        oldPrice: updateData.isSpecialOffer !== undefined ? (isSpecialOffer ? oldPriceText : undefined) : existing.oldPrice,
        discount: updateData.isSpecialOffer !== undefined ? (isSpecialOffer ? discountText : undefined) : existing.discount,
        originalPrice: updateData.originalPrice !== undefined ? originalPrice : existing.originalPrice,
        currentPrice: (updateData.price || updateData.originalPrice || updateData.offerPercent !== undefined) ? currentPrice : existing.currentPrice,
        isSpecialOffer: updateData.isSpecialOffer !== undefined ? isSpecialOffer : existing.isSpecialOffer,
        offerPercent: updateData.offerPercent !== undefined ? offerPercent : existing.offerPercent,
        isNewArrival: updateData.isNewArrival !== undefined ? Boolean(updateData.isNewArrival) : existing.isNewArrival,
        isActive: updateData.isActive !== undefined ? Boolean(updateData.isActive) : existing.isActive,
        specifications: Array.isArray(updateData.specifications) ? updateData.specifications : (existing.specifications || []),
        sizes: Array.isArray(updateData.sizes) ? updateData.sizes : (existing.sizes || []),
        colors: Array.isArray(updateData.colors) ? updateData.colors : (existing.colors || []),
      };

      products[targetIndex] = updatedProduct;
      writeStoredProducts(products);

      return NextResponse.json({ success: true, data: updatedProduct });
    }

    // 5. Delete product
    if (action === 'delete') {
      const { id } = body;
      const filtered = products.filter((p) => p.id !== id);
      if (filtered.length === products.length) {
        return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
      }
      writeStoredProducts(filtered);
      return NextResponse.json({ success: true, message: 'Product deleted' });
    }

    // 6. Toggle Status
    if (action === 'toggle_status') {
      const { id } = body;
      const targetIndex = products.findIndex((p) => p.id === id);
      if (targetIndex === -1) {
        return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 });
      }
      products[targetIndex].isActive = !products[targetIndex].isActive;
      writeStoredProducts(products);
      return NextResponse.json({ success: true, data: products[targetIndex] });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
