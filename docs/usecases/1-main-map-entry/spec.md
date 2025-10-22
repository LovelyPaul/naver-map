# Use Case: 메인 지도 화면 진입

## 개요

### Use Case ID
UC-001

### Use Case 명
메인 지도 화면 진입

### 설명
사용자가 ConnectMap 애플리케이션에 처음 접속할 때 네이버 지도 기반의 메인 화면을 표시하고, 사용자의 현재 위치를 중심으로 지도를 초기화하는 기능입니다.

### 액터
- **Primary Actor**: 일반 사용자 (맛집 탐색자, 리뷰 작성자, 지역 주민)
- **Secondary Actor**: 네이버 맵스 API, 브라우저 GPS API

### 선행 조건 (Preconditions)
- 사용자가 인터넷에 연결되어 있음
- 브라우저가 지원되는 환경 (Chrome, Safari, Firefox, Edge 최신 2개 버전)
- 네이버 맵스 API 키가 유효함

### 후행 조건 (Postconditions)
- 메인 지도 화면이 성공적으로 렌더링됨
- 지도 중심이 사용자 위치 또는 기본 위치로 설정됨
- 검색 UI가 표시되어 다음 액션 준비 완료

---

## 메인 플로우 (Main Flow)

### Step 1: 애플리케이션 접속
**Actor**: 사용자
**Action**: 사용자가 ConnectMap 웹 애플리케이션 URL에 접속
**System**: Next.js 애플리케이션 초기화 및 메인 페이지 컴포넌트 렌더링 시작

### Step 2: 페이지 초기화
**System**:
1. 메인 페이지 컴포넌트 마운트
2. 서비스 로고/타이틀 렌더링
3. 검색 UI 컴포넌트 준비 (비활성 상태)

### Step 3: 네이버 지도 SDK 로드
**System**:
1. 네이버 맵스 JavaScript SDK 스크립트 로드 (CDN)
2. SDK 초기화 완료 대기
3. 지도 컨테이너 DOM 요소 준비

**Output**:
- 네이버 지도 SDK 로드 완료 이벤트 발생

### Step 4: 위치 권한 요청
**System**: 브라우저 Geolocation API를 통해 사용자 위치 권한 요청
**Browser**: 위치 권한 요청 팝업 표시

**Popup Message**:
```
"ConnectMap"이(가) 사용자의 위치에 액세스하려고 합니다.
[거부] [허용]
```

**Actor**: 사용자
**Action**: 위치 권한 허용 또는 거부 선택

### Step 5A: 위치 권한 허용 시
**Actor**: 사용자가 "허용" 선택
**System**:
1. GPS API를 통해 현재 위치 좌표 획득 (위도, 경도)
2. 획득한 좌표를 지도 중심점으로 설정
3. 줌 레벨 설정 (기본값: 15)

**Data**:
```typescript
{
  latitude: number,  // 예: 37.5665
  longitude: number, // 예: 126.9780
  accuracy: number   // 정확도 (미터)
}
```

**Proceed to**: Step 6

### Step 5B: 위치 권한 거부 시
**Actor**: 사용자가 "거부" 선택 또는 권한 요청 무시
**System**:
1. 기본 중심 좌표 사용 (서울시청 좌표)
2. 기본 좌표로 지도 중심 설정
3. 줌 레벨 설정 (기본값: 12)

**Default Coordinates**:
```typescript
{
  latitude: 37.5665,   // 서울시청
  longitude: 126.9780,
  zoom: 12
}
```

**Proceed to**: Step 6

### Step 6: 지도 인스턴스 생성
**System**:
1. 네이버 지도 API를 사용하여 지도 객체 생성
2. 중심 좌표 및 줌 레벨 설정
3. 지도 컨트롤 추가 (줌 컨트롤, 지도 유형 컨트롤 등)
4. 현재 위치 버튼 렌더링 (지도 우측 하단)

**Code Example**:
```typescript
const map = new naver.maps.Map('map-container', {
  center: new naver.maps.LatLng(latitude, longitude),
  zoom: zoomLevel,
  zoomControl: true,
  mapTypeControl: true,
});
```

### Step 7: UI 컴포넌트 활성화
**System**:
1. 검색창 활성화 (입력 가능 상태로 변경)
2. 검색창에 플레이스홀더 텍스트 표시: "장소나 맛집을 검색하세요"
3. 현재 위치 버튼 활성화

### Step 8: 초기 로딩 완료
**System**:
1. 로딩 인디케이터 제거 (있는 경우)
2. 지도 인터랙션 활성화 (드래그, 줌, 클릭 이벤트)
3. 사용자 입력 대기 상태

**Output**:
- 완전히 상호작용 가능한 메인 지도 화면
- 사용자의 다음 액션 준비 완료

---

## 대체 플로우 (Alternative Flows)

### Alt 1: 네이버 지도 SDK 로드 실패
**Trigger**: Step 3에서 SDK 스크립트 로드 실패 (네트워크 오류, 잘못된 API 키 등)

**Flow**:
1. **System**: SDK 로드 타임아웃 감지 (10초)
2. **System**: 에러 메시지 표시
   ```
   지도를 불러올 수 없습니다.
   네트워크 연결을 확인하고 다시 시도해주세요.
   [새로고침]
   ```
3. **Actor**: 사용자가 "새로고침" 버튼 클릭
4. **System**: 페이지 전체 새로고침 (`location.reload()`)
5. **Resume**: Step 1로 복귀

**Alternative**:
- 3회 연속 실패 시: 관리자 문의 안내 메시지 표시

### Alt 2: GPS 정보 획득 타임아웃
**Trigger**: Step 5A에서 GPS 좌표 획득 시간 초과 (15초)

**Flow**:
1. **System**: Geolocation API 타임아웃 감지
2. **System**: 콘솔 경고 로그 출력: "GPS timeout, using default location"
3. **System**: Step 5B로 폴백 (기본 좌표 사용)
4. **System**: 사용자에게 알림 토스트 표시 (3초간)
   ```
   현재 위치를 찾을 수 없어 기본 위치로 표시합니다.
   ```
5. **Resume**: Step 6로 진행

### Alt 3: 사용자가 위치 권한을 이전에 거부한 경우
**Trigger**: Step 4에서 브라우저가 이전 거부 기록을 확인

**Flow**:
1. **System**: 브라우저 권한 상태 확인 (`navigator.permissions.query`)
2. **System**: 권한이 "denied" 상태임을 감지
3. **System**: 권한 요청 팝업 없이 즉시 Step 5B로 이동
4. **System**: 안내 토스트 표시
   ```
   위치 권한이 차단되어 있습니다.
   브라우저 설정에서 위치 권한을 허용해주세요.
   ```
5. **Resume**: Step 6로 진행

### Alt 4: 네트워크 연결 없음
**Trigger**: Step 1 애플리케이션 접속 시 네트워크 오프라인 상태

**Flow**:
1. **System**: 네트워크 연결 실패 감지
2. **System**: 오프라인 안내 화면 표시
   ```
   인터넷 연결을 확인해주세요.
   ConnectMap을 사용하려면 인터넷 연결이 필요합니다.
   [다시 시도]
   ```
3. **Actor**: 네트워크 연결 복구
4. **Actor**: "다시 시도" 버튼 클릭
5. **System**: 온라인 상태 확인 후 애플리케이션 재시작
6. **Resume**: Step 1로 복귀

### Alt 5: 지도 컨테이너 DOM 요소 미존재
**Trigger**: Step 6에서 지도를 렌더링할 DOM 요소를 찾을 수 없음

**Flow**:
1. **System**: DOM 요소 탐색 실패 감지
2. **System**: 콘솔 에러 로그: "Map container not found"
3. **System**: 100ms 후 재시도 (최대 5회)
4. **Success Case**: DOM 준비 완료 시 Step 6 계속 진행
5. **Failure Case**: 5회 재시도 실패 시
   - 에러 메시지 표시: "지도를 표시할 수 없습니다. 페이지를 새로고침해주세요."
   - [새로고침] 버튼 제공

---

## 예외 플로우 (Exception Flows)

### Exc 1: 네이버 맵스 API 키 유효하지 않음
**Trigger**: Step 3에서 API 키 인증 실패

**Flow**:
1. **System**: 네이버 API 서버로부터 401/403 응답 수신
2. **System**: 개발자용 에러 로그 출력
3. **System**: 사용자용 일반 에러 메시지 표시
   ```
   일시적인 오류가 발생했습니다.
   잠시 후 다시 시도해주세요.
   ```
4. **System**: 에러 리포팅 서비스에 에러 전송 (Sentry 등)
5. **End**: 사용자는 페이지 새로고침 필요

### Exc 2: 브라우저가 Geolocation API를 지원하지 않음
**Trigger**: Step 4에서 `navigator.geolocation`이 undefined

**Flow**:
1. **System**: Geolocation API 지원 여부 확인
2. **System**: 지원하지 않음 감지
3. **System**: 콘솔 경고: "Geolocation not supported"
4. **System**: Step 5B로 즉시 이동 (기본 좌표 사용)
5. **Resume**: Step 6로 진행

### Exc 3: 사용자 GPS 정확도가 매우 낮음 (> 5km)
**Trigger**: Step 5A에서 획득한 GPS 정확도가 5000m 초과

**Flow**:
1. **System**: GPS accuracy 값 확인
2. **System**: 정확도가 낮다고 판단 (accuracy > 5000)
3. **System**: 획득한 좌표 사용하되 경고 토스트 표시
   ```
   현재 위치 정확도가 낮습니다.
   대략적인 위치로 표시됩니다.
   ```
4. **System**: 줌 레벨을 더 낮게 설정 (zoom: 10)
5. **Resume**: Step 6로 진행

---

## 비기능 요구사항 (Non-Functional Requirements)

### 성능 (Performance)
- **P-1**: 메인 페이지 초기 렌더링 완료 시간 ≤ 2초
- **P-2**: 네이버 지도 SDK 로드 완료 시간 ≤ 3초
- **P-3**: GPS 좌표 획득 시간 ≤ 5초 (타임아웃: 15초)
- **P-4**: 전체 초기화 완료 (Step 8) 시간 ≤ 5초

### 사용성 (Usability)
- **U-1**: 위치 권한 요청 시 명확한 안내 메시지 제공
- **U-2**: 로딩 중 스피너 또는 스켈레톤 UI 표시
- **U-3**: 에러 발생 시 사용자 친화적인 메시지 표시
- **U-4**: 모든 인터랙션에 시각적 피드백 제공

### 접근성 (Accessibility)
- **A-1**: 검색창에 적절한 `aria-label` 속성 추가
- **A-2**: 현재 위치 버튼에 키보드 네비게이션 지원
- **A-3**: 에러 메시지에 `role="alert"` 속성 추가
- **A-4**: 지도 컨테이너에 대체 텍스트 제공

### 보안 (Security)
- **S-1**: 네이버 맵스 API 키는 환경 변수로 관리
- **S-2**: HTTPS 연결 필수 (GPS API 사용 조건)
- **S-3**: API 키는 클라이언트 측에서 노출 가능하므로 도메인 제한 설정

### 호환성 (Compatibility)
- **C-1**: Chrome, Safari, Firefox, Edge 최신 2개 버전 지원
- **C-2**: 데스크톱, 태블릿, 모바일 반응형 지원
- **C-3**: iOS Safari에서 위치 권한 요청 정상 작동
- **C-4**: Android Chrome에서 위치 권한 요청 정상 작동

---

## 데이터 요구사항 (Data Requirements)

### 입력 데이터
1. **사용자 GPS 좌표** (선택적)
   - 위도 (latitude): number, -90 ~ 90
   - 경도 (longitude): number, -180 ~ 180
   - 정확도 (accuracy): number, 미터 단위

2. **네이버 맵스 API 키**
   - 타입: string
   - 소스: 환경 변수 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`

### 출력 데이터
1. **지도 상태**
   ```typescript
   {
     center: {
       lat: number,
       lng: number
     },
     zoom: number,
     loaded: boolean
   }
   ```

2. **UI 상태**
   ```typescript
   {
     isLoading: boolean,
     error: string | null,
     locationPermission: 'granted' | 'denied' | 'prompt'
   }
   ```

### 저장 데이터
- **로컬 스토리지**: 사용자가 마지막으로 본 지도 중심 및 줌 레벨 (선택적, 향후 기능)
  ```typescript
  {
    lastCenter: { lat: number, lng: number },
    lastZoom: number,
    timestamp: number
  }
  ```

---

## UI/UX 명세 (UI/UX Specifications)

### 레이아웃
```
┌──────────────────────────────────────┐
│  [로고] ConnectMap                    │ <- Header
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ 🔍 장소나 맛집을 검색하세요    │  │ <- Search Bar (Overlay)
│  └────────────────────────────────┘  │
│                                      │
│                                      │
│         [네이버 지도 영역]            │ <- Map Container
│                                      │
│                                      │
│                                 📍   │ <- Current Location Button
└──────────────────────────────────────┘
```

### 컴포넌트 상세

#### 1. Header
- **높이**: 60px
- **배경색**: #FFFFFF
- **테두리**: 하단 1px solid #DDDDDD
- **로고**: 좌측 16px 여백, 크기 120x40px
- **z-index**: 1000

#### 2. Search Bar (Overlay)
- **위치**: 지도 상단 중앙, 헤더 아래 16px
- **크기**: 너비 90% (최대 600px), 높이 48px
- **배경색**: #FFFFFF
- **테두리**: 1px solid #DDDDDD, border-radius: 24px
- **그림자**: 0 2px 8px rgba(0,0,0,0.1)
- **z-index**: 100
- **아이콘**: 좌측 검색 아이콘 (Lucide Search)
- **플레이스홀더**: "장소나 맛집을 검색하세요" (회색, #999999)

#### 3. Map Container
- **크기**: 전체 화면 (헤더 제외)
- **배경색**: #F5F5F5 (지도 로딩 전)

#### 4. Current Location Button
- **위치**: 지도 우측 하단 16px
- **크기**: 48x48px (모바일: 40x40px)
- **배경색**: #FFFFFF
- **아이콘**: 📍 또는 Lucide MapPin
- **테두리**: 1px solid #DDDDDD, border-radius: 50%
- **그림자**: 0 2px 4px rgba(0,0,0,0.15)
- **hover**: 배경색 #F5F5F5
- **active**: 배경색 #E0E0E0

### 로딩 상태 UI

#### 초기 로딩 (Step 1-3)
```
┌──────────────────────────────────────┐
│  [로고] ConnectMap                    │
├──────────────────────────────────────┤
│                                      │
│                                      │
│              [스피너]                 │
│          지도를 불러오는 중...        │
│                                      │
│                                      │
└──────────────────────────────────────┘
```

#### GPS 로딩 (Step 4-5)
- 지도는 표시되지만 약간 흐릿하게 (opacity: 0.6)
- 중앙에 작은 로딩 스피너: "현재 위치를 찾는 중..."

### 에러 상태 UI

#### 네트워크 오류
```
┌──────────────────────────────────────┐
│  [로고] ConnectMap                    │
├──────────────────────────────────────┤
│                                      │
│          ⚠️                          │
│   인터넷 연결을 확인해주세요.         │
│  ConnectMap을 사용하려면              │
│  인터넷 연결이 필요합니다.            │
│                                      │
│       [다시 시도]                    │
│                                      │
└──────────────────────────────────────┘
```

### 토스트 알림
- **위치**: 화면 상단 중앙, 헤더 아래 80px
- **크기**: 자동 (내용에 맞춤, 최대 400px)
- **배경색**: #333333 (80% opacity)
- **텍스트 색상**: #FFFFFF
- **표시 시간**: 3초
- **애니메이션**: Fade in/out (0.3초)

---

## 테스트 시나리오 (Test Scenarios)

### TS-1: 정상 플로우 (위치 권한 허용)
**Given**: 사용자가 위치 권한을 허용할 준비가 됨
**When**:
1. 애플리케이션 URL에 접속
2. 위치 권한 팝업에서 "허용" 선택

**Then**:
- 지도가 사용자 현재 위치 중심으로 표시됨
- 검색창이 활성화됨
- 현재 위치 버튼이 표시됨
- 전체 로딩 시간 ≤ 5초

### TS-2: 정상 플로우 (위치 권한 거부)
**Given**: 사용자가 위치 권한을 거부할 예정
**When**:
1. 애플리케이션 URL에 접속
2. 위치 권한 팝업에서 "거부" 선택

**Then**:
- 지도가 서울시청 중심으로 표시됨
- 검색창이 활성화됨
- 현재 위치 버튼이 표시됨
- 토스트 알림 없음 (정상 동작)

### TS-3: GPS 타임아웃
**Given**: GPS 신호가 약한 환경 (예: 실내)
**When**:
1. 애플리케이션 URL에 접속
2. 위치 권한 허용
3. GPS 좌표 획득 15초 초과

**Then**:
- 타임아웃 후 기본 위치로 폴백
- 토스트 알림 표시: "현재 위치를 찾을 수 없어 기본 위치로 표시합니다."
- 검색 기능은 정상 작동

### TS-4: 네이버 지도 SDK 로드 실패
**Given**: 네트워크 불안정 또는 API 키 오류
**When**:
1. 애플리케이션 URL에 접속
2. 네이버 SDK 로드 실패

**Then**:
- 에러 메시지 표시
- "새로고침" 버튼 제공
- 버튼 클릭 시 페이지 재로드

### TS-5: 모바일 환경 테스트
**Given**: iOS Safari 브라우저 사용
**When**:
1. 모바일에서 애플리케이션 접속
2. 위치 권한 허용

**Then**:
- 반응형 레이아웃 정상 표시
- 검색창 크기 조정됨 (화면 너비의 90%)
- 현재 위치 버튼 크기 40x40px
- 터치 인터랙션 정상 작동

### TS-6: 이전 권한 거부 상태
**Given**: 사용자가 이전에 위치 권한을 거부함
**When**:
1. 애플리케이션에 재접속

**Then**:
- 권한 팝업 없이 즉시 기본 위치로 지도 표시
- 안내 토스트: "위치 권한이 차단되어 있습니다..."
- 3초 후 토스트 자동 사라짐

---

## 기술 구현 가이드 (Technical Implementation Guide)

### 기술 스택
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **State Management**: Zustand (전역 상태)
- **Styling**: TailwindCSS + shadcn-ui
- **Map SDK**: 네이버 지도 JavaScript API v3
- **Geolocation**: Browser Geolocation API

### 주요 컴포넌트 구조

```
src/app/
  page.tsx                    # 메인 페이지 (Client Component)

src/features/map/
  components/
    MapContainer.tsx          # 네이버 지도 래퍼 컴포넌트
    SearchBar.tsx             # 검색창 컴포넌트
    CurrentLocationButton.tsx # 현재 위치 버튼
  hooks/
    useNaverMap.ts            # 네이버 지도 초기화 훅
    useGeolocation.ts         # GPS 위치 획득 훅
  lib/
    naverMapLoader.ts         # 네이버 SDK 로드 유틸
  constants/
    mapConfig.ts              # 지도 기본 설정 상수
```

### 환경 변수
```env
# .env.local
NEXT_PUBLIC_NAVER_MAP_CLIENT_ID=your_naver_map_client_id
```

### 핵심 로직 예시

#### 1. useNaverMap 훅
```typescript
// src/features/map/hooks/useNaverMap.ts
import { useEffect, useState, useRef } from 'react';

interface NaverMapState {
  map: naver.maps.Map | null;
  isLoaded: boolean;
  error: string | null;
}

export const useNaverMap = (containerId: string, center: { lat: number; lng: number }, zoom: number) => {
  const [state, setState] = useState<NaverMapState>({
    map: null,
    isLoaded: false,
    error: null,
  });

  useEffect(() => {
    const initMap = async () => {
      try {
        if (!window.naver || !window.naver.maps) {
          throw new Error('네이버 지도 SDK를 불러올 수 없습니다.');
        }

        const mapElement = document.getElementById(containerId);
        if (!mapElement) {
          throw new Error('지도 컨테이너를 찾을 수 없습니다.');
        }

        const map = new naver.maps.Map(containerId, {
          center: new naver.maps.LatLng(center.lat, center.lng),
          zoom,
          zoomControl: true,
          mapTypeControl: true,
        });

        setState({ map, isLoaded: true, error: null });
      } catch (error) {
        setState({ map: null, isLoaded: false, error: error.message });
      }
    };

    initMap();
  }, [containerId, center, zoom]);

  return state;
};
```

#### 2. useGeolocation 훅
```typescript
// src/features/map/hooks/useGeolocation.ts
import { useEffect, useState } from 'react';

interface GeolocationState {
  coords: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
}

const DEFAULT_COORDS = { lat: 37.5665, lng: 126.9780 }; // 서울시청
const TIMEOUT = 15000; // 15초

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({ coords: DEFAULT_COORDS, loading: false, error: 'Geolocation not supported' });
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;

      if (accuracy > 5000) {
        console.warn(`Low GPS accuracy: ${accuracy}m`);
      }

      setState({
        coords: { lat: latitude, lng: longitude },
        loading: false,
        error: null,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      console.error('GPS error:', error);
      setState({
        coords: DEFAULT_COORDS,
        loading: false,
        error: error.message,
      });
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: TIMEOUT,
      maximumAge: 0,
    });
  }, []);

  return state;
};
```

#### 3. 메인 페이지 컴포넌트
```typescript
// src/app/page.tsx
'use client';

import { MapContainer } from '@/features/map/components/MapContainer';
import { SearchBar } from '@/features/map/components/SearchBar';
import { useGeolocation } from '@/features/map/hooks/useGeolocation';

export default function HomePage() {
  const { coords, loading, error } = useGeolocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="spinner" />
          <p className="mt-4 text-gray-600">지도를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen">
      <header className="h-[60px] border-b bg-white px-4 flex items-center">
        <h1 className="text-xl font-bold">ConnectMap</h1>
      </header>

      <SearchBar />

      <MapContainer
        center={coords || { lat: 37.5665, lng: 126.9780 }}
        zoom={coords ? 15 : 12}
      />

      {error && (
        <div className="toast">
          현재 위치를 찾을 수 없어 기본 위치로 표시합니다.
        </div>
      )}
    </div>
  );
}
```

---

## 참고 자료 (References)

### API 문서
- [네이버 맵스 API 공식 문서](https://navermaps.github.io/maps.js.ncp/)
- [MDN Geolocation API](https://developer.mozilla.org/ko/docs/Web/API/Geolocation_API)

### 관련 Use Case
- UC-002: 장소/맛집 검색
- UC-003: 검색 결과에서 장소 선택

### 디자인 참고
- 카카오맵 초기 화면
- 네이버 지도 웹 버전
- Google Maps

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
