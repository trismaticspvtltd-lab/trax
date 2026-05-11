import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User>;
    create(data: Partial<User>): Promise<{
        id: number;
        username: string;
        email: string;
        fullName: string;
        phone: string;
        role: UserRole;
        isActive: boolean;
        lastLogin: Date;
        avatar: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: number, data: Partial<User>): Promise<User>;
    remove(id: number): Promise<{
        message: string;
    }>;
    getStats(): Promise<{
        total: number;
        active: number;
        byRole: any[];
    }>;
}
