from django.contrib import admin
from .models import (
    PropertyValuation, InstitutionDetails, VerifiedDocument, PropertyIdentification,
    ScheduleDetails, InfrastructureDetails, TechnicalDetails, LandExtentValuation,
    StructureValuation, AmenityValuation, PropertyMarketValue, GuidelineValue,
    FinalValuation, LocationDetails, PropertyCharacteristics, NDMAParameters,
    PropertyPhoto
)

@admin.register(PropertyValuation)
class PropertyValuationAdmin(admin.ModelAdmin):
    list_display = ['id', 'created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(InstitutionDetails)
class InstitutionDetailsAdmin(admin.ModelAdmin):
    list_display = ['id', 'bank_name', 'branch_name', 'loan_application_id']
    search_fields = ['bank_name', 'branch_name', 'loan_application_id']

@admin.register(VerifiedDocument)
class VerifiedDocumentAdmin(admin.ModelAdmin):
    list_display = ['id', 'document_type', 'document_number', 'execution_date']
    search_fields = ['document_type', 'document_number']

@admin.register(PropertyIdentification)
class PropertyIdentificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'survey_number', 'plot_no_flat_no', 'district', 'state']
    search_fields = ['survey_number', 'plot_no_flat_no', 'district', 'state']

@admin.register(ScheduleDetails)
class ScheduleDetailsAdmin(admin.ModelAdmin):
    list_display = ['id', 'construction_type', 'roof_type', 'no_of_floors_approved']
    list_filter = ['construction_type', 'roof_type', 'occupancy_status']

@admin.register(InfrastructureDetails)
class InfrastructureDetailsAdmin(admin.ModelAdmin):
    list_display = ['id', 'land_locked', 'number_of_roads', 'electricity', 'water']
    list_filter = ['land_locked', 'electricity', 'water', 'drainage_connection']

@admin.register(TechnicalDetails)
class TechnicalDetailsAdmin(admin.ModelAdmin):
    list_display = ['id', 'total_built_up_area', 'carpet_area', 'plot_area', 'foundation_type']
    list_filter = ['foundation_type', 'wall_thickness', 'electrical_wiring_done']

@admin.register(LandExtentValuation)
class LandExtentValuationAdmin(admin.ModelAdmin):
    list_display = ['id', 'basis_of_valuation', 'land_extent_sqft', 'cost_per_sqft', 'total_value']
    list_filter = ['basis_of_valuation']

@admin.register(StructureValuation)
class StructureValuationAdmin(admin.ModelAdmin):
    list_display = ['id', 'floor_details', 'area_sqft', 'cost_per_sqft', 'total_value']
    list_filter = ['floor_details']

@admin.register(AmenityValuation)
class AmenityValuationAdmin(admin.ModelAdmin):
    list_display = ['id', 'amenity_name', 'amenity_value']
    search_fields = ['amenity_name']

@admin.register(PropertyMarketValue)
class PropertyMarketValueAdmin(admin.ModelAdmin):
    list_display = ['id']

@admin.register(GuidelineValue)
class GuidelineValueAdmin(admin.ModelAdmin):
    list_display = ['id']

@admin.register(FinalValuation)
class FinalValuationAdmin(admin.ModelAdmin):
    list_display = ['id', 'property_type', 'property_use', 'valuation_purpose', 'final_market_value']
    search_fields = ['property_type', 'property_use', 'valuation_purpose']
    list_filter = ['certificate_issued', 'report_certified', 'photographs_attached']

@admin.register(LocationDetails)
class LocationDetailsAdmin(admin.ModelAdmin):
    list_display = ['id', 'latitude', 'longitude']

@admin.register(PropertyCharacteristics)
class PropertyCharacteristicsAdmin(admin.ModelAdmin):
    list_display = ['id', 'valuation_methodology', 'risk_of_demolition', 'development_of_vicinity']
    list_filter = ['valuation_methodology', 'risk_of_demolition', 'development_of_vicinity']

@admin.register(NDMAParameters)
class NDMAParametersAdmin(admin.ModelAdmin):
    list_display = ['id', 'nature_of_building', 'shape_of_building', 'concrete_grade', 'seismic_zone']
    list_filter = ['shape_of_building', 'roof_type', 'soil_strata', 'seismic_zone']

@admin.register(PropertyPhoto)
class PropertyPhotoAdmin(admin.ModelAdmin):
    list_display = ['id', 'description', 'uploaded_at']
    search_fields = ['description']