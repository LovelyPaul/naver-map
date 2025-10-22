# Use Case: 카테고리 2-depth 표시

## 개요

### Use Case ID
UC-015

### Use Case 명
카테고리 2-depth 표시

### 설명
장소 정보를 표시하는 모든 화면에서 카테고리를 2단계 계층 구조(대분류 > 소분류)로 일관되게 표시하여 사용자가 장소의 유형을 직관적으로 파악할 수 있도록 하는 기능입니다.

### 액터
- **Primary Actor**: 일반 사용자 (맛집 탐색자, 리뷰 작성자)
- **Secondary Actor**: 네이버 맵스 API (카테고리 정보 제공), Supabase DB (카테고리 정보 저장)

### 선행 조건 (Preconditions)
- 장소 정보가 시스템에 조회되어 있음
- 네이버 API로부터 카테고리 정보를 수신했거나 DB에 저장된 카테고리 정보가 있음
- 화면에 장소 정보를 표시하는 UI 컴포넌트가 렌더링되어 있음

### 후행 조건 (Postconditions)
- 카테고리가 "대분류 > 소분류" 형식으로 화면에 표시됨
- 카테고리 정보가 없는 경우 적절한 대체 텍스트가 표시됨
- 모든 장소 정보 표시 영역에서 카테고리 포맷이 일관되게 적용됨

---

## 메인 플로우 (Main Flow)

### Step 1: 장소 정보 수신
**System**:
1. 네이버 Maps API 또는 Supabase DB로부터 장소 정보를 수신
2. 응답 데이터에서 카테고리 정보 추출
3. 카테고리 데이터 구조 확인

**Data Structure**:
```typescript
{
  categoryDepth1: string | null,  // 예: "한식"
  categoryDepth2: string | null   // 예: "소고기 구이"
}
```

### Step 2: 카테고리 데이터 유효성 검증
**System**:
1. `categoryDepth1`과 `categoryDepth2` 필드 존재 여부 확인
2. 각 필드 값이 빈 문자열이 아닌지 확인
3. 유효한 문자열인지 타입 검증

### Step 3: 카테고리 포맷팅
**System**: 다음 규칙에 따라 카테고리 텍스트를 포맷팅

**Case 3A: 대분류와 소분류 모두 존재**
```typescript
display = `${categoryDepth1} > ${categoryDepth2}`
// 예: "한식 > 소고기 구이"
```

**Case 3B: 대분류만 존재 (소분류 없음)**
```typescript
display = categoryDepth1
// 예: "한식"
```

**Case 3C: 소분류만 존재 (대분류 없음)**
```typescript
display = categoryDepth2
// 예: "소고기 구이"
```

**Case 3D: 둘 다 없는 경우**
```typescript
display = "카테고리 미분류"
```

### Step 4: UI 렌더링
**System**:
1. 포맷팅된 카테고리 텍스트를 해당 UI 영역에 렌더링
2. 적절한 스타일 적용 (색상, 폰트 크기, 여백)
3. 텍스트 길이에 따른 처리 (말줄임 등)

**Rendering Locations**:
- 검색 결과 리스트 카드
- 장소 상세 페이지 헤더
- 리뷰 작성 페이지 장소 정보 섹션
- 지도 마커 툴팁/인포윈도우

### Step 5: 사용자 확인
**Actor**: 사용자
**Action**: 표시된 카테고리 정보를 확인

---

## 대체 플로우 (Alternative Flows)

### Alt 1: 네이버 API 카테고리 형식이 다른 경우
**Trigger**: Step 1에서 네이버 API가 다른 카테고리 형식을 반환

**Flow**:
1. **System**: 네이버 API 응답에서 카테고리가 단일 문자열 또는 배열 형식으로 제공됨
2. **System**: 카테고리 문자열을 파싱하여 depth1과 depth2로 분리
   - 구분자 감지: `>`, `·`, `/`, `-` 등
   - 첫 번째 토큰을 `categoryDepth1`로 설정
   - 두 번째 토큰(있는 경우)을 `categoryDepth2`로 설정
3. **System**: 파싱 결과를 정규화된 데이터 구조로 변환
4. **Proceed to**: Step 3

**Example**:
```typescript
// Input: "한식·소고기 구이"
// Output: { categoryDepth1: "한식", categoryDepth2: "소고기 구이" }
```

### Alt 2: 카테고리 텍스트가 너무 긴 경우
**Trigger**: Step 4에서 포맷팅된 카테고리 텍스트가 UI 영역을 초과

**Flow**:
1. **System**: 카테고리 텍스트 길이가 최대 허용 길이를 초과함을 감지
2. **System**: UI 유형에 따라 처리 방식 결정:
   - **검색 결과 카드**: 말줄임(...) 적용, 최대 30자
   - **장소 상세 헤더**: 줄바꿈 허용, 최대 2줄
   - **마커 툴팁**: 말줄임(...) 적용, 최대 20자
3. **System**: CSS `text-overflow: ellipsis` 적용
4. **System**: 전체 텍스트는 `title` 속성으로 제공 (호버 시 표시)
5. **Proceed to**: Step 5

**UI Constraints**:
- 검색 결과 카드: `max-width: 200px`
- 마커 툴팁: `max-width: 150px`

### Alt 3: 카테고리 정보가 동적으로 업데이트되는 경우
**Trigger**: 장소 정보가 실시간으로 업데이트됨 (네이버 API 재조회 등)

**Flow**:
1. **System**: 장소 정보 업데이트 이벤트 감지
2. **System**: 새로운 카테고리 정보를 수신
3. **System**: Step 2로 이동하여 재검증 및 포맷팅
4. **System**: UI를 리렌더링하여 업데이트된 카테고리 표시
5. **System**: 부드러운 전환 애니메이션 적용 (페이드 효과)
6. **Proceed to**: Step 5

### Alt 4: 카테고리가 영어나 다국어인 경우
**Trigger**: Step 3에서 카테고리 텍스트가 한글이 아님을 감지

**Flow**:
1. **System**: 카테고리 언어 감지 (한글, 영어, 기타)
2. **System**: 언어에 따라 구분자 조정:
   - 한글: ` > ` (공백 포함 화살표)
   - 영어: ` > ` 또는 ` / `
   - 기타: ` > `
3. **System**: 포맷팅 적용
4. **Proceed to**: Step 4

**Example**:
```typescript
// Korean: "한식 > 소고기 구이"
// English: "Korean Food > Grilled Beef"
```

### Alt 5: DB에 저장된 카테고리와 API 카테고리가 다른 경우
**Trigger**: Step 1에서 DB와 API의 카테고리 정보가 불일치

**Flow**:
1. **System**: DB와 API의 카테고리 정보를 비교
2. **System**: 비즈니스 규칙에 따라 우선순위 결정:
   - **우선순위 1**: 네이버 API 최신 정보 (30일 이내 업데이트)
   - **우선순위 2**: DB 정보 (API 실패 또는 구버전)
3. **System**: 선택된 카테고리 정보로 포맷팅
4. **System**: DB 정보가 오래된 경우 백그라운드에서 업데이트
5. **Proceed to**: Step 3

---

## 예외 플로우 (Exception Flows)

### Exc 1: 카테고리 데이터 타입이 잘못된 경우
**Trigger**: Step 2에서 카테고리 필드가 문자열이 아닌 다른 타입

**Flow**:
1. **System**: 카테고리 타입 오류 감지 (예: null, undefined, number)
2. **System**: 콘솔에 경고 로그 출력: "Invalid category type"
3. **System**: 기본값으로 "카테고리 미분류" 설정
4. **System**: 에러 리포팅 서비스에 로그 전송 (Sentry 등)
5. **Proceed to**: Step 4

### Exc 2: 카테고리 파싱 실패
**Trigger**: Alt 1에서 카테고리 문자열 파싱 중 오류 발생

**Flow**:
1. **System**: 파싱 예외 발생 (정규표현식 오류, 예상치 못한 형식 등)
2. **System**: 에러를 로깅
3. **System**: 원본 카테고리 문자열을 그대로 표시 (depth1로 간주)
4. **System**: Step 3으로 이동 (Case 3B 적용)

### Exc 3: 렌더링 오류
**Trigger**: Step 4에서 UI 렌더링 중 예외 발생

**Flow**:
1. **System**: 렌더링 에러 감지 (DOM 요소 없음, React 에러 등)
2. **System**: 에러를 로깅
3. **System**: 빈 문자열 또는 "정보 없음" 표시
4. **System**: 다른 장소 정보는 정상 표시
5. **End**: 카테고리 영역만 제외하고 나머지 UI 정상 작동

### Exc 4: 데이터베이스 스키마 변경
**Trigger**: DB 스키마가 변경되어 카테고리 필드명이 다름

**Flow**:
1. **System**: 예상 필드(`category_depth1`, `category_depth2`)를 찾을 수 없음
2. **System**: 대체 필드명 확인 (`category`, `categoryName` 등)
3. **System**: 대체 필드가 있으면 파싱 시도
4. **System**: 대체 필드도 없으면 "카테고리 미분류" 표시
5. **System**: 개발자에게 알림 (슬랙, 이메일 등)
6. **Proceed to**: Step 4

---

## 비즈니스 규칙 (Business Rules)

### BR-001: 카테고리 구분자
- 대분류와 소분류는 항상 ` > ` (앞뒤 공백 포함)로 구분한다
- 다른 구분자(·, /, -)는 파싱 시에만 인식하고, 표시 시에는 ` > `로 통일한다

### BR-002: 카테고리 우선순위
- 대분류와 소분류가 모두 있으면 둘 다 표시
- 대분류만 있으면 대분류만 표시
- 소분류만 있으면 소분류만 표시 (대분류 미표시)
- 둘 다 없으면 "카테고리 미분류" 표시

### BR-003: 텍스트 길이 제한
- 검색 결과 카드: 최대 30자, 초과 시 말줄임
- 장소 상세 헤더: 최대 2줄, 초과 시 줄바꿈
- 마커 툴팁: 최대 20자, 초과 시 말줄임

### BR-004: 카테고리 대소문자
- 네이버 API에서 제공한 원본 대소문자를 유지한다
- 임의로 대문자/소문자로 변환하지 않는다

### BR-005: 카테고리 트림
- 카테고리 텍스트 앞뒤 공백은 제거한다
- 중간 공백은 유지한다

### BR-006: 특수문자 처리
- 카테고리에 포함된 특수문자는 그대로 표시한다
- HTML 이스케이프 처리를 적용하여 XSS 방지

### BR-007: 카테고리 업데이트
- 네이버 API 정보가 30일 이내 업데이트된 경우 API 정보를 우선한다
- DB 정보가 더 최신인 경우 DB 정보를 사용한다

### BR-008: 다국어 지원
- 현재는 한국어와 영어만 지원한다
- 다른 언어는 "기타" 언어로 처리하며 기본 ` > ` 구분자 사용

---

## 비기능 요구사항 (Non-Functional Requirements)

### 성능 (Performance)
- **NFR-001**: 카테고리 포맷팅 처리 시간 ≤ 10ms
- **NFR-002**: 카테고리 파싱 처리 시간 ≤ 20ms
- **NFR-003**: 리렌더링 시 깜빡임 없는 부드러운 전환

### 사용성 (Usability)
- **NFR-004**: 카테고리가 잘려도 `title` 속성으로 전체 텍스트 확인 가능
- **NFR-005**: 카테고리 영역은 시각적으로 구분되어야 함 (아이콘, 색상 등)
- **NFR-006**: "카테고리 미분류"는 회색 등 보조 색상으로 표시

### 접근성 (Accessibility)
- **NFR-007**: 카테고리 정보는 스크린 리더로 읽을 수 있어야 함
- **NFR-008**: `aria-label`에 "카테고리: 한식 > 소고기 구이" 형식으로 명시
- **NFR-009**: 시각적 구분자 외에 의미론적 마크업 사용

### 일관성 (Consistency)
- **NFR-010**: 모든 화면에서 동일한 포맷 규칙 적용
- **NFR-011**: 동일한 유틸 함수 사용하여 중복 코드 방지
- **NFR-012**: 스타일 가이드에 따른 일관된 UI 디자인

### 호환성 (Compatibility)
- **NFR-013**: 모든 지원 브라우저에서 정상 표시 (Chrome, Safari, Firefox, Edge)
- **NFR-014**: 모바일 환경에서도 동일한 포맷 적용
- **NFR-015**: React 18+ 환경에서 정상 작동

---

## 데이터 요구사항 (Data Requirements)

### 입력 데이터

#### Category DTO (from Naver API)
```typescript
interface NaverPlaceCategory {
  category: string;  // 예: "한식>소고기 구이" 또는 "한식·소고기 구이"
}
```

#### Category DTO (from Database)
```typescript
interface PlaceCategoryData {
  categoryDepth1: string | null;  // 예: "한식"
  categoryDepth2: string | null;  // 예: "소고기 구이"
}
```

### 출력 데이터

#### Formatted Category
```typescript
interface FormattedCategory {
  display: string;           // 표시용 텍스트 "한식 > 소고기 구이"
  depth1: string | null;     // 대분류
  depth2: string | null;     // 소분류
  isMissing: boolean;        // 카테고리 정보 없음 여부
}
```

### 저장 데이터

#### Database Schema
```sql
-- places 테이블에 카테고리 정보 저장
CREATE TABLE IF NOT EXISTS public.places (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  naver_place_id VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  category_depth1 VARCHAR(100),     -- 대분류
  category_depth2 VARCHAR(100),     -- 소분류
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## UI/UX 명세 (UI/UX Specifications)

### 검색 결과 리스트 카드

```
┌─────────────────────────────────────────┐
│ [사진]  장소명                           │
│         주소 주소 주소                   │
│         📂 한식 > 소고기 구이           │ <- 카테고리
│                        [리뷰 작성] 버튼  │
└─────────────────────────────────────────┘
```

**스타일**:
- 아이콘: 📂 또는 Lucide `FolderOpen` (14px, #666666)
- 텍스트: 14px, Regular, #666666
- 여백: 좌측 아이콘과 4px 간격
- 최대 너비: 200px
- 말줄임: `text-overflow: ellipsis`

### 장소 상세 페이지 헤더

```
┌─────────────────────────────────────────┐
│ < 뒤로                                   │
│                                          │
│ 장소명장소명장소명                       │
│ 주소 주소 주소 주소 주소                 │
│ 📂 한식 > 소고기 구이                   │ <- 카테고리
│                                          │
│ [지도 미니뷰]                            │
└─────────────────────────────────────────┘
```

**스타일**:
- 아이콘: 📂 또는 Lucide `FolderOpen` (16px, #888888)
- 텍스트: 15px, Regular, #888888
- 여백: 상단 장소명/주소와 8px 간격
- 최대 줄: 2줄, 줄바꿈 허용

### 리뷰 작성 페이지 장소 정보

```
┌─────────────────────────────────────────┐
│ 장소 정보                                │
│ ┌─────────────────────────────────────┐ │
│ │ 장소명: 강남 소고기집                │ │
│ │ 주소: 서울시 강남구...              │ │
│ │ 카테고리: 한식 > 소고기 구이         │ │ <- 카테고리
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**스타일**:
- 레이블: "카테고리:" (14px, Medium, #333333)
- 텍스트: 14px, Regular, #666666
- 여백: 레이블과 값 사이 8px 간격

### 마커 툴팁/인포윈도우

```
┌─────────────────────┐
│ 장소명               │
│ 한식 > 소고기 구이   │ <- 카테고리
│ ⭐ 4.5 (12)        │
└─────────────────────┘
```

**스타일**:
- 텍스트: 12px, Regular, #888888
- 최대 너비: 150px
- 말줄임: `text-overflow: ellipsis`
- 여백: 장소명과 4px 간격

### 카테고리 미분류 표시

```
📂 카테고리 미분류
```

**스타일**:
- 아이콘: 📂 (회색, opacity 0.5)
- 텍스트: 14px, Regular, #999999 (더 연한 회색)
- 이탤릭 체: `font-style: italic`

### 긴 카테고리 말줄임 예시

```
📂 한식 > 소고기 구이 > 프리미엄 한...
     ↑
    title 속성: "한식 > 소고기 구이 > 프리미엄 한우 전문점"
```

---

## 기술 구현 가이드 (Technical Implementation Guide)

### 기술 스택
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn-ui
- **Validation**: Zod
- **State Management**: React Query (서버 상태), Zustand (전역 상태)

### 디렉토리 구조

```
src/
├── features/
│   ├── place-search/
│   │   └── components/
│   │       └── PlaceCard.tsx          # 검색 결과 카드 (카테고리 표시)
│   ├── place-detail/
│   │   └── components/
│   │       └── PlaceHeader.tsx        # 장소 상세 헤더 (카테고리 표시)
│   ├── review-write/
│   │   └── components/
│   │       └── PlaceInfoSection.tsx   # 리뷰 작성 장소 정보 (카테고리 표시)
│   └── map/
│       └── components/
│           └── MarkerTooltip.tsx      # 마커 툴팁 (카테고리 표시)
├── lib/
│   └── utils/
│       └── categoryFormatter.ts       # 카테고리 포맷팅 유틸
└── components/
    └── ui/
        └── CategoryDisplay.tsx        # 카테고리 표시 공통 컴포넌트
```

### 핵심 로직 예시

#### 1. 카테고리 포맷팅 유틸리티

```typescript
// src/lib/utils/categoryFormatter.ts
export interface CategoryData {
  categoryDepth1?: string | null;
  categoryDepth2?: string | null;
}

export interface FormattedCategory {
  display: string;
  depth1: string | null;
  depth2: string | null;
  isMissing: boolean;
}

const SEPARATOR = ' > ';
const MISSING_TEXT = '카테고리 미분류';

export const formatCategory = (data: CategoryData): FormattedCategory => {
  const depth1 = data.categoryDepth1?.trim() || null;
  const depth2 = data.categoryDepth2?.trim() || null;

  if (!depth1 && !depth2) {
    return {
      display: MISSING_TEXT,
      depth1: null,
      depth2: null,
      isMissing: true,
    };
  }

  if (depth1 && depth2) {
    return {
      display: `${depth1}${SEPARATOR}${depth2}`,
      depth1,
      depth2,
      isMissing: false,
    };
  }

  if (depth1) {
    return {
      display: depth1,
      depth1,
      depth2: null,
      isMissing: false,
    };
  }

  return {
    display: depth2!,
    depth1: null,
    depth2,
    isMissing: false,
  };
};

export const parseCategoryString = (category: string): CategoryData => {
  if (!category || typeof category !== 'string') {
    return { categoryDepth1: null, categoryDepth2: null };
  }

  const separators = ['>', '·', '/', '-'];
  let parts: string[] = [];

  for (const sep of separators) {
    if (category.includes(sep)) {
      parts = category.split(sep).map(p => p.trim());
      break;
    }
  }

  if (parts.length === 0) {
    return { categoryDepth1: category.trim(), categoryDepth2: null };
  }

  return {
    categoryDepth1: parts[0] || null,
    categoryDepth2: parts[1] || null,
  };
};
```

#### 2. 카테고리 표시 공통 컴포넌트

```typescript
// src/components/ui/CategoryDisplay.tsx
'use client';

import { FolderOpen } from 'lucide-react';
import { formatCategory, type CategoryData } from '@/lib/utils/categoryFormatter';
import { cn } from '@/lib/utils';

interface CategoryDisplayProps {
  data: CategoryData;
  variant?: 'default' | 'compact' | 'large';
  className?: string;
  maxLength?: number;
}

export const CategoryDisplay = ({
  data,
  variant = 'default',
  className,
  maxLength,
}: CategoryDisplayProps) => {
  const formatted = formatCategory(data);

  const sizeClasses = {
    default: 'text-sm',
    compact: 'text-xs',
    large: 'text-base',
  };

  const iconSizes = {
    default: 14,
    compact: 12,
    large: 16,
  };

  const displayText = maxLength && formatted.display.length > maxLength
    ? `${formatted.display.slice(0, maxLength)}...`
    : formatted.display;

  return (
    <div
      className={cn(
        'flex items-center gap-1',
        formatted.isMissing ? 'text-gray-400 italic' : 'text-gray-600',
        sizeClasses[variant],
        className
      )}
      title={formatted.display}
      aria-label={`카테고리: ${formatted.display}`}
    >
      <FolderOpen
        size={iconSizes[variant]}
        className={cn(
          'shrink-0',
          formatted.isMissing ? 'opacity-50' : 'opacity-70'
        )}
      />
      <span className="truncate">{displayText}</span>
    </div>
  );
};
```

#### 3. 검색 결과 카드에서 사용 예시

```typescript
// src/features/place-search/components/PlaceCard.tsx
'use client';

import { CategoryDisplay } from '@/components/ui/CategoryDisplay';

interface PlaceCardProps {
  place: {
    id: string;
    name: string;
    address: string;
    categoryDepth1?: string | null;
    categoryDepth2?: string | null;
    photoUrl?: string | null;
  };
}

export const PlaceCard = ({ place }: PlaceCardProps) => {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex gap-3">
        <img
          src={place.photoUrl || 'https://picsum.photos/80'}
          alt={place.name}
          className="w-20 h-20 object-cover rounded"
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">{place.name}</h3>
          <p className="text-sm text-gray-500 truncate">{place.address}</p>

          <CategoryDisplay
            data={{
              categoryDepth1: place.categoryDepth1,
              categoryDepth2: place.categoryDepth2,
            }}
            variant="default"
            maxLength={30}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );
};
```

#### 4. 네이버 API 응답 파싱 예시

```typescript
// src/features/place-search/lib/naverApiMapper.ts
import { parseCategoryString } from '@/lib/utils/categoryFormatter';

interface NaverPlace {
  id: string;
  title: string;
  address: string;
  category?: string;  // "한식>소고기 구이"
  // ... 기타 필드
}

export const mapNaverPlaceToDb = (naverPlace: NaverPlace) => {
  const categoryData = naverPlace.category
    ? parseCategoryString(naverPlace.category)
    : { categoryDepth1: null, categoryDepth2: null };

  return {
    naverPlaceId: naverPlace.id,
    name: naverPlace.title,
    address: naverPlace.address,
    categoryDepth1: categoryData.categoryDepth1,
    categoryDepth2: categoryData.categoryDepth2,
    // ... 기타 필드
  };
};
```

#### 5. Zod 스키마 정의

```typescript
// src/features/place-detail/backend/schema.ts
import { z } from 'zod';

export const PlaceCategorySchema = z.object({
  categoryDepth1: z.string().max(100).nullable().optional(),
  categoryDepth2: z.string().max(100).nullable().optional(),
});

export const PlaceResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  categoryDepth1: z.string().max(100).nullable(),
  categoryDepth2: z.string().max(100).nullable(),
  latitude: z.number(),
  longitude: z.number(),
  photoUrl: z.string().url().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PlaceCategory = z.infer<typeof PlaceCategorySchema>;
export type PlaceResponse = z.infer<typeof PlaceResponseSchema>;
```

---

## 테스트 시나리오 (Test Scenarios)

### TS-1: 대분류와 소분류 모두 있는 경우
**Given**: 장소의 `categoryDepth1 = "한식"`, `categoryDepth2 = "소고기 구이"`
**When**: `formatCategory()` 함수 호출
**Then**:
- `display = "한식 > 소고기 구이"`
- `isMissing = false`
- UI에 "📂 한식 > 소고기 구이" 표시

### TS-2: 대분류만 있는 경우
**Given**: 장소의 `categoryDepth1 = "한식"`, `categoryDepth2 = null`
**When**: `formatCategory()` 함수 호출
**Then**:
- `display = "한식"`
- `isMissing = false`
- UI에 "📂 한식" 표시

### TS-3: 소분류만 있는 경우
**Given**: 장소의 `categoryDepth1 = null`, `categoryDepth2 = "소고기 구이"`
**When**: `formatCategory()` 함수 호출
**Then**:
- `display = "소고기 구이"`
- `isMissing = false`
- UI에 "📂 소고기 구이" 표시

### TS-4: 카테고리 정보가 없는 경우
**Given**: 장소의 `categoryDepth1 = null`, `categoryDepth2 = null`
**When**: `formatCategory()` 함수 호출
**Then**:
- `display = "카테고리 미분류"`
- `isMissing = true`
- UI에 "📂 카테고리 미분류" 표시 (회색, 이탤릭)

### TS-5: 네이버 API 응답 파싱 (> 구분자)
**Given**: 네이버 API 응답 `category = "한식>소고기 구이"`
**When**: `parseCategoryString()` 함수 호출
**Then**:
- `categoryDepth1 = "한식"`
- `categoryDepth2 = "소고기 구이"`

### TS-6: 네이버 API 응답 파싱 (· 구분자)
**Given**: 네이버 API 응답 `category = "한식·소고기 구이"`
**When**: `parseCategoryString()` 함수 호출
**Then**:
- `categoryDepth1 = "한식"`
- `categoryDepth2 = "소고기 구이"`

### TS-7: 긴 카테고리 말줄임
**Given**: 검색 결과 카드에서 `categoryDisplay = "한식 > 소고기 구이 > 프리미엄 한우 전문점"`
**When**: `maxLength = 20` 설정
**Then**:
- 화면에 "한식 > 소고기 구이 > 프..." 표시
- `title` 속성에 전체 텍스트 포함
- 호버 시 전체 텍스트 툴팁 표시

### TS-8: 모바일 반응형
**Given**: 모바일 화면 (375px)
**When**: 검색 결과 리스트 확인
**Then**:
- 카테고리가 정상적으로 표시됨
- 텍스트가 컨테이너를 벗어나지 않음
- 말줄임이 적절히 적용됨

### TS-9: 다국어 카테고리 (영어)
**Given**: 장소의 `categoryDepth1 = "Korean Food"`, `categoryDepth2 = "Grilled Beef"`
**When**: `formatCategory()` 함수 호출
**Then**:
- `display = "Korean Food > Grilled Beef"`
- 정상적으로 UI에 표시됨

### TS-10: 공백 처리
**Given**: 장소의 `categoryDepth1 = "  한식  "`, `categoryDepth2 = "  소고기 구이  "`
**When**: `formatCategory()` 함수 호출
**Then**:
- `display = "한식 > 소고기 구이"` (앞뒤 공백 제거)
- 중간 공백은 유지됨

### TS-11: 잘못된 데이터 타입
**Given**: 장소의 `categoryDepth1 = 123` (숫자)
**When**: `formatCategory()` 함수 호출
**Then**:
- 타입 에러 감지
- `display = "카테고리 미분류"`
- 콘솔에 경고 로그 출력

### TS-12: XSS 공격 방어
**Given**: 장소의 `categoryDepth1 = "<script>alert('xss')</script>"`
**When**: UI 렌더링
**Then**:
- 스크립트가 실행되지 않음
- 이스케이프된 텍스트로 표시: `&lt;script&gt;...`

---

## 참고 자료 (References)

### API 문서
- [네이버 지도 Places API](https://developers.naver.com/docs/serviceapi/search/local/local.md)
- [Supabase 문서](https://supabase.com/docs)

### 관련 Use Case
- UC-002: 장소/맛집 검색 (검색 결과 카드에 카테고리 표시)
- UC-004: 장소 상세 정보 및 리뷰 조회 (상세 헤더에 카테고리 표시)
- UC-006: 리뷰 작성 진입 (리뷰 작성 페이지 장소 정보 섹션)
- UC-009: 마커 툴팁 (지도 마커 인포윈도우에 카테고리 표시)

### 디자인 참고
- Material Design - Chips & Labels
- 카카오맵 카테고리 표시 방식
- 네이버 지도 장소 상세 페이지

### 기술 문서
- [React TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS Typography](https://tailwindcss.com/docs/font-size)
- [Lucide React Icons](https://lucide.dev/)

---

## 변경 이력 (Change Log)

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2025-10-22 | System | 초안 작성 |

---

## 승인 (Approval)

- **Product Owner**: [ ]
- **Engineering Lead**: [ ]
- **QA Lead**: [ ]

---

**문서 상태**: Draft
**마지막 업데이트**: 2025-10-22
