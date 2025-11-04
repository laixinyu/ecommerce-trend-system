// 生成加密密钥
import { Encryption } from '../lib/security/encryption';

console.log('🔐 生成加密密钥...\n');

const key = Encryption.generateKey();

console.log('✅ 加密密钥已生成！\n');
console.log('请将以下内容添加到 .env.local 文件中:\n');
console.log(`ENCRYPTION_KEY=${key}\n`);
console.log('⚠️  警告: 请妥善保管此密钥，不要提交到版本控制系统！');
console.log('⚠️  如果密钥丢失，已加密的数据将无法解密！');
