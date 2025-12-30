/**
 * Usage Tracker Service
 * Manages API request counting, quota checking, and daily resets
 */

import { AIProvider } from '@/types';
import { StorageManager } from '@/storage';
import { APIUsageData, UsageStats, StorageKey } from '@/storage/StorageSchema';
import { RATE_LIMIT } from '@/config/constants';
import toast from 'react-hot-toast';

export class UsageTracker {
  private static readonly DEFAULT_DAILY_LIMIT = RATE_LIMIT.DEFAULT_DAILY_LIMIT;
  private static readonly WARNING_THRESHOLD = RATE_LIMIT.WARNING_THRESHOLD;

  /**
   * Check if request is allowed and increment counter
   * @returns true if allowed, false if quota exceeded
   */
  static async checkAndIncrement(provider: AIProvider): Promise<boolean> {
    const stats = await this.getUsageStats(provider);

    // Reset if needed (daily reset check)
    const needsReset = await this.checkAndResetIfNeeded(provider);
    if (needsReset) {
      // Refresh stats after reset
      return this.checkAndIncrement(provider);
    }

    // Check if blocked (100% quota used)
    if (stats.isBlocked) {
      toast.error(
        `Daily API limit reached (${stats.limit} requests). Resets at midnight.`,
        { duration: 6000 }
      );
      return false;
    }

    // Check if warning threshold reached (80%)
    if (stats.percentage >= 80 && !stats.warningShown) {
      toast(
        `API usage warning: ${stats.today}/${stats.limit} requests used (${Math.round(stats.percentage)}%). ${stats.remaining} remaining.`,
        {
          icon: '⚠️',
          duration: 5000,
          style: {
            background: '#fef3c7',
            color: '#92400e',
            border: '2px solid #fbbf24',
          },
        }
      );
      await this.markWarningShown(provider);
    }

    // Increment counter
    await this.incrementUsage(provider);

    return true;
  }

  /**
   * Get current usage statistics for a provider
   */
  static async getUsageStats(provider: AIProvider): Promise<UsageStats> {
    const usageData = await this.getUsageData(provider);
    const today = new Date().toISOString().split('T')[0];

    // Check if data is from today
    if (usageData.resetDate !== today) {
      // Return stats showing needs reset
      const limit = usageData.dailyLimit || this.DEFAULT_DAILY_LIMIT;
      return {
        today: 0,
        limit,
        percentage: 0,
        remaining: limit,
        resetAt: this.getNextResetTime(),
        isBlocked: false,
        warningShown: false,
      };
    }

    const limit = usageData.dailyLimit;
    const todayCount = usageData.requestCount;
    const percentage = (todayCount / limit) * 100;
    const remaining = Math.max(0, limit - todayCount);

    return {
      today: todayCount,
      limit,
      percentage,
      remaining,
      resetAt: this.getNextResetTime(),
      isBlocked: todayCount >= limit,
      warningShown: usageData.warningShown || false,
    };
  }

  /**
   * Get raw usage data from storage
   */
  private static async getUsageData(provider: AIProvider): Promise<APIUsageData> {
    const key = `usage.${provider}` as StorageKey;
    const data = await StorageManager.getSetting(key);

    if (!data) {
      // Initialize with defaults
      const defaultLimit = await this.getDefaultLimit();
      const today = new Date().toISOString().split('T')[0];

      const initialData: APIUsageData = {
        requestCount: 0,
        dailyLimit: defaultLimit,
        resetDate: today,
        lastRequestAt: 0,
        warningShown: false,
      };

      await StorageManager.setSetting(key, initialData);
      return initialData;
    }

    return data;
  }

  /**
   * Increment usage counter
   */
  private static async incrementUsage(provider: AIProvider): Promise<void> {
    const data = await this.getUsageData(provider);
    data.requestCount += 1;
    data.lastRequestAt = Date.now();

    const key = `usage.${provider}` as StorageKey;
    await StorageManager.setSetting(key, data);
  }

  /**
   * Mark that warning has been shown for today
   */
  private static async markWarningShown(provider: AIProvider): Promise<void> {
    const data = await this.getUsageData(provider);
    data.warningShown = true;

    const key = `usage.${provider}` as StorageKey;
    await StorageManager.setSetting(key, data);
  }

  /**
   * Check if reset is needed and perform reset
   * @returns true if reset was performed
   */
  private static async checkAndResetIfNeeded(provider: AIProvider): Promise<boolean> {
    const data = await this.getUsageData(provider);
    const today = new Date().toISOString().split('T')[0];

    if (data.resetDate !== today) {
      await this.resetUsage(provider);
      return true;
    }

    return false;
  }

  /**
   * Reset usage counter (called daily)
   */
  static async resetUsage(provider: AIProvider): Promise<void> {
    const data = await this.getUsageData(provider);
    const today = new Date().toISOString().split('T')[0];

    data.requestCount = 0;
    data.resetDate = today;
    data.warningShown = false;

    const key = `usage.${provider}` as StorageKey;
    await StorageManager.setSetting(key, data);

    console.log(`[UsageTracker] Reset usage for ${provider} on ${today}`);
  }

  /**
   * Update daily limit for a provider
   */
  static async updateLimit(provider: AIProvider, newLimit: number): Promise<void> {
    if (newLimit < 1) {
      throw new Error('Limit must be at least 1');
    }

    const data = await this.getUsageData(provider);
    data.dailyLimit = newLimit;

    const key = `usage.${provider}` as StorageKey;
    await StorageManager.setSetting(key, data);

    console.log(`[UsageTracker] Updated limit for ${provider} to ${newLimit}`);
  }

  /**
   * Get default daily limit
   */
  private static async getDefaultLimit(): Promise<number> {
    const limit = await StorageManager.getSetting('usage.defaultLimit' as StorageKey);
    return limit || this.DEFAULT_DAILY_LIMIT;
  }

  /**
   * Get next reset time (midnight tonight)
   */
  private static getNextResetTime(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toLocaleString();
  }

  /**
   * Reset all providers (for testing or manual reset)
   */
  static async resetAll(): Promise<void> {
    const providers: AIProvider[] = ['groq', 'claude', 'gemini', 'chromeai'];
    await Promise.all(providers.map(p => this.resetUsage(p)));
    console.log('[UsageTracker] Reset all providers');
  }
}
