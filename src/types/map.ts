// Map Types
// 네이버 지도 관련 타입 정의

/**
 * 좌표 정보
 */
export type Coordinate = {
  lat: number; // 위도
  lng: number; // 경도
};

/**
 * 마커 타입
 */
export type MarkerType = 'search' | 'review' | 'selected' | 'user';

/**
 * 지도 마커 데이터
 */
export type MapMarker = {
  id: string;
  position: Coordinate;
  type: MarkerType;
  placeId?: string;
  placeName?: string;
  photoUrl?: string | null;
  address?: string;
  categoryMain?: string;
  categorySub?: string;
};

/**
 * 지도 뷰포트 (표시 영역)
 */
export type MapViewport = {
  center: Coordinate;
  zoom: number;
  bounds?: {
    ne: Coordinate; // 북동쪽 좌표
    sw: Coordinate; // 남서쪽 좌표
  };
};

/**
 * 네이버 지도 옵션
 */
export type NaverMapOptions = {
  center: Coordinate;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  zoomControl?: boolean;
  zoomControlOptions?: {
    position: number; // naver.maps.Position
  };
  mapTypeControl?: boolean;
  scaleControl?: boolean;
  logoControl?: boolean;
  mapDataControl?: boolean;
};

/**
 * 마커 옵션
 */
export type MarkerOptions = {
  position: Coordinate;
  map: naver.maps.Map;
  title?: string;
  icon?: {
    content: string; // HTML string
    size?: naver.maps.Size;
    anchor?: naver.maps.Point;
  };
  clickable?: boolean;
  draggable?: boolean;
  zIndex?: number;
};

/**
 * Geolocation 결과
 */
export type GeolocationResult = {
  position: Coordinate;
  accuracy: number; // 정확도 (미터)
  timestamp: number;
};

/**
 * Geolocation 에러
 */
export type GeolocationError = {
  code: number;
  message: string;
};

/**
 * Geolocation 권한 상태
 */
export type GeolocationPermission = 'granted' | 'denied' | 'prompt';

/**
 * 네이버 지도 전역 타입 (window.naver.maps)
 */
export type NaverMaps = typeof naver.maps;
