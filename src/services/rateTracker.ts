// Rate Limit Tracker for AI Providers
function getModelLimits(modelName: string) {
  const limits = {
    gemini: { limitRpm: 15, limitRpd: 1000, limitTpm: 250000 },
    cerebras: { limitRpm: 30, limitRpd: 14400, limitTpm: 60000 },
    perplexity: { limitRpm: 100, limitRpd: 10000, limitTpm: 1000000 },
    cloudflare: { limitRpm: 1000, limitRpd: 100000, limitTpm: 1000000 }
  };
  
  return limits[modelName as keyof typeof limits] || limits.cloudflare;
}

function createMockUsageStats(modelName: string, overrides: any = {}) {
  const limits = getModelLimits(modelName);
  return {
    rpm: 0,
    rpd: 0,
    tpm: 0,
    lastReset: Date.now(),
    ...limits,
    ...overrides
  };
}

function isRateLimited(stats: any) {
  return stats.rpm >= stats.limitRpm || 
         stats.rpd >= stats.limitRpd || 
         stats.tpm >= stats.limitTpm;
}

export class RateLimitTracker {
  private tracker: {
    stats: { [key: string]: any };
    lastReset: number;
    resetInterval: number;
  };
  private resetTimer: NodeJS.Timeout | null = null;

  constructor(resetIntervalMs: number = 60000) { // Default 1 minute
    this.tracker = {
      stats: this.initializeStats(),
      lastReset: Date.now(),
      resetInterval: resetIntervalMs
    };
    
    this.startResetTimer();
  }

  private initializeStats() {
    return {
      gemini: createMockUsageStats('gemini'),
      cerebras: createMockUsageStats('cerebras'),
      perplexity: createMockUsageStats('perplexity'),
      cloudflare: createMockUsageStats('cloudflare')
    };
  }

  private startResetTimer() {
    this.resetTimer = setInterval(() => {
      this.resetMinuteCounters();
    }, this.tracker.resetInterval);
  }

  recordRequest(provider: string, tokensUsed: number = 100) {
    if (!this.tracker.stats[provider]) {
      console.warn(`Unknown provider: ${provider}`);
      return;
    }

    const stats = this.tracker.stats[provider];
    stats.rpm += 1;
    stats.rpd += 1;
    stats.tpm += tokensUsed;

    console.log(`Recorded request for ${provider}: RPM=${stats.rpm}/${stats.limitRpm}, RPD=${stats.rpd}/${stats.limitRpd}, TPM=${stats.tpm}/${stats.limitTpm}`);
  }

  isProviderAvailable(provider: string): boolean {
    const stats = this.tracker.stats[provider];
    if (!stats) return false;

    return stats.rpm < stats.limitRpm && 
           stats.rpd < stats.limitRpd && 
           stats.tpm < stats.limitTpm;
  }

  getProviderStats(provider: string) {
    return this.tracker.stats[provider] || null;
  }

  getAllStats() {
    return { ...this.tracker.stats };
  }

  getAvailableProviders(): string[] {
    return Object.entries(this.tracker.stats)
      .filter(([_, stats]) => this.isProviderAvailable(_))
      .map(([provider, _]) => provider);
  }

  resetMinuteCounters() {
    const now = Date.now();
    console.log(`Resetting minute counters at ${new Date(now).toISOString()}`);

    for (const [provider, stats] of Object.entries(this.tracker.stats)) {
      stats.rpm = 0;
      stats.tpm = 0;
      stats.lastReset = now;
    }

    this.tracker.lastReset = now;
  }

  resetDailyCounters() {
    console.log('Resetting daily counters');
    
    for (const [provider, stats] of Object.entries(this.tracker.stats)) {
      stats.rpd = 0;
    }
  }

  getUsageSummary() {
    const summary: { [key: string]: any } = {};

    for (const [provider, stats] of Object.entries(this.tracker.stats)) {
      summary[provider] = {
        available: this.isProviderAvailable(provider),
        rpm: {
          current: stats.rpm,
          limit: stats.limitRpm,
          percentage: Math.round((stats.rpm / stats.limitRpm) * 100)
        },
        rpd: {
          current: stats.rpd,
          limit: stats.limitRpd,
          percentage: Math.round((stats.rpd / stats.limitRpd) * 100)
        },
        tpm: {
          current: stats.tpm,
          limit: stats.limitTpm,
          percentage: Math.round((stats.tpm / stats.limitTpm) * 100)
        }
      };
    }

    return summary;
  }

  getNextResetTime(): number {
    return this.tracker.lastReset + this.tracker.resetInterval;
  }

  getTimeUntilReset(): number {
    return Math.max(0, this.getNextResetTime() - Date.now());
  }

  destroy() {
    if (this.resetTimer) {
      clearInterval(this.resetTimer);
      this.resetTimer = null;
    }
  }
}

// Singleton instance for global usage
let globalRateTracker: RateLimitTracker | null = null;

export function getGlobalRateTracker(): RateLimitTracker {
  if (!globalRateTracker) {
    globalRateTracker = new RateLimitTracker();
  }
  return globalRateTracker;
}

export function destroyGlobalRateTracker() {
  if (globalRateTracker) {
    globalRateTracker.destroy();
    globalRateTracker = null;
  }
} 