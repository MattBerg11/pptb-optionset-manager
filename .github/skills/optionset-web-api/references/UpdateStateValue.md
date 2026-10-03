# UpdateStateValue

Updates an option value in the state choice used by a `Status` column.

**Endpoint:** `POST [org]/api/data/v9.2/UpdateStateValue`  
**Namespace:** `Microsoft.Dynamics.CRM`  
**Reference:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/updatestatevalue

---

## Request Body Example

```json
{
    "EntityLogicalName": "sample_bankaccount",
    "AttributeLogicalName": "statecode",
    "Value": 1,
    "Label": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
            {
                "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                "Label": "Dormant",
                "LanguageCode": 1033
            }
        ],
        "UserLocalizedLabel": {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Dormant",
            "LanguageCode": 1033
        }
    },
    "Description": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
            {
                "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                "Label": "The account is currently dormant.",
                "LanguageCode": 1033
            }
        ],
        "UserLocalizedLabel": {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "The account is currently dormant.",
            "LanguageCode": 1033
        }
    },
    "MergeLabels": true,
    "DefaultStatusCode": 2
}
```

---

## Parameters

| Parameter              | Type          | Required    | Description                                                                                                               |
| ---------------------- | ------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `EntityLogicalName`    | `Edm.String`  | Conditional | Logical name of the table containing the state column. Required for a local state choice.                                 |
| `AttributeLogicalName` | `Edm.String`  | Conditional | Logical name of the state column, usually `statecode`. Required with `EntityLogicalName`.                                 |
| `OptionSetName`        | `Edm.String`  | Conditional | Global option set name. The service documents this parameter for internal use; do not send it with the local-column form. |
| `Value`                | `Edm.Int32`   | Yes         | State option value to update.                                                                                             |
| `Label`                | `Label`       | No          | New localized display label for the state option.                                                                         |
| `Description`          | `Label`       | No          | New localized description for the state option.                                                                           |
| `MergeLabels`          | `Edm.Boolean` | Yes         | Whether to preserve existing labels for languages not included in `Label`.                                                |
| `DefaultStatusCode`    | `Edm.Int32`   | No          | Default status reason value when this state is selected.                                                                  |

---

## Response

This action returns no response body on success (`204 No Content`).
