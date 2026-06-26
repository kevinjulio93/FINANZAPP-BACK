const BLOCKED_PATTERNS = [
    /genera (código|codigo|un script|una función|una clase|un programa)/i,
    /escribe (código|codigo|un programa|una app|una función)/i,
    /crea (código|codigo|un script|una función|una clase|un programa)/i,
    /código (para|de|en) (python|javascript|typescript|java|go|rust|php|ruby|c\+\+|c#)/i,
    /código (para|de|en) (react|node|express|next|django|flask|spring)/i,
    /haz un (script|programa|algoritmo|api|bot|web)/i,
    /explícame (cómo funciona|como funciona) (el código|la función|la clase)/i,
    /dame (un ejemplo|ejemplos) de código/i,
    /traduce este código/i,
    /refactoriza (este|el) código/i,
    /optimiza (este|el) código/i,
    /depura (este|el) código/i,
    /encuentra (bugs|errores) en (este|el) código/i,
    /cómo (harías|implementarías|crearías) (un|una) (sistema|api|función|clase)/i,
    /enséñame (a programar|código|a hacer un)/i,
];

const OFF_TOPIC_PATTERNS = [
    /¿qué (piensas|opinas) (de|sobre|acerca)/i,
    /cuéntame un (chiste|poema|historia|cuento)/i,
    /háblame de (política|religión|deportes|salud|medicina|actualidad)/i,
    /recomiéndame (una película|un libro|una serie|un restaurante|un lugar)/i,
    /¿cuál es el (sentido|propósito) de la vida/i,
    /¿cómo (estás|te sientes|has estado)/i,
    /¿qué (tiempo|clima) (hace|hará)/i,
    /noticias (de|del|sobre) (hoy|actualidad|últimas)/i,
    /receta (de|para) (cocina|comida|postre)/i,
    /¿me (puedes|podrías) (ayudar|decir) (con|sobre) (mi tarea|mi trabajo|mi proyecto)/i,
];

const BLOCKED_RESPONSE = "⚠️ Solo puedo ayudarte con temas relacionados a tus finanzas personales en FinanzApp. Pregúntame sobre tus gastos, ingresos, servicios, dashboard o cualquier cosa de tu aplicación financiera. 😊";

export class OllamaMessageFilter {
    filter(message: string): { blocked: boolean; response?: string } {
        for (const pattern of BLOCKED_PATTERNS) {
            if (pattern.test(message)) {
                return { blocked: true, response: BLOCKED_RESPONSE };
            }
        }

        for (const pattern of OFF_TOPIC_PATTERNS) {
            if (pattern.test(message)) {
                return { blocked: true, response: BLOCKED_RESPONSE };
            }
        }

        return { blocked: false };
    }
}
