import { makeStyles, tokens } from "@fluentui/react-components";

export const useFlagStyles = makeStyles({
    optionContent: {
        display: "inline-flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
    optionFlag: {
        width: "28px",
        height: "21px",
        flexShrink: 0,
        borderRadius: tokens.borderRadiusSmall,
        boxShadow: `inset 0 0 0 1px ${tokens.colorNeutralStroke1}`,
    },
    flag: {
        width: "28px",
        height: "21px",
        flexShrink: 0,
        borderRadius: tokens.borderRadiusSmall,
        boxShadow: `inset 0 0 0 1px ${tokens.colorNeutralStroke1}`,
    },
});

export interface LanguageConfig {
    code: number;
    name: string;
    emoji: string;
}

export const LANGUAGE_CONFIGS: LanguageConfig[] = [
    { code: 1025, name: "Arabic", emoji: "🇸🇦" },
    { code: 1026, name: "Bulgarian", emoji: "🇧🇬" },
    { code: 1027, name: "Catalan", emoji: "🏳" },
    { code: 1028, name: "Chinese (Traditional)", emoji: "🇹🇼" },
    { code: 1029, name: "Czech", emoji: "🇨🇿" },
    { code: 1030, name: "Danish", emoji: "🇩🇰" },
    { code: 1031, name: "German", emoji: "🇩🇪" },
    { code: 1032, name: "Greek", emoji: "🇬🇷" },
    { code: 1033, name: "English", emoji: "🇺🇸" },
    { code: 1034, name: "Spanish", emoji: "🇪🇸" },
    { code: 1035, name: "Finnish", emoji: "🇫🇮" },
    { code: 1036, name: "French", emoji: "🇫🇷" },
    { code: 1037, name: "Hebrew", emoji: "🇮🇱" },
    { code: 1038, name: "Hungarian", emoji: "🇭🇺" },
    { code: 1040, name: "Italian", emoji: "🇮🇹" },
    { code: 1041, name: "Japanese", emoji: "🇯🇵" },
    { code: 1042, name: "Korean", emoji: "🇰🇷" },
    { code: 1043, name: "Dutch", emoji: "🇳🇱" },
    { code: 1044, name: "Norwegian", emoji: "🇳🇴" },
    { code: 1045, name: "Polish", emoji: "🇵🇱" },
    { code: 1046, name: "Portuguese (Brazil)", emoji: "🇧🇷" },
    { code: 1048, name: "Romanian", emoji: "🇷🇴" },
    { code: 1049, name: "Russian", emoji: "🇷🇺" },
    { code: 1050, name: "Croatian", emoji: "🇭🇷" },
    { code: 1051, name: "Slovak", emoji: "🇸🇰" },
    { code: 1053, name: "Swedish", emoji: "🇸🇪" },
    { code: 1054, name: "Thai", emoji: "🇹🇭" },
    { code: 1055, name: "Turkish", emoji: "🇹🇷" },
    { code: 1057, name: "Indonesian", emoji: "🇮🇩" },
    { code: 1058, name: "Ukrainian", emoji: "🇺🇦" },
    { code: 1060, name: "Slovenian", emoji: "🇸🇮" },
    { code: 1061, name: "Estonian", emoji: "🇪🇪" },
    { code: 1062, name: "Latvian", emoji: "🇱🇻" },
    { code: 1063, name: "Lithuanian", emoji: "🇱🇹" },
    { code: 1066, name: "Vietnamese", emoji: "🇻🇳" },
    { code: 1081, name: "Hindi", emoji: "🇮🇳" },
    { code: 1086, name: "Malay", emoji: "🇲🇾" },
    { code: 2052, name: "Chinese (Simplified)", emoji: "🇨🇳" },
    { code: 2070, name: "Portuguese (Portugal)", emoji: "🇵🇹" },
    { code: 3082, name: "Spanish (Spain)", emoji: "🇪🇸" },
];

export function getLanguageByCode(code: number): LanguageConfig | undefined {
    return LANGUAGE_CONFIGS.find((lang) => lang.code === code);
}
