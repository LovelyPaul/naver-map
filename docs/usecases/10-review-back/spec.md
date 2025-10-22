# Use Case Specification: 뒤로가기 (리뷰 작성 페이지에서)

## 문서 정보
- **Use Case ID**: UC-010
- **Use Case 명**: 뒤로가기 (리뷰 작성 페이지에서)
- **작성일**: 2025-10-22
- **작성자**: Senior Developer
- **버전**: 1.0
- **우선순위**: P0 (필수)

---

## 1. Use Case 개요

### 1.1 목적
리뷰 작성 페이지에서 사용자가 뒤로가기 버튼을 클릭하거나 브라우저 뒤로가기를 사용할 때, 작성 중인 데이터 손실을 방지하고 안전하게 이전 화면으로 복귀하는 기능을 제공합니다.

### 1.2 범위
- 리뷰 작성 페이지 상단의 뒤로가기 버튼 클릭
- 브라우저 네이티브 뒤로가기 버튼 클릭
- 작성 중인 데이터 존재 여부 확인
- 확인 다이얼로그 표시 및 사용자 선택 처리
- 이전 화면으로 안전한 복귀

### 1.3 관련 Use Cases
- UC-006: 리뷰 작성 페이지 진입
- UC-007: 리뷰 작성 및 제출
- UC-004: 장소 상세 정보 및 리뷰 조회

---

## 2. Actors (행위자)

### 2.1 Primary Actor
- **리뷰 작성자**: 리뷰 작성 페이지에서 뒤로가기를 시도하는 사용자

### 2.2 Secondary Actors
- **시스템**: 작성 중인 데이터 확인 및 경고 표시
- **브라우저**: 히스토리 관리 및 네비게이션 처리

---

## 3. 사전 조건 (Preconditions)

1. 사용자가 리뷰 작성 페이지(`/review/new?placeId={placeId}`)에 접근한 상태
2. 페이지가 정상적으로 로드되어 있음
3. 장소 정보가 정상적으로 표시되어 있음
4. 뒤로가기 버튼이 활성화된 상태

---

## 4. 사후 조건 (Postconditions)

### 4.1 성공 시나리오
1. **작성 중인 데이터가 없는 경우**:
   - 즉시 이전 화면(검색 결과 또는 장소 상세 페이지)으로 이동
   - 페이지 히스토리가 정상적으로 업데이트됨

2. **작성 중인 데이터가 있고 사용자가 확인한 경우**:
   - 작성 중인 데이터가 폐기됨
   - 이전 화면으로 이동
   - 페이지 히스토리가 정상적으로 업데이트됨

3. **작성 중인 데이터가 있고 사용자가 취소한 경우**:
   - 리뷰 작성 페이지에 그대로 유지
   - 작성 중인 데이터가 보존됨
   - 사용자가 계속 작성 가능

### 4.2 실패 시나리오
- 시스템 오류 발생 시 에러 메시지 표시
- 네비게이션 실패 시 현재 페이지 유지

---

## 5. Main Success Scenario (기본 성공 시나리오)

### 5.1 Flow: 작성 중인 데이터가 없는 경우

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | 사용자 | 리뷰 작성 페이지 상단의 뒤로가기 버튼 클릭 | - |
| 2 | 시스템 | - | 작성 중인 데이터 존재 여부 확인<br>- 작성자명: 빈 값<br>- 평점: 미선택<br>- 리뷰 내용: 빈 값<br>- 비밀번호: 빈 값 |
| 3 | 시스템 | - | 확인 다이얼로그 없이 즉시 이전 화면으로 이동 |
| 4 | 시스템 | - | 검색 결과 페이지 또는 장소 상세 페이지 렌더링 |

### 5.2 Flow: 작성 중인 데이터가 있는 경우

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1 | 사용자 | 리뷰 작성 페이지 상단의 뒤로가기 버튼 클릭 | - |
| 2 | 시스템 | - | 작성 중인 데이터 존재 여부 확인<br>- 작성자명, 평점, 리뷰 내용, 비밀번호 중 하나라도 입력됨 |
| 3 | 시스템 | - | 확인 다이얼로그 표시:<br>"작성 중인 내용이 있습니다. 나가시겠습니까?"<br>[확인] [취소] 버튼 제공 |
| 4 | 사용자 | [확인] 버튼 클릭 | - |
| 5 | 시스템 | - | 작성 중인 데이터 폐기 |
| 6 | 시스템 | - | 이전 화면으로 이동 |
| 7 | 시스템 | - | 검색 결과 페이지 또는 장소 상세 페이지 렌더링 |

### 5.3 Flow: 사용자가 취소를 선택한 경우

| Step | Actor | Action | System Response |
|------|-------|--------|-----------------|
| 1-3 | - | (위와 동일) | (위와 동일) |
| 4 | 사용자 | [취소] 버튼 클릭 | - |
| 5 | 시스템 | - | 확인 다이얼로그 닫기 |
| 6 | 시스템 | - | 리뷰 작성 페이지 유지 |
| 7 | 사용자 | - | 작성 중이던 내용으로 계속 작업 가능 |

---

## 6. Alternative Flows (대체 흐름)

### 6.1 브라우저 뒤로가기 버튼 사용

| Step | Description |
|------|-------------|
| 1 | 사용자가 브라우저의 네이티브 뒤로가기 버튼 클릭 |
| 2 | 시스템이 `beforeunload` 또는 라우터 이벤트 감지 |
| 3 | 작성 중인 데이터가 있으면 확인 다이얼로그 표시 |
| 4 | 사용자 선택에 따라 Main Success Scenario 4-7단계 진행 |

### 6.2 모달 형태의 리뷰 작성 페이지

| Step | Description |
|------|-------------|
| 1 | 리뷰 작성 UI가 모달/다이얼로그 형태로 구현된 경우 |
| 2 | 뒤로가기 버튼 또는 모달 외부 영역 클릭 시 |
| 3 | 작성 중인 데이터 확인 |
| 4 | 확인 다이얼로그 표시 (데이터 있는 경우) |
| 5 | 사용자 확인 시 모달 닫기 및 이전 화면 복귀 |

### 6.3 키보드 단축키 사용 (ESC)

| Step | Description |
|------|-------------|
| 1 | 사용자가 ESC 키 입력 |
| 2 | 시스템이 ESC 키 이벤트 감지 |
| 3 | 뒤로가기 버튼 클릭과 동일한 로직 실행 |
| 4 | Main Success Scenario 진행 |

---

## 7. Exception Flows (예외 흐름)

### 7.1 네비게이션 히스토리가 없는 경우

| Step | Description | Recovery Action |
|------|-------------|-----------------|
| 1 | 사용자가 직접 URL 입력으로 리뷰 작성 페이지 접근 | - |
| 2 | 뒤로가기 버튼 클릭 시 히스토리 스택이 비어있음 | - |
| 3 | - | 메인 페이지(`/`)로 리다이렉트 |

### 7.2 시스템 오류 발생

| Step | Description | Recovery Action |
|------|-------------|-----------------|
| 1 | 네비게이션 처리 중 예외 발생 | - |
| 2 | - | 에러 메시지 표시: "페이지 이동 중 오류가 발생했습니다" |
| 3 | - | 현재 페이지 유지 |
| 4 | - | 콘솔에 오류 로그 기록 |

### 7.3 브라우저 호환성 문제

| Step | Description | Recovery Action |
|------|-------------|-----------------|
| 1 | 구형 브라우저에서 `beforeunload` 이벤트 미지원 | - |
| 2 | - | 폴백: 라우터 레벨 가드 사용 (Next.js Router events) |
| 3 | - | 정상적인 확인 프로세스 진행 |

---

## 8. Business Rules (비즈니스 규칙)

### 8.1 데이터 존재 판단 기준

작성 중인 데이터가 있다고 판단하는 조건 (OR 조건):
1. **작성자명 필드**: 1자 이상 입력됨
2. **평점 필드**: 별점이 1개 이상 선택됨
3. **리뷰 내용 필드**: 1자 이상 입력됨 (공백 제외)
4. **비밀번호 필드**: 1자 이상 입력됨

**예외**:
- 장소 정보는 자동으로 채워지므로 판단 기준에서 제외

### 8.2 확인 다이얼로그 표시 정책

1. **필수 표시 조건**:
   - 작성 중인 데이터가 존재하는 경우

2. **표시 제외 조건**:
   - 모든 입력 필드가 비어있는 경우
   - 리뷰 제출이 성공한 직후의 페이지 이동 (자동 리다이렉트)

### 8.3 데이터 보존 정책

1. **폐기 조건**:
   - 사용자가 확인 다이얼로그에서 [확인] 선택
   - 리뷰 제출 성공 후 페이지 이동

2. **보존 조건**:
   - 사용자가 확인 다이얼로그에서 [취소] 선택
   - 네비게이션이 취소된 경우

3. **임시 저장 (선택적)**:
   - 로컬 스토리지에 작성 중인 데이터 임시 저장 (향후 고려)
   - 다음 방문 시 복구 옵션 제공 (향후 고려)

---

## 9. UI/UX Requirements

### 9.1 뒤로가기 버튼 디자인

**위치**: 리뷰 작성 페이지 상단 좌측
**아이콘**: 왼쪽 화살표 (`<` 또는 `←`)
**크기**: 24x24px 또는 32x32px (모바일 터치 영역 고려)
**색상**: 다크 그레이 (#333333)
**호버 효과**: 배경색 라이트 그레이 (#F5F5F5)

**예시**:
```
[←] 리뷰 작성
```

### 9.2 확인 다이얼로그 디자인

**컴포넌트**: Modal/Dialog (shadcn-ui `AlertDialog`)

**구조**:
```
┌─────────────────────────────────┐
│  작성 중인 내용이 있습니다       │
│  나가시겠습니까?                 │
│                                  │
│  작성 중인 내용은 저장되지       │
│  않습니다.                       │
│                                  │
│     [취소]      [확인]           │
└─────────────────────────────────┘
```

**세부 스펙**:
- **제목**: "작성 중인 내용이 있습니다"
- **설명**: "작성 중인 내용은 저장되지 않습니다."
- **버튼**:
  - 취소 버튼: Secondary 스타일 (회색 배경)
  - 확인 버튼: Destructive 스타일 (빨간색 또는 경고 색상)
- **포커스**: 기본 포커스는 [취소] 버튼 (안전장치)
- **닫기**: ESC 키로 닫기 = [취소] 선택과 동일

### 9.3 애니메이션

1. **다이얼로그 등장**: Fade-in + Scale-up (200ms)
2. **다이얼로그 퇴장**: Fade-out + Scale-down (200ms)
3. **페이지 전환**: Slide 또는 Fade 효과 (300ms)

### 9.4 모바일 고려사항

1. **뒤로가기 버튼**:
   - 터치 영역 최소 44x44px 확보
   - 화면 상단 좌측 고정 위치

2. **확인 다이얼로그**:
   - 전체 화면 대비 80% 너비
   - 하단 고정 버튼 레이아웃
   - 버튼 높이 최소 48px

---

## 10. Technical Requirements

### 10.1 Frontend 구현

**기술 스택**:
- Next.js App Router
- React Hook Form (폼 상태 관리)
- shadcn-ui `AlertDialog` 컴포넌트
- `react-use` (useBeforeUnload 훅)

**핵심 로직**:

```typescript
// 작성 중인 데이터 존재 여부 확인
function hasUnsavedChanges(formData: ReviewFormData): boolean {
  return (
    formData.authorName.trim().length > 0 ||
    formData.rating > 0 ||
    formData.content.trim().length > 0 ||
    formData.password.length > 0
  );
}

// 뒤로가기 핸들러
function handleBack() {
  if (hasUnsavedChanges(formData)) {
    setShowConfirmDialog(true);
  } else {
    router.back();
  }
}

// 확인 다이얼로그 - 확인
function handleConfirm() {
  setShowConfirmDialog(false);
  router.back();
}

// 확인 다이얼로그 - 취소
function handleCancel() {
  setShowConfirmDialog(false);
}
```

### 10.2 브라우저 뒤로가기 처리

**Next.js Router 이벤트 사용**:

```typescript
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

function ReviewWritePage() {
  const router = useRouter();

  useEffect(() => {
    // beforePopState는 App Router에서 미지원
    // 대신 window.onbeforeunload 사용
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges(formData)) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData]);
}
```

**주의사항**:
- `beforeunload` 이벤트는 브라우저 기본 확인창을 표시함 (커스터마이징 불가)
- 메시지 내용은 브라우저가 기본 제공하는 텍스트 사용
- 페이지 새로고침, 탭 닫기 시에도 동작

### 10.3 상태 관리

**로컬 컴포넌트 상태**:
```typescript
const [showConfirmDialog, setShowConfirmDialog] = useState(false);
```

**폼 상태 (React Hook Form)**:
```typescript
const { watch, formState } = useForm<ReviewFormData>();
const formData = watch();
```

### 10.4 라우팅

**이전 페이지 결정 로직**:
```typescript
function getPreviousRoute(): string {
  // 1순위: 브라우저 히스토리
  if (window.history.length > 1) {
    return 'back'; // router.back() 사용
  }

  // 2순위: 장소 상세 페이지
  if (placeId) {
    return `/place/${placeId}`;
  }

  // 3순위: 메인 페이지
  return '/';
}
```

---

## 11. Test Cases

### 11.1 Unit Test Cases

| Test Case ID | Description | Input | Expected Output |
|--------------|-------------|-------|-----------------|
| UT-010-001 | 빈 폼에서 뒤로가기 | 모든 필드 빈 값 | 즉시 이전 페이지 이동 |
| UT-010-002 | 작성자명만 입력 후 뒤로가기 | authorName = "테스트" | 확인 다이얼로그 표시 |
| UT-010-003 | 평점만 선택 후 뒤로가기 | rating = 3 | 확인 다이얼로그 표시 |
| UT-010-004 | 리뷰 내용만 입력 후 뒤로가기 | content = "맛있어요" | 확인 다이얼로그 표시 |
| UT-010-005 | 공백만 입력 후 뒤로가기 | content = "   " | 즉시 이전 페이지 이동 |
| UT-010-006 | 확인 다이얼로그 - 취소 | 취소 버튼 클릭 | 다이얼로그 닫기, 페이지 유지 |
| UT-010-007 | 확인 다이얼로그 - 확인 | 확인 버튼 클릭 | 다이얼로그 닫기, 페이지 이동 |
| UT-010-008 | ESC 키로 다이얼로그 닫기 | ESC 키 입력 | 다이얼로그 닫기, 페이지 유지 |

### 11.2 Integration Test Cases

| Test Case ID | Description | Steps | Expected Result |
|--------------|-------------|-------|-----------------|
| IT-010-001 | 검색 결과에서 리뷰 작성 후 뒤로가기 | 1. 검색 결과 페이지에서 리뷰 작성 진입<br>2. 일부 입력 후 뒤로가기<br>3. 확인 선택 | 검색 결과 페이지로 복귀 |
| IT-010-002 | 장소 상세에서 리뷰 작성 후 뒤로가기 | 1. 장소 상세 페이지에서 리뷰 작성 진입<br>2. 일부 입력 후 뒤로가기<br>3. 확인 선택 | 장소 상세 페이지로 복귀 |
| IT-010-003 | 브라우저 뒤로가기 사용 | 1. 리뷰 작성 페이지에서 데이터 입력<br>2. 브라우저 뒤로가기 버튼 클릭 | 브라우저 기본 확인창 표시 |
| IT-010-004 | 직접 URL 접근 후 뒤로가기 | 1. 리뷰 작성 URL 직접 입력<br>2. 뒤로가기 버튼 클릭 | 메인 페이지로 이동 |

### 11.3 E2E Test Cases

| Test Case ID | Description | User Journey | Expected Result |
|--------------|-------------|--------------|-----------------|
| E2E-010-001 | 전체 플로우 - 취소 후 제출 | 1. 리뷰 작성 중 뒤로가기<br>2. 취소 선택<br>3. 리뷰 완성 후 제출 | 리뷰 정상 저장 |
| E2E-010-002 | 전체 플로우 - 확인 후 재진입 | 1. 리뷰 작성 중 뒤로가기<br>2. 확인 선택<br>3. 다시 리뷰 작성 진입 | 새로운 빈 폼 표시 |
| E2E-010-003 | 모바일 터치 인터랙션 | 1. 모바일에서 뒤로가기 버튼 터치<br>2. 다이얼로그 버튼 터치 | 정상 동작 |

### 11.4 Edge Case Test Cases

| Test Case ID | Description | Condition | Expected Behavior |
|--------------|-------------|-----------|-------------------|
| EC-010-001 | 네트워크 연결 끊김 | 오프라인 상태에서 뒤로가기 | 확인 다이얼로그 정상 표시 (로컬 로직) |
| EC-010-002 | 페이지 새로고침 | 작성 중 F5 또는 새로고침 | 브라우저 기본 확인창 표시 |
| EC-010-003 | 탭 닫기 | 작성 중 탭 닫기 시도 | 브라우저 기본 확인창 표시 |
| EC-010-004 | 매우 긴 텍스트 입력 | content = 500자 입력 후 뒤로가기 | 확인 다이얼로그 정상 표시 |
| EC-010-005 | 특수문자 입력 | content = "!@#$%^&*()" 입력 후 뒤로가기 | 확인 다이얼로그 정상 표시 |

---

## 12. Performance Requirements

### 12.1 응답 시간
- **뒤로가기 버튼 클릭 → 다이얼로그 표시**: 50ms 이내
- **확인 선택 → 페이지 이동 시작**: 100ms 이내
- **전체 페이지 전환 완료**: 500ms 이내

### 12.2 메모리
- 확인 다이얼로그 컴포넌트 메모리 사용량: 1MB 이하
- 메모리 누수 없음 (컴포넌트 언마운트 시 리스너 정리)

---

## 13. Accessibility Requirements

### 13.1 키보드 접근성
- **Tab 키**: 뒤로가기 버튼 포커스 가능
- **Enter/Space 키**: 포커스된 버튼 활성화
- **ESC 키**: 다이얼로그 닫기 (취소와 동일)
- **Tab 순서**: 뒤로가기 버튼 → 다이얼로그 내 버튼 순환

### 13.2 스크린 리더
- **뒤로가기 버튼 aria-label**: "뒤로가기"
- **다이얼로그 role**: "alertdialog"
- **다이얼로그 aria-labelledby**: 제목 ID
- **다이얼로그 aria-describedby**: 설명 ID
- **버튼 텍스트**: 명확한 액션 설명 ("확인", "취소")

### 13.3 시각적 표시
- **포커스 링**: 2px 파란색 outline (focus-visible)
- **색상 대비**: 4.5:1 이상 (WCAG AA)
- **아이콘 + 텍스트**: 아이콘만 사용하지 않음

---

## 14. Security Considerations

### 14.1 데이터 보안
- 작성 중인 데이터는 메모리에만 존재 (서버 전송 전)
- 브라우저 로컬 스토리지 사용 시 민감 정보 제외 (비밀번호 등)

### 14.2 XSS 방지
- 확인 다이얼로그 메시지는 정적 텍스트 사용
- 사용자 입력값을 다이얼로그에 표시하지 않음

---

## 15. Localization (국제화)

현재는 한국어만 지원하지만, 향후 다국어 지원 시 메시지 키 정의:

```typescript
const messages = {
  ko: {
    confirmDialog: {
      title: '작성 중인 내용이 있습니다',
      description: '작성 중인 내용은 저장되지 않습니다.',
      confirm: '확인',
      cancel: '취소',
    },
    backButton: {
      ariaLabel: '뒤로가기',
    },
  },
  en: {
    confirmDialog: {
      title: 'You have unsaved changes',
      description: 'Your unsaved changes will be lost.',
      confirm: 'Leave',
      cancel: 'Stay',
    },
    backButton: {
      ariaLabel: 'Go back',
    },
  },
};
```

---

## 16. Monitoring & Analytics

### 16.1 추적 이벤트

**이벤트 명**: `review_write_back_click`
**속성**:
- `has_unsaved_data`: boolean
- `dialog_shown`: boolean
- `user_action`: 'confirm' | 'cancel' | 'direct_back'
- `form_completion`: number (0-100%, 입력된 필드 비율)

**예시**:
```typescript
analytics.track('review_write_back_click', {
  has_unsaved_data: true,
  dialog_shown: true,
  user_action: 'confirm',
  form_completion: 50,
});
```

### 16.2 지표 (Metrics)
- **뒤로가기 시도 횟수**
- **확인 다이얼로그 표시 횟수**
- **확인 선택 비율** vs **취소 선택 비율**
- **평균 폼 완성도** (뒤로가기 시점)

---

## 17. Dependencies

### 17.1 기술 의존성
- Next.js 14 App Router
- React 18+
- shadcn-ui AlertDialog 컴포넌트
- React Hook Form
- react-use (useBeforeUnload 훅)

### 17.2 기능 의존성
- UC-006: 리뷰 작성 페이지 진입 (선행 조건)
- UC-007: 리뷰 작성 및 제출 (연관 기능)

---

## 18. Open Questions & Decisions

### 18.1 결정 사항

| Question | Decision | Rationale | Date |
|----------|----------|-----------|------|
| 로컬 스토리지에 임시 저장? | Phase 1에서는 미구현 | MVP 범위 축소 | 2025-10-22 |
| 브라우저 뒤로가기 차단? | `beforeunload` 이벤트로 경고만 표시 | 사용자 경험 저해 최소화 | 2025-10-22 |
| 모달 vs 페이지 라우팅? | 페이지 라우팅 우선 | SEO 및 URL 공유 가능 | 2025-10-22 |
| ESC 키 동작? | 다이얼로그 닫기 (취소와 동일) | 일반적인 UX 패턴 | 2025-10-22 |

### 18.2 미결정 사항

| Question | Options | Impact | Owner |
|----------|---------|--------|-------|
| 임시 저장 기능 추가? | 1. LocalStorage<br>2. SessionStorage<br>3. IndexedDB | Medium | Product Manager |
| 모바일에서 스와이프 뒤로가기 지원? | 1. 지원<br>2. 미지원 | Low | UX Designer |

---

## 19. References

### 19.1 관련 문서
- [PRD: ConnectMap 위치기반 맛집 리뷰 플랫폼](/Users/paul/edu/awesomedev/2Week/connect-map/docs/prd.md)
- [Userflow: 10. 뒤로가기 (리뷰 작성 페이지에서)](/Users/paul/edu/awesomedev/2Week/connect-map/docs/userflow.md#10-뒤로가기-리뷰-작성-페이지에서)
- [UC-006: 리뷰 작성 페이지 진입](/Users/paul/edu/awesomedev/2Week/connect-map/docs/usecases/06-review-write-entry/spec.md)
- [UC-007: 리뷰 작성 및 제출](/Users/paul/edu/awesomedev/2Week/connect-map/docs/usecases/07-review-submit/spec.md)

### 19.2 외부 참고 자료
- [Next.js Router Events](https://nextjs.org/docs/app/api-reference/functions/use-router)
- [MDN: beforeunload event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)
- [shadcn-ui AlertDialog](https://ui.shadcn.com/docs/components/alert-dialog)
- [WCAG 2.1 Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

---

## 20. Appendix

### 20.1 코드 스니펫

**컴포넌트 구조 예시**:

```typescript
// src/features/review/components/ReviewWritePage.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface ReviewFormData {
  authorName: string;
  rating: number;
  content: string;
  password: string;
}

export function ReviewWritePage({ placeId }: { placeId: string }) {
  const router = useRouter();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { watch } = useForm<ReviewFormData>({
    defaultValues: {
      authorName: '',
      rating: 0,
      content: '',
      password: '',
    },
  });

  const formData = watch();

  const hasUnsavedChanges = () => {
    return (
      formData.authorName.trim().length > 0 ||
      formData.rating > 0 ||
      formData.content.trim().length > 0 ||
      formData.password.length > 0
    );
  };

  const handleBack = () => {
    if (hasUnsavedChanges()) {
      setShowConfirmDialog(true);
    } else {
      router.back();
    }
  };

  const handleConfirm = () => {
    setShowConfirmDialog(false);
    router.back();
  };

  const handleCancel = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div>
      {/* Header */}
      <header className="flex items-center p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label="뒤로가기"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <h1 className="ml-2 text-lg font-bold">리뷰 작성</h1>
      </header>

      {/* Review Form */}
      {/* ... */}

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작성 중인 내용이 있습니다</AlertDialogTitle>
            <AlertDialogDescription>
              작성 중인 내용은 저장되지 않습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-red-500 hover:bg-red-600">
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
```

### 20.2 테스트 코드 예시

```typescript
// src/features/review/components/__tests__/ReviewWritePage.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewWritePage } from '../ReviewWritePage';

describe('ReviewWritePage - 뒤로가기', () => {
  it('빈 폼에서 뒤로가기 시 즉시 이동', () => {
    const mockRouter = { back: jest.fn() };
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);

    render(<ReviewWritePage placeId="123" />);

    const backButton = screen.getByLabelText('뒤로가기');
    fireEvent.click(backButton);

    expect(mockRouter.back).toHaveBeenCalled();
    expect(screen.queryByText('작성 중인 내용이 있습니다')).not.toBeInTheDocument();
  });

  it('데이터 입력 후 뒤로가기 시 확인 다이얼로그 표시', () => {
    render(<ReviewWritePage placeId="123" />);

    // 작성자명 입력
    const authorInput = screen.getByLabelText('작성자');
    fireEvent.change(authorInput, { target: { value: '테스터' } });

    const backButton = screen.getByLabelText('뒤로가기');
    fireEvent.click(backButton);

    expect(screen.getByText('작성 중인 내용이 있습니다')).toBeInTheDocument();
  });

  it('확인 다이얼로그에서 취소 선택 시 페이지 유지', () => {
    const mockRouter = { back: jest.fn() };
    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter);

    render(<ReviewWritePage placeId="123" />);

    const authorInput = screen.getByLabelText('작성자');
    fireEvent.change(authorInput, { target: { value: '테스터' } });

    const backButton = screen.getByLabelText('뒤로가기');
    fireEvent.click(backButton);

    const cancelButton = screen.getByText('취소');
    fireEvent.click(cancelButton);

    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(screen.queryByText('작성 중인 내용이 있습니다')).not.toBeInTheDocument();
  });
});
```

---

## 21. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-22 | Senior Developer | 초안 작성 |

---

**승인**
- [ ] Product Owner
- [ ] Engineering Lead
- [ ] UX Designer
- [ ] QA Lead

---

이 문서는 "10. 뒤로가기 (리뷰 작성 페이지에서)" 기능의 공식 Use Case Specification입니다.
모든 개발, 테스트, QA 작업은 본 문서를 기준으로 진행됩니다.
