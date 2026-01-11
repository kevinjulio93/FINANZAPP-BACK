import { CategoryService } from '../../../src/application/services/CategoryService';
import { ICategoryRepository } from '../../../src/domain/repositories/Interfaces/ICategoryRepository';
import { ICategory, ICreateCategory } from '../../../src/domain/entities/Category';
import mongoose from 'mongoose';

describe('CategoryService', () => {
  let categoryService: CategoryService;
  let mockCategoryRepository: ICategoryRepository;

  const mockCategory: ICategory = {
    id: 'cat123',
    name: 'Food',
    color: '#FF5733',
    userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateCategory: ICreateCategory = {
    name: 'Food',
    color: '#FF5733',
    userId: 'user123',
  };

  beforeEach(() => {
    mockCategoryRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    categoryService = new CategoryService(mockCategoryRepository);
  });

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      (mockCategoryRepository.create as jest.Mock).mockResolvedValue(mockCategory);

      const result = await categoryService.createCategory(mockCreateCategory);

      expect(mockCategoryRepository.create).toHaveBeenCalledWith(mockCreateCategory);
      expect(result).toEqual(mockCategory);
    });
  });

  describe('getCategoriesByUserId', () => {
    it('should return categories for a user', async () => {
      const mockCategories = [mockCategory];
      (mockCategoryRepository.findByUserId as jest.Mock).mockResolvedValue(mockCategories);

      const result = await categoryService.getCategoriesByUserId('user123');

      expect(mockCategoryRepository.findByUserId).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockCategories);
    });

    it('should return empty array if no categories found', async () => {
      (mockCategoryRepository.findByUserId as jest.Mock).mockResolvedValue([]);

      const result = await categoryService.getCategoriesByUserId('user123');

      expect(result).toEqual([]);
    });
  });

  describe('getCategoryById', () => {
    it('should return category if found', async () => {
      (mockCategoryRepository.findById as jest.Mock).mockResolvedValue(mockCategory);

      const result = await categoryService.getCategoryById('cat123');

      expect(mockCategoryRepository.findById).toHaveBeenCalledWith('cat123');
      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      (mockCategoryRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await categoryService.getCategoryById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      const updateData = { name: 'Updated Food' };
      const updatedCategory = { ...mockCategory, name: 'Updated Food' };
      (mockCategoryRepository.update as jest.Mock).mockResolvedValue(updatedCategory);

      const result = await categoryService.updateCategory('cat123', updateData);

      expect(mockCategoryRepository.update).toHaveBeenCalledWith('cat123', updateData);
      expect(result).toEqual(updatedCategory);
    });

    it('should return null if category not found', async () => {
      (mockCategoryRepository.update as jest.Mock).mockResolvedValue(null);

      const result = await categoryService.updateCategory('nonexistent', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      (mockCategoryRepository.delete as jest.Mock).mockResolvedValue(true);

      const result = await categoryService.deleteCategory('cat123');

      expect(mockCategoryRepository.delete).toHaveBeenCalledWith('cat123');
      expect(result).toBe(true);
    });

    it('should return false if category not found', async () => {
      (mockCategoryRepository.delete as jest.Mock).mockResolvedValue(false);

      const result = await categoryService.deleteCategory('nonexistent');

      expect(result).toBe(false);
    });
  });
});
