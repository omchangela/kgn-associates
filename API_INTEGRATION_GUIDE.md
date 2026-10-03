# KGN Associates — Mobile (Flutter) API Integration Guide

**Production Base URL:** `http://201.18.210.181:822`  
**Interactive Swagger Docs:** `http://201.18.210.181:822/api-docs`  
**Authentication Type:** `Bearer <JWT_TOKEN>`

---

## 1. Authentication

### `POST /api/auth/login`
Authenticate valuer/employee to retrieve the JWT Bearer token.

#### Request Body (`application/json`):
```json
{
  "email": "admin@kgnassociates.com",
  "password": "admin123"
}
```
*(Also supports `username` instead of `email`)*

#### Response (`200 OK`):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_admin_1",
    "email": "admin@kgnassociates.com",
    "username": "admin",
    "first_name": "KGN",
    "last_name": "Admin",
    "role": "admin"
  }
}
```

> **Header for Protected Endpoints:**  
> `Authorization: Bearer <TOKEN>`

---

## 2. Multipart Image Upload

### `POST /api/upload`
Uploads property photos, sketches, or signatures as standard multipart files.

- **Content-Type:** `multipart/form-data`
- **Authentication:** Optional / Public

#### Form Fields:
| Field Name | Type | Required | Description |
|---|---|---|---|
| `file` (or `photo` / `image`) | File (binary) | **Yes** | JPEG / PNG image file |
| `description` | Text | No | e.g. "Front Elevation & Entrance" |
| `latitude` | Text / Number | No | Geo-tag Latitude (e.g. `17.385044`) |
| `longitude` | Text / Number | No | Geo-tag Longitude (e.g. `78.486671`) |
| `locality` | Text | No | e.g. "Banjara Hills" |
| `region` | Text | No | e.g. "Telangana" |

#### Response (`201 Created`):
```json
{
  "success": true,
  "filename": "1741234567_front_view.jpg",
  "url": "/uploads/1741234567_front_view.jpg",
  "full_url": "/uploads/1741234567_front_view.jpg",
  "size": 245120,
  "mimetype": "image/jpeg",
  "dataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "metadata": {
    "description": "Front Elevation & Entrance",
    "latitude": "17.385044",
    "longitude": "78.486671",
    "locality": "Banjara Hills",
    "region": "Telangana"
  }
}
```

---

## 3. Submit Valuation Report

### `POST /api/valuations`
Submits a complete property valuation report.

- **Headers:**  
  - `Content-Type: application/json`  
  - `Authorization: Bearer <TOKEN>`

#### Complete Request Payload Example:
```json
{
  "report_number": "KGN-2026-0001",
  "status": "completed",
  
  "institutionDetails": {
    "report_date": "2026-10-03",
    "bank_name": "State Bank of India",
    "branch_name": "Hyderabad Main Branch",
    "applicant_name": "Rajesh Kumar",
    "loan_amount": 7500000,
    "loan_type": "Home Loan",
    "purpose_of_valuation": "Mortgage Security"
  },

  "propertyIdentification": {
    "survey_number": "124/B",
    "plot_number": "45",
    "door_number": "8-2-293/82",
    "locality_name": "Jubilee Hills",
    "district": "Hyderabad",
    "state": "Telangana",
    "pincode": "500033",
    "property_type": "residential",
    "age": "8",
    "residual_age": "52"
  },

  "technicalDetails": {
    "carpet_area": "1450",
    "plinth_area": "1650",
    "built_up_area": "1650",
    "super_built_up_area": "1900",
    "slab_area": "1650",
    "property_age": "8",
    "residual_age": "52",
    "description": "RCC Framed Structure with Teakwood fittings",
    "document_number": "DOC-2024-9843",
    "buildingSpecCards": [
      {
        "id": "card_1",
        "description": "Ground Floor Residential Unit",
        "document_number": "DOC-GF-01",
        "carpet_area": "1450",
        "plinth_area": "1650",
        "built_up_area": "1650",
        "super_built_up_area": "1900",
        "slab_area": "1650",
        "property_age": "8",
        "residual_age": "52"
      }
    ]
  },

  "landMeasurements": {
    "document_name": "Sale Deed No. 4589/2021",
    "description": "Rectangular open corner plot facing 40ft wide North road",
    "shape": "Regular",
    "north": { "dimension": "60 ft", "boundary": "40ft Wide Road" },
    "south": { "dimension": "60 ft", "boundary": "Plot No 46" },
    "east": { "dimension": "40 ft", "boundary": "Plot No 44" },
    "west": { "dimension": "40 ft", "boundary": "Plot No 42" }
  },

  "buildingMeasurements": {
    "document_name": "Approved Municipal Sanction Plan",
    "description": "G+1 Construction as per GHMC sanction",
    "shape": "Regular",
    "north": { "dimension": "55 ft", "boundary": "Open Space" },
    "south": { "dimension": "55 ft", "boundary": "Setback 5ft" },
    "east": { "dimension": "35 ft", "boundary": "Setback 4ft" },
    "west": { "dimension": "35 ft", "boundary": "Setback 4ft" }
  },

  "structure_valuation_basis": "as_per_actual",
  
  "structureValuations": [
    {
      "floor_details": "Ground Floor Built-up Area",
      "area_sqft": 1650,
      "cost_per_sqft": 2400,
      "total_value": 3960000,
      "recommendation_of_funding": "85%"
    }
  ],

  "amenityValuations": [
    {
      "amenity_name": "Covered Car Parking (2 slots)",
      "amenity_value": 300000
    },
    {
      "amenity_name": "10 KVA Backup Generator",
      "amenity_value": 200000
    }
  ],

  "finalValuation": {
    "final_market_value": 9500000,
    "final_guideline_value": 7200000,
    "distress_value": 7600000,
    "forced_sale_value": 6800000,
    "replacement_cost": 4500000,
    "depreciated_cost": 3960000,
    "valuer_name": "Er. M. A. Khan",
    "valuer_remarks": "Property is in prime condition with clear title."
  },

  "photo_graphs_notes": [
    "External road view & boundaries inspected",
    "Structural integrity verified"
  ],

  "photos": [
    {
      "description": "Front Elevation View",
      "latitude": "17.385044",
      "longitude": "78.486671",
      "locality": "Jubilee Hills",
      "region": "Telangana",
      "captured_at": "2026-10-03T10:30:00.000Z",
      "photo": "/uploads/1741234567_front_view.jpg",
      "preview": "/uploads/1741234567_front_view.jpg"
    }
  ],

  "signatures": {
    "signature_inspector": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
    "signature_valuer": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
  }
}
```

#### Response (`201 Created`):
Returns the complete saved valuation record including generated `id`.

---

## 4. Attach Photo Directly to Valuation Report

### `POST /api/valuations/{id}/add_photo`
Uploads and appends a single photo directly to an existing report.

- **Headers:** `Authorization: Bearer <TOKEN>`
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `photo` (File, required)
  - `description` (text)
  - `latitude` (number)
  - `longitude` (number)
  - `locality` (text)
  - `region` (text)

---

## 5. Download Official PDF Report

### `GET /api/valuations/{id}/generate-pdf?download=1`
Generates and downloads the certified valuation PDF with all tables, annexures, and geotagged photographs.

- **URL:** `http://201.18.210.181:822/api/valuations/{id}/generate-pdf?download=1`
- **Response:** `application/pdf` binary stream.

---