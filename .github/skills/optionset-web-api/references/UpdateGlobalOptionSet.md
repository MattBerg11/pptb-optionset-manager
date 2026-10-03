# UpdateGlobalOptionSet

Updates writable metadata properties of a global option set by metadata ID.

**Endpoint:** `PUT [org]/api/data/v9.2/GlobalOptionSetDefinitions(<metadataid>)`  
**Method:** `PUT`  
**Reference:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/optionsetmetadata

---

## Request Body Example

```json
{
    "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
    "DisplayName": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
            {
                "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                "Label": "Updated Priority",
                "LanguageCode": 1033
            }
        ],
        "UserLocalizedLabel": {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Updated Priority",
            "LanguageCode": 1033
        }
    },
    "Description": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
            {
                "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                "Label": "Updated priority choice.",
                "LanguageCode": 1033
            }
        ],
        "UserLocalizedLabel": {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Updated priority choice.",
            "LanguageCode": 1033
        }
    }
}
```

---

## Parameters

| Parameter          | Type         | Required | Description                                                |
| ------------------ | ------------ | -------- | ---------------------------------------------------------- |
| `MetadataId`       | `Edm.Guid`   | Yes      | Metadata ID of the global option set in the resource path. |
| `DisplayName`      | `Label`      | No       | Updated localized display name.                            |
| `Description`      | `Label`      | No       | Updated localized description.                             |
| `ExternalTypeName` | `Edm.String` | No       | External type name associated with the option set.         |

Only properties exposed by `OptionSetMetadataBase` can be updated. Options cannot be added, removed, or reordered with this request; use the option value actions instead.

---

## Response

This request returns no response body on success (`204 No Content`).
