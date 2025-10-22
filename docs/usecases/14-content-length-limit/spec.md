# UseCase 14: 리뷰 내용 글자 수 제한

## 문서 정보
- **기능명**: 리뷰 내용 글자 수 제한 (Review Content Length Validation)
- **우선순위**: P0 (필수 기능)
- **관련 페이지**: `/review/new?placeId={placeId}`
- **작성일**: 2025-10-22
- **버전**: 1.0

---

## 개요 (Overview)

리뷰 작성 시 사용자가 입력하는 리뷰 내용의 글자 수를 실시간으로 검증하고 제한하는 기능입니다. 최대 500자까지 입력할 수 있으며, 현재 입력된 글자 수를 실시간으로 표시하여 사용자가 입력 가능한 글자 수를 쉽게 파악할 수 있도록 합니다. 이를 통해 데이터베이스 무결성을 유지하고, 리뷰 품질을 일정 수준으로 관리하며, 사용자 경험을 향상시킵니다.

---

## 사용자 목표 (User Goals)

### Primary Goals
1. 리뷰 내용을 적절한 길이로 작성하여 서버 검증 실패 방지
2. 입력 가능한 글자 수를 실시간으로 확인하며 효율적으로 리뷰 작성
3. 글자 수 초과로 인한 데이터 손실 방지

### Secondary Goals
1. 글자 수 제한을 통해 간결하고 핵심적인 리뷰 작성 유도
2. 불필요하게 긴 리뷰로 인한 가독성 저하 방지

---

## 액터 (Actors)

### Primary Actor
- **리뷰 작성자 (Contributor)**: 리뷰 내용을 입력하는 사용자

### Secondary Actors
- **클라이언트 시스템 (Client System)**: 글자 수 계산 및 실시간 검증을 수행하는 프론트엔드 애플리케이션
- **서버 시스템 (Server System)**: 최종 제출 시 글자 수 검증을 수행하는 백엔드 API

---

## 사전 조건 (Preconditions)

1. 사용자가 리뷰 작성 페이지(`/review/new?placeId={placeId}`)에 진입한 상태
2. 리뷰 내용 입력 필드(textarea)가 정상적으로 렌더링된 상태
3. 글자 수 카운터 UI가 초기화된 상태 ("0 / 500")
4. React Hook Form이 폼 상태를 관리하고 있는 상태
5. 자바스크립트가 활성화된 브라우저 환경

---

## 사후 조건 (Postconditions)

### 성공 시 (Success)
1. 사용자가 500자 이내의 리뷰 내용을 입력하고 현재 글자 수를 확인할 수 있음
2. 500자 초과 시 추가 입력이 차단되거나 경고 메시지가 표시됨
3. 글자 수 카운터가 실시간으로 업데이트되어 정확한 정보를 제공함
4. 폼 제출 시 서버 측 검증을 통과하여 리뷰가 정상적으로 등록됨

### 실패 시 (Failure)
1. 글자 수 계산 오류로 부정확한 카운터 표시
2. 500자 초과 입력이 차단되지 않아 서버 검증 실패
3. 사용자에게 적절한 피드백이 제공되지 않음

---

## 기본 플로우 (Main Flow)

### 1. 리뷰 내용 입력 시작

**액터**: 리뷰 작성자
**트리거**: 리뷰 내용 입력 필드(textarea) 클릭 및 포커스

#### 입력 (Input)
- 사용자가 textarea에 포커스를 맞춤
- 초기 상태: 빈 문자열, 글자 수 "0 / 500"

#### 처리 (Process)
1. textarea에 포커스 이벤트 발생
2. React Hook Form이 필드 상태 활성화
3. 글자 수 카운터 컴포넌트가 현재 값(빈 문자열) 기준으로 "0 / 500" 표시

#### 출력 (Output)
- textarea가 활성화되어 입력 대기 상태
- 글자 수 카운터: "0 / 500" (기본 색상: #666666)
- 커서가 textarea 내부에 위치

---

### 2. 텍스트 입력 및 실시간 글자 수 계산

**액터**: 리뷰 작성자
**트리거**: 사용자가 키보드로 텍스트 입력

#### 입력 (Input)
- 사용자가 한 글자씩 입력 (예: "맛있어요")
- 입력 이벤트 발생 (`onChange`)

#### 처리 (Process)

##### 2.1 입력 값 감지
1. React의 `onChange` 이벤트 핸들러가 입력 이벤트 감지
2. 현재 textarea의 `value` 값 추출
3. 폼 상태 업데이트 (React Hook Form의 `setValue` 또는 자동 업데이트)

##### 2.2 글자 수 계산
1. 입력된 텍스트의 길이 계산
   - JavaScript의 `String.prototype.length` 사용
   - 유니코드 문자 길이 정확히 계산 (이모지 등 고려)
   - 줄바꿈 문자(`\n`)도 글자 수에 포함

   ```typescript
   const currentLength = content.length; // 예: "맛있어요" → 5
   ```

2. 최대 글자 수(500자)와 비교
   ```typescript
   const maxLength = 500;
   const isOverLimit = currentLength > maxLength;
   ```

##### 2.3 글자 수 카운터 업데이트
1. 글자 수 카운터 UI 업데이트
   - 현재 글자 수 / 최대 글자 수 형식 (예: "5 / 500")
2. 글자 수에 따른 스타일 변경:
   - 0-450자: 기본 색상 (#666666)
   - 451-500자: 경고 색상 (#FF9800, 주황색)
   - 500자 초과: 에러 색상 (#F44336, 빨간색)

##### 2.4 입력 제한 처리 (500자 초과 시)
**옵션 A: maxLength 속성 사용 (권장)**
- textarea에 `maxLength={500}` 속성 적용
- 브라우저가 자동으로 500자 이후 입력 차단
- 추가적인 자바스크립트 로직 불필요

**옵션 B: 이벤트 핸들러에서 제어**
- 500자 초과 입력 시 초과된 부분 자동 제거
  ```typescript
  if (content.length > 500) {
    const truncated = content.substring(0, 500);
    setValue('content', truncated);
  }
  ```

#### 출력 (Output)

##### 정상 입력 (500자 이내)
- textarea에 입력된 텍스트 표시
- 글자 수 카운터 업데이트:
  - 예: "5 / 500" (기본 색상)
  - 예: "480 / 500" (경고 색상, 주황색)
  - 예: "500 / 500" (경고 색상, 진한 주황색 또는 빨간색)

##### 500자 초과 시도
- **옵션 A 적용 시**: 추가 입력이 무시됨 (브라우저 기본 동작)
- **옵션 B 적용 시**: 500자까지만 유지되고 초과 부분 자동 삭제
- 글자 수 카운터: "500 / 500" (빨간색)
- 에러 메시지 표시 (textarea 하단):
  - "리뷰 내용은 최대 500자까지 입력 가능합니다."

---

### 3. 복사-붙여넣기로 대량 텍스트 입력

**액터**: 리뷰 작성자
**트리거**: 사용자가 다른 곳에서 텍스트를 복사하여 textarea에 붙여넣기 (Ctrl+V / Cmd+V)

#### 입력 (Input)
- 클립보드에서 복사된 텍스트 (예: 600자 분량)
- `onPaste` 이벤트 발생

#### 처리 (Process)

##### 3.1 붙여넣기 이벤트 감지
1. `onPaste` 이벤트 핸들러 실행 (옵션)
2. 또는 `onChange` 이벤트로 통합 처리

##### 3.2 글자 수 초과 검증
1. 붙여넣기된 텍스트의 길이 계산
2. 500자 초과 여부 확인

##### 3.3 초과 시 자동 자르기
```typescript
const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  const pastedText = e.clipboardData.getData('text');
  const currentValue = content;

  // 붙여넣기 후 예상 길이
  const newValue = currentValue + pastedText;

  if (newValue.length > 500) {
    e.preventDefault(); // 기본 붙여넣기 동작 차단
    const availableLength = 500 - currentValue.length;
    const truncatedText = pastedText.substring(0, availableLength);
    const finalValue = currentValue + truncatedText;
    setValue('content', finalValue);
  }
};
```

또는 **maxLength 속성에 의존** (브라우저가 자동 처리):
- maxLength가 설정된 경우, 브라우저가 자동으로 500자까지만 붙여넣기 허용
- 초과 부분은 무시됨

#### 출력 (Output)
- 500자까지만 입력된 상태
- 글자 수 카운터: "500 / 500" (빨간색)
- 경고 메시지 표시:
  - "붙여넣기한 내용이 500자를 초과하여 일부가 잘렸습니다."
  - 또는 무음 처리 (사용자가 글자 수 카운터로 확인)

---

### 4. 줄바꿈 문자 입력

**액터**: 리뷰 작성자
**트리거**: 사용자가 Enter 키를 눌러 줄바꿈 입력

#### 입력 (Input)
- Enter 키 입력
- `\n` 문자가 textarea 값에 추가됨

#### 처리 (Process)
1. `onChange` 이벤트 발생
2. textarea 값에 줄바꿈 문자(`\n`) 포함
3. 글자 수 계산 시 줄바꿈 문자도 1자로 계산
   ```typescript
   const content = "맛있어요\n분위기도 좋아요"; // 길이: 14자 (줄바꿈 포함)
   const length = content.length; // 14
   ```

#### 출력 (Output)
- 줄바꿈이 반영된 textarea 표시
- 글자 수 카운터에 줄바꿈 문자도 포함된 총 글자 수 표시
  - 예: "14 / 500"

---

### 5. 이모지 및 특수문자 입력

**액터**: 리뷰 작성자
**트리거**: 사용자가 이모지 또는 특수문자 입력

#### 입력 (Input)
- 이모지 입력 (예: "😊", "👍", "❤️")
- 특수문자 입력 (예: "★", "♥", "✓")

#### 처리 (Process)

##### 5.1 유니코드 글자 수 계산
JavaScript의 `String.length`는 UTF-16 코드 유닛 기준이므로, 일부 이모지는 2자로 계산될 수 있음.

**문제**:
```javascript
const text = "맛있어요 😊";
console.log(text.length); // 7 (일부 이모지는 2개 코드 유닛)
```

**해결 방법**:
- **방법 1**: 기본 `String.length` 사용 (단순하지만 이모지 2자 계산)
- **방법 2**: Grapheme Cluster 기준 계산 (정확하지만 복잡)
  ```typescript
  const countGraphemes = (str: string) => {
    const segmenter = new Intl.Segmenter('ko', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(str)).length;
  };
  ```

**MVP 권장 방식**: 기본 `String.length` 사용 (단순성 우선)
- 대부분의 이모지는 1-2자로 계산되며, 사용자 경험에 큰 영향 없음
- 서버 측 검증도 동일한 방식 적용하여 일관성 유지

##### 5.2 글자 수 계산 및 업데이트
1. 이모지/특수문자 포함 전체 텍스트 길이 계산
2. 글자 수 카운터 업데이트

#### 출력 (Output)
- 이모지/특수문자가 포함된 textarea 표시
- 글자 수 카운터 업데이트 (이모지 포함)
  - 예: "맛있어요 😊" → "7 / 500" (또는 "6 / 500", Grapheme Cluster 방식)

---

### 6. 글자 수 상태별 시각적 피드백

**액터**: 클라이언트 시스템 (자동)
**트리거**: 글자 수 변경 시 자동 실행

#### 입력 (Input)
- 현재 글자 수 (0-500자 이상)

#### 처리 (Process)
1. 글자 수 범위 확인:
   - 0-450자: 안전 범위
   - 451-490자: 경고 범위 (곧 제한에 도달)
   - 491-500자: 제한 임박
   - 500자 초과: 에러 (입력 차단됨)

2. 글자 수 카운터 색상 변경:
   ```typescript
   const getCounterColor = (length: number) => {
     if (length > 500) return '#F44336'; // 빨간색 (에러)
     if (length >= 491) return '#F44336'; // 빨간색 (제한 임박)
     if (length >= 451) return '#FF9800'; // 주황색 (경고)
     return '#666666'; // 기본 회색
   };
   ```

3. 에러 메시지 표시 조건:
   - 500자 초과 시도 시: 에러 메시지 표시
   - 500자 미만: 에러 메시지 숨김

#### 출력 (Output)

##### 안전 범위 (0-450자)
- 글자 수 카운터: 기본 색상 (#666666)
- 예: "123 / 500"
- 에러 메시지 없음

##### 경고 범위 (451-490자)
- 글자 수 카운터: 주황색 (#FF9800)
- 예: "480 / 500"
- 에러 메시지 없음 (또는 안내 메시지: "곧 글자 수 제한에 도달합니다.")

##### 제한 임박 (491-500자)
- 글자 수 카운터: 빨간색 (#F44336)
- 예: "500 / 500"
- 경고 메시지: "리뷰 내용이 최대 길이에 도달했습니다."

##### 500자 초과 시도
- 글자 수 카운터: 빨간색 (#F44336), 굵게 표시
- 예: "500 / 500" (입력 차단되어 500자 유지)
- 에러 메시지: "리뷰 내용은 최대 500자까지 입력 가능합니다."

---

### 7. 폼 제출 시 최종 검증

**액터**: 리뷰 작성자
**트리거**: "리뷰 작성하기" 버튼 클릭

#### 입력 (Input)
- 폼 데이터 (작성자 이름, 별점, 리뷰 내용, 비밀번호)
- 리뷰 내용 길이

#### 처리 (Process)

##### 7.1 클라이언트 측 최종 검증
1. React Hook Form의 유효성 검증 실행
2. Zod 스키마로 리뷰 내용 길이 검증:
   ```typescript
   const reviewSchema = z.object({
     content: z.string()
       .trim()
       .min(1, { message: '리뷰 내용을 입력해주세요.' })
       .max(500, { message: '리뷰 내용은 최대 500자까지 입력 가능합니다.' })
   });
   ```

3. 검증 실패 시:
   - 제출 중단
   - 에러 메시지 표시
   - 해당 필드로 포커스 이동

4. 검증 성공 시:
   - API 요청 진행

##### 7.2 서버 측 최종 검증
1. 서버에서 요청 데이터 수신
2. Zod 스키마로 재검증:
   ```typescript
   // Backend: /src/features/review/backend/schema.ts
   export const reviewCreateSchema = z.object({
     content: z.string()
       .trim()
       .min(1, { message: '리뷰 내용을 입력해주세요.' })
       .max(500, { message: '리뷰 내용은 최대 500자까지 입력 가능합니다.' })
   });
   ```

3. 검증 실패 시 400 Bad Request 응답:
   ```json
   {
     "success": false,
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "입력 데이터가 올바르지 않습니다.",
       "details": [
         {
           "field": "content",
           "message": "리뷰 내용은 최대 500자까지 입력 가능합니다."
         }
       ]
     }
   }
   ```

4. 검증 성공 시 리뷰 저장 및 201 Created 응답

#### 출력 (Output)

##### 클라이언트 측 검증 실패
- 에러 메시지 표시: "리뷰 내용은 최대 500자까지 입력 가능합니다."
- textarea에 빨간색 테두리 표시 (에러 상태)
- 글자 수 카운터 빨간색 강조
- 제출 버튼 활성화 유지 (재시도 가능)

##### 서버 측 검증 실패 (클라이언트 우회 시)
- 에러 토스트 메시지: "리뷰 내용이 너무 깁니다. 500자 이내로 입력해주세요."
- 작성 중인 내용 유지 (재시도 가능)

##### 검증 성공
- 리뷰 정상 등록
- 장소 상세 페이지로 리다이렉트

---

## 대체 플로우 (Alternative Flows)

### A1: 자바스크립트 비활성화 환경

**조건**: 사용자의 브라우저에서 자바스크립트가 비활성화된 경우

#### 처리
1. 실시간 글자 수 카운터 작동 불가
2. textarea의 `maxLength` 속성만 작동 (HTML 기본 기능)
   - 브라우저가 500자 이후 입력 차단
3. 폼 제출 시 서버 측 검증에 의존

#### 출력
- 글자 수 카운터 표시 안 됨
- 500자 초과 입력 시 브라우저가 자동 차단
- 서버 측 검증 실패 시 페이지 리로드 후 에러 메시지 표시

---

### A2: 서버 측 검증만 의존 (클라이언트 검증 우회)

**조건**: 개발자 도구 등으로 클라이언트 측 검증 우회 시도

#### 처리
1. 사용자가 브라우저 콘솔에서 `maxLength` 속성 제거
2. 500자 초과 입력 후 제출
3. 서버 측 Zod 검증에서 에러 감지
4. 400 Bad Request 응답 반환

#### 출력
- 에러 응답 수신
- 클라이언트에서 에러 메시지 표시:
  - "리뷰 내용이 너무 깁니다. 500자 이내로 입력해주세요."
- 작성 중인 내용 유지 (사용자가 수정 후 재시도)

---

### A3: 데이터베이스 제약 조건 위반

**조건**: 클라이언트 및 서버 검증을 모두 우회하여 DB에 직접 입력 시도

#### 처리
1. Supabase PostgreSQL의 `CHECK` 제약 조건 실행:
   ```sql
   CHECK (LENGTH(content) <= 500)
   ```
2. 제약 조건 위반 시 데이터베이스 에러 발생
3. 서버에서 500 Internal Server Error 반환 (또는 적절히 처리하여 400 반환)

#### 출력
- 에러 로그 기록 (서버 측)
- 클라이언트에서 일반 에러 메시지 표시:
  - "리뷰 작성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."

---

## 예외 플로우 (Exception Flows)

### E1: 글자 수 계산 오류

**조건**: 특정 브라우저 또는 입력 방식에서 글자 수 계산이 부정확한 경우

#### 처리
1. 클라이언트 측에서 계산 오류 발생 (예: 이모지 처리 문제)
2. 사용자가 500자 미만으로 보이지만 실제로는 초과
3. 서버 측 검증에서 에러 감지

#### 출력
- 서버 검증 에러 메시지 표시
- 사용자가 내용 일부 삭제 후 재시도
- 에러 로그 수집하여 이슈 트래킹

---

### E2: 네트워크 지연으로 인한 동기화 문제

**조건**: 사용자가 빠르게 입력하여 상태 업데이트가 지연되는 경우

#### 처리
1. React의 상태 업데이트 배칭으로 인한 지연
2. 글자 수 카운터가 실제보다 느리게 업데이트
3. 하지만 최종 제출 시에는 최신 값으로 검증

#### 출력
- 짧은 지연 후 글자 수 카운터 정상 업데이트
- 사용자 경험에 큰 영향 없음 (일반적으로 100ms 이내)

---

### E3: 복사-붙여넭기 시 포맷팅 문자 포함

**조건**: 사용자가 Word, 노션 등에서 복사한 텍스트에 숨겨진 포맷팅 문자가 포함된 경우

#### 처리
1. 붙여넣기 시 보이지 않는 제어 문자 포함
2. 실제 글자 수가 보이는 것보다 많음
3. 글자 수 카운터가 예상보다 높게 표시

#### 출력
- 글자 수 카운터가 정확히 표시됨 (제어 문자 포함)
- 사용자가 의아해할 수 있으나, 서버 검증과 일치
- 향후 개선: `onPaste`에서 제어 문자 제거 로직 추가 고려

---

## UI/UX 상세 (UI/UX Details)

### 레이아웃

#### 글자 수 카운터 위치
```
┌─────────────────────────────────────┐
│  리뷰 내용                           │
│  ┌───────────────────────────────┐ │
│  │ 맛있어요. 분위기도 좋았습니다.│ │
│  │                               │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│  <div style="display: flex; justify-content: space-between;">
│    <span style="color: {dynamic}">123 / 500</span>  ← 글자 수 카운터
│    {에러 메시지 영역}
│  </div>                            │
└─────────────────────────────────────┘
```

### 컴포넌트 스타일

#### 글자 수 카운터
```tsx
// 예시 컴포넌트
const CharacterCounter = ({ length, maxLength }: Props) => {
  const getColor = (len: number) => {
    if (len > maxLength) return '#F44336'; // Red
    if (len >= maxLength * 0.98) return '#F44336'; // Red (임박)
    if (len >= maxLength * 0.9) return '#FF9800'; // Orange
    return '#666666'; // Gray
  };

  const color = getColor(length);
  const fontWeight = length >= maxLength ? 'bold' : 'normal';

  return (
    <span style={{ color, fontWeight, fontSize: '14px' }}>
      {length} / {maxLength}
    </span>
  );
};
```

#### 에러 메시지
```tsx
{length > maxLength && (
  <p style={{ color: '#F44336', fontSize: '12px', marginTop: '4px' }}>
    리뷰 내용은 최대 500자까지 입력 가능합니다.
  </p>
)}
```

### 접근성 (Accessibility)

1. **스크린 리더 지원**
   ```tsx
   <div role="status" aria-live="polite" aria-atomic="true">
     <span className="sr-only">
       현재 {length}자 입력, 최대 {maxLength}자까지 입력 가능
     </span>
   </div>
   ```

2. **에러 메시지 연결**
   ```tsx
   <textarea
     id="review-content"
     aria-describedby="content-counter content-error"
     aria-invalid={length > maxLength}
   />
   <span id="content-counter">{length} / 500</span>
   {length > maxLength && (
     <p id="content-error" role="alert">
       리뷰 내용은 최대 500자까지 입력 가능합니다.
     </p>
   )}
   ```

---

## 기술 구현 (Technical Implementation)

### Frontend

#### 컴포넌트 구조
```
/src/features/review/components/
  ├── ReviewForm.tsx               # 리뷰 작성 폼 (메인)
  ├── ReviewTextarea.tsx           # 리뷰 내용 입력 필드
  └── CharacterCounter.tsx         # 글자 수 카운터 컴포넌트
```

#### ReviewTextarea 컴포넌트
```typescript
// /src/features/review/components/ReviewTextarea.tsx
'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { CharacterCounter } from './CharacterCounter';

const MAX_LENGTH = 500;

export const ReviewTextarea = () => {
  const { register, watch, formState: { errors } } = useFormContext();
  const content = watch('content') || '';
  const currentLength = content.length;

  return (
    <div className="space-y-2">
      <label htmlFor="content" className="block text-sm font-medium text-gray-700">
        리뷰 내용
      </label>

      <textarea
        id="content"
        {...register('content')}
        maxLength={MAX_LENGTH}
        placeholder="맛집에 대한 경험을 공유해주세요 (최대 500자)"
        rows={6}
        className={`w-full p-3 border rounded-lg resize-none ${
          errors.content ? 'border-red-500' : 'border-gray-300'
        }`}
        aria-describedby="content-counter content-error"
        aria-invalid={!!errors.content}
      />

      <div className="flex justify-between items-start">
        <CharacterCounter current={currentLength} max={MAX_LENGTH} />

        {errors.content && (
          <p id="content-error" className="text-red-500 text-sm" role="alert">
            {errors.content.message as string}
          </p>
        )}
      </div>
    </div>
  );
};
```

#### CharacterCounter 컴포넌트
```typescript
// /src/features/review/components/CharacterCounter.tsx
'use client';

interface CharacterCounterProps {
  current: number;
  max: number;
}

export const CharacterCounter = ({ current, max }: CharacterCounterProps) => {
  const getColor = () => {
    if (current > max) return 'text-red-600';
    if (current >= max * 0.98) return 'text-red-600';
    if (current >= max * 0.9) return 'text-orange-500';
    return 'text-gray-600';
  };

  const fontWeight = current >= max ? 'font-bold' : 'font-normal';

  return (
    <span
      id="content-counter"
      className={`text-sm ${getColor()} ${fontWeight}`}
      aria-label={`현재 ${current}자 입력, 최대 ${max}자까지 입력 가능`}
    >
      {current} / {max}
    </span>
  );
};
```

#### React Hook Form 통합
```typescript
// /src/features/review/components/ReviewForm.tsx
'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reviewFormSchema } from '../lib/schema';
import { ReviewTextarea } from './ReviewTextarea';

export const ReviewForm = ({ placeId }: { placeId: string }) => {
  const methods = useForm({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      content: '',
      // ... 다른 필드
    }
  });

  const onSubmit = async (data: ReviewFormData) => {
    // 제출 로직
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        {/* ... 다른 필드 */}
        <ReviewTextarea />
        {/* ... 제출 버튼 */}
      </form>
    </FormProvider>
  );
};
```

#### Zod 스키마 (프론트엔드)
```typescript
// /src/features/review/lib/schema.ts
import { z } from 'zod';

export const reviewFormSchema = z.object({
  content: z.string()
    .trim()
    .min(1, { message: '리뷰 내용을 입력해주세요.' })
    .max(500, { message: '리뷰 내용은 최대 500자까지 입력 가능합니다.' }),
  // ... 다른 필드
});

export type ReviewFormData = z.infer<typeof reviewFormSchema>;
```

---

### Backend

#### Zod 스키마 (백엔드)
```typescript
// /src/features/review/backend/schema.ts
import { z } from 'zod';

export const reviewCreateSchema = z.object({
  placeId: z.string().uuid(),
  authorName: z.string().trim().min(2).max(100),
  rating: z.number().int().min(1).max(5),
  content: z.string()
    .trim()
    .min(1, { message: '리뷰 내용을 입력해주세요.' })
    .max(500, { message: '리뷰 내용은 최대 500자까지 입력 가능합니다.' }),
  password: z.string().min(4).max(50)
});

export type ReviewCreateRequest = z.infer<typeof reviewCreateSchema>;
```

#### 에러 코드
```typescript
// /src/features/review/backend/error.ts
export const ReviewErrorCode = {
  CONTENT_TOO_LONG: 'CONTENT_TOO_LONG',
  CONTENT_EMPTY: 'CONTENT_EMPTY',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;
```

#### 라우터 검증
```typescript
// /src/features/review/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { reviewCreateSchema } from './schema';

export const reviewRoutes = new Hono()
  .post('/api/reviews', zValidator('json', reviewCreateSchema), async (c) => {
    const data = c.req.valid('json');

    // data.content는 이미 검증됨 (1-500자)
    // ...
  });
```

---

### Database

#### 테이블 제약 조건
```sql
-- /supabase/migrations/0002_create_reviews_table.sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT NOT NULL CHECK (LENGTH(content) >= 1 AND LENGTH(content) <= 500),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 비즈니스 규칙 (Business Rules)

### BR-1: 최대 글자 수 제한
리뷰 내용은 **최대 500자**까지 입력할 수 있습니다. 이는 다음 이유로 설정되었습니다:
- 간결한 리뷰 유도 (가독성 향상)
- 데이터베이스 성능 최적화
- 모바일 환경에서의 UX 고려

### BR-2: 최소 글자 수 제한
리뷰 내용은 **최소 1자** 이상이어야 합니다. 빈 리뷰는 허용되지 않습니다.

### BR-3: 줄바꿈 문자 포함
줄바꿈 문자(`\n`)도 글자 수에 포함됩니다. 사용자가 Enter 키를 누르면 1자로 계산됩니다.

### BR-4: 공백 처리
제출 시 앞뒤 공백은 자동으로 제거됩니다 (`trim()`). 하지만 글자 수 계산 시에는 trim 전의 길이를 사용합니다.

### BR-5: 실시간 피드백
사용자가 입력하는 모든 글자에 대해 실시간으로 글자 수를 표시하여 사용자 경험을 향상시킵니다.

---

## 데이터 요구사항 (Data Requirements)

### Input Data
| 데이터 항목 | 데이터 타입 | 제약 조건 | 설명 |
|------------|------------|----------|------|
| content | String | 1-500자 | 리뷰 내용 텍스트 |

### Output Data
| 데이터 항목 | 데이터 타입 | 설명 |
|------------|------------|------|
| currentLength | Number | 현재 입력된 글자 수 (0-500+) |
| maxLength | Number | 최대 허용 글자 수 (500) |
| isValid | Boolean | 글자 수 제한 내에 있는지 여부 |
| colorState | String | 카운터 색상 상태 (gray/orange/red) |

---

## 테스트 케이스 (Test Cases)

### 단위 테스트 (Unit Tests)

#### UT-14-001: 글자 수 계산 - 일반 텍스트
**입력**: "맛있어요"
**예상 출력**: currentLength = 5

#### UT-14-002: 글자 수 계산 - 줄바꿈 포함
**입력**: "맛있어요\n분위기도 좋아요"
**예상 출력**: currentLength = 14 (줄바꿈 1자 포함)

#### UT-14-003: 글자 수 계산 - 이모지 포함
**입력**: "맛있어요 😊"
**예상 출력**: currentLength = 6 또는 7 (이모지 처리 방식에 따라)

#### UT-14-004: 500자 정확히 입력
**입력**: 500자 텍스트
**예상 출력**:
- currentLength = 500
- isValid = true
- colorState = 'red' (제한 임박)

#### UT-14-005: 500자 초과 입력 시도
**입력**: 550자 텍스트 입력 시도
**예상 출력**:
- maxLength 속성으로 500자까지만 입력됨
- currentLength = 500
- 추가 입력 차단

#### UT-14-006: 복사-붙여넣기로 500자 초과
**입력**: 600자 텍스트 붙여넣기
**예상 출력**:
- 500자까지만 입력됨
- 경고 메시지 표시 (옵션)

---

### 통합 테스트 (Integration Tests)

#### IT-14-001: 실시간 글자 수 업데이트
1. 리뷰 작성 페이지 진입
2. textarea에 "맛" 입력
3. 글자 수 카운터 확인: "1 / 500"
4. "있어요" 추가 입력
5. 글자 수 카운터 확인: "4 / 500"

#### IT-14-002: 색상 변경 (경고 범위)
1. textarea에 470자 입력
2. 글자 수 카운터 색상: 주황색 (#FF9800)
3. 10자 더 입력 (총 480자)
4. 색상 유지: 주황색

#### IT-14-003: 색상 변경 (제한 임박)
1. textarea에 495자 입력
2. 글자 수 카운터 색상: 빨간색 (#F44336)
3. 5자 더 입력 (총 500자)
4. 색상 유지: 빨간색
5. 추가 입력 시도 → 차단됨

#### IT-14-004: 폼 제출 시 검증
1. textarea에 500자 입력
2. "리뷰 작성하기" 버튼 클릭
3. 클라이언트 검증 통과
4. 서버 검증 통과
5. 리뷰 정상 등록

#### IT-14-005: 500자 초과 제출 시도 (클라이언트 우회)
1. 개발자 도구에서 maxLength 속성 제거
2. textarea에 550자 입력
3. "리뷰 작성하기" 버튼 클릭
4. 클라이언트 검증 실패
5. 에러 메시지 표시: "리뷰 내용은 최대 500자까지 입력 가능합니다."

---

### 엔드투엔드 테스트 (E2E Tests)

#### E2E-14-001: 전체 플로우 - 정상 입력
1. 메인 페이지 접속
2. 장소 검색 → "리뷰 작성" 클릭
3. textarea에 100자 입력
4. 글자 수 카운터 확인: "100 / 500" (회색)
5. 폼 제출
6. 리뷰 정상 등록 확인

#### E2E-14-002: 전체 플로우 - 500자 정확히 입력
1. 리뷰 작성 페이지 진입
2. textarea에 500자 정확히 입력
3. 글자 수 카운터: "500 / 500" (빨간색)
4. 경고 메시지 표시 (옵션)
5. 폼 제출
6. 리뷰 정상 등록

#### E2E-14-003: 전체 플로우 - 복사-붙여넣기 500자 초과
1. 리뷰 작성 페이지 진입
2. 600자 텍스트를 클립보드에 복사
3. textarea에 붙여넣기 (Ctrl+V)
4. 500자까지만 입력됨
5. 글자 수 카운터: "500 / 500"
6. 폼 제출
7. 리뷰 정상 등록

---

## 성능 고려사항 (Performance Considerations)

### 1. 글자 수 계산 최적화
- `String.length` 사용 (O(1) 시간 복잡도)
- Grapheme Cluster 방식은 MVP에서 제외 (복잡도 증가)

### 2. 실시간 업데이트 성능
- React의 자동 배칭 활용 (React 18+)
- debounce 불필요 (글자 수 계산이 충분히 빠름)
- 하지만 매우 긴 텍스트(수천 자)에서는 debounce 고려 가능

### 3. 렌더링 최적화
- `CharacterCounter` 컴포넌트를 `React.memo`로 감싸 불필요한 리렌더링 방지
  ```typescript
  export const CharacterCounter = React.memo(({ current, max }: Props) => {
    // ...
  });
  ```

---

## 보안 고려사항 (Security Considerations)

### 1. XSS 방지
- textarea 값은 React가 자동으로 이스케이핑 처리
- 서버 측에서도 입력 값 sanitize (추가 보호)

### 2. 클라이언트 검증 우회 대응
- 서버 측에서 동일한 검증 로직 재실행 (Zod)
- 데이터베이스 제약 조건으로 최종 방어선 구축

### 3. SQL Injection 방지
- Supabase 클라이언트가 자동 처리 (Prepared Statements)

---

## 접근성 (Accessibility)

### 1. 스크린 리더 지원
- 글자 수 카운터에 `aria-label` 제공
- 에러 메시지는 `role="alert"` 사용하여 즉시 읽어줌

### 2. 키보드 네비게이션
- textarea에 Tab 키로 포커스 이동 가능
- 글자 수 카운터는 읽기 전용이므로 포커스 불필요

### 3. 색상 대비
- 회색(#666666): 대비 비율 4.5:1 이상 (배경 흰색 기준)
- 주황색(#FF9800): 경고 색상으로 충분한 대비
- 빨간색(#F44336): 에러 색상으로 명확히 구분

---

## 에러 코드 (Error Codes)

| 코드 | 설명 | HTTP 상태 | 사용자 메시지 |
|------|------|-----------|---------------|
| CONTENT_EMPTY | 리뷰 내용이 비어있음 | 400 | 리뷰 내용을 입력해주세요. |
| CONTENT_TOO_LONG | 리뷰 내용이 500자 초과 | 400 | 리뷰 내용은 최대 500자까지 입력 가능합니다. |
| VALIDATION_ERROR | 일반 검증 오류 | 400 | 입력 데이터가 올바르지 않습니다. |

---

## 추가 개선사항 (Future Enhancements)

### Phase 2
1. **Grapheme Cluster 기반 글자 수 계산**
   - 이모지를 정확히 1자로 계산
   - `Intl.Segmenter` API 활용

2. **자동 저장 (Draft)**
   - 입력 중인 리뷰를 로컬 스토리지에 자동 저장
   - 페이지 새로고침 시 복원

3. **글자 수 경고 개선**
   - 450자 도달 시 부드러운 알림 (스낵바)
   - "곧 제한에 도달합니다" 안내

### Phase 3
1. **다국어 지원**
   - 한글, 영문, 일문 등 언어별 최적 글자 수 제한 조정
   - 한글: 500자, 영문: 1000자 등

2. **리치 텍스트 에디터**
   - 마크다운 지원
   - 볼드, 이탤릭 등 간단한 포맷팅
   - HTML 태그는 글자 수에 포함하지 않음

---

## 관련 문서 (Related Documents)

- [PRD: Product Requirements Document](/docs/prd.md)
- [유저플로우 문서 - 14. 리뷰 내용 글자 수 제한](/docs/userflow.md#14-리뷰-내용-글자-수-제한)
- [데이터베이스 스키마 - reviews 테이블](/docs/database.md)
- [UseCase 6: 리뷰 작성 페이지 진입](/docs/usecases/6-review-write-entry/spec.md)
- [UseCase 7: 리뷰 작성 및 제출](/docs/usecases/7-review-submit/spec.md)

---

## 변경 이력 (Change Log)

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2025-10-22 | Senior Developer (via Claude Code) | 초안 작성 |

---

## 승인 (Approval)

- [ ] Product Owner
- [ ] Engineering Lead
- [ ] UX Designer
- [ ] QA Lead
