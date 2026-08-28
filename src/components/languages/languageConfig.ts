import { makeStyles, tokens } from "@fluentui/react-components";
import arabicFlagUrl from "flag-icons/flags/4x3/sa.svg?url";
import bulgarianFlagUrl from "flag-icons/flags/4x3/bg.svg?url";
import catalanFlagUrl from "flag-icons/flags/4x3/es-ct.svg?url";
import chineseTraditionalFlagUrl from "flag-icons/flags/4x3/tw.svg?url";
import czechFlagUrl from "flag-icons/flags/4x3/cz.svg?url";
import danishFlagUrl from "flag-icons/flags/4x3/dk.svg?url";
import germanFlagUrl from "flag-icons/flags/4x3/de.svg?url";
import greekFlagUrl from "flag-icons/flags/4x3/gr.svg?url";
import englishFlagUrl from "flag-icons/flags/4x3/us.svg?url";
import spanishFlagUrl from "flag-icons/flags/4x3/es.svg?url";
import finnishFlagUrl from "flag-icons/flags/4x3/fi.svg?url";
import frenchFlagUrl from "flag-icons/flags/4x3/fr.svg?url";
import hebrewFlagUrl from "flag-icons/flags/4x3/il.svg?url";
import hungarianFlagUrl from "flag-icons/flags/4x3/hu.svg?url";
import italianFlagUrl from "flag-icons/flags/4x3/it.svg?url";
import japaneseFlagUrl from "flag-icons/flags/4x3/jp.svg?url";
import koreanFlagUrl from "flag-icons/flags/4x3/kr.svg?url";
import dutchFlagUrl from "flag-icons/flags/4x3/nl.svg?url";
import norwegianFlagUrl from "flag-icons/flags/4x3/no.svg?url";
import polishFlagUrl from "flag-icons/flags/4x3/pl.svg?url";
import brazilianFlagUrl from "flag-icons/flags/4x3/br.svg?url";
import romanianFlagUrl from "flag-icons/flags/4x3/ro.svg?url";
import russianFlagUrl from "flag-icons/flags/4x3/ru.svg?url";
import croatianFlagUrl from "flag-icons/flags/4x3/hr.svg?url";
import slovakFlagUrl from "flag-icons/flags/4x3/sk.svg?url";
import swedishFlagUrl from "flag-icons/flags/4x3/se.svg?url";
import thaiFlagUrl from "flag-icons/flags/4x3/th.svg?url";
import turkishFlagUrl from "flag-icons/flags/4x3/tr.svg?url";
import indonesianFlagUrl from "flag-icons/flags/4x3/id.svg?url";
import ukrainianFlagUrl from "flag-icons/flags/4x3/ua.svg?url";
import slovenianFlagUrl from "flag-icons/flags/4x3/si.svg?url";
import estonianFlagUrl from "flag-icons/flags/4x3/ee.svg?url";
import latvianFlagUrl from "flag-icons/flags/4x3/lv.svg?url";
import lithuanianFlagUrl from "flag-icons/flags/4x3/lt.svg?url";
import vietnameseFlagUrl from "flag-icons/flags/4x3/vn.svg?url";
import hindiFlagUrl from "flag-icons/flags/4x3/in.svg?url";
import malayFlagUrl from "flag-icons/flags/4x3/my.svg?url";
import chineseSimplifiedFlagUrl from "flag-icons/flags/4x3/cn.svg?url";
import portuguesePortugalFlagUrl from "flag-icons/flags/4x3/pt.svg?url";

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

export const DEFAULT_LANGUAGE_CODE = 1033;
export const DEFAULT_SORT_LANGUAGES_BY_CODE = false;
export const DEFAULT_VISIBLE_LANGUAGE_CODES: number[] = [1033, 1036, 1031];

export interface LanguageConfig {
    code: number;
    name: string;
    emoji: string;
    flagUrl: string;
}

export const LANGUAGE_CONFIGS: LanguageConfig[] = [
    { code: 1025, name: "Arabic", emoji: "🇸🇦", flagUrl: arabicFlagUrl },
    { code: 1026, name: "Bulgarian", emoji: "🇧🇬", flagUrl: bulgarianFlagUrl },
    { code: 1027, name: "Catalan", emoji: "🏳", flagUrl: catalanFlagUrl },
    { code: 1028, name: "Chinese (Traditional)", emoji: "🇹🇼", flagUrl: chineseTraditionalFlagUrl },
    { code: 1029, name: "Czech", emoji: "🇨🇿", flagUrl: czechFlagUrl },
    { code: 1030, name: "Danish", emoji: "🇩🇰", flagUrl: danishFlagUrl },
    { code: 1031, name: "German", emoji: "🇩🇪", flagUrl: germanFlagUrl },
    { code: 1032, name: "Greek", emoji: "🇬🇷", flagUrl: greekFlagUrl },
    { code: 1033, name: "English", emoji: "🇺🇸", flagUrl: englishFlagUrl },
    { code: 1034, name: "Spanish", emoji: "🇪🇸", flagUrl: spanishFlagUrl },
    { code: 1035, name: "Finnish", emoji: "🇫🇮", flagUrl: finnishFlagUrl },
    { code: 1036, name: "French", emoji: "🇫🇷", flagUrl: frenchFlagUrl },
    { code: 1037, name: "Hebrew", emoji: "🇮🇱", flagUrl: hebrewFlagUrl },
    { code: 1038, name: "Hungarian", emoji: "🇭🇺", flagUrl: hungarianFlagUrl },
    { code: 1040, name: "Italian", emoji: "🇮🇹", flagUrl: italianFlagUrl },
    { code: 1041, name: "Japanese", emoji: "🇯🇵", flagUrl: japaneseFlagUrl },
    { code: 1042, name: "Korean", emoji: "🇰🇷", flagUrl: koreanFlagUrl },
    { code: 1043, name: "Dutch", emoji: "🇳🇱", flagUrl: dutchFlagUrl },
    { code: 1044, name: "Norwegian", emoji: "🇳🇴", flagUrl: norwegianFlagUrl },
    { code: 1045, name: "Polish", emoji: "🇵🇱", flagUrl: polishFlagUrl },
    { code: 1046, name: "Portuguese (Brazil)", emoji: "🇧🇷", flagUrl: brazilianFlagUrl },
    { code: 1048, name: "Romanian", emoji: "🇷🇴", flagUrl: romanianFlagUrl },
    { code: 1049, name: "Russian", emoji: "🇷🇺", flagUrl: russianFlagUrl },
    { code: 1050, name: "Croatian", emoji: "🇭🇷", flagUrl: croatianFlagUrl },
    { code: 1051, name: "Slovak", emoji: "🇸🇰", flagUrl: slovakFlagUrl },
    { code: 1053, name: "Swedish", emoji: "🇸🇪", flagUrl: swedishFlagUrl },
    { code: 1054, name: "Thai", emoji: "🇹🇭", flagUrl: thaiFlagUrl },
    { code: 1055, name: "Turkish", emoji: "🇹🇷", flagUrl: turkishFlagUrl },
    { code: 1057, name: "Indonesian", emoji: "🇮🇩", flagUrl: indonesianFlagUrl },
    { code: 1058, name: "Ukrainian", emoji: "🇺🇦", flagUrl: ukrainianFlagUrl },
    { code: 1060, name: "Slovenian", emoji: "🇸🇮", flagUrl: slovenianFlagUrl },
    { code: 1061, name: "Estonian", emoji: "🇪🇪", flagUrl: estonianFlagUrl },
    { code: 1062, name: "Latvian", emoji: "🇱🇻", flagUrl: latvianFlagUrl },
    { code: 1063, name: "Lithuanian", emoji: "🇱🇹", flagUrl: lithuanianFlagUrl },
    { code: 1066, name: "Vietnamese", emoji: "🇻🇳", flagUrl: vietnameseFlagUrl },
    { code: 1081, name: "Hindi", emoji: "🇮🇳", flagUrl: hindiFlagUrl },
    { code: 1086, name: "Malay", emoji: "🇲🇾", flagUrl: malayFlagUrl },
    { code: 2052, name: "Chinese (Simplified)", emoji: "🇨🇳", flagUrl: chineseSimplifiedFlagUrl },
    { code: 2070, name: "Portuguese (Portugal)", emoji: "🇵🇹", flagUrl: portuguesePortugalFlagUrl },
    { code: 3082, name: "Spanish (Spain)", emoji: "🇪🇸", flagUrl: spanishFlagUrl },
];

export function getLanguageByCode(code: number): LanguageConfig | undefined {
    return LANGUAGE_CONFIGS.find((lang) => lang.code === code);
}
