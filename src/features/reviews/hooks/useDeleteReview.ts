'use client';

// useDeleteReview Hook
// 리뷰 삭제 mutation 훅

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteReview } from '../lib/api';
import { extractApiErrorMessage } from '@/lib/remote/api-client';

/**
 * 리뷰 삭제 입력
 */
type DeleteReviewParams = {
  reviewId: string;
  password: string;
  placeId: string; // 캐시 무효화를 위해 필요
};

/**
 * 리뷰 삭제 mutation 훅
 *
 * @returns React Query mutation 결과
 *
 * @example
 * ```tsx
 * const deleteReviewMutation = useDeleteReview();
 *
 * const handleDelete = async () => {
 *   if (!confirm('정말 삭제하시겠습니까?')) return;
 *
 *   try {
 *     await deleteReviewMutation.mutateAsync({
 *       reviewId: '...',
 *       password: '1234',
 *       placeId: '...',
 *     });
 *     toast.success('리뷰가 삭제되었습니다.');
 *   } catch (error) {
 *     toast.error(deleteReviewMutation.error?.message);
 *   }
 * };
 * ```
 */
export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, password }: DeleteReviewParams) =>
      deleteReview(reviewId, password),
    onSuccess: (_, variables) => {
      // 해당 장소의 리뷰 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['reviews', variables.placeId],
      });
      // 장소 상세 정보 캐시 무효화 (평점, 리뷰 수 업데이트)
      queryClient.invalidateQueries({
        queryKey: ['places', variables.placeId],
      });
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error, '리뷰 삭제에 실패했습니다.');
      return new Error(message);
    },
  });
};
