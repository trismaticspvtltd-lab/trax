import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private userRepository;
    private jwtService;
    constructor(userRepository: Repository<User>, jwtService: JwtService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            username: string;
            email: string;
            fullName: string;
            role: UserRole;
            avatar: string;
        };
    }>;
    createInitialAdmin(): Promise<void>;
    validateUser(userId: number): Promise<User | null>;
    changePassword(userId: number, oldPassword: string, newPassword: string): Promise<{
        message: string;
    }>;
}
