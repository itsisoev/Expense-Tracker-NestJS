import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from './entity/users.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../graphql/types/user.type';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity)
    private readonly repo: Repository<UsersEntity>,
  ) {}

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async findByUsername(username: string) {
    return this.repo.findOne({ where: { username } });
  }

  async create(username: string, password: string) {
    const exists = await this.findByUsername(username);
    if (exists) throw new Error('Username already taken');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.repo.create({ username, passwordHash });
    return this.repo.save(user);
  }

  async validatePassword(user: UsersEntity, password: string) {
    return bcrypt.compare(password, user.passwordHash);
  }

  async findAll() {
    return this.repo.find();
  }
}
