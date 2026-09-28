# KGN Associates Property Valuation Backend

Django REST API backend for property valuation management system.

## Prerequisites

- Python 3.8 or higher
- MySQL Server installed and running
- MySQL database named `kgn_associates` created

## Setup Instructions

### 1. Create MySQL Database

```sql
CREATE DATABASE kgn_associates CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Settings
DB_NAME=kgn_associates
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 3. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Create Superuser (Optional - for Admin Panel)

```bash
python manage.py createsuperuser
```

### 6. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication Endpoints

- `POST /api/auth/register/` - Register a new user
  ```json
  {
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword123",
    "password2": "securepassword123",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "+1234567890"
  }
  ```

- `POST /api/auth/login/` - Login and get JWT tokens
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
  Response:
  ```json
  {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone_number": "+1234567890"
    }
  }
  ```

- `POST /api/auth/token/refresh/` - Refresh access token
  ```json
  {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
  ```

- `GET /api/auth/profile/` - Get current user profile (requires authentication)
- `PUT /api/auth/profile/` - Update current user profile (requires authentication)

### Main Endpoints

- `GET/POST /api/valuations/` - List/Create property valuations
- `GET/PUT/DELETE /api/valuations/{id}/` - Retrieve/Update/Delete specific valuation
- `GET /api/valuations/{id}/full_details/` - Get complete valuation with all related data

### Nested Update Endpoints

- `POST /api/valuations/{id}/update_institution_details/` - Update institution details
- `POST /api/valuations/{id}/update_property_identification/` - Update property identification
- `POST /api/valuations/{id}/update_schedule_details/` - Update schedule details
- `POST /api/valuations/{id}/update_infrastructure_details/` - Update infrastructure details
- `POST /api/valuations/{id}/update_technical_details/` - Update technical details
- `POST /api/valuations/{id}/update_final_valuation/` - Update final valuation
- `POST /api/valuations/{id}/update_location_details/` - Update location details
- `POST /api/valuations/{id}/update_property_characteristics/` - Update property characteristics
- `POST /api/valuations/{id}/update_ndma_parameters/` - Update NDMA parameters

### Valuation Data Endpoints

- `POST /api/valuations/{id}/add_land_extent_valuation/` - Add land extent valuation
- `POST /api/valuations/{id}/add_structure_valuation/` - Add structure valuation
- `POST /api/valuations/{id}/add_amenity_valuation/` - Add amenity valuation
- `POST /api/valuations/{id}/add_verified_document/` - Add verified document
- `POST /api/valuations/{id}/add_photo/` - Add property photo

### Individual Model Endpoints

Each model has its own CRUD endpoints:
- `/api/institution-details/`
- `/api/verified-documents/`
- `/api/property-identification/`
- `/api/schedule-details/`
- `/api/infrastructure-details/`
- `/api/technical-details/`
- `/api/land-extent-valuation/`
- `/api/structure-valuation/`
- `/api/amenity-valuation/`
- `/api/property-market-value/`
- `/api/guideline-value/`
- `/api/final-valuation/`
- `/api/location-details/`
- `/api/property-characteristics/`
- `/api/ndma-parameters/`
- `/api/photos/`

## Admin Panel

Access the Django admin panel at `http://localhost:8000/admin/` to manage data through a web interface.

## CORS Configuration

The backend is configured to allow requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

Update `CORS_ALLOWED_ORIGINS` in `backend/settings.py` if your frontend runs on a different port.

## Models Overview

### PropertyValuation
Main model that ties all valuation data together.

### InstitutionDetails
Bank, loan application, and property holding information.

### PropertyIdentification
Address, survey numbers, and location details.

### ScheduleDetails
Boundary measurements, construction details, and occupancy information.

### InfrastructureDetails
Road access, utilities, and infrastructure information.

### TechnicalDetails
Building specifications, structural details, and technical assessments.

### LandExtentValuation
Land valuation calculations (documents, actual, plan, final).

### StructureValuation
Structure/floor-wise valuation details.

### AmenityValuation
Amenities and their values.

### FinalValuation
Final valuation summary, certificates, and valuer details.

### LocationDetails
GPS coordinates and location data.

### PropertyCharacteristics
Property specifications and NDMA parameters.

### NDMAParameters
Building safety and disaster management parameters.

### PropertyPhoto
Property photos with descriptions.

## Frontend Integration

### Authentication

The frontend includes an API service (`frontend/src/services/api.js`) and authentication context (`frontend/src/context/AuthContext.jsx`) for easy integration.

To use authentication in your React app:

```jsx
import { AuthProvider, useAuth } from './context/AuthContext';

// Wrap your app with AuthProvider
function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  );
}

// Use authentication in components
function LoginComponent() {
  const { login, register, logout, user, isAuthenticated } = useAuth();
  
  const handleLogin = async () => {
    const result = await login({ email, password });
    if (result.success) {
      // User logged in successfully
    }
  };
  
  // ... rest of component
}
```

### Property Valuation API

To integrate with the frontend:

1. Create a new property valuation:
```javascript
import { propertyValuationAPI } from './services/api';

const valuation = await propertyValuationAPI.create({});
```

2. Update each section using the nested endpoints:
```javascript
await propertyValuationAPI.updateInstitutionDetails(id, data);
await propertyValuationAPI.updatePropertyIdentification(id, data);
await propertyValuationAPI.updateScheduleDetails(id, data);
// ... etc for each tab
```

3. Retrieve complete valuation data:
```javascript
const fullData = await propertyValuationAPI.getFullDetails(id);
```
