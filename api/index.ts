import "reflect-metadata";

import { ConsoleLogger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { ExpressAdapter } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import serverlessExpress from "@vendia/serverless-express";
import express from "express";

import { AppModule } from "../src/app.module";
import { ResponseInterceptor } from "../src/common/interceptor";

let cachedServer: any;

async function bootstrap() {
  if (cachedServer) return cachedServer;

  const expressApp = express();

  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
    {
      logger: new ConsoleLogger({
        prefix: "Zoho-EOD",
      }),
    },
  );

  const config = app.get(ConfigService);
  const nodeEnv = config.get<string>("NODE_ENV") ?? "DEV";

  app.setGlobalPrefix("api/v1");

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(`Zoho Eod App - (${nodeEnv})`)
    .setDescription("zoho-eod API Documentation")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("/api/doc", app, document);

  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.init();

  cachedServer = serverlessExpress({ app: expressApp });
  return cachedServer;
}

export default async function handler(req: any, res: any) {
  const server = await bootstrap();
  return server(req, res);
}
