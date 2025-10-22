# UseCase 7: 리뷰 작성 및 제출

## 문서 정보
- **기능명**: 리뷰 작성 및 제출 (Review Creation and Submission)
- **우선순위**: P0 (필수 기능)
- **관련 페이지**: `/review/new?placeId={placeId}`
- **작성일**: 2025-10-22
- **버전**: 1.0

---

## 개요 (Overview)

사용자가 방문한 맛집에 대한 리뷰를 작성하고 제출하는 기능입니다. 로그인 없이 닉네임과 비밀번호만으로 리뷰를 등록할 수 있으며, 별점(1-5점)과 텍스트 리뷰(최대 500자)를 입력할 수 있습니다.

---

## 사용자 목표 (User Goals)

### Primary Goals
1. 방문한 맛집에 대한 경험을 다른 사용자와 공유
2. 별점과 상세한 리뷰를 통해 맛집 정보 제공
3. 간편하게 리뷰를 작성하고 즉시 확인

### Secondary Goals
1. 나중에 리뷰 수정/삭제를 위한 비밀번호 설정
2. 자신의 리뷰가 지도에 반영되는 것 확인

---

## 액터 (Actors)

### Primary Actor
- **리뷰 작성자 (Contributor)**: 맛집을 방문하고 리뷰를 남기고자 하는 일반 사용자

### Secondary Actors
- **시스템 (System)**: 리뷰 데이터 검증 및 저장을 담당하는 백엔드 시스템
- **데이터베이스 (Database)**: Supabase PostgreSQL

---

## 사전 조건 (Preconditions)

1. 사용자가 리뷰를 작성할 장소를 선택한 상태
2. 선택한 장소의 `placeId`가 URL 쿼리 파라미터로 전달됨
3. 해당 장소 정보가 `places` 테이블에 존재함
4. 사용자가 웹 브라우저로 애플리케이션에 접속 가능한 상태
5. 네트워크 연결이 정상 작동하는 상태

---

## 사후 조건 (Postconditions)

### 성공 시 (Success)
1. 새로운 리뷰가 `reviews` 테이블에 저장됨
2. 사용자가 장소 상세 페이지(`/place/{placeId}`)로 리다이렉트됨
3. 작성한 리뷰가 리뷰 목록 최상단에 표시됨
4. 지도의 해당 장소 마커가 리뷰 존재 마커로 업데이트됨
5. 해당 장소의 평균 평점 및 리뷰 개수가 업데이트됨

### 실패 시 (Failure)
1. 사용자에게 에러 메시지가 표시됨
2. 작성 중인 리뷰 데이터는 유지되어 재시도 가능
3. 데이터베이스에 리뷰가 저장되지 않음

---

## 기본 플로우 (Main Flow)

### 1. 리뷰 작성 페이지 진입
**액터**: 리뷰 작성자
**트리거**: 검색 결과 또는 장소 상세 페이지에서 "리뷰 작성" 버튼 클릭

#### 입력 (Input)
- URL 쿼리 파라미터: `placeId={uuid}`

#### 처리 (Process)
1. 시스템이 URL에서 `placeId` 파라미터 추출
2. `placeId`가 유효한 UUID 형식인지 검증
3. 데이터베이스에서 해당 `placeId`의 장소 정보 조회
   ```sql
   SELECT id, name, address, category_main, category_sub
   FROM places
   WHERE id = $placeId;
   ```
4. 장소 정보를 기반으로 리뷰 작성 페이지 렌더링
5. 폼 필드 초기화:
   - 작성자 이름: 빈 문자열
   - 별점: 미선택 (0점)
   - 리뷰 내용: 빈 문자열
   - 비밀번호: 빈 문자열

#### 출력 (Output)
- 리뷰 작성 페이지 UI 표시:
  - **헤더**: 뒤로가기 버튼, 페이지 제목 ("리뷰 작성하기")
  - **장소 정보 섹션** (읽기 전용):
    - 식당명
    - 주소
    - 카테고리 (대분류 > 소분류)
  - **리뷰 작성 폼**:
    - 작성자 이름 입력 필드 (placeholder: "닉네임 또는 이메일")
    - 별점 선택 UI (별 5개, 클릭 가능)
    - 리뷰 내용 입력 필드 (textarea, placeholder: "맛집에 대한 경험을 공유해주세요 (최대 500자)")
    - 글자 수 카운터 (예: "0 / 500")
    - 비밀번호 입력 필드 (type: password, placeholder: "수정/삭제 시 사용할 비밀번호 (4자 이상)")
  - **제출 버튼**: "리뷰 작성하기" (초기 상태: 비활성화 또는 활성화)

---

### 2. 리뷰 정보 입력

#### 2.1 작성자 이름 입력
**액터**: 리뷰 작성자

##### 입력
- 사용자가 작성자 이름 입력 필드에 텍스트 입력
- 닉네임 또는 이메일 주소

##### 처리
1. 입력값을 실시간으로 폼 상태에 저장
2. 클라이언트 측 유효성 검증:
   - 최소 길이: 2자 이상
   - 최대 길이: 100자 이하
   - 공백 제거 후 검증 (`trim()` 적용)
3. 이메일 형식인 경우 이메일 유효성 검증 (선택적)

##### 출력
- 유효성 검증 실패 시 입력 필드 하단에 에러 메시지 표시:
  - "작성자 이름은 2자 이상 입력해주세요."
  - "작성자 이름은 100자를 초과할 수 없습니다."
  - "올바른 이메일 형식이 아닙니다." (이메일 형식으로 입력한 경우)

---

#### 2.2 별점 선택
**액터**: 리뷰 작성자

##### 입력
- 사용자가 별(★) 아이콘 클릭 (1-5개 중 선택)

##### 처리
1. 클릭된 별의 인덱스 확인 (1-5)
2. 해당 인덱스까지의 모든 별을 선택 상태로 변경
3. 선택된 별 개수를 `rating` 값으로 저장
4. 폼 상태에 `rating` 업데이트

##### 출력
- 선택된 별들은 노란색(#FFD700) 채워진 아이콘으로 표시
- 선택되지 않은 별들은 회색(#DDDDDD) 빈 아이콘으로 표시
- 별 아이콘 위에 마우스 오버 시 미리보기 효과 (hover 상태)

##### 인터랙션 세부사항
```
별점 1: ★☆☆☆☆
별점 2: ★★☆☆☆
별점 3: ★★★☆☆
별점 4: ★★★★☆
별점 5: ★★★★★
```

---

#### 2.3 리뷰 내용 입력
**액터**: 리뷰 작성자

##### 입력
- 사용자가 리뷰 내용 textarea에 텍스트 입력

##### 처리
1. 입력 이벤트마다 현재 글자 수 계산
   - 줄바꿈 문자(\n) 포함
   - 유니코드 문자 정확히 계산 (이모지 등)
2. 글자 수 카운터 업데이트 (예: "123 / 500")
3. 500자 초과 여부 확인
4. 500자 초과 시:
   - 추가 입력 차단 (`maxLength` 속성 또는 이벤트 핸들러)
   - 또는 경고 메시지 표시

##### 출력
- 입력 필드 하단에 실시간 글자 수 표시:
  - 정상: "123 / 500" (기본 색상)
  - 경고: "500 / 500" (빨간색 또는 주황색)
- 500자 초과 시 에러 메시지:
  - "리뷰 내용은 최대 500자까지 입력 가능합니다."

---

#### 2.4 비밀번호 입력
**액터**: 리뷰 작성자

##### 입력
- 사용자가 비밀번호 입력 필드에 텍스트 입력

##### 처리
1. 입력값을 마스킹 처리 (type="password")
2. 클라이언트 측 유효성 검증:
   - 최소 길이: 4자 이상
   - 최대 길이: 50자 이하 (권장)

##### 출력
- 유효성 검증 실패 시 에러 메시지:
  - "비밀번호는 4자 이상 입력해주세요."
- 비밀번호 입력 필드 옆에 안내 문구 표시:
  - "추후 리뷰 수정/삭제 시 필요합니다."

---

### 3. 폼 제출 (리뷰 작성하기 버튼 클릭)

**액터**: 리뷰 작성자
**트리거**: "리뷰 작성하기" 버튼 클릭

#### 입력
- 폼 데이터:
  ```typescript
  {
    placeId: string;        // UUID
    authorName: string;     // 2-100자
    rating: number;         // 1-5
    content: string;        // 1-500자
    password: string;       // 4자 이상
  }
  ```

#### 처리

##### 3.1 클라이언트 측 검증
1. 모든 필수 필드 입력 여부 확인:
   - 작성자 이름: 비어있지 않음, 2자 이상
   - 별점: 1-5 범위
   - 리뷰 내용: 비어있지 않음, 1-500자
   - 비밀번호: 4자 이상
2. 검증 실패 시 해당 필드에 에러 메시지 표시하고 제출 중단
3. 검증 통과 시 제출 버튼 비활성화 (중복 제출 방지)
4. 로딩 인디케이터 표시

##### 3.2 API 요청
- **Endpoint**: `POST /api/reviews`
- **Request Headers**:
  ```
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "placeId": "550e8400-e29b-41d4-a716-446655440000",
    "authorName": "파스타러버",
    "rating": 5,
    "content": "크림 파스타가 정말 맛있었어요. 면도 쫄깃하고 소스도 진해서 좋았습니다...",
    "password": "1234"
  }
  ```

##### 3.3 서버 측 처리
1. 요청 데이터 수신 및 파싱
2. Zod 스키마 검증:
   ```typescript
   const reviewSchema = z.object({
     placeId: z.string().uuid(),
     authorName: z.string().trim().min(2).max(100),
     rating: z.number().int().min(1).max(5),
     content: z.string().trim().min(1).max(500),
     password: z.string().min(4).max(50)
   });
   ```
3. `placeId`가 `places` 테이블에 존재하는지 확인:
   ```sql
   SELECT id FROM places WHERE id = $placeId;
   ```
4. 존재하지 않으면 404 에러 반환
5. 비밀번호 해싱 (bcrypt, cost factor 12):
   ```typescript
   const passwordHash = await bcrypt.hash(password, 12);
   ```
6. 데이터베이스에 리뷰 저장:
   ```sql
   INSERT INTO reviews (place_id, author_name, rating, content, password_hash)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING id, created_at;
   ```
7. 리뷰 통계 업데이트 (트리거 자동 실행 또는 수동):
   - `places.review_count` 증가
   - `places.avg_rating` 재계산

##### 3.4 응답 반환
- **Success Response (201 Created)**:
  ```json
  {
    "success": true,
    "data": {
      "reviewId": "660f9511-f3ac-52e5-b827-557766551111",
      "placeId": "550e8400-e29b-41d4-a716-446655440000",
      "authorName": "파스타러버",
      "rating": 5,
      "content": "크림 파스타가 정말 맛있었어요...",
      "createdAt": "2025-10-22T14:30:00.000Z"
    }
  }
  ```

- **Error Response (400 Bad Request)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "입력 데이터가 올바르지 않습니다.",
      "details": [
        {
          "field": "rating",
          "message": "별점은 1-5 사이의 값이어야 합니다."
        }
      ]
    }
  }
  ```

- **Error Response (404 Not Found)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "PLACE_NOT_FOUND",
      "message": "존재하지 않는 장소입니다."
    }
  }
  ```

- **Error Response (500 Internal Server Error)**:
  ```json
  {
    "success": false,
    "error": {
      "code": "SERVER_ERROR",
      "message": "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    }
  }
  ```

#### 출력

##### 성공 시
1. 성공 토스트 메시지 표시:
   - "리뷰가 성공적으로 작성되었습니다!"
2. 장소 상세 페이지로 리다이렉트:
   - URL: `/place/{placeId}`
3. 장소 상세 페이지에서:
   - 작성한 리뷰가 리뷰 목록 최상단에 표시됨
   - 평균 별점 및 총 리뷰 수 업데이트됨
4. 메인 지도 페이지로 돌아갈 경우:
   - 해당 장소 마커가 리뷰 존재 마커로 변경됨 (빨간색 마커 등)

##### 실패 시
1. 에러 토스트 메시지 또는 인라인 에러 메시지 표시
2. 제출 버튼 재활성화
3. 로딩 인디케이터 숨김
4. 작성 중인 리뷰 데이터 유지 (사용자가 수정 후 재시도 가능)

---

## 대체 플로우 (Alternative Flows)

### A1: 장소 정보 조회 실패
**조건**: `placeId`가 데이터베이스에 존재하지 않음

#### 처리
1. 에러 페이지 또는 모달 표시
2. 에러 메시지: "장소 정보를 찾을 수 없습니다."
3. 이전 페이지로 돌아가기 버튼 제공

#### 출력
- 에러 메시지 표시
- 이전 페이지로 복귀 옵션 제공

---

### A2: 필수 필드 누락
**조건**: 사용자가 필수 필드를 입력하지 않고 제출 시도

#### 처리
1. 제출 중단
2. 누락된 필드에 에러 메시지 표시:
   - 작성자 이름: "작성자 이름을 입력해주세요."
   - 별점: "별점을 선택해주세요."
   - 리뷰 내용: "리뷰 내용을 입력해주세요."
   - 비밀번호: "비밀번호를 입력해주세요."
3. 첫 번째 에러 필드로 자동 포커스

#### 출력
- 필드별 에러 메시지 표시
- 제출 버튼 활성화 상태 유지

---

### A3: 글자 수 초과
**조건**: 리뷰 내용이 500자를 초과함

#### 처리
1. 클라이언트 측에서 입력 차단 (`maxLength` 속성)
2. 또는 제출 시 에러 메시지 표시
3. 글자 수 카운터를 빨간색으로 강조

#### 출력
- 에러 메시지: "리뷰 내용은 최대 500자까지 입력 가능합니다."
- 초과된 글자 수 표시 (예: "523 / 500")

---

### A4: 네트워크 에러
**조건**: API 요청 중 네트워크 연결 끊김

#### 처리
1. 요청 실패 감지
2. 작성 중인 리뷰 데이터를 로컬 스토리지에 임시 저장:
   ```typescript
   localStorage.setItem('draft_review', JSON.stringify(formData));
   ```
3. 에러 메시지 및 재시도 옵션 제공

#### 출력
- 에러 토스트 메시지:
  - "네트워크 오류가 발생했습니다. 작성 중인 내용은 임시 저장되었습니다."
- 재시도 버튼 표시
- 페이지 새로고침 시 로컬 스토리지에서 데이터 복구

---

### A5: 중복 제출 시도
**조건**: 사용자가 제출 버튼을 빠르게 여러 번 클릭

#### 처리
1. 첫 번째 클릭 후 제출 버튼 즉시 비활성화
2. 로딩 인디케이터 표시
3. 추가 클릭 이벤트 무시

#### 출력
- 제출 버튼 비활성화 상태
- 로딩 스피너 또는 인디케이터 표시

---

### A6: 서버 내부 오류
**조건**: 서버에서 500 에러 반환

#### 처리
1. 에러 응답 수신
2. 사용자에게 일반적인 에러 메시지 표시
3. 작성 중인 데이터 유지
4. 에러 로그를 서버에 전송 (옵션)

#### 출력
- 에러 토스트 메시지:
  - "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
- 재시도 버튼 제공

---

### A7: 뒤로가기 시 작성 중인 데이터 존재
**조건**: 사용자가 리뷰 작성 중 뒤로가기 버튼 클릭

#### 처리
1. 폼 데이터 변경 여부 확인
2. 데이터가 입력된 경우 확인 다이얼로그 표시:
   ```
   작성 중인 내용이 있습니다.
   페이지를 나가시겠습니까?
   [취소] [나가기]
   ```
3. 사용자 선택에 따라:
   - 취소: 현재 페이지 유지
   - 나가기: 이전 페이지로 이동 (작성 내용 폐기)

#### 출력
- 확인 다이얼로그 표시
- 사용자 선택에 따라 페이지 유지 또는 이동

---

## 예외 플로우 (Exception Flows)

### E1: placeId 파라미터 누락
**조건**: URL에 `placeId` 쿼리 파라미터가 없음

#### 처리
1. 에러 감지
2. 에러 페이지 표시 또는 메인 페이지로 리다이렉트

#### 출력
- 에러 메시지: "잘못된 접근입니다. 장소를 선택한 후 리뷰를 작성해주세요."
- 메인 페이지로 돌아가기 버튼

---

### E2: placeId 형식 오류
**조건**: `placeId`가 유효한 UUID 형식이 아님

#### 처리
1. UUID 형식 검증 실패
2. 에러 페이지 표시

#### 출력
- 에러 메시지: "잘못된 장소 정보입니다."
- 이전 페이지로 돌아가기 버튼

---

### E3: 비밀번호 해싱 실패
**조건**: 서버에서 bcrypt 해싱 중 오류 발생

#### 처리
1. 서버 측 에러 로깅
2. 500 에러 응답 반환
3. 클라이언트에서 일반 에러 메시지 표시

#### 출력
- 에러 메시지: "리뷰 작성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."

---

### E4: 데이터베이스 연결 실패
**조건**: Supabase 데이터베이스에 연결할 수 없음

#### 처리
1. 연결 타임아웃 감지
2. 서버 측 에러 로깅 및 알림
3. 503 Service Unavailable 응답 반환

#### 출력
- 에러 메시지: "일시적인 서버 오류입니다. 잠시 후 다시 시도해주세요."

---

## UI/UX 상세 (UI/UX Details)

### 레이아웃
- **헤더**:
  - 좌측: 뒤로가기 버튼 (< 아이콘)
  - 중앙: 페이지 제목 "리뷰 작성하기"
  - 우측: 빈 공간 또는 닫기 버튼 (모달인 경우)

- **장소 정보 섹션**:
  - 배경: 라이트 그레이 (#F5F5F5)
  - 패딩: 16px
  - 식당명: 18px, Bold, 다크 그레이 (#333333)
  - 주소: 14px, Regular, 미디엄 그레이 (#666666)
  - 카테고리: 12px, Regular, 그레이 (#999999), 태그 형태

- **리뷰 작성 폼**:
  - 배경: 화이트 (#FFFFFF)
  - 패딩: 16px
  - 필드 간 여백: 24px

- **제출 버튼**:
  - 하단 고정 또는 폼 하단 배치
  - 너비: 100% (패딩 제외)
  - 높이: 48px
  - 배경: Primary 색상 (#03C75A)
  - 텍스트: 화이트, 16px, Bold
  - 비활성화 시: 그레이 (#CCCCCC)

### 인터랙션
- **별점 선택**:
  - 마우스 오버 시: 해당 별까지 미리보기 효과
  - 클릭 시: 즉시 선택 상태 반영
  - 애니메이션: 부드러운 색상 전환 (transition: 0.2s)

- **리뷰 내용 입력**:
  - 자동 높이 조절 (autoGrow) 또는 고정 높이 (최소 120px)
  - 글자 수 실시간 업데이트
  - 500자 도달 시 입력 차단 또는 경고

- **제출 버튼**:
  - 클릭 시 로딩 스피너 표시
  - 비활성화 상태에서는 클릭 불가

### 반응형 디자인
- **모바일 (< 768px)**:
  - 전체 화면 사용
  - 패딩: 12px
  - 글자 크기 유지

- **태블릿/데스크톱 (≥ 768px)**:
  - 중앙 정렬, 최대 너비 600px
  - 카드 형태 레이아웃 (그림자 효과)

---

## 기술 구현 (Technical Implementation)

### Frontend

#### 컴포넌트 구조
```
/src/features/review/components/
  ├── ReviewWritePage.tsx          # 리뷰 작성 페이지 컴포넌트
  ├── PlaceInfoSection.tsx         # 장소 정보 표시 섹션
  ├── ReviewForm.tsx               # 리뷰 작성 폼
  ├── RatingSelector.tsx           # 별점 선택 UI
  └── CharacterCounter.tsx         # 글자 수 카운터
```

#### 상태 관리
```typescript
// Zustand 또는 React Hook Form
interface ReviewFormState {
  placeId: string;
  authorName: string;
  rating: number;
  content: string;
  password: string;
  errors: {
    authorName?: string;
    rating?: string;
    content?: string;
    password?: string;
  };
  isSubmitting: boolean;
}
```

#### API 클라이언트
```typescript
// /src/features/review/hooks/useCreateReview.ts
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export const useCreateReview = () => {
  return useMutation({
    mutationFn: async (data: ReviewCreateRequest) => {
      const response = await apiClient.post('/api/reviews', data);
      return response.data;
    },
    onSuccess: (data) => {
      // 성공 처리: 리다이렉트, 토스트 메시지 등
    },
    onError: (error) => {
      // 에러 처리
    }
  });
};
```

### Backend

#### 라우터 정의
```typescript
// /src/features/review/backend/route.ts
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { reviewCreateSchema } from './schema';
import { createReview } from './service';

export const reviewRoutes = new Hono()
  .post('/api/reviews', zValidator('json', reviewCreateSchema), async (c) => {
    const data = c.req.valid('json');
    const supabase = c.get('supabase');
    const logger = c.get('logger');

    try {
      const result = await createReview(supabase, data, logger);
      return c.json({ success: true, data: result }, 201);
    } catch (error) {
      logger.error('Failed to create review', error);
      return c.json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: '리뷰 작성 중 오류가 발생했습니다.'
        }
      }, 500);
    }
  });
```

#### 스키마 정의
```typescript
// /src/features/review/backend/schema.ts
import { z } from 'zod';

export const reviewCreateSchema = z.object({
  placeId: z.string().uuid({ message: '올바른 장소 ID가 아닙니다.' }),
  authorName: z.string()
    .trim()
    .min(2, { message: '작성자 이름은 2자 이상이어야 합니다.' })
    .max(100, { message: '작성자 이름은 100자를 초과할 수 없습니다.' }),
  rating: z.number()
    .int({ message: '별점은 정수여야 합니다.' })
    .min(1, { message: '별점은 최소 1점입니다.' })
    .max(5, { message: '별점은 최대 5점입니다.' }),
  content: z.string()
    .trim()
    .min(1, { message: '리뷰 내용을 입력해주세요.' })
    .max(500, { message: '리뷰 내용은 최대 500자까지 입력 가능합니다.' }),
  password: z.string()
    .min(4, { message: '비밀번호는 4자 이상이어야 합니다.' })
    .max(50, { message: '비밀번호는 50자를 초과할 수 없습니다.' })
});

export type ReviewCreateRequest = z.infer<typeof reviewCreateSchema>;
```

#### 서비스 로직
```typescript
// /src/features/review/backend/service.ts
import { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

export async function createReview(
  supabase: SupabaseClient,
  data: ReviewCreateRequest,
  logger: AppLogger
) {
  // 1. 장소 존재 여부 확인
  const { data: place, error: placeError } = await supabase
    .from('places')
    .select('id')
    .eq('id', data.placeId)
    .single();

  if (placeError || !place) {
    throw new Error('PLACE_NOT_FOUND');
  }

  // 2. 비밀번호 해싱
  const passwordHash = await bcrypt.hash(data.password, 12);

  // 3. 리뷰 저장
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .insert({
      place_id: data.placeId,
      author_name: data.authorName,
      rating: data.rating,
      content: data.content,
      password_hash: passwordHash
    })
    .select('id, created_at')
    .single();

  if (reviewError) {
    logger.error('Failed to insert review', reviewError);
    throw reviewError;
  }

  return {
    reviewId: review.id,
    placeId: data.placeId,
    authorName: data.authorName,
    rating: data.rating,
    content: data.content,
    createdAt: review.created_at
  };
}
```

---

## 데이터베이스 (Database)

### 관련 테이블
- `places`: 장소 정보
- `reviews`: 리뷰 정보

### 쿼리

#### 리뷰 생성
```sql
INSERT INTO reviews (place_id, author_name, rating, content, password_hash)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '파스타러버',
  5,
  '크림 파스타가 정말 맛있었어요...',
  '$2b$12$...'  -- bcrypt 해시
)
RETURNING id, created_at;
```

#### 장소 존재 확인
```sql
SELECT id FROM places WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

---

## 테스트 케이스 (Test Cases)

### 단위 테스트 (Unit Tests)

#### UT-01: 별점 선택 로직
- **입력**: 별 3번째 클릭
- **예상 출력**: `rating = 3`, 별 3개 선택 상태

#### UT-02: 글자 수 카운터
- **입력**: "테스트" (3자)
- **예상 출력**: "3 / 500"

#### UT-03: 비밀번호 해싱
- **입력**: "password123"
- **예상 출력**: bcrypt 해시 문자열 (60자)

### 통합 테스트 (Integration Tests)

#### IT-01: 리뷰 작성 성공
1. 유효한 폼 데이터 입력
2. 제출 버튼 클릭
3. API 응답 확인: 201 Created
4. 데이터베이스에 리뷰 저장 확인
5. 리다이렉트 확인: `/place/{placeId}`

#### IT-02: 필수 필드 누락
1. 작성자 이름 빈 값
2. 제출 버튼 클릭
3. 에러 메시지 표시 확인

#### IT-03: 네트워크 에러
1. 네트워크 차단
2. 제출 시도
3. 에러 메시지 표시 확인
4. 로컬 스토리지에 데이터 저장 확인

### 엔드투엔드 테스트 (E2E Tests)

#### E2E-01: 전체 리뷰 작성 플로우
1. 메인 페이지 접속
2. 장소 검색
3. 검색 결과에서 "리뷰 작성" 클릭
4. 리뷰 작성 페이지 진입 확인
5. 모든 필드 입력
6. 제출
7. 장소 상세 페이지로 리다이렉트 확인
8. 작성한 리뷰가 리스트에 표시되는지 확인

---

## 보안 고려사항 (Security Considerations)

### 1. XSS 방지
- 사용자 입력(작성자 이름, 리뷰 내용)을 HTML 렌더링 시 sanitize
- React의 기본 이스케이핑 활용
- Dangerously set innerHTML 사용 금지

### 2. SQL Injection 방지
- Prepared Statements 사용 (Supabase 클라이언트 자동 처리)
- 원시 쿼리 사용 시 파라미터 바인딩 필수

### 3. 비밀번호 보안
- bcrypt 사용 (cost factor 12 이상)
- 평문 비밀번호는 절대 로그에 기록하지 않음
- HTTPS 통신 강제

### 4. Rate Limiting
- IP 기반 리뷰 작성 제한 (예: 1시간에 5개)
- 서버 측 미들웨어 또는 데이터베이스 체크

### 5. CSRF 방지
- Hono의 CSRF 미들웨어 활용 (필요 시)
- SameSite 쿠키 설정

---

## 성능 고려사항 (Performance Considerations)

### 1. 클라이언트 측
- 폼 유효성 검증은 실시간 수행하되 debounce 적용 (300ms)
- 글자 수 카운터는 실시간 업데이트하되 성능 영향 최소화
- 이미지 미리보기 없음 (MVP에서는 텍스트만)

### 2. 서버 측
- 비밀번호 해싱은 비동기 처리 (bcrypt.hash)
- 데이터베이스 쿼리 최적화 (인덱스 활용)
- 응답 시간 목표: 1초 이내

### 3. 데이터베이스
- `reviews` 테이블에 `place_id` 인덱스 적용
- 통계 업데이트는 트리거 또는 비동기 처리

---

## 접근성 (Accessibility)

### 1. 키보드 네비게이션
- Tab 키로 모든 폼 필드 순차 이동 가능
- Enter 키로 폼 제출 가능
- Esc 키로 모달 닫기 (모달 형태인 경우)

### 2. 스크린 리더
- 모든 입력 필드에 적절한 `label` 또는 `aria-label` 제공
- 별점 선택 UI에 `role="radiogroup"` 및 `aria-label` 적용
- 에러 메시지는 `aria-live="polite"` 영역에 표시

### 3. 색상 대비
- 텍스트와 배경 대비 비율 4.5:1 이상 (WCAG AA)
- 별점 아이콘 색상: 노란색(#FFD700) vs 화이트 배경

### 4. 포커스 표시
- 모든 인터랙티브 요소에 포커스 링 표시
- 커스텀 포커스 스타일 적용 (Primary 색상)

---

## 에러 코드 (Error Codes)

| 코드 | 설명 | HTTP 상태 | 사용자 메시지 |
|------|------|-----------|---------------|
| VALIDATION_ERROR | 입력 데이터 검증 실패 | 400 | 입력 데이터가 올바르지 않습니다. |
| PLACE_NOT_FOUND | 존재하지 않는 장소 ID | 404 | 존재하지 않는 장소입니다. |
| SERVER_ERROR | 서버 내부 오류 | 500 | 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요. |
| NETWORK_ERROR | 네트워크 연결 오류 | - | 네트워크 오류가 발생했습니다. 작성 중인 내용은 임시 저장되었습니다. |
| RATE_LIMIT_EXCEEDED | 요청 제한 초과 | 429 | 리뷰 작성 횟수를 초과했습니다. 잠시 후 다시 시도해주세요. |

---

## 추가 개선사항 (Future Enhancements)

### Phase 2 기능
1. **사진 첨부**: 리뷰 작성 시 이미지 업로드 (최대 3장)
2. **리뷰 수정/삭제**: 비밀번호 인증 후 수정/삭제 기능
3. **리뷰 미리보기**: 제출 전 작성한 리뷰 미리보기

### Phase 3 기능
1. **태그 추가**: 맛집 특징 태그 (예: #데이트하기좋은, #가성비좋은)
2. **메뉴 추천**: 추천 메뉴 입력 필드 추가
3. **자동 저장**: 작성 중인 리뷰 자동 저장 (로컬 스토리지)

---

## 관련 문서 (Related Documents)

- [PRD: Product Requirements Document](/docs/prd.md)
- [유저플로우 문서](/docs/userflow.md)
- [데이터베이스 스키마](/docs/database.md)
- [API 명세서](/docs/api-spec.md) (작성 예정)
- [디자인 시스템](/docs/design-system.md) (작성 예정)

---

## 변경 이력 (Change Log)

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2025-10-22 | Senior Developer | 초안 작성 |

---

## 승인 (Approval)

- [ ] Product Owner
- [ ] Engineering Lead
- [ ] UX Designer
- [ ] QA Lead
