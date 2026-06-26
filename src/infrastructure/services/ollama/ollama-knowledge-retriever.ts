import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

interface KnowledgeDoc {
    title: string;
    content: string;
}

export class OllamaKnowledgeRetriever {
    private docs: KnowledgeDoc[] = [];

    constructor() {
        this.loadDocs();
    }

    private loadDocs(): void {
        const dir = join(__dirname, 'knowledge');
        try {
            const files = readdirSync(dir).filter(f => f.endsWith('.md'));
            for (const file of files) {
                const content = readFileSync(join(dir, file), 'utf-8');
                const title = file.replace('.md', '');
                this.docs.push({ title, content });
            }
        } catch {
            console.warn('[Ollama] No knowledge base directory found at', dir);
        }
    }

    retrieve(query: string, maxDocs: number = 2): string {
        const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 2);

        const scored = this.docs.map(doc => {
            const lower = doc.content.toLowerCase();
            const score = keywords.filter(k => lower.includes(k)).length;
            return { ...doc, score };
        });

        const relevant = scored
            .filter(d => d.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, maxDocs);

        if (relevant.length === 0) return '';

        return relevant.map(d =>
            `--- ${d.title} ---\n${d.content}`
        ).join('\n\n');
    }
}
