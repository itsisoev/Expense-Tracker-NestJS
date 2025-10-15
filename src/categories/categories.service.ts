import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CategoryEntity } from './entity/category.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repo: Repository<CategoryEntity>,
  ) {}

  async findMine(userId: string) {
    return this.repo.find({ where: { userId }, order: { createdAt: 'ASC' } });
  }

  async create(
    userId: string,
    name: string,
    isDefault = false,
    imagePath: string | null = null,
  ) {
    const cat = this.repo.create({ userId, name, isDefault, imagePath });
    return this.repo.save(cat);
  }

  async update(userId: string, id: string, patch: { name?: string }) {
    const cat = await this.repo.findOne({ where: { id, userId } });
    if (!cat) throw new Error('Category not found');
    if (patch.name) cat.name = patch.name;
    return this.repo.save(cat);
  }

  async setImage(userId: string, id: string, relImagePath: string) {
    const cat = await this.repo.findOne({ where: { id, userId } });
    if (!cat) throw new Error('Category not found');

    const old = cat.imagePath;
    cat.imagePath = relImagePath;
    await this.repo.save(cat);

    if (old && old !== relImagePath) {
      await this.safeUnlink(old);
    }
    return cat;
  }

  async delete(userId: string, id: string) {
    const cat = await this.repo.findOne({ where: { id, userId } });
    if (!cat) return false;

    const img = cat.imagePath;
    await this.repo.remove(cat);

    if (img) {
      await this.safeUnlink(img);
    }
    return true;
  }

  async ensureDefaultCategories(userId: string) {
    const basePath = 'uploads/categories';

    const defaults: { name: string; image: string }[] = [
      { name: 'Путешествие', image: `${basePath}/travel.webp` },
      { name: 'Такси', image: `${basePath}/taxi.webp` },
      { name: 'Еда', image: `${basePath}/food.webp` },
      { name: 'Работа', image: `${basePath}/work.webp` },
    ];

    for (const { name, image } of defaults) {
      const exists = await this.repo.findOne({ where: { userId, name } });
      if (!exists) {
        await this.create(userId, name, true, image);
      }
    }
  }

  private async safeUnlink(relPath: string) {
    const full = path.isAbsolute(relPath)
      ? relPath
      : path.join(process.cwd(), relPath);
    try {
      await fs.unlink(full);
    } catch (_) {}
  }
}
