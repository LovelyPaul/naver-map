'use client';

// PlaceInfoSection Component
// 리뷰 작성 페이지 장소 정보 섹션

import Link from 'next/link';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCategory } from '@/lib/utils/category';
import { useReviewForm } from '../context';
import { usePlaceDetail } from '@/features/places/hooks/usePlaceDetail';
import { PlaceInfoHeader } from '@/features/places/components/PlaceInfoHeader';

/**
 * UUID 형식 체크 (DB에 있는 장소인지 확인)
 */
function isUUID(str: string): boolean {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

/**
 * 리뷰 작성 페이지 장소 정보 섹션 컴포넌트
 *
 * Context에서 placeId를 가져와 장소 정보를 조회하고 표시합니다.
 */
export function PlaceInfoSection() {
  const { state } = useReviewForm();

  // UUID가 아니면 (네이버 URL이면) DB 조회 스킵
  const isDbPlace = isUUID(state.placeId);
  const { data: place, isLoading } = usePlaceDetail(state.placeId, { enabled: isDbPlace });

  // DB에 없는 장소 (네이버 API에서만 검색된 장소)
  if (!isDbPlace) {
    return (
      <>
        {/* 장소 정보 헤더 */}
        <PlaceInfoHeader
          name={state.placeName || '새로운 장소'}
          categoryMain={state.placeCategoryMain || '기타'}
          categorySub={state.placeCategorySub}
          address={state.placeAddress || '주소 정보 없음'}
        />

        {/* 리뷰 작성 안내 */}
        <div className="bg-white border-b border-slate-200">
          <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* 뒤로 가기 버튼 */}
            <Link href={`/places/${encodeURIComponent(state.placeId)}`} className="inline-block mb-4">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                뒤로
              </Button>
            </Link>

            {/* 페이지 제목 */}
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
              리뷰 작성
            </h1>

            {/* 안내 메시지 */}
            <p className="text-sm text-slate-600">
              이 장소의 첫 번째 리뷰를 작성해주세요!
            </p>
          </div>
        </div>
      </>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center justify-center gap-2 text-slate-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p className="text-sm">장소 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 장소 정보가 없는 경우 (오류 상황)
  if (!place) {
    return (
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <Link href="/map" className="inline-block mb-4">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              뒤로
            </Button>
          </Link>
          <p className="text-sm text-slate-600">장소 정보를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 뒤로 가기 버튼 */}
        <Link href={`/places/${place.id}`} className="inline-block mb-4">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            뒤로
          </Button>
        </Link>

        {/* 페이지 제목 */}
        <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">
          리뷰 작성
        </h1>

        {/* 장소 정보 카드 */}
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          {/* 장소 이름 */}
          <h2 className="text-lg font-semibold text-slate-900">{place.name}</h2>

          {/* 카테고리 */}
          <div>
            <Badge variant="secondary" className="text-sm">
              {formatCategory(place.categoryMain, place.categorySub)}
            </Badge>
          </div>

          {/* 주소 */}
          <div className="flex items-start gap-2 text-slate-600">
            <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{place.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
