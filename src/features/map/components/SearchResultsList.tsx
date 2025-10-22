'use client';

// SearchResultsList Component
// 검색 결과 리스트

import { Loader2, MapPin } from 'lucide-react';
import { PlaceCard } from '@/components/common/PlaceCard';
import type { PlaceListItem } from '@/types/place';

/**
 * SearchResultsList Props
 */
type SearchResultsListProps = {
  /** 검색 결과 장소 리스트 */
  places: PlaceListItem[];
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 에러 메시지 */
  error?: string | null;
  /** 장소 클릭 핸들러 */
  onPlaceClick?: (place: PlaceListItem) => void;
  /** 추가 CSS 클래스명 */
  className?: string;
};

/**
 * 장소 검색 결과 리스트 컴포넌트
 *
 * @example
 * ```tsx
 * <SearchResultsList
 *   places={places}
 *   isLoading={isLoading}
 *   onPlaceClick={(place) => {
 *     // 지도 중심 이동
 *     map.setCenter(new naver.maps.LatLng(place.latitude, place.longitude));
 *   }}
 * />
 * ```
 */
export function SearchResultsList({
  places,
  isLoading = false,
  error = null,
  onPlaceClick,
  className = '',
}: SearchResultsListProps) {
  // 로딩 상태
  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
          <p className="text-sm text-slate-600">검색 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-sm text-slate-800 font-medium">검색 중 오류가 발생했습니다</p>
          <p className="text-xs text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  // 빈 결과
  if (places.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="flex flex-col items-center justify-center gap-3 py-8">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
            <MapPin className="w-6 h-6 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">검색 결과가 없습니다</p>
          <p className="text-xs text-slate-500">다른 검색어를 입력해보세요</p>
        </div>
      </div>
    );
  }

  // 검색 결과 리스트
  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800">
          검색 결과 <span className="text-slate-500">({places.length})</span>
        </h3>
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        <div className="p-2 space-y-2">
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onClick={onPlaceClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
