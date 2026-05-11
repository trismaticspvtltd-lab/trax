import { Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private userRepository;
    constructor(userRepository: Repository<User>);
    validate(payload: any): Promise<{
        id: number;
        username: string;
        role: import("../../users/user.entity").UserRole;
        email: string;
    }>;
}
export {};
