# Usecase: 별점 선택 인터랙션

## 개요
사용자가 리뷰 작성 페이지에서 별 아이콘을 클릭하여 평점(1-5점)을 선택하는 인터랙티브 기능입니다. 선택된 별은 노란색으로 하이라이트되며, 선택된 개수만큼 평점으로 반영됩니다.

## 관련 문서
- PRD: [리뷰 작성 페이지 (/review/new?placeId={placeId})](/docs/prd.md#page-3-리뷰-작성-페이지-review-write)
- User Flow: [13. 별점 선택 인터랙션](/docs/userflow.md#13-별점-선택-인터랙션)
- Related Usecase: [6. 리뷰 작성 페이지 진입](/docs/usecases/6-review-write-entry/spec.md)

---

## Actors (행위자)

### Primary Actor
- **리뷰 작성자**: 맛집 리뷰를 작성하며 평점을 부여하려는 사용자

### Secondary Actors
- **시스템**: 별점 선택 상태를 관리하고 폼 데이터에 반영하는 프론트엔드 시스템

---

## Preconditions (전제 조건)

1. 사용자가 리뷰 작성 페이지(`/review/new?placeId={placeId}`)에 진입한 상태
2. 리뷰 작성 폼이 정상적으로 렌더링된 상태
3. 별점 선택 UI가 초기화된 상태 (별 5개, 모두 비선택 상태)
4. React Hook Form이 폼 상태를 관리하고 있는 상태

---

## Postconditions (후속 조건)

### Success Postconditions
1. 선택된 별의 개수만큼 별 아이콘이 노란색으로 변경됨
2. 선택되지 않은 별은 회색 또는 빈 아이콘 상태로 유지됨
3. 선택된 별의 개수(1-5)가 폼 상태의 평점(rating) 필드에 저장됨
4. 사용자가 다른 별을 클릭하여 평점을 변경할 수 있는 상태

### Failure Postconditions
1. 잘못된 클릭 이벤트 발생 시 기존 선택 상태 유지
2. 시스템 오류 발생 시 기본 상태(비선택)로 복귀

---

## Main Success Scenario (주요 성공 시나리오)

### Step 1: 초기 상태 확인
**Actor**: 시스템
**Action**:
- 리뷰 작성 페이지가 로드되면 별점 선택 UI 렌더링
- 별 5개가 모두 비선택 상태로 표시됨 (회색 또는 빈 별 아이콘)
- 폼 상태의 rating 필드는 초기값 null 또는 0

**System Response**:
- 사용자에게 "평점을 선택해주세요"와 같은 안내 레이블 표시
- 별 아이콘 5개가 가로로 나란히 배치됨
- 마우스 오버 시 호버 효과 적용 가능 (시각적 피드백)

---

### Step 2: 사용자 별 클릭
**Actor**: 사용자
**Action**:
- 리뷰 작성 폼의 평점 섹션에서 특정 별 아이콘 클릭
- 예: 3번째 별을 클릭 (3점 선택)

**System Response**:
- 클릭 이벤트를 감지하고 클릭된 별의 인덱스 확인 (1-5)
- 클릭 이벤트 핸들러 실행

---

### Step 3: 별점 상태 업데이트
**Actor**: 시스템
**Action**:
- 클릭된 별의 인덱스(예: 3)를 기준으로 상태 업데이트
- 1번부터 클릭된 인덱스(3번)까지 선택 상태로 변경
- 클릭된 인덱스 이후(4번, 5번)는 비선택 상태로 유지 또는 변경

**System Response**:
- 컴포넌트 상태 업데이트 (React useState 또는 폼 상태)
- rating 필드에 선택된 별의 개수(3) 저장
- UI 리렌더링 트리거

---

### Step 4: 시각적 피드백 제공
**Actor**: 시스템
**Action**:
- 선택된 별(1-3번)의 아이콘을 노란색(#FFD700) 또는 채워진 별 아이콘으로 변경
- 비선택된 별(4-5번)은 회색(#CCCCCC) 또는 빈 별 아이콘으로 표시
- 선택 애니메이션 효과 적용 (옵션, 예: 페이드인 또는 스케일 효과)

**System Response**:
- 사용자에게 명확한 시각적 피드백 제공
- 현재 선택된 평점을 직관적으로 인지 가능
- 접근성 지원: aria-label 업데이트 (예: "3점 선택됨")

---

### Step 5: 폼 유효성 검증 상태 업데이트
**Actor**: 시스템
**Action**:
- React Hook Form 또는 Zod 스키마가 rating 필드 검증
- 평점이 1-5 범위인지 확인
- 필수 필드 충족 여부 확인

**System Response**:
- 유효성 검증 통과 시 에러 메시지 제거
- 제출 버튼 활성화 조건 재평가
- 폼 상태가 유효하면 제출 가능 상태로 전환

---

### Step 6: 사용자 재선택 가능 상태 유지
**Actor**: 시스템
**Action**:
- 사용자가 다른 별을 클릭하여 평점을 변경할 수 있도록 대기
- 예: 사용자가 5번째 별을 클릭하면 Step 2-5 반복

**System Response**:
- 새로운 클릭 이벤트를 감지할 준비 완료
- 기존 선택 상태는 새로운 선택이 있을 때까지 유지

---

### Step 7: 평점 데이터 폼에 반영
**Actor**: 시스템
**Action**:
- 사용자가 "리뷰 작성하기" 버튼 클릭 시 폼 제출
- rating 필드 값(1-5)이 다른 폼 데이터와 함께 서버로 전송

**System Response**:
- 선택된 평점이 리뷰 데이터의 일부로 저장됨
- 제출 후 장소 상세 페이지에서 별점이 정상 표시됨

---

## Alternative Flows (대안 흐름)

### Alternative Flow A: 동일한 별 재클릭
**Trigger**: 사용자가 이미 선택된 별을 다시 클릭

**Steps**:
1. 시스템이 클릭된 별이 이미 선택된 상태임을 감지
2. 정책에 따라 처리:
   - **옵션 1 (유지)**: 현재 평점 그대로 유지 (아무 변화 없음)
   - **옵션 2 (초기화)**: 평점 선택을 해제하여 0점으로 리셋
   - **옵션 3 (감소)**: 해당 별과 그 이후를 비선택 상태로 변경 (예: 3점에서 2점으로 감소)
3. 선택된 정책에 따라 UI 업데이트

**Postcondition**:
- 옵션 1: 평점 유지
- 옵션 2: 평점 초기화되어 다시 선택 필요
- 옵션 3: 평점이 한 단계 감소

**권장 정책**: 옵션 1 (유지) - 사용자 혼란 최소화

---

### Alternative Flow B: 마우스 오버 미리보기
**Trigger**: 사용자가 별 위에 마우스를 올림 (클릭 전)

**Steps**:
1. 시스템이 마우스 오버 이벤트 감지
2. 마우스가 위치한 별까지 임시로 하이라이트 표시 (연한 노란색 또는 테두리)
3. 마우스가 벗어나면 임시 하이라이트 제거, 기존 선택 상태로 복귀
4. 사용자가 클릭하면 Main Scenario로 진행

**Postcondition**: 사용자가 클릭 전 평점을 미리 확인할 수 있어 UX 향상

---

### Alternative Flow C: 키보드 네비게이션
**Trigger**: 사용자가 키보드로 별점 선택 시도 (접근성)

**Steps**:
1. 사용자가 Tab 키로 별점 섹션에 포커스 이동
2. 첫 번째 별에 포커스 표시 (테두리 또는 아웃라인)
3. 좌우 화살표 키로 별 간 이동
   - 오른쪽 화살표: 다음 별로 포커스 이동
   - 왼쪽 화살표: 이전 별로 포커스 이동
4. Space 또는 Enter 키로 현재 포커스된 별 선택
5. 선택 후 Step 3-5 (Main Scenario)와 동일하게 진행

**Postcondition**: 마우스 없이도 평점 선택 가능 (WCAG 준수)

---

## Exception Flows (예외 흐름)

### Exception Flow 1: 클릭 이벤트 처리 오류
**Trigger**: JavaScript 오류로 클릭 이벤트 핸들러 실패

**Steps**:
1. 시스템이 오류를 감지하고 콘솔에 에러 로그 출력
2. 사용자에게 에러 메시지 표시: "평점 선택에 실패했습니다. 다시 시도해주세요."
3. 기존 선택 상태 유지 (롤백)
4. 사용자가 다시 클릭 시도 가능

**Postcondition**: 평점 선택이 불가능한 상태로 남지 않도록 재시도 가능

---

### Exception Flow 2: 모바일 터치 이벤트 충돌
**Trigger**: 모바일 환경에서 터치 이벤트와 클릭 이벤트가 중복 발생

**Steps**:
1. 시스템이 터치 이벤트를 우선 처리
2. 클릭 이벤트는 preventDefault로 차단하여 중복 실행 방지
3. 터치된 별의 인덱스 확인 후 Main Scenario 진행
4. 터치 피드백 제공 (진동 또는 시각적 효과)

**Postcondition**: 모바일에서도 정상적으로 평점 선택 가능

---

### Exception Flow 3: 반 별 선택 시도 (미지원 기능)
**Trigger**: 사용자가 별 아이콘의 왼쪽 절반을 클릭하여 0.5점 단위 선택 시도

**Steps**:
1. 현재 시스템은 정수 평점(1-5)만 지원
2. 클릭된 별의 전체 영역에 대해 정수 평점으로 처리
3. 반 별 선택은 무시하고 클릭된 별의 인덱스로 평점 저장
4. 향후 확장 고려 사항으로 기록 (0.5 단위 평점 지원)

**Postcondition**: 정수 평점만 저장되며, 사용자 혼란 방지

---

## Business Rules (비즈니스 규칙)

### BR-1: 평점 범위 제한
별점은 반드시 1-5 범위의 정수여야 하며, 0점 또는 6점 이상은 허용하지 않습니다. 별을 하나도 선택하지 않은 경우(0점)는 폼 유효성 검증에서 에러로 처리됩니다.

### BR-2: 평점 필수 입력
리뷰 작성 시 평점은 필수 입력 항목입니다. 평점을 선택하지 않고 제출 시도 시 "평점을 선택해주세요"라는 유효성 검증 메시지가 표시됩니다.

### BR-3: 평점 변경 가능
사용자는 리뷰를 제출하기 전까지 언제든지 평점을 변경할 수 있습니다. 다른 별을 클릭하면 기존 선택이 즉시 업데이트됩니다.

### BR-4: 시각적 일관성
선택된 별은 노란색(#FFD700), 비선택된 별은 회색(#CCCCCC)으로 통일하여 사용자 혼란을 방지합니다. (PRD 컬러 팔레트 준수)

### BR-5: 접근성 지원
키보드 네비게이션, 스크린 리더 호환, ARIA 속성 제공을 통해 모든 사용자가 평점을 선택할 수 있도록 보장합니다.

---

## Data Requirements (데이터 요구사항)

### Input Data
| 데이터 항목 | 데이터 타입 | 필수 여부 | 설명 |
|------------|------------|----------|------|
| starIndex | Integer (1-5) | 필수 | 클릭된 별의 인덱스 (1번째 별 = 1점) |

### Output Data
| 데이터 항목 | 데이터 타입 | 설명 |
|------------|------------|------|
| rating | Integer (1-5) | 폼 상태에 저장되는 평점 값 |

### Form Schema (Zod)
```typescript
const reviewFormSchema = z.object({
  authorName: z.string().min(2).max(50),
  rating: z.number().int().min(1).max(5, "평점은 1-5점 사이로 선택해주세요"),
  content: z.string().min(1).max(500),
  password: z.string().min(4)
});
```

---

## UI/UX Specifications (UI/UX 명세)

### Component Layout
```
┌─────────────────────────────────────┐
│  평점                                │
│  ⭐ ⭐ ⭐ ☆ ☆                       │ ← 별 5개 (3개 선택 상태 예시)
│  * 별을 클릭하여 평점을 선택하세요    │
└─────────────────────────────────────┘
```

### Visual States

#### 1. 초기 상태 (비선택)
```
☆ ☆ ☆ ☆ ☆  (회색 빈 별)
```

#### 2. 3점 선택 상태
```
⭐ ⭐ ⭐ ☆ ☆  (노란색 채워진 별 3개, 회색 빈 별 2개)
```

#### 3. 5점 선택 상태
```
⭐ ⭐ ⭐ ⭐ ⭐  (모두 노란색 채워진 별)
```

#### 4. 마우스 오버 상태 (3번째 별 위에 마우스)
```
⭐ ⭐ 🌟 ☆ ☆  (호버된 별까지 하이라이트)
```

### Icon Specifications
- **선택된 별**: lucide-react `Star` 아이콘, fill="#FFD700" (노란색)
- **비선택 별**: lucide-react `Star` 아이콘, stroke="#CCCCCC", fill="none" (회색 테두리)
- **크기**: 24x24px (모바일), 32x32px (데스크톱)
- **간격**: 별 아이콘 간 8px 간격

### Interaction States
| 상태 | 설명 | 시각적 효과 |
|------|------|------------|
| Default | 기본 상태 | 회색 빈 별 |
| Hover | 마우스 오버 | 호버된 별까지 연한 노란색 |
| Selected | 클릭 후 선택 | 노란색 채워진 별 |
| Focus | 키보드 포커스 | 파란색 테두리 (접근성) |
| Disabled | 비활성화 (제출 중) | 회색 반투명 |

### Accessibility
- `role="radiogroup"` 또는 `role="slider"` 적용 (별점 그룹)
- 각 별에 `aria-label="1점", "2점", ..., "5점"` 제공
- 선택된 별에 `aria-checked="true"` 또는 `aria-selected="true"`
- 키보드 네비게이션: Tab (포커스), 화살표 (이동), Space/Enter (선택)
- 스크린 리더 안내: "평점 5점 중 3점 선택됨"

---

## Performance Requirements (성능 요구사항)

### PR-1: 인터랙션 반응성
- 별 클릭 후 시각적 피드백 표시까지: **50ms 이내**
- 상태 업데이트 및 리렌더링 완료: **100ms 이내**

### PR-2: 애니메이션 부드러움
- 별 색상 전환 애니메이션: **200ms transition** (ease-in-out)
- 프레임 드롭 없이 부드러운 전환 보장 (60fps)

### PR-3: 메모리 효율성
- 별 아이콘 SVG 최적화로 렌더링 부하 최소화
- 불필요한 리렌더링 방지 (React.memo 활용)

---

## Security Considerations (보안 고려사항)

### SC-1: 클라이언트 측 검증
- 평점 값이 1-5 범위를 벗어나는 경우 폼 제출 차단
- Zod 스키마로 타입 안전성 보장

### SC-2: 서버 측 재검증
- 클라이언트에서 전송된 rating 값을 서버에서 재검증
- 1-5 범위 외 값 수신 시 400 Bad Request 응답

### SC-3: XSS 방지
- 별점 UI는 정적 아이콘으로 구성되어 XSS 위험 낮음
- 하지만 동적 스타일 적용 시 인라인 스타일 대신 CSS 클래스 사용

---

## Dependencies (의존성)

### Frontend Dependencies
- **React**: 컴포넌트 상태 관리 (useState)
- **React Hook Form**: 폼 상태 통합
- **Zod**: 평점 유효성 검증
- **lucide-react**: Star 아이콘
- **TailwindCSS**: 스타일링 (색상, 간격)

### Component Hierarchy
```
ReviewForm
├── PlaceInfoSection
├── AuthorInput
├── StarRating ← 별점 선택 컴포넌트 (이 유즈케이스 대상)
│   ├── StarIcon (x5)
│   └── HiddenInput (rating 값 저장)
├── ReviewTextarea
├── PasswordInput
└── SubmitButton
```

---

## Testing Scenarios (테스트 시나리오)

### Test Case 1: 별 1개 선택
**Given**: 사용자가 리뷰 작성 페이지에 진입하여 평점 섹션 확인
**When**: 첫 번째 별 클릭
**Then**:
- 첫 번째 별만 노란색으로 변경
- 나머지 4개 별은 회색 유지
- rating 필드 값이 1로 저장됨

---

### Test Case 2: 별 5개 선택 (만점)
**Given**: 평점 비선택 상태
**When**: 다섯 번째 별 클릭
**Then**:
- 5개 별 모두 노란색으로 변경
- rating 필드 값이 5로 저장됨

---

### Test Case 3: 평점 변경 (3점 → 5점)
**Given**: 3점이 이미 선택된 상태
**When**: 다섯 번째 별 클릭
**Then**:
- 5개 별 모두 노란색으로 변경
- rating 필드 값이 3에서 5로 업데이트됨

---

### Test Case 4: 평점 하향 변경 (5점 → 2점)
**Given**: 5점이 선택된 상태
**When**: 두 번째 별 클릭
**Then**:
- 첫 번째, 두 번째 별만 노란색
- 세 번째~다섯 번째 별은 회색으로 변경
- rating 필드 값이 5에서 2로 업데이트됨

---

### Test Case 5: 키보드 네비게이션
**Given**: 사용자가 Tab 키로 평점 섹션에 포커스 이동
**When**: 오른쪽 화살표 3번 누른 후 Space 키 입력
**Then**:
- 세 번째 별까지 노란색 선택
- rating 값이 3으로 저장됨
- 스크린 리더가 "3점 선택됨" 안내

---

### Test Case 6: 마우스 오버 미리보기
**Given**: 평점 비선택 상태
**When**: 네 번째 별 위로 마우스 이동 (클릭 전)
**Then**:
- 첫 번째~네 번째 별까지 연한 노란색으로 임시 하이라이트
- 마우스 아웃 시 다시 회색으로 복귀
- rating 값은 아직 0 (저장 안 됨)

---

### Test Case 7: 모바일 터치
**Given**: 모바일 디바이스에서 리뷰 작성 페이지 접속
**When**: 세 번째 별을 터치
**Then**:
- 터치 이벤트 정상 처리
- 3개 별이 노란색으로 변경
- 중복 이벤트 없이 한 번만 실행

---

### Test Case 8: 평점 필수 검증
**Given**: 평점을 선택하지 않은 상태
**When**: 다른 필드만 입력 후 "리뷰 작성하기" 버튼 클릭
**Then**:
- 폼 제출 차단
- 평점 섹션에 에러 메시지 표시: "평점을 선택해주세요"
- 별점 섹션에 빨간색 테두리 표시 (옵션)

---

### Test Case 9: 동일 별 재클릭 (유지 정책)
**Given**: 3점이 선택된 상태
**When**: 세 번째 별을 다시 클릭
**Then**:
- 3점 선택 상태 유지 (변화 없음)
- rating 값 그대로 3

---

### Test Case 10: 제출 후 평점 표시 확인
**Given**: 사용자가 4점을 선택하고 리뷰 작성 완료
**When**: 장소 상세 페이지로 이동하여 작성한 리뷰 확인
**Then**:
- 리뷰 카드에 별 4개 (⭐⭐⭐⭐☆) 표시됨
- 평균 평점 계산에 4점 반영

---

## Related Use Cases (관련 유즈케이스)

- **UC-06: 리뷰 작성 페이지 진입** - 별점 선택 UI가 포함된 페이지 진입
- **UC-07: 리뷰 작성 및 제출** - 선택된 평점이 제출 데이터에 포함
- **UC-04: 장소 상세 정보 및 리뷰 조회** - 제출된 평점이 별 아이콘으로 표시
- **UC-14: 리뷰 내용 글자 수 제한** - 동일 폼 내 다른 필드와 상호작용

---

## Appendix (부록)

### A. 기술 구현 노트

#### 컴포넌트 구조 예시
```typescript
// components/StarRating.tsx
'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  return (
    <div role="radiogroup" aria-label="평점 선택">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverValue(star)}
          onMouseLeave={() => setHoverValue(0)}
          aria-label={`${star}점`}
          aria-checked={value === star}
          className="transition-colors duration-200"
        >
          <Star
            size={32}
            fill={(hoverValue || value) >= star ? '#FFD700' : 'none'}
            stroke={(hoverValue || value) >= star ? '#FFD700' : '#CCCCCC'}
          />
        </button>
      ))}
    </div>
  );
}
```

#### React Hook Form 통합
```typescript
// pages/review/new.tsx
const { register, setValue, watch } = useForm<ReviewFormData>();
const rating = watch('rating');

<StarRating
  value={rating}
  onChange={(value) => setValue('rating', value)}
/>
```

### B. 디자인 리소스
- **아이콘 라이브러리**: lucide-react (Star 컴포넌트)
- **색상**:
  - 선택된 별: #FFD700 (Accent Yellow, PRD 참고)
  - 비선택 별: #CCCCCC (Light Gray)
  - 호버 별: #FFE680 (연한 노란색)
- **애니메이션**: `transition: fill 0.2s ease-in-out, stroke 0.2s ease-in-out`

### C. 향후 확장 고려사항
- **반 별 평점 지원**: 3.5점과 같은 0.5 단위 평점 (클릭 위치에 따라 좌/우 절반 구분)
- **평점 분포 차트**: 장소 상세 페이지에서 1-5점 각각의 리뷰 개수를 막대 그래프로 표시
- **평점 애니메이션**: 별 선택 시 작은 반짝임 효과 또는 스케일 애니메이션
- **평점 미리보기 텍스트**: 별 위에 마우스 오버 시 "좋아요", "최고예요" 등 텍스트 표시

---

**작성일**: 2025-10-22
**버전**: 1.0
**작성자**: Senior Developer (via Claude Code)
