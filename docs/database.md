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

---

## 데이터베이스 설계 개선 권고사항

### 1. 성능 최적화

#### 1.1 복합 인덱스 추가
리뷰 조회 시 장소별 최신순 정렬이 빈번하므로 복합 인덱스 추가:
```sql
CREATE INDEX idx_reviews_place_created ON reviews(place_id, created_at DESC);
```

#### 1.2 통계 정보 캐싱 (선택적)
리뷰 집계 쿼리 성능 개선을 위해 places 테이블에 캐시 컬럼 추가:
```sql
ALTER TABLE places
ADD COLUMN review_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN avg_rating DECIMAL(3,2) DEFAULT 0 NOT NULL;

-- 트리거를 통한 자동 업데이트
CREATE OR REPLACE FUNCTION update_place_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE places
  SET
    review_count = (SELECT COUNT(*) FROM reviews WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)),
    avg_rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE place_id = COALESCE(NEW.place_id, OLD.place_id)), 0)
  WHERE id = COALESCE(NEW.place_id, OLD.place_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_place_stats_insert
AFTER INSERT ON reviews
FOR EACH ROW EXECUTE FUNCTION update_place_stats();

CREATE TRIGGER trg_update_place_stats_update
AFTER UPDATE OF rating ON reviews
FOR EACH ROW EXECUTE FUNCTION update_place_stats();

CREATE TRIGGER trg_update_place_stats_delete
AFTER DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_place_stats();
```

#### 1.3 PostGIS 공간 인덱스 (선택적)
반경 검색 성능 향상을 위해 PostGIS 활용:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE places ADD COLUMN location GEOGRAPHY(Point, 4326);

UPDATE places SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);

CREATE INDEX idx_places_location_gist ON places USING GIST(location);
```

반경 검색 쿼리 예시:
```sql
SELECT * FROM places
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint($longitude, $latitude), 4326),
  $radius_in_meters
);
```

#### 1.4 페이지네이션 최적화
대용량 데이터 조회 시 커서 기반 페이지네이션 활용:
```sql
-- 첫 페이지
SELECT * FROM reviews
WHERE place_id = $1
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- 다음 페이지 (마지막 레코드의 created_at, id 사용)
SELECT * FROM reviews
WHERE place_id = $1
  AND (created_at, id) < ($last_created_at, $last_id)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

### 2. 보안 강화

#### 2.1 이메일 형식 검증
```sql
ALTER TABLE reviews
ADD CONSTRAINT chk_email_format
CHECK (author_email IS NULL OR author_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

#### 2.2 비밀번호 해싱 강화
bcrypt 비용 factor 12 이상 사용 권장:
```sql
-- 애플리케이션 레벨에서 처리:
-- const hashedPassword = await bcrypt.hash(password, 12);
```

#### 2.3 Rate Limiting 테이블 (선택적)
리뷰 도배 방지:
```sql
CREATE TABLE IF NOT EXISTS review_rate_limit (
  ip_address VARCHAR(45) NOT NULL,
  place_id UUID NOT NULL,
  last_review_at TIMESTAMP NOT NULL DEFAULT NOW(),
  review_count_today INTEGER DEFAULT 1,
  PRIMARY KEY (ip_address, place_id)
);

CREATE INDEX idx_rate_limit_check ON review_rate_limit(ip_address, last_review_at);
```

#### 2.4 SQL Injection 방지
- ✅ **항상 준비된 문장(Prepared Statements) 사용**
- ✅ **ORM/쿼리 빌더 사용 시에도 원시 쿼리 검증**
- ❌ **문자열 연결로 쿼리 생성 금지**

### 3. 데이터 무결성 강화

#### 3.1 Soft Delete 지원
삭제된 리뷰 복구 및 감사 추적:
```sql
ALTER TABLE reviews
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by VARCHAR(100) NULL;

-- 삭제는 플래그만 설정
UPDATE reviews
SET deleted_at = NOW(), deleted_by = $author_identifier
WHERE id = $1 AND password_hash = crypt($2, password_hash);

-- 조회 시 삭제된 리뷰 제외
SELECT * FROM reviews
WHERE place_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;
```

#### 3.2 Updated At 자동 업데이트 트리거
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_places_updated_at
BEFORE UPDATE ON places
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_reviews_updated_at
BEFORE UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3.3 추가 제약조건
```sql
-- 작성자 이름 최소 길이
ALTER TABLE reviews
ADD CONSTRAINT chk_author_name_length
CHECK (LENGTH(TRIM(author_name)) >= 2);

-- 위도/경도 범위 검증
ALTER TABLE places
ADD CONSTRAINT chk_latitude_range
CHECK (latitude >= -90 AND latitude <= 90);

ALTER TABLE places
ADD CONSTRAINT chk_longitude_range
CHECK (longitude >= -180 AND longitude <= 180);

-- 카테고리 길이 제한
ALTER TABLE places
ADD CONSTRAINT chk_category_length
CHECK (LENGTH(TRIM(category_main)) >= 2);
```

#### 3.4 중복 리뷰 방지 (선택적)
동일 작성자의 중복 리뷰 제한:
```sql
-- 이메일이 있는 경우 같은 장소에 중복 리뷰 방지
CREATE UNIQUE INDEX idx_unique_review_per_email
ON reviews(place_id, author_email)
WHERE author_email IS NOT NULL AND deleted_at IS NULL;
```

### 4. 확장성 고려사항

#### 4.1 테이블 파티셔닝 (대용량 환경)
리뷰가 수백만 건 이상 예상될 경우:
```sql
-- 월별 파티셔닝 예시
CREATE TABLE reviews_partitioned (
  LIKE reviews INCLUDING ALL
) PARTITION BY RANGE (created_at);

CREATE TABLE reviews_2024_01 PARTITION OF reviews_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE reviews_2024_02 PARTITION OF reviews_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

#### 4.2 읽기 복제본 활용 가이드
- 장소 목록 조회, 리뷰 조회: 읽기 복제본
- 리뷰 작성, 수정, 삭제: 마스터 DB
- Supabase에서는 `supabase.from('reviews').select()` 시 자동 로드밸런싱

#### 4.3 캐싱 전략
- **애플리케이션 레벨**: Redis를 통한 인기 장소 캐싱 (TTL 5분)
- **DB 레벨**: Materialized View 활용
```sql
CREATE MATERIALIZED VIEW mv_popular_places AS
SELECT
  p.*,
  COUNT(r.id) as review_count,
  AVG(r.rating) as avg_rating
FROM places p
INNER JOIN reviews r ON p.id = r.place_id
WHERE r.deleted_at IS NULL
GROUP BY p.id
HAVING COUNT(r.id) >= 5
ORDER BY review_count DESC, avg_rating DESC
LIMIT 100;

CREATE UNIQUE INDEX ON mv_popular_places(id);

-- 주기적 갱신 (예: 매 시간)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_places;
```

### 5. 모니터링 및 유지보수

#### 5.1 쿼리 성능 분석
```sql
-- 느린 쿼리 확인
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### 5.2 인덱스 사용률 확인
```sql
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan ASC;
```

#### 5.3 테이블 크기 모니터링
```sql
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 6. 백업 및 복구 전략

#### 6.1 정기 백업
- Supabase 자동 백업 활용 (일일 백업, 7일 보관)
- 중요 시점 수동 백업 생성
```bash
pg_dump -h [host] -U [user] -d [database] -F c -f backup_$(date +%Y%m%d).dump
```

#### 6.2 포인트 인 타임 복구 (PITR)
- Supabase Pro 이상에서 지원
- 최대 7일 이내 특정 시점으로 복구 가능

### 7. 보안 체크리스트

- [ ] RLS (Row Level Security) 비활성화 확인 완료
- [ ] pgcrypto extension 활성화
- [ ] 모든 비밀번호는 bcrypt로 해싱 (cost factor ≥ 12)
- [ ] SQL Injection 방지: 준비된 문장만 사용
- [ ] 이메일 형식 검증 적용
- [ ] Rate limiting 고려 (애플리케이션 레벨 또는 DB 레벨)
- [ ] HTTPS 통신 강제
- [ ] 민감한 정보 로깅 금지
- [ ] 정기적인 보안 패치 적용

### 8. 권장 구현 우선순위

#### Phase 1 (필수)
1. ✅ Updated at 트리거 구현
2. ✅ 복합 인덱스 추가 (`idx_reviews_place_created`)
3. ✅ 이메일 형식 검증 제약조건
4. ✅ 추가 CHECK 제약조건 (이름 길이, 위도/경도 범위)

#### Phase 2 (권장)
5. ⚠️ Soft Delete 구현
6. ⚠️ 통계 정보 캐싱 (review_count, avg_rating)
7. ⚠️ Rate limiting 테이블 구현

#### Phase 3 (확장성 대비)
8. 🔵 PostGIS 공간 인덱스 (반경 검색 필요 시)
9. 🔵 Materialized View (인기 장소 캐싱)
10. 🔵 테이블 파티셔닝 (대용량 예상 시)

---

## 주의사항

### 마이그레이션 적용 시
- 프로덕션 환경에 적용 전 반드시 스테이징 환경에서 테스트
- 인덱스 생성은 `CONCURRENTLY` 옵션 사용하여 락 최소화
```sql
CREATE INDEX CONCURRENTLY idx_reviews_place_created ON reviews(place_id, created_at DESC);
```
- 대용량 테이블 ALTER 시 다운타임 고려

### 성능 테스트
- 최소 10만 건 이상의 리뷰 데이터로 부하 테스트 수행
- EXPLAIN ANALYZE로 쿼리 플랜 검증
- 실제 사용 패턴 시뮬레이션

### 롤백 계획
- 모든 마이그레이션에 대해 롤백 스크립트 준비
- 예:
```sql
-- up.sql
ALTER TABLE reviews ADD COLUMN deleted_at TIMESTAMP NULL;

-- down.sql
ALTER TABLE reviews DROP COLUMN deleted_at;
```
