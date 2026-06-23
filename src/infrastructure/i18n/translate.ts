import { translations, Locale } from "./translations";

/**
 * Get a translated message based on locale and dot-notated key
 * Example: t('en', 'errors.categoryAlreadyExists')
 */
export function t(locale: string | undefined, key: string): string {
    const lang = (locale === "es" || locale === "en" ? locale : "en") as Locale;

    const keys = key.split(".");
    let current: any = translations[lang];

    for (const k of keys) {
        if (current[k] === undefined) {
            // Fallback to English if key not found in current locale
            if (lang !== "en") {
                return t("en", key);
            }
            return key; // Return the key itself as a last resort
        }
        current = current[k];
    }

    return current;
}
