// Password Utility Functions (Server-side)
// 비밀번호 관련 유틸리티 함수 (서버)

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * 비밀번호 해싱
 *
 * @param plainPassword 평문 비밀번호
 * @returns 해시된 비밀번호
 *
 * @example
 * const hashed = await hashPassword("mypassword123");
 * // "$2a$10$..."
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  const hashed = await bcrypt.hash(plainPassword, salt);
  return hashed;
}

/**
 * 비밀번호 검증
 *
 * @param plainPassword 평문 비밀번호
 * @param hashedPassword 해시된 비밀번호
 * @returns 일치 여부
 *
 * @example
 * const isValid = await comparePassword("mypassword123", hashedPassword);
 * // true or false
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error('비밀번호 비교 오류:', error);
    return false;
  }
}
