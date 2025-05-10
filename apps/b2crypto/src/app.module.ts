import { CorrelationIdMiddleware } from '@common/common/middlewares';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { configApp } from './config.app.const';

@Module({
  imports: [...new Set([...configApp.imports])],
  controllers: [...new Set([...configApp.controllers])],
  providers: [...new Set([...configApp.providers])],
  exports: [...new Set([...configApp.exports])],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
