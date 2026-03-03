import { createClient } from 'redis'
import env from '@/env.js'

let client: any

/**
 * 初始化 Redis 客户端
 */
async function redisClient() {
  if (client)
    return // 如果客户端已经初始化，则不再重复初始化
  client = await createClient({
    url: env.REDIS_SERVER,
  })
    .on('error', err => console.log('Redis 连接失败', err))
    .connect()
}

/**
 * 存入数组或对象，并可选地设置过期时间
 * @param key 键名
 * @param value 要存储的值
 * @param ttl 可选，以秒为单位的过期时间，默认不设置
 */
async function setKey(key: string, value: any, ttl = null) {
  if (!client)
    await redisClient() // 确保客户端已初始化
  value = JSON.stringify(value) // 将对象转换为JSON字符串
  await client.set(key, value)

  // 如果提供了ttl，则设置过期时间
  if (ttl !== null) {
    await client.expire(key, ttl)
  }
}

/**
 * 读取数组或对象
 * @param key 键名
 * @returns {Promise<any>} 解析后的JSON对象或数组
 */
async function getKey(key: string) {
  if (!client)
    await redisClient() // 确保客户端已初始化
  const value = await client.get(key) // 将获取到的JSON字符串转换回对象
  return value ? JSON.parse(value) : null // 如果value为空，返回null而不是抛出错误
}

/**
 * 清除缓存数据
 * @param key
 * @returns {Promise<void>}
 */
async function delKey(key: string) {
  if (!client)
    await redisClient() // 确保客户端已初始化
  await client.del(key)
}

export {
  delKey,
  getKey,
  redisClient,
  setKey,
}
