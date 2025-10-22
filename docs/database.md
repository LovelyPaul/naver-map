# 데이터베이스 스키마 설계

## 개요
위치기반 맛집 리뷰 플랫폼의 최소 스펙 데이터베이스 스키마입니다.
로그인 없이 사용 가능하며, 네이버 지도 기반 장소 검색 및 리뷰 작성/조회 기능을 지원합니다.

## 데이터 플로우

```
1. 장소 검색 (네이버 API)
   └─> 검색 결과를 places 테이블에 저장 (중복 시 업데이트)

2. 리뷰 작성
   └─> reviews 테이블에 저장 (place_id 참조)

3. 지도 표시
   └─> places 테이블에서 위치 정보 조회
   └─> reviews 테이블의 집계 정보로 마커 타입 결정

4. 리뷰 조회
   └─> 특정 place_id의 모든 reviews 조회
```

## 엔티티 관계도 (ERD)

```
┌──────────────────┐       ┌──────────────────┐
│     places       │       │     reviews      │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │◄──────│ place_id (FK)    │
│ naver_place_id   │   1:N │ id (PK)          │
│ name             │       │ author_name      │
│ address          │       │ author_email     │
│ category_main    │       │ rating           │
│ category_sub     │       │ content          │
│ latitude         │       │ password_hash    │
│ longitude        │       │ created_at       │
│ created_at       │       │ updated_at       │
│ updated_at       │       └──────────────────┘
└──────────────────┘
```

## 테이블 정의

### 1. places (장소)
맛집/장소의 기본 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 내부 고유 ID |
| naver_place_id | VARCHAR(100) | UNIQUE, NOT NULL | 네이버 장소 고유 ID |
| name | VARCHAR(200) | NOT NULL | 장소명 (식당명) |
| address | VARCHAR(500) | NOT NULL | 주소 |
| category_main | VARCHAR(50) | NOT NULL | 대분류 카테고리 (예: 한식) |
| category_sub | VARCHAR(50) | NULL | 소분류 카테고리 (예: 소고기 구이) |
| latitude | DECIMAL(10, 8) | NOT NULL | 위도 |
| longitude | DECIMAL(11, 8) | NOT NULL | 경도 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 생성일시 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 수정일시 |

**인덱스:**
- `idx_places_naver_place_id` ON (naver_place_id)
- `idx_places_location` ON (latitude, longitude) - 지도 검색 최적화

### 2. reviews (리뷰)
사용자가 작성한 리뷰 정보를 저장합니다.

| 컬럼명 | 타입 | 제약조건 | 설명 |
|--------|------|----------|------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 리뷰 고유 ID |
| place_id | UUID | FOREIGN KEY REFERENCES places(id) ON DELETE CASCADE, NOT NULL | 장소 참조 |
| author_name | VARCHAR(100) | NOT NULL | 작성자 닉네임 |
| author_email | VARCHAR(200) | NULL | 작성자 이메일 (선택) |
| rating | SMALLINT | NOT NULL, CHECK (rating >= 1 AND rating <= 5) | 평점 (1-5) |
| content | TEXT | NOT NULL, CHECK (LENGTH(content) <= 500) | 리뷰 내용 (최대 500자) |
| password_hash | VARCHAR(255) | NOT NULL | 수정/삭제용 비밀번호 해시 (bcrypt) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 작성일시 |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | 수정일시 |

**인덱스:**
- `idx_reviews_place_id` ON (place_id) - 장소별 리뷰 조회 최적화
- `idx_reviews_created_at` ON (created_at DESC) - 최신순 정렬 최적화

## 주요 쿼리 패턴

### 1. 장소 검색 후 저장/업데이트
```sql
INSERT INTO places (naver_place_id, name, address, category_main, category_sub, latitude, longitude)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (naver_place_id)
DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  category_main = EXCLUDED.category_main,
  category_sub = EXCLUDED.category_sub,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  updated_at = NOW()
RETURNING id;
```

### 2. 리뷰 작성
```sql
INSERT INTO reviews (place_id, author_name, author_email, rating, content, password_hash)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, created_at;
```

### 3. 리뷰가 있는 장소 조회 (지도 마커용)
```sql
SELECT
  p.id,
  p.naver_place_id,
  p.name,
  p.address,
  p.category_main,
  p.category_sub,
  p.latitude,
  p.longitude,
  COUNT(r.id) as review_count,
  AVG(r.rating) as avg_rating
FROM places p
INNER JOIN reviews r ON p.id = r.place_id
GROUP BY p.id
HAVING COUNT(r.id) > 0;
```

### 4. 특정 장소의 리뷰 목록 조회
```sql
SELECT
  id,
  author_name,
  author_email,
  rating,
  content,
  created_at
FROM reviews
WHERE place_id = $1
ORDER BY created_at DESC;
```

### 5. 리뷰 수정 (비밀번호 검증 후)
```sql
UPDATE reviews
SET
  rating = $1,
  content = $2,
  updated_at = NOW()
WHERE id = $3 AND password_hash = crypt($4, password_hash)
RETURNING id;
```

### 6. 리뷰 삭제 (비밀번호 검증 후)
```sql
DELETE FROM reviews
WHERE id = $1 AND password_hash = crypt($2, password_hash)
RETURNING id;
```

## 확장 고려사항 (현재 스펙 외)

추후 필요 시 고려할 수 있는 확장 사항:

1. **사진 첨부**: `review_images` 테이블 추가
2. **좋아요/북마크**: `review_likes`, `place_bookmarks` 테이블 추가
3. **신고 기능**: `reviews.report_count` 컬럼 또는 `review_reports` 테이블 추가
4. **사용자 계정**: `users` 테이블 추가 및 reviews.user_id FK 연결
5. **영업시간/메뉴**: places에 JSON 필드 추가

## 기술 스택
- **데이터베이스**: PostgreSQL (Supabase)
- **비밀번호 해싱**: bcrypt (pgcrypto extension)
- **UUID 생성**: gen_random_uuid() (기본 제공)

## 마이그레이션 순서
1. pgcrypto extension 활성화
2. places 테이블 생성
3. reviews 테이블 생성
4. 인덱스 생성
5. updated_at 자동 업데이트 트리거 생성
