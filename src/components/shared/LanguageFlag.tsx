import { mergeClasses } from "@fluentui/react-components";
import { getLanguageByCode, useFlagStyles } from "./LanguageConfig";

export function LanguageFlag({ code, title, className }: { code: number; title?: string; className?: string }): JSX.Element {
    const styles = useFlagStyles();
    const ariaLabel = title ?? `Language ${code}`;
    const flagClassName = mergeClasses(styles.flag, className);
    const language = getLanguageByCode(code);

    if (!language) {
        return (
            <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                <rect width="40" height="30" fill="#e1dfdd" />
            </svg>
        );
    }

    return <img className={flagClassName} src={language.flagUrl} alt={ariaLabel} title={ariaLabel} role="img" aria-label={ariaLabel} />;
}
