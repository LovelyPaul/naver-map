// Password Utility Functions (Client-side)
// 비밀번호 관련 유틸리티 함수 (클라이언트)

/**
 * 비밀번호 유효성 검증 (클라이언트 측)
 *
 * 규칙:
 * - 최소 4자 이상
 * - 최대 50자 이하
 *
 * @param password 비밀번호
 * @returns 검증 결과 { valid: boolean, message?: string }
 *
 * @example
 * validatePassword("abc") // { valid: false, message: "비밀번호는 최소 4자 이상이어야 합니다" }
 * validatePassword("abcd1234") // { valid: true }
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (!password || password.length === 0) {
    return {
      valid: false,
      message: '비밀번호를 입력해주세요',
    };
  }

  if (password.length < 4) {
    return {
      valid: false,
      message: '비밀번호는 최소 4자 이상이어야 합니다',
    };
  }

  if (password.length > 50) {
    return {
      valid: false,
      message: '비밀번호는 최대 50자까지 가능합니다',
    };
  }

  return { valid: true };
}

/**
 * 비밀번호 강도 계산
 *
 * @param password 비밀번호
 * @returns 강도 레벨 (0: 매우 약함, 1: 약함, 2: 보통, 3: 강함)
 *
 * @example
 * getPasswordStrength("1234") // 0
 * getPasswordStrength("abcd1234") // 1
 * getPasswordStrength("Abcd1234") // 2
 * getPasswordStrength("Abcd1234!@") // 3
 */
export function getPasswordStrength(password: string): number {
  let strength = 0;

  if (password.length >= 8) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) strength++;

  return Math.min(strength, 3);
}

/**
 * 비밀번호 강도를 텍스트로 변환
 *
 * @param strength 강도 레벨 (0-3)
 * @returns 강도 텍스트
 */
export function getPasswordStrengthText(strength: number): string {
  const texts = ['매우 약함', '약함', '보통', '강함'];
  return texts[Math.max(0, Math.min(strength, 3))] || '약함';
}
