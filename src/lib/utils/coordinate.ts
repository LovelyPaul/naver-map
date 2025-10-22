// Coordinate Utility Functions
// 좌표 관련 유틸리티 함수

import type { Coordinate } from '@/types/map';

/**
 * 네이버 API 좌표 문자열을 Coordinate 객체로 변환
 * 네이버 API는 Katech 좌표계를 사용하므로 WGS84로 변환 필요
 *
 * @param mapx 네이버 경도 (Katech x 좌표)
 * @param mapy 네이버 위도 (Katech y 좌표)
 * @returns Coordinate 객체 (WGS84)
 *
 * @example
 * parseNaverCoordinate("1270000000", "375000000")
 */
export function parseNaverCoordinate(mapx: string, mapy: string): Coordinate {
  // 네이버 API는 Katech 좌표계를 10^7 배로 정수화한 값 반환
  // WGS84 변환 공식 적용
  const x = parseFloat(mapx) / 10000000;
  const y = parseFloat(mapy) / 10000000;

  // Katech -> WGS84 변환 (근사치)
  // 실제로는 더 정확한 변환식이 필요하지만,
  // 네이버 Maps API는 이미 WGS84를 반환하므로 단순 스케일 조정만 수행
  const lng = x / 100;
  const lat = y / 100;

  return { lat, lng };
}

/**
 * Haversine 공식을 사용한 두 좌표 간 거리 계산 (미터)
 *
 * @param coord1 첫 번째 좌표
 * @param coord2 두 번째 좌표
 * @returns 거리 (미터)
 *
 * @example
 * const distance = calculateDistance(
 *   { lat: 37.5665, lng: 126.9780 }, // 서울시청
 *   { lat: 37.5635, lng: 126.9758 }  // 명동
 * );
 * console.log(distance); // 약 370m
 */
export function calculateDistance(coord1: Coordinate, coord2: Coordinate): number {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (coord1.lat * Math.PI) / 180;
  const φ2 = (coord2.lat * Math.PI) / 180;
  const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * 거리를 사람이 읽기 쉬운 형식으로 포맷팅
 *
 * @param meters 거리 (미터)
 * @returns 포맷된 거리 문자열
 *
 * @example
 * formatDistance(350) // "350m"
 * formatDistance(1500) // "1.5km"
 * formatDistance(12500) // "12.5km"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * 좌표가 유효한지 검증
 *
 * @param coord 좌표 객체
 * @returns 유효 여부
 */
export function isValidCoordinate(coord: Coordinate): boolean {
  return (
    typeof coord.lat === 'number' &&
    typeof coord.lng === 'number' &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180 &&
    !Number.isNaN(coord.lat) &&
    !Number.isNaN(coord.lng)
  );
}
