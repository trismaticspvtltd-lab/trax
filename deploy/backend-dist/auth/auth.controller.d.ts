import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            username: string;
            email: string;
            fullName: string;
            role: import("../users/user.entity").UserRole;
            avatar: string;
        };
    }>;
    getProfile(req: any): Promise<any>;
    changePassword(req: any, body: {
        oldPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
