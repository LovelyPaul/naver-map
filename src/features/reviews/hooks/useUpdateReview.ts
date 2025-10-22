'use client';

// useUpdateReview Hook
// 리뷰 수정 mutation 훅

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateReview } from '../lib/api';
import { extractApiErrorMessage } from '@/lib/remote/api-client';
import type { UpdateReviewInput } from '../backend/schema';

type UpdateReviewParams = {
  reviewId: string;
  input: UpdateReviewInput;
};

/**
 * 리뷰 수정 mutation 훅
 *
 * @returns React Query mutation 결과
 *
 * @example
 * ```tsx
 * const updateReviewMutation = useUpdateReview();
 *
 * const handleUpdate = async () => {
 *   try {
 *     await updateReviewMutation.mutateAsync({
 *       reviewId: '...',
 *       input: {
 *         rating: 4,
 *         content: '수정된 내용입니다',
 *         password: '1234',
 *       },
 *     });
 *     toast.success('리뷰가 수정되었습니다.');
 *   } catch (error) {
 *     toast.error(updateReviewMutation.error?.message);
 *   }
 * };
 * ```
 */
export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, input }: UpdateReviewParams) =>
      updateReview(reviewId, input),
    onSuccess: (data) => {
      // 해당 장소의 리뷰 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['reviews', data.placeId],
      });
      // 장소 상세 정보 캐시 무효화 (평점 업데이트)
      queryClient.invalidateQueries({
        queryKey: ['places', data.placeId],
      });
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error, '리뷰 수정에 실패했습니다.');
      return new Error(message);
    },
  });
};
