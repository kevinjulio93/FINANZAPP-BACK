export type Locale = "en" | "es";

export const translations = {
    en: {
        errors: {
            categoryAlreadyExists: "Category already exists",
            categoryNotFound: "Category not found",
            serviceNotFound: "Service not found",
            paymentNotFound: "Payment not found",
            creditNotFound: "Credit not found",
            unauthorized: "Unauthorized",
            forbidden: "Forbidden",
            unexpected: "An unexpected error occurred",
            invalidData: "Invalid data provided",
            userNotFound: "User not found",
            userAlreadyExists: "User already exists",
            invalidCredentials: "Invalid email or password",
            accountUsesGoogle: "This account uses Google Login. Please use Google to sign in.",
            emailInUse: "Email already in use",
            failedToUpdateUser: "Failed to update user",
            phoneNotConfigured: "Phone number not configured or user not found",
            invalidGoogleToken: "Invalid Google token",
            googleAuthFailed: "Google authentication failed",
            invalidCode: "Invalid verification code",
            requiredFields: "Missing required fields",
            noFileUploaded: "No file uploaded",
            uploadError: "Error uploading file",
            insufficientData: "Not enough data available",
            importInvalidData: "No valid rows found",
            importAnalysisError: "Error analyzing file",
            importConfirmError: "Error confirming import",
            invalidEntity: "Invalid entity",
            csvRequired: "CSV file required",
            exportError: "Error exporting data",
            importError: "Error importing data",
            comparisonError: "Error generating comparison",
            comparisonMinMonths: "At least 2 months are required to compare",
            chatMessageRequired: "Message is required",
            chatError: "Error in chat"
        },
        auth: {
            invalidCredentials: "Invalid email or password",
            tokenExpired: "Session expired",
        },
        categories: {
            deleted: "Category deleted successfully",
        },
        credits: {
            deleted: "Credit deleted successfully",
        },
        whatsapp: {
            verified: "WhatsApp verified successfully",
        }
    },
    es: {
        errors: {
            categoryAlreadyExists: "La categoría ya existe",
            categoryNotFound: "Categoría no encontrada",
            serviceNotFound: "Servicio no encontrado",
            paymentNotFound: "Pago no encontrado",
            creditNotFound: "Crédito no encontrado",
            unauthorized: "No autorizado",
            forbidden: "Prohibido",
            unexpected: "Ocurrió un error inesperado",
            invalidData: "Datos proporcionados no válidos",
            userNotFound: "Usuario no encontrado",
            userAlreadyExists: "El usuario ya existe",
            invalidCredentials: "Correo o contraseña inválidos",
            accountUsesGoogle: "Esta cuenta usa inicio de sesión con Google. Por favor, usa Google para ingresar.",
            emailInUse: "El correo electrónico ya está en uso",
            failedToUpdateUser: "Error al actualizar el usuario",
            phoneNotConfigured: "Número de teléfono no configurado o usuario no encontrado",
            invalidGoogleToken: "Token de Google no válido",
            googleAuthFailed: "Error en la autenticación con Google",
            invalidCode: "Código de verificación no válido",
            requiredFields: "Faltan campos obligatorios",
            noFileUploaded: "No se subió ningún archivo",
            uploadError: "Error al subir el archivo",
            insufficientData: "No hay datos suficientes",
            importInvalidData: "No se encontraron filas válidas",
            importAnalysisError: "Error al analizar el archivo",
            importConfirmError: "Error al confirmar la importación",
            invalidEntity: "Entidad inválida",
            csvRequired: "Archivo CSV requerido",
            exportError: "Error al exportar datos",
            importError: "Error al importar datos",
            comparisonError: "Error al generar la comparación",
            comparisonMinMonths: "Se requieren al menos 2 meses para comparar",
            chatMessageRequired: "El mensaje es requerido",
            chatError: "Error en el chat"
        },
        auth: {
            invalidCredentials: "Correo o contraseña inválidos",
            tokenExpired: "Sesión expirada",
        },
        categories: {
            deleted: "Categoría eliminada exitosamente",
        },
        credits: {
            deleted: "Crédito eliminado exitosamente",
        },
        whatsapp: {
            verified: "WhatsApp verificado exitosamente",
        }
    }
};

export type TranslationKeys = typeof translations.en;
