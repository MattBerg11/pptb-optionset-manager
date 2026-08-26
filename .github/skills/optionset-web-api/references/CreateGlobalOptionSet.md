# CreateGlobalOptionSet

Creates a new global option set (Choice) definition in Dataverse.

**Endpoint:** `POST [org]/api/data/v9.2/GlobalOptionSetDefinitions`  
**Method:** `POST`  
**Reference:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/optionsetmetadata

---

## Request Headers

| Header | Value | Required | Description |
|---|---|---|---|
| `Content-Type` | `application/json` | Yes | Must be `application/json`. |
| `OData-MaxVersion` | `4.0` | Yes | Required OData version header. |
| `OData-Version` | `4.0` | Yes | Required OData version header. |
| `MSCRM.SolutionUniqueName` | `MyCustomSolution` | No | Associates the new option set with an unmanaged solution. |

---

## Request Body Example

### Minimal (English only)

```json
{
  "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
  "Name": "new_priority",
  "DisplayName": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Priority",
        "LanguageCode": 1033
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Priority",
      "LanguageCode": 1033
    }
  },
  "OptionSetType": "Picklist",
  "IsGlobal": true
}
```

### Full (with options and multi-language labels)

```json
{
  "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
  "Name": "new_priority",
  "DisplayName": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Priority",
        "LanguageCode": 1033
      },
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Priorität",
        "LanguageCode": 1031
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Priority",
      "LanguageCode": 1033
    }
  },
  "Description": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Indicates the urgency level of a record.",
        "LanguageCode": 1033
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Indicates the urgency level of a record.",
      "LanguageCode": 1033
    }
  },
  "OptionSetType": "Picklist",
  "IsGlobal": true,
  "Options": [
    {
      "@odata.type": "Microsoft.Dynamics.CRM.OptionMetadata",
      "Value": 989220000,
      "Label": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Low",
            "LanguageCode": 1033
          },
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Niedrig",
            "LanguageCode": 1031
          }
        ],
        "UserLocalizedLabel": {
          "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
          "Label": "Low",
          "LanguageCode": 1033
        }
      }
    },
    {
      "@odata.type": "Microsoft.Dynamics.CRM.OptionMetadata",
      "Value": 989220001,
      "Label": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Medium",
            "LanguageCode": 1033
          },
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Mittel",
            "LanguageCode": 1031
          }
        ],
        "UserLocalizedLabel": {
          "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
          "Label": "Medium",
          "LanguageCode": 1033
        }
      }
    },
    {
      "@odata.type": "Microsoft.Dynamics.CRM.OptionMetadata",
      "Value": 989220002,
      "Label": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "High",
            "LanguageCode": 1033
          },
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Hoch",
            "LanguageCode": 1031
          }
        ],
        "UserLocalizedLabel": {
          "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
          "Label": "High",
          "LanguageCode": 1033
        }
      }
    }
  ]
}
```

---

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `@odata.type` | `string` | Yes | Must be `"Microsoft.Dynamics.CRM.OptionSetMetadata"` to identify the metadata type. |
| `Name` | `string` | Yes | Unique schema name for the option set. Must include the publisher prefix (e.g. `new_priority`). |
| `DisplayName` | `Label` | Yes | Localized display name shown in the UI. Must include at least one `LocalizedLabel` for language 1033. |
| `Description` | `Label` | No | Localized description of the option set's purpose. |
| `OptionSetType` | `string` | Yes | Must be `"Picklist"` for standard choice fields. |
| `IsGlobal` | `bool` | Yes | Must be `true` when creating a global (reusable) option set. |
| `Options` | `OptionMetadata[]` | No | Initial set of options to create with the option set. Each entry requires `Value` and `Label`. Options can also be added later via `InsertOptionValue`. |
| `MSCRM.SolutionUniqueName` *(header)* | `string` | No | Request header. Associates the new option set with the specified unmanaged solution. |

---

## Response

Returns `201 Created` with the URI of the new option set definition in the `OData-EntityId` response header.

```
OData-EntityId: [org]/api/data/v9.2/GlobalOptionSetDefinitions(xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
```
