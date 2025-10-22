# 장소 상세 페이지 구현 계획서

## 문서 정보
- **페이지명**: 장소 상세 페이지 (Place Detail Page)
- **경로**: `/place/[id]`
- **작성일**: 2025-10-22
- **버전**: 1.0

---

## 1. 개요

### 1.1 페이지 목적
사용자가 선택한 장소의 상세 정보와 해당 장소에 작성된 모든 리뷰를 조회할 수 있는 페이지입니다. 리뷰 통계, 평점 분포, 리뷰 목록을 제공하며 리뷰 작성 페이지로 이동할 수 있는 진입점을 제공합니다.

### 1.2 주요 기능
- URL 경로 파라미터로 전달된 `placeId`를 통해 장소 정보 로드
- 장소 기본 정보 표시: 이름, 주소, 카테고리, 대표 이미지
- 리뷰 통계 표시: 평균 평점, 총 리뷰 수, 평점별 분포
- 리뷰 목록 표시: 초기 5개, 무한 스크롤 또는 "더보기" 버튼으로 추가 로드
- 리뷰 작성 버튼: `/review/new?placeId={id}`로 이동
- 리뷰 개별 항목에서 수정/삭제 기능 (비밀번호 검증)
- 지도 미니뷰 표시 (선택적)

### 1.3 관련 UseCase
- **UC-03**: 검색 결과에서 장소 선택 (`docs/usecases/3-search-result-selection/spec.md`)
- **UC-04**: 장소 상세 정보 및 리뷰 조회 (`docs/usecases/4-place-detail-review/spec.md`)
- **UC-05**: 전체 리뷰 펼치기 (`docs/usecases/5-review-expand/spec.md`)
- **UC-09**: 마커 툴팁 인터랙션 (`docs/usecases/9-marker-tooltip/spec.md`)
- **UC-11**: 리뷰 수정/삭제 (`docs/usecases/11-review-edit-delete/spec.md`)

### 1.4 관련 문서
- **공통 모듈**: `docs/common-modules.md`
- **데이터베이스 스키마**: `docs/database.md`

---

## 2. 의존성 분석

### 2.1 공통 모듈 의존성 (Phase 1-4 완료 필요)

#### 필수 타입 (Phase 1)
```typescript
// src/types/place.ts
import { Place, PlaceListItem } from '@/types/place';

// src/types/review.ts
import { Review } from '@/types/review';
```

#### 필수 UI 컴포넌트 (Phase 4)
```typescript
// src/components/common/rating-stars.tsx
import { RatingStars } from '@/components/common/rating-stars';

// src/components/common/category-badge.tsx
import { CategoryBadge } from '@/components/common/category-badge';

// src/components/common/review-card.tsx
import { ReviewCard } from '@/components/common/review-card';
```

#### 필수 유틸리티 (Phase 2)
```typescript
// src/lib/utils/rating.ts
import { calculateAverageRating, getRatingDistribution } from '@/lib/utils/rating';

// src/lib/utils/date.ts
import { formatRelativeTime } from '@/lib/utils/date';

// src/lib/utils/category.ts
import { formatCategory } from '@/lib/utils/category';
```

#### React Query 설정 (Phase 1)
```typescript
// src/lib/query-keys.ts
import { queryKeys } from '@/lib/query-keys';
```

### 2.2 외부 라이브러리
- `next` (14+): App Router, Dynamic Routes
- `react` (19): 컴포넌트, Hooks
- `@tanstack/react-query`: 서버 상태 관리, 무한 쿼리
- `react-intersection-observer`: 무한 스크롤 구현 (선택적)
- `lucide-react`: 아이콘 (뒤로가기, 별, 리뷰 작성 등)
- `shadcn-ui` 컴포넌트: `Button`, `Card`, `Separator`, `Skeleton`

### 2.3 백엔드 API 의존성
```typescript
// src/features/place/backend/route.ts
// GET /api/places/:placeId - 장소 정보 조회

// src/features/review/backend/route.ts
// GET /api/reviews?placeId={id}&page={N}&limit={M} - 리뷰 목록 조회
// DELETE /api/reviews/:reviewId - 리뷰 삭제 (비밀번호 검증)
```

---

## 3. 구현 단계 (Implementation Phases)

### Phase 1: 백엔드 API 구현 (선행 작업)
**목표**: 장소 상세 정보 및 리뷰 목록 조회 API 구현

#### 1.1 장소 정보 조회 API (확장)
**파일**: `src/features/place/backend/route.ts`, `service.ts`, `schema.ts`

**구현 내용**:
1. **스키마 정의** (`schema.ts`):
   ```typescript
   // src/features/place/backend/schema.ts
   import { z } from 'zod';

   export const GetPlaceResponseSchema = z.object({
     place: z.object({
       id: z.string().uuid(),
       name: z.string(),
       address: z.string(),
       categoryMain: z.string(),
       categorySub: z.string().nullable(),
       latitude: z.number(),
       longitude: z.number(),
       photoUrl: z.string().nullable().optional(),
       createdAt: z.string(),
       updatedAt: z.string(),
     }),
     statistics: z.object({
       averageRating: z.number(),
       totalReviews: z.number(),
       ratingDistribution: z.object({
         1: z.number(),
         2: z.number(),
         3: z.number(),
         4: z.number(),
         5: z.number(),
       }),
     }),
   });
   ```

2. **서비스 로직** (`service.ts`):
   ```typescript
   // src/features/place/backend/service.ts
   import type { SupabaseClient } from '@supabase/supabase-js';
   import { success, failure } from '@/backend/http/response';

   export async function getPlaceWithStatistics(
     supabase: SupabaseClient,
     placeId: string
   ) {
     // 1. 장소 정보 조회
     const { data: place, error: placeError } = await supabase
       .from('places')
       .select('id, naver_place_id, name, address, category_main, category_sub, latitude, longitude, created_at, updated_at')
       .eq('id', placeId)
       .single();

     if (placeError || !place) {
       return failure('PLACE_NOT_FOUND', 'Place not found');
     }

     // 2. 리뷰 통계 조회
     const { data: reviews, error: reviewsError } = await supabase
       .from('reviews')
       .select('rating')
       .eq('place_id', placeId);

     if (reviewsError) {
       return failure('INTERNAL_ERROR', reviewsError.message);
     }

     // 3. 통계 계산
     const ratings = reviews.map((r) => r.rating);
     const averageRating = ratings.length > 0
       ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
       : 0;

     const ratingDistribution = {
       1: ratings.filter((r) => r === 1).length,
       2: ratings.filter((r) => r === 2).length,
       3: ratings.filter((r) => r === 3).length,
       4: ratings.filter((r) => r === 4).length,
       5: ratings.filter((r) => r === 5).length,
     };

     return success({
       place: {
         id: place.id,
         name: place.name,
         address: place.address,
         categoryMain: place.category_main,
         categorySub: place.category_sub,
         latitude: place.latitude,
         longitude: place.longitude,
         createdAt: place.created_at,
         updatedAt: place.updated_at,
       },
       statistics: {
         averageRating: Math.round(averageRating * 10) / 10,
         totalReviews: ratings.length,
         ratingDistribution,
       },
     });
   }
   ```

3. **Hono 라우터** (`route.ts`):
   ```typescript
   // src/features/place/backend/route.ts
   import { Hono } from 'hono';
   import { getPlaceWithStatistics } from './service';
   import { respond } from '@/backend/http/response';

   export function registerPlaceRoutes(app: Hono) {
     app.get('/api/places/:placeId', async (c) => {
       const placeId = c.req.param('placeId');
       const supabase = c.get('supabase');
       const logger = c.get('logger');

       logger.info('Fetching place with statistics', { placeId });

       const result = await getPlaceWithStatistics(supabase, placeId);
       return respond(c, result);
     });
   }
   ```

#### 1.2 리뷰 목록 조회 API (페이지네이션)
**파일**: `src/features/review/backend/route.ts`, `service.ts`, `schema.ts`

**구현 내용**:
1. **스키마 정의** (`schema.ts`):
   ```typescript
   // src/features/review/backend/schema.ts
   export const GetReviewsQuerySchema = z.object({
     placeId: z.string().uuid(),
     page: z.coerce.number().int().min(1).optional().default(1),
     limit: z.coerce.number().int().min(1).max(20).optional().default(10),
   });

   export const GetReviewsResponseSchema = z.object({
     items: z.array(z.object({
       id: z.string().uuid(),
       authorName: z.string(),
       authorEmail: z.string().nullable(),
       rating: z.number().int().min(1).max(5),
       content: z.string(),
       createdAt: z.string(),
       updatedAt: z.string(),
     })),
     pagination: z.object({
       currentPage: z.number(),
       pageSize: z.number(),
       totalCount: z.number(),
       totalPages: z.number(),
       hasNextPage: z.boolean(),
     }),
   });
   ```

2. **서비스 로직** (`service.ts`):
   ```typescript
   // src/features/review/backend/service.ts
   export async function getReviewsByPlace(
     supabase: SupabaseClient,
     placeId: string,
     page: number = 1,
     limit: number = 10
   ) {
     const offset = (page - 1) * limit;

     // 1. 전체 개수 조회
     const { count, error: countError } = await supabase
       .from('reviews')
       .select('id', { count: 'exact', head: true })
       .eq('place_id', placeId);

     if (countError) {
       return failure('INTERNAL_ERROR', countError.message);
     }

     const totalCount = count || 0;

     // 2. 리뷰 목록 조회
     const { data: reviews, error } = await supabase
       .from('reviews')
       .select('id, author_name, author_email, rating, content, created_at, updated_at')
       .eq('place_id', placeId)
       .order('created_at', { ascending: false })
       .range(offset, offset + limit - 1);

     if (error) {
       return failure('INTERNAL_ERROR', error.message);
     }

     const totalPages = Math.ceil(totalCount / limit);
     const hasNextPage = page < totalPages;

     return success({
       items: reviews.map((r) => ({
         id: r.id,
         authorName: r.author_name,
         authorEmail: r.author_email,
         rating: r.rating,
         content: r.content,
         createdAt: r.created_at,
         updatedAt: r.updated_at,
       })),
       pagination: {
         currentPage: page,
         pageSize: limit,
         totalCount,
         totalPages,
         hasNextPage,
       },
     });
   }
   ```

3. **Hono 라우터** (`route.ts`):
   ```typescript
   // src/features/review/backend/route.ts (추가)
   app.get('/api/reviews', async (c) => {
     const query = c.req.query();
     const validated = GetReviewsQuerySchema.parse(query);
     const supabase = c.get('supabase');

     const result = await getReviewsByPlace(
       supabase,
       validated.placeId,
       validated.page,
       validated.limit
     );

     return respond(c, result);
   });
   ```

**코드베이스 충돌 체크**: ✅ 기존 place/review features가 있다면 확장, 없다면 신규 생성

---

### Phase 2: 프론트엔드 기본 구조
**목표**: 페이지 라우팅 및 기본 레이아웃 구성

#### 2.1 페이지 파일 생성
**파일**: `src/app/place/[id]/page.tsx`

**구현 내용**:
```typescript
// src/app/place/[id]/page.tsx
'use client';

import { Suspense } from 'react';
import { PlaceDetailPageContent } from '@/features/place/components/place-detail-page';

export default async function PlaceDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <PlaceDetailPageContent placeId={params.id} />
    </Suspense>
  );
}
```

#### 2.2 Feature 디렉토리 구조 생성
```
src/features/place/
├── components/
│   ├── place-detail-page.tsx           # 메인 페이지 컴포넌트
│   ├── place-info-header.tsx           # 장소 정보 헤더
│   ├── place-statistics.tsx            # 평점 통계 섹션
│   ├── rating-distribution.tsx         # 평점 분포 차트
│   └── place-map-preview.tsx           # 지도 미니뷰 (선택적)
├── hooks/
│   ├── use-place-detail.ts             # 장소 정보 로드 훅
│   └── use-reviews-infinite.ts         # 무한 스크롤 리뷰 로드 훅
└── backend/
    ├── route.ts                        # Hono 라우터
    ├── service.ts                      # 비즈니스 로직
    └── schema.ts                       # Zod 스키마

src/features/review/
├── components/
│   ├── review-list.tsx                 # 리뷰 목록 컨테이너
│   ├── review-list-empty.tsx           # 리뷰 없음 상태
│   └── review-item-actions.tsx         # 리뷰 수정/삭제 액션
└── hooks/
    └── use-review-delete.ts            # 리뷰 삭제 훅
```

**코드베이스 충돌 체크**: ✅ 신규 경로 및 컴포넌트이므로 충돌 없음

---

### Phase 3: React Query 훅 구현
**목표**: 장소 정보 및 리뷰 목록 데이터 fetching 로직

#### 3.1 장소 상세 정보 훅
**파일**: `src/features/place/hooks/use-place-detail.ts`

```typescript
// src/features/place/hooks/use-place-detail.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { queryKeys } from '@/lib/query-keys';

type PlaceDetailData = {
  place: {
    id: string;
    name: string;
    address: string;
    categoryMain: string;
    categorySub: string | null;
    latitude: number;
    longitude: number;
    createdAt: string;
    updatedAt: string;
  };
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

export function usePlaceDetail(placeId: string) {
  return useQuery<PlaceDetailData>({
    queryKey: queryKeys.places.detail(placeId),
    queryFn: async () => {
      const response = await apiClient.get(`/api/places/${placeId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch place details');
      }

      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5분간 캐싱
    enabled: !!placeId,
  });
}
```

#### 3.2 리뷰 무한 스크롤 훅
**파일**: `src/features/place/hooks/use-reviews-infinite.ts`

```typescript
// src/features/place/hooks/use-reviews-infinite.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { queryKeys } from '@/lib/query-keys';
import type { Review } from '@/types/review';

type ReviewsPageData = {
  items: Review[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
  };
};

export function useReviewsInfinite(placeId: string, limit: number = 10) {
  return useInfiniteQuery<ReviewsPageData>({
    queryKey: queryKeys.reviews.byPlace(placeId),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get(
        `/api/reviews?placeId=${placeId}&page=${pageParam}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const result = await response.json();
      return result.data;
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasNextPage
        ? lastPage.pagination.currentPage + 1
        : undefined;
    },
    initialPageParam: 1,
    enabled: !!placeId,
  });
}
```

**코드베이스 충돌 체크**: ✅ 신규 훅이므로 충돌 없음

---

### Phase 4: UI 컴포넌트 구현
**목표**: 사용자 인터페이스 완성

#### 4.1 장소 정보 헤더
**파일**: `src/features/place/components/place-info-header.tsx`

```typescript
// src/features/place/components/place-info-header.tsx
'use client';

import { MapPin } from 'lucide-react';
import { CategoryBadge } from '@/components/common/category-badge';
import { Card } from '@/components/ui/card';

type PlaceInfoHeaderProps = {
  name: string;
  address: string;
  categoryMain: string;
  categorySub: string | null;
};

export function PlaceInfoHeader({
  name,
  address,
  categoryMain,
  categorySub,
}: PlaceInfoHeaderProps) {
  return (
    <Card className="p-6">
      <h1 className="text-3xl font-bold mb-3">{name}</h1>
      <div className="flex items-start gap-2 mb-3 text-gray-600">
        <MapPin className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <p className="text-sm">{address}</p>
      </div>
      <CategoryBadge main={categoryMain} sub={categorySub} />
    </Card>
  );
}
```

#### 4.2 평점 통계 섹션
**파일**: `src/features/place/components/place-statistics.tsx`

```typescript
// src/features/place/components/place-statistics.tsx
'use client';

import { RatingStars } from '@/components/common/rating-stars';
import { Card } from '@/components/ui/card';
import { RatingDistribution } from './rating-distribution';

type PlaceStatisticsProps = {
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

export function PlaceStatistics({
  averageRating,
  totalReviews,
  ratingDistribution,
}: PlaceStatisticsProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-center">
          <p className="text-4xl font-bold">{averageRating.toFixed(1)}</p>
          <RatingStars rating={averageRating} size="md" showValue={false} />
          <p className="text-sm text-gray-500 mt-1">{totalReviews}개의 리뷰</p>
        </div>
      </div>
      <RatingDistribution
        distribution={ratingDistribution}
        totalReviews={totalReviews}
      />
    </Card>
  );
}
```

#### 4.3 평점 분포 차트
**파일**: `src/features/place/components/rating-distribution.tsx`

```typescript
// src/features/place/components/rating-distribution.tsx
'use client';

import { Star } from 'lucide-react';

type RatingDistributionProps = {
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  totalReviews: number;
};

export function RatingDistribution({
  distribution,
  totalReviews,
}: RatingDistributionProps) {
  const ratings = [5, 4, 3, 2, 1] as const;

  return (
    <div className="space-y-2">
      {ratings.map((rating) => {
        const count = distribution[rating];
        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

        return (
          <div key={rating} className="flex items-center gap-2">
            <div className="flex items-center gap-1 w-12">
              <span className="text-sm font-medium">{rating}</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
          </div>
        );
      })}
    </div>
  );
}
```

#### 4.4 리뷰 목록 컴포넌트
**파일**: `src/features/review/components/review-list.tsx`

```typescript
// src/features/review/components/review-list.tsx
'use client';

import { Fragment } from 'react';
import { useInView } from 'react-intersection-observer';
import { ReviewCard } from '@/components/common/review-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ReviewListEmpty } from './review-list-empty';
import { useReviewsInfinite } from '../hooks/use-reviews-infinite';

type ReviewListProps = {
  placeId: string;
};

export function ReviewList({ placeId }: ReviewListProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useReviewsInfinite(placeId);

  const { ref, inView } = useInView();

  // 자동 로드 (무한 스크롤)
  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">리뷰를 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  const allReviews = data?.pages.flatMap((page) => page.items) ?? [];

  if (allReviews.length === 0) {
    return <ReviewListEmpty />;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">리뷰 ({data?.pages[0].pagination.totalCount})</h2>

      <div className="space-y-4">
        {allReviews.map((review) => (
          <ReviewCard key={review.id} review={review} showActions />
        ))}
      </div>

      {/* 무한 스크롤 트리거 */}
      {hasNextPage && (
        <div ref={ref} className="py-4 text-center">
          {isFetchingNextPage ? (
            <Skeleton className="h-10 w-32 mx-auto" />
          ) : (
            <Button variant="outline" onClick={() => fetchNextPage()}>
              더보기
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
```

#### 4.5 리뷰 없음 상태
**파일**: `src/features/review/components/review-list-empty.tsx`

```typescript
// src/features/review/components/review-list-empty.tsx
'use client';

import { MessageSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ReviewListEmpty() {
  return (
    <Card className="p-12 text-center">
      <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2">아직 리뷰가 없습니다</h3>
      <p className="text-gray-600">
        이 장소의 첫 번째 리뷰를 작성해보세요!
      </p>
    </Card>
  );
}
```

#### 4.6 메인 페이지 컴포넌트
**파일**: `src/features/place/components/place-detail-page.tsx`

```typescript
// src/features/place/components/place-detail-page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlaceDetail } from '../hooks/use-place-detail';
import { PlaceInfoHeader } from './place-info-header';
import { PlaceStatistics } from './place-statistics';
import { ReviewList } from '@/features/review/components/review-list';

type PlaceDetailPageContentProps = {
  placeId: string;
};

export function PlaceDetailPageContent({ placeId }: PlaceDetailPageContentProps) {
  const router = useRouter();
  const { data, isLoading, isError, error } = usePlaceDetail(placeId);

  const handleGoBack = () => {
    router.back();
  };

  const handleWriteReview = () => {
    router.push(`/review/new?placeId=${placeId}`);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-48 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <p className="text-red-500 mb-4">
            {error instanceof Error ? error.message : '장소 정보를 찾을 수 없습니다.'}
          </p>
          <Button onClick={handleGoBack}>돌아가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={handleGoBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button onClick={handleWriteReview}>
          <Edit className="h-4 w-4 mr-2" />
          리뷰 작성하기
        </Button>
      </div>

      {/* 장소 정보 */}
      <PlaceInfoHeader
        name={data.place.name}
        address={data.place.address}
        categoryMain={data.place.categoryMain}
        categorySub={data.place.categorySub}
      />

      <Separator className="my-6" />

      {/* 평점 통계 */}
      <PlaceStatistics
        averageRating={data.statistics.averageRating}
        totalReviews={data.statistics.totalReviews}
        ratingDistribution={data.statistics.ratingDistribution}
      />

      <Separator className="my-6" />

      {/* 리뷰 목록 */}
      <ReviewList placeId={placeId} />
    </div>
  );
}
```

**코드베이스 충돌 체크**: ✅ 모두 신규 컴포넌트이므로 충돌 없음

---

### Phase 5: 추가 기능 구현
**목표**: 리뷰 수정/삭제, 에러 처리, 최적화

#### 5.1 리뷰 삭제 기능
**파일**: `src/features/review/hooks/use-review-delete.ts`

```typescript
// src/features/review/hooks/use-review-delete.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { queryKeys } from '@/lib/query-keys';

export function useReviewDelete(placeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      reviewId,
      password,
    }: {
      reviewId: string;
      password: string;
    }) => {
      const response = await apiClient.delete(`/api/reviews/${reviewId}`, {
        password,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '리뷰 삭제에 실패했습니다.');
      }

      return response.json();
    },
    onSuccess: () => {
      // 리뷰 목록 및 장소 통계 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.byPlace(placeId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.places.detail(placeId),
      });
    },
  });
}
```

#### 5.2 ReviewCard에 액션 추가
**파일**: `src/components/common/review-card.tsx` (수정)

```typescript
// 리뷰 삭제 다이얼로그 추가
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [password, setPassword] = useState('');

const handleDelete = async () => {
  if (!password) {
    alert('비밀번호를 입력해주세요.');
    return;
  }

  try {
    await onDelete?.(review.id, password);
    setIsDeleteDialogOpen(false);
  } catch (error) {
    alert(error instanceof Error ? error.message : '삭제 실패');
  }
};
```

#### 5.3 에러 바운더리
**파일**: `src/features/place/components/place-error-boundary.tsx`

```typescript
// src/features/place/components/place-error-boundary.tsx
'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class PlaceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{this.state.error?.message}</p>
          <Button onClick={() => window.location.reload()}>
            페이지 새로고침
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**코드베이스 충돌 체크**: ✅ 기능 추가이므로 충돌 없음

---

## 4. 코드베이스 충돌 체크 요약

| 구현 항목 | 경로 | 충돌 가능성 | 비고 |
|----------|------|------------|------|
| **백엔드 API** | `src/features/place/backend/*`, `src/features/review/backend/*` | ✅ 없음 | 기존 features 확장 |
| **페이지 라우트** | `src/app/place/[id]/page.tsx` | ✅ 없음 | 신규 경로 |
| **React Query 훅** | `src/features/place/hooks/*`, `src/features/review/hooks/*` | ✅ 없음 | 신규 훅 |
| **UI 컴포넌트** | `src/features/place/components/*`, `src/features/review/components/*` | ✅ 없음 | 신규 컴포넌트 |
| **공통 모듈** | `src/types/*`, `src/components/common/*` | ⚠️ 의존성 | common-modules.md Phase 1-4 선행 필요 |
| **ReviewCard 확장** | `src/components/common/review-card.tsx` | ⚠️ 확장 | showActions prop 추가 |

**결론**: 공통 모듈이 구현되어 있다면 충돌 없이 개발 가능합니다.

---

## 5. 구현 순서 권장사항

### 순서 1: 공통 모듈 확인
- `docs/common-modules.md`의 Phase 1-4 구현 완료 여부 확인
- 미구현 시 해당 모듈 먼저 구현

### 순서 2: 백엔드 API (Phase 1)
1. `src/features/place/backend/schema.ts`, `service.ts`, `route.ts`
2. `src/features/review/backend/schema.ts`, `service.ts`, `route.ts`
3. API 테스트 (Postman 등)

### 순서 3: React Query 훅 (Phase 3)
1. `src/features/place/hooks/use-place-detail.ts`
2. `src/features/place/hooks/use-reviews-infinite.ts`

### 순서 4: UI 컴포넌트 (Phase 4)
1. `src/features/place/components/place-info-header.tsx`
2. `src/features/place/components/rating-distribution.tsx`
3. `src/features/place/components/place-statistics.tsx`
4. `src/features/review/components/review-list-empty.tsx`
5. `src/features/review/components/review-list.tsx`
6. `src/features/place/components/place-detail-page.tsx`
7. `src/app/place/[id]/page.tsx`

### 순서 5: 추가 기능 (Phase 5)
1. 리뷰 삭제 기능
2. 에러 바운더리
3. 최적화

---

## 6. 테스트 계획

### 6.1 단위 테스트
- `use-place-detail` 훅 테스트
- `use-reviews-infinite` 훅 테스트
- 통계 계산 로직 테스트

### 6.2 통합 테스트
- 장소 정보 로드 → 통계 표시
- 리뷰 무한 스크롤
- 리뷰 작성 버튼 → 페이지 이동

### 6.3 E2E 테스트
```typescript
test('장소 상세 페이지 전체 플로우', async ({ page }) => {
  await page.goto('/place/test-place-id');
  await expect(page.locator('h1')).toContainText('테스트 장소');
  await expect(page.locator('text=평균 평점')).toBeVisible();
  await page.click('text=더보기');
  await expect(page.locator('[data-testid="review-card"]').count()).toBeGreaterThan(5);
});
```

---

## 7. 성능 최적화

### 7.1 React Query 캐싱
- 장소 정보: 5분 캐싱
- 리뷰 목록: 1분 캐싱
- 무효화 전략: 리뷰 작성/수정/삭제 후 자동 무효화

### 7.2 무한 스크롤 최적화
- Intersection Observer API 사용
- 디바운싱 적용 (중복 요청 방지)

### 7.3 이미지 최적화
- Next.js Image 컴포넌트 사용
- Lazy loading

---

## 8. 접근성

- ARIA 속성 추가
- 키보드 네비게이션
- 스크린 리더 지원

---

## 9. 향후 개선 사항

- 지도 미니뷰 추가
- 리뷰 정렬 옵션 (최신순, 평점순, 도움됨순)
- 리뷰 검색 기능
- 리뷰 이미지 업로드

---

**작성일**: 2025-10-22
**버전**: 1.0
**작성자**: Senior Developer (via Claude Code)
