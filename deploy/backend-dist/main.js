"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const path_1 = require("path");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: false });
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'uploads'), { prefix: '/uploads' });
    app.useStaticAssets((0, path_1.join)(process.cwd(), 'frontend-build'));
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.use((req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
            return next();
        }
        res.sendFile((0, path_1.join)(process.cwd(), 'frontend-build', 'index.html'));
    });
    const port = parseInt(process.env.PORT || '3001');
    await app.listen(port);
    console.log(`Traxlogi API running on http://localhost:${port}/api`);
    console.log(`Traxlogi Frontend running on http://localhost:${port}`);
    console.log(`JT808 TCP Server on port ${process.env.TCP_PORT || 8808}`);
}
bootstrap();
//# sourceMappingURL=main.js.map