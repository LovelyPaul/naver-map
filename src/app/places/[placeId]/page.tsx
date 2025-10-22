'use client';

// Place Detail Page
// 장소 상세 페이지

import { use } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlaceInfoHeader } from '@/features/places/components/PlaceInfoHeader';
import { PlaceStatistics } from '@/features/places/components/PlaceStatistics';
import { RatingDistribution } from '@/features/places/components/RatingDistribution';
import { ReviewList } from '@/features/reviews/components/ReviewList';
import { usePlaceDetail } from '@/features/places/hooks/usePlaceDetail';

type PlaceDetailPageProps = {
  params: Promise<{ placeId: string }>;
  searchParams: Promise<{
    name?: string;
    address?: string;
    categoryMain?: string;
    categorySub?: string;
  }>;
};

/**
 * UUID 형식 체크 (DB에 있는 장소인지 확인)
 */
function isUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

/**
 * 장소 상세 페이지
 */
export default function PlaceDetailPage({ params, searchParams }: PlaceDetailPageProps) {
  const { placeId: encodedPlaceId } = use(params);
  const urlParams = use(searchParams);
  // URL 인코딩된 placeId를 디코딩
  const placeId = decodeURIComponent(encodedPlaceId);
  // 장소 정보 (URL 파라미터에서)
  const placeName = urlParams.name;
  const placeAddress = urlParams.address;
  const placeCategoryMain = urlParams.categoryMain;
  const placeCategorySub = urlParams.categorySub;

  // UUID가 아니면 (네이버 URL이면) DB 조회 스킵
  const isDbPlace = isUUID(placeId);
  const { data: place, isLoading, error } = usePlaceDetail(placeId, { enabled: isDbPlace });

  // DB에 없는 장소 (네이버 API에서만 검색된 장소)
  if (!isDbPlace) {
    // 리뷰 작성 URL 생성 (placeId + placeName 전달)
    const reviewWriteUrl = placeName
      ? `/reviews/write?placeId=${encodeURIComponent(placeId)}&placeName=${encodeURIComponent(placeName)}`
      : `/reviews/write?placeId=${encodeURIComponent(placeId)}`;

    return (
      <div className="min-h-screen bg-slate-50">
        {/* 장소 정보 헤더 */}
        <PlaceInfoHeader
          name={placeName || '장소'}
          categoryMain={placeCategoryMain || '기타'}
          categorySub={placeCategorySub}
          address={placeAddress || '주소 정보 없음'}
        />

        {/* 리뷰 없음 안내 */}
        <div className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  아직 리뷰가 없는 장소입니다
                </h2>
                <p className="text-slate-600 mb-4">
                  이 장소의 첫 번째 리뷰를 작성해주세요!
                </p>
                <Link href={reviewWriteUrl}>
                  <Button className="gap-2" size="lg">
                    <Edit className="w-5 h-5" />
                    첫 리뷰 작성하기
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        placeName={place.name}
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
