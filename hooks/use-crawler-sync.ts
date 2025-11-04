/**
 * 爬虫同步 Hook
 * 用于检测新的爬取数据并通知用户
 */

import { useEffect, useState, useCallback, useRef } from 'react';

interface SyncStatus {
    hasNewData: boolean;
    newProductsCount: number;
    recentCrawls: unknown[];
    recentProducts: unknown[];
    timestamp: string;
}

interface UseCrawlerSyncOptions {
    enabled?: boolean;
    interval?: number; // 轮询间隔（毫秒）
    onNewData?: (status: SyncStatus) => void;
}

export function useCrawlerSync(options: UseCrawlerSyncOptions = {}) {
    const {
        enabled = true,
        interval = 30 * 1000, // 默认 30 秒
        onNewData,
    } = options;

    const lastCheckRef = useRef<string>(new Date().toISOString());
    const isCheckingRef = useRef(false);
    const onNewDataRef = useRef(onNewData);
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    // 保持 onNewData 引用最新
    useEffect(() => {
        onNewDataRef.current = onNewData;
    }, [onNewData]);

    useEffect(() => {
        if (!enabled) return;

        const checkForNewData = async () => {
            if (isCheckingRef.current) return;

            isCheckingRef.current = true;
            setIsChecking(true);

            try {
                const response = await fetch(`/api/crawl/sync?since=${encodeURIComponent(lastCheckRef.current)}`);
                const result = await response.json();

                if (result.success) {
                    const status = result.data as SyncStatus;
                    setSyncStatus(status);

                    if (status.hasNewData && onNewDataRef.current) {
                        onNewDataRef.current(status);
                    }

                    lastCheckRef.current = status.timestamp;
                }
            } catch (error) {
                console.error('Failed to check sync status:', error);
            } finally {
                isCheckingRef.current = false;
                setIsChecking(false);
            }
        };

        // 立即检查一次
        checkForNewData();

        // 设置定时轮询
        const timer = setInterval(checkForNewData, interval);

        return () => clearInterval(timer);
    }, [enabled, interval]);

    const checkNow = useCallback(async () => {
        if (isCheckingRef.current) return;

        isCheckingRef.current = true;
        setIsChecking(true);

        try {
            const response = await fetch(`/api/crawl/sync?since=${encodeURIComponent(lastCheckRef.current)}`);
            const result = await response.json();

            if (result.success) {
                const status = result.data as SyncStatus;
                setSyncStatus(status);

                if (status.hasNewData && onNewDataRef.current) {
                    onNewDataRef.current(status);
                }

                lastCheckRef.current = status.timestamp;
            }
        } catch (error) {
            console.error('Failed to check sync status:', error);
        } finally {
            isCheckingRef.current = false;
            setIsChecking(false);
        }
    }, []);

    return {
        syncStatus,
        isChecking,
        checkNow,
        resetLastCheck: () => {
            lastCheckRef.current = new Date().toISOString();
        },
    };
}
