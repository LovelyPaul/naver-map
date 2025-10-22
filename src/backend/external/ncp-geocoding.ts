// NCP Geocoding API Client
// 네이버 클라우드 플랫폼 Geocoding API 클라이언트

import type { Coordinate } from '@/types/map';

/**
 * Geocoding API 요청 파라미터
 */
type GeocodingParams = {
  query: string; // 주소
  coordinate?: string; // 중심 좌표 (경도,위도)
  filter?: string; // 필터 (admcode, legal, roadaddr 등)
  language?: 'kor' | 'eng'; // 언어
  page?: number; // 페이지 번호
  count?: number; // 페이지당 결과 수 (최대: 100)
};

/**
 * Geocoding API 응답
 */
type GeocodingResponse = {
  status: string;
  meta: {
    totalCount: number;
    page: number;
    count: number;
  };
  addresses: Array<{
    roadAddress: string;
    jibunAddress: string;
    englishAddress: string;
    addressElements: Array<{
      types: string[];
      longName: string;
      shortName: string;
      code: string;
    }>;
    x: string; // 경도
    y: string; // 위도
    distance: number;
  }>;
  errorMessage?: string;
};

/**
 * Reverse Geocoding API 요청 파라미터
 */
type ReverseGeocodingParams = {
  coords: string; // 좌표 (경도,위도)
  sourcecrs?: 'epsg:4326' | 'epsg:4258' | 'epsg:2097' | 'epsg:2096';
  orders?: string; // 변환 작업 이름
  output?: 'json' | 'xml';
};

/**
 * Reverse Geocoding API 응답
 */
type ReverseGeocodingResponse = {
  status: {
    code: number;
    name: string;
    message: string;
  };
  results: Array<{
    name: string;
    code: {
      id: string;
      type: string;
      mappingId: string;
    };
    region: {
      area0: { name: string; coords: { center: { x: string; y: string } } };
      area1: { name: string; coords: { center: { x: string; y: string } }; alias: string };
      area2: { name: string; coords: { center: { x: string; y: string } } };
      area3: { name: string; coords: { center: { x: string; y: string } } };
      area4: { name: string; coords: { center: { x: string; y: string } } };
    };
    land?: {
      type: string;
      number1: string;
      number2: string;
      addition0: { type: string; value: string };
      addition1: { type: string; value: string };
      addition2: { type: string; value: string };
      addition3: { type: string; value: string };
      addition4: { type: string; value: string };
      name: string;
      coords: { center: { x: string; y: string } };
    };
  }>;
};

/**
 * NCP Geocoding API 클라이언트
 */
export class NCPGeocodingClient {
  private readonly geocodingBaseUrl = 'https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode';
  private readonly reverseGeocodingBaseUrl = 'https://naveropenapi.apigw.ntruss.com/map-reversegeocode/v2/gc';
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * 주소 → 좌표 변환 (Geocoding)
   *
   * @param params 검색 파라미터
   * @returns 검색 결과
   */
  async geocode(params: GeocodingParams): Promise<GeocodingResponse> {
    const { query, coordinate, filter, language = 'kor', page = 1, count = 10 } = params;

    const searchParams = new URLSearchParams({
      query,
      page: page.toString(),
      count: count.toString(),
    });

    if (coordinate) searchParams.append('coordinate', coordinate);
    if (filter) searchParams.append('filter', filter);
    if (language) searchParams.append('language', language);

    const url = `${this.geocodingBaseUrl}?${searchParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-NCP-APIGW-API-KEY-ID': this.clientId,
          'X-NCP-APIGW-API-KEY': this.clientSecret,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `NCP Geocoding API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as GeocodingResponse;

      if (data.status !== 'OK') {
        throw new Error(`Geocoding failed: ${data.errorMessage || 'Unknown error'}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('NCP Geocoding API 호출 중 알 수 없는 오류가 발생했습니다');
    }
  }

  /**
   * 좌표 → 주소 변환 (Reverse Geocoding)
   *
   * @param params 검색 파라미터
   * @returns 검색 결과
   */
  async reverseGeocode(params: ReverseGeocodingParams): Promise<ReverseGeocodingResponse> {
    const { coords, sourcecrs = 'epsg:4326', orders = 'roadaddr', output = 'json' } = params;

    const searchParams = new URLSearchParams({
      coords,
      sourcecrs,
      orders,
      output,
    });

    const url = `${this.reverseGeocodingBaseUrl}?${searchParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-NCP-APIGW-API-KEY-ID': this.clientId,
          'X-NCP-APIGW-API-KEY': this.clientSecret,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `NCP Reverse Geocoding API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = (await response.json()) as ReverseGeocodingResponse;

      if (data.status.code !== 0) {
        throw new Error(`Reverse Geocoding failed: ${data.status.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('NCP Reverse Geocoding API 호출 중 알 수 없는 오류가 발생했습니다');
    }
  }

  /**
   * Coordinate 객체에서 coords 문자열 생성
   *
   * @param coordinate 좌표
   * @returns "경도,위도" 형식의 문자열
   */
  static coordsToString(coordinate: Coordinate): string {
    return `${coordinate.lng},${coordinate.lat}`;
  }

  /**
   * Geocoding 응답에서 첫 번째 결과의 좌표 추출
   *
   * @param response Geocoding 응답
   * @returns 좌표 또는 null
   */
  static extractCoordinate(response: GeocodingResponse): Coordinate | null {
    if (!response.addresses || response.addresses.length === 0) {
      return null;
    }

    const address = response.addresses[0];
    return {
      lat: parseFloat(address.y),
      lng: parseFloat(address.x),
    };
  }

  /**
   * Reverse Geocoding 응답에서 주소 문자열 추출
   *
   * @param response Reverse Geocoding 응답
   * @returns 주소 문자열
   */
  static extractAddress(response: ReverseGeocodingResponse): string | null {
    if (!response.results || response.results.length === 0) {
      return null;
    }

    const result = response.results[0];
    const { region, land } = result;

    // 도로명 주소가 있으면 사용
    if (land && land.name) {
      return `${region.area1.name} ${region.area2.name} ${land.name}`;
    }

    // 지번 주소 사용
    return `${region.area1.name} ${region.area2.name} ${region.area3.name} ${region.area4.name}`.trim();
  }
}

/**
 * NCP Geocoding API 클라이언트 싱글톤
 */
let ncpGeocodingClient: NCPGeocodingClient | null = null;

export function getNCPGeocodingClient(
  clientId: string,
  clientSecret: string
): NCPGeocodingClient {
  if (!ncpGeocodingClient) {
    ncpGeocodingClient = new NCPGeocodingClient(clientId, clientSecret);
  }
  return ncpGeocodingClient;
}
