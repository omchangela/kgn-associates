from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView, UserProfileView,
    PropertyValuationViewSet, InstitutionDetailsViewSet, VerifiedDocumentViewSet,
    PropertyIdentificationViewSet, ScheduleDetailsViewSet, InfrastructureDetailsViewSet,
    TechnicalDetailsViewSet, LandExtentValuationViewSet, StructureValuationViewSet,
    AmenityValuationViewSet, PropertyMarketValueViewSet, GuidelineValueViewSet,
    FinalValuationViewSet, LocationDetailsViewSet, PropertyCharacteristicsViewSet,
    NDMAParametersViewSet, PropertyPhotoViewSet, generate_pdf
)

router = DefaultRouter()
router.register(r'valuations', PropertyValuationViewSet, basename='propertyvaluation')
router.register(r'institution-details', InstitutionDetailsViewSet, basename='institutiondetails')
router.register(r'verified-documents', VerifiedDocumentViewSet, basename='verifieddocument')
router.register(r'property-identification', PropertyIdentificationViewSet, basename='propertyidentification')
router.register(r'schedule-details', ScheduleDetailsViewSet, basename='scheduledetails')
router.register(r'infrastructure-details', InfrastructureDetailsViewSet, basename='infrastructuredetails')
router.register(r'technical-details', TechnicalDetailsViewSet, basename='technicaldetails')
router.register(r'land-extent-valuation', LandExtentValuationViewSet, basename='landextentvaluation')
router.register(r'structure-valuation', StructureValuationViewSet, basename='structurevaluation')
router.register(r'amenity-valuation', AmenityValuationViewSet, basename='amenityvaluation')
router.register(r'property-market-value', PropertyMarketValueViewSet, basename='propertymarketvalue')
router.register(r'guideline-value', GuidelineValueViewSet, basename='guidelinevalue')
router.register(r'final-valuation', FinalValuationViewSet, basename='finalvaluation')
router.register(r'location-details', LocationDetailsViewSet, basename='locationdetails')
router.register(r'property-characteristics', PropertyCharacteristicsViewSet, basename='propertycharacteristics')
router.register(r'ndma-parameters', NDMAParametersViewSet, basename='ndmaparameters')
router.register(r'photos', PropertyPhotoViewSet, basename='propertyphoto')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/profile/', UserProfileView.as_view(), name='profile'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('valuations/<int:pk>/generate-pdf/', generate_pdf, name='generate_pdf'),
]