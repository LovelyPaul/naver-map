# 리뷰 작성 페이지 구현 계획서

## 문서 정보
- **페이지명**: 리뷰 작성 페이지 (Review Write Page)
- **경로**: `/review/new?placeId={uuid}`
- **작성일**: 2025-10-22
- **버전**: 1.0

---

## 1. 개요

### 1.1 페이지 목적
사용자가 선택한 장소에 대한 리뷰를 작성하고 제출할 수 있는 페이지입니다. 로그인 없이 닉네임과 비밀번호만으로 리뷰를 등록할 수 있으며, Context + useReducer 패턴을 사용하여 복잡한 폼 상태를 관리합니다.

### 1.2 주요 기능
- URL 쿼리 파라미터로 전달된 `placeId`를 통해 장소 정보 로드
- 리뷰 작성 폼: 작성자명, 이메일(선택), 별점(1-5), 리뷰 내용(최대 500자), 비밀번호
- 실시간 글자 수 카운팅 및 유효성 검증
- 폼 제출 시 Supabase `reviews` 테이블에 저장
- 제출 성공 시 장소 상세 페이지(`/place/{placeId}`)로 리다이렉트
- 뒤로가기 시 변경사항 확인 다이얼로그

### 1.3 관련 UseCase
- **UC-06**: 리뷰 작성 페이지 진입 (`docs/usecases/6-review-write-entry/spec.md`)
- **UC-07**: 리뷰 작성 및 제출 (`docs/usecases/7-review-submit/spec.md`)
- **UC-10**: 뒤로가기 (리뷰 작성 페이지에서) (`docs/usecases/10-review-back/spec.md`)
- **UC-13**: 별점 인터랙션 (`docs/usecases/13-rating-interaction/spec.md`)
- **UC-14**: 리뷰 내용 글자 수 제한 (`docs/usecases/14-content-length-limit/spec.md`)

### 1.4 관련 문서
- **상태 관리 설계**: `docs/pages/review-write/state.md`
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
import { Review, ReviewFormData } from '@/types/review';
```

#### 필수 스키마 (Phase 1)
```typescript
// src/lib/schemas/review.ts
import { CreateReviewSchema } from '@/lib/schemas/review';

// src/lib/schemas/common.ts
import { RatingSchema } from '@/lib/schemas/common';
```

#### 필수 UI 컴포넌트 (Phase 4)
```typescript
// src/components/common/rating-stars.tsx
import { RatingStars } from '@/components/common/rating-stars';

// src/components/common/category-badge.tsx
import { CategoryBadge } from '@/components/common/category-badge';

// src/components/common/character-counter.tsx
import { CharacterCounter } from '@/components/common/character-counter';
```

#### 필수 유틸리티 (Phase 2)
```typescript
// src/lib/utils/category.ts
import { formatCategory } from '@/lib/utils/category';

// src/lib/utils/password.ts
import { validatePassword } from '@/lib/utils/password';

// src/backend/utils/password.ts (백엔드)
import { hashPassword } from '@/backend/utils/password';
```

#### React Query 설정 (Phase 1)
```typescript
// src/lib/query-keys.ts
import { queryKeys } from '@/lib/query-keys';

// src/lib/query-client.ts
import { createQueryClient } from '@/lib/query-client';
```

#### 에러 코드 (Phase 1)
```typescript
// src/lib/constants/error-codes.ts
import { REVIEW_ERROR_CODES, COMMON_ERROR_CODES } from '@/lib/constants/error-codes';
```

### 2.2 외부 라이브러리
- `next` (14+): App Router, 페이지 라우팅
- `react` (19): 컴포넌트, Hooks
- `@tanstack/react-query`: 서버 상태 관리
- `react-hook-form` + `@hookform/resolvers`: 폼 상태 관리 (선택적, Context 패턴과 병행 가능)
- `zod`: 스키마 검증
- `lucide-react`: 아이콘 (별, 뒤로가기)
- `shadcn-ui` 컴포넌트: `Button`, `Input`, `Textarea`, `Label`

### 2.3 백엔드 API 의존성
```typescript
// src/features/review/backend/route.ts
// POST /api/reviews - 리뷰 생성
// GET /api/places/:placeId - 장소 정보 조회

// src/features/review/backend/service.ts
// createReview(data: CreateReviewSchema)
// getPlaceById(placeId: string)
```

---

## 3. 구현 단계 (Implementation Phases)

### Phase 1: 백엔드 API 구현 (선행 작업)
**목표**: 리뷰 작성에 필요한 API 엔드포인트 구현

#### 1.1 리뷰 생성 API
**파일**: `src/features/review/backend/route.ts`, `service.ts`, `schema.ts`, `error.ts`

**구현 내용**:
1. **스키마 정의** (`schema.ts`):
   ```typescript
   // src/features/review/backend/schema.ts
   import { z } from 'zod';

   export const CreateReviewRequestSchema = z.object({
     placeId: z.string().uuid(),
     authorName: z.string().min(2).max(100),
     authorEmail: z.string().email().optional().or(z.literal('')),
     rating: z.number().int().min(1).max(5),
     content: z.string().min(1).max(500),
     password: z.string().min(4),
   });

   export const CreateReviewResponseSchema = z.object({
     id: z.string().uuid(),
     placeId: z.string().uuid(),
     authorName: z.string(),
     rating: z.number(),
     content: z.string(),
     createdAt: z.string(),
   });
   ```

2. **에러 코드 정의** (`error.ts`):
   ```typescript
   // src/features/review/backend/error.ts
   export const REVIEW_ERROR_CODES = {
     PLACE_NOT_FOUND: 'PLACE_NOT_FOUND',
     INVALID_RATING: 'INVALID_RATING',
     CONTENT_TOO_LONG: 'CONTENT_TOO_LONG',
     PASSWORD_TOO_SHORT: 'PASSWORD_TOO_SHORT',
     VALIDATION_ERROR: 'VALIDATION_ERROR',
   } as const;
   ```

3. **서비스 로직** (`service.ts`):
   ```typescript
   // src/features/review/backend/service.ts
   import { hashPassword } from '@/backend/utils/password';
   import type { SupabaseClient } from '@supabase/supabase-js';

   export async function createReview(
     supabase: SupabaseClient,
     data: CreateReviewRequest
   ) {
     // 1. placeId 존재 확인
     const { data: place, error: placeError } = await supabase
       .from('places')
       .select('id')
       .eq('id', data.placeId)
       .single();

     if (placeError || !place) {
       return failure('PLACE_NOT_FOUND', 'Place not found');
     }

     // 2. 비밀번호 해싱
     const passwordHash = await hashPassword(data.password);

     // 3. 리뷰 저장
     const { data: review, error } = await supabase
       .from('reviews')
       .insert({
         place_id: data.placeId,
         author_name: data.authorName,
         author_email: data.authorEmail || null,
         rating: data.rating,
         content: data.content,
         password_hash: passwordHash,
       })
       .select('id, place_id, author_name, rating, content, created_at')
       .single();

     if (error) {
       return failure('INTERNAL_ERROR', error.message);
     }

     return success(review);
   }
   ```

4. **Hono 라우터** (`route.ts`):
   ```typescript
   // src/features/review/backend/route.ts
   import { Hono } from 'hono';
   import { zValidator } from '@hono/zod-validator';
   import { CreateReviewRequestSchema } from './schema';
   import { createReview } from './service';
   import { respond } from '@/backend/http/response';

   export function registerReviewRoutes(app: Hono) {
     app.post(
       '/api/reviews',
       zValidator('json', CreateReviewRequestSchema),
       async (c) => {
         const data = c.req.valid('json');
         const supabase = c.get('supabase');
         const logger = c.get('logger');

         logger.info('Creating review', { placeId: data.placeId });

         const result = await createReview(supabase, data);
         return respond(c, result);
       }
     );
   }
   ```

5. **라우터 등록** (`src/backend/hono/app.ts`):
   ```typescript
   // src/backend/hono/app.ts에 추가
   import { registerReviewRoutes } from '@/features/review/backend/route';

   // createHonoApp 내부
   registerReviewRoutes(app);
   ```

#### 1.2 장소 정보 조회 API (기존 place feature 확장)
**파일**: `src/features/place/backend/route.ts`, `service.ts`

**구현 내용**:
```typescript
// src/features/place/backend/route.ts
app.get('/api/places/:placeId', async (c) => {
  const placeId = c.req.param('placeId');
  const supabase = c.get('supabase');

  const { data, error } = await supabase
    .from('places')
    .select('id, name, address, category_main, category_sub')
    .eq('id', placeId)
    .single();

  if (error || !data) {
    return respond(c, failure('PLACE_NOT_FOUND', 'Place not found'));
  }

  return respond(c, success(data));
});
```

**코드베이스 충돌 체크**: ✅ 기존 place feature가 있다면 확장, 없다면 신규 생성

---

### Phase 2: 프론트엔드 기본 구조
**목표**: 페이지 라우팅 및 기본 레이아웃 구성

#### 2.1 페이지 파일 생성
**파일**: `src/app/review/new/page.tsx`

**구현 내용**:
```typescript
// src/app/review/new/page.tsx
'use client';

import { Suspense } from 'react';
import { ReviewWritePageContent } from '@/features/review/components/review-write-page';

export default async function ReviewWritePage(props: {
  searchParams: Promise<{ placeId?: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <Suspense fallback={<div>로딩 중...</div>}>
      <ReviewWritePageContent placeId={searchParams.placeId} />
    </Suspense>
  );
}
```

**코드베이스 충돌 체크**: ✅ 신규 경로이므로 충돌 없음

#### 2.2 Feature 디렉토리 구조 생성
```
src/features/review/
├── components/
│   ├── review-write-page.tsx           # 메인 페이지 컴포넌트
│   ├── place-info-section.tsx          # 장소 정보 표시 섹션
│   ├── review-form.tsx                 # 리뷰 폼 컨테이너
│   ├── author-input.tsx                # 작성자명 입력
│   ├── email-input.tsx                 # 이메일 입력 (선택)
│   ├── rating-input.tsx                # 별점 선택 (RatingStars 래퍼)
│   ├── content-textarea.tsx            # 리뷰 내용 입력
│   └── password-input.tsx              # 비밀번호 입력
├── contexts/
│   ├── review-write-context.tsx        # Context + Provider
│   └── review-write-reducer.ts         # Reducer 함수
├── hooks/
│   ├── use-review-write-context.ts     # Context 훅
│   ├── use-review-submit.ts            # 제출 로직 훅
│   └── use-place-info.ts               # 장소 정보 로드 훅
├── lib/
│   └── validation.ts                   # 폼 검증 함수
└── backend/
    ├── route.ts                        # Hono 라우터
    ├── service.ts                      # 비즈니스 로직
    ├── schema.ts                       # Zod 스키마
    └── error.ts                        # 에러 코드
```

---

### Phase 3: 상태 관리 구현 (Context + useReducer)
**목표**: `docs/pages/review-write/state.md` 설계대로 상태 관리 구현

#### 3.1 State 타입 정의
**파일**: `src/features/review/contexts/review-write-reducer.ts`

```typescript
// src/features/review/contexts/review-write-reducer.ts
export type PlaceData = {
  id: string;
  name: string;
  address: string;
  categoryMain: string;
  categorySub: string | null;
};

export type FieldName = 'authorName' | 'authorEmail' | 'rating' | 'content' | 'password';

export type FormData = {
  authorName: string;
  authorEmail: string;
  rating: number; // 0 = 미선택
  content: string;
  password: string;
};

export type ReviewWriteState = {
  placeId: string | null;
  place: PlaceData | null;
  formData: FormData;
  errors: Record<FieldName, string | null>;
  touched: Record<FieldName, boolean>;
  isLoadingPlace: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  contentLength: number;
  loadPlaceError: string | null;
  submitError: string | null;
};

export const initialState: ReviewWriteState = {
  placeId: null,
  place: null,
  formData: {
    authorName: '',
    authorEmail: '',
    rating: 0,
    content: '',
    password: '',
  },
  errors: {
    authorName: null,
    authorEmail: null,
    rating: null,
    content: null,
    password: null,
  },
  touched: {
    authorName: false,
    authorEmail: false,
    rating: false,
    content: false,
    password: false,
  },
  isLoadingPlace: true,
  isSubmitting: false,
  isDirty: false,
  contentLength: 0,
  loadPlaceError: null,
  submitError: null,
};
```

#### 3.2 Reducer Actions 정의
```typescript
// src/features/review/contexts/review-write-reducer.ts
export type ReviewWriteAction =
  | { type: 'INIT_STATE'; payload: { placeId: string } }
  | { type: 'LOAD_PLACE_START' }
  | { type: 'LOAD_PLACE_SUCCESS'; payload: PlaceData }
  | { type: 'LOAD_PLACE_ERROR'; payload: { error: string } }
  | { type: 'UPDATE_FIELD'; payload: { field: FieldName; value: string | number } }
  | { type: 'SET_TOUCHED'; payload: { field: FieldName } }
  | { type: 'VALIDATE_FIELD'; payload: { field: FieldName; error: string | null } }
  | { type: 'VALIDATE_ALL' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'SUBMIT_ERROR'; payload: { error: string } }
  | { type: 'RESET_FORM' };
```

#### 3.3 Reducer 함수 구현
```typescript
// src/features/review/contexts/review-write-reducer.ts
export function reviewWriteReducer(
  state: ReviewWriteState,
  action: ReviewWriteAction
): ReviewWriteState {
  switch (action.type) {
    case 'INIT_STATE':
      return { ...state, placeId: action.payload.placeId };

    case 'LOAD_PLACE_START':
      return { ...state, isLoadingPlace: true, loadPlaceError: null };

    case 'LOAD_PLACE_SUCCESS':
      return {
        ...state,
        isLoadingPlace: false,
        place: action.payload,
        loadPlaceError: null,
      };

    case 'LOAD_PLACE_ERROR':
      return {
        ...state,
        isLoadingPlace: false,
        loadPlaceError: action.payload.error,
      };

    case 'UPDATE_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.field]: action.payload.value,
        },
        isDirty: true,
        contentLength:
          action.payload.field === 'content'
            ? String(action.payload.value).length
            : state.contentLength,
      };

    case 'SET_TOUCHED':
      return {
        ...state,
        touched: {
          ...state.touched,
          [action.payload.field]: true,
        },
      };

    case 'VALIDATE_FIELD':
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.field]: action.payload.error,
        },
      };

    case 'VALIDATE_ALL': {
      // 모든 필드 검증 로직 (별도 validation 함수 호출)
      return state; // TODO: 검증 로직 추가
    }

    case 'SUBMIT_START':
      return {
        ...state,
        isSubmitting: true,
        submitError: null,
      };

    case 'SUBMIT_SUCCESS':
      return {
        ...state,
        isSubmitting: false,
        submitError: null,
      };

    case 'SUBMIT_ERROR':
      return {
        ...state,
        isSubmitting: false,
        submitError: action.payload.error,
      };

    case 'RESET_FORM':
      return {
        ...state,
        formData: initialState.formData,
        errors: initialState.errors,
        touched: initialState.touched,
        isDirty: false,
        contentLength: 0,
      };

    default:
      return state;
  }
}
```

#### 3.4 Context 정의
**파일**: `src/features/review/contexts/review-write-context.tsx`

```typescript
// src/features/review/contexts/review-write-context.tsx
'use client';

import { createContext, useReducer, useCallback, useMemo } from 'react';
import { reviewWriteReducer, initialState } from './review-write-reducer';
import type { ReviewWriteState, ReviewWriteAction, FieldName } from './review-write-reducer';

type ReviewWriteContextValue = {
  state: ReviewWriteState;
  dispatch: React.Dispatch<ReviewWriteAction>;
  // Helper functions
  initState: (placeId: string) => void;
  loadPlace: (placeId: string) => Promise<void>;
  updateField: (field: FieldName, value: string | number) => void;
  setTouched: (field: FieldName) => void;
  validateField: (field: FieldName) => void;
  validateAll: () => boolean;
  submitReview: () => Promise<void>;
  resetForm: () => void;
  // Computed values
  isFormValid: boolean;
  formattedCategory: string;
};

export const ReviewWriteContext = createContext<ReviewWriteContextValue | null>(null);

export function ReviewWriteProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reviewWriteReducer, initialState);

  // Helper functions (구현은 Phase 4에서)
  const initState = useCallback((placeId: string) => {
    dispatch({ type: 'INIT_STATE', payload: { placeId } });
  }, []);

  const loadPlace = useCallback(async (placeId: string) => {
    // API 호출 로직 (Phase 4)
  }, []);

  const updateField = useCallback((field: FieldName, value: string | number) => {
    dispatch({ type: 'UPDATE_FIELD', payload: { field, value } });
  }, []);

  const setTouched = useCallback((field: FieldName) => {
    dispatch({ type: 'SET_TOUCHED', payload: { field } });
  }, []);

  const validateField = useCallback((field: FieldName) => {
    // 검증 로직 (Phase 4)
  }, []);

  const validateAll = useCallback(() => {
    // 전체 검증 로직 (Phase 4)
    return false;
  }, []);

  const submitReview = useCallback(async () => {
    // 제출 로직 (Phase 4)
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  // Computed values
  const isFormValid = useMemo(() => {
    const { formData, errors } = state;
    return (
      formData.authorName.length >= 2 &&
      formData.rating >= 1 &&
      formData.content.length >= 1 &&
      formData.content.length <= 500 &&
      formData.password.length >= 4 &&
      Object.values(errors).every((error) => error === null)
    );
  }, [state]);

  const formattedCategory = useMemo(() => {
    if (!state.place) return '';
    return state.place.categorySub
      ? `${state.place.categoryMain} > ${state.place.categorySub}`
      : state.place.categoryMain;
  }, [state.place]);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      initState,
      loadPlace,
      updateField,
      setTouched,
      validateField,
      validateAll,
      submitReview,
      resetForm,
      isFormValid,
      formattedCategory,
    }),
    [
      state,
      initState,
      loadPlace,
      updateField,
      setTouched,
      validateField,
      validateAll,
      submitReview,
      resetForm,
      isFormValid,
      formattedCategory,
    ]
  );

  return (
    <ReviewWriteContext.Provider value={value}>
      {children}
    </ReviewWriteContext.Provider>
  );
}
```

#### 3.5 Custom Hook
**파일**: `src/features/review/hooks/use-review-write-context.ts`

```typescript
// src/features/review/hooks/use-review-write-context.ts
import { useContext } from 'react';
import { ReviewWriteContext } from '../contexts/review-write-context';

export function useReviewWriteContext() {
  const context = useContext(ReviewWriteContext);
  if (!context) {
    throw new Error('useReviewWriteContext must be used within ReviewWriteProvider');
  }
  return context;
}
```

**코드베이스 충돌 체크**: ✅ 신규 feature이므로 충돌 없음

---

### Phase 4: 비즈니스 로직 구현
**목표**: API 호출 및 검증 로직 완성

#### 4.1 폼 검증 함수
**파일**: `src/features/review/lib/validation.ts`

```typescript
// src/features/review/lib/validation.ts
import { validatePassword as validatePasswordUtil } from '@/lib/utils/password';
import type { FieldName, FormData } from '../contexts/review-write-reducer';

export function validateAuthorName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 2) {
    return '작성자 이름은 2자 이상 입력해주세요.';
  }
  if (trimmed.length > 100) {
    return '작성자 이름은 100자를 초과할 수 없습니다.';
  }
  return null;
}

export function validateAuthorEmail(value: string): string | null {
  if (!value || value.trim() === '') {
    return null; // 선택 필드이므로 빈 값 허용
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return '올바른 이메일 형식이 아닙니다.';
  }
  return null;
}

export function validateRating(value: number): string | null {
  if (value < 1 || value > 5) {
    return '별점을 선택해주세요.';
  }
  return null;
}

export function validateContent(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length < 1) {
    return '리뷰 내용을 입력해주세요.';
  }
  if (trimmed.length > 500) {
    return '리뷰 내용은 최대 500자까지 입력 가능합니다.';
  }
  return null;
}

export function validatePasswordField(value: string): string | null {
  const result = validatePasswordUtil(value);
  return result.isValid ? null : result.message || '비밀번호가 유효하지 않습니다.';
}

export function validateField(field: FieldName, value: string | number): string | null {
  switch (field) {
    case 'authorName':
      return validateAuthorName(String(value));
    case 'authorEmail':
      return validateAuthorEmail(String(value));
    case 'rating':
      return validateRating(Number(value));
    case 'content':
      return validateContent(String(value));
    case 'password':
      return validatePasswordField(String(value));
    default:
      return null;
  }
}

export function validateAllFields(formData: FormData): Record<FieldName, string | null> {
  return {
    authorName: validateAuthorName(formData.authorName),
    authorEmail: validateAuthorEmail(formData.authorEmail),
    rating: validateRating(formData.rating),
    content: validateContent(formData.content),
    password: validatePasswordField(formData.password),
  };
}
```

#### 4.2 장소 정보 로드 훅
**파일**: `src/features/review/hooks/use-place-info.ts`

```typescript
// src/features/review/hooks/use-place-info.ts
import { useEffect } from 'react';
import { apiClient } from '@/lib/remote/api-client';
import { useReviewWriteContext } from './use-review-write-context';

export function usePlaceInfo(placeId: string | null) {
  const { dispatch } = useReviewWriteContext();

  useEffect(() => {
    if (!placeId) {
      dispatch({
        type: 'LOAD_PLACE_ERROR',
        payload: { error: '장소 ID가 누락되었습니다.' },
      });
      return;
    }

    const loadPlace = async () => {
      dispatch({ type: 'LOAD_PLACE_START' });

      try {
        const response = await apiClient.get(`/api/places/${placeId}`);

        if (!response.ok) {
          throw new Error('장소 정보를 찾을 수 없습니다.');
        }

        const data = await response.json();

        dispatch({
          type: 'LOAD_PLACE_SUCCESS',
          payload: {
            id: data.id,
            name: data.name,
            address: data.address,
            categoryMain: data.category_main,
            categorySub: data.category_sub,
          },
        });
      } catch (error) {
        dispatch({
          type: 'LOAD_PLACE_ERROR',
          payload: {
            error: error instanceof Error ? error.message : '장소 정보 로드 실패',
          },
        });
      }
    };

    loadPlace();
  }, [placeId, dispatch]);
}
```

#### 4.3 리뷰 제출 훅
**파일**: `src/features/review/hooks/use-review-submit.ts`

```typescript
// src/features/review/hooks/use-review-submit.ts
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { queryKeys } from '@/lib/query-keys';
import { useReviewWriteContext } from './use-review-write-context';
import { validateAllFields } from '../lib/validation';

export function useReviewSubmit() {
  const { state, dispatch } = useReviewWriteContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { placeId, formData } = state;

      if (!placeId) {
        throw new Error('장소 ID가 누락되었습니다.');
      }

      const response = await apiClient.post('/api/reviews', {
        placeId,
        authorName: formData.authorName.trim(),
        authorEmail: formData.authorEmail.trim() || undefined,
        rating: formData.rating,
        content: formData.content.trim(),
        password: formData.password,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '리뷰 작성에 실패했습니다.');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // 관련 쿼리 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.byPlace(state.placeId!),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.places.detail(state.placeId!),
      });

      dispatch({ type: 'SUBMIT_SUCCESS' });

      // 장소 상세 페이지로 리다이렉트
      router.push(`/place/${state.placeId}`);
    },
    onError: (error) => {
      dispatch({
        type: 'SUBMIT_ERROR',
        payload: {
          error: error instanceof Error ? error.message : '리뷰 작성 실패',
        },
      });
    },
  });

  const handleSubmit = useCallback(async () => {
    // 1. 모든 필드 검증
    const errors = validateAllFields(state.formData);
    const hasErrors = Object.values(errors).some((error) => error !== null);

    if (hasErrors) {
      // 에러가 있으면 상태에 반영
      Object.entries(errors).forEach(([field, error]) => {
        dispatch({
          type: 'VALIDATE_FIELD',
          payload: { field: field as any, error },
        });
      });
      return;
    }

    // 2. 제출 시작
    dispatch({ type: 'SUBMIT_START' });

    // 3. API 호출
    submitMutation.mutate();
  }, [state.formData, dispatch, submitMutation]);

  return {
    handleSubmit,
    isSubmitting: state.isSubmitting,
    submitError: state.submitError,
  };
}
```

#### 4.4 Context 헬퍼 함수 완성
**파일**: `src/features/review/contexts/review-write-context.tsx` (수정)

```typescript
// loadPlace 구현 추가
const loadPlace = useCallback(async (placeId: string) => {
  dispatch({ type: 'LOAD_PLACE_START' });

  try {
    const response = await apiClient.get(`/api/places/${placeId}`);

    if (!response.ok) {
      throw new Error('장소 정보를 찾을 수 없습니다.');
    }

    const data = await response.json();

    dispatch({
      type: 'LOAD_PLACE_SUCCESS',
      payload: {
        id: data.id,
        name: data.name,
        address: data.address,
        categoryMain: data.category_main,
        categorySub: data.category_sub,
      },
    });
  } catch (error) {
    dispatch({
      type: 'LOAD_PLACE_ERROR',
      payload: {
        error: error instanceof Error ? error.message : '장소 정보 로드 실패',
      },
    });
  }
}, []);

// validateField 구현 추가
const validateField = useCallback((field: FieldName) => {
  const value = state.formData[field];
  const error = validateFieldUtil(field, value);
  dispatch({ type: 'VALIDATE_FIELD', payload: { field, error } });
}, [state.formData]);

// validateAll 구현 추가
const validateAll = useCallback(() => {
  const errors = validateAllFields(state.formData);
  const hasErrors = Object.values(errors).some((error) => error !== null);

  Object.entries(errors).forEach(([field, error]) => {
    dispatch({
      type: 'VALIDATE_FIELD',
      payload: { field: field as FieldName, error },
    });
  });

  return !hasErrors;
}, [state.formData]);
```

**코드베이스 충돌 체크**: ✅ 신규 로직이므로 충돌 없음

---

### Phase 5: UI 컴포넌트 구현
**목표**: 사용자 인터페이스 완성

#### 5.1 장소 정보 섹션
**파일**: `src/features/review/components/place-info-section.tsx`

```typescript
// src/features/review/components/place-info-section.tsx
'use client';

import { CategoryBadge } from '@/components/common/category-badge';
import { Card } from '@/components/ui/card';
import type { PlaceData } from '../contexts/review-write-reducer';

type PlaceInfoSectionProps = {
  place: PlaceData;
};

export function PlaceInfoSection({ place }: PlaceInfoSectionProps) {
  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-2">{place.name}</h2>
      <p className="text-sm text-gray-600 mb-2">{place.address}</p>
      <CategoryBadge main={place.categoryMain} sub={place.categorySub} />
    </Card>
  );
}
```

#### 5.2 작성자명 입력
**파일**: `src/features/review/components/author-input.tsx`

```typescript
// src/features/review/components/author-input.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReviewWriteContext } from '../hooks/use-review-write-context';

export function AuthorInput() {
  const { state, updateField, setTouched, validateField } = useReviewWriteContext();

  return (
    <div className="space-y-2">
      <Label htmlFor="authorName">작성자 이름 *</Label>
      <Input
        id="authorName"
        value={state.formData.authorName}
        onChange={(e) => updateField('authorName', e.target.value)}
        onBlur={() => {
          setTouched('authorName');
          validateField('authorName');
        }}
        placeholder="닉네임 또는 이메일을 입력하세요"
        className={state.errors.authorName && state.touched.authorName ? 'border-red-500' : ''}
      />
      {state.errors.authorName && state.touched.authorName && (
        <p className="text-sm text-red-500">{state.errors.authorName}</p>
      )}
    </div>
  );
}
```

#### 5.3 이메일 입력 (선택)
**파일**: `src/features/review/components/email-input.tsx`

```typescript
// src/features/review/components/email-input.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReviewWriteContext } from '../hooks/use-review-write-context';

export function EmailInput() {
  const { state, updateField, setTouched, validateField } = useReviewWriteContext();

  return (
    <div className="space-y-2">
      <Label htmlFor="authorEmail">이메일 (선택)</Label>
      <Input
        id="authorEmail"
        type="email"
        value={state.formData.authorEmail}
        onChange={(e) => updateField('authorEmail', e.target.value)}
        onBlur={() => {
          setTouched('authorEmail');
          validateField('authorEmail');
        }}
        placeholder="example@email.com"
        className={state.errors.authorEmail && state.touched.authorEmail ? 'border-red-500' : ''}
      />
      {state.errors.authorEmail && state.touched.authorEmail && (
        <p className="text-sm text-red-500">{state.errors.authorEmail}</p>
      )}
    </div>
  );
}
```

#### 5.4 별점 입력
**파일**: `src/features/review/components/rating-input.tsx`

```typescript
// src/features/review/components/rating-input.tsx
'use client';

import { RatingStars } from '@/components/common/rating-stars';
import { Label } from '@/components/ui/label';
import { useReviewWriteContext } from '../hooks/use-review-write-context';

export function RatingInput() {
  const { state, updateField, setTouched, validateField } = useReviewWriteContext();

  const handleRatingChange = (rating: number) => {
    updateField('rating', rating);
    setTouched('rating');
    validateField('rating');
  };

  return (
    <div className="space-y-2">
      <Label>평점 *</Label>
      <RatingStars
        rating={state.formData.rating}
        size="lg"
        interactive
        onChange={handleRatingChange}
        showValue
      />
      {state.errors.rating && state.touched.rating && (
        <p className="text-sm text-red-500">{state.errors.rating}</p>
      )}
    </div>
  );
}
```

#### 5.5 리뷰 내용 입력
**파일**: `src/features/review/components/content-textarea.tsx`

```typescript
// src/features/review/components/content-textarea.tsx
'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CharacterCounter } from '@/components/common/character-counter';
import { useReviewWriteContext } from '../hooks/use-review-write-context';

export function ContentTextarea() {
  const { state, updateField, setTouched, validateField } = useReviewWriteContext();

  return (
    <div className="space-y-2">
      <Label htmlFor="content">리뷰 내용 *</Label>
      <Textarea
        id="content"
        value={state.formData.content}
        onChange={(e) => updateField('content', e.target.value)}
        onBlur={() => {
          setTouched('content');
          validateField('content');
        }}
        placeholder="이 장소에 대한 리뷰를 작성해주세요 (최대 500자)"
        rows={6}
        maxLength={500}
        className={state.errors.content && state.touched.content ? 'border-red-500' : ''}
      />
      <div className="flex justify-between items-center">
        <CharacterCounter
          current={state.contentLength}
          max={500}
          showWarning
          warningThreshold={450}
        />
        {state.errors.content && state.touched.content && (
          <p className="text-sm text-red-500">{state.errors.content}</p>
        )}
      </div>
    </div>
  );
}
```

#### 5.6 비밀번호 입력
**파일**: `src/features/review/components/password-input.tsx`

```typescript
// src/features/review/components/password-input.tsx
'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReviewWriteContext } from '../hooks/use-review-write-context';

export function PasswordInput() {
  const { state, updateField, setTouched, validateField } = useReviewWriteContext();

  return (
    <div className="space-y-2">
      <Label htmlFor="password">비밀번호 *</Label>
      <Input
        id="password"
        type="password"
        value={state.formData.password}
        onChange={(e) => updateField('password', e.target.value)}
        onBlur={() => {
          setTouched('password');
          validateField('password');
        }}
        placeholder="수정/삭제 시 사용할 비밀번호 (4자 이상)"
        className={state.errors.password && state.touched.password ? 'border-red-500' : ''}
      />
      <p className="text-xs text-gray-500">* 리뷰 수정/삭제 시 사용됩니다</p>
      {state.errors.password && state.touched.password && (
        <p className="text-sm text-red-500">{state.errors.password}</p>
      )}
    </div>
  );
}
```

#### 5.7 리뷰 폼 컨테이너
**파일**: `src/features/review/components/review-form.tsx`

```typescript
// src/features/review/components/review-form.tsx
'use client';

import { Button } from '@/components/ui/button';
import { useReviewWriteContext } from '../hooks/use-review-write-context';
import { useReviewSubmit } from '../hooks/use-review-submit';
import { AuthorInput } from './author-input';
import { EmailInput } from './email-input';
import { RatingInput } from './rating-input';
import { ContentTextarea } from './content-textarea';
import { PasswordInput } from './password-input';

export function ReviewForm() {
  const { isFormValid } = useReviewWriteContext();
  const { handleSubmit, isSubmitting, submitError } = useReviewSubmit();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-6"
    >
      <AuthorInput />
      <EmailInput />
      <RatingInput />
      <ContentTextarea />
      <PasswordInput />

      {submitError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={!isFormValid || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? '작성 중...' : '리뷰 작성하기'}
      </Button>
    </form>
  );
}
```

#### 5.8 메인 페이지 컴포넌트
**파일**: `src/features/review/components/review-write-page.tsx`

```typescript
// src/features/review/components/review-write-page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewWriteProvider } from '../contexts/review-write-context';
import { useReviewWriteContext } from '../hooks/use-review-write-context';
import { usePlaceInfo } from '../hooks/use-place-info';
import { PlaceInfoSection } from './place-info-section';
import { ReviewForm } from './review-form';

type ReviewWritePageContentProps = {
  placeId?: string;
};

function ReviewWritePageInner({ placeId }: ReviewWritePageContentProps) {
  const router = useRouter();
  const { state, initState } = useReviewWriteContext();

  // placeId 초기화 및 장소 정보 로드
  useEffect(() => {
    if (placeId) {
      initState(placeId);
    }
  }, [placeId, initState]);

  usePlaceInfo(state.placeId);

  // placeId 누락 시 메인 페이지로 리다이렉트
  useEffect(() => {
    if (!placeId) {
      router.replace('/');
    }
  }, [placeId, router]);

  // 뒤로가기 핸들러 (변경사항 확인)
  const handleGoBack = () => {
    if (state.isDirty) {
      const confirmed = window.confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?');
      if (!confirmed) return;
    }
    router.back();
  };

  // 장소 로드 에러 시 처리
  if (state.loadPlaceError) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500 mb-4">{state.loadPlaceError}</p>
          <Button onClick={() => router.back()}>돌아가기</Button>
        </div>
      </div>
    );
  }

  // 로딩 중
  if (state.isLoadingPlace || !state.place) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="text-center">
          <p>장소 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoBack}
          className="mr-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">리뷰 작성하기</h1>
      </div>

      {/* 장소 정보 */}
      <div className="mb-6">
        <PlaceInfoSection place={state.place} />
      </div>

      {/* 리뷰 폼 */}
      <ReviewForm />
    </div>
  );
}

export function ReviewWritePageContent(props: ReviewWritePageContentProps) {
  return (
    <ReviewWriteProvider>
      <ReviewWritePageInner {...props} />
    </ReviewWriteProvider>
  );
}
```

**코드베이스 충돌 체크**: ✅ 모두 신규 컴포넌트이므로 충돌 없음

---

### Phase 6: 추가 기능 및 최적화
**목표**: 사용자 경험 개선

#### 6.1 브라우저 뒤로가기 방지
**파일**: `src/features/review/components/review-write-page.tsx` (수정)

```typescript
// useEffect 추가
useEffect(() => {
  if (!state.isDirty) return;

  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    e.preventDefault();
    e.returnValue = '';
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [state.isDirty]);
```

#### 6.2 에러 토스트 알림 (선택적)
**파일**: `src/features/review/hooks/use-review-submit.ts` (수정)

```typescript
// shadcn-ui toast 사용 (설치 필요: npx shadcn@latest add toast)
import { useToast } from '@/components/ui/use-toast';

export function useReviewSubmit() {
  const { toast } = useToast();

  // ... 기존 코드 ...

  const submitMutation = useMutation({
    // ...
    onSuccess: (data) => {
      // ...
      toast({
        title: '리뷰가 작성되었습니다',
        description: '작성하신 리뷰가 성공적으로 등록되었습니다.',
      });
      // ...
    },
    onError: (error) => {
      // ...
      toast({
        variant: 'destructive',
        title: '리뷰 작성 실패',
        description: error instanceof Error ? error.message : '리뷰 작성 실패',
      });
    },
  });
}
```

**shadcn-ui 컴포넌트 설치 필요**:
```bash
npx shadcn@latest add toast
```

#### 6.3 키보드 접근성
**파일**: 각 입력 컴포넌트에 `aria-label`, `aria-describedby` 추가

```typescript
// 예: author-input.tsx
<Input
  id="authorName"
  aria-label="작성자 이름"
  aria-describedby={state.errors.authorName ? 'authorName-error' : undefined}
  aria-invalid={!!state.errors.authorName && state.touched.authorName}
  // ... 기존 props
/>
{state.errors.authorName && state.touched.authorName && (
  <p id="authorName-error" role="alert" className="text-sm text-red-500">
    {state.errors.authorName}
  </p>
)}
```

**코드베이스 충돌 체크**: ✅ 기능 추가이므로 충돌 없음

---

## 4. 코드베이스 충돌 체크 요약

| 구현 항목 | 경로 | 충돌 가능성 | 비고 |
|----------|------|------------|------|
| **백엔드 API** | `src/features/review/backend/*` | ✅ 없음 | 신규 feature |
| **페이지 라우트** | `src/app/review/new/page.tsx` | ✅ 없음 | 신규 경로 |
| **Context 및 Reducer** | `src/features/review/contexts/*` | ✅ 없음 | 신규 Context |
| **Custom Hooks** | `src/features/review/hooks/*` | ✅ 없음 | 신규 훅 |
| **UI 컴포넌트** | `src/features/review/components/*` | ✅ 없음 | 신규 컴포넌트 |
| **공통 모듈** | `src/types/*`, `src/components/common/*` | ⚠️ 의존성 | common-modules.md Phase 1-4 선행 필요 |
| **Query Keys** | `src/lib/query-keys.ts` | ⚠️ 확장 | reviews 키 추가 필요 |

**결론**: 공통 모듈이 구현되어 있다면 충돌 없이 개발 가능합니다.

---

## 5. 구현 순서 권장사항

### 순서 1: 공통 모듈 확인
- `docs/common-modules.md`의 Phase 1-4 구현 완료 여부 확인
- 미구현 시 해당 모듈 먼저 구현

### 순서 2: 백엔드 API (Phase 1)
1. `src/features/review/backend/schema.ts`
2. `src/features/review/backend/error.ts`
3. `src/features/review/backend/service.ts`
4. `src/features/review/backend/route.ts`
5. `src/backend/hono/app.ts` (라우터 등록)
6. API 테스트 (Postman, cURL 등)

### 순서 3: 프론트엔드 기반 구조 (Phase 2-3)
1. `src/features/review/contexts/review-write-reducer.ts`
2. `src/features/review/contexts/review-write-context.tsx`
3. `src/features/review/hooks/use-review-write-context.ts`
4. `src/app/review/new/page.tsx`

### 순서 4: 비즈니스 로직 (Phase 4)
1. `src/features/review/lib/validation.ts`
2. `src/features/review/hooks/use-place-info.ts`
3. `src/features/review/hooks/use-review-submit.ts`
4. Context 헬퍼 함수 완성

### 순서 5: UI 컴포넌트 (Phase 5)
1. `src/features/review/components/place-info-section.tsx`
2. 입력 컴포넌트 (author, email, rating, content, password)
3. `src/features/review/components/review-form.tsx`
4. `src/features/review/components/review-write-page.tsx`

### 순서 6: 테스트 및 최적화 (Phase 6)
1. 브라우저 뒤로가기 방지
2. 에러 토스트 알림
3. 키보드 접근성
4. E2E 테스트 작성

---

## 6. 테스트 계획

### 6.1 단위 테스트
**파일**: `src/features/review/__tests__/validation.test.ts`

```typescript
import { validateAuthorName, validateContent, validateRating } from '../lib/validation';

describe('Review Validation', () => {
  describe('validateAuthorName', () => {
    it('should return error if name is too short', () => {
      expect(validateAuthorName('a')).toBe('작성자 이름은 2자 이상 입력해주세요.');
    });

    it('should return null if name is valid', () => {
      expect(validateAuthorName('홍길동')).toBeNull();
    });
  });

  // ... 추가 테스트
});
```

### 6.2 통합 테스트
**시나리오**:
1. 페이지 진입 시 placeId로 장소 정보 로드
2. 각 필드 입력 시 실시간 검증
3. 제출 버튼 활성화/비활성화
4. API 호출 성공 시 리다이렉트
5. API 호출 실패 시 에러 메시지 표시

### 6.3 E2E 테스트 (Playwright)
**파일**: `e2e/review-write.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('리뷰 작성 전체 플로우', async ({ page }) => {
  // 1. 장소 상세 페이지에서 리뷰 작성 버튼 클릭
  await page.goto('/place/test-place-id');
  await page.click('text=리뷰 작성하기');

  // 2. 장소 정보 확인
  await expect(page.locator('h2')).toContainText('테스트 장소명');

  // 3. 폼 입력
  await page.fill('input[id="authorName"]', '테스터');
  await page.click('button[aria-label="별점 5점"]');
  await page.fill('textarea[id="content"]', '정말 맛있었어요!');
  await page.fill('input[id="password"]', 'test1234');

  // 4. 제출
  await page.click('button[type="submit"]');

  // 5. 리다이렉트 확인
  await expect(page).toHaveURL(/\/place\/test-place-id/);

  // 6. 작성한 리뷰가 표시되는지 확인
  await expect(page.locator('text=정말 맛있었어요!')).toBeVisible();
});
```

---

## 7. 예상 이슈 및 해결 방안

### 이슈 1: placeId 누락 또는 잘못된 형식
**해결**:
- URL 파라미터 검증 로직 추가
- 유효하지 않은 placeId일 경우 메인 페이지로 리다이렉트

### 이슈 2: 장소 정보 로드 실패
**해결**:
- 에러 메시지 표시 및 재시도 버튼 제공
- Fallback UI 제공

### 이슈 3: 리뷰 제출 실패 (네트워크 에러, 서버 에러)
**해결**:
- 입력한 내용 유지 (상태 초기화 안 함)
- 명확한 에러 메시지 표시
- 재시도 가능하도록 제출 버튼 재활성화

### 이슈 4: 글자 수 카운팅 불일치 (이모지, 유니코드)
**해결**:
- JavaScript `length` 대신 `Array.from(str).length` 사용
- 또는 `Intl.Segmenter` API 활용

### 이슈 5: 비밀번호 보안
**해결**:
- 백엔드에서 bcrypt 해싱 적용 (`src/backend/utils/password.ts`)
- HTTPS 사용 권장

---

## 8. 성능 최적화

### 8.1 코드 스플리팅
- 페이지 컴포넌트는 자동으로 코드 스플리팅됨 (Next.js App Router)
- 추가 최적화 불필요

### 8.2 React Query 캐싱
- 장소 정보는 5분간 캐싱 (`staleTime: 5 * 60 * 1000`)
- 리뷰 목록은 제출 후 무효화

### 8.3 폼 검증 디바운싱
**파일**: `src/features/review/hooks/use-debounced-validation.ts`

```typescript
import { useEffect, useState } from 'react';

export function useDebouncedValidation(value: string, delay: number = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

**사용 예**:
```typescript
// content-textarea.tsx
const debouncedContent = useDebouncedValidation(state.formData.content);

useEffect(() => {
  if (state.touched.content) {
    validateField('content');
  }
}, [debouncedContent]);
```

---

## 9. 접근성 (Accessibility)

### 9.1 ARIA 속성
- 모든 입력 필드: `aria-label`, `aria-describedby`, `aria-invalid`
- 에러 메시지: `role="alert"`
- 별점 선택: `aria-label="별점 N점"`

### 9.2 키보드 네비게이션
- Tab 키로 모든 입력 필드 이동 가능
- Enter 키로 폼 제출 (버튼 포커스 시)
- Escape 키로 뒤로가기 (선택적)

### 9.3 스크린 리더
- 장소 정보는 `<h2>`로 마크업 (계층 구조)
- 필수 필드에 `*` 표시 및 `aria-required="true"`

---

## 10. 향후 개선 사항

### 10.1 이미지 업로드
- 리뷰에 사진 첨부 기능 추가
- Supabase Storage 활용

### 10.2 리뷰 수정/삭제
- 비밀번호 검증 후 수정/삭제 기능
- 별도 페이지 또는 모달

### 10.3 리뷰 미리보기
- 제출 전 마크다운 미리보기 (선택적)

### 10.4 자동 저장
- LocalStorage에 작성 중인 리뷰 임시 저장
- 페이지 새로고침 시 복구

---

## 11. 체크리스트

### 구현 전 확인 사항
- [ ] 공통 모듈 Phase 1-4 완료
- [ ] Supabase `reviews` 테이블 마이그레이션 완료
- [ ] 환경 변수 설정 완료 (Supabase URL, Key)

### 구현 완료 체크리스트
- [ ] 백엔드 API 구현 및 테스트
- [ ] Context + Reducer 상태 관리 구현
- [ ] 모든 UI 컴포넌트 구현
- [ ] 폼 검증 로직 구현
- [ ] 리뷰 제출 로직 구현
- [ ] 에러 핸들링 구현
- [ ] 뒤로가기 확인 다이얼로그 구현
- [ ] 단위 테스트 작성
- [ ] E2E 테스트 작성
- [ ] 접근성 검증 (axe, Lighthouse)

### 배포 전 확인 사항
- [ ] 프로덕션 환경에서 API 정상 작동 확인
- [ ] 모바일 반응형 테스트
- [ ] 다양한 브라우저 크로스 브라우징 테스트
- [ ] 성능 최적화 (Lighthouse 점수 90+ 목표)

---

**작성일**: 2025-10-22
**버전**: 1.0
**작성자**: Senior Developer (via Claude Code)
