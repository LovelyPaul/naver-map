'use client';

// MapContainer Component
// 네이버 지도를 표시하는 컨테이너 컴포넌트

import { useRef, createContext, useContext, type ReactNode } from 'react';
import { useNaverMap } from '@/hooks/useNaverMap';
import type { Coordinate } from '@/types/map';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * 지도 컨텍스트
 */
type MapContextValue = {
  map: naver.maps.Map | null;
};

const MapContext = createContext<MapContextValue | null>(null);

/**
 * 지도 인스턴스에 접근하기 위한 훅
 */
export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within MapContainer');
  }
  return context;
}

/**
 * MapContainer Props
 */
type MapContainerProps = {
  /** 지도 중심 좌표 */
  center: Coordinate;
  /** 지도 줌 레벨 (기본값: 15) */
  zoom?: number;
  /** 지도 최소 줌 레벨 (기본값: 7) */
  minZoom?: number;
  /** 지도 최대 줌 레벨 (기본값: 21) */
  maxZoom?: number;
  /** 줌 컨트롤 표시 여부 (기본값: true) */
  zoomControl?: boolean;
  /** 자식 컴포넌트 (마커, 버튼 등) */
  children?: ReactNode;
  /** 추가 CSS 클래스명 */
  className?: string;
};

/**
 * 네이버 지도를 표시하는 컨테이너 컴포넌트
 *
 * @example
 * ```tsx
 * <MapContainer center={{ lat: 37.5665, lng: 126.9780 }} zoom={15}>
 *   <CurrentLocationButton />
 *   <SearchBar />
 * </MapContainer>
 * ```
 */
export function MapContainer({
  center,
  zoom = 15,
  minZoom = 7,
  maxZoom = 21,
  zoomControl = true,
  children,
  className = '',
}: MapContainerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const { map, isLoading, error } = useNaverMap(mapContainerRef, {
    center,
    zoom,
    minZoom,
    maxZoom,
    zoomControl,
    mapTypeControl: false,
    scaleControl: false,
    logoControl: false,
    mapDataControl: false,
  });

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 지도 컨테이너 */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
            <p className="text-sm text-slate-600">지도를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
          <div className="flex flex-col items-center gap-3 max-w-md p-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <p className="text-sm text-slate-800 font-medium">지도를 불러올 수 없습니다</p>
            <p className="text-xs text-slate-600 text-center">{error.message}</p>
          </div>
        </div>
      )}

      {/* 지도가 로드되면 자식 컴포넌트 렌더링 */}
      {map && !isLoading && !error && (
        <MapContext.Provider value={{ map }}>
          {children}
        </MapContext.Provider>
      )}
    </div>
  );
}
