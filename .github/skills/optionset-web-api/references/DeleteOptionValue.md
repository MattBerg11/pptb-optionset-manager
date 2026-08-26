# DeleteOptionValue

Deletes an option value from a global or local option set.

**Endpoint:** `POST [org]/api/data/v9.2/DeleteOptionValue`  
**Namespace:** `Microsoft.Dynamics.CRM`  
**Reference:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/deleteoptionvalue

---

## Request Body Examples

### Delete from a global option set

```json
{
  "OptionSetName": "new_priority",
  "Value": 989220003,
  "SolutionUniqueName": "MyCustomSolution"
}
```

### Delete from a local option set

```json
{
  "EntityLogicalName": "contact",
  "AttributeLogicalName": "new_contactstatus",
  "Value": 989220002
}
```

---

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `OptionSetName` | `Edm.String` | Conditional | Name of the global option set. Required when targeting a global option set; omit for local. |
| `EntityLogicalName` | `Edm.String` | Conditional | Logical name of the entity. Required together with `AttributeLogicalName` when targeting a local option set. |
| `AttributeLogicalName` | `Edm.String` | Conditional | Logical name of the picklist attribute. Required together with `EntityLogicalName` when targeting a local option set. |
| `Value` | `Edm.Int32` | Yes | The integer value of the option to delete. |
| `SolutionUniqueName` | `Edm.String` | No | Unique name of the unmanaged solution associated with this option value. |

---

## Response

This action returns no response body on success (`204 No Content`).

> **Warning:** Deleting an option value that is currently in use by existing records will cause those records to hold an invalid value. Validate usage before calling this action.
