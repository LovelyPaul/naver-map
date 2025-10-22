'use client';

// ReviewList Component
// 리뷰 목록 (무한 스크롤)

import { useRef, useEffect, useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { ReviewCard } from '@/components/common/ReviewCard';
import { useReviewsList } from '@/features/reviews/hooks/useReviewsList';
import { useUpdateReview } from '@/features/reviews/hooks/useUpdateReview';
import { useDeleteReview } from '@/features/reviews/hooks/useDeleteReview';
import { EditReviewDialog } from './EditReviewDialog';
import { PasswordDialog } from './PasswordDialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import type { Review } from '@/types/review';

/**
 * ReviewList Props
 */
type ReviewListProps = {
  placeId: string;
};

/**
 * 리뷰 목록 컴포넌트 (무한 스크롤)
 *
 * @example
 * ```tsx
 * <ReviewList placeId="abc-123" />
 * ```
 */
export function ReviewList({ placeId }: ReviewListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useReviewsList(placeId, 10);

  const updateReviewMutation = useUpdateReview();
  const deleteReviewMutation = useDeleteReview();

  // 다이얼로그 상태
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  // 무한 스크롤을 위한 Intersection Observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // 핸들러 함수들
  const handleEdit = (review: Review) => {
    setEditingReview(review);
  };

  const handleEditSubmit = async (data: { rating: number; content: string; password: string }) => {
    if (!editingReview) return;

    try {
      await updateReviewMutation.mutateAsync({
        reviewId: editingReview.id,
        input: data,
      });

      toast({
        title: '리뷰 수정 완료',
        description: '리뷰가 성공적으로 수정되었습니다.',
      });
      setEditingReview(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '리뷰 수정에 실패했습니다.';
      toast({
        variant: 'destructive',
        title: '수정 실패',
        description: errorMessage,
      });
    }
  };

  const handleDelete = (reviewId: string) => {
    setDeletingReviewId(reviewId);
  };

  const handleDeleteConfirm = async (password: string) => {
    if (!deletingReviewId) return;

    try {
      await deleteReviewMutation.mutateAsync({
        reviewId: deletingReviewId,
        password,
        placeId,
      });

      toast({
        title: '리뷰 삭제 완료',
        description: '리뷰가 성공적으로 삭제되었습니다.',
      });
      setDeletingReviewId(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '리뷰 삭제에 실패했습니다.';
      toast({
        variant: 'destructive',
        title: '삭제 실패',
        description: errorMessage,
      });
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
            <p className="text-sm text-slate-600">리뷰를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex flex-col items-center justify-center gap-3">
            <MessageSquare className="w-12 h-12 text-red-500" />
            <p className="text-sm text-slate-800 font-medium">리뷰를 불러올 수 없습니다</p>
            <p className="text-xs text-slate-600">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // 모든 페이지의 리뷰를 하나의 배열로 합침
  const allReviews = data?.pages.flatMap((page) => page.items) ?? [];

  // 빈 결과
  if (allReviews.length === 0) {
    return (
      <div className="bg-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex flex-col items-center justify-center gap-3">
            <MessageSquare className="w-12 h-12 text-slate-300" />
            <p className="text-sm text-slate-600">아직 리뷰가 없습니다</p>
            <p className="text-xs text-slate-500">첫 번째 리뷰를 작성해보세요!</p>
          </div>
        </div>
      </div>
    );
  }

  // 리뷰 목록
  return (
    <div className="bg-white">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          리뷰 ({allReviews.length})
        </h2>

        <div className="space-y-4">
          {allReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onEdit={handleEdit}
              onDelete={handleDelete}
              showActions={true}
            />
          ))}
        </div>

        {/* 무한 스크롤 트리거 */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isFetchingNextPage ? (
              <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
            ) : (
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                className="gap-2"
              >
                더 보기
              </Button>
            )}
          </div>
        )}

        {/* 수정 다이얼로그 */}
        {editingReview && (
          <EditReviewDialog
            open={true}
            onClose={() => setEditingReview(null)}
            onSubmit={handleEditSubmit}
            review={editingReview}
            isLoading={updateReviewMutation.isPending}
          />
        )}

        {/* 삭제 확인 다이얼로그 */}
        {deletingReviewId && (
          <PasswordDialog
            open={true}
            onClose={() => setDeletingReviewId(null)}
            onSubmit={handleDeleteConfirm}
            title="리뷰 삭제"
            description="리뷰를 삭제하려면 작성 시 입력한 비밀번호를 입력해주세요."
            isLoading={deleteReviewMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
