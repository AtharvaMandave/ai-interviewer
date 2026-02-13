const { Module } = require('@nestjs/common');
const { ReportsService } = require('./reports.service');
const { ReportGenerator } = require('./report.generator');

@Module({
    providers: [ReportsService, ReportGenerator],
    exports: [ReportsService],
})
class ReportsModule { }

module.exports = { ReportsModule };
