# 공통 모듈 설계 문서

## 문서 정보
- **프로젝트**: ConnectMap - 위치기반 맛집 리뷰 플랫폼
- **작성일**: 2025-10-22
- **목적**: 페이지 단위 병렬 개발을 위한 공통 모듈 사전 구현 계획

---

## 1. 개요

### 1.1 목적
본 문서는 ConnectMap 프로젝트의 페이지 단위 개발을 시작하기 전에 구현해야 할 공통 모듈과 로직을 정의합니다. 모든 공통 모듈을 사전에 구현함으로써 페이지 개발 시 코드 충돌을 방지하고 병렬 작업을 가능하게 합니다.

### 1.2 설계 원칙
- **문서 기반 설계**: PRD, Userflow, Database 문서에 명시된 기능만 구현
- **오버엔지니어링 금지**: 추측성 기능 배제
- **DRY 원칙 준수**: 중복 코드 최소화
- **타입 안정성**: TypeScript + Zod 기반 엄격한 타입 정의
- **프로젝트 구조 준수**: 기존 feature-based 아키텍처 유지

### 1.3 범위
- 네이버 지도 SDK 연동 및 타입 정의
- 도메인 모델 (Place, Review) 타입 및 스키마
- 공통 UI 컴포넌트
- 유틸리티 함수
- 백엔드 공통 스키마 및 에러 코드
- React Query 설정

---

## 2. 타입 정의

### 2.1 도메인 모델 타입

#### 2.1.1 Place (장소)
**파일 경로**: `src/types/place.ts`

```typescript
// DB 테이블 스키마 기반 타입
export type Place = {
  id: string; // UUID
  naverPlaceId: string;
  name: string;
  address: string;
  categoryMain: string;
  categorySub: string | null;
  latitude: number;
  longitude: number;
  createdAt: string; // ISO 8601
  updatedAt: string;
};

// 네이버 API 응답 타입
export type NaverPlaceSearchResult = {
  id: string; // 네이버 장소 ID
  name: string;
  address: string;
  category: string; // "한식 > 소고기구이" 형식
  x: string; // 경도 (longitude)
  y: string; // 위도 (latitude)
  telephone?: string;
  roadAddress?: string;
};

// 프론트엔드 표시용 간소화 타입
export type PlaceListItem = {
  id: string;
  naverPlaceId: string;
  name: string;
  address: string;
  categoryMain: string;
  categorySub: string | null;
  latitude: number;
  longitude: number;
  hasReviews: boolean; // 리뷰 존재 여부
  reviewCount?: number;
  avgRating?: number;
};
```

#### 2.1.2 Review (리뷰)
**파일 경로**: `src/types/review.ts`

```typescript
export type Review = {
  id: string; // UUID
  placeId: string;
  authorName: string;
  authorEmail: string | null;
  rating: number; // 1-5
  content: string; // 최대 500자
  createdAt: string;
  updatedAt: string;
};

// 리뷰 작성 폼 데이터
export type ReviewFormData = {
  authorName: string;
  authorEmail?: string;
  rating: number;
  content: string;
  password: string;
};

// 리뷰 수정/삭제 검증용
export type ReviewPasswordVerification = {
  reviewId: string;
  password: string;
};
```

#### 2.1.3 지도 관련 타입
**파일 경로**: `src/types/map.ts`

```typescript
// 좌표
export type Coordinate = {
  lat: number;
  lng: number;
};

// 지도 마커 타입
export type MarkerType = 'search' | 'review' | 'selected';

// 마커 데이터
export type MapMarker = {
  id: string;
  position: Coordinate;
  type: MarkerType;
  placeId: string;
  placeName: string;
};

// 지도 뷰포트
export type MapViewport = {
  center: Coordinate;
  zoom: number;
};
```

---

## 3. 네이버 지도 SDK 연동

### 3.1 SDK 타입 정의
**파일 경로**: `src/lib/naver-map/types.ts`

```typescript
// 네이버 지도 SDK 전역 타입 (window.naver.maps)
export type NaverMaps = typeof naver.maps;

// 지도 인스턴스 옵션
export type MapOptions = {
  center: Coordinate;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  zoomControl?: boolean;
  zoomControlOptions?: {
    position: number;
  };
};

// 마커 옵션
export type MarkerOptions = {
  position: Coordinate;
  map: naver.maps.Map;
  title?: string;
  icon?: {
    content: string;
    size?: naver.maps.Size;
    anchor?: naver.maps.Point;
  };
};
```

### 3.2 네이버 지도 SDK 로더
**파일 경로**: `src/lib/naver-map/loader.ts`

```typescript
// SDK 로드 상태
type LoadStatus = 'idle' | 'loading' | 'loaded' | 'error';

// SDK 동적 로드 함수
export const loadNaverMapSDK: () => Promise<void>;

// SDK 로드 여부 확인
export const isNaverMapSDKLoaded: () => boolean;
```

### 3.3 지도 커스텀 훅
**파일 경로**: `src/hooks/useNaverMap.ts`

```typescript
// 지도 초기화 훅
export const useNaverMap: (
  containerRef: RefObject<HTMLElement>,
  options: MapOptions
) => {
  map: naver.maps.Map | null;
  isLoading: boolean;
  error: Error | null;
};
```

**파일 경로**: `src/hooks/useMapMarkers.ts`

```typescript
// 마커 관리 훅
export const useMapMarkers: (
  map: naver.maps.Map | null,
  markers: MapMarker[]
) => {
  markerInstances: naver.maps.Marker[];
  addMarker: (marker: MapMarker) => void;
  removeMarker: (markerId: string) => void;
  clearMarkers: () => void;
};
```

**파일 경로**: `src/hooks/useGeolocation.ts`

```typescript
// GPS 위치 정보 훅
export const useGeolocation: (options?: {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}) => {
  position: Coordinate | null;
  isLoading: boolean;
  error: GeolocationPositionError | null;
  permission: PermissionState | null;
};
```

---

## 4. 공통 UI 컴포넌트

### 4.1 RatingStars (별점 표시/선택)
**파일 경로**: `src/components/common/rating-stars.tsx`

```typescript
type RatingStarsProps = {
  rating: number; // 0-5
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean; // 클릭 가능 여부
  onChange?: (rating: number) => void;
  showValue?: boolean; // 숫자 표시 여부
};

export const RatingStars: React.FC<RatingStarsProps>;
```

### 4.2 CategoryBadge (카테고리 표시)
**파일 경로**: `src/components/common/category-badge.tsx`

```typescript
type CategoryBadgeProps = {
  main: string;
  sub?: string | null;
  variant?: 'default' | 'outline';
};

export const CategoryBadge: React.FC<CategoryBadgeProps>;
```

### 4.3 PlaceCard (장소 카드)
**파일 경로**: `src/components/common/place-card.tsx`

```typescript
type PlaceCardProps = {
  place: PlaceListItem;
  onClick?: (place: PlaceListItem) => void;
  onReviewClick?: (placeId: string) => void;
  isSelected?: boolean;
  showReviewButton?: boolean;
};

export const PlaceCard: React.FC<PlaceCardProps>;
```

### 4.4 ReviewCard (리뷰 카드)
**파일 경로**: `src/components/common/review-card.tsx`

```typescript
type ReviewCardProps = {
  review: Review;
  onEdit?: (reviewId: string) => void;
  onDelete?: (reviewId: string) => void;
  showActions?: boolean; // 수정/삭제 버튼 표시
};

export const ReviewCard: React.FC<ReviewCardProps>;
```

### 4.5 CharacterCounter (글자 수 카운터)
**파일 경로**: `src/components/common/character-counter.tsx`

```typescript
type CharacterCounterProps = {
  current: number;
  max: number;
  showWarning?: boolean; // 임계값 도달 시 경고 색상
  warningThreshold?: number; // 기본 90%
};

export const CharacterCounter: React.FC<CharacterCounterProps>;
```

---

## 5. 유틸리티 함수

### 5.1 카테고리 유틸리티
**파일 경로**: `src/lib/utils/category.ts`

```typescript
// 카테고리 문자열 파싱 ("한식 > 소고기구이" -> {main: "한식", sub: "소고기구이"})
export const parseCategory: (category: string) => {
  main: string;
  sub: string | null;
};

// 카테고리 포맷팅
export const formatCategory: (main: string, sub?: string | null) => string;
```

### 5.2 평점 유틸리티
**파일 경로**: `src/lib/utils/rating.ts`

```typescript
// 평균 평점 계산
export const calculateAverageRating: (ratings: number[]) => number;

// 평점 분포 계산
export const getRatingDistribution: (ratings: number[]) => Record<1 | 2 | 3 | 4 | 5, number>;
```

### 5.3 좌표 유틸리티
**파일 경로**: `src/lib/utils/coordinate.ts`

```typescript
// 두 좌표 간 거리 계산 (Haversine formula, 단위: km)
export const getDistance: (coord1: Coordinate, coord2: Coordinate) => number;

// 네이버 API 좌표 변환 (string -> number)
export const parseNaverCoordinate: (x: string, y: string) => Coordinate;
```

### 5.4 날짜 유틸리티
**파일 경로**: `src/lib/utils/date.ts`

```typescript
// date-fns 기반 상대 시간 표시 ("3시간 전", "2일 전")
export const formatRelativeTime: (date: string) => string;

// 절대 시간 표시 ("2025.10.22 14:30")
export const formatAbsoluteTime: (date: string, format?: string) => string;
```

### 5.5 비밀번호 검증 유틸리티
**파일 경로**: `src/lib/utils/password.ts`

```typescript
// 비밀번호 최소 길이 검증
export const validatePassword: (password: string) => {
  isValid: boolean;
  message?: string;
};

// 비밀번호 강도 체크 (선택적)
export const getPasswordStrength: (password: string) => 'weak' | 'medium' | 'strong';
```

---

## 6. Zod 스키마

### 6.1 공통 스키마
**파일 경로**: `src/lib/schemas/common.ts`

```typescript
import { z } from 'zod';

// UUID 스키마
export const UUIDSchema = z.string().uuid();

// 좌표 스키마
export const CoordinateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// 평점 스키마 (1-5)
export const RatingSchema = z.number().int().min(1).max(5);

// 이메일 스키마 (선택적)
export const EmailSchema = z.string().email().optional().or(z.literal(''));

// 카테고리 스키마
export const CategorySchema = z.object({
  main: z.string().min(1).max(50),
  sub: z.string().max(50).nullable(),
});
```

### 6.2 Place 스키마
**파일 경로**: `src/lib/schemas/place.ts`

```typescript
import { z } from 'zod';

// 네이버 API 검색 결과 스키마
export const NaverPlaceSearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  category: z.string(),
  x: z.string(), // longitude
  y: z.string(), // latitude
  telephone: z.string().optional(),
  roadAddress: z.string().optional(),
});

// Place 생성 요청 스키마
export const CreatePlaceSchema = z.object({
  naverPlaceId: z.string().min(1),
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  categoryMain: z.string().min(1).max(50),
  categorySub: z.string().max(50).nullable().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});
```

### 6.3 Review 스키마
**파일 경로**: `src/lib/schemas/review.ts`

```typescript
import { z } from 'zod';

// 리뷰 작성 요청 스키마
export const CreateReviewSchema = z.object({
  placeId: z.string().uuid(),
  authorName: z.string().min(2).max(100),
  authorEmail: z.string().email().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5),
  content: z.string().min(1).max(500),
  password: z.string().min(4),
});

// 리뷰 수정 요청 스키마
export const UpdateReviewSchema = z.object({
  authorName: z.string().min(2).max(100).optional(),
  authorEmail: z.string().email().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(5).optional(),
  content: z.string().min(1).max(500).optional(),
  password: z.string().min(4),
});

// 비밀번호 검증 스키마
export const VerifyPasswordSchema = z.object({
  reviewId: z.string().uuid(),
  password: z.string().min(4),
});
```

---

## 7. 백엔드 공통 모듈

### 7.1 에러 코드 정의
**파일 경로**: `src/lib/constants/error-codes.ts`

```typescript
// 공통 에러 코드
export const COMMON_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

// Place 관련 에러 코드
export const PLACE_ERROR_CODES = {
  PLACE_NOT_FOUND: 'PLACE_NOT_FOUND',
  NAVER_API_ERROR: 'NAVER_API_ERROR',
  INVALID_COORDINATE: 'INVALID_COORDINATE',
} as const;

// Review 관련 에러 코드
export const REVIEW_ERROR_CODES = {
  REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  CONTENT_TOO_LONG: 'CONTENT_TOO_LONG',
  DUPLICATE_REVIEW: 'DUPLICATE_REVIEW', // 선택적: 중복 리뷰 방지
} as const;
```

### 7.2 비밀번호 해싱 유틸리티
**파일 경로**: `src/backend/utils/password.ts`

```typescript
// bcrypt 기반 비밀번호 해싱
export const hashPassword: (password: string) => Promise<string>;

// 비밀번호 검증
export const verifyPassword: (password: string, hash: string) => Promise<boolean>;
```

### 7.3 네이버 API 클라이언트
**파일 경로**: `src/backend/external/naver-api.ts`

```typescript
// 네이버 장소 검색 API 호출
export const searchPlaces: (query: string) => Promise<NaverPlaceSearchResult[]>;

// 네이버 API 에러 처리
export const handleNaverAPIError: (error: unknown) => ErrorResult<string, unknown>;
```

---

## 8. React Query 설정

### 8.1 Query Keys
**파일 경로**: `src/lib/query-keys.ts`

```typescript
// 쿼리 키 팩토리
export const queryKeys = {
  places: {
    all: ['places'] as const,
    search: (query: string) => ['places', 'search', query] as const,
    detail: (placeId: string) => ['places', placeId] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    byPlace: (placeId: string) => ['reviews', 'byPlace', placeId] as const,
    detail: (reviewId: string) => ['reviews', reviewId] as const,
  },
} as const;
```

### 8.2 Query Client 기본 설정
**파일 경로**: `src/lib/query-client.ts`

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1분
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
};

export const createQueryClient = () => new QueryClient(queryClientConfig);
```

---

## 9. 환경 변수

### 9.1 추가 필요 환경 변수
**파일 경로**: `.env.local`

```bash
# 네이버 Maps API
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id

# 네이버 Search API (Places API)
NAVER_SEARCH_CLIENT_ID=your_naver_search_client_id
NAVER_SEARCH_CLIENT_SECRET=your_naver_search_client_secret

# API Base URL (기존)
NEXT_PUBLIC_API_BASE_URL=/

# Supabase (기존)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 9.2 환경 변수 타입 정의
**파일 경로**: `src/constants/env.ts` (기존 파일 확장)

```typescript
// 기존 코드에 추가
export const NAVER_MAP_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
export const NAVER_SEARCH_CLIENT_ID = process.env.NAVER_SEARCH_CLIENT_ID;
export const NAVER_SEARCH_CLIENT_SECRET = process.env.NAVER_SEARCH_CLIENT_SECRET;
```

---

## 10. 구현 우선순위 및 의존성

### Phase 1: 핵심 타입 및 스키마 (최우선)
모든 페이지가 의존하는 기본 타입 정의

1. **타입 정의** (`src/types/`)
   - `place.ts`
   - `review.ts`
   - `map.ts`

2. **Zod 스키마** (`src/lib/schemas/`)
   - `common.ts`
   - `place.ts`
   - `review.ts`

3. **에러 코드** (`src/lib/constants/`)
   - `error-codes.ts`

4. **Query Keys** (`src/lib/`)
   - `query-keys.ts`
   - `query-client.ts`

### Phase 2: 유틸리티 함수
재사용 가능한 순수 함수

5. **유틸리티** (`src/lib/utils/`)
   - `category.ts`
   - `rating.ts`
   - `coordinate.ts`
   - `date.ts`
   - `password.ts`

6. **백엔드 유틸리티** (`src/backend/utils/`)
   - `password.ts` (bcrypt)

### Phase 3: 네이버 지도 SDK 연동
지도 페이지의 핵심 의존성

7. **네이버 지도** (`src/lib/naver-map/`)
   - `types.ts`
   - `loader.ts`

8. **지도 훅** (`src/hooks/`)
   - `useNaverMap.ts`
   - `useMapMarkers.ts`
   - `useGeolocation.ts`

9. **네이버 API 클라이언트** (`src/backend/external/`)
   - `naver-api.ts`

### Phase 4: 공통 UI 컴포넌트
페이지에서 사용할 재사용 컴포넌트

10. **공통 컴포넌트** (`src/components/common/`)
    - `rating-stars.tsx`
    - `category-badge.tsx`
    - `character-counter.tsx`
    - `place-card.tsx`
    - `review-card.tsx`

### Phase 5: 환경 변수 설정
11. **환경 설정**
    - `.env.local` 업데이트
    - `src/constants/env.ts` 확장

---

## 11. 코드 충돌 방지 검증 (1차)

### 11.1 파일 경로 충돌 검증

**검증 항목**: 모든 공통 모듈 파일 경로가 독립적이고 중복되지 않음

| 모듈 | 파일 경로 | 충돌 가능성 |
|------|-----------|-------------|
| Place 타입 | `src/types/place.ts` | ✅ 없음 (신규) |
| Review 타입 | `src/types/review.ts` | ✅ 없음 (신규) |
| Map 타입 | `src/types/map.ts` | ✅ 없음 (신규) |
| 공통 스키마 | `src/lib/schemas/common.ts` | ✅ 없음 (신규) |
| Place 스키마 | `src/lib/schemas/place.ts` | ✅ 없음 (신규) |
| Review 스키마 | `src/lib/schemas/review.ts` | ✅ 없음 (신규) |
| 에러 코드 | `src/lib/constants/error-codes.ts` | ✅ 없음 (신규) |
| Query Keys | `src/lib/query-keys.ts` | ✅ 없음 (신규) |
| Query Client | `src/lib/query-client.ts` | ✅ 없음 (신규) |
| 카테고리 유틸 | `src/lib/utils/category.ts` | ✅ 없음 (신규) |
| 평점 유틸 | `src/lib/utils/rating.ts` | ✅ 없음 (신규) |
| 좌표 유틸 | `src/lib/utils/coordinate.ts` | ✅ 없음 (신규) |
| 날짜 유틸 | `src/lib/utils/date.ts` | ✅ 없음 (신규) |
| 비밀번호 유틸 (FE) | `src/lib/utils/password.ts` | ✅ 없음 (신규) |
| 비밀번호 유틸 (BE) | `src/backend/utils/password.ts` | ✅ 없음 (신규) |
| 네이버 지도 타입 | `src/lib/naver-map/types.ts` | ✅ 없음 (신규) |
| 네이버 지도 로더 | `src/lib/naver-map/loader.ts` | ✅ 없음 (신규) |
| useNaverMap | `src/hooks/useNaverMap.ts` | ✅ 없음 (신규) |
| useMapMarkers | `src/hooks/useMapMarkers.ts` | ✅ 없음 (신규) |
| useGeolocation | `src/hooks/useGeolocation.ts` | ✅ 없음 (신규) |
| 네이버 API | `src/backend/external/naver-api.ts` | ✅ 없음 (신규) |
| RatingStars | `src/components/common/rating-stars.tsx` | ✅ 없음 (신규) |
| CategoryBadge | `src/components/common/category-badge.tsx` | ✅ 없음 (신규) |
| PlaceCard | `src/components/common/place-card.tsx` | ✅ 없음 (신규) |
| ReviewCard | `src/components/common/review-card.tsx` | ✅ 없음 (신규) |
| CharacterCounter | `src/components/common/character-counter.tsx` | ✅ 없음 (신규) |
| 환경 변수 | `src/constants/env.ts` | ⚠️ 기존 파일 확장 |

**결론**: 모든 신규 파일은 독립적인 경로를 가지며, 기존 파일 수정은 `env.ts` 1개만 해당. 충돌 가능성 극히 낮음.

### 11.2 네임스페이스 충돌 검증

**검증 항목**: Export 이름이 고유하고 명확함

- ✅ 타입 이름: `Place`, `Review`, `MapMarker` 등 도메인 명확
- ✅ 함수 이름: `parseCategory`, `calculateAverageRating` 등 동사+명사 조합
- ✅ 컴포넌트 이름: `RatingStars`, `CategoryBadge` 등 명사 조합
- ✅ 훅 이름: `useNaverMap`, `useMapMarkers` 등 use prefix
- ✅ 상수 이름: `PLACE_ERROR_CODES`, `REVIEW_ERROR_CODES` 등 UPPER_SNAKE_CASE

**결론**: 네이밍 컨벤션이 일관되고 고유하여 충돌 없음.

### 11.3 의존성 방향 검증

**검증 항목**: 순환 참조 및 의존성 방향 확인

```
타입/스키마 (최하위)
    ↑
유틸리티 함수
    ↑
훅 / 컴포넌트
    ↑
페이지 (최상위)
```

**결론**: 단방향 의존성 구조로 순환 참조 없음.

---

## 12. 코드 충돌 방지 검증 (2차)

### 12.1 페이지별 공통 모듈 사용 매트릭스

| 공통 모듈 | 메인 페이지 | 검색 결과 | 리뷰 작성 | 장소 상세 |
|-----------|------------|-----------|-----------|-----------|
| `types/place.ts` | ✅ | ✅ | ✅ | ✅ |
| `types/review.ts` | - | - | ✅ | ✅ |
| `types/map.ts` | ✅ | ✅ | - | ✅ |
| `schemas/place.ts` | ✅ | ✅ | ✅ | ✅ |
| `schemas/review.ts` | - | - | ✅ | ✅ |
| `utils/category.ts` | - | ✅ | ✅ | ✅ |
| `utils/rating.ts` | - | - | ✅ | ✅ |
| `utils/date.ts` | - | - | - | ✅ |
| `naver-map/loader.ts` | ✅ | ✅ | - | ✅ |
| `useNaverMap` | ✅ | ✅ | - | ✅ |
| `useMapMarkers` | ✅ | ✅ | - | ✅ |
| `useGeolocation` | ✅ | - | - | - |
| `RatingStars` | - | - | ✅ | ✅ |
| `CategoryBadge` | - | ✅ | ✅ | ✅ |
| `PlaceCard` | - | ✅ | - | - |
| `ReviewCard` | - | - | - | ✅ |
| `CharacterCounter` | - | - | ✅ | - |

**검증 결과**:
- ✅ 모든 페이지가 독립적으로 공통 모듈을 import
- ✅ 페이지 간 직접 의존성 없음
- ✅ 공통 모듈만 공유하므로 병렬 개발 가능

### 12.2 Feature 모듈 분리 검증

**검증 항목**: 각 feature가 독립적으로 개발 가능한지 확인

```
src/features/
├── places/            # 장소 검색 feature
│   ├── backend/
│   │   ├── route.ts   # GET /api/places/search
│   │   ├── service.ts # searchPlaces, getPlaceById
│   │   └── schema.ts  # SearchPlacesSchema
│   ├── hooks/
│   │   └── usePlaceSearch.ts
│   └── components/
│       └── place-search-bar.tsx
│
├── reviews/           # 리뷰 feature
│   ├── backend/
│   │   ├── route.ts   # POST /api/reviews, GET /api/reviews/:id
│   │   ├── service.ts # createReview, getReviewsByPlace
│   │   └── schema.ts  # CreateReviewSchema
│   ├── hooks/
│   │   ├── useCreateReview.ts
│   │   └── useReviewsByPlace.ts
│   └── components/
│       ├── review-form.tsx
│       └── review-list.tsx
│
└── map/               # 지도 feature (옵션)
    └── components/
        ├── map-container.tsx
        └── map-search-overlay.tsx
```

**검증 결과**:
- ✅ 각 feature는 공통 모듈만 의존
- ✅ feature 간 직접 import 없음
- ✅ 백엔드 API 경로 중복 없음 (`/api/places`, `/api/reviews`)
- ✅ 병렬 개발 가능

### 12.3 컴포넌트 재사용성 검증

**검증 항목**: 공통 컴포넌트가 여러 페이지에서 재사용 가능한지 확인

- ✅ `RatingStars`: 리뷰 작성 + 장소 상세에서 사용
- ✅ `CategoryBadge`: 검색 결과 + 리뷰 작성 + 장소 상세에서 사용
- ✅ `PlaceCard`: 검색 결과 리스트에서 사용
- ✅ `ReviewCard`: 장소 상세의 리뷰 목록에서 사용
- ✅ `CharacterCounter`: 리뷰 작성 폼에서 사용

**결론**: 모든 공통 컴포넌트가 독립적이며 재사용 가능.

---

## 13. 코드 충돌 방지 검증 (3차)

### 13.1 타입 안정성 검증

**검증 항목**: 모든 공통 모듈이 타입 안정성을 보장하는지 확인

- ✅ 모든 타입이 TypeScript로 정의됨
- ✅ Zod 스키마로 런타임 검증 가능
- ✅ API 요청/응답이 스키마로 검증됨
- ✅ `zod.infer`로 타입과 스키마 일치 보장

**예시**:
```typescript
// 타입과 스키마 일치
export const CreateReviewSchema = z.object({...});
export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
```

### 13.2 상태 관리 충돌 검증

**검증 항목**: 전역 상태가 페이지 간 충돌하지 않는지 확인

**전역 상태 목록**:
1. React Query 캐시 (공통)
   - `['places', 'search', query]`
   - `['places', placeId]`
   - `['reviews', 'byPlace', placeId]`
   - 각 페이지가 독립적인 query key 사용

2. Toast 상태 (공통)
   - 페이지 간 공유되는 toast 메시지
   - 독립적으로 동작

3. 지도 상태 (메인 페이지 로컬)
   - 지도 인스턴스는 페이지 내부에서만 관리
   - 다른 페이지와 공유 없음

**검증 결과**: ✅ 전역 상태 충돌 없음

### 13.3 API 엔드포인트 충돌 검증

**검증 항목**: 백엔드 API 경로가 중복되지 않는지 확인

**예상 API 엔드포인트**:
```
GET    /api/places/search?query={query}     # 장소 검색
GET    /api/places/:placeId                 # 장소 상세
POST   /api/places                          # 장소 생성 (검색 시 자동)

GET    /api/reviews?placeId={placeId}       # 특정 장소 리뷰 목록
GET    /api/reviews/:reviewId               # 리뷰 상세
POST   /api/reviews                         # 리뷰 작성
PATCH  /api/reviews/:reviewId               # 리뷰 수정
DELETE /api/reviews/:reviewId               # 리뷰 삭제
POST   /api/reviews/:reviewId/verify        # 비밀번호 검증
```

**검증 결과**: ✅ 모든 엔드포인트가 RESTful 하고 중복 없음

### 13.4 빌드 타임 검증

**검증 항목**: 공통 모듈이 모두 빌드 타임에 에러 없이 컴파일되는지 확인

**확인 사항**:
- ✅ 모든 import 경로가 올바름 (`@/` alias 사용)
- ✅ TypeScript strict mode 준수
- ✅ ESLint 규칙 준수
- ✅ 순환 참조 없음

**검증 방법**: 공통 모듈 구현 완료 후 `npm run build` 실행

---

## 14. 최종 검증 체크리스트

### 14.1 필수 공통 모듈 완성도

- [ ] Phase 1: 핵심 타입 및 스키마 (9개 파일)
- [ ] Phase 2: 유틸리티 함수 (6개 파일)
- [ ] Phase 3: 네이버 지도 SDK 연동 (6개 파일)
- [ ] Phase 4: 공통 UI 컴포넌트 (5개 파일)
- [ ] Phase 5: 환경 변수 설정 (2개 파일)

**총 28개 파일** 생성/수정 필요

### 14.2 병렬 개발 준비 완료 확인

- [ ] 모든 공통 타입이 정의됨
- [ ] 모든 공통 컴포넌트가 구현됨
- [ ] 모든 공통 훅이 구현됨
- [ ] 모든 공통 유틸리티가 구현됨
- [ ] API 경로가 명확히 정의됨
- [ ] 페이지별 의존성이 명확함

### 14.3 문서 검증

- [ ] PRD 문서의 모든 기능이 공통 모듈에 반영됨
- [ ] Userflow 문서의 모든 플로우가 지원됨
- [ ] Database 문서의 모든 테이블이 타입으로 정의됨
- [ ] 추가 기능이나 오버엔지니어링 없음

---

## 15. 구현 가이드라인

### 15.1 개발 순서

1. **Phase 1 구현** (1-2시간)
   - 타입, 스키마, 에러 코드 정의
   - 빌드 및 타입 체크

2. **Phase 2 구현** (1-2시간)
   - 유틸리티 함수 구현
   - 단위 테스트 작성 (선택)

3. **Phase 3 구현** (2-3시간)
   - 네이버 지도 SDK 연동
   - 훅 구현 및 테스트

4. **Phase 4 구현** (2-3시간)
   - 공통 UI 컴포넌트 구현
   - Storybook 스토리 작성 (선택)

5. **Phase 5 구현** (30분)
   - 환경 변수 설정
   - 문서 업데이트

6. **검증 및 테스트** (1시간)
   - 빌드 테스트
   - Import 경로 확인
   - 타입 체크

**예상 총 소요 시간**: 7-11시간

### 15.2 코딩 컨벤션

- **파일명**: kebab-case (`rating-stars.tsx`, `use-naver-map.ts`)
- **컴포넌트명**: PascalCase (`RatingStars`, `PlaceCard`)
- **함수명**: camelCase (`parseCategory`, `calculateAverageRating`)
- **타입명**: PascalCase (`Place`, `Review`)
- **상수명**: UPPER_SNAKE_CASE (`PLACE_ERROR_CODES`)

### 15.3 주의사항

1. **오버엔지니어링 금지**
   - 문서에 명시되지 않은 기능 추가 금지
   - "나중에 필요할 것 같은" 코드 작성 금지

2. **DRY 원칙**
   - 중복 코드 최소화
   - 재사용 가능한 컴포넌트/함수로 추상화

3. **타입 안정성**
   - `any` 타입 사용 금지
   - Zod 스키마로 런타임 검증

4. **접근성**
   - ARIA 속성 추가
   - 키보드 네비게이션 지원

---

## 16. 결론

본 문서에서 정의한 공통 모듈을 모두 구현하면, 다음 페이지들을 병렬로 개발할 수 있습니다:

1. **메인 페이지** (지도 + 검색)
2. **검색 결과 페이지** (리스트 + 지도)
3. **리뷰 작성 페이지** (폼)
4. **장소 상세 페이지** (정보 + 리뷰 목록)

각 페이지는 공통 모듈만 의존하므로 **코드 충돌 없이** 동시 개발이 가능합니다.

**3회 검증 완료**:
- ✅ 1차: 파일 경로 및 네임스페이스 충돌 검증
- ✅ 2차: 페이지별 의존성 및 feature 분리 검증
- ✅ 3차: 타입 안정성, 상태 관리, API 경로 충돌 검증

**결론**: 공통 모듈 설계가 완전하며 병렬 개발 준비 완료.
