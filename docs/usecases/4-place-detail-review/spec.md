# UseCase 4: 장소 상세 정보 및 리뷰 조회

## 개요

사용자가 지도에서 특정 장소를 선택했을 때, 해당 장소의 상세 정보와 사용자들이 작성한 리뷰를 조회하는 기능입니다.

## 액터

- **사용자**: 장소 정보와 리뷰를 조회하는 일반 사용자
- **시스템**: 장소 정보와 리뷰 데이터를 제공하는 백엔드 시스템

## 사전 조건

- 사용자가 애플리케이션에 접속되어 있음
- 조회하려는 장소가 시스템에 등록되어 있음

## 사후 조건

- 사용자에게 장소의 상세 정보가 표시됨
- 해당 장소의 리뷰 목록이 시간순으로 표시됨
- 리뷰 통계 정보(평균 평점, 총 리뷰 수)가 계산되어 표시됨

## 주요 시나리오

### 1. 장소 상세 정보 조회

1. 사용자가 지도에서 장소를 클릭하거나 장소 ID를 통해 접근
2. 시스템이 장소 ID의 유효성을 검증
3. 시스템이 데이터베이스에서 장소 정보를 조회
4. 장소 정보가 존재하면 다음 정보를 반환:
   - 장소 ID
   - 장소 이름
   - 주소
   - 카테고리/유형
   - 위도/경도
   - 대표 이미지
   - 설명
   - 운영 시간
   - 연락처
   - 등록일/수정일

### 2. 리뷰 목록 조회

1. 시스템이 해당 장소 ID로 등록된 모든 리뷰를 조회
2. 리뷰를 작성일 기준 내림차순으로 정렬
3. 각 리뷰에 대해 다음 정보를 포함:
   - 리뷰 ID
   - 작성자 정보 (이름, 프로필 이미지)
   - 평점 (1-5점)
   - 리뷰 내용
   - 리뷰 이미지 (선택)
   - 작성일
   - 수정일 (수정된 경우)
4. 페이지네이션 정보와 함께 반환:
   - 현재 페이지
   - 페이지당 항목 수 (기본: 10개)
   - 전체 리뷰 수

### 3. 리뷰 통계 계산

1. 시스템이 해당 장소의 모든 리뷰를 분석
2. 다음 통계 정보를 계산:
   - 평균 평점 (소수점 1자리)
   - 전체 리뷰 수
   - 평점별 리뷰 분포 (5점, 4점, 3점, 2점, 1점 각각의 개수)
3. 계산된 통계를 응답에 포함

## 대체 시나리오

### A1. 장소가 존재하지 않는 경우

1. 시스템이 제공된 장소 ID로 데이터를 찾을 수 없음
2. 404 에러와 함께 "장소를 찾을 수 없습니다" 메시지 반환
3. 사용자에게 에러 메시지 표시

### A2. 리뷰가 없는 경우

1. 장소 정보는 존재하지만 작성된 리뷰가 없음
2. 장소 정보는 정상적으로 반환
3. 리뷰 목록은 빈 배열로 반환
4. 통계 정보는 기본값으로 설정:
   - 평균 평점: 0
   - 전체 리뷰 수: 0
   - 평점별 분포: 모두 0

### A3. 잘못된 장소 ID 형식

1. 제공된 장소 ID가 UUID 형식이 아님
2. 400 에러와 함께 "유효하지 않은 장소 ID입니다" 메시지 반환
3. 사용자에게 에러 메시지 표시

### A4. 데이터베이스 조회 실패

1. 네트워크 오류 또는 데이터베이스 문제로 조회 실패
2. 500 에러와 함께 "일시적인 오류가 발생했습니다" 메시지 반환
3. 에러 로그 기록
4. 사용자에게 재시도 안내

## 데이터 모델

### Places 테이블

```sql
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  category text,
  latitude decimal(10, 8) not null,
  longitude decimal(11, 8) not null,
  image_url text,
  description text,
  operating_hours jsonb,
  contact text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Reviews 테이블

```sql
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  user_id uuid not null,
  user_name text not null,
  user_avatar_url text,
  rating integer not null check (rating >= 1 and rating <= 5),
  content text not null,
  images jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reviews_place_id on public.reviews(place_id);
create index if not exists idx_reviews_created_at on public.reviews(created_at desc);
```

## API 명세

### 엔드포인트

```
GET /api/places/:placeId
```

### 요청 파라미터

- `placeId` (path parameter): UUID - 조회할 장소의 고유 ID
- `page` (query parameter): number - 리뷰 페이지 번호 (기본값: 1)
- `limit` (query parameter): number - 페이지당 리뷰 수 (기본값: 10, 최대: 50)

### 응답 형식

#### 성공 응답 (200 OK)

```typescript
{
  ok: true,
  data: {
    place: {
      id: string;              // UUID
      name: string;
      address: string;
      category: string | null;
      latitude: number;
      longitude: number;
      imageUrl: string | null;
      description: string | null;
      operatingHours: object | null;
      contact: string | null;
      createdAt: string;       // ISO 8601
      updatedAt: string;       // ISO 8601
    },
    reviews: {
      items: Array<{
        id: string;            // UUID
        userId: string;        // UUID
        userName: string;
        userAvatarUrl: string | null;
        rating: number;        // 1-5
        content: string;
        images: string[] | null;
        createdAt: string;     // ISO 8601
        updatedAt: string;     // ISO 8601
      }>,
      pagination: {
        currentPage: number;
        pageSize: number;
        totalCount: number;
        totalPages: number;
      }
    },
    statistics: {
      averageRating: number;   // 소수점 1자리
      totalReviews: number;
      ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
      }
    }
  }
}
```

#### 에러 응답

**400 Bad Request - 잘못된 장소 ID**
```typescript
{
  ok: false,
  status: 400,
  error: {
    code: "INVALID_PLACE_ID",
    message: "유효하지 않은 장소 ID입니다.",
    details: { /* zod validation errors */ }
  }
}
```

**404 Not Found - 장소를 찾을 수 없음**
```typescript
{
  ok: false,
  status: 404,
  error: {
    code: "PLACE_NOT_FOUND",
    message: "장소를 찾을 수 없습니다."
  }
}
```

**500 Internal Server Error - 서버 오류**
```typescript
{
  ok: false,
  status: 500,
  error: {
    code: "DATABASE_ERROR",
    message: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
  }
}
```

## 비기능 요구사항

### 성능

- 장소 정보 조회는 100ms 이내에 응답
- 리뷰 목록 조회는 200ms 이내에 응답
- 데이터베이스 쿼리 최적화를 위한 인덱스 활용

### 보안

- SQL Injection 방지를 위한 파라미터화된 쿼리 사용
- 입력값 검증 (Zod 스키마 활용)
- 민감한 사용자 정보 노출 방지

### 확장성

- 리뷰 수가 많은 장소를 위한 페이지네이션 구현
- 캐싱 전략 고려 (자주 조회되는 장소 정보)
- 읽기 전용 복제본 활용 가능

### 사용성

- 명확한 에러 메시지 제공
- 리뷰가 없는 경우에도 적절한 UI 표시
- 로딩 상태 표시

## 구현 가이드라인

### 백엔드 구조

```
src/features/place-detail/
├── backend/
│   ├── route.ts          # Hono 라우터 정의
│   ├── service.ts        # Supabase 조회 로직
│   ├── schema.ts         # Zod 스키마 정의
│   └── error.ts          # 에러 코드 정의
├── components/
│   ├── PlaceDetailCard.tsx
│   ├── ReviewList.tsx
│   ├── ReviewItem.tsx
│   └── RatingStatistics.tsx
├── hooks/
│   ├── usePlaceDetail.ts
│   └── useReviews.ts
└── lib/
    └── dto.ts            # 스키마 재노출
```

### 주요 함수

**service.ts**
- `getPlaceById(supabase, placeId)`: 장소 정보 조회
- `getReviewsByPlaceId(supabase, placeId, page, limit)`: 리뷰 목록 조회
- `calculateReviewStatistics(supabase, placeId)`: 리뷰 통계 계산

**route.ts**
- `GET /api/places/:placeId`: 장소 상세 정보 및 리뷰 조회 엔드포인트

### React Query 훅

```typescript
// usePlaceDetail.ts
export const usePlaceDetail = (placeId: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['place-detail', placeId, page, limit],
    queryFn: () => apiClient.get(`/api/places/${placeId}`, { page, limit }),
    staleTime: 5 * 60 * 1000, // 5분
  });
};
```

## 테스트 시나리오

### 단위 테스트

1. `getPlaceById` 함수 테스트
   - 유효한 장소 ID로 조회 성공
   - 존재하지 않는 장소 ID로 조회 실패
   - 데이터베이스 오류 처리

2. `getReviewsByPlaceId` 함수 테스트
   - 페이지네이션 정상 동작
   - 리뷰가 없는 경우 빈 배열 반환
   - 정렬 순서 확인

3. `calculateReviewStatistics` 함수 테스트
   - 평균 평점 계산 정확성
   - 평점 분포 계산 정확성
   - 리뷰가 없는 경우 기본값 반환

### 통합 테스트

1. 전체 엔드포인트 테스트
   - 장소 정보 + 리뷰 + 통계 모두 포함된 응답
   - 다양한 페이지네이션 케이스
   - 에러 케이스별 적절한 응답 코드

### E2E 테스트

1. 사용자 시나리오
   - 지도에서 장소 클릭 → 상세 정보 페이지 표시
   - 리뷰 목록 스크롤 및 페이지네이션
   - 통계 정보 정확히 표시

## 참고사항

- 이미지 URL은 외부 CDN 또는 Supabase Storage 사용
- 운영 시간은 JSONB 형식으로 저장하여 유연성 확보
- 리뷰 이미지도 배열 형태로 저장
- 사용자 정보는 별도 users 테이블과 조인 가능 (현재는 비정규화)
- 캐싱 전략은 추후 Redis 등 도입 고려
