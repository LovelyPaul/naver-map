// Reviews Service

import type { SupabaseClient } from '@supabase/supabase-js';
import type { AppLogger } from '@/backend/hono/context';
import { hashPassword, comparePassword } from '@/backend/utils/password';
import type { Review, ReviewsPageResponse } from '@/types/review';
import type { CreateReviewInput, UpdateReviewInput, GetReviewsQuery } from './schema';

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
 * UUID 형식 체크
 */
function isUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
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
    // placeId가 UUID가 아니면 (네이버 URL이면) 장소를 먼저 생성
    if (!isUUID(input.placeId)) {
      logger.info(`Creating new place with naverPlaceId: ${input.placeId}`);

      // 이미 존재하는지 확인
      const { data: existingPlace } = await supabase
        .from('places')
        .select('id')
        .eq('naver_place_id', input.placeId)
        .single();

      if (!existingPlace) {
        // 새 장소 생성 (최소한의 정보만)
        const { data: newPlace, error: placeError } = await supabase
          .from('places')
          .insert({
            naver_place_id: input.placeId,
            name: '새로운 장소',
            category_main: '기타',
            category_sub: null,
            address: '주소 정보 없음',
            latitude: 0,
            longitude: 0,
          })
          .select('id')
          .single();

        if (placeError) {
          logger.error('Create place error:', placeError);
          throw placeError;
        }

        // 새로 생성된 장소의 UUID를 사용
        input.placeId = newPlace.id;
      } else {
        // 기존 장소의 UUID를 사용
        input.placeId = existingPlace.id;
      }
    }

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
 * 리뷰 수정 (비밀번호 검증)
 */
export async function updateReview(
  reviewId: string,
  input: UpdateReviewInput,
  supabase: SupabaseClient,
  logger: AppLogger
): Promise<Review | null> {
  try {
    // 리뷰 조회
    const { data: review, error: fetchError } = await supabase
      .from('reviews')
      .select('password_hash')
      .eq('id', reviewId)
      .single();

    if (fetchError || !review) {
      logger.warn(`Review not found: ${reviewId}`);
      return null;
    }

    // 비밀번호 검증
    const isValid = await comparePassword(input.password, review.password_hash);
    if (!isValid) {
      logger.warn(`Invalid password for review: ${reviewId}`);
      return null;
    }

    // 리뷰 수정 (rating, content만 수정 가능)
    const updateData: Record<string, unknown> = {};
    if (input.rating !== undefined) updateData.rating = input.rating;
    if (input.content !== undefined) updateData.content = input.content;

    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select('id, place_id, author_name, author_email, rating, content, created_at, updated_at')
      .single();

    if (updateError) {
      logger.error('Update review error:', updateError);
      throw updateError;
    }

    return {
      id: updatedReview.id,
      placeId: updatedReview.place_id,
      authorName: updatedReview.author_name,
      authorEmail: updatedReview.author_email,
      rating: updatedReview.rating,
      content: updatedReview.content,
      createdAt: updatedReview.created_at,
      updatedAt: updatedReview.updated_at,
    };
  } catch (error) {
    logger.error('Update review error:', error);
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
