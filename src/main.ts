import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common/pipes/validation.pipe";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { ConsoleLogger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/httpExceptionFilter";
import { ResponseInterceptor } from "./common/interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      prefix: "Zoho-EOD",
    }),
  });
  const config = app.get(ConfigService);
  const port = config.get<number>("PORT") ?? 3000;
  const nodeEnv = config.get<string>("NODE_ENV") ?? "DEV";
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  const swaggerConfig = new DocumentBuilder()
    .setTitle(`Zoho Eod App - (${nodeEnv})`)
    .setDescription("zoho-eod API Documentation")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("/api/doc", app, document);

  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(port);
}
bootstrap();
