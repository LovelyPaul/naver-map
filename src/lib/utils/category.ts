// Category Utility Functions
// 카테고리 관련 유틸리티 함수

/**
 * 네이버 카테고리 문자열을 메인/서브 카테고리로 파싱
 * @param category 네이버 API 카테고리 문자열 (예: "음식점>한식>감자탕")
 * @returns { main: string, sub: string | null }
 *
 * @example
 * parseCategory("음식점>한식>감자탕") // { main: "음식점", sub: "한식" }
 * parseCategory("카페") // { main: "카페", sub: null }
 */
export function parseCategory(category: string): {
  main: string;
  sub: string | null;
} {
  if (!category || category.trim().length === 0) {
    return { main: '기타', sub: null };
  }

  const parts = category.split('>').map((part) => part.trim());

  if (parts.length === 0) {
    return { main: '기타', sub: null };
  }

  const main = parts[0] || '기타';
  const sub = parts.length > 1 ? parts[1] : null;

  return { main, sub };
}

/**
 * 메인/서브 카테고리를 표시용 문자열로 포맷팅
 * @param main 메인 카테고리
 * @param sub 서브 카테고리 (옵션)
 * @returns 포맷된 카테고리 문자열
 *
 * @example
 * formatCategory("음식점", "한식") // "음식점 > 한식"
 * formatCategory("카페", null) // "카페"
 */
export function formatCategory(main: string, sub: string | null): string {
  if (!sub) {
    return main;
  }
  return `${main} > ${sub}`;
}

/**
 * 카테고리 문자열을 정규화 (HTML 태그 제거)
 * @param category 카테고리 문자열
 * @returns 정규화된 카테고리 문자열
 */
export function normalizeCategory(category: string): string {
  return category.replace(/<\/?[^>]+(>|$)/g, '').trim();
}
