const { Controller, Get } = require('@nestjs/common');
const { AppService } = require('./app.service');

/**
 * App Controller
 * Root controller for the application
 */
class AppController {
  constructor(appService) {
    this.appService = appService;
  }

  getHello() {
    return this.appService.getHello();
  }
}

// Apply decorators manually
Reflect.decorate([Controller()], AppController);

Reflect.decorate(
  [Get()],
  AppController.prototype,
  'getHello',
  Object.getOwnPropertyDescriptor(AppController.prototype, 'getHello')
);

Reflect.defineMetadata('design:paramtypes', [AppService], AppController);

module.exports = { AppController };
