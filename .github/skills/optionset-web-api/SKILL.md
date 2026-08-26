---
name: optionset-web-api
description: Skill for knowledge of how te api works
---

# Create and update choices (option sets) using the Web API

When you define a global option set using a `POST` request to *[Organization URI]*`/api/data/v9.2/GlobalOptionSetDefinitions`, 
we recommend that you let the system assign a value. Let the system assign the value by passing a **null** value when you create the 
new `OptionMetadata` instance. When you define an option, it contains an option value prefix specific to the 
context of the publisher set for the solution that the option set is created in. 
This prefix helps reduce the chance of creating duplicate option sets for a managed solution, 
and in any option sets that are defined in environments where your managed solution is installed. For more information, see [Merge option set options](/power-platform/alm/how-managed-solutions-merged#merge-option-set-options).

## Messages

The following table lists the messages that you can use with global option sets.  
  
|Message|Web API Operation|  
|--|--|
|`CreateOptionSet`|Use `POST` request to *[Organization URI]*`/api/data/v9.2/GlobalOptionSetDefinitions`.|
|`DeleteOptionSet`|Use `DELETE` request to *[Organization URI]*`/api/data/v9.2/GlobalOptionSetDefinitions(Name='<name>')`.|
|`RetrieveAllOptionSets`|Use `GET` request to *[Organization URI]*`/api/data/v9.2/GlobalOptionSetDefinitions`.|
|`RetrieveOptionSet`|Use `GET` request to *[Organization URI]*`/api/data/v9.2/GlobalOptionSetDefinitions(Name='<name>')`.|

The following table lists the messages you can use with local and global option sets

|Message|Web API Operation|  
|--|--|
|`DeleteOptionValue`<br />Deletes one of the values in a global option set.|[DeleteOptionValue Action](xref:Microsoft.Dynamics.CRM.DeleteOptionValue)<br /> Example: [Delete Option](#delete-option)|
|`InsertOptionValue`<br />Inserts a new option into a global option set.|[InsertOptionValue Action](xref:Microsoft.Dynamics.CRM.InsertOptionValue)<br />Example: [Insert options](#insert-options)| 
|`InsertStatusValue`<br />Inserts a new option into the global option set used in the `Status` column.|[InsertStatusValue Action](xref:Microsoft.Dynamics.CRM.InsertStatusValue)<br />Example: [Insert status value](#insert-status-value)|
|`OrderOption`<br />Changes the relative order of the options in an option set.|[OrderOption Action](xref:Microsoft.Dynamics.CRM.OrderOption)<br />Example: [Order options](#order-options)|
|`UpdateOptionSet`|Use `PUT` request with a [OptionSetMetadataBase EntityType](xref:Microsoft.Dynamics.CRM.OptionSetMetadataBase) to *[Organization URI]*`/api/data/v9.2/GlobalOptionSetDefinitions(`*metadataid*`)`<br />Only those properties defined by the `OptionSetMetadataBase` can be updated. These properties doesn't include the options. Use other actions to make changes to options.|
|`UpdateOptionValue`<br />Updates an option in an option set.|[UpdateOptionValue Action](xref:Microsoft.Dynamics.CRM.UpdateOptionValue)<br />Example: [Update options](#update-options)|
|`UpdateStateValue`<br />Inserts a new option into the option set used in the `Status` column.|[UpdateStateValue Action](xref:Microsoft.Dynamics.CRM.UpdateStateValue)|

## Examples

- [Create a global option set](#create-a-global-option-set)
- [Create a choice column using a global option set](#create-a-choice-column-using-a-global-option-set)
- [Insert options](#insert-options)
- [Update options](#update-options)
- [Order options](#order-options)
- [Delete Option](#delete-option)
- [Insert status value](#insert-status-value)

### Create a global option set

The following example uses these properties to create a global choice.  
  
|[OptionSetMetadata](xref:Microsoft.Dynamics.CRM.OptionSetMetadata) properties|Values|  
|---------------------------------|------------|  
|`Name`|`sample_colors`|  
|`DisplayName`|Colors|  
|`Description`|Color Choice|  
|`OptionSetType`|`Picklist`|  
|`Options`|value:`727000000`, label:**Red**<br />value:`727000001`, label:**Yellow**<br />value:`727000002`, label:**Green**|
  
The following example creates global choice using the properties.

The URI for the global choice is returned in the response. You can also refer to this global choice using the name: `GlobalOptionSetDefinitions(Name='sample_colors')`.

**Request:**

```http
POST [Organization Uri]/api/data/v9.2/GlobalOptionSetDefinitions
MSCRM.SolutionUniqueName: examplesolution

{
  "@odata.type": "Microsoft.Dynamics.CRM.OptionSetMetadata",
  "Options": [
    {
      "Value": 727000000,
      "Label": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Red",
            "LanguageCode": 1033,
            "IsManaged": false
          }
        ],
        "UserLocalizedLabel": {
          "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
          "Label": "Red",
          "LanguageCode": 1033,
          "IsManaged": false
        }
      }
    },
    {
      "Value": 727000001,
      "Label": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Yellow",
            "LanguageCode": 1033,
            "IsManaged": false
          }
        ],
        "UserLocalizedLabel": {
          "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
          "Label": "Yellow",
          "LanguageCode": 1033,
          "IsManaged": false
        }
      }
    },
    {
      "Value": 727000002,
      "Label": {
        "@odata.type": "Microsoft.Dynamics.CRM.Label",
        "LocalizedLabels": [
          {
            "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
            "Label": "Green",
            "LanguageCode": 1033,
            "IsManaged": false
          }
        ],
        "UserLocalizedLabel": {
          "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
          "Label": "Green",
          "LanguageCode": 1033,
          "IsManaged": false
        }
      }
    }
  ],
  "Description": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Color Choice",
        "LanguageCode": 1033,
        "IsManaged": false
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Color Choice",
      "LanguageCode": 1033,
      "IsManaged": false
    }
  },
  "DisplayName": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Colors",
        "LanguageCode": 1033,
        "IsManaged": false
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Colors",
      "LanguageCode": 1033,
      "IsManaged": false
    }
  },
  "Name": "sample_colors",
  "OptionSetType": "Picklist"
}
```

**Response:**

```http
HTTP/1.1 204 NoContent
OData-Version: 4.0
OData-EntityId: [Organization Uri]/api/data/v9.2/GlobalOptionSetDefinitions(00aa00aa-bb11-cc22-dd33-44ee44ee44ee)
```

### Insert options

The following example uses the [InsertOptionValue Action](xref:Microsoft.Dynamics.CRM.InsertOptionValue) to add a new option with the value `727000005` and label **Echo** to the local choice column created by [Create a choice column](create-update-column-definitions-using-web-api.md#create-a-choice-column).

**Request:**

```http
POST [Organization Uri]/api/data/v9.2/InsertOptionValue

{
  "AttributeLogicalName": "sample_choice",
  "EntityLogicalName": "sample_bankaccount",
  "Value": 727000005,
  "Label": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Echo",
        "LanguageCode": 1033,
        "IsManaged": false
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Echo",
      "LanguageCode": 1033,
      "IsManaged": false
    }
  },
  "SolutionUniqueName": "examplesolution"
}
```

**Response:**

```http
HTTP/1.1 200 OK
OData-Version: 4.0

{
  "@odata.context": "[Organization Uri]/api/data/v9.2/$metadata#Microsoft.Dynamics.CRM.InsertOptionValueResponse",
  "NewOptionValue": 727000005
}
```

### Update options

To update individual options, you must use the [UpdateOptionValue Action](xref:Microsoft.Dynamics.CRM.UpdateOptionValue). The following example updates the `TrueOption` from a boolean column and changes the label so that it's `Up` rather than `True`. Because this is a 'local' option set, it uses `AttributeLogicalName` and `EntityLogicalName`. For a global option set, use the `OptionSetName` parameter instead.

**Request:**

```http
POST [Organization Uri]/api/data/v9.2/UpdateOptionValue HTTP/1.1

{
  "AttributeLogicalName": "new_boolean",
  "EntityLogicalName": "new_bankaccount",
  "Value": 1,
  "Label": {
    "@odata.type": "Microsoft.Dynamics.CRM.Label",
    "LocalizedLabels": [
      {
        "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
        "Label": "Up",
        "LanguageCode": 1033,
        "IsManaged": false
      }
    ],
    "UserLocalizedLabel": {
      "@odata.type": "Microsoft.Dynamics.CRM.LocalizedLabel",
      "Label": "Up",
      "LanguageCode": 1033,
      "IsManaged": false
    }
  },
  "MergeLabels": true
}
```

**Response:**

```http
HTTP/1.1 204 NoContent
OData-Version: 4.0
```

### Order options

The following example shows how to re-order options of a local optionset using the [OrderOption Action](xref:Microsoft.Dynamics.CRM.OrderOption). The `Value` property contains the values of the option in the desired order.

To use this with a global option set, specify the `OptionSetName` parameter rather than `EntityLogicalName` and `AttributeLogicalName`.

The `SolutionUniqueName` parameter applies the changes as part of the specified solution.

**Request:**

```http
POST [Organization Uri]/api/data/v9.2/OrderOption

{
  "EntityLogicalName": "sample_bankaccount",
  "AttributeLogicalName": "sample_choice",
  "Values": [
    727000002,
    727000000,
    727000003,
    727000001,
    727000005,
    727000004
  ],
  "SolutionUniqueName": "examplesolution"
}
```

**Response:**

```http
HTTP/1.1 204 NoContent
OData-Version: 4.0
```

### Delete Option

The following example shows how to delete an option for a local choice column using the [DeleteOptionValue Action](xref:Microsoft.Dynamics.CRM.DeleteOptionValue).

To use this with a global option set, specify the `OptionSetName` parameter rather than `EntityLogicalName` and `AttributeLogicalName`.

The `SolutionUniqueName` parameter applies the changes as part of the specified solution.

**Request:**

```http
POST [Organization Uri]/api/data/v9.2/DeleteOptionValue

{
  "AttributeLogicalName": "sample_choice",
  "EntityLogicalName": "sample_bankaccount",
  "Value": 727000004
}
```

**Response:**

```http
HTTP/1.1 204 NoContent
OData-Version: 4.0
```

### Insert status value

The following example shows how to add an option to a status column using the [InsertStatusValue Action](xref:Microsoft.Dynamics.CRM.InsertStatusValue).

Use the `StateCode` parameter to specify which statecode option the status value applies to. The `SolutionUniqueName` parameter applies the changes as part of the specified solution.

The `NewOptionValue` property returned by the [InsertStatusValueResponse ComplexType](xref:Microsoft.Dynamics.CRM.InsertStatusValueResponse) contains the value assigned to the option.

**Request:**

```http
POST [Organization Uri]/api/data/v9.2/InsertStatusValue

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

**Response:**

```http
HTTP/1.1 200 OK
OData-Version: 4.0

{
  "@odata.context": "[Organization Uri]/api/data/v9.2/$metadata#Microsoft.Dynamics.CRM.InsertStatusValueResponse",
  "NewOptionValue": 727000000
}
```