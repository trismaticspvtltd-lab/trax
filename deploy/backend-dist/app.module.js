"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
require("dotenv/config");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const devices_module_1 = require("./devices/devices.module");
const tracking_module_1 = require("./tracking/tracking.module");
const tcp_server_module_1 = require("./tcp-server/tcp-server.module");
const geofence_module_1 = require("./geofence/geofence.module");
const alerts_module_1 = require("./alerts/alerts.module");
const trips_module_1 = require("./trips/trips.module");
const reports_module_1 = require("./reports/reports.module");
const drivers_module_1 = require("./drivers/drivers.module");
const s3_module_1 = require("./s3/s3.module");
const media_server_module_1 = require("./media-server/media-server.module");
const video_recordings_module_1 = require("./video-recordings/video-recordings.module");
const user_entity_1 = require("./users/user.entity");
const device_entity_1 = require("./devices/device.entity");
const location_entity_1 = require("./tracking/location.entity");
const trip_entity_1 = require("./trips/trip.entity");
const geofence_entity_1 = require("./geofence/geofence.entity");
const alert_entity_1 = require("./alerts/alert.entity");
const driver_entity_1 = require("./drivers/driver.entity");
const video_recording_entity_1 = require("./video-recordings/video-recording.entity");
const auth_service_1 = require("./auth/auth.service");
let AppModule = class AppModule {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async onModuleInit() {
        await this.authService.createInitialAdmin();
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: () => ({
                    type: 'mysql',
                    host: process.env.DB_HOST || 'localhost',
                    port: parseInt(process.env.DB_PORT || '3306'),
                    username: process.env.DB_USERNAME || 'root',
                    password: process.env.DB_PASSWORD || '',
                    database: process.env.DB_DATABASE || 'traxlogi',
                    entities: [user_entity_1.User, device_entity_1.Device, location_entity_1.Location, trip_entity_1.Trip, geofence_entity_1.Geofence, alert_entity_1.Alert, driver_entity_1.Driver, video_recording_entity_1.VideoRecording],
                    synchronize: true,
                    logging: false,
                }),
            }),
            s3_module_1.S3Module,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            devices_module_1.DevicesModule,
            tracking_module_1.TrackingModule,
            tcp_server_module_1.TcpServerModule,
            geofence_module_1.GeofenceModule,
            alerts_module_1.AlertsModule,
            trips_module_1.TripsModule,
            reports_module_1.ReportsModule,
            drivers_module_1.DriversModule,
            media_server_module_1.MediaServerModule,
            video_recordings_module_1.VideoRecordingsModule,
        ],
    }),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AppModule);
//# sourceMappingURL=app.module.js.map