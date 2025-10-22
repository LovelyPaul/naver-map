'use client';

// RatingDistribution Component
// 별점 분포 차트

import { Star } from 'lucide-react';

/**
 * RatingDistribution Props
 */
type RatingDistributionProps = {
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalReviews: number;
};

/**
 * 별점 분포 차트 컴포넌트
 *
 * @example
 * ```tsx
 * <RatingDistribution
 *   distribution={{ 1: 2, 2: 3, 3: 10, 4: 30, 5: 55 }}
 *   totalReviews={100}
 * />
 * ```
 */
export function RatingDistribution({
  distribution,
  totalReviews,
}: RatingDistributionProps) {
  // 별점별 퍼센티지 계산
  const getPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  // 5점부터 1점까지 역순으로 표시
  const ratings = [5, 4, 3, 2, 1] as const;

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">별점 분포</h2>

        <div className="space-y-2">
          {ratings.map((rating) => {
            const count = distribution[rating];
            const percentage = getPercentage(count);

            return (
              <div key={rating} className="flex items-center gap-3">
                {/* 별점 */}
                <div className="flex items-center gap-1 w-16">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-slate-700">{rating}</span>
                </div>

                {/* 진행 바 */}
                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                {/* 개수 및 퍼센티지 */}
                <div className="w-24 text-right text-sm text-slate-600">
                  {count}개 ({percentage.toFixed(0)}%)
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
