// src/redis/redis.service.ts

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectLogger } from 'src/shared/decorators/logger.decorator';
import { Logger } from 'winston';

@Injectable()
export class RedisService implements OnModuleInit{
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,  // Inject CacheManager
    @InjectLogger() private readonly logger:Logger
  ) {}
  onModuleInit() {
    console.log("Redis initialized successfully")
  }

  // Set a value in the Redis cache
  async setCache(key: string, value: string): Promise<void> {
    await this.cacheManager.set(key, value);
  }

  // Get a value from the Redis cache
  async getCache(key: string): Promise<string | undefined> {
    return await this.cacheManager.get(key);
  }

  // Delete a key from the Redis cache
  async delCache(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }
  async invalidCacheList(keys: string[]): Promise<void> {
    this.logger.log("Cache Invalided",keys) 
    for( let key of keys){
        await this.cacheManager.del(key)
    }
  }
}
