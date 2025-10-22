'use client';

// useMapMarkers Hook
// 지도 마커 생성 및 관리

import { useEffect, useRef } from 'react';
import type { MapMarker } from '@/types/map';

type UseMapMarkersOptions = {
  map: naver.maps.Map | null;
  markers: MapMarker[];
  onMarkerClick?: (marker: MapMarker) => void;
};

/**
 * 마커 타입별 아이콘 HTML 생성
 */
function getMarkerIconContent(marker: MapMarker): string {
  const { type } = marker;

  // 마커 타입별 색상 및 스타일
  const styles = {
    search: {
      bg: '#4285f4',
      border: '#1a73e8',
      label: '검색',
    },
    review: {
      bg: '#34a853',
      border: '#188038',
      label: '리뷰',
    },
    selected: {
      bg: '#ea4335',
      border: '#c5221f',
      label: '선택',
    },
    user: {
      bg: '#fbbc04',
      border: '#f29900',
      label: '현위치',
    },
  };

  const style = styles[type] || styles.search;

  return `
    <div style="
      position: relative;
      width: 40px;
      height: 40px;
      background: ${style.bg};
      border: 2px solid ${style.border};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
    ">
      <div style="
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
        color: white;
        font-size: 12px;
        font-weight: bold;
        white-space: nowrap;
      ">${marker.placeName ? marker.placeName.substring(0, 3) : '•'}</div>
    </div>
  `;
}

/**
 * 지도에 마커를 생성하고 관리하는 훅
 *
 * @param options { map, markers, onMarkerClick }
 *
 * @example
 * useMapMarkers({
 *   map,
 *   markers: [
 *     { id: '1', position: { lat: 37.5, lng: 127 }, type: 'search', placeName: '카페' }
 *   ],
 *   onMarkerClick: (marker) => console.log('Clicked:', marker)
 * });
 */
export function useMapMarkers({ map, markers, onMarkerClick }: UseMapMarkersOptions): void {
  // 마커 인스턴스를 저장하는 ref
  const markerInstancesRef = useRef<Map<string, naver.maps.Marker>>(new Map());
  const listenerRefs = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    // 지도가 없으면 아무것도 하지 않음
    if (!map || !window.naver?.maps) {
      return;
    }

    const currentMarkerIds = new Set(markers.map((m) => m.id));
    const existingMarkerIds = new Set(markerInstancesRef.current.keys());

    // 1. 삭제된 마커 제거
    for (const id of existingMarkerIds) {
      if (!currentMarkerIds.has(id)) {
        const markerInstance = markerInstancesRef.current.get(id);
        const listener = listenerRefs.current.get(id);

        // 이벤트 리스너 제거
        if (listener) {
          window.naver.maps.Event.removeListener(listener);
          listenerRefs.current.delete(id);
        }

        // 마커 제거
        if (markerInstance) {
          markerInstance.setMap(null);
          markerInstancesRef.current.delete(id);
        }
      }
    }

    // 2. 새 마커 추가 및 기존 마커 업데이트
    for (const marker of markers) {
      const existingMarker = markerInstancesRef.current.get(marker.id);

      if (existingMarker) {
        // 기존 마커 위치 업데이트
        const newPosition = new window.naver.maps.LatLng(
          marker.position.lat,
          marker.position.lng
        );
        existingMarker.setPosition(newPosition);

        // 아이콘 업데이트
        existingMarker.setIcon({
          content: getMarkerIconContent(marker),
          anchor: new window.naver.maps.Point(20, 40),
        });
      } else {
        // 새 마커 생성
        const markerInstance = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(marker.position.lat, marker.position.lng),
          map,
          icon: {
            content: getMarkerIconContent(marker),
            anchor: new window.naver.maps.Point(20, 40),
          },
          title: marker.placeName || '',
          clickable: true,
        });

        // 클릭 이벤트 추가
        if (onMarkerClick) {
          const listener = window.naver.maps.Event.addListener(
            markerInstance,
            'click',
            () => {
              onMarkerClick(marker);
            }
          );
          listenerRefs.current.set(marker.id, listener);
        }

        markerInstancesRef.current.set(marker.id, markerInstance);
      }
    }
  }, [map, markers, onMarkerClick]);

  // cleanup: 모든 마커 제거
  useEffect(() => {
    return () => {
      // 모든 이벤트 리스너 제거
      for (const listener of listenerRefs.current.values()) {
        if (listener && window.naver?.maps) {
          window.naver.maps.Event.removeListener(listener);
        }
      }
      listenerRefs.current.clear();

      // 모든 마커 제거
      for (const markerInstance of markerInstancesRef.current.values()) {
        markerInstance.setMap(null);
      }
      markerInstancesRef.current.clear();
    };
  }, []);
}
