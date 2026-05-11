"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subClient = exports.pubClient = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
exports.redis = new ioredis_1.default(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3)
            return null;
        return Math.min(times * 200, 2000);
    },
});
exports.redis.on('connect', () => console.log('Redis connected'));
exports.redis.on('error', (err) => console.error('Redis error:', err.message));
exports.pubClient = new ioredis_1.default(redisUrl, {
    lazyConnect: true,
    retryStrategy(times) {
        if (times > 3)
            return null;
        return Math.min(times * 200, 2000);
    },
});
exports.subClient = new ioredis_1.default(redisUrl, {
    lazyConnect: true,
    retryStrategy(times) {
        if (times > 3)
            return null;
        return Math.min(times * 200, 2000);
    },
});
//# sourceMappingURL=redis.js.map