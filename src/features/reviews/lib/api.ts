// Reviews API Functions
// 리뷰 관련 API 호출 함수

import { apiClient } from '@/lib/remote/api-client';
import type { CreateReviewInput, DeleteReviewInput } from '../backend/schema';

/**
 * 리뷰 타입
 */
export type Review = {
  id: string;
  placeId: string;
  authorName: string;
  authorEmail: string | null;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * 리뷰 목록 조회 응답
 */
export type GetReviewsResponse = {
  items: Review[];
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
};

/**
 * 리뷰 생성 API
 */
export async function createReview(input: CreateReviewInput): Promise<Review> {
  const response = await apiClient.post<{ ok: true; data: Review }>(
    '/api/reviews',
    input
  );
  return response.data.data;
}

/**
 * 리뷰 삭제 API
 */
export async function deleteReview(
  reviewId: string,
  password: string
): Promise<void> {
  const input: DeleteReviewInput = { password };
  await apiClient.delete(`/api/reviews/${reviewId}`, { data: input });
}

/**
 * 리뷰 목록 조회 API
 */
export async function getReviews(
  placeId: string,
  page = 1,
  limit = 10
): Promise<GetReviewsResponse> {
  const response = await apiClient.get<{ ok: true; data: GetReviewsResponse }>(
    `/api/reviews`,
    {
      params: { placeId, page, limit },
    }
  );
  return response.data.data;
}
