# 구현 계획서 주요 업데이트 사항

## 문서 정보
- **작성일**: 2025-10-22
- **목적**: 네이버 API 연동 문서 검토 후 발견된 계획서 수정사항 정리
- **영향 범위**: main-map, place-detail, review-write 페이지

---

## 🚨 중요 변경사항 요약

### 1. 환경 변수 명명 규칙 변경

#### ❌ 기존 (잘못된 계획)
```bash
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=...
NAVER_MAP_CLIENT_SECRET=...
```

#### ✅ 올바른 구성
```bash
# 3개의 별도 API 사용, 발급처도 다름!

# 네이버 지도 JavaScript API (NCP 콘솔 발급)
NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID=...

# 네이버 Geocoding API (NCP 콘솔 발급)
NAVER_GEOCODING_CLIENT_ID=...
NAVER_GEOCODING_CLIENT_SECRET=...

# 네이버 Local Search API (네이버 개발자 센터 발급)
NAVER_LOCAL_SEARCH_CLIENT_ID=...
NAVER_LOCAL_SEARCH_CLIENT_SECRET=...
```

**이유:**
- 네이버 지도 API는 **3개의 독립된 API**로 구성
- **NCP (네이버 클라우드 플랫폼)**: Maps, Geocoding
- **네이버 개발자 센터**: Local Search
- 각각 별도로 키 발급 필요

---

### 2. API 명칭 정정

#### ❌ 기존 계획서 표현
- "네이버 Places API"
- "네이버 지도 API"

#### ✅ 정확한 명칭
- **네이버 지도 JavaScript API v3** (지도 표시 전용)
- **네이버 Local Search API v1** (장소 검색)
- **네이버 Geocoding API v2** (주소 ↔ 좌표 변환, 선택적)

---

### 3. Script 로딩 전략 추가

#### ❌ 기존 계획서
```tsx
<Script
  src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${...}`}
  onLoad={handleOnLoad}
/>
```

#### ✅ 올바른 구현
```tsx
<Script
  strategy="beforeInteractive"  // ← 필수!
  src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID}&submodules=geocoder`}
  //                                                                                                              ↑ submodules 파라미터
  onLoad={handleOnLoad}
/>
```

**중요:**
- `strategy="beforeInteractive"`: 페이지 인터랙션 전에 스크립트 로드
- `submodules=geocoder`: Geocoding 서브모듈 포함 (선택적)

---

### 4. TypeScript 전역 타입 선언 추가

#### ✅ 모든 지도 컴포넌트에 필수 추가
```tsx
// 파일 최상단 또는 타입 정의 파일
declare global {
  interface Window {
    naver: any;
  }
}
```

**위치:**
- `src/lib/naver-map/types.ts` (권장)
- 또는 각 지도 컴포넌트 파일 내부

---

### 5. API 호출 헤더 형식 구분

#### Local Search API (네이버 개발자 센터)
```typescript
headers: {
  'X-Naver-Client-Id': process.env.NAVER_LOCAL_SEARCH_CLIENT_ID,
  'X-Naver-Client-Secret': process.env.NAVER_LOCAL_SEARCH_CLIENT_SECRET,
}
```

#### Geocoding API (NCP)
```typescript
headers: {
  'X-NCP-APIGW-API-KEY-ID': process.env.NAVER_GEOCODING_CLIENT_ID,
  'X-NCP-APIGW-API-KEY': process.env.NAVER_GEOCODING_CLIENT_SECRET,
}
```

---

### 6. 좌표 변환 로직 필수

#### Local Search API 응답 형식
```json
{
  "mapx": "1269780",  // 경도 * 10^7
  "mapy": "375665"    // 위도 * 10^7
}
```

#### 필수 변환 로직
```typescript
// src/lib/utils/coordinate.ts 에 추가
export function parseNaverCoordinate(mapx: string, mapy: string): Coordinate {
  return {
    lat: parseInt(mapy) / 10_000_000,
    lng: parseInt(mapx) / 10_000_000,
  };
}
```

---

## 📋 페이지별 수정 필요 사항

### main-map 페이지

#### Phase 1: 백엔드 API 수정
**파일**: `src/features/place/backend/route.ts`, `service.ts`

**변경사항:**
```typescript
// ❌ 기존 계획
POST /api/places/search

// ✅ 변경
GET /api/search-places  // Local Search API 프록시

// 추가 (선택적)
GET /api/geocode  // Geocoding API 프록시
```

**구현 예시:**
```typescript
// src/app/api/search-places/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  const response = await fetch(
    `https://openapi.naver.com/v1/search/local.json?query=${query}&display=20`,
    {
      headers: {
        'X-Naver-Client-Id': process.env.NAVER_LOCAL_SEARCH_CLIENT_ID!,
        'X-Naver-Client-Secret': process.env.NAVER_LOCAL_SEARCH_CLIENT_SECRET!,
      },
    }
  );

  const data = await response.json();

  // 좌표 변환 필수!
  const places = data.items.map((item: any) => ({
    id: item.link, // 또는 고유 ID 생성
    name: item.title.replace(/<\/?b>/g, ''),
    address: item.address,
    category: item.category,
    lat: parseInt(item.mapy) / 10_000_000,
    lng: parseInt(item.mapx) / 10_000_000,
  }));

  return NextResponse.json({ items: places });
}
```

#### Phase 3: 지도 초기화 수정
**파일**: `src/features/map/components/map-container.tsx`

**추가사항:**
```tsx
// TypeScript 전역 타입 선언 추가
declare global {
  interface Window {
    naver: any;
  }
}

// Script 로딩 전략 수정
<Script
  strategy="beforeInteractive"  // ← 추가
  src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID}&submodules=geocoder`}
  onLoad={handleOnLoad}
/>
```

---

### place-detail 페이지

**영향**: 경미 (주소 표시 시 Geocoding API 사용 가능, 선택적)

**추가 기능 (선택적):**
- 장소 주소를 지도에 표시하려면 Geocoding API 사용
- 또는 Local Search API 결과의 좌표 활용

---

### review-write 페이지

**영향**: 없음 (지도 기능 미사용)

---

## 🔧 공통 모듈 업데이트

### src/lib/naver-map/types.ts

**추가 필요:**
```typescript
// 전역 타입 선언 (한 곳에서만 선언하면 됨)
declare global {
  interface Window {
    naver: any;
  }
}

export type NaverMaps = typeof naver.maps;

// ... 기존 타입 정의
```

### src/lib/naver-map/loader.ts

**Script 로딩 로직 수정:**
```typescript
export function loadNaverMapSDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.naver !== 'undefined' && window.naver.maps) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID}&submodules=geocoder`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Naver Maps SDK'));

    document.head.appendChild(script);
  });
}
```

**주의:** Next.js `<Script>` 컴포넌트 사용 시 이 함수는 불필요할 수 있음

### src/lib/utils/coordinate.ts

**추가 함수:**
```typescript
/**
 * 네이버 Local Search API 좌표 변환
 * @param mapx 경도 * 10^7
 * @param mapy 위도 * 10^7
 */
export function parseNaverCoordinate(mapx: string, mapy: string): Coordinate {
  return {
    lat: parseInt(mapy, 10) / 10_000_000,
    lng: parseInt(mapx, 10) / 10_000_000,
  };
}
```

### src/lib/utils/category.ts

**추가 함수:**
```typescript
/**
 * 네이버 Local Search API 카테고리 파싱
 * @param category "음식점>한식>소고기구이" 형식
 */
export function parseCategory(category: string): {
  main: string;
  sub: string | null;
} {
  const parts = category.split('>').map(s => s.trim());

  if (parts.length >= 2) {
    return {
      main: parts[1],      // "한식"
      sub: parts[2] || null // "소고기구이" 또는 null
    };
  }

  return {
    main: parts[0] || '미분류',
    sub: null,
  };
}
```

---

## 📝 .env.local 템플릿

**프로젝트 루트에 생성:**

```bash
# 네이버 지도 JavaScript API (클라이언트 사이드)
# 발급처: NCP 콘솔 > AI-NAVER API > Application > Maps
NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID=your_ncp_maps_client_id

# 네이버 Geocoding API (서버 사이드, 선택적)
# 발급처: NCP 콘솔 > AI-NAVER API > Application > Map Geocoding
NAVER_GEOCODING_CLIENT_ID=your_ncp_geocoding_client_id
NAVER_GEOCODING_CLIENT_SECRET=your_ncp_geocoding_client_secret

# 네이버 Local Search API (서버 사이드)
# 발급처: 네이버 개발자 센터 > Application > 검색 > 지역
NAVER_LOCAL_SEARCH_CLIENT_ID=your_naver_developer_local_client_id
NAVER_LOCAL_SEARCH_CLIENT_SECRET=your_naver_developer_local_client_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**.gitignore 확인:**
```gitignore
# 반드시 포함!
.env.local
.env*.local
```

---

## ✅ 구현 전 체크리스트

### API 키 발급
- [ ] NCP 콘솔에서 Maps API Client ID 발급
- [ ] NCP 콘솔에서 Geocoding API Client ID/Secret 발급
- [ ] 네이버 개발자 센터에서 Local Search API Client ID/Secret 발급
- [ ] 각 API별 웹 서비스 URL 등록 (`http://localhost:3000`)

### 환경 설정
- [ ] `.env.local` 파일 생성 및 5개 환경 변수 설정
- [ ] `.gitignore`에 `.env.local` 추가 확인
- [ ] TypeScript 전역 타입 선언 추가

### 코드 수정
- [ ] `parseNaverCoordinate` 함수 구현
- [ ] `parseCategory` 함수 수정 (네이버 형식 반영)
- [ ] Script 로딩에 `strategy="beforeInteractive"` 추가
- [ ] API Route 헤더 형식 수정
- [ ] 좌표 변환 로직 모든 검색 결과에 적용

### 문서 참고
- [ ] `docs/NAVER_API_INTEGRATION.md` 숙지
- [ ] `docs/external/위치기반 맛집 리뷰 플랫폼.md` 참고

---

## 🎯 우선순위

### P0 (필수, 즉시 수정)
1. ✅ 환경 변수 명명 규칙 변경
2. ✅ `parseNaverCoordinate` 함수 추가
3. ✅ TypeScript 전역 타입 선언
4. ✅ Script `strategy="beforeInteractive"` 추가

### P1 (중요, 구현 전 수정)
1. ✅ API Route 헤더 형식 수정
2. ✅ `parseCategory` 함수 수정
3. ✅ API 명칭 정정 (주석, 문서)

### P2 (권장, 선택적)
1. ⚠️ Geocoding API 구현 (주소 입력 기능 시)
2. ⚠️ `submodules=geocoder` 파라미터 추가

---

## 📚 참고 자료

- **네이버 지도 API v3 공식 문서**: https://navermaps.github.io/maps.js.ncp/
- **네이버 Local Search API 가이드**: https://developers.naver.com/docs/serviceapi/search/local/local.md
- **NCP Geocoding API 가이드**: https://api.ncloud-docs.com/docs/ai-naver-mapsgeocoding
- **내부 통합 가이드**: `docs/NAVER_API_INTEGRATION.md`

---

**작성일**: 2025-10-22
**버전**: 1.0
**작성자**: Senior Developer (via Claude Code)
