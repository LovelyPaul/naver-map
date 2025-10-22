// Naver Local Search API Client
// 네이버 지역 검색 API 클라이언트

import type { NaverPlaceSearchResult } from '@/types/place';

type NaverLocalSearchParams = {
  query: string;
  display?: number; // 검색 결과 개수 (기본: 5, 최대: 5)
  start?: number; // 검색 시작 위치 (기본: 1, 최대: 1)
  sort?: 'random' | 'comment'; // 정렬 (기본: random)
};

type NaverLocalSearchResponse = {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverPlaceSearchResult[];
};

/**
 * 네이버 지역 검색 API 클라이언트
 */
export class NaverLocalSearchClient {
  private readonly baseUrl = 'https://openapi.naver.com/v1/search/local.json';
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * 지역 검색 수행
   *
   * @param params 검색 파라미터
   * @returns 검색 결과
   *
   * @throws Error API 호출 실패 시
   */
  async search(params: NaverLocalSearchParams): Promise<NaverLocalSearchResponse> {
    const { query, display = 5, start = 1, sort = 'random' } = params;

    // URL 파라미터 구성
    const searchParams = new URLSearchParams({
      query,
      display: display.toString(),
      start: start.toString(),
      sort,
    });

    const url = `${this.baseUrl}?${searchParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-Naver-Client-Id': this.clientId,
          'X-Naver-Client-Secret': this.clientSecret,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Naver Local Search API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as NaverLocalSearchResponse;
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Naver Local Search API 호출 중 알 수 없는 오류가 발생했습니다');
    }
  }

  /**
   * HTML 태그 제거 유틸리티
   *
   * 네이버 API 응답은 검색어 하이라이팅을 위해 <b> 태그를 포함할 수 있음
   *
   * @param html HTML 문자열
   * @returns 순수 텍스트
   */
  static stripHtmlTags(html: string): string {
    return html.replace(/<\/?[^>]+(>|$)/g, '');
  }
}

/**
 * 네이버 Local Search API 클라이언트 싱글톤
 */
let naverLocalSearchClient: NaverLocalSearchClient | null = null;

export function getNaverLocalSearchClient(
  clientId: string,
  clientSecret: string
): NaverLocalSearchClient {
  if (!naverLocalSearchClient) {
    naverLocalSearchClient = new NaverLocalSearchClient(clientId, clientSecret);
  }
  return naverLocalSearchClient;
}
