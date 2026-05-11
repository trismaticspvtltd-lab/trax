import 'dotenv/config';
import { OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
export declare class AppModule implements OnModuleInit {
    private authService;
    constructor(authService: AuthService);
    onModuleInit(): Promise<void>;
}
