/**
 * Mock data store - Singleton para persistir datos en memoria durante desarrollo
 * En producción esto debería ser reemplazado por una base de datos real
 */

interface MockUserData {
    id: string;
    name: string;
    email: string;
    monthlyBudget: number;
    createdAt: string;
    updatedAt: string;
}

class MockDataStore {
    private static instance: MockDataStore;
    private userData: MockUserData;

    private constructor() {
        this.userData = {
            id: "1",
            name: "Usuario Demo",
            email: "demo@finanzapp.com",
            monthlyBudget: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    public static getInstance(): MockDataStore {
        if (!MockDataStore.instance) {
            MockDataStore.instance = new MockDataStore();
        }
        return MockDataStore.instance;
    }

    public getUser(): MockUserData {
        return { ...this.userData };
    }

    public updateUser(data: Partial<MockUserData>): MockUserData {
        this.userData = {
            ...this.userData,
            ...data,
            updatedAt: new Date().toISOString()
        };
        return { ...this.userData };
    }

    public resetUser(): void {
        this.userData = {
            id: "1",
            name: "Usuario Demo",
            email: "demo@finanzapp.com",
            monthlyBudget: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
}

export const mockDataStore = MockDataStore.getInstance();
