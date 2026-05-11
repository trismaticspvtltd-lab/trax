import { UsersService } from './users.service';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(): Promise<import("./user.entity").User[]>;
    getStats(): Promise<{
        total: number;
        active: number;
        byRole: any[];
    }>;
    findOne(id: string): Promise<import("./user.entity").User>;
    create(body: any): Promise<{
        id: number;
        username: string;
        email: string;
        fullName: string;
        phone: string;
        role: import("./user.entity").UserRole;
        isActive: boolean;
        lastLogin: Date;
        avatar: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, body: any): Promise<import("./user.entity").User>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
