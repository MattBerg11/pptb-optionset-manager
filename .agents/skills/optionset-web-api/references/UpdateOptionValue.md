# UpdateOptionValue

Updates an existing option value in a global or local option set.

**Endpoint:** `POST [org]/api/data/v9.2/UpdateOptionValue`  
**Namespace:** `Microsoft.Dynamics.CRM`  
**Reference:** `https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/updateoptionvalue`

---

## Request Body Examples

### Update label on a global option set (multi-language)

```json
{
  "OptionSetName": "new_priority",
  "Value": 989220003,
  "Label": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Critical (Updated)",
        "LanguageCode": 1033
      },
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Kritisch (Aktualisiert)",
        "LanguageCode": 1031
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Critical (Updated)",
      "LanguageCode": 1033
    }
  },
  "Description": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Highest priority level - revised definition",
        "LanguageCode": 1033
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Highest priority level - revised definition",
      "LanguageCode": 1033
    }
  },
  "MergeLabels": true,
  "SolutionUniqueName": "MyCustomSolution"
}
```

### Update label on a local option set

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
        "Label": "Under Review",
        "LanguageCode": 1033
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Under Review",
      "LanguageCode": 1033
    }
  },
  "MergeLabels": true
}
```

---

## Parameters

| Parameter | Type | Required | Description |
| --- |---|---|---|
| `OptionSetName` | `Edm.String` | Conditional | Name of the global option set. Required when targeting a global option set; omit for local. |
| `EntityLogicalName` | `Edm.String` | Conditional | Logical name of the entity. Required together with `AttributeLogicalName` when targeting a local option set. |
| `AttributeLogicalName` | `Edm.String` | Conditional | Logical name of the picklist attribute. Required together with `EntityLogicalName` when targeting a local option set. |
| `Value` | `Edm.Int32` | Yes | The integer value of the option to update. |
| `Label` | `Label` | No | New localized label(s) for the option. If omitted, the existing label is unchanged. |
| `Description` | `Label` | No | New localized description(s) for the option. If omitted, the existing description is unchanged. |
| `MergeLabels` | `Edm.Boolean` | Yes | When `true`, retains existing labels for languages not included in `Label`. Set to `true` to avoid unintentionally clearing other-language labels. |
| `Color` | `Edm.String` | No | Hexadecimal color string (e.g. `#0078D4`) to assign to the option. |
| `ExternalValue` | `Edm.String` | No | The option value as it exists in an external source. |
| `IsHidden` | `Edm.Boolean` | No | Whether the option is hidden from the UI. |
| `SolutionUniqueName` | `Edm.String` | No | Unique name of the unmanaged solution to associate this change with. |
| `ParentValues` | `Collection(Edm.Int32)` | No | Parent values for the option (used with dependent option sets). |

---

## Response

This action returns no response body on success (`204 No Content`).
