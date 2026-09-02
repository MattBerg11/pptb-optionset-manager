# RetrieveGlobalOptionSet

Retrieves all global option set definitions or a single definition by metadata ID or unique name.

**Endpoint:** `GET [org]/api/data/v9.2/GlobalOptionSetDefinitions`  
**Method:** `GET`  
**Reference:** https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query-metadata-web-api

---

## Request Examples

### Retrieve all global option sets

```http
GET [org]/api/data/v9.2/GlobalOptionSetDefinitions
Accept: application/json
OData-MaxVersion: 4.0
OData-Version: 4.0
```

### Retrieve by name

```http
GET [org]/api/data/v9.2/GlobalOptionSetDefinitions(Name='new_priority')
Accept: application/json
OData-MaxVersion: 4.0
OData-Version: 4.0
```

### Retrieve by metadata ID

```http
GET [org]/api/data/v9.2/GlobalOptionSetDefinitions(00000000-0000-0000-0000-000000000000)
Accept: application/json
OData-MaxVersion: 4.0
OData-Version: 4.0
```

---

## Parameters

The collection request has no parameters. For an individual definition, use one of these keys in the resource path:

| Key          | Type         | Description                           |
| ------------ | ------------ | ------------------------------------- |
| `Name`       | `Edm.String` | Unique name of the global option set. |
| `MetadataId` | `Edm.Guid`   | Metadata ID of the global option set. |

---

## Response

Returns an `OptionSetMetadata` object for an individual request, or a collection of metadata objects for the collection request. The response includes properties such as `Name`, `DisplayName`, `Description`, `Options`, and `OptionSetType`.

```json
{
    "@odata.context": "...$metadata#Microsoft.Dynamics.CRM.OptionSetMetadata",
    "MetadataId": "00000000-0000-0000-0000-000000000000",
    "Name": "new_priority",
    "OptionSetType": "Picklist",
    "Options": []
}
```
