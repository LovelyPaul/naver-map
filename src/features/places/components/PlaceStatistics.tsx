'use client';

// PlaceStatistics Component
// 장소 통계 정보 (평균 평점, 리뷰 수)

import Link from 'next/link';
import { Star, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RatingStars } from '@/components/common/RatingStars';

/**
 * PlaceStatistics Props
 */
type PlaceStatisticsProps = {
  averageRating: number;
  totalReviews: number;
  placeId: string;
};

/**
 * 장소 통계 정보 컴포넌트
 *
 * @example
 * ```tsx
 * <PlaceStatistics
 *   averageRating={4.5}
 *   totalReviews={123}
 *   placeId="abc-123"
 * />
 * ```
 */
export function PlaceStatistics({
  averageRating,
  totalReviews,
  placeId,
}: PlaceStatisticsProps) {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* 평점 정보 */}
          <div className="flex items-center gap-6">
            {/* 평균 평점 */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                <span className="text-4xl font-bold text-slate-900">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <RatingStars rating={averageRating} size="md" />
            </div>

            {/* 리뷰 수 */}
            <div>
              <p className="text-sm text-slate-600">총 리뷰</p>
              <p className="text-2xl font-semibold text-slate-900">
                {totalReviews.toLocaleString()}개
              </p>
            </div>
          </div>

          {/* 리뷰 작성 버튼 */}
          <Link href={`/reviews/write?placeId=${placeId}`}>
            <Button className="gap-2">
              <Edit className="w-4 h-4" />
              리뷰 작성
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
