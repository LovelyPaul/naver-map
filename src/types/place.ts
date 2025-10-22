// Place Types
// 장소 관련 타입 정의

/**
 * 네이버 Place ID 타입
 */
export type NaverPlaceId = string;

/**
 * 장소 기본 정보 (DB 저장용)
 */
export type Place = {
  id: string; // UUID
  naverPlaceId: NaverPlaceId;
  name: string;
  address: string;
  categoryMain: string;
  categorySub: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * 장소 목록 아이템 (검색 결과, 리스트 표시용)
 */
export type PlaceListItem = {
  id: string; // UUID 또는 Naver Place ID
  name: string;
  address: string;
  category: string; // 전체 카테고리 문자열
  categoryMain: string;
  categorySub: string | null;
  latitude: number;
  longitude: number;
  photoUrl: string | null;
  hasReviews: boolean;
  reviewCount?: number;
  avgRating?: number;
};

/**
 * 장소 상세 정보 (상세 페이지용)
 */
export type PlaceDetail = Place & {
  statistics: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  };
};

/**
 * 네이버 Local Search API 응답 아이템
 */
export type NaverPlaceSearchResult = {
  title: string; // HTML 태그 포함 가능
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string; // 경도 (x 좌표)
  mapy: string; // 위도 (y 좌표)
};

/**
 * 장소 검색 쿼리 파라미터
 */
export type PlaceSearchParams = {
  query: string;
  limit?: number;
  lat?: number;
  lng?: number;
  radius?: number;
};
