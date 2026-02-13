const { Module } = require('@nestjs/common');
const { AnalyticsService } = require('./analytics.service');
const { SkillProfileService } = require('./skill-profile.service');
const { MistakePatternService } = require('./mistake-pattern.service');

@Module({
    providers: [AnalyticsService, SkillProfileService, MistakePatternService],
    exports: [AnalyticsService, SkillProfileService, MistakePatternService],
})
class AnalyticsModule { }

module.exports = { AnalyticsModule };
