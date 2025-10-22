'use client';

// ReviewCard Component
// 리뷰 카드

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RatingStars } from './RatingStars';
import { formatRelativeTime } from '@/lib/utils/date';
import { cn } from '@/lib/utils';
import type { Review } from '@/types/review';

type ReviewCardProps = {
  review: Review;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  showActions?: boolean;
  className?: string;
};

/**
 * 리뷰 카드 컴포넌트
 *
 * @param review 리뷰 정보
 * @param onDelete 삭제 핸들러
 * @param showActions 액션 버튼 표시 여부
 * @param className 추가 CSS 클래스
 */
export function ReviewCard({
  review,
  onEdit,
  onDelete,
  showActions = false,
  className = '',
}: ReviewCardProps) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(review);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(review.id);
    }
  };

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardContent className="p-4">
        {/* 작성자 및 평점 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-gray-900">{review.authorName}</span>
              {review.authorEmail && (
                <span className="text-sm text-gray-500">({review.authorEmail})</span>
              )}
            </div>
            <RatingStars rating={review.rating} size="sm" />
          </div>

          {/* 작성 시간 */}
          <time className="text-sm text-gray-500" dateTime={review.createdAt}>
            {formatRelativeTime(review.createdAt)}
          </time>
        </div>

        {/* 리뷰 내용 */}
        <p className="text-gray-700 whitespace-pre-wrap break-words leading-relaxed mb-3">
          {review.content}
        </p>

        {/* 액션 버튼 */}
        {showActions && (
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              수정
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              삭제
            </Button>
          </div>
        )}

        {/* 수정 시간 (수정된 경우만 표시) */}
        {review.updatedAt && review.updatedAt !== review.createdAt && (
          <div className="text-xs text-gray-400 mt-2">
            수정됨: {formatRelativeTime(review.updatedAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 리뷰 목록 컴포넌트
 */
export function ReviewList({
  reviews,
  onEdit,
  onDelete,
  showActions = false,
  emptyMessage = '아직 리뷰가 없습니다.',
  className = '',
}: {
  reviews: Review[];
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
  showActions?: boolean;
  emptyMessage?: string;
  className?: string;
}) {
  if (reviews.length === 0) {
    return (
      <div className={cn('text-center py-12 text-gray-500', className)}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
