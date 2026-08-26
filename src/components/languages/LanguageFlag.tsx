import { mergeClasses } from "@fluentui/react-components";
import { useFlagStyles } from "./languageConfig";

export function LanguageFlag({ code, title, className: className }: { code: number; title?: string; className?: string }): JSX.Element {
    const styles = useFlagStyles();
    const ariaLabel = title ?? `Language ${code}`;
    const flagClassName = mergeClasses(styles.flag, className);

    switch (code) {
        case 1033:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#b22234" />
                    {Array.from({ length: 7 }).map((_, index) => (
                        <rect key={index} y={index * 4.2857} width="40" height="2.1429" fill="#fff" />
                    ))}
                    <rect width="16" height="14.999" fill="#3c3b6e" />
                    <circle cx="2.2" cy="2.1" r="0.45" fill="#fff" />
                    <circle cx="4.9" cy="2.1" r="0.45" fill="#fff" />
                    <circle cx="7.6" cy="2.1" r="0.45" fill="#fff" />
                    <circle cx="3.55" cy="4.2" r="0.45" fill="#fff" />
                    <circle cx="6.25" cy="4.2" r="0.45" fill="#fff" />
                    <circle cx="9.0" cy="4.2" r="0.45" fill="#fff" />
                    <circle cx="2.2" cy="6.3" r="0.45" fill="#fff" />
                    <circle cx="4.9" cy="6.3" r="0.45" fill="#fff" />
                    <circle cx="7.6" cy="6.3" r="0.45" fill="#fff" />
                </svg>
            );
        case 1036:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="13.333" height="30" fill="#0055a4" />
                    <rect x="13.333" width="13.334" height="30" fill="#fff" />
                    <rect x="26.667" width="13.333" height="30" fill="#ef4135" />
                </svg>
            );
        case 1031:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="10" fill="#000" />
                    <rect y="10" width="40" height="10" fill="#dd0000" />
                    <rect y="20" width="40" height="10" fill="#ffce00" />
                </svg>
            );
        case 1034:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#c60b1e" />
                    <rect y="7.5" width="40" height="15" fill="#ffc400" />
                    <rect x="8" y="9" width="4" height="12" fill="#c60b1e" opacity="0.95" />
                    <rect x="6" y="11" width="8" height="2" fill="#c60b1e" opacity="0.95" />
                    <rect x="6" y="15" width="8" height="2" fill="#c60b1e" opacity="0.95" />
                </svg>
            );
        case 1040:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="13.333" height="30" fill="#009246" />
                    <rect x="13.333" width="13.334" height="30" fill="#fff" />
                    <rect x="26.667" width="13.333" height="30" fill="#ce2b37" />
                </svg>
            );
        case 1043:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="10" fill="#ae1c28" />
                    <rect y="10" width="40" height="10" fill="#fff" />
                    <rect y="20" width="40" height="10" fill="#21468b" />
                </svg>
            );
        case 1046:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#009c3b" />
                    <path d="M20 4 L35 15 L20 26 L5 15 Z" fill="#ffdf00" />
                    <circle cx="20" cy="15" r="5.6" fill="#002776" />
                </svg>
            );
        case 1041:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#fff" />
                    <circle cx="20" cy="15" r="8.5" fill="#bc002d" />
                </svg>
            );
        case 2052:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#de2910" />
                    <polygon points="7,6 9,11 14,11 10,14 12,19 7,16 2,19 4,14 0,11 5,11" fill="#ffde00" />
                    <polygon points="18,4 19,7 22,7 19.5,8.9 20.5,12 18,10.3 15.5,12 16.5,8.9 14,7 17,7" fill="#ffde00" />
                </svg>
            );
        case 1042:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#fff" />
                    <g transform="translate(20 15)">
                        <circle cx="0" cy="0" r="7" fill="#c60c30" />
                        <path d="M0 0m0-7a7 7 0 0 1 0 14a3.5 3.5 0 0 0 0-7a3.5 3.5 0 0 1 0-7z" fill="#003478" />
                    </g>
                    <path d="M6 7 L9 7 L9 5 L11 5 L11 7 L14 7 L14 9 L11 9 L11 11 L9 11 L9 9 L6 9 Z" fill="#000" opacity="0.9" />
                    <path d="M26 7 L29 7 L29 5 L31 5 L31 7 L34 7 L34 9 L31 9 L31 11 L29 11 L29 9 L26 9 Z" fill="#000" opacity="0.9" />
                    <path d="M6 21 L9 21 L9 19 L11 19 L11 21 L14 21 L14 23 L11 23 L11 25 L9 25 L9 23 L6 23 Z" fill="#000" opacity="0.9" />
                    <path d="M26 21 L29 21 L29 19 L31 19 L31 21 L34 21 L34 23 L31 23 L31 25 L29 25 L29 23 L26 23 Z" fill="#000" opacity="0.9" />
                </svg>
            );
        case 1025:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#006c35" />
                    <text x="20" y="19" textAnchor="middle" fill="#fff" fontSize="8" fontFamily="serif">
                        ☪
                    </text>
                </svg>
            );
        case 1026:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="10" fill="#fff" />
                    <rect y="10" width="40" height="10" fill="#00966e" />
                    <rect y="20" width="40" height="10" fill="#d62612" />
                </svg>
            );
        case 1027:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#fcdd09" />
                    {[0, 1, 2, 3].map((i) => (
                        <rect key={i} y={i * 7.5} width="40" height="3.5" fill="#da121a" />
                    ))}
                </svg>
            );
        case 1028:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#fe0000" />
                    <rect width="20" height="15" fill="#000095" />
                    <circle cx="10" cy="7.5" r="4" fill="#fff" />
                </svg>
            );
        case 1029:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="15" fill="#fff" />
                    <rect y="15" width="40" height="15" fill="#d7141a" />
                    <path d="M0 0 L18 15 L0 30 Z" fill="#fff" />
                </svg>
            );
        case 1030:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#c60c30" />
                    <rect x="12" width="5" height="30" fill="#fff" />
                    <rect y="12.5" width="40" height="5" fill="#fff" />
                </svg>
            );
        case 1032:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    {[0, 1, 2, 3, 4].map((i) => (
                        <rect key={i} y={i * 6} width="40" height="3" fill={i % 2 === 0 ? "#0d5eaf" : "#fff"} />
                    ))}
                    <rect width="40" height="30" fillOpacity="0" />
                    <rect width="16" height="16" fill="#0d5eaf" />
                    <rect x="5.5" y="0" width="5" height="16" fill="#fff" />
                    <rect x="0" y="5.5" width="16" height="5" fill="#fff" />
                </svg>
            );
        case 1035:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#fff" />
                    <rect x="11" width="6" height="30" fill="#003580" />
                    <rect y="12" width="40" height="6" fill="#003580" />
                </svg>
            );
        case 1037:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#fff" />
                    <rect y="4" width="40" height="4" fill="#0038b8" />
                    <rect y="22" width="40" height="4" fill="#0038b8" />
                    <text x="20" y="18" textAnchor="middle" fill="#0038b8" fontSize="10">
                        ✡
                    </text>
                </svg>
            );
        case 1038:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="10" fill="#ce2939" />
                    <rect y="10" width="40" height="10" fill="#fff" />
                    <rect y="20" width="40" height="10" fill="#477050" />
                </svg>
            );
        case 1044:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#ef2b2d" />
                    <rect x="10" width="5" height="30" fill="#fff" />
                    <rect y="12.5" width="40" height="5" fill="#fff" />
                    <rect x="11" width="3" height="30" fill="#002868" />
                    <rect y="13.5" width="40" height="3" fill="#002868" />
                </svg>
            );
        case 1045:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="15" fill="#fff" />
                    <rect y="15" width="40" height="15" fill="#dc143c" />
                </svg>
            );
        case 1048:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="13.333" height="30" fill="#002b7f" />
                    <rect x="13.333" width="13.334" height="30" fill="#fcd116" />
                    <rect x="26.667" width="13.333" height="30" fill="#ce1126" />
                </svg>
            );
        case 1049:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="10" fill="#fff" />
                    <rect y="10" width="40" height="10" fill="#0039a6" />
                    <rect y="20" width="40" height="10" fill="#d52b1e" />
                </svg>
            );
        case 1050:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="10" fill="#ff0000" />
                    <rect y="10" width="40" height="10" fill="#fff" />
                    <rect y="20" width="40" height="10" fill="#171796" />
                </svg>
            );
        case 1051:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="10" fill="#fff" />
                    <rect y="10" width="40" height="10" fill="#0b4ea2" />
                    <rect y="20" width="40" height="10" fill="#ee1c25" />
                </svg>
            );
        case 1053:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#006aa7" />
                    <rect x="13" width="6" height="30" fill="#fecc02" />
                    <rect y="12" width="40" height="6" fill="#fecc02" />
                </svg>
            );
        case 1054:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#fff" />
                    <rect y="4" width="40" height="4" fill="#a51931" />
                    <rect y="5" width="40" height="4" fill="#f4f5f8" />
                    <rect y="9" width="40" height="12" fill="#2d2a4a" />
                    <rect y="21" width="40" height="4" fill="#f4f5f8" />
                    <rect y="25" width="40" height="5" fill="#a51931" />
                </svg>
            );
        case 1055:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#e30a17" />
                    <circle cx="16" cy="15" r="7" fill="#fff" />
                    <circle cx="18.5" cy="15" r="5.5" fill="#e30a17" />
                    <text x="26" y="19" textAnchor="middle" fill="#fff" fontSize="8">
                        ★
                    </text>
                </svg>
            );
        case 1057:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="15" fill="#ce1126" />
                    <rect y="15" width="40" height="15" fill="#fff" />
                </svg>
            );
        case 1058:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="15" fill="#005bbb" />
                    <rect y="15" width="40" height="15" fill="#ffd500" />
                </svg>
            );
        case 1060:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="10" fill="#fff" />
                    <rect y="10" width="40" height="10" fill="#003da5" />
                    <rect y="20" width="40" height="10" fill="#e40026" />
                </svg>
            );
        case 1061:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="10" fill="#0072ce" />
                    <rect y="10" width="40" height="10" fill="#000" />
                    <rect y="20" width="40" height="10" fill="#fff" />
                </svg>
            );
        case 1062:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="11" fill="#9e3039" />
                    <rect y="11" width="40" height="8" fill="#fff" />
                    <rect y="19" width="40" height="11" fill="#9e3039" />
                </svg>
            );
        case 1063:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="10" fill="#fdb913" />
                    <rect y="10" width="40" height="10" fill="#006a44" />
                    <rect y="20" width="40" height="10" fill="#c1272d" />
                </svg>
            );
        case 1066:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#da251d" />
                    <text x="20" y="20" textAnchor="middle" fill="#ffff00" fontSize="16">
                        ★
                    </text>
                </svg>
            );
        case 1081:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="10" fill="#ff9933" />
                    <rect y="10" width="40" height="10" fill="#fff" />
                    <rect y="20" width="40" height="10" fill="#138808" />
                    <circle cx="20" cy="15" r="3.5" fill="#000080" />
                </svg>
            );
        case 1086:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#cc0001" />
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                        <rect key={i} y={i * 4.28} width="40" height="2.14" fill="#fff" />
                    ))}
                    <rect width="20" height="15" fill="#010066" />
                    <circle cx="9" cy="7.5" r="4" fill="#fc0" />
                    <circle cx="10.5" cy="7.5" r="3" fill="#010066" />
                </svg>
            );
        case 2070:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="16" height="30" fill="#006600" />
                    <rect x="16" width="24" height="30" fill="#ff0000" />
                </svg>
            );
        case 3082:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#c60b1e" />
                    <rect y="7.5" width="40" height="15" fill="#ffc400" />
                </svg>
            );
        default:
            return (
                <svg className={flagClassName} viewBox="0 0 40 30" role="img" aria-label={ariaLabel}>
                    <rect width="40" height="30" fill="#e1dfdd" />
                </svg>
            );
    }
}
