import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KGN Associates API',
      version: '1.0.0',
      description: `
## KGN ASSOCIATES
### Engineers and Valuers

REST API for the Property Valuation Management System.

Use the **Authorize** button above and paste your JWT token as:
\`Bearer <your_token>\`

**Test Credentials:**
- Email: \`admin@kgnassociates.com\` / Password: \`12345678\`
- Email: \`admin@admin.com\` / Password: \`12345678\`
- Email: \`rajesh@kgnassociates.com\` / Password: \`12345678\`
      `,
      contact: {
        name: 'KGN Associates',
        email: 'info@kgnassociates.com',
      },
    },
    servers: [
      { url: '/', description: 'Current Host (Auto / Relative)' },
      { url: 'http://201.18.210.181:822', description: 'Production VPS (201.18.210.181:822)' },
      { url: 'http://localhost:3000', description: 'Local Development' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token (obtained from /api/auth/login)',
        },
      },
      schemas: {
        LoginRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            email: { type: 'string', example: 'admin@kgnassociates.com' },
            username: { type: 'string', example: 'admin' },
            password: { type: 'string', example: '12345678' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string', description: 'JWT Bearer token' },
            user: { $ref: '#/components/schemas/User' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user_admin_1' },
            email: { type: 'string', example: 'admin@kgnassociates.com' },
            first_name: { type: 'string', example: 'KGN' },
            last_name: { type: 'string', example: 'Admin' },
            role: { type: 'string', enum: ['admin', 'valuer'], example: 'admin' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', example: 'john@example.com' },
            username: { type: 'string', example: 'john_valuer' },
            password: { type: 'string', example: 'mypassword' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            role: { type: 'string', enum: ['admin', 'valuer'], example: 'valuer' },
          },
        },
        ValuationSummary: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'val_001' },
            report_number: { type: 'string', example: 'KGN-2026-0001' },
            status: { type: 'string', enum: ['draft', 'completed', 'pending'], example: 'completed' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            customer_name: { type: 'string', example: 'Rajesh Kumar' },
            photos_count: { type: 'integer', example: 8 },
            institution_details: { type: 'object' },
            property_identification: { type: 'object' },
            final_valuation: { type: 'object' },
          },
        },
        ValuationFull: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            report_number: { type: 'string' },
            status: { type: 'string' },
            institutionDetails: {
              type: 'object',
              properties: {
                report_date: { type: 'string', format: 'date', example: '2026-10-03' },
                bank_name: { type: 'string', example: 'SBI' },
                branch_name: { type: 'string', example: 'Hyderabad Main' },
                applicant_name: { type: 'string', example: 'Rajesh Kumar' },
                loan_amount: { type: 'number', example: 5000000 },
                loan_type: { type: 'string', example: 'home_loan' },
                purpose_of_valuation: { type: 'string', example: 'mortgage' },
              },
            },
            propertyIdentification: {
              type: 'object',
              properties: {
                survey_number: { type: 'string', example: '123/A' },
                plot_number: { type: 'string', example: '456' },
                door_number: { type: 'string', example: '12-3-456' },
                locality_name: { type: 'string', example: 'Banjara Hills' },
                district: { type: 'string', example: 'Hyderabad' },
                state: { type: 'string', example: 'Telangana' },
                pincode: { type: 'string', example: '500034' },
                property_type: { type: 'string', example: 'residential' },
                age: { type: 'string', example: '10' },
                residual_age: { type: 'string', example: '40' },
              },
            },
            technicalDetails: {
              type: 'object',
              properties: {
                carpet_area: { type: 'string', example: '1200' },
                plinth_area: { type: 'string', example: '1400' },
                built_up_area: { type: 'string', example: '1400' },
                super_built_up_area: { type: 'string', example: '1600' },
                slab_area: { type: 'string', example: '1400' },
                property_age: { type: 'string', example: '5' },
                residual_age: { type: 'string', example: '45' },
                description: { type: 'string', example: 'RCC framed structure' },
                document_number: { type: 'string', example: 'DOC-2024-001' },
                buildingSpecCards: {
                  type: 'array',
                  description: 'Multi-card repeat mode for building specifications',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      description: { type: 'string', example: 'Ground Floor' },
                      document_number: { type: 'string', example: 'DOC-101' },
                      carpet_area: { type: 'string', example: '1000' },
                      plinth_area: { type: 'string', example: '1200' },
                      built_up_area: { type: 'string', example: '1200' },
                      super_built_up_area: { type: 'string', example: '1400' },
                      slab_area: { type: 'string', example: '1200' },
                      property_age: { type: 'string', example: '5' },
                      residual_age: { type: 'string', example: '45' },
                    },
                  },
                },
                landMeasurements: {
                  type: 'object',
                  properties: {
                    document_name: { type: 'string', example: 'Sale Deed 1234/2020' },
                    description: { type: 'string', example: 'Plot boundary description' },
                    shape: { type: 'string', example: 'Regular' },
                    apartment_case_note: { type: 'string' },
                    north: { type: 'object' },
                    south: { type: 'object' },
                    east: { type: 'object' },
                    west: { type: 'object' },
                  },
                },
                buildingMeasurements: {
                  type: 'object',
                  properties: {
                    document_name: { type: 'string' },
                    description: { type: 'string' },
                    shape: { type: 'string', example: 'Regular' },
                    north: { type: 'object' },
                    south: { type: 'object' },
                    east: { type: 'object' },
                    west: { type: 'object' },
                  },
                },
              },
            },
            finalValuation: {
              type: 'object',
              properties: {
                final_market_value: { type: 'number', example: 5000000 },
                final_guideline_value: { type: 'number', example: 4500000 },
                distress_value: { type: 'number', example: 4000000 },
                forced_sale_value: { type: 'number', example: 3500000 },
                replacement_cost: { type: 'number', example: 4800000 },
                depreciated_cost: { type: 'number', example: 4200000 },
                valuer_name: { type: 'string', example: 'Er. M. A. Khan' },
                valuer_remarks: { type: 'string', example: 'Property is in good condition' },
              },
            },
            structure_valuation_basis: { type: 'string', enum: ['as_per_actual', 'as_per_documents', 'as_per_plan'], example: 'as_per_actual' },
            structure_valuation_selected_floor: { type: 'string', example: 'built_up_area' },
            selected_building_spec_card: { type: 'string', example: 'all' },
            structureValuations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  floor_details: { type: 'string', example: 'built_up_area' },
                  area_sqft: { type: 'number', example: 1200 },
                  recommendation_of_funding: { type: 'string', example: '85%' },
                  cost_per_sqft: { type: 'number', example: 2000 },
                  total_value: { type: 'number', example: 2040000 },
                },
              },
            },
            photo_graphs_notes: {
              type: 'array',
              items: { type: 'string' },
              example: ['Front Elevation Note', 'Site Boundary Inspection'],
            },
            photo_graphs_note: { type: 'string', example: 'Front Elevation Note' },
            amenityValuations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  amenity_name: { type: 'string', example: 'Car Parking' },
                  amenity_value: { type: 'number', example: 100000 },
                },
              },
            },
            photos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string', example: 'Front View' },
                  latitude: { type: 'string', example: '17.3850' },
                  longitude: { type: 'string', example: '78.4867' },
                  locality: { type: 'string', example: 'Banjara Hills' },
                  region: { type: 'string', example: 'Telangana' },
                  captured_at: { type: 'string', format: 'date-time' },
                  preview: { type: 'string', description: 'Base64 encoded image string' },
                },
              },
            },
            signatures: {
              type: 'object',
              properties: {
                signature_inspector: { type: 'string', description: 'Base64 encoded signature image' },
                signature_valuer: { type: 'string' },
                signature_engineer: { type: 'string' },
                signature_institution: { type: 'string' },
              },
            },
          },
        },
        AdminStats: {
          type: 'object',
          properties: {
            total_reports: { type: 'integer', example: 42 },
            completed: { type: 'integer', example: 35 },
            pending: { type: 'integer', example: 7 },
            total_valuers: { type: 'integer', example: 5 },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            detail: { type: 'string', example: 'Invalid credentials' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
    paths: {
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login',
          description: 'Authenticate with email/username and password. Returns a JWT token.',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
          },
          responses: {
            200: { description: 'Login successful', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
            400: { description: 'Missing credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'Register new valuer',
          security: [],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
          },
          responses: {
            201: { description: 'Account created successfully' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/api/auth/profile': {
        get: {
          tags: ['Authentication'],
          summary: 'Get current user profile',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Profile data', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/valuations': {
        get: {
          tags: ['Valuations'],
          summary: 'List all valuation reports',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name or property' },
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'completed', 'pending', 'all'] } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          ],
          responses: {
            200: {
              description: 'List of valuations',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      count: { type: 'integer' },
                      results: { type: 'array', items: { $ref: '#/components/schemas/ValuationSummary' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Valuations'],
          summary: 'Create / Submit new valuation report',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ValuationFull' } } },
          },
          responses: {
            201: { description: 'Valuation created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValuationFull' } } } },
          },
        },
      },
      '/api/valuations/{id}': {
        get: {
          tags: ['Valuations'],
          summary: 'Get single valuation report by ID',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'val_001' }],
          responses: {
            200: { description: 'Valuation detail', content: { 'application/json': { schema: { $ref: '#/components/schemas/ValuationFull' } } } },
            404: { description: 'Not found' },
          },
        },
        put: {
          tags: ['Valuations'],
          summary: 'Update valuation report',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ValuationFull' } } },
          },
          responses: {
            200: { description: 'Updated successfully' },
            404: { description: 'Not found' },
          },
        },
        delete: {
          tags: ['Valuations'],
          summary: 'Delete a valuation report',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            200: { description: 'Deleted successfully' },
            404: { description: 'Not found' },
          },
        },
      },
      '/api/valuations/{id}/pdf': {
        post: {
          tags: ['Valuations'],
          summary: 'Generate PDF report',
          description: 'Returns the generated PDF as a binary file (application/pdf)',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'val_001' }],
          responses: {
            200: {
              description: 'PDF file',
              content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } },
            },
            404: { description: 'Report not found' },
          },
        },
      },
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'List all users (Admin only)',
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'List of users',
              content: {
                'application/json': {
                  schema: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                },
              },
            },
            403: { description: 'Admin access required' },
          },
        },
      },
      '/api/admin/stats': {
        get: {
          tags: ['Admin'],
          summary: 'Get dashboard statistics',
          security: [{ BearerAuth: [] }],
          responses: {
            200: { description: 'Stats', content: { 'application/json': { schema: { $ref: '#/components/schemas/AdminStats' } } } },
          },
        },
      },
      '/api/upload': {
        post: {
          tags: ['Upload'],
          summary: 'Upload Image / File (Multipart)',
          description: 'Upload an image file using multipart/form-data. Returns both the hosted URL path (/uploads/...) and the Base64 Data URL.',
          security: [],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['file'],
                  properties: {
                    file: {
                      type: 'string',
                      format: 'binary',
                      description: 'The image file to upload (JPEG, PNG, WEBP, etc.)',
                    },
                    description: { type: 'string', example: 'Exterior Front Elevation' },
                    latitude: { type: 'string', example: '17.385044' },
                    longitude: { type: 'string', example: '78.486671' },
                    locality: { type: 'string', example: 'Banjara Hills' },
                    region: { type: 'string', example: 'Telangana' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Image uploaded successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      filename: { type: 'string', example: '1741234567_photo.jpg' },
                      url: { type: 'string', example: '/uploads/1741234567_photo.jpg' },
                      size: { type: 'integer', example: 245000 },
                      mimetype: { type: 'string', example: 'image/jpeg' },
                      dataUrl: { type: 'string', example: 'data:image/jpeg;base64,...' },
                    },
                  },
                },
              },
            },
            400: { description: 'No file provided' },
          },
        },
      },
      '/api/valuations/{id}/add_photo': {
        post: {
          tags: ['Valuations'],
          summary: 'Add Photo to Valuation (Multipart)',
          description: 'Directly upload and append a site inspection photo to a specific valuation report using multipart/form-data.',
          security: [{ BearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'val_001' }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['photo'],
                  properties: {
                    photo: {
                      type: 'string',
                      format: 'binary',
                      description: 'Site inspection photo file',
                    },
                    description: { type: 'string', example: 'Front elevation view' },
                    latitude: { type: 'number', example: 17.385044 },
                    longitude: { type: 'number', example: 78.486671 },
                    locality: { type: 'string', example: 'Banjara Hills' },
                    region: { type: 'string', example: 'Telangana' },
                    bearing_degrees: { type: 'string', example: '180' },
                    bearing_direction: { type: 'string', example: 'South' },
                    captured_at: { type: 'string', example: '2026-10-03T10:00:00.000Z' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Photo added successfully' },
            404: { description: 'Valuation not found' },
          },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
