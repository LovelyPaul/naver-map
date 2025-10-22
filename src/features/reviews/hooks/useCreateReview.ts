'use client';

// useCreateReview Hook
// 리뷰 생성 mutation 훅

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createReview } from '../lib/api';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import type { CreateReviewInput } from '../backend/schema';

/**
 * 리뷰 생성 mutation 훅
 *
 * @returns React Query mutation 결과
 *
 * @example
 * ```tsx
 * const createReviewMutation = useCreateReview();
 *
 * const handleSubmit = async () => {
 *   try {
 *     await createReviewMutation.mutateAsync({
 *       placeId: '...',
 *       authorName: '홍길동',
 *       rating: 5,
 *       content: '정말 좋았어요!',
 *       password: '1234',
 *     });
 *     toast.success('리뷰가 등록되었습니다.');
 *   } catch (error) {
 *     toast.error(createReviewMutation.error?.message);
 *   }
 * };
 * ```
 */
export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewInput) => createReview(input),
    onSuccess: (data) => {
      // 해당 장소의 리뷰 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['reviews', data.placeId],
      });
      // 장소 상세 정보 캐시 무효화 (평점, 리뷰 수 업데이트)
      queryClient.invalidateQueries({
        queryKey: ['places', data.placeId],
      });
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error, '리뷰 등록에 실패했습니다.');
      return new Error(message);
    },
  });
};
