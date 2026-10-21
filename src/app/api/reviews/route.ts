import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export interface ProductReview {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  userEmail?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  wouldRecommend?: boolean;
  location?: string;
  createdAt: string;
  updatedAt?: string;
  verifiedBuyer?: boolean;
  helpfulCount?: number;
  unhelpfulCount?: number;
  storeReply?: string;
}

export interface ReviewSummary {
  totalReviews: number;
  averageRating: string;
  ratingCounts: Record<1 | 2 | 3 | 4 | 5, number>;
  recommendPercent: number;
  recommendCount: number;
}

const REVIEWS_FILE = path.join(process.cwd(), 'src', 'data', 'reviews-store.json');
const PRODUCTS_FILE = path.join(process.cwd(), 'src', 'data', 'products-store.json');

function readReviews(): ProductReview[] {
  try {
    if (!fs.existsSync(REVIEWS_FILE)) {
      fs.writeFileSync(REVIEWS_FILE, '[]', 'utf-8');
      return [];
    }
    const data = fs.readFileSync(REVIEWS_FILE, 'utf-8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading reviews:', err);
    return [];
  }
}

function writeReviews(reviews: ProductReview[]) {
  try {
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing reviews:', err);
  }
}

function computeSummary(reviews: ProductReview[]): ReviewSummary {
  const total = reviews.length;
  const ratingCounts: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let recommendCount = 0;
  let sumRating = 0;

  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 5))) as 1 | 2 | 3 | 4 | 5;
    ratingCounts[star] = (ratingCounts[star] || 0) + 1;
    sumRating += Number(r.rating) || 0;
    if (r.wouldRecommend !== false) {
      recommendCount++;
    }
  }

  const averageRating = total > 0 ? (sumRating / total).toFixed(1) : '0.0';
  const recommendPercent = total > 0 ? Math.round((recommendCount / total) * 100) : 0;

  return {
    totalReviews: total,
    averageRating,
    ratingCounts,
    recommendPercent,
    recommendCount,
  };
}

function syncProductRating(productId: string, summary: ReviewSummary) {
  try {
    if (!fs.existsSync(PRODUCTS_FILE)) return;
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
    const products = JSON.parse(raw);
    if (!Array.isArray(products)) return;

    let modified = false;
    for (const p of products) {
      if (p.id === productId) {
        p.rating = summary.averageRating;
        p.reviews = String(summary.totalReviews);
        modified = true;
        break;
      }
    }

    if (modified) {
      fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error syncing product rating:', err);
  }
}

// GET /api/reviews?productId=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    const all = readReviews();
    const filtered = productId ? all.filter((r) => r.productId === productId) : all;
    // Sort newest first
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const summary = computeSummary(filtered);

    return NextResponse.json({
      success: true,
      reviews: filtered,
      summary,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST /api/reviews
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    const allReviews = readReviews();

    // Helpful / Unhelpful Vote Action
    if (action === 'vote') {
      const { reviewId, voteType, previousVote } = body;
      const review = allReviews.find((r) => r.id === reviewId);
      if (!review) {
        return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
      }

      // Handle vote toggling and switching
      if (previousVote === voteType) {
        // User clicked the active button again -> untoggle vote
        if (voteType === 'helpful') {
          review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1);
        } else if (voteType === 'unhelpful') {
          review.unhelpfulCount = Math.max(0, (review.unhelpfulCount || 0) - 1);
        }
      } else if (previousVote) {
        // User switched their vote from one to another
        if (voteType === 'helpful') {
          review.unhelpfulCount = Math.max(0, (review.unhelpfulCount || 0) - 1);
          review.helpfulCount = (review.helpfulCount || 0) + 1;
        } else if (voteType === 'unhelpful') {
          review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1);
          review.unhelpfulCount = (review.unhelpfulCount || 0) + 1;
        }
      } else {
        // Fresh vote
        if (voteType === 'helpful') {
          review.helpfulCount = (review.helpfulCount || 0) + 1;
        } else if (voteType === 'unhelpful') {
          review.unhelpfulCount = (review.unhelpfulCount || 0) + 1;
        }
      }

      writeReviews(allReviews);
      return NextResponse.json({ success: true, review });
    }

    // Submit New Review or Edit Existing Review
    const { reviewId, productId, rating, title, comment, wouldRecommend, userName, userEmail, userId, location } = body;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }
    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return NextResponse.json({ success: false, error: 'Valid rating between 1 and 5 is required' }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Review title is required' }, { status: 400 });
    }
    if (!comment || !comment.trim()) {
      return NextResponse.json({ success: false, error: 'Review comment is required' }, { status: 400 });
    }

    // Check if user already has an existing review for this product
    const existingReview = allReviews.find((r) => {
      if (reviewId && r.id === reviewId) return true;
      if (r.productId !== productId) return false;
      if (userId && r.userId && r.userId === userId) return true;
      if (userEmail && r.userEmail && r.userEmail.toLowerCase() === userEmail.toLowerCase()) return true;
      return false;
    });

    if (existingReview || action === 'edit') {
      // User already created a review for this product -> EDIT IN-PLACE
      const target = existingReview || allReviews.find((r) => r.id === reviewId);
      if (!target) {
        return NextResponse.json({ success: false, error: 'Review to edit not found' }, { status: 404 });
      }

      target.rating = Math.min(5, Math.max(1, Number(rating)));
      target.title = title.trim();
      target.comment = comment.trim();
      target.wouldRecommend = wouldRecommend !== false;
      if (location) target.location = location.trim();
      if (userName && userName.trim()) target.userName = userName.trim();
      target.updatedAt = new Date().toISOString();

      writeReviews(allReviews);

      const productReviews = allReviews.filter((r) => r.productId === productId);
      const summary = computeSummary(productReviews);
      syncProductRating(productId, summary);

      return NextResponse.json({
        success: true,
        review: target,
        summary,
        isEdit: true,
      });
    }

    // Create New Review (Only if user has no existing review for this product)
    const newReview: ProductReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      productId,
      userId: userId || undefined,
      userName: (userName && userName.trim()) || 'Verified Customer',
      userEmail: userEmail || undefined,
      rating: Math.min(5, Math.max(1, Number(rating))),
      title: title.trim(),
      comment: comment.trim(),
      wouldRecommend: wouldRecommend !== false,
      location: (location && location.trim()) || 'Saudi Arabia',
      createdAt: new Date().toISOString(),
      verifiedBuyer: true,
      helpfulCount: 0,
      unhelpfulCount: 0,
    };

    allReviews.unshift(newReview);
    writeReviews(allReviews);

    // Compute updated summary for this product and update products-store.json
    const productReviews = allReviews.filter((r) => r.productId === productId);
    const summary = computeSummary(productReviews);
    syncProductRating(productId, summary);

    return NextResponse.json({
      success: true,
      review: newReview,
      summary,
      isEdit: false,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
