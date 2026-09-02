# DeleteGlobalOptionSet

Deletes a global option set definition by its unique name.

**Endpoint:** `DELETE [org]/api/data/v9.2/GlobalOptionSetDefinitions(Name='<name>')`  
**Method:** `DELETE`  
**Reference:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/create-update-optionsets

---

## Request

```http
DELETE [org]/api/data/v9.2/GlobalOptionSetDefinitions(Name='new_priority')
OData-MaxVersion: 4.0
OData-Version: 4.0
```

---

## Parameters

| Parameter | Type         | Required | Description                                                |
| --------- | ------------ | -------- | ---------------------------------------------------------- |
| `Name`    | `Edm.String` | Yes      | Unique name of the global option set in the resource path. |

---

## Response

This request returns no response body on success (`204 No Content`).

> **Warning:** Deleting a global option set can affect columns and records that depend on it. Confirm dependencies before calling this operation.
