/**
 * 代理管理器
 * 管理和轮换代理服务器
 */

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
  active: boolean;
}

export class ProxyManager {
  private proxies: ProxyConfig[] = [];
  private currentIndex = 0;

  constructor(proxies?: ProxyConfig[]) {
    if (proxies) {
      this.proxies = proxies.filter(p => p.active);
    }
    
    // 从环境变量加载
    this.loadFromEnv();
  }

  /**
   * 从环境变量加载代理配置
   */
  private loadFromEnv(): void {
    const server = process.env.CRAWLER_PROXY_SERVER;
    if (server) {
      this.proxies.push({
        server,
        username: process.env.CRAWLER_PROXY_USERNAME,
        password: process.env.CRAWLER_PROXY_PASSWORD,
        active: true,
      });
    }
  }

  /**
   * 添加代理
   */
  addProxy(proxy: ProxyConfig): void {
    if (proxy.active) {
      this.proxies.push(proxy);
    }
  }

  /**
   * 获取下一个代理（轮询）
   */
  getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) {
      return null;
    }

    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  /**
   * 获取随机代理
   */
  getRandomProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * this.proxies.length);
    return this.proxies[index];
  }

  /**
   * 标记代理为失败
   */
  markProxyFailed(proxy: ProxyConfig): void {
    const index = this.proxies.findIndex(p => p.server === proxy.server);
    if (index !== -1) {
      this.proxies[index].active = false;
    }
  }

  /**
   * 获取可用代理数量
   */
  getActiveProxyCount(): number {
    return this.proxies.filter(p => p.active).length;
  }

  /**
   * 是否有可用代理
   */
  hasProxy(): boolean {
    return this.proxies.length > 0;
  }
}

export const proxyManager = new ProxyManager();
