// Reviews Service

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppLogger } from '@/backend/hono/context';
import { hashPassword, comparePassword } from '@/backend/utils/password';
import type { Review, ReviewsPageResponse } from '@/types/review';
import type { CreateReviewInput, GetReviewsQuery } from './schema';

/**
 * 리뷰 목록 조회 (페이지네이션)
 */
export async function getReviews(
  query: GetReviewsQuery,
  supabase: SupabaseClient,
  logger: AppLogger
): Promise<ReviewsPageResponse> {
  const { placeId, page = 1, limit = 10 } = query;
  const offset = (page - 1) * limit;

  try {
    // 전체 개수 조회
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('place_id', placeId);

    const totalCount = count || 0;

    // 리뷰 목록 조회
    const { data, error } = await supabase
      .from('reviews')
      .select('id, place_id, author_name, author_email, rating, content, created_at, updated_at')
      .eq('place_id', placeId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error('Get reviews error:', error);
      throw error;
    }

    const items: Review[] = data.map((row) => ({
      id: row.id,
      placeId: row.place_id,
      authorName: row.author_name,
      authorEmail: row.author_email,
      rating: row.rating,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      items,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
      },
    };
  } catch (error) {
    logger.error('Get reviews error:', error);
    throw error;
  }
}

/**
 * 리뷰 생성
 */
export async function createReview(
  input: CreateReviewInput,
  supabase: SupabaseClient,
  logger: AppLogger
): Promise<Review> {
  try {
    // 비밀번호 해싱
    const passwordHash = await hashPassword(input.password);

    // 리뷰 생성
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        place_id: input.placeId,
        author_name: input.authorName,
        author_email: input.authorEmail || null,
        rating: input.rating,
        content: input.content,
        password_hash: passwordHash,
      })
      .select('id, place_id, author_name, author_email, rating, content, created_at, updated_at')
      .single();

    if (error) {
      logger.error('Create review error:', error);
      throw error;
    }

    return {
      id: data.id,
      placeId: data.place_id,
      authorName: data.author_name,
      authorEmail: data.author_email,
      rating: data.rating,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (error) {
    logger.error('Create review error:', error);
    throw error;
  }
}

/**
 * 리뷰 삭제 (비밀번호 검증)
 */
export async function deleteReview(
  reviewId: string,
  password: string,
  supabase: SupabaseClient,
  logger: AppLogger
): Promise<boolean> {
  try {
    // 리뷰 조회
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('password_hash')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      logger.warn(`Review not found: ${reviewId}`);
      return false;
    }

    // 비밀번호 검증
    const isValid = await comparePassword(password, review.password_hash);
    if (!isValid) {
      logger.warn(`Invalid password for review: ${reviewId}`);
      return false;
    }

    // 리뷰 삭제
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) {
      logger.error('Delete review error:', deleteError);
      throw deleteError;
    }

    return true;
  } catch (error) {
    logger.error('Delete review error:', error);
    throw error;
  }
}
