export interface IAnalysisService {
    analyzeUserFinances(userId: string): Promise<any>;
    getAnomalies(userId: string): Promise<any[]>;
    getProjections(userId: string): Promise<any>;
}

export interface IOpenAIService {
    generateResponse(userId: string, message: string, context?: any, tools?: any[]): Promise<any>;
    continueConversation(userId: string, messages: any[], tools?: any[]): Promise<any>;
    generateResponseStream(userId: string, message: string, context?: any, tools?: any[]): AsyncGenerator<string, void, unknown>;
}
