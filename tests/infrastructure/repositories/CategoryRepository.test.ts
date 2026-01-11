import { CategoryRepository } from '../../../src/infrastructure/repositories/CategoryRepository';
import { CategoryModel } from '../../../src/infrastructure/models/Catergory.model';
import { ICreateCategory } from '../../../src/domain/entities/Category';

jest.mock('../../../src/infrastructure/models/Catergory.model');

describe('CategoryRepository', () => {
  let categoryRepository: CategoryRepository;

  beforeEach(() => {
    categoryRepository = new CategoryRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      const newCategoryData: ICreateCategory = {
        name: 'Food',
        color: '#FF5733',
        userId: '507f1f77bcf86cd799439011',
      };

      const mockSavedCategory = {
        id: 'cat123',
        name: newCategoryData.name,
        color: newCategoryData.color,
        userId: newCategoryData.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          id: 'cat123',
          name: newCategoryData.name,
          color: newCategoryData.color,
          userId: newCategoryData.userId,
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        }),
      };

      (CategoryModel as unknown as jest.Mock).mockImplementation(() => mockSavedCategory);

      const result = await categoryRepository.create(newCategoryData);

      expect(mockSavedCategory.save).toHaveBeenCalled();
      expect(result.name).toBe(newCategoryData.name);
      expect(result.color).toBe(newCategoryData.color);
      expect(result.userId).toBe(newCategoryData.userId);
    });
  });

  describe('findByUserId', () => {
    it('should return categories for a user', async () => {
      const validUserId = '507f1f77bcf86cd799439011';
      const mockCategories = [
        {
          _id: '507f1f77bcf86cd799439012',
          name: 'Food',
          color: '#FF5733',
          userId: validUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFind = {
        lean: jest.fn().mockResolvedValue(mockCategories),
      };
      (CategoryModel.find as jest.Mock).mockReturnValue(mockFind);

      const result = await categoryRepository.findByUserId(validUserId);

      expect(CategoryModel.find).toHaveBeenCalled();
      expect(mockFind.lean).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array if no categories found', async () => {
      const validUserId = '507f1f77bcf86cd799439011';
      const mockFind = {
        lean: jest.fn().mockResolvedValue([]),
      };
      (CategoryModel.find as jest.Mock).mockReturnValue(mockFind);

      const result = await categoryRepository.findByUserId(validUserId);

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return category if found', async () => {
      const validCategoryId = '507f1f77bcf86cd799439012';
      const mockCategory = {
        _id: validCategoryId,
        name: 'Food',
        color: '#FF5733',
        userId: '507f1f77bcf86cd799439011',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFindById = {
        lean: jest.fn().mockResolvedValue(mockCategory),
      };
      (CategoryModel.findById as jest.Mock).mockReturnValue(mockFindById);

      const result = await categoryRepository.findById(validCategoryId);

      expect(CategoryModel.findById).toHaveBeenCalledWith(validCategoryId);
      expect(mockFindById.lean).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should return null if category not found', async () => {
      const validCategoryId = '507f1f77bcf86cd799439013';
      const mockFindById = {
        lean: jest.fn().mockResolvedValue(null),
      };
      (CategoryModel.findById as jest.Mock).mockReturnValue(mockFindById);

      const result = await categoryRepository.findById(validCategoryId);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update category successfully', async () => {
      const updateData = { name: 'Updated Food' };
      const updatedCategory = {
        id: 'cat123',
        name: 'Updated Food',
        color: '#FF5733',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFindByIdAndUpdate = {
        lean: jest.fn().mockResolvedValue(updatedCategory),
      };
      (CategoryModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockFindByIdAndUpdate);

      const result = await categoryRepository.update('cat123', updateData);

      expect(CategoryModel.findByIdAndUpdate).toHaveBeenCalledWith('cat123', updateData, { new: true });
      expect(mockFindByIdAndUpdate.lean).toHaveBeenCalled();
      expect(result).toEqual(updatedCategory);
    });

    it('should return null if category not found', async () => {
      const mockFindByIdAndUpdate = {
        lean: jest.fn().mockResolvedValue(null),
      };
      (CategoryModel.findByIdAndUpdate as jest.Mock).mockReturnValue(mockFindByIdAndUpdate);

      const result = await categoryRepository.update('nonexistent', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete category successfully', async () => {
      (CategoryModel.findByIdAndDelete as jest.Mock).mockResolvedValue({ id: 'cat123' });

      const result = await categoryRepository.delete('cat123');

      expect(CategoryModel.findByIdAndDelete).toHaveBeenCalledWith('cat123');
      expect(result).toBe(true);
    });
  });
});
