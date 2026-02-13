const { Module } = require('@nestjs/common');
const { MemoryService } = require('./memory.service');
const { RedisService } = require('./redis.service');
const { VectorService } = require('./vector.service');

@Module({
    providers: [MemoryService, RedisService, VectorService],
    exports: [MemoryService, RedisService, VectorService],
})
class MemoryModule { }

module.exports = { MemoryModule };
