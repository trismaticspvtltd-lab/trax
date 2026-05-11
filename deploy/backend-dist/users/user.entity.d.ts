export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    ADMIN = "admin",
    MANAGER = "manager",
    OPERATOR = "operator",
    VIEWER = "viewer"
}
export declare class User {
    id: number;
    username: string;
    email: string;
    password: string;
    fullName: string;
    phone: string;
    role: UserRole;
    isActive: boolean;
    lastLogin: Date;
    avatar: string;
    createdAt: Date;
    updatedAt: Date;
}
