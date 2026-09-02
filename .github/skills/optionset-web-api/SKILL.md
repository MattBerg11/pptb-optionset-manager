---
name: optionset-web-api
description: Dataverse Web API operations for global option sets and local choice columns.
---

## Scope

Use these Dataverse Web API operations for global option sets and local choice columns. Base URL:

```text
[Organization URI]/api/data/v9.2

```

## Operations

### Global option set metadata

| Operation             | Method   | URI                                          | Reference                                                        |
| --------------------- | -------- | -------------------------------------------- | ---------------------------------------------------------------- |
| Create                | `POST`   | `/GlobalOptionSetDefinitions`                | [CreateGlobalOptionSet](references/CreateGlobalOptionSet.md)     |
| Retrieve all          | `GET`    | `/GlobalOptionSetDefinitions`                | [RetrieveGlobalOptionSet](references/RetrieveGlobalOptionSet.md) |
| Retrieve by name      | `GET`    | `/GlobalOptionSetDefinitions(Name='')`       | [RetrieveGlobalOptionSet](references/RetrieveGlobalOptionSet.md) |
| Delete by name        | `DELETE` | `/GlobalOptionSetDefinitions(Name='<name>')` | [DeleteGlobalOptionSet](references/DeleteGlobalOptionSet.md)     |
| Update metadata by ID | `PUT`    | `/GlobalOptionSetDefinitions(<metadataid>)`  | [UpdateGlobalOptionSet](references/UpdateGlobalOptionSet.md)     |

`Update metadata by ID` changes only properties exposed by the metadata type. It cannot add, remove, or reorder options; use the actions below.

### Option value actions

| Action              | Method and URI            | Applies to               | Microsoft Learn                                      |
| ------------------- | ------------------------- | ------------------------ | ---------------------------------------------------- |
| `InsertOptionValue` | `POST /InsertOptionValue` | Local and global choices | [InsertOptionValue](references/InsertOptionValue.md) |
| `UpdateOptionValue` | `POST /UpdateOptionValue` | Local and global choices | [UpdateOptionValue](references/UpdateOptionValue.md) |
| `DeleteOptionValue` | `POST /DeleteOptionValue` | Local and global choices | [DeleteOptionValue](references/DeleteOptionValue.md) |
| `OrderOption`       | `POST /OrderOption`       | Local and global choices | [OrderOption](references/OrderOption.md)             |
| `InsertStatusValue` | `POST /InsertStatusValue` | A `Status` column        | [InsertStatusValue](references/InsertStatusValue.md) |
| `UpdateStateValue`  | `POST /UpdateStateValue`  | A `Status` column        | [UpdateStateValue](references/UpdateStateValue.md)   |

- Local choice actions require `EntityLogicalName` and `AttributeLogicalName`.
- Global choice actions require `OptionSetName`.

### Supporting functions

| Function                     | Method and URI                    | Reference                                                              |
| ---------------------------- | --------------------------------- | ---------------------------------------------------------------------- |
| `RetrieveAvailableLanguages` | `GET /RetrieveAvailableLanguages` | [RetrieveAvailableLanguages](references/RetrieveAvailableLanguages.md) |
