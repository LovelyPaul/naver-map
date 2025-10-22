'use client';

// Main Map Page
// 메인 지도 페이지 - 장소 검색 및 지도 표시

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer } from '@/features/map/components/MapContainer';
import { SearchBar } from '@/features/map/components/SearchBar';
import { SearchResultsList } from '@/features/map/components/SearchResultsList';
import { CurrentLocationButton } from '@/features/map/components/CurrentLocationButton';
import { useSearchPlaces } from '@/features/places/hooks/useSearchPlaces';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import { useMap } from '@/features/map/components/MapContainer';
import type { PlaceListItem } from '@/types/place';
import type { MapMarker } from '@/types/map';

/**
 * 지도 내부 컴포넌트 (MapContext 사용을 위해 분리)
 */
function MapContent({ searchQuery }: { searchQuery: string }) {
  const router = useRouter();
  const { map } = useMap();
  const { data: places = [], isLoading, error } = useSearchPlaces(searchQuery, 20);

  // 검색 결과를 마커로 변환
  const markers: MapMarker[] = useMemo(() => {
    return places.map((place) => ({
      id: place.id,
      position: {
        lat: place.latitude,
        lng: place.longitude,
      },
      type: place.hasReviews ? ('review' as const) : ('search' as const),
      placeId: place.id,
      placeName: place.name,
      photoUrl: place.photoUrl,
    }));
  }, [places]);

  // 마커 클릭 핸들러 - 리뷰 유무에 따라 다르게 이동
  const handleMarkerClick = (marker: MapMarker) => {
    const encodedId = encodeURIComponent(marker.placeId);

    // 리뷰가 있으면 장소 상세 페이지로, 없으면 리뷰 작성 페이지로
    if (marker.type === 'review') {
      // 리뷰가 있는 경우: 장소 상세 페이지
      router.push(`/places/${encodedId}?name=${encodeURIComponent(marker.placeName)}`);
    } else {
      // 리뷰가 없는 경우: 리뷰 작성 페이지로 바로 이동
      const reviewWriteParams = new URLSearchParams({
        placeId: marker.placeId,
        placeName: marker.placeName,
      });
      router.push(`/reviews/write?${reviewWriteParams.toString()}`);
    }
  };

  // 장소 클릭 핸들러 (검색 결과 리스트) - 지도 중심 이동
  const handlePlaceClick = (place: PlaceListItem) => {
    if (map) {
      const newCenter = new window.naver.maps.LatLng(place.latitude, place.longitude);
      map.setCenter(newCenter);
      map.setZoom(16);
    }
  };

  // 마커 표시
  useMapMarkers({
    map,
    markers,
    onMarkerClick: handleMarkerClick,
  });

  return (
    <>
      {/* 검색 결과 리스트 (좌측 사이드바) */}
      {searchQuery && (
        <div className="absolute top-4 left-4 bottom-4 w-96 max-w-[90vw] md:max-w-md z-10">
          <SearchResultsList
            places={places}
            isLoading={isLoading}
            error={error?.message}
            onPlaceClick={handlePlaceClick}
          />
        </div>
      )}

      {/* 현재 위치 버튼 (우측 하단) */}
      <CurrentLocationButton className="absolute bottom-6 right-6 z-10" />
    </>
  );
}

/**
 * 메인 지도 페이지
 */
export default function MainMapPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // 기본 중심: 서울 시청
  const defaultCenter = {
    lat: 37.5665,
    lng: 126.9780,
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="relative w-full h-screen">
      {/* 지도 컨테이너 */}
      <MapContainer center={defaultCenter} zoom={15}>
        {/* 검색 바 (상단 중앙) */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-full max-w-md px-4 z-20">
          <SearchBar
            onSearch={handleSearch}
            placeholder="장소, 음식점, 카페 검색"
          />
        </div>

        {/* 지도 내부 컴포넌트 */}
        <MapContent searchQuery={searchQuery} />
      </MapContainer>
    </div>
  );
}
