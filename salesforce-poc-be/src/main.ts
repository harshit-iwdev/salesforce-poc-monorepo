import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as http from 'node:http';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // ── Swagger / OpenAPI ────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Salesforce POC API')
    .setDescription(
      'NestJS backend that integrates with Salesforce to expose Accounts, ' +
      'Contacts, Opportunities and arbitrary SOQL queries over REST.',
    )
    .setVersion('1.0')
    .addTag('salesforce', 'Salesforce data endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      defaultModelsExpandDepth: 2,
    },
    customSiteTitle: 'Salesforce POC – API Docs',
  });
  // ────────────────────────────────────────────────────────────────────────

  const backendPort = Number(process.env.PORT ?? 8000);
  await app.listen(backendPort);

  console.log(`\n🚀 App running at:      http://localhost:${backendPort}`);
  console.log(`📚 Swagger UI at:       http://localhost:${backendPort}/api`);
  console.log(`🗒️  OpenAPI JSON at:     http://localhost:${backendPort}/api-json`);

  // Start a fallback callback forwarder on port 3000 if Connected App is configured for :3000
  if (backendPort !== 3000) {
    try {
      const forwarder = http.createServer((req, res) => {
        const targetUrl = `http://localhost:${backendPort}${req.url}`;
        res.writeHead(302, { Location: targetUrl });
        res.end(`Redirecting to ${targetUrl}`);
      });
      forwarder.listen(3000, () => {
        console.log(`🔀 Port 3000 OAuth forwarder active -> redirecting to :${backendPort}\n`);
      });
      forwarder.on('error', (err: any) => {
        // Silently ignore if port 3000 is occupied
      });
    } catch {
      // Ignore
    }
  }
}
await bootstrap();
