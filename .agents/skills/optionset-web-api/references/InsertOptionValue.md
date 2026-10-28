# InsertOptionValue

Inserts a new option value into a global or local option set.

**Endpoint:** `POST [org]/api/data/v9.2/InsertOptionValue`  
**Namespace:** `Microsoft.Dynamics.CRM`  
**Reference:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/insertoptionvalue

---

## Request Body Examples

### Global option set

```json
{
  "OptionSetName": "new_priority",
  "Value": 989220003,
  "Label": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Critical",
        "LanguageCode": 1033
      },
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Kritisch",
        "LanguageCode": 1031
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Critical",
      "LanguageCode": 1033
    }
  },
  "Description": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Highest priority level",
        "LanguageCode": 1033
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Highest priority level",
      "LanguageCode": 1033
    }
  },
  "MergeLabels": false,
  "SolutionUniqueName": "MyCustomSolution"
}
```

### Local option set (attribute-scoped)

```json
{
  "EntityLogicalName": "contact",
  "AttributeLogicalName": "new_contactstatus",
  "Value": 989220002,
  "Label": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Pending Review",
        "LanguageCode": 1033
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Pending Review",
      "LanguageCode": 1033
    }
  },
  "MergeLabels": false
}
```

---

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `OptionSetName` | `Edm.String` | Conditional | Name of the global option set. Required when targeting a global option set; omit for local. |
| `EntityLogicalName` | `Edm.String` | Conditional | Logical name of the entity. Required together with `AttributeLogicalName` when targeting a local option set. |
| `AttributeLogicalName` | `Edm.String` | Conditional | Logical name of the picklist attribute. Required together with `EntityLogicalName` when targeting a local option set. |
| `Value` | `Edm.Int32` | No (auto-assigned if omitted) | Integer value for the new option. Publisher-prefixed values (e.g. `989220000`) are recommended. |
| `Label` | `Label` | Yes | Localized display label(s) for the new option. Must include at least one `LocalizedLabel` with `LanguageCode` 1033. |
| `Description` | `Label` | No | Localized description(s) for the option. Same structure as `Label`. |
| `MergeLabels` | `Edm.Boolean` | No | When `true`, preserves existing labels for languages not included in `Label`. Defaults to `false`. |
| `Color` | `Edm.String` | No | Hexadecimal color string (e.g. `#FF0000`) assigned to the option. |
| `ExternalValue` | `Edm.String` | No | The option value as it exists in an external source. |
| `IsHidden` | `Edm.Boolean` | No | Whether the option is hidden from the UI. |
| `SolutionUniqueName` | `Edm.String` | No | Unique name of the unmanaged solution to associate this change with. |
| `ParentValues` | `Collection(Edm.Int32)` | No | Parent values for the option (used with dependent option sets). |

---

## Response

Returns an `InsertOptionValueResponse` containing the `NewOptionValue` (`Edm.Int32`) — the value assigned to the newly inserted option (useful when `Value` was not specified in the request).

```json
{
  "@odata.context": "...$metadata#Microsoft.Dynamics.CRM.InsertOptionValueResponse",
  "NewOptionValue": 989220003
}
```
