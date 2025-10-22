# Use Case 3: 검색 결과에서 장소 선택

## 개요 (Overview)

사용자가 검색 결과 리스트나 지도 마커에서 특정 장소를 선택하여 해당 장소를 강조하고 상세 정보를 확인할 수 있는 기능입니다.

---

## 기본 정보 (Basic Information)

- **Use Case ID**: UC-003
- **Use Case Name**: 검색 결과에서 장소 선택
- **Actor**: 일반 사용자 (맛집 탐색자, 리뷰 작성자, 지역 주민)
- **Precondition**:
  - 사용자가 장소 검색을 완료하고 검색 결과가 표시된 상태
  - 검색 결과 리스트와 지도 마커가 모두 렌더링된 상태
- **Postcondition**:
  - 선택된 장소가 시각적으로 강조됨
  - 지도 화면이 선택된 장소 중심으로 이동
  - 장소 상세 정보 조회를 위한 준비 완료
- **Priority**: High (P0)
- **Frequency**: 매우 높음 (검색 후 필수 액션)

---

## 주요 시나리오 (Main Success Scenario)

### 시나리오 A: 검색 결과 리스트에서 장소 선택

1. **사용자 액션**: 사용자가 검색 결과 리스트의 특정 항목을 클릭
2. **시스템 처리**:
   - 선택된 장소의 고유 식별자 (placeId) 확인
   - 리스트에서 해당 항목에 하이라이트 스타일 적용
     - 배경색 변경 (예: 연한 파란색)
     - 테두리 강조 (예: 2px solid primary color)
   - 지도에서 해당 장소의 마커 찾기
   - 마커에 강조 효과 적용
     - 마커 크기 확대 (1.2배)
     - 마커 색상 변경 또는 펄스 애니메이션 효과
   - 지도 뷰포트를 선택된 장소 중심으로 부드럽게 이동 (smooth pan)
   - 적절한 줌 레벨로 조정 (예: zoom level 16-18)
   - 다른 마커들에 비활성화 스타일 적용 (투명도 50%)
3. **시스템 출력**:
   - 선택된 리스트 항목이 시각적으로 강조됨
   - 지도 중심이 선택된 장소로 이동
   - 해당 장소 마커가 다른 마커들과 명확히 구분됨
   - 사용자가 장소 상세 정보로 진입할 수 있는 상태

### 시나리오 B: 지도 마커에서 장소 선택

1. **사용자 액션**: 사용자가 지도의 특정 마커를 클릭
2. **시스템 처리**:
   - 클릭된 마커의 장소 고유 식별자 (placeId) 확인
   - 마커에 강조 효과 적용
     - 마커 크기 확대 (1.2배)
     - 마커 색상 변경 또는 펄스 애니메이션 효과
   - 검색 결과 리스트 스크롤을 해당 항목 위치로 이동
   - 리스트에서 해당 항목에 하이라이트 스타일 적용
     - 배경색 변경 (예: 연한 파란색)
     - 테두리 강조
   - 다른 마커들에 비활성화 스타일 적용 (투명도 50%)
   - 다른 리스트 항목들은 일반 스타일 유지
3. **시스템 출력**:
   - 선택된 마커가 시각적으로 강조됨
   - 검색 결과 리스트가 해당 항목으로 스크롤되고 강조됨
   - 사용자가 장소 상세 정보로 진입할 수 있는 상태

---

## 대체 시나리오 (Alternative Scenarios)

### Alt-1: 이미 선택된 장소 재선택

**조건**: 사용자가 현재 선택된 장소를 다시 클릭

**처리**:
1. 시스템이 동일 장소 선택을 감지
2. 다음 중 하나의 동작 수행 (정책에 따라):
   - **옵션 A (토글)**: 선택 해제 처리
     - 하이라이트 효과 제거
     - 지도를 초기 뷰포트로 복귀
     - 모든 마커를 동일한 스타일로 표시
   - **옵션 B (상세 보기)**: 장소 상세 정보 페이지/모달로 자동 이동
     - 리뷰 조회 화면으로 직접 전환

**결과**:
- 옵션 A: 선택 상태가 해제되고 초기 검색 결과 화면으로 복귀
- 옵션 B: 장소 상세 정보 화면으로 이동

### Alt-2: 여러 장소 빠르게 연속 선택

**조건**: 사용자가 짧은 시간 내에 여러 장소를 연속으로 클릭

**처리**:
1. 각 클릭마다 이전 선택 해제
2. 가장 최근 클릭만 유효하게 처리
3. 애니메이션 큐 관리
   - 이전 애니메이션이 완료되지 않은 경우 중단
   - 새 선택에 대한 애니메이션 즉시 시작
4. 지도 이동 애니메이션 최적화
   - 너무 빠른 연속 이동은 마지막 위치로만 이동

**결과**:
- 가장 최근 선택된 장소만 강조됨
- 부드러운 UX 유지 (애니메이션 충돌 방지)

---

## 예외 시나리오 (Exception Scenarios)

### Exc-1: 장소 식별자 확인 실패

**조건**: 선택된 항목에서 유효한 placeId를 추출할 수 없음

**처리**:
1. 에러 로깅 (클라이언트 측)
2. 사용자에게 에러 토스트 메시지 표시
   - 메시지: "장소 정보를 불러올 수 없습니다. 다시 시도해주세요."
3. 선택 액션 중단
4. 이전 상태 유지

**결과**:
- 사용자는 다른 장소를 선택하거나 검색을 다시 수행

### Exc-2: 지도 API 오류로 마커 이동 실패

**조건**: 네이버 지도 API 오류로 지도 이동이 실패

**처리**:
1. 에러 catch 및 로깅
2. 리스트 하이라이트는 정상 적용
3. 마커 하이라이트 시도 (가능한 범위 내)
4. 사용자에게 경고 메시지 표시
   - 메시지: "지도 이동 중 오류가 발생했습니다. 페이지를 새로고침해주세요."

**결과**:
- 부분적 기능 제공 (리스트 선택은 작동)
- 사용자는 페이지 새로고침 또는 검색 재시도

### Exc-3: 리스트 스크롤 실패

**조건**: 마커 클릭 시 검색 결과 리스트 스크롤 오류

**처리**:
1. 에러 로깅
2. 마커 하이라이트는 정상 적용
3. 리스트 하이라이트 시도 (스크롤 없이)
4. 사용자는 수동으로 리스트 스크롤 가능

**결과**:
- 마커 선택은 정상 작동
- 리스트는 수동 확인 필요

---

## UI/UX 요구사항 (UI/UX Requirements)

### 시각적 피드백 (Visual Feedback)

**선택된 리스트 항목**:
- 배경색: `bg-blue-50` (TailwindCSS)
- 테두리: `border-2 border-primary`
- 그림자: `shadow-md`
- 트랜지션: `transition-all duration-300 ease-in-out`

**선택된 마커**:
- 크기: 기본 크기의 120%
- 색상: Primary color (#03C75A) 또는 Accent color
- 애니메이션: 펄스 효과 또는 바운스 효과
- z-index 상승 (다른 마커보다 위에 표시)

**비선택 마커**:
- 투명도: `opacity-50`
- 크기: 기본 크기 유지
- 색상: 기본 회색 또는 Secondary color

### 애니메이션 (Animations)

**지도 이동 애니메이션**:
- Duration: 500-800ms
- Easing: ease-in-out
- 부드러운 패닝 (smooth pan)

**마커 강조 애니메이션**:
- 펄스 효과: scale(1) → scale(1.2) → scale(1.1) (1초 duration)
- 또는 바운스 효과: translateY(0) → translateY(-10px) → translateY(0)

**리스트 스크롤 애니메이션**:
- Duration: 300ms
- Easing: ease-out
- Smooth scroll behavior

### 접근성 (Accessibility)

- **키보드 네비게이션**:
  - 리스트 항목은 Tab 키로 이동 가능
  - Enter 또는 Space 키로 선택 가능
- **스크린 리더**:
  - 선택된 항목에 `aria-selected="true"` 속성 추가
  - 선택 시 "선택됨: [장소명]" 음성 안내
- **포커스 표시**:
  - 키보드 포커스 시 아웃라인 명확히 표시
  - `focus:ring-2 focus:ring-primary`

---

## 기술적 요구사항 (Technical Requirements)

### Frontend

**상태 관리**:
- Zustand를 사용한 전역 상태 관리
  ```typescript
  interface MapState {
    selectedPlaceId: string | null;
    setSelectedPlace: (placeId: string | null) => void;
    searchResults: Place[];
  }
  ```

**컴포넌트 구조**:
```
SearchResultsContainer
├── SearchResultsList
│   └── PlaceCard (각 검색 결과)
│       - onClick 핸들러로 선택 처리
└── MapView
    └── Markers
        - onClick 핸들러로 선택 처리
```

**이벤트 핸들링**:
```typescript
const handlePlaceSelect = (placeId: string) => {
  // 1. 상태 업데이트
  setSelectedPlace(placeId);

  // 2. 지도 이동
  mapInstance.panTo(placeCoordinates, { duration: 500 });

  // 3. 줌 조정
  mapInstance.setZoom(17);

  // 4. 마커 스타일 업데이트
  updateMarkerStyles(placeId);

  // 5. 리스트 하이라이트
  highlightListItem(placeId);
};
```

### Map SDK 연동 (네이버 지도)

**지도 이동**:
```typescript
// 부드러운 패닝
map.panTo(
  new naver.maps.LatLng(latitude, longitude),
  { duration: 500, easing: 'easeOutCubic' }
);

// 줌 레벨 조정
map.setZoom(17, true); // true: 애니메이션 사용
```

**마커 스타일 변경**:
```typescript
// 선택된 마커
selectedMarker.setIcon({
  content: generateMarkerHTML({ selected: true }),
  size: new naver.maps.Size(40, 50), // 확대된 크기
  anchor: new naver.maps.Point(20, 50)
});

// 비선택 마커
otherMarkers.forEach(marker => {
  marker.setIcon({
    content: generateMarkerHTML({ selected: false, opacity: 0.5 }),
    size: new naver.maps.Size(32, 40)
  });
});
```

### 성능 최적화

**디바운싱 (Debouncing)**:
- 연속 클릭 시 불필요한 렌더링 방지
- 300ms 디바운스 적용

**메모이제이션 (Memoization)**:
- `React.memo`로 PlaceCard 컴포넌트 최적화
- `useMemo`로 마커 렌더링 최적화

**가상 스크롤링 (Virtual Scrolling)**:
- 검색 결과가 100개 이상일 경우 react-window 사용

---

## 데이터 모델 (Data Model)

### Place 인터페이스

```typescript
interface Place {
  id: string;              // 고유 식별자
  naverPlaceId: string;    // 네이버 장소 ID
  name: string;            // 장소명
  address: string;         // 주소
  categoryDepth1: string;  // 카테고리 대분류
  categoryDepth2?: string; // 카테고리 소분류
  latitude: number;        // 위도
  longitude: number;       // 경도
  photoUrl?: string;       // 대표 사진 URL
  hasReviews: boolean;     // 리뷰 존재 여부
  reviewCount?: number;    // 리뷰 개수
  averageRating?: number;  // 평균 평점
}
```

### 선택 상태 관리

```typescript
// Zustand Store
interface SearchState {
  selectedPlaceId: string | null;
  searchResults: Place[];
  setSelectedPlace: (placeId: string | null) => void;
  clearSelection: () => void;
}

const useSearchStore = create<SearchState>((set) => ({
  selectedPlaceId: null,
  searchResults: [],
  setSelectedPlace: (placeId) => set({ selectedPlaceId: placeId }),
  clearSelection: () => set({ selectedPlaceId: null }),
}));
```

---

## 테스트 시나리오 (Test Scenarios)

### 단위 테스트 (Unit Tests)

1. **장소 선택 상태 업데이트 테스트**
   - Given: 초기 상태 (selectedPlaceId = null)
   - When: setSelectedPlace('place-123') 호출
   - Then: selectedPlaceId가 'place-123'으로 업데이트됨

2. **동일 장소 재선택 테스트**
   - Given: selectedPlaceId = 'place-123'
   - When: setSelectedPlace('place-123') 재호출
   - Then: 토글 동작 또는 상세 페이지 이동 (정책에 따라)

3. **선택 해제 테스트**
   - Given: selectedPlaceId = 'place-123'
   - When: clearSelection() 호출
   - Then: selectedPlaceId가 null로 변경됨

### 통합 테스트 (Integration Tests)

1. **리스트 클릭 → 지도 이동 연동 테스트**
   - Given: 검색 결과 10개 표시
   - When: 3번째 리스트 항목 클릭
   - Then:
     - 3번째 항목 하이라이트됨
     - 지도가 해당 위치로 이동
     - 해당 마커가 강조됨

2. **마커 클릭 → 리스트 스크롤 연동 테스트**
   - Given: 검색 결과 50개 표시 (스크롤 필요)
   - When: 30번째 장소 마커 클릭
   - Then:
     - 리스트가 30번째 항목으로 스크롤됨
     - 30번째 항목 하이라이트됨
     - 마커가 강조됨

3. **연속 선택 테스트**
   - Given: 검색 결과 표시
   - When: 1번, 2번, 3번 항목을 빠르게 연속 클릭
   - Then:
     - 3번 항목만 최종 선택 상태
     - 1번, 2번 선택 해제됨
     - 애니메이션 충돌 없음

### End-to-End 테스트 (E2E Tests)

1. **전체 플로우 테스트**
   ```
   검색어 입력 → 검색 실행 → 결과 표시 → 장소 선택 → 상세 정보 진입
   ```

2. **모바일 환경 테스트**
   - 터치 이벤트 정상 작동 여부
   - 작은 화면에서 UI 정상 표시

---

## 엣지케이스 (Edge Cases)

### EC-1: 검색 결과가 1개인 경우

**처리**:
- 자동으로 해당 장소 선택 (옵션)
- 또는 사용자 명시적 선택 대기

### EC-2: 장소 좌표가 유효하지 않은 경우

**처리**:
- 지도 이동 스킵
- 리스트 하이라이트만 적용
- 에러 로그 기록

### EC-3: 리스트 항목과 마커 수가 불일치

**처리**:
- 데이터 동기화 검증
- 불일치 감지 시 에러 리포팅
- 사용자에게 검색 재시도 안내

### EC-4: 선택 중 검색 결과가 변경됨

**처리**:
- 새 검색 시작 시 이전 선택 자동 해제
- 선택 상태 초기화
- 새 검색 결과에서 재선택 필요

---

## 참고 자료 (References)

- [네이버 맵스 API - 마커 가이드](https://navermaps.github.io/maps.js.ncp/docs/tutorial-marker.html)
- [네이버 맵스 API - 지도 이동](https://navermaps.github.io/maps.js.ncp/docs/naver.maps.Map.html#panTo)
- [React 상태 관리 베스트 프랙티스](https://react.dev/learn/managing-state)
- [Zustand 공식 문서](https://docs.pmnd.rs/zustand/getting-started/introduction)

---

## 변경 이력 (Change Log)

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2025-10-22 | System | 초안 작성 |

---

## 승인 (Approval)

- Product Owner: [ ]
- Engineering Lead: [ ]
- UX Designer: [ ]
