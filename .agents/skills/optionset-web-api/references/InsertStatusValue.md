# InsertStatusValue

Inserts a new status reason into a `Status` column in Dataverse.

**Endpoint:** `POST [org]/api/data/v9.2/InsertStatusValue`  
**Namespace:** `Microsoft.Dynamics.CRM`  
**Reference:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/insertstatusvalue

---

## Request Body Example

```json
{
    "AttributeLogicalName": "statuscode",
    "EntityLogicalName": "sample_bankaccount",
    "Label": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
            {
                "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
                "Label": "Frozen",
                "LanguageCode": 1033,
                "IsManaged": false
            }
        ],
        "UserLocalizedLabel": {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Frozen",
            "LanguageCode": 1033,
            "IsManaged": false
        }
    },
    "StateCode": 1,
    "SolutionUniqueName": "examplesolution"
}
```

---

## Parameters

| Parameter              | Type         | Required | Description                                                          |
| ---------------------- | ------------ | -------- | -------------------------------------------------------------------- |
| `EntityLogicalName`    | `Edm.String` | Yes      | Logical name of the table containing the `Status` column.            |
| `AttributeLogicalName` | `Edm.String` | Yes      | Logical name of the `Status` column, usually `statuscode`.           |
| `Label`                | `Label`      | Yes      | Localized display label(s) for the new status reason.                |
| `StateCode`            | `Edm.Int32`  | Yes      | State value that the new status reason belongs to.                   |
| `SolutionUniqueName`   | `Edm.String` | No       | Unique name of the unmanaged solution to associate this change with. |

---

## Response

Returns an `InsertStatusValueResponse` containing the `NewOptionValue` (`Edm.Int32`) assigned to the new status reason.

```json
{
    "@odata.context": "...$metadata#Microsoft.Dynamics.CRM.InsertStatusValueResponse",
    "NewOptionValue": 727000000
}
```
