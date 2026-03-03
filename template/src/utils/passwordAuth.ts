import * as bcrypt from 'bcryptjs'

/**
 * 对用户密码进行 bcrypt 哈希加密。
 *
 * @param password 待加密的明文密码
 * @param options 加密选项
 * @param options.cost 加密强度（默认 12）
 * @returns 加密后的 bcrypt 哈希字符串
 */
export function hashPassword(password: string, options?: { cost?: number }) {
  const cost = options?.cost ?? 12
  return bcrypt.hashSync(password, cost)
}

/**
 * 校验用户输入的明文密码是否与存储的 bcrypt 哈希一致。
 *
 * @param password 待校验的明文密码
 * @param stored 存储的 bcrypt 哈希字符串
 * @returns 校验结果对象，包含 ok 字段（true 表示校验通过，false 表示校验失败）
 */
export function verifyPassword(password: string, stored: string) {
  try {
    return { ok: bcrypt.compareSync(password, stored) }
  }
  catch {
    return { ok: false as const }
  }
}
