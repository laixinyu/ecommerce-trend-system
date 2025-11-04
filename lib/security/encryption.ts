// 数据加密工具类
import crypto from 'crypto';

export class Encryption {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32; // 256 bits

  private static getKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    
    // 如果key是hex字符串，转换为Buffer
    if (key.length === 64) {
      return Buffer.from(key, 'hex');
    }
    
    // 否则使用key派生
    return crypto.scryptSync(key, 'salt', this.keyLength);
  }

  /**
   * 加密文本
   * @param text 要加密的文本
   * @returns 加密后的JSON字符串，包含iv、encrypted和authTag
   */
  static encrypt(text: string): string {
    try {
      const key = this.getKey();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return JSON.stringify({
        iv: iv.toString('hex'),
        encrypted,
        authTag: authTag.toString('hex'),
      });
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 解密文本
   * @param encryptedData 加密的JSON字符串
   * @returns 解密后的文本
   */
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getKey();
      const { iv, encrypted, authTag } = JSON.parse(encryptedData);

      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        Buffer.from(iv, 'hex')
      );

      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 加密对象（将对象转为JSON后加密）
   * @param obj 要加密的对象
   * @returns 加密后的字符串
   */
  static encryptObject(obj: Record<string, unknown>): string {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * 解密对象（解密后解析JSON）
   * @param encryptedData 加密的字符串
   * @returns 解密后的对象
   */
  static decryptObject<T = Record<string, unknown>>(encryptedData: string): T {
    const decrypted = this.decrypt(encryptedData);
    return JSON.parse(decrypted) as T;
  }

  /**
   * 生成安全的随机token
   * @param length token长度（字节数）
   * @returns hex格式的随机token
   */
  static generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成密钥（用于初始化ENCRYPTION_KEY）
   * @returns hex格式的32字节密钥
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
