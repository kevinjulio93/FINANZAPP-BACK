import { CategoryController } from '../../../src/presentation/controllers/CategoryController';
import { CategoryService } from '../../../src/application/services/CategoryService';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

jest.mock('../../../src/application/services/CategoryService');

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

describe('CategoryController', () => {
  let categoryController: CategoryController;
  let mockCategoryService: CategoryService;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    mockCategoryService = {
      createCategory: jest.fn(),
      getCategoriesByUserId: jest.fn(),
      getCategoryById: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
    } as any;

    categoryController = new CategoryController(mockCategoryService);

    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn().mockReturnThis();

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    mockRequest = {
      body: {},
      user: { id: 'user123' },
    };
  });

  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      const categoryData = {
        name: 'Food',
        color: '#FF5733',
      };

      const mockCategory = {
        id: 'cat123',
        name: categoryData.name,
        color: categoryData.color,
        userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = categoryData;
      (mockCategoryService.createCategory as jest.Mock).mockResolvedValue(mockCategory);

      await categoryController.createCategory(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockCategoryService.createCategory).toHaveBeenCalledWith({
        name: categoryData.name,
        color: categoryData.color,
        userId: 'user123',
      });
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(mockCategory);
    });

    it('should return 400 if validation fails', async () => {
      mockRequest.body = {
        name: '',
        color: '',
      };

      await categoryController.createCategory(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: expect.any(String),
      });
    });

    it('should return 400 if service throws error', async () => {
      mockRequest.body = {
        name: 'Food',
        color: '#FF5733',
      };

      (mockCategoryService.createCategory as jest.Mock).mockRejectedValue(new Error('Database error'));

      await categoryController.createCategory(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Database error',
      });
    });
  });

  describe('getCategories', () => {
    it('should return all categories for user', async () => {
      const mockCategories = [
        {
          id: 'cat1',
          name: 'Food',
          color: '#FF5733',
          userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cat2',
          name: 'Transport',
          color: '#33FF57',
          userId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (mockCategoryService.getCategoriesByUserId as jest.Mock).mockResolvedValue(mockCategories);

      await categoryController.getCategories(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockCategoryService.getCategoriesByUserId).toHaveBeenCalledWith('user123');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockCategories);
    });

    it('should return empty array if no categories found', async () => {
      (mockCategoryService.getCategoriesByUserId as jest.Mock).mockResolvedValue([]);

      await categoryController.getCategories(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([]);
    });

    it('should return 400 if service throws error', async () => {
      (mockCategoryService.getCategoriesByUserId as jest.Mock).mockRejectedValue(new Error('Database error'));

      await categoryController.getCategories(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Database error',
      });
    });
  });
});
