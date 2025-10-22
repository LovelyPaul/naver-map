'use client';

// Place Detail Page
// 장소 상세 페이지

import { use } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { PlaceInfoHeader } from '@/features/places/components/PlaceInfoHeader';
import { PlaceStatistics } from '@/features/places/components/PlaceStatistics';
import { RatingDistribution } from '@/features/places/components/RatingDistribution';
import { ReviewList } from '@/features/reviews/components/ReviewList';
import { usePlaceDetail } from '@/features/places/hooks/usePlaceDetail';

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
};

/**
 * 장소 상세 페이지
 */
export default function PlaceDetailPage({ params }: PlaceDetailPageProps) {
  const { placeId } = use(params);
  const { data: place, isLoading, error } = usePlaceDetail(placeId);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          <p className="text-sm text-slate-600">장소 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error || !place) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 p-6">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-sm text-slate-800 font-medium">
            장소 정보를 불러올 수 없습니다
          </p>
          <p className="text-xs text-slate-600">
            {error?.message || '알 수 없는 오류가 발생했습니다'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 장소 정보 헤더 */}
      <PlaceInfoHeader
        name={place.name}
        categoryMain={place.categoryMain}
        categorySub={place.categorySub}
        address={place.address}
      />

      {/* 통계 정보 */}
      <PlaceStatistics
        averageRating={place.statistics.averageRating}
        totalReviews={place.statistics.totalReviews}
        placeId={place.id}
      />

      {/* 별점 분포 */}
      <RatingDistribution
        distribution={place.statistics.ratingDistribution}
        totalReviews={place.statistics.totalReviews}
      />

      {/* 리뷰 목록 */}
      <ReviewList placeId={place.id} />
    </div>
  );
}
