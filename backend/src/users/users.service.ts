import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepository.find({
      select: ['id', 'username', 'email', 'fullName', 'phone', 'role', 'isActive', 'lastLogin', 'createdAt'],
    });
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'fullName', 'phone', 'role', 'isActive', 'lastLogin', 'createdAt'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(data: Partial<User>) {
    const existing = await this.userRepository.findOne({
      where: [{ username: data.username }, { email: data.email }],
    });
    if (existing) throw new ConflictException('Username or email already exists');

    const hashed = await bcrypt.hash(data.password as string, 10);
    const user = this.userRepository.create({ ...data, password: hashed });
    const saved = await this.userRepository.save(user) as User;
    const { password: _pw, ...result } = saved;
    return result;
  }

  async update(id: number, data: Partial<User>) {
    await this.findOne(id);
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    await this.userRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.userRepository.update(id, { isActive: false });
    return { message: 'User deactivated' };
  }

  async getStats() {
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({ where: { isActive: true } });
    const byRole = await this.userRepository
      .createQueryBuilder('u')
      .select('u.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('u.role')
      .getRawMany();
    return { total, active, byRole };
  }
}
