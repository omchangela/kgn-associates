from django.db import models

class PropertyValuation(models.Model):
    """Main model for property valuation records"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'property_valuation'

class InstitutionDetails(models.Model):
    """Institution and loan application details"""
    valuation = models.OneToOneField(PropertyValuation, on_delete=models.CASCADE, related_name='institution_details')
    
    # Bank/Institution Details
    bank_name = models.CharField(max_length=255, blank=True)
    branch_name = models.CharField(max_length=255, blank=True)
    vendor_engineer_institution_name = models.CharField(max_length=255, blank=True)
    vendor_contact_number = models.CharField(max_length=20, blank=True)
    site_engineer_name = models.CharField(max_length=255, blank=True)
    site_engineer_contact_number = models.CharField(max_length=20, blank=True)
    
    # Loan Application Details
    loan_application_id = models.CharField(max_length=100, blank=True)
    product_loan_type = models.CharField(max_length=100, blank=True)
    applicant_name = models.CharField(max_length=255, blank=True)
    applicant_contact_number = models.CharField(max_length=20, blank=True)
    property_owner_name = models.CharField(max_length=255, blank=True)
    property_owner_contact_number = models.CharField(max_length=20, blank=True)
    person_met_at_site = models.CharField(max_length=255, blank=True)
    person_met_contact_number = models.CharField(max_length=20, blank=True)
    relationship_with_applicant = models.CharField(max_length=100, blank=True)
    
    # Property Details
    property_holding_type = models.CharField(max_length=50, choices=[
        ('freehold', 'Freehold'),
        ('leased', 'Leased'),
        ('development_authority', 'Development Authority'),
    ], blank=True)
    property_type = models.CharField(max_length=50, choices=[
        ('open_plot', 'Open Plot'),
        ('residential_house', 'Residential House'),
        ('commercial', 'Commercial'),
        ('mixed', 'Mixed'),
        ('others', 'Others'),
    ], blank=True)
    property_sub_type = models.CharField(max_length=100, blank=True)
    date_of_inspection = models.DateField(null=True, blank=True)
    date_of_report = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'institution_details'

class VerifiedDocument(models.Model):
    """Verified documents for the property"""
    institution_details = models.ForeignKey(InstitutionDetails, on_delete=models.CASCADE, related_name='verified_documents')
    
    document_type = models.CharField(max_length=100, blank=True)
    document_number = models.CharField(max_length=100, blank=True)
    execution_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    in_favour_of = models.CharField(max_length=255, blank=True)
    approval_authority = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'verified_documents'

class PropertyIdentification(models.Model):
    """Property identification and address details"""
    valuation = models.OneToOneField(PropertyValuation, on_delete=models.CASCADE, related_name='property_identification')
    
    # Addresses
    address_as_per_documents = models.TextField(blank=True)
    address_as_per_actual_site = models.TextField(blank=True)
    address_as_per_plan = models.TextField(blank=True)
    
    # Identification Numbers
    survey_number = models.CharField(max_length=100, blank=True)
    plot_no_flat_no = models.CharField(max_length=100, blank=True)
    lpm_approval_no = models.CharField(max_length=100, blank=True)
    door_no = models.CharField(max_length=100, blank=True)
    assessment_no = models.CharField(max_length=100, blank=True)
    
    # Location Details
    landmark = models.CharField(max_length=255, blank=True)
    locality_name = models.CharField(max_length=255, blank=True)
    grama_polam = models.CharField(max_length=255, blank=True)
    jurisdiction = models.CharField(max_length=255, blank=True)
    taluka = models.CharField(max_length=255, blank=True)
    mandal = models.CharField(max_length=255, blank=True)
    district = models.CharField(max_length=255, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    
    # Approval Details
    layout_plan_available = models.BooleanField(default=True)
    construction_plan_available = models.BooleanField(default=True)
    plan_validity = models.BooleanField(default=True)
    approving_authority = models.CharField(max_length=100, blank=True) # Fixed from BooleanField
    approved_usage = models.CharField(max_length=100, blank=True) # Fixed from BooleanField
    
    class Meta:
        db_table = 'property_identification'

class ScheduleDetails(models.Model):
    """Schedule boundary and construction details"""
    valuation = models.OneToOneField(PropertyValuation, on_delete=models.CASCADE, related_name='schedule_details')
    
    # Boundary Details - As per Documents
    east_boundary_docs = models.CharField(max_length=255, blank=True)
    west_boundary_docs = models.CharField(max_length=255, blank=True)
    north_boundary_docs = models.CharField(max_length=255, blank=True)
    south_boundary_docs = models.CharField(max_length=255, blank=True)
    
    # Boundary Details - As per Actual Visit
    east_boundary_actual = models.CharField(max_length=255, blank=True)
    west_boundary_actual = models.CharField(max_length=255, blank=True)
    north_boundary_actual = models.CharField(max_length=255, blank=True)
    south_boundary_actual = models.CharField(max_length=255, blank=True)
    
    # Boundary Details - As per Plan
    east_boundary_plan = models.CharField(max_length=255, blank=True)
    west_boundary_plan = models.CharField(max_length=255, blank=True)
    north_boundary_plan = models.CharField(max_length=255, blank=True)
    south_boundary_plan = models.CharField(max_length=255, blank=True)
    
    # Boundary Matching Status
    east_boundary_status = models.CharField(max_length=50, blank=True)
    west_boundary_status = models.CharField(max_length=50, blank=True)
    north_boundary_status = models.CharField(max_length=50, blank=True)
    south_boundary_status = models.CharField(max_length=50, blank=True)
    
    # Property Identification Status
    property_identification_status = models.CharField(max_length=50, blank=True)
    
    # Construction Details
    construction_type = models.CharField(max_length=50, choices=[
        ('rcc', 'RCC'),
        ('load_bearing', 'Load Bearing'),
    ], blank=True)
    roof_type = models.CharField(max_length=50, choices=[
        ('flat', 'Flat'),
        ('sloped', 'Sloped'),
    ], blank=True)
    flooring_type = models.CharField(max_length=50, choices=[
        ('marble', 'Marble'),
        ('tiles', 'Tiles'),
    ], blank=True)
    stair_type = models.CharField(max_length=100, blank=True)
    no_of_floors_approved = models.IntegerField(null=True, blank=True)
    no_of_floors_existing = models.IntegerField(null=True, blank=True)
    construction_quality = models.CharField(max_length=100, blank=True)
    maintenance_of_property = models.CharField(max_length=100, blank=True)
    
    # Occupancy Details
    occupancy_status = models.CharField(max_length=50, choices=[
        ('occupied', 'Occupied'),
        ('vacant', 'Vacant'),
    ], blank=True)
    occupant_details = models.TextField(blank=True)
    actual_usage_of_property = models.CharField(max_length=50, choices=[
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
    ], blank=True)
    approved_usage_of_property = models.CharField(max_length=50, choices=[
        ('residential', 'Residential'),
        ('commercial', 'Commercial'),
    ], blank=True)
    class_of_locality = models.CharField(max_length=50, choices=[
        ('prime', 'Prime'),
        ('good', 'Good'),
    ], blank=True)
    number_of_floors = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'schedule_details'

class InfrastructureDetails(models.Model):
    """Infrastructure and utility details"""
    valuation = models.OneToOneField(PropertyValuation, on_delete=models.CASCADE, related_name='infrastructure_details')
    
    land_locked = models.BooleanField(default=True)
    land_locked_description = models.TextField(blank=True)
    number_of_roads = models.IntegerField(null=True, blank=True)
    road_direction = models.CharField(max_length=50, choices=[
        ('north', 'North'),
        ('south', 'South'),
        ('east', 'East'),
        ('west', 'West'),
    ], blank=True)
    type_of_access = models.CharField(max_length=50, choices=[
        ('public', 'Public'),
        ('private', 'Private'),
    ], blank=True)
    road_width_ft = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Utilities
    electricity = models.BooleanField(default=True)
    water = models.BooleanField(default=True)
    drainage_connection = models.BooleanField(default=True)
    number_of_lifts = models.IntegerField(null=True, blank=True)
    
    class Meta:
        db_table = 'infrastructure_details'

class TechnicalDetails(models.Model):
    """Technical building specifications"""
    valuation = models.OneToOneField(PropertyValuation, on_delete=models.CASCADE, related_name='technical_details')
    
    # Building Specifications
    total_built_up_area = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    carpet_area = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    plot_area = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    floor_area_ratio = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ground_coverage = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    setback_front = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    setback_back = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    setback_left = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    setback_right = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Structural Details
    foundation_type = models.CharField(max_length=50, choices=[
        ('shallow', 'Shallow'),
        ('deep', 'Deep'),
        ('pile', 'Pile'),
        ('raft', 'Raft'),
    ], blank=True)
    wall_thickness = models.CharField(max_length=50, choices=[
        ('4-inch', '4 inch'),
        ('6-inch', '6 inch'),
        ('9-inch', '9 inch'),
        ('12-inch', '12 inch'),
    ], blank=True)
    plinth_height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ceiling_height = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    slab_thickness = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    beam_size = models.CharField(max_length=50, blank=True)
    column_size = models.CharField(max_length=50, blank=True)
    
    # Electrical & Plumbing
    electrical_wiring_done = models.BooleanField(default=True)
    plumbing_work_done = models.BooleanField(default=True)
    ac_points_provided = models.BooleanField(default=True)
    fire_fighting_system = models.BooleanField(default=True)
    number_of_electrical_points = models.IntegerField(null=True, blank=True)
    number_of_water_outlets = models.IntegerField(null=True, blank=True)
    
    # Technical Remarks
    technical_assessment = models.TextField(blank=True)
    
    class Meta:
        db_table = 'technical_details'

class LandExtentValuation(models.Model):
    """Land extent valuation details"""
    valuation = models.ForeignKey(PropertyValuation, on_delete=models.CASCADE, related_name='land_extent_valuations')
    
    basis_of_valuation = models.CharField(max_length=100, choices=[
        ('as_per_documents', 'As Per Documents'),
        ('as_per_actual', 'As Per Actual'),
        ('as_per_plan', 'As Per Plan'),
        ('final_selected', 'Final Selected'),
    ])
    land_extent_sqft = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    cost_per_sqft = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    total_value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    
    class Meta:
        db_table = 'land_extent_valuation'

class StructureValuation(models.Model):
    """Structure valuation details"""
    valuation = models.ForeignKey(PropertyValuation, on_delete=models.CASCADE, related_name='structure_valuations')
    
    floor_details = models.CharField(max_length=100, choices=[
        ('plinth_area', 'Plinth Area'),
        ('built_up_area', 'Built Up Area'),
        ('super_built', 'Super Built'),
    ])
    area_sqft = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    recommendation_of_funding = models.CharField(max_length=50, blank=True)
    cost_per_sqft = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    total_value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    
    class Meta:
        db_table = 'structure_valuation'

class AmenityValuation(models.Model):
    """Amenities valuation details"""
    valuation = models.ForeignKey(PropertyValuation, on_delete=models.CASCADE, related_name='amenity_valuations')
    
    amenity_name = models.CharField(max_length=255)
    amenity_value = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    
    class Meta:
        db_table = 'amenity_valuation'

class PropertyMarketValue(models.Model):
    """Property market value assessment"""
    valuation = models.OneToOneField(PropertyValuation, on_delete=models.CASCADE, related_name='property_market_value')
    
    class Meta:
        db_table = 'property_market_value'

class GuidelineValue(models.Model):
    """Property guideline value assessment"""
    valuation = models.OneToOneField(PropertyValuation, on_delete=models.CASCADE, related_name='guideline_value')
    
    class Meta:
        db_table = 'guideline_value'

class FinalValuation(models.Model):
    """Final valuation summary"""
    valuation = models.OneToOneField(PropertyValuation, on_delete=models.CASCADE, related_name='final_valuation')
    
    # Valuation Summary
    property_type = models.CharField(max_length=100, blank=True)
    property_use = models.CharField(max_length=100, blank=True)
    valuation_purpose = models.CharField(max_length=100, blank=True)
    valuation_date = models.DateField(null=True, blank=True)
    
    # Final Values
    final_market_value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    final_guideline_value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    distress_value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    forced_sale_value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    replacement_cost = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    depreciated_cost = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    
    # Valuation Certificates
    certificate_issued = models.BooleanField(default=True)
    report_certified = models.BooleanField(default=True)
    photographs_attached = models.BooleanField(default=True)
    documents_verified = models.BooleanField(default=True)
    
    # Valuer Details
    valuer_name = models.CharField(max_length=255, blank=True)
    valuer_license_no = models.CharField(max_length=100, blank=True)
    report_date = models.DateField(null=True, blank=True)
    valuer_remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'final_valuation'

class LocationDetails(models.Model):
    """GPS and location coordinates"""
    valuation = models.OneToOneField(PropertyValuation, on_delete=models.CASCADE, related_name='location_details')
    
    # GPS Coordinates
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    # Manual GPS Coordinates
    manual_latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    manual_longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    
    class Meta:
        db_table = 'location_details'

class PropertyCharacteristics(models.Model):
    """Property characteristics and specifications"""
    valuation = models.OneToOneField(PropertyValuation, on_delete=models.CASCADE, related_name='property_characteristics')
    
    # Basic Property Characteristics
    joint_wall_direction = models.CharField(max_length=50, blank=True)
    joint_slab_direction = models.CharField(max_length=50, blank=True)
    fsi = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    nearest_railway_station_km = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    nearest_bus_station_km = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    nearest_connecting_road_km = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    valuation_methodology = models.CharField(max_length=50, choices=[
        ('market', 'Market Comparison'),
        ('income', 'Income Approach'),
        ('cost', 'Cost Approach'),
    ], blank=True)
    risk_of_demolition = models.CharField(max_length=50, choices=[
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ], blank=True)
    distance_from_city_centre_km = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    distance_from_branch_km = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Additional Characteristics
    negative_area_as_per_local = models.BooleanField(default=False)
    development_of_vicinity = models.CharField(max_length=50, choices=[
        ('developing', 'Developing'),
        ('developed', 'Fully Developed'),
        ('underdeveloped', 'Underdeveloped'),
    ], blank=True)
    habitation_around_property_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    availability_of_local_transport = models.CharField(max_length=50, choices=[
        ('good', 'Good'),
        ('average', 'Average'),
        ('poor', 'Poor'),
    ], blank=True)
    level_of_land = models.CharField(max_length=50, choices=[
        ('flat', 'Flat'),
        ('sloped', 'Sloped'),
        ('hilly', 'Hilly'),
        ('undulating', 'Undulating'),
    ], blank=True)
    setback_deviation_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    vertical_deviation = models.CharField(max_length=100, blank=True)
    structure_confirming_to_safety = models.BooleanField(default=True)
    others_remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'property_characteristics'

class NDMAParameters(models.Model):
    """NDMA (National Disaster Management Authority) parameters"""
    valuation = models.OneToOneField(PropertyValuation, on_delete=models.CASCADE, related_name='ndma_parameters')
    
    # Building/Structure Details
    nature_of_building = models.CharField(max_length=100, blank=True)
    shape_of_building = models.CharField(max_length=50, choices=[
        ('regular', 'Regular'),
        ('irregular', 'Irregular'),
        ('l-shape', 'L-Shape'),
        ('t-shape', 'T-Shape'),
    ], blank=True)
    concrete_grade = models.CharField(max_length=50, blank=True)
    roof_type = models.CharField(max_length=50, choices=[
        ('mtr', 'MTR'),
        ('flat', 'Flat RCC'),
        ('sloped', 'Sloped'),
        ('sheet', 'Sheet'),
    ], blank=True)
    soil_strata = models.CharField(max_length=50, choices=[
        ('hard', 'Hard'),
        ('medium', 'Medium'),
        ('soft', 'Soft'),
    ], blank=True)
    seismic_zone = models.CharField(max_length=50, choices=[
        ('zone2', 'Zone II'),
        ('zone3', 'Zone III'),
        ('zone4', 'Zone IV'),
        ('zone5', 'Zone V'),
    ], blank=True)
    
    class Meta:
        db_table = 'ndma_parameters'

class PropertyPhoto(models.Model):
    """Property photos with geo-location metadata for PDF stamping"""
    valuation = models.ForeignKey(PropertyValuation, on_delete=models.CASCADE, related_name='photos')
    
    photo = models.ImageField(upload_to='property_photos/')
    description = models.CharField(max_length=255, blank=True)
    latitude = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    longitude = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    locality = models.CharField(max_length=255, blank=True)
    region = models.CharField(max_length=100, blank=True)
    bearing_degrees = models.CharField(max_length=10, blank=True)
    bearing_direction = models.CharField(max_length=5, blank=True)
    captured_at = models.DateTimeField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'property_photos'