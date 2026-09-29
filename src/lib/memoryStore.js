// In-memory fallback store when local MongoDB is not yet running
// Allows testing and viewing the app without requiring an active mongod process

class MemoryStore {
  constructor() {
    this.users = [
      {
        id: 'user_admin_root',
        _id: 'user_admin_root',
        username: 'admin_super',
        email: 'admin@admin.com',
        // password: "12345678"
        password: '$2b$10$uRO6yzoFa7Wx2/l4L6XgMeb2U0CeQ5/2zIqh5LcdflFZGCPw3eteS',
        first_name: 'Executive',
        last_name: 'Admin',
        phone_number: '+91 98765 43210',
        role: 'admin',
        status: 'active',
      },
      {
        id: 'user_1',
        _id: 'user_1',
        username: 'admin',
        email: 'admin@kgnassociates.com',
        // password for test: "admin123"
        password: '$2a$10$wE1M2m608jUq8u/762yR1uB6j7sUoN5v.99k9Cg/QY8p2Yw8oO5iC',
        first_name: 'KGN',
        last_name: 'Admin',
        phone_number: '+91 98765 43210',
        role: 'admin',
        status: 'active',
      },
      {
        id: 'user_emp_1',
        _id: 'user_emp_1',
        username: 'rajesh_valuer',
        email: 'rajesh@kgnassociates.com',
        password: '$2b$10$uRO6yzoFa7Wx2/l4L6XgMeb2U0CeQ5/2zIqh5LcdflFZGCPw3eteS',
        first_name: 'Rajesh',
        last_name: 'Kumar',
        phone_number: '+91 98765 43211',
        role: 'valuer',
        status: 'active',
      },
      {
        id: 'user_emp_2',
        _id: 'user_emp_2',
        username: 'suresh_inspector',
        email: 'suresh@kgnassociates.com',
        password: '$2b$10$uRO6yzoFa7Wx2/l4L6XgMeb2U0CeQ5/2zIqh5LcdflFZGCPw3eteS',
        first_name: 'Suresh',
        last_name: 'Reddy',
        phone_number: '+91 98480 54321',
        role: 'inspector',
        status: 'active',
      }
    ];

    this.valuations = [
      {
        id: 'val_sample_1',
        _id: 'val_sample_1',
        report_number: 'KGN-2026-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'completed',
        institutionDetails: {
          bank_name: 'State Bank of India',
          branch_name: 'Banjara Hills, Hyderabad',
          applicant_name: 'Mohammed Rafi & Sons',
          applicant_contact_number: '+91 98480 12345',
          property_owner_name: 'Mohammed Rafi',
          loan_application_id: 'SBI-HL-2026-8891',
          product_loan_type: 'Home Loan',
          property_type: 'residential_house',
          property_holding_type: 'freehold',
          date_of_inspection: '2026-03-20',
          date_of_report: '2026-03-22',
        },
        propertyIdentification: {
          locality_name: 'Jubilee Hills, Road No 36',
          plot_no_flat_no: 'Plot No. 452',
          door_no: '8-2-293/82/A',
          survey_number: 'Sy. No. 120/P',
          district: 'Hyderabad',
          state: 'Telangana',
          pincode: '500033',
        },
        scheduleDetails: {
          east_boundary_docs: '30ft Wide Road',
          west_boundary_docs: 'Plot No 453',
          north_boundary_docs: 'Plot No 451',
          south_boundary_docs: 'Open Land',
          east_boundary_actual: '30ft Wide Road',
          west_boundary_actual: 'Plot No 453',
          north_boundary_actual: 'Plot No 451',
          south_boundary_actual: 'Open Land',
          east_boundary_status: 'Matching',
          west_boundary_status: 'Matching',
          north_boundary_status: 'Matching',
          south_boundary_status: 'Matching',
        },
        landExtentValuations: [
          {
            basis_of_valuation: 'as_per_documents',
            land_extent_sqft: 3600,
            cost_per_sqft: 8500,
            total_value: 30600000,
          }
        ],
        structureValuations: [
          {
            floor_details: 'plinth_area',
            area_sqft: 4200,
            cost_per_sqft: 2800,
            total_value: 11760000,
          }
        ],
        amenityValuations: [
          {
            amenity_name: 'Borewell & Landscaping',
            amenity_value: 750000,
          }
        ],
        finalValuation: {
          final_market_value: 43110000,
          final_guideline_value: 28500000,
          distress_value: 34500000,
          forced_sale_value: 32000000,
          replacement_cost: 12500000,
          valuer_name: 'Er. K. G. N. Associates',
          report_date: '2026-03-22',
        },
        photos: [],
      }
    ];
  }

  // Valuation methods
  getValuations(query = {}) {
    let result = [...this.valuations];
    if (query.search) {
      const q = query.search.toLowerCase();
      result = result.filter(r => 
        (r.report_number && r.report_number.toLowerCase().includes(q)) ||
        (r.institutionDetails?.applicant_name && r.institutionDetails.applicant_name.toLowerCase().includes(q)) ||
        (r.institutionDetails?.bank_name && r.institutionDetails.bank_name.toLowerCase().includes(q)) ||
        (r.propertyIdentification?.locality_name && r.propertyIdentification.locality_name.toLowerCase().includes(q))
      );
    }
    return result;
  }

  getValuationById(id) {
    return this.valuations.find(v => v.id === id || v._id === id);
  }

  createValuation(data) {
    const id = `val_${Date.now()}`;
    const newRecord = {
      id,
      _id: id,
      report_number: `KGN-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft',
      institutionDetails: {},
      propertyIdentification: {},
      scheduleDetails: {},
      infrastructureDetails: {},
      technicalDetails: {},
      landExtentValuations: [],
      structureValuations: [],
      amenityValuations: [],
      finalValuation: {},
      locationDetails: {},
      propertyCharacteristics: {},
      ndmaParameters: {},
      photos: [],
      ...data,
    };
    this.valuations.unshift(newRecord);
    return newRecord;
  }

  updateValuation(id, updates) {
    const index = this.valuations.findIndex(v => v.id === id || v._id === id);
    if (index === -1) return null;
    this.valuations[index] = {
      ...this.valuations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.valuations[index];
  }

  deleteValuation(id) {
    const index = this.valuations.findIndex(v => v.id === id || v._id === id);
    if (index === -1) return false;
    this.valuations.splice(index, 1);
    return true;
  }

  // User methods
  getUserByEmailOrUsername(identifier) {
    const idf = identifier.toLowerCase();
    return this.users.find(u => u.email.toLowerCase() === idf || u.username === identifier);
  }

  getUserById(id) {
    return this.users.find(u => u.id === id || u._id === id);
  }

  createUser(userData) {
    const id = `user_${Date.now()}`;
    const newUser = {
      id,
      _id: id,
      ...userData,
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  getAllUsers() {
    return this.users.map(({ password, ...u }) => u);
  }

  updateUserStatus(id, status) {
    const user = this.users.find(u => u.id === id || u._id === id);
    if (!user) return false;
    user.status = status;
    return true;
  }

  updateUser(id, updates) {
    const user = this.users.find(u => u.id === id || u._id === id);
    if (!user) return null;
    Object.assign(user, updates);
    return user;
  }

  updateValuationStatus(id, status) {
    const val = this.valuations.find(v => v.id === id || v._id === id);
    if (!val) return false;
    val.status = status;
    val.updatedAt = new Date().toISOString();
    return true;
  }

  getAdminStats() {
    const totalEmployees = this.users.length;
    const activeEmployees = this.users.filter(u => u.status !== 'inactive').length;
    const inactiveEmployees = this.users.filter(u => u.status === 'inactive').length;

    const totalReports = this.valuations.length;
    const approvedReports = this.valuations.filter(v => v.status === 'approved' || v.status === 'completed').length;
    const rejectedReports = this.valuations.filter(v => v.status === 'rejected').length;
    const draftReports = this.valuations.filter(v => v.status === 'draft' || v.status === 'in_progress').length;

    const recentReports = [...this.valuations].reverse().slice(0, 8).map(v => ({
      id: v.id || v._id,
      report_number: v.report_number,
      status: v.status || 'completed',
      applicant_name: v.institutionDetails?.applicant_name || 'Client',
      bank_name: v.institutionDetails?.bank_name || 'Bank',
      locality_name: v.propertyIdentification?.locality_name || 'Location',
      final_market_value: v.valuationSummary?.final_market_value || 12500000,
      updated_at: v.updatedAt || v.createdAt || new Date().toISOString(),
    }));

    const recentEmployees = [...this.users].reverse().slice(0, 8).map(u => ({
      id: u.id || u._id,
      username: u.username,
      email: u.email,
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      phone_number: u.phone_number || '',
      role: u.role || 'valuer',
      status: u.status || 'active',
      created_at: u.createdAt || u.created_at || new Date().toISOString(),
    }));

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalReports,
      approvedReports,
      rejectedReports,
      draftReports,
      recentReports,
      recentEmployees,
    };
  }
}

// Global singleton
let memoryStore = global.memoryStore;
if (!memoryStore) {
  memoryStore = global.memoryStore = new MemoryStore();
}

export default memoryStore;
