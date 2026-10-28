# OrderOption

Sets the display order for all options in a global or local option set by specifying the complete ordered list of values.

**Endpoint:** `POST [org]/api/data/v9.2/OrderOption`  
**Namespace:** `Microsoft.Dynamics.CRM`  
**Reference:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/reference/orderoption

---

## Request Body Examples

### Reorder a global option set

```json
{
  "OptionSetName": "new_priority",
  "Values": [989220002, 989220000, 989220003, 989220001],
  "SolutionUniqueName": "MyCustomSolution"
}
```

### Reorder a local option set

```json
{
  "EntityLogicalName": "opportunity",
  "AttributeLogicalName": "new_dealstage",
  "Values": [989220001, 989220000, 989220002, 989220003]
}
```

---

## Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `OptionSetName` | `Edm.String` | Conditional | Name of the global option set. Required when targeting a global option set; omit for local. |
| `EntityLogicalName` | `Edm.String` | Conditional | Logical name of the entity. Required together with `AttributeLogicalName` when targeting a local option set. |
| `AttributeLogicalName` | `Edm.String` | Conditional | Logical name of the picklist attribute. Required together with `EntityLogicalName` when targeting a local option set. |
| `Values` | `Collection(Edm.Int32)` | Yes | Array of all option values in the desired display order. Every existing value must be present — omitting a value will cause an error. |
| `SolutionUniqueName` | `Edm.String` | No | Unique name of the unmanaged solution to associate this change with. |

---

## Response

This action returns no response body on success (`204 No Content`).

> **Note:** `Values` must contain every option value that exists in the option set. The array defines the complete ordering, not a partial re-arrangement.
