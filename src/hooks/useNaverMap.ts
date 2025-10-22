'use client';

// useNaverMap Hook
// 네이버 지도 인스턴스 생성 및 관리

import { useEffect, useRef, useState } from 'react';
import { loadNaverMapsScript } from '@/lib/map/naver-maps-loader';
import type { Coordinate, NaverMapOptions } from '@/types/map';

type UseNaverMapOptions = {
  center: Coordinate;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomControl?: boolean;
  mapTypeControl?: boolean;
  scaleControl?: boolean;
  logoControl?: boolean;
  mapDataControl?: boolean;
};

type UseNaverMapReturn = {
  map: naver.maps.Map | null;
  isLoading: boolean;
  error: Error | null;
};

/**
 * 네이버 지도 인스턴스를 생성하고 관리하는 훅
 *
 * @param containerRef 지도가 렌더링될 DOM 요소 ref
 * @param options 지도 옵션
 * @returns { map, isLoading, error }
 *
 * @example
 * const mapContainerRef = useRef<HTMLDivElement>(null);
 * const { map, isLoading, error } = useNaverMap(mapContainerRef, {
 *   center: { lat: 37.5665, lng: 126.9780 },
 *   zoom: 15,
 * });
 */
export function useNaverMap(
  containerRef: React.RefObject<HTMLElement>,
  options: UseNaverMapOptions
): UseNaverMapReturn {
  const [map, setMap] = useState<naver.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 지도 인스턴스 생성은 한 번만 수행
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);

  useEffect(() => {
    const initMap = async () => {
      // 컨테이너가 없으면 초기화하지 않음
      if (!containerRef.current) {
        return;
      }

      // 이미 지도 인스턴스가 있으면 초기화하지 않음
      if (mapInstanceRef.current) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 네이버 지도 SDK 로드
        await loadNaverMapsScript();

        // SDK가 제대로 로드되었는지 확인
        if (!window.naver?.maps) {
          throw new Error('네이버 지도 SDK 로드 실패');
        }

        // 지도 옵션 구성
        const mapOptions: NaverMapOptions = {
          center: new window.naver.maps.LatLng(options.center.lat, options.center.lng),
          zoom: options.zoom ?? 15,
          minZoom: options.minZoom ?? 7,
          maxZoom: options.maxZoom ?? 21,
          zoomControl: options.zoomControl ?? true,
          zoomControlOptions: {
            position: window.naver.maps.Position.TOP_RIGHT,
          },
          mapTypeControl: options.mapTypeControl ?? false,
          scaleControl: options.scaleControl ?? false,
          logoControl: options.logoControl ?? false,
          mapDataControl: options.mapDataControl ?? false,
        };

        // 지도 인스턴스 생성
        const mapInstance = new window.naver.maps.Map(containerRef.current, mapOptions);

        // 상태 업데이트
        mapInstanceRef.current = mapInstance;
        setMap(mapInstance);
        setIsLoading(false);
      } catch (err) {
        console.error('지도 초기화 오류:', err);
        const errorObj = err instanceof Error ? err : new Error('지도 초기화 실패');
        setError(errorObj);
        setIsLoading(false);
      }
    };

    initMap();

    // cleanup: 지도 인스턴스 제거
    return () => {
      if (mapInstanceRef.current) {
        // 네이버 지도는 명시적인 destroy 메서드가 없으므로 참조만 해제
        mapInstanceRef.current = null;
        setMap(null);
      }
    };
  }, [containerRef, options.center.lat, options.center.lng, options.zoom]);

  return { map, isLoading, error };
}
