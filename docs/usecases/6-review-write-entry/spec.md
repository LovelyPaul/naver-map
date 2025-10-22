# Usecase: 리뷰 작성 페이지 진입

## 개요
사용자가 특정 장소에 대한 리뷰를 작성하기 위해 리뷰 작성 페이지로 진입하는 기능입니다. 검색 결과 리스트 또는 장소 상세 정보 패널에서 "리뷰 작성" 버튼을 클릭하여 진입할 수 있습니다.

## 관련 문서
- PRD: [리뷰 작성 페이지 (/review/new?placeId={placeId})](/docs/prd.md#page-3-리뷰-작성-페이지-review-write)
- User Flow: [6. 리뷰 작성 페이지 진입](/docs/userflow.md#6-리뷰-작성-페이지-진입)

---

## Actors (행위자)

### Primary Actor
- **일반 사용자**: 맛집 정보를 검색하고 리뷰를 작성하려는 사용자

### Secondary Actors
- **시스템**: 장소 정보를 조회하고 리뷰 작성 폼을 제공하는 애플리케이션 백엔드

---

## Preconditions (전제 조건)

1. 사용자가 ConnectMap 애플리케이션에 접속한 상태
2. 사용자가 장소 검색을 완료하여 검색 결과가 표시된 상태 또는 장소 상세 정보 페이지를 조회 중인 상태
3. 리뷰를 작성할 특정 장소가 선택된 상태 (placeId 확인 가능)
4. 네이버 지도 API를 통해 장소 정보를 조회할 수 있는 상태

---

## Postconditions (후속 조건)

### Success Postconditions
1. 리뷰 작성 페이지가 정상적으로 렌더링됨
2. 선택한 장소의 기본 정보(식당명, 주소, 카테고리)가 화면에 자동으로 표시됨
3. 리뷰 작성 폼이 초기화된 상태로 표시됨 (모든 입력 필드가 빈 값)
4. 사용자가 리뷰를 작성할 준비가 완료됨

### Failure Postconditions
1. 장소 정보를 찾을 수 없는 경우, 에러 메시지가 표시되고 이전 화면으로 복귀
2. 네트워크 오류 발생 시, 에러 알림을 표시하고 재시도 옵션 제공

---

## Main Success Scenario (주요 성공 시나리오)

### Step 1: 리뷰 작성 진입점 선택
**Actor**: 사용자
**Action**:
- 검색 결과 리스트의 특정 장소 카드에서 "리뷰 작성" 버튼 클릭
- 또는 장소 상세 정보 패널/페이지에서 "리뷰 작성하기" 버튼 클릭

**System Response**:
- 클릭 이벤트를 감지하고 선택된 장소의 placeId를 확인
- 리뷰 작성 페이지로 라우팅 준비 (`/review/new?placeId={placeId}`)

---

### Step 2: 장소 정보 확인 및 전달
**Actor**: 시스템
**Action**:
- 선택된 장소의 placeId를 URL 파라미터 또는 상태로 전달
- 해당 placeId로 Supabase `places` 테이블에서 장소 정보 조회
  - 조회 필드: id, name, address, category_depth1, category_depth2, photo_url

**System Response**:
- 장소 정보가 존재하는 경우: 데이터를 컴포넌트 상태로 로드
- 장소 정보가 없는 경우: Alternative Flow A로 분기 (에러 처리)

---

### Step 3: 리뷰 작성 페이지 라우팅
**Actor**: 시스템
**Action**:
- Next.js App Router를 통해 `/review/new?placeId={placeId}` 경로로 페이지 이동
- 또는 모달 형태로 리뷰 작성 UI를 오버레이 표시 (구현 방식에 따라)

**System Response**:
- 리뷰 작성 페이지 컴포넌트가 마운트됨
- URL 파라미터에서 placeId를 추출하여 상태에 저장

---

### Step 4: 장소 기본 정보 자동 채움
**Actor**: 시스템
**Action**:
- Step 2에서 조회한 장소 정보를 화면 상단에 표시
  - 식당명 (name)
  - 주소 (address)
  - 카테고리 (category_depth1 > category_depth2 형식)
  - 대표 사진 (photo_url, 옵션)

**System Response**:
- 장소 정보 섹션이 읽기 전용(read-only)으로 렌더링됨
- 사용자가 직접 수정할 수 없도록 비활성화

---

### Step 5: 리뷰 작성 폼 초기화
**Actor**: 시스템
**Action**:
- 리뷰 작성 폼을 다음과 같은 초기 상태로 렌더링:
  - **작성자 정보 입력 필드**: 빈 값 (placeholder: "닉네임 또는 이메일을 입력하세요")
  - **평점 선택 UI**: 별 5개, 모두 비선택 상태 (회색 또는 빈 별)
  - **리뷰 내용 입력 필드**: 빈 값 (textarea, placeholder: "이 장소에 대한 리뷰를 작성해주세요 (최대 500자)")
  - **비밀번호 입력 필드**: 빈 값 (type: password, placeholder: "리뷰 수정/삭제 시 사용할 비밀번호")
  - **글자 수 카운터**: "0 / 500"으로 표시

**System Response**:
- 모든 입력 필드가 활성화되어 사용자 입력을 받을 준비 완료
- React Hook Form이 폼 상태를 관리하도록 초기화

---

### Step 6: UI 컴포넌트 렌더링 완료
**Actor**: 시스템
**Action**:
- 리뷰 작성 페이지의 모든 UI 요소를 렌더링:
  - **상단 네비게이션 바**: 뒤로가기 버튼 (← 아이콘 + "뒤로가기" 텍스트)
  - **장소 정보 섹션**: 식당명, 주소, 카테고리 (읽기 전용)
  - **리뷰 작성 폼**: Step 5에서 초기화된 입력 필드들
  - **하단 제출 버튼**: "리뷰 작성하기" (활성화 상태, 클릭 시 폼 제출)

**System Response**:
- 페이지가 완전히 로드되어 사용자가 리뷰 작성을 시작할 수 있음
- 포커스가 첫 번째 입력 필드(작성자 정보)로 이동 (접근성 고려)

---

### Step 7: 사용자 대기
**Actor**: 사용자
**Action**:
- 리뷰 작성 페이지를 확인하고 폼 작성 시작 또는 뒤로가기

**System Response**:
- 사용자의 다음 액션을 대기
- 후속 유즈케이스로 연결:
  - "7. 리뷰 작성 및 제출" (폼 작성 → 제출)
  - "10. 뒤로가기" (리뷰 작성 취소)

---

## Alternative Flows (대안 흐름)

### Alternative Flow A: 장소 정보 누락
**Trigger**: Step 2에서 placeId에 해당하는 장소 정보를 Supabase에서 찾을 수 없음

**Steps**:
1. 시스템이 장소 정보 조회 실패를 감지
2. 에러 메시지 표시: "장소 정보를 찾을 수 없습니다. 다시 시도해주세요."
3. 자동으로 이전 화면(검색 결과 또는 장소 상세 페이지)으로 복귀
4. 또는 메인 페이지로 리다이렉트

**Postcondition**: 사용자가 다시 장소를 선택하여 재시도할 수 있음

---

### Alternative Flow B: 네트워크 오류
**Trigger**: Step 2에서 Supabase 연결 실패 또는 네트워크 타임아웃

**Steps**:
1. 시스템이 네트워크 오류를 감지
2. 에러 메시지 표시: "네트워크 연결이 불안정합니다. 다시 시도해주세요."
3. "재시도" 버튼 제공
4. 사용자가 "재시도" 클릭 시 Step 2부터 다시 실행
5. 사용자가 "취소" 클릭 시 이전 화면으로 복귀

**Postcondition**: 네트워크 복구 후 정상적으로 페이지 진입 가능

---

### Alternative Flow C: placeId 파라미터 누락
**Trigger**: Step 3에서 URL 파라미터에 placeId가 없거나 유효하지 않음

**Steps**:
1. 시스템이 placeId 파라미터 누락 또는 형식 오류를 감지
2. 에러 메시지 표시: "잘못된 접근입니다. 장소를 선택해주세요."
3. 자동으로 메인 페이지(`/`)로 리다이렉트

**Postcondition**: 사용자가 정상적인 경로로 다시 진입해야 함

---

### Alternative Flow D: 모달 형태로 진입 (구현 방식 차이)
**Trigger**: 리뷰 작성 UI를 별도 페이지가 아닌 모달로 구현한 경우

**Steps**:
1. Step 1에서 "리뷰 작성" 버튼 클릭 시 페이지 이동 대신 모달 오픈
2. 모달 오버레이가 현재 화면(검색 결과 또는 장소 상세) 위에 표시됨
3. Step 2-6과 동일하게 장소 정보 로드 및 폼 초기화
4. 모달 닫기 버튼(X) 또는 외부 영역 클릭 시 모달 닫힘

**Postcondition**: 모달이 닫히면 이전 화면 상태가 유지됨

---

## Exception Flows (예외 흐름)

### Exception Flow 1: 브라우저 뒤로가기 버튼 사용
**Trigger**: 사용자가 리뷰 작성 페이지 진입 직후 브라우저 뒤로가기 버튼 클릭

**Steps**:
1. 시스템이 브라우저 히스토리 백 이벤트를 감지
2. 작성 중인 데이터가 없으므로 확인 다이얼로그 없이 즉시 이전 페이지로 이동
3. 리뷰 작성 페이지 언마운트

**Postcondition**: 이전 화면(검색 결과 또는 장소 상세 페이지)으로 복귀

---

### Exception Flow 2: 페이지 새로고침
**Trigger**: 사용자가 리뷰 작성 페이지에서 F5 또는 브라우저 새로고침 버튼 클릭

**Steps**:
1. 페이지가 리로드되며 URL 파라미터(placeId)가 유지됨
2. Step 2부터 다시 실행 (장소 정보 재조회)
3. 폼 상태는 초기화되어 모든 입력 필드가 빈 값

**Postcondition**: 작성 중이던 내용은 모두 사라지고 초기 상태로 복귀

---

## Business Rules (비즈니스 규칙)

### BR-1: 장소 정보 필수
리뷰 작성은 반드시 특정 장소와 연결되어야 하며, placeId 없이는 리뷰 작성 페이지 진입이 불가능합니다.

### BR-2: 장소 정보 자동 채움
사용자 편의를 위해 장소 정보(식당명, 주소, 카테고리)는 자동으로 채워지며, 사용자가 수정할 수 없습니다. (데이터 일관성 유지)

### BR-3: 로그인 불필요
ConnectMap은 로그인 없이 리뷰 작성이 가능하므로, 이 페이지 진입 시 인증 절차가 없습니다.

### BR-4: 폼 초기 상태
리뷰 작성 폼은 항상 빈 값으로 초기화됩니다. (수정 기능은 별도 유즈케이스)

---

## Data Requirements (데이터 요구사항)

### Input Data
| 데이터 항목 | 데이터 타입 | 필수 여부 | 설명 |
|------------|------------|----------|------|
| placeId | UUID | 필수 | 리뷰를 작성할 장소의 고유 식별자 |

### Output Data
| 데이터 항목 | 데이터 타입 | 설명 |
|------------|------------|------|
| place.name | String | 장소명 (예: "강남 소고기집") |
| place.address | String | 주소 (예: "서울시 강남구 역삼동 123-45") |
| place.category_depth1 | String | 카테고리 대분류 (예: "한식") |
| place.category_depth2 | String | 카테고리 소분류 (예: "소고기 구이") |
| place.photo_url | String | 대표 사진 URL (옵션) |

### Database Query
```sql
SELECT id, name, address, category_depth1, category_depth2, photo_url
FROM places
WHERE id = {placeId}
LIMIT 1;
```

---

## UI/UX Specifications (UI/UX 명세)

### Screen Layout
```
┌─────────────────────────────────────┐
│  ← 뒤로가기          리뷰 작성      │ ← 상단 네비게이션 바
├─────────────────────────────────────┤
│  [대표 사진 썸네일]                  │
│  강남 소고기집                       │ ← 장소 정보 섹션
│  서울시 강남구 역삼동 123-45         │   (읽기 전용)
│  한식 > 소고기 구이                  │
├─────────────────────────────────────┤
│  작성자 정보                         │
│  [_________________]                │ ← 입력 필드 (닉네임/이메일)
│                                     │
│  평점                                │
│  ☆ ☆ ☆ ☆ ☆                        │ ← 별점 선택 (비선택 상태)
│                                     │
│  리뷰 내용                           │
│  ┌───────────────────────────────┐ │
│  │                               │ │ ← Textarea (최대 500자)
│  │                               │ │
│  └───────────────────────────────┘ │
│  0 / 500                            │ ← 글자 수 카운터
│                                     │
│  비밀번호                            │
│  [_________________]                │ ← 비밀번호 입력 (type: password)
│  * 리뷰 수정/삭제 시 사용됩니다      │
├─────────────────────────────────────┤
│  [     리뷰 작성하기     ]          │ ← 제출 버튼 (하단 고정)
└─────────────────────────────────────┘
```

### Component Breakdown
1. **Navigation Bar**: 뒤로가기 버튼, 페이지 제목
2. **Place Info Section**: Card 컴포넌트 (읽기 전용)
3. **Review Form**: React Hook Form 기반
   - Input (작성자 정보)
   - Star Rating (커스텀 컴포넌트)
   - Textarea (리뷰 내용, 글자 수 제한)
   - Input (비밀번호)
4. **Submit Button**: 하단 고정 버튼

### Accessibility
- 모든 입력 필드에 `<label>` 태그 제공
- 별점 선택 시 키보드 네비게이션 지원 (Tab, Space/Enter)
- 에러 메시지는 `aria-live="polite"` 속성으로 스크린 리더 지원
- 버튼에 명확한 텍스트 레이블 제공 ("리뷰 작성하기")

---

## Performance Requirements (성능 요구사항)

### PR-1: 페이지 로드 시간
- 리뷰 작성 페이지 초기 렌더링 시간: **1초 이내**
- 장소 정보 조회 API 응답 시간: **500ms 이내**

### PR-2: 인터랙션 반응성
- 버튼 클릭 후 페이지 전환 시작까지: **100ms 이내**
- 폼 입력 필드 포커스 전환: **즉시** (지연 없음)

### PR-3: 리소스 최적화
- 장소 대표 사진이 있는 경우 이미지 lazy loading 적용
- 페이지 전환 시 불필요한 데이터 재요청 방지 (캐싱 활용)

---

## Security Considerations (보안 고려사항)

### SC-1: placeId 유효성 검증
- URL 파라미터로 전달된 placeId가 UUID 형식인지 클라이언트 측에서 먼저 검증
- 서버 측에서도 placeId 형식 및 존재 여부 재검증

### SC-2: XSS 방지
- 장소 정보 표시 시 사용자 입력 데이터가 아니므로 XSS 위험은 낮음
- 하지만 렌더링 시 `dangerouslySetInnerHTML` 사용 금지

### SC-3: CSRF 방지
- 페이지 진입 자체는 GET 요청이므로 CSRF 위험 없음
- 향후 리뷰 제출 시 CSRF 토큰 적용 (다음 유즈케이스)

---

## Dependencies (의존성)

### Frontend Dependencies
- Next.js App Router (페이지 라우팅)
- React Hook Form + Zod (폼 상태 관리 및 유효성 검증)
- TanStack Query (장소 정보 조회 API 호출)
- shadcn-ui (UI 컴포넌트: Input, Textarea, Button)
- lucide-react (뒤로가기 아이콘)

### Backend Dependencies
- Hono (API 라우터)
- Supabase (places 테이블 조회)

### External APIs
- 네이버 지도 API (장소 정보가 Supabase에 없을 경우 대체 조회, 옵션)

---

## Testing Scenarios (테스트 시나리오)

### Test Case 1: 정상 진입 (검색 결과 리스트에서)
**Given**: 사용자가 검색 결과 리스트를 보고 있음
**When**: "강남 소고기집" 카드의 "리뷰 작성" 버튼 클릭
**Then**:
- `/review/new?placeId=123e4567-e89b-12d3-a456-426614174000` 페이지로 이동
- 장소 정보 섹션에 "강남 소고기집", 주소, 카테고리 표시
- 모든 입력 필드가 빈 값

---

### Test Case 2: 정상 진입 (장소 상세 페이지에서)
**Given**: 사용자가 장소 상세 페이지(`/place/123e4567...`)를 보고 있음
**When**: 하단 "리뷰 작성하기" 버튼 클릭
**Then**:
- `/review/new?placeId=123e4567-e89b-12d3-a456-426614174000` 페이지로 이동
- 장소 정보가 자동으로 표시됨
- 리뷰 작성 폼이 초기화 상태

---

### Test Case 3: placeId 누락
**Given**: 사용자가 직접 URL을 입력하여 `/review/new` 접근 (placeId 없음)
**When**: 페이지 로드 시도
**Then**:
- 에러 메시지 표시: "잘못된 접근입니다. 장소를 선택해주세요."
- 자동으로 메인 페이지(`/`)로 리다이렉트

---

### Test Case 4: 장소 정보 조회 실패
**Given**: placeId가 `999-invalid-id`로 전달됨 (DB에 없는 ID)
**When**: 페이지 로드 시 Supabase 조회 실패
**Then**:
- 에러 메시지 표시: "장소 정보를 찾을 수 없습니다."
- 이전 화면으로 자동 복귀

---

### Test Case 5: 네트워크 오류
**Given**: 사용자의 네트워크 연결이 불안정함
**When**: 장소 정보 조회 API 호출 시 타임아웃 발생
**Then**:
- 에러 메시지 표시: "네트워크 연결이 불안정합니다."
- "재시도" 버튼 제공
- 재시도 시 API 재호출

---

### Test Case 6: 모바일 반응형
**Given**: 사용자가 모바일 브라우저(iPhone 13 Pro, 390x844)로 접속
**When**: 리뷰 작성 페이지 진입
**Then**:
- 모든 UI 요소가 화면에 맞게 조정됨
- 입력 필드가 터치하기 적절한 크기 (최소 44x44px)
- 스크롤 가능

---

### Test Case 7: 뒤로가기 버튼 클릭
**Given**: 사용자가 리뷰 작성 페이지에 진입한 직후 (아직 입력하지 않음)
**When**: 상단 네비게이션 바의 뒤로가기 버튼 클릭
**Then**:
- 확인 다이얼로그 없이 즉시 이전 화면으로 복귀
- 리뷰 작성 페이지 언마운트

---

## Related Use Cases (관련 유즈케이스)

- **UC-02: 장소/맛집 검색** - 리뷰 작성 전 장소 선택
- **UC-03: 검색 결과에서 장소 선택** - 리뷰 작성 버튼 노출
- **UC-04: 장소 상세 정보 및 리뷰 조회** - 리뷰 작성 버튼 노출
- **UC-07: 리뷰 작성 및 제출** - 다음 단계 (폼 작성 후 제출)
- **UC-10: 뒤로가기 (리뷰 작성 페이지에서)** - 페이지 이탈 처리

---

## Appendix (부록)

### A. 기술 구현 노트
- **페이지 경로**: `/review/new` (쿼리 파라미터: `?placeId={uuid}`)
- **컴포넌트 구조**:
  ```
  ReviewWritePage
  ├── NavigationBar (뒤로가기)
  ├── PlaceInfoCard (장소 정보)
  └── ReviewForm (리뷰 작성 폼)
      ├── AuthorInput
      ├── StarRating
      ├── ReviewTextarea
      ├── PasswordInput
      └── SubmitButton
  ```
- **API 엔드포인트**: `GET /api/places/{placeId}` (장소 정보 조회)

### B. 디자인 리소스
- Figma 링크: (프로젝트에 맞게 추가)
- 컬러 팔레트:
  - Primary: #03C75A (네이버 그린)
  - Accent: #FFD700 (별점 노란색)
  - Background: #FFFFFF
  - Text: #333333
- 폰트: Pretendard (한글), Inter (영문)

---

**작성일**: 2025-10-22
**버전**: 1.0
**작성자**: Senior Developer (via Claude Code)
