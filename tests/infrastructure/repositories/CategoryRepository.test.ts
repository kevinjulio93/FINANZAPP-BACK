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
        userId: 'user123',
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
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Food',
          color: '#FF5733',
          userId: 'user123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockFind = {
        lean: jest.fn().mockResolvedValue(mockCategories),
      };
      (CategoryModel.find as jest.Mock).mockReturnValue(mockFind);

      const result = await categoryRepository.findByUserId('user123');

      expect(CategoryModel.find).toHaveBeenCalledWith({ userId: 'user123' });
      expect(mockFind.lean).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });

    it('should return empty array if no categories found', async () => {
      const mockFind = {
        lean: jest.fn().mockResolvedValue([]),
      };
      (CategoryModel.find as jest.Mock).mockReturnValue(mockFind);

      const result = await categoryRepository.findByUserId('user123');

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return category if found', async () => {
      const mockCategory = {
        id: 'cat123',
        name: 'Food',
        color: '#FF5733',
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockFindOne = {
        lean: jest.fn().mockResolvedValue(mockCategory),
      };
      (CategoryModel.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const result = await categoryRepository.findById('cat123');

      expect(CategoryModel.findOne).toHaveBeenCalledWith({ id: 'cat123' });
      expect(mockFindOne.lean).toHaveBeenCalled();
      expect(result).toEqual(mockCategory);
    });

    it('should return null if category not found', async () => {
      const mockFindOne = {
        lean: jest.fn().mockResolvedValue(null),
      };
      (CategoryModel.findOne as jest.Mock).mockReturnValue(mockFindOne);

      const result = await categoryRepository.findById('nonexistent');

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
