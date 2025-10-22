'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { GetReviewsResponseSchema } from '@/features/reviews/lib/dto';
import type { Review } from '@/types/review';

type ReviewsPage = {
  items: Review[];
  currentPage: number;
  hasNextPage: boolean;
};

const getReviews = async (
  placeId: string,
  page: number,
  limit = 10
): Promise<ReviewsPage> => {
  try {
    const { data } = await apiClient.get('/api/reviews', {
      params: { placeId, page, limit },
    });
    const parsed = GetReviewsResponseSchema.parse(data);
    return {
      items: parsed.items as Review[],
      currentPage: parsed.pagination.currentPage,
      hasNextPage: parsed.pagination.hasNextPage,
    };
  } catch (error) {
    const message = extractApiErrorMessage(error, '리뷰 목록을 불러올 수 없습니다.');
    throw new Error(message);
  }
};

/**
 * 리뷰 목록 무한 스크롤 훅
 *
 * @param placeId 장소 ID
 * @param limit 페이지당 리뷰 수 (기본값: 10)
 * @returns React Query 무한 스크롤 결과
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useReviewsList(placeId);
 * ```
 */
export const useReviewsList = (placeId: string, limit = 10) =>
  useInfiniteQuery({
    queryKey: ['reviews', placeId, limit],
    queryFn: ({ pageParam = 1 }) => getReviews(placeId, pageParam, limit),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.currentPage + 1 : undefined,
    enabled: Boolean(placeId),
    initialPageParam: 1,
    staleTime: 1 * 60 * 1000, // 1분
  });
