# RetrieveAvailableLanguages

Retrieves the list of language packs that are installed and enabled on the Dataverse environment. Used to determine which `LanguageCode` values are valid when building multi-language labels.

**Endpoint:** `GET [org]/api/data/v9.2/RetrieveAvailableLanguages`  
**Method:** `GET`  
**Namespace:** `Microsoft.Dynamics.CRM`  
**Reference:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/retrieveavailablelanguages

---

## Request

This function takes no parameters. Send a plain GET request.

```http
GET [org]/api/data/v9.2/RetrieveAvailableLanguages
Accept: application/json
OData-MaxVersion: 4.0
OData-Version: 4.0
```

---

## Request Body Example

No request body. This is a GET function.

```json
{}
```

---

## Parameters

This function has no input parameters.

| Parameter | Type | Required | Description |
|---|---|---|---|
| *(none)* | — | — | This function accepts no parameters. |

---

## Response

Returns a `RetrieveAvailableLanguagesResponse` containing an array of installed language codes.

```json
{
  "@odata.context": "[org]/api/data/v9.2/$metadata#Microsoft.Dynamics.CRM.RetrieveAvailableLanguagesResponse",
  "LocaleIds": [
    1033,
    1031,
    1036,
    3082
  ]
}
```

### Response fields

| Field | Type | Description |
|---|---|---|
| `LocaleIds` | `int[]` | Array of LCID (Locale ID) integers for each installed and enabled language pack. |

### Common language codes

| LCID | Language |
|---|---|
| `1033` | English (United States) |
| `1031` | German (Germany) |
| `1036` | French (France) |
| `3082` | Spanish (Spain) |
| `1041` | Japanese (Japan) |
| `2052` | Chinese (Simplified, PRC) |
| `1046` | Portuguese (Brazil) |
| `1049` | Russian (Russia) |

> **Usage:** Call this endpoint on load to populate the language selector. Always include language 1033 (English) as the base language in all `Label` objects — it is required by Dataverse even if 1033 is not the organization's base language.
