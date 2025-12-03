import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body size limit for large sync requests (50MB)
  app.use(require('express').json({ limit: '50mb' }));
  app.use(require('express').urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS
  app.enableCors({
    origin: [
      'http://localhost', // Capacitor Android utilise cette origine
      'http://127.0.0.1',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3002',
      'http://127.0.0.1:3002',
      'http://localhost:3003',
      'http://127.0.0.1:3003',
      'http://192.168.1.66:3003', // Accès depuis mobile sur le réseau local
      /^http:\/\/192\.168\.\d+\.\d+:3003$/, // Autoriser toutes les IPs du réseau local sur le port 3003
      /^http:\/\/localhost(:[0-9]+)?$/, // Autoriser localhost avec ou sans port
      /^http:\/\/127\.0\.0\.1(:[0-9]+)?$/, // Autoriser 127.0.0.1 avec ou sans port
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Selos API')
    .setDescription('Backoffice retail API with authentication and CRUD operations')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  
  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  });
  
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      tryItOutEnabled: true,
      filter: true,
      displayRequestDuration: true,
    },
    customSiteTitle: 'Selos API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
    customfavIcon: '/favicon.ico',
  });

  await app.listen(process.env.PORT ?? 3001);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3001}`);
  console.log(`Swagger documentation: http://localhost:${process.env.PORT ?? 3001}/api`);
  console.log(`Logs with field names enabled`);
}
bootstrap();
