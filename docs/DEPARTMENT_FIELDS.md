# Department fields (dynamic product attributes)

Field definitions live in the **DepartmentField** collection (see `Models/departmentFieldModel.js`). Seed them with:

```bash
node scripts/seedDepartmentFields.js
```

## API

**GET** `/api/v1/departments/:slug/fields`

- **slug** – department slug (`food`, `grocery`, `household`, …)
- **Query:** `includeInactive=true` – include inactive field definitions

**Response**

```json
{
  "status": "success",
  "results": 3,
  "data": {
    "department": { "_id", "name", "slug", "iconUrl", "description" },
    "fields": [
      {
        "fieldKey": "allergens",
        "fieldLabel": "Allergens",
        "fieldType": "tags",
        "placeholder": "...",
        "helpText": "...",
        "isRequired": false,
        "isActive": true,
        "sortOrder": 0,
        "options": null,
        "validationRules": null,
        "defaultValue": null
      }
    ]
  }
}
```

Store submitted values on the product in **`metadata[fieldKey]`** (see `productModel.js`).

The admin Add Product page loads this endpoint when the user picks a department (`productType` slug).
