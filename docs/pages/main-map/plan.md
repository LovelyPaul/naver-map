# 메인 지도 페이지 구현 계획서

## 문서 정보
- **페이지명**: 메인 지도 페이지 (Main Map Page)
- **경로**: `/`
- **작성일**: 2025-10-22
- **버전**: 1.0

---

## 1. 개요

### 1.1 페이지 목적
ConnectMap의 진입점이자 핵심 페이지로, 네이버 지도를 기반으로 장소 검색, 리뷰 조회, 마커 인터랙션 기능을 제공합니다. 사용자는 검색을 통해 맛집을 찾고, 지도와 리스트를 통해 결과를 확인하며, 장소 선택 시 상세 페이지로 이동할 수 있습니다.

### 1.2 주요 기능
- 네이버 지도 SDK 로드 및 초기화
- GPS 기반 현재 위치 중심으로 지도 표시
- 장소/맛집 검색 (네이버 Places API 연동)
- 검색 결과 지도 마커 표시 (리뷰 유무에 따라 다른 스타일)
- 검색 결과 리스트 표시 (카드 형식)
- 마커 클릭 시 툴팁 표시 및 리스트 스크롤
- 리스트 항목 클릭 시 지도 중심 이동 및 마커 강조
- 선택된 장소 클릭 시 장소 상세 페이지로 이동
- 현재 위치 버튼 (GPS 권한 재요청)
- 검색 초기화 기능

### 1.3 관련 UseCase
- **UC-01**: 메인 지도 화면 진입 (`docs/usecases/1-main-map-entry/spec.md`)
- **UC-02**: 장소/맛집 검색 (`docs/usecases/2-place-search/spec.md`)
- **UC-03**: 검색 결과에서 장소 선택 (`docs/usecases/3-search-result-selection/spec.md`)
- **UC-08**: 마커 업데이트 (`docs/usecases/8-marker-update/spec.md`)
- **UC-09**: 마커 툴팁 인터랙션 (`docs/usecases/9-marker-tooltip/spec.md`)
- **UC-12**: 검색 초기화 (`docs/usecases/12-search-reset/spec.md`)
- **UC-15**: 카테고리 표시 (`docs/usecases/15-category-display/spec.md`)

### 1.4 관련 문서
- **공통 모듈**: `docs/common-modules.md`
- **데이터베이스 스키마**: `docs/database.md`
- **외부 연동**: `docs/external/위치기반 맛집 리뷰 플랫폼.md` (네이버 API)

---

## 2. 의존성 분석

### 2.1 공통 모듈 의존성 (Phase 1-4 완료 필요)

#### 필수 타입 (Phase 1)
```typescript
// src/types/place.ts
import { Place, PlaceListItem, NaverPlaceSearchResult } from '@/types/place';

// src/types/map.ts
import { Coordinate, MarkerType, MapMarker, MapViewport } from '@/types/map';
```

#### 필수 네이버 지도 SDK (Phase 3)
```typescript
// src/lib/naver-map/types.ts
import type { NaverMaps, MapOptions, MarkerOptions } from '@/lib/naver-map/types';

// src/lib/naver-map/loader.ts
import { loadNaverMapSDK, isNaverMapSDKLoaded } from '@/lib/naver-map/loader';

// src/hooks/useNaverMap.ts
import { useNaverMap } from '@/hooks/useNaverMap';

// src/hooks/useMapMarkers.ts
import { useMapMarkers } from '@/hooks/useMapMarkers';

// src/hooks/useGeolocation.ts
import { useGeolocation } from '@/hooks/useGeolocation';
```

#### 필수 UI 컴포넌트 (Phase 4)
```typescript
// src/components/common/place-card.tsx
import { PlaceCard } from '@/components/common/place-card';

// src/components/common/category-badge.tsx
import { CategoryBadge } from '@/components/common/category-badge';

// src/components/common/rating-stars.tsx
import { RatingStars } from '@/components/common/rating-stars';
```

#### 필수 유틸리티 (Phase 2)
```typescript
// src/lib/utils/coordinate.ts
import { parseNaverCoordinate } from '@/lib/utils/coordinate';

// src/lib/utils/category.ts
import { parseCategory } from '@/lib/utils/category';
```

#### React Query 설정 (Phase 1)
```typescript
// src/lib/query-keys.ts
import { queryKeys } from '@/lib/query-keys';
```

### 2.2 외부 라이브러리
- `next` (14+): App Router
- `react` (19): 컴포넌트, Hooks
- `@tanstack/react-query`: 서버 상태 관리
- `zustand`: 글로벌 상태 관리 (선택적, 검색 상태 등)
- `lucide-react`: 아이콘 (검색, 현재 위치, 닫기 등)
- `shadcn-ui` 컴포넌트: `Input`, `Button`, `Card`, `Skeleton`
- `react-window` 또는 `react-virtualized`: 긴 리스트 가상화 (선택적)

### 2.3 백엔드 API 의존성
```typescript
// src/features/place/backend/route.ts
// POST /api/places/search - 장소 검색 (네이버 API 프록시 + DB 조회)

// src/backend/external/naver-api.ts
// searchPlaces(query: string) - 네이버 Places API 호출
```

### 2.4 환경 변수
```bash
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_client_id
NAVER_MAP_CLIENT_SECRET=your_client_secret (백엔드 전용)
```

---

## 3. 구현 단계 (Implementation Phases)

### Phase 1: 백엔드 API 구현 (선행 작업)
**목표**: 장소 검색 API 구현 (네이버 API 프록시 + 리뷰 여부 조회)

#### 1.1 장소 검색 API
**파일**: `src/features/place/backend/route.ts`, `service.ts`, `schema.ts`

**구현 내용**:
1. **스키마 정의** (`schema.ts`):
   ```typescript
   // src/features/place/backend/schema.ts
   import { z } from 'zod';

   export const SearchPlacesRequestSchema = z.object({
     query: z.string().min(2).max(100),
     limit: z.coerce.number().int().min(1).max(50).optional().default(20),
   });

   export const SearchPlacesResponseSchema = z.object({
     items: z.array(z.object({
       id: z.string(), // 네이버 place ID
       name: z.string(),
       address: z.string(),
       category: z.string(),
       latitude: z.number(),
       longitude: z.number(),
       photoUrl: z.string().nullable().optional(),
       hasReviews: z.boolean(),
       reviewCount: z.number().optional(),
       avgRating: z.number().optional(),
     })),
     totalCount: z.number(),
   });
   ```

2. **서비스 로직** (`service.ts`):
   ```typescript
   // src/features/place/backend/service.ts
   import { searchPlaces as searchNaverPlaces } from '@/backend/external/naver-api';
   import { parseCategory } from '@/lib/utils/category';
   import { parseNaverCoordinate } from '@/lib/utils/coordinate';
   import type { SupabaseClient } from '@supabase/supabase-js';

   export async function searchPlacesWithReviews(
     supabase: SupabaseClient,
     query: string,
     limit: number = 20
   ) {
     // 1. 네이버 API 호출
     const naverResults = await searchNaverPlaces(query);

     if (naverResults.length === 0) {
       return success({ items: [], totalCount: 0 });
     }

     // 2. 네이버 place ID 목록 추출
     const naverPlaceIds = naverResults.map((r) => r.id);

     // 3. Supabase에서 리뷰 존재 여부 조회
     const { data: places, error } = await supabase
       .from('places')
       .select(`
         naver_place_id,
         id,
         reviews:reviews(count)
       `)
       .in('naver_place_id', naverPlaceIds);

     if (error) {
       return failure('INTERNAL_ERROR', error.message);
     }

     // 4. 리뷰 정보 매핑
     const reviewMap = new Map();
     places?.forEach((place) => {
       reviewMap.set(place.naver_place_id, {
         hasReviews: place.reviews.length > 0,
         reviewCount: place.reviews.length,
       });
     });

     // 5. 결과 병합 및 정규화
     const items = naverResults.slice(0, limit).map((result) => {
       const reviewInfo = reviewMap.get(result.id) || {
         hasReviews: false,
         reviewCount: 0,
       };

       const { main, sub } = parseCategory(result.category);
       const { lat, lng } = parseNaverCoordinate(result.x, result.y);

       return {
         id: result.id,
         name: result.name,
         address: result.address,
         category: result.category,
         categoryMain: main,
         categorySub: sub,
         latitude: lat,
         longitude: lng,
         photoUrl: null, // 네이버 API에서 제공하지 않을 수 있음
         hasReviews: reviewInfo.hasReviews,
         reviewCount: reviewInfo.reviewCount,
       };
     });

     return success({
       items,
       totalCount: naverResults.length,
     });
   }
   ```

3. **Hono 라우터** (`route.ts`):
   ```typescript
   // src/features/place/backend/route.ts (추가)
   import { zValidator } from '@hono/zod-validator';
   import { SearchPlacesRequestSchema } from './schema';
   import { searchPlacesWithReviews } from './service';

   app.post('/api/places/search', zValidator('json', SearchPlacesRequestSchema), async (c) => {
     const { query, limit } = c.req.valid('json');
     const supabase = c.get('supabase');
     const logger = c.get('logger');

     logger.info('Searching places', { query, limit });

     const result = await searchPlacesWithReviews(supabase, query, limit);
     return respond(c, result);
   });
   ```

**코드베이스 충돌 체크**: ✅ place feature 확장이므로 충돌 없음

---

### Phase 2: 프론트엔드 기본 구조
**목표**: 페이지 라우팅 및 레이아웃 구성

#### 2.1 페이지 파일 생성
**파일**: `src/app/page.tsx`

**구현 내용**:
```typescript
// src/app/page.tsx
'use client';

import { MainMapPage } from '@/features/map/components/main-map-page';

export default function HomePage() {
  return <MainMapPage />;
}
```

#### 2.2 Feature 디렉토리 구조 생성
```
src/features/map/
├── components/
│   ├── main-map-page.tsx               # 메인 페이지 컴포넌트
│   ├── map-container.tsx               # 지도 컨테이너
│   ├── search-bar.tsx                  # 검색창
│   ├── search-results-list.tsx         # 검색 결과 리스트
│   ├── result-item.tsx                 # 결과 카드 항목
│   ├── map-marker.tsx                  # 커스텀 마커 컴포넌트
│   ├── marker-tooltip.tsx              # 마커 툴팁
│   └── current-location-button.tsx     # 현재 위치 버튼
├── hooks/
│   ├── use-place-search.ts             # 장소 검색 훅
│   ├── use-map-state.ts                # 지도 상태 관리 훅
│   └── use-selected-place.ts           # 선택된 장소 상태 훅
├── stores/
│   └── map-store.ts                    # Zustand 스토어 (선택적)
└── lib/
    └── marker-utils.ts                 # 마커 유틸리티 함수
```

**코드베이스 충돌 체크**: ✅ 신규 feature이므로 충돌 없음

---

### Phase 3: 네이버 지도 초기화
**목표**: 지도 SDK 로드 및 지도 인스턴스 생성

#### 3.1 지도 컨테이너 컴포넌트
**파일**: `src/features/map/components/map-container.tsx`

```typescript
// src/features/map/components/map-container.tsx
'use client';

import { useRef, useEffect } from 'react';
import { useNaverMap } from '@/hooks/useNaverMap';
import { useGeolocation } from '@/hooks/useGeolocation';
import type { Coordinate } from '@/types/map';

const DEFAULT_CENTER: Coordinate = {
  lat: 37.5665, // 서울시청
  lng: 126.9780,
};

const DEFAULT_ZOOM = 15;

type MapContainerProps = {
  onMapLoad?: (map: naver.maps.Map) => void;
};

export function MapContainer({ onMapLoad }: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { position: userPosition, isLoading: isLoadingPosition } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
  });

  const center = userPosition || DEFAULT_CENTER;

  const { map, isLoading: isLoadingMap, error } = useNaverMap(
    mapContainerRef,
    {
      center,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      zoomControlOptions: {
        position: naver.maps.Position.RIGHT_CENTER,
      },
    }
  );

  useEffect(() => {
    if (map && onMapLoad) {
      onMapLoad(map);
    }
  }, [map, onMapLoad]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-red-500 mb-4">지도를 불러올 수 없습니다.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />
      {(isLoadingMap || isLoadingPosition) && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-gray-600">지도를 불러오는 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 3.2 현재 위치 버튼
**파일**: `src/features/map/components/current-location-button.tsx`

```typescript
// src/features/map/components/current-location-button.tsx
'use client';

import { Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGeolocation } from '@/hooks/useGeolocation';

type CurrentLocationButtonProps = {
  map: naver.maps.Map | null;
};

export function CurrentLocationButton({ map }: CurrentLocationButtonProps) {
  const { position, isLoading, error, permission } = useGeolocation();

  const handleClick = () => {
    if (!map) return;

    if (permission === 'denied') {
      alert('위치 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.');
      return;
    }

    if (position) {
      map.setCenter(new naver.maps.LatLng(position.lat, position.lng));
      map.setZoom(16);
    } else {
      // 권한 재요청
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const center = new naver.maps.LatLng(
            pos.coords.latitude,
            pos.coords.longitude
          );
          map.setCenter(center);
          map.setZoom(16);
        },
        (err) => {
          console.error('Geolocation error:', err);
          alert('현재 위치를 가져올 수 없습니다.');
        }
      );
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      disabled={isLoading}
      className="absolute right-4 bottom-24 bg-white shadow-lg"
      title="현재 위치로 이동"
    >
      <Navigation className="h-5 w-5" />
    </Button>
  );
}
```

**코드베이스 충돌 체크**: ✅ 신규 컴포넌트이므로 충돌 없음

---

### Phase 4: 검색 기능 구현
**목표**: 검색창 UI 및 검색 로직 구현

#### 4.1 장소 검색 훅
**파일**: `src/features/map/hooks/use-place-search.ts`

```typescript
// src/features/map/hooks/use-place-search.ts
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { PlaceListItem } from '@/types/place';

type SearchPlacesResponse = {
  items: PlaceListItem[];
  totalCount: number;
};

export function usePlaceSearch() {
  return useMutation<SearchPlacesResponse, Error, { query: string; limit?: number }>({
    mutationFn: async ({ query, limit = 20 }) => {
      const response = await apiClient.post('/api/places/search', {
        query,
        limit,
      });

      if (!response.ok) {
        throw new Error('검색에 실패했습니다.');
      }

      const result = await response.json();
      return result.data;
    },
  });
}
```

#### 4.2 검색창 컴포넌트
**파일**: `src/features/map/components/search-bar.tsx`

```typescript
// src/features/map/components/search-bar.tsx
'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type SearchBarProps = {
  onSearch: (query: string) => void;
  onClear: () => void;
  isLoading?: boolean;
};

export function SearchBar({ onSearch, onClear, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute top-4 left-4 right-4 z-10 flex gap-2"
    >
      <div className="flex-1 relative">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="장소나 맛집을 검색하세요"
          className="pr-10 bg-white shadow-lg"
          disabled={isLoading}
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1 h-7 w-7"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button
        type="submit"
        disabled={query.trim().length < 2 || isLoading}
        className="shadow-lg"
      >
        <Search className="h-4 w-4 mr-2" />
        검색
      </Button>
    </form>
  );
}
```

**코드베이스 충돌 체크**: ✅ 신규 컴포넌트이므로 충돌 없음

---

### Phase 5: 검색 결과 표시
**목표**: 검색 결과 리스트 및 지도 마커 렌더링

#### 5.1 검색 결과 리스트
**파일**: `src/features/map/components/search-results-list.tsx`

```typescript
// src/features/map/components/search-results-list.tsx
'use client';

import { useEffect, useRef } from 'react';
import { PlaceCard } from '@/components/common/place-card';
import type { PlaceListItem } from '@/types/place';

type SearchResultsListProps = {
  results: PlaceListItem[];
  selectedPlaceId: string | null;
  onPlaceSelect: (place: PlaceListItem) => void;
  onReviewClick: (placeId: string) => void;
};

export function SearchResultsList({
  results,
  selectedPlaceId,
  onPlaceSelect,
  onReviewClick,
}: SearchResultsListProps) {
  const listRef = useRef<HTMLDivElement>(null);

  // 선택된 장소로 스크롤
  useEffect(() => {
    if (selectedPlaceId && listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-place-id="${selectedPlaceId}"]`
      );
      selectedElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedPlaceId]);

  if (results.length === 0) {
    return null;
  }

  return (
    <div
      ref={listRef}
      className="absolute bottom-0 left-0 right-0 max-h-[50%] bg-white shadow-2xl rounded-t-2xl overflow-y-auto z-20"
    >
      <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          검색 결과 ({results.length})
        </h2>
      </div>
      <div className="p-4 space-y-3">
        {results.map((place) => (
          <div key={place.id} data-place-id={place.id}>
            <PlaceCard
              place={place}
              onClick={() => onPlaceSelect(place)}
              onReviewClick={onReviewClick}
              isSelected={selectedPlaceId === place.id}
              showReviewButton
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 5.2 마커 관리 훅
**파일**: `src/features/map/hooks/use-map-state.ts`

```typescript
// src/features/map/hooks/use-map-state.ts
import { useState, useCallback, useEffect } from 'react';
import { useMapMarkers } from '@/hooks/useMapMarkers';
import type { PlaceListItem } from '@/types/place';
import type { MapMarker } from '@/types/map';

export function useMapState(map: naver.maps.Map | null) {
  const [searchResults, setSearchResults] = useState<PlaceListItem[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceListItem | null>(null);

  // 검색 결과를 마커 데이터로 변환
  const markers: MapMarker[] = searchResults.map((place) => ({
    id: place.id,
    position: { lat: place.latitude, lng: place.longitude },
    type: place.hasReviews ? 'review' : 'search',
    placeId: place.id,
    placeName: place.name,
  }));

  // 선택된 장소가 있으면 selected 마커 추가
  const allMarkers = selectedPlace
    ? markers.map((m) => ({
        ...m,
        type: m.id === selectedPlace.id ? ('selected' as const) : m.type,
      }))
    : markers;

  const { markerInstances } = useMapMarkers(map, allMarkers);

  // 선택된 장소로 지도 중심 이동
  useEffect(() => {
    if (map && selectedPlace) {
      map.panTo(
        new naver.maps.LatLng(selectedPlace.latitude, selectedPlace.longitude)
      );
    }
  }, [map, selectedPlace]);

  // 검색 결과를 포함하도록 뷰포트 조정
  const fitBounds = useCallback(() => {
    if (!map || searchResults.length === 0) return;

    const bounds = new naver.maps.LatLngBounds();
    searchResults.forEach((place) => {
      bounds.extend(new naver.maps.LatLng(place.latitude, place.longitude));
    });

    map.fitBounds(bounds, { padding: 50 });
  }, [map, searchResults]);

  useEffect(() => {
    fitBounds();
  }, [fitBounds]);

  const handleSearchResults = useCallback((results: PlaceListItem[]) => {
    setSearchResults(results);
    setSelectedPlace(null);
  }, []);

  const handlePlaceSelect = useCallback((place: PlaceListItem) => {
    setSelectedPlace(place);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchResults([]);
    setSelectedPlace(null);
  }, []);

  return {
    searchResults,
    selectedPlace,
    handleSearchResults,
    handlePlaceSelect,
    handleClearSearch,
    markerInstances,
  };
}
```

**코드베이스 충돌 체크**: ✅ 신규 훅이므로 충돌 없음

---

### Phase 6: 메인 페이지 통합
**목표**: 모든 컴포넌트를 통합하여 완성된 페이지 구현

#### 6.1 메인 페이지 컴포넌트
**파일**: `src/features/map/components/main-map-page.tsx`

```typescript
// src/features/map/components/main-map-page.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MapContainer } from './map-container';
import { SearchBar } from './search-bar';
import { SearchResultsList } from './search-results-list';
import { CurrentLocationButton } from './current-location-button';
import { usePlaceSearch } from '../hooks/use-place-search';
import { useMapState } from '../hooks/use-map-state';

export function MainMapPage() {
  const router = useRouter();
  const [map, setMap] = useState<naver.maps.Map | null>(null);

  const searchMutation = usePlaceSearch();

  const {
    searchResults,
    selectedPlace,
    handleSearchResults,
    handlePlaceSelect,
    handleClearSearch,
  } = useMapState(map);

  const handleSearch = useCallback(
    async (query: string) => {
      try {
        const result = await searchMutation.mutateAsync({ query });
        handleSearchResults(result.items);
      } catch (error) {
        console.error('Search error:', error);
        alert('검색 중 오류가 발생했습니다.');
      }
    },
    [searchMutation, handleSearchResults]
  );

  const handleReviewClick = useCallback(
    (placeId: string) => {
      router.push(`/review/new?placeId=${placeId}`);
    },
    [router]
  );

  return (
    <div className="relative w-screen h-screen">
      {/* 헤더 */}
      <header className="absolute top-4 left-4 z-30 bg-white px-4 py-2 rounded-lg shadow-lg">
        <h1 className="text-xl font-bold text-green-600">ConnectMap</h1>
      </header>

      {/* 검색창 */}
      <SearchBar
        onSearch={handleSearch}
        onClear={handleClearSearch}
        isLoading={searchMutation.isPending}
      />

      {/* 지도 */}
      <MapContainer onMapLoad={setMap} />

      {/* 현재 위치 버튼 */}
      <CurrentLocationButton map={map} />

      {/* 검색 결과 리스트 */}
      {searchResults.length > 0 && (
        <SearchResultsList
          results={searchResults}
          selectedPlaceId={selectedPlace?.id || null}
          onPlaceSelect={handlePlaceSelect}
          onReviewClick={handleReviewClick}
        />
      )}
    </div>
  );
}
```

**코드베이스 충돌 체크**: ✅ 신규 컴포넌트이므로 충돌 없음

---

## 4. 코드베이스 충돌 체크 요약

| 구현 항목 | 경로 | 충돌 가능성 | 비고 |
|----------|------|------------|------|
| **백엔드 API** | `src/features/place/backend/*` | ✅ 없음 | place feature 확장 |
| **페이지 라우트** | `src/app/page.tsx` | ⚠️ 주의 | 기존 홈페이지 대체 |
| **네이버 지도 SDK** | `src/lib/naver-map/*`, `src/hooks/use*.ts` | ⚠️ 의존성 | common-modules Phase 3 필요 |
| **UI 컴포넌트** | `src/features/map/components/*` | ✅ 없음 | 신규 컴포넌트 |
| **공통 모듈** | `src/types/*`, `src/components/common/*` | ⚠️ 의존성 | common-modules.md Phase 1-4 선행 필요 |

**결론**: 공통 모듈 (특히 네이버 지도 SDK 연동)이 구현되어 있다면 충돌 없이 개발 가능합니다.

---

## 5. 구현 순서 권장사항

### 순서 1: 공통 모듈 확인 및 구현
- `docs/common-modules.md` Phase 1-4 완료 확인
- **Phase 3 (네이버 지도 SDK)** 필수 선행 구현

### 순서 2: 백엔드 API (Phase 1)
1. 네이버 API 클라이언트 구현
2. 장소 검색 API 구현
3. API 테스트

### 순서 3: 지도 초기화 (Phase 3)
1. 지도 컨테이너 컴포넌트
2. 현재 위치 버튼

### 순서 4: 검색 기능 (Phase 4)
1. 검색 훅 구현
2. 검색창 컴포넌트

### 순서 5: 검색 결과 표시 (Phase 5)
1. 검색 결과 리스트
2. 마커 관리 훅

### 순서 6: 통합 (Phase 6)
1. 메인 페이지 컴포넌트
2. 테스트 및 디버깅

---

## 6. 테스트 계획

### 6.1 단위 테스트
- `use-place-search` 훅
- `use-map-state` 훅
- 마커 유틸리티 함수

### 6.2 통합 테스트
- 검색 → 결과 표시
- 마커 클릭 → 리스트 스크롤
- 리스트 클릭 → 지도 중심 이동

### 6.3 E2E 테스트
```typescript
test('메인 페이지 전체 플로우', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=ConnectMap')).toBeVisible();
  await page.fill('input[placeholder*="검색"]', '강남역 한식');
  await page.click('button:has-text("검색")');
  await expect(page.locator('text=검색 결과')).toBeVisible();
});
```

---

## 7. 성능 최적화

### 7.1 마커 렌더링 최적화
- 마커 클러스터링 (많은 결과 시)
- 뷰포트 내 마커만 렌더링

### 7.2 검색 결과 가상화
- `react-window` 사용 (50개 이상 결과 시)

### 7.3 네이버 지도 SDK 로딩 최적화
- Script lazy loading
- Suspense 사용

---

## 8. 향후 개선 사항

- 검색 자동완성
- 검색 히스토리 저장 (LocalStorage)
- 필터링 (카테고리, 평점)
- 경로 안내 기능
- 즐겨찾기 기능

---

**작성일**: 2025-10-22
**버전**: 1.0
**작성자**: Senior Developer (via Claude Code)
