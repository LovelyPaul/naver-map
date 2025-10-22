// Places Routes
// 장소 API 라우트

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabase, getLogger, getConfig } from '@/backend/hono/context';
import { success, failure, respond } from '@/backend/http/response';
import { SearchPlacesQuerySchema, PlaceIdParamSchema } from './schema';
import { searchPlaces, getPlaceDetail } from './service';
import { PlaceErrorCode } from './error';

const app = new Hono<AppEnv>();

/**
 * GET /api/places/search
 * 장소 검색
 */
app.get(
  '/api/places/search',
  zValidator('query', SearchPlacesQuerySchema),
  async (c) => {
    const query = c.req.valid('query');
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const config = getConfig(c);

    try {
      const result = await searchPlaces(
        query,
        config.naver.clientId,
        config.naver.clientSecret,
        supabase,
        logger
      );

      return respond(c, success(result));
    } catch (error) {
      logger.error('Search places error:', error);
      return respond(
        c,
        failure(500, PlaceErrorCode.NAVER_API_ERROR, '장소 검색 중 오류가 발생했습니다')
      );
    }
  }
);

/**
 * GET /api/places/:placeId
 * 장소 상세 조회
 */
app.get(
  '/api/places/:placeId',
  zValidator('param', PlaceIdParamSchema),
  async (c) => {
    const { placeId } = c.req.valid('param');
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const place = await getPlaceDetail(placeId, supabase, logger);

      if (!place) {
        return respond(
          c,
          failure(404, PlaceErrorCode.PLACE_NOT_FOUND, '장소를 찾을 수 없습니다')
        );
      }

      return respond(c, success(place));
    } catch (error) {
      logger.error('Get place detail error:', error);
      return respond(
        c,
        failure(500, PlaceErrorCode.DATABASE_ERROR, '장소 조회 중 오류가 발생했습니다')
      );
    }
  }
);

export default app;
