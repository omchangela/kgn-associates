from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth.models import User
from django.http import HttpResponse
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle # Added missing ParagraphStyle

from .pdf_helpers import build_letterhead, add_photo_grid

from .models import (
    PropertyValuation, InstitutionDetails, VerifiedDocument, PropertyIdentification,
    ScheduleDetails, InfrastructureDetails, TechnicalDetails, LandExtentValuation,
    StructureValuation, AmenityValuation, PropertyMarketValue, GuidelineValue,
    FinalValuation, LocationDetails, PropertyCharacteristics, NDMAParameters,
    PropertyPhoto
)

from .serializers import (
    UserSerializer, RegisterSerializer, CustomTokenObtainPairSerializer,
    PropertyValuationSerializer, PropertyValuationDetailSerializer,
    InstitutionDetailsSerializer, VerifiedDocumentSerializer,
    PropertyIdentificationSerializer, ScheduleDetailsSerializer,
    InfrastructureDetailsSerializer, TechnicalDetailsSerializer,
    LandExtentValuationSerializer, StructureValuationSerializer,
    AmenityValuationSerializer, PropertyMarketValueSerializer,
    GuidelineValueSerializer, FinalValuationSerializer,
    LocationDetailsSerializer, PropertyCharacteristicsSerializer,
    NDMAParametersSerializer, PropertyPhotoSerializer
)

class RegisterView(generics.CreateAPIView):
    """API view for user registration"""
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom JWT token obtain view with user data"""
    serializer_class = CustomTokenObtainPairSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    """API view for retrieving and updating user profile"""
    queryset = User.objects.all()
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer
    
    def get_object(self):
        return self.request.user

class PropertyValuationViewSet(viewsets.ModelViewSet):
    """ViewSet for PropertyValuation model with nested operations"""
    queryset = PropertyValuation.objects.all()
    serializer_class = PropertyValuationSerializer
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return PropertyValuationDetailSerializer
        return PropertyValuationSerializer
    
    @action(detail=True, methods=['get'])
    def full_details(self, request, pk=None):
        valuation = self.get_object()
        serializer = PropertyValuationDetailSerializer(valuation)
        return Response(serializer.data)
    
    def _update_related(self, request, pk, model_class, serializer_class):
        valuation = self.get_object()
        instance, _ = model_class.objects.get_or_create(valuation=valuation)
        serializer = serializer_class(instance, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def update_institution_details(self, request, pk=None):
        return self._update_related(request, pk, InstitutionDetails, InstitutionDetailsSerializer)

    @action(detail=True, methods=['post'])
    def update_property_identification(self, request, pk=None):
        return self._update_related(request, pk, PropertyIdentification, PropertyIdentificationSerializer)

    @action(detail=True, methods=['post'])
    def update_schedule_details(self, request, pk=None):
        return self._update_related(request, pk, ScheduleDetails, ScheduleDetailsSerializer)

    @action(detail=True, methods=['post'])
    def update_infrastructure_details(self, request, pk=None):
        return self._update_related(request, pk, InfrastructureDetails, InfrastructureDetailsSerializer)

    @action(detail=True, methods=['post'])
    def update_technical_details(self, request, pk=None):
        return self._update_related(request, pk, TechnicalDetails, TechnicalDetailsSerializer)

    @action(detail=True, methods=['post'])
    def update_final_valuation(self, request, pk=None):
        return self._update_related(request, pk, FinalValuation, FinalValuationSerializer)

    @action(detail=True, methods=['post'])
    def update_location_details(self, request, pk=None):
        return self._update_related(request, pk, LocationDetails, LocationDetailsSerializer)

    @action(detail=True, methods=['post'])
    def update_property_characteristics(self, request, pk=None):
        return self._update_related(request, pk, PropertyCharacteristics, PropertyCharacteristicsSerializer)

    @action(detail=True, methods=['post'])
    def update_ndma_parameters(self, request, pk=None):
        return self._update_related(request, pk, NDMAParameters, NDMAParametersSerializer)
    
    @action(detail=True, methods=['post'])
    def add_land_extent_valuation(self, request, pk=None):
        valuation = self.get_object()
        serializer = LandExtentValuationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(valuation=valuation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_structure_valuation(self, request, pk=None):
        valuation = self.get_object()
        serializer = StructureValuationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(valuation=valuation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_amenity_valuation(self, request, pk=None):
        valuation = self.get_object()
        serializer = AmenityValuationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(valuation=valuation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_verified_document(self, request, pk=None):
        valuation = self.get_object()
        institution_details, created = InstitutionDetails.objects.get_or_create(valuation=valuation)
        serializer = VerifiedDocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(institution_details=institution_details)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_photo(self, request, pk=None):
        valuation = self.get_object()
        serializer = PropertyPhotoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(valuation=valuation)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class InstitutionDetailsViewSet(viewsets.ModelViewSet):
    queryset = InstitutionDetails.objects.all()
    serializer_class = InstitutionDetailsSerializer

class VerifiedDocumentViewSet(viewsets.ModelViewSet):
    queryset = VerifiedDocument.objects.all()
    serializer_class = VerifiedDocumentSerializer

class PropertyIdentificationViewSet(viewsets.ModelViewSet):
    queryset = PropertyIdentification.objects.all()
    serializer_class = PropertyIdentificationSerializer

class ScheduleDetailsViewSet(viewsets.ModelViewSet):
    queryset = ScheduleDetails.objects.all()
    serializer_class = ScheduleDetailsSerializer

class InfrastructureDetailsViewSet(viewsets.ModelViewSet):
    queryset = InfrastructureDetails.objects.all()
    serializer_class = InfrastructureDetailsSerializer

class TechnicalDetailsViewSet(viewsets.ModelViewSet):
    queryset = TechnicalDetails.objects.all()
    serializer_class = TechnicalDetailsSerializer

class LandExtentValuationViewSet(viewsets.ModelViewSet):
    queryset = LandExtentValuation.objects.all()
    serializer_class = LandExtentValuationSerializer

class StructureValuationViewSet(viewsets.ModelViewSet):
    queryset = StructureValuation.objects.all()
    serializer_class = StructureValuationSerializer

class AmenityValuationViewSet(viewsets.ModelViewSet):
    queryset = AmenityValuation.objects.all()
    serializer_class = AmenityValuationSerializer

class PropertyMarketValueViewSet(viewsets.ModelViewSet):
    queryset = PropertyMarketValue.objects.all()
    serializer_class = PropertyMarketValueSerializer

class GuidelineValueViewSet(viewsets.ModelViewSet):
    queryset = GuidelineValue.objects.all()
    serializer_class = GuidelineValueSerializer

class FinalValuationViewSet(viewsets.ModelViewSet):
    queryset = FinalValuation.objects.all()
    serializer_class = FinalValuationSerializer

class LocationDetailsViewSet(viewsets.ModelViewSet):
    queryset = LocationDetails.objects.all()
    serializer_class = LocationDetailsSerializer

class PropertyCharacteristicsViewSet(viewsets.ModelViewSet):
    queryset = PropertyCharacteristics.objects.all()
    serializer_class = PropertyCharacteristicsSerializer

class NDMAParametersViewSet(viewsets.ModelViewSet):
    queryset = NDMAParameters.objects.all()
    serializer_class = NDMAParametersSerializer

class PropertyPhotoViewSet(viewsets.ModelViewSet):
    queryset = PropertyPhoto.objects.all()
    serializer_class = PropertyPhotoSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def generate_pdf(request, pk):
    """Generate PDF for property valuation with professional UI design"""
    try:
        valuation = PropertyValuation.objects.get(pk=pk)
        serializer = PropertyValuationDetailSerializer(valuation)
        data = serializer.data

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="property_valuation_{pk}.pdf"'

        doc = SimpleDocTemplate(response, pagesize=letter, 
                               rightMargin=30, leftMargin=30, 
                               topMargin=40, bottomMargin=40)
        styles = getSampleStyleSheet()
        story = []

        # Custom styles for professional look
        styles.add(ParagraphStyle(name='CustomHeader',
                                  parent=styles['Heading1'],
                                  fontSize=18,
                                  textColor=colors.HexColor('#2C3E50'),
                                  spaceAfter=20,
                                  alignment=1))
        
        styles.add(ParagraphStyle(name='SectionHeader',
                                  parent=styles['Heading2'],
                                  fontSize=14,
                                  textColor=colors.HexColor('#3498DB'),
                                  spaceBefore=20,
                                  spaceAfter=10))
        
        styles.add(ParagraphStyle(name='SubSectionHeader',
                                  parent=styles['Heading3'],
                                  fontSize=12,
                                  textColor=colors.HexColor('#2980B9'),
                                  spaceBefore=15,
                                  spaceAfter=8))

        # Official letterhead
        build_letterhead(story, styles)

        report_title = Paragraph(
            f'<b>Property Valuation Report</b> &nbsp;|&nbsp; Valuation ID: {pk} &nbsp;|&nbsp; Date: {datetime.now().strftime("%d-%m-%Y")}',
            ParagraphStyle('ReportTitle', parent=styles['Normal'], fontSize=11, alignment=1, spaceAfter=16),
        )
        story.append(report_title)

        # Helper function to create styled tables
        def create_styled_table(data_rows, col_widths=[180, 320], header_color='#3498DB'):
            table = Table(data_rows, colWidths=col_widths)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor(header_color)),
                ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (0, -1), 10),
                ('ALIGN', (0, 0), (0, -1), 'LEFT'),
                ('VALIGN', (0, 0), (0, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 0), (0, -1), 10),
                ('TOPPADDING', (0, 0), (0, -1), 10),
                ('LEFTPADDING', (0, 0), (0, -1), 8),
                ('RIGHTPADDING', (0, 0), (0, -1), 8),
                ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#F8F9FA')),
                ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
                ('FONTSIZE', (1, 0), (1, -1), 9),
                ('VALIGN', (1, 0), (1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (1, 0), (1, -1), 8),
                ('TOPPADDING', (1, 0), (1, -1), 8),
                ('LEFTPADDING', (1, 0), (1, -1), 8),
                ('RIGHTPADDING', (1, 0), (1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
            ]))
            return table

        # Institution Details
        if data.get('institution_details'):
            try:
                inst = data['institution_details']
                story.append(Paragraph("Institution Details", styles['SectionHeader']))
                
                story.append(Paragraph("Bank Information", styles['SubSectionHeader']))
                inst_data = [
                    ['Bank Name', str(inst.get('bank_name') or '')],
                    ['Branch Name', str(inst.get('branch_name') or '')],
                    ['Vendor Name', str(inst.get('vendor_engineer_institution_name') or '')],
                    ['Contact Number', str(inst.get('vendor_contact_number') or '')],
                ]
                story.append(create_styled_table(inst_data, header_color='#3498DB'))
                story.append(Spacer(1, 10))
                
                story.append(Paragraph("Site Engineer Details", styles['SubSectionHeader']))
                engineer_data = [
                    ['Site Engineer Name', str(inst.get('site_engineer_name') or '')],
                    ['Site Engineer Contact', str(inst.get('site_engineer_contact_number') or '')],
                ]
                story.append(create_styled_table(engineer_data, header_color='#3498DB'))
                story.append(Spacer(1, 10))
                
                story.append(Paragraph("Loan Application Details", styles['SubSectionHeader']))
                loan_data = [
                    ['Loan Application ID', str(inst.get('loan_application_id') or '')],
                    ['Product/Loan Type', str(inst.get('product_loan_type') or '')],
                    ['Applicant Name', str(inst.get('applicant_name') or '')],
                    ['Applicant Contact', str(inst.get('applicant_contact_number') or '')],
                    ['Property Owner Name', str(inst.get('property_owner_name') or '')],
                    ['Owner Contact', str(inst.get('property_owner_contact_number') or '')],
                    ['Person Met At Site', str(inst.get('person_met_at_site') or '')],
                    ['Contact Number', str(inst.get('person_met_contact_number') or '')],
                    ['Relationship', str(inst.get('relationship_with_applicant') or '')],
                ]
                story.append(create_styled_table(loan_data, header_color='#3498DB'))
                story.append(Spacer(1, 10))
                
                story.append(Paragraph("Property Information", styles['SubSectionHeader']))
                prop_data = [
                    ['Property Holding Type', str(inst.get('property_holding_type') or '')],
                    ['Property Type', str(inst.get('property_type') or '')],
                    ['Property Sub Type', str(inst.get('property_sub_type') or '')],
                    ['Date Of Inspection', str(inst.get('date_of_inspection') or '')],
                    ['Date Of Report', str(inst.get('date_of_report') or '')],
                ]
                story.append(create_styled_table(prop_data, header_color='#3498DB'))
                story.append(Spacer(1, 12))
            except Exception as e:
                story.append(Paragraph(f"Error in Institution Details: {str(e)}", styles['Normal']))

        # Property Identification
        if data.get('property_identification'):
            prop = data['property_identification']
            story.append(Paragraph("Property Identification", styles['SectionHeader']))
            
            story.append(Paragraph("Address Information", styles['SubSectionHeader']))
            address_data = [
                ['Address (Documents)', prop.get('address_as_per_documents', '')],
                ['Address (Actual)', prop.get('address_as_per_actual_site', '')],
                ['Address (Plan)', prop.get('address_as_per_plan', '')],
            ]
            story.append(create_styled_table(address_data, header_color='#27AE60'))
            story.append(Spacer(1, 10))
            
            story.append(Paragraph("Property Details", styles['SubSectionHeader']))
            prop_details = [
                ['Survey Number', prop.get('survey_number', '')],
                ['Plot/Flat No', prop.get('plot_no_flat_no', '')],
                ['LPM/Approval No', prop.get('lpm_approval_no', '')],
                ['Door No', prop.get('door_no', '')],
                ['Assessment No', prop.get('assessment_no', '')],
                ['Landmark', prop.get('landmark', '')],
                ['Locality Name', prop.get('locality_name', '')],
                ['Grama Polam', prop.get('grama_polam', '')],
                ['Jurisdiction', prop.get('jurisdiction', '')],
                ['Taluka', prop.get('taluka', '')],
                ['Mandal', prop.get('mandal', '')],
                ['District', prop.get('district', '')],
                ['State', prop.get('state', '')],
                ['Pincode', prop.get('pincode', '')],
            ]
            story.append(create_styled_table(prop_details, header_color='#27AE60'))
            story.append(Spacer(1, 10))
            
            story.append(Paragraph("Approval Details", styles['SubSectionHeader']))
            approval_data = [
                ['Layout Plan Available', 'Yes' if prop.get('layout_plan_available') else 'No'],
                ['Construction Plan Available', 'Yes' if prop.get('construction_plan_available') else 'No'],
                ['Plan Validity', 'Yes' if prop.get('plan_validity') else 'No'],
                ['Approving Authority', prop.get('approving_authority', '')],
                ['Approved Usage', prop.get('approved_usage', '')],
            ]
            story.append(create_styled_table(approval_data, header_color='#27AE60'))
            story.append(Spacer(1, 12))

        # Schedule Details
        if data.get('schedule_details'):
            sched = data['schedule_details']
            story.append(Paragraph("Schedule Details", styles['SectionHeader']))
            
            story.append(Paragraph("Boundary Measurements", styles['SubSectionHeader']))
            boundary_data = [
                ['East (Documents)', sched.get('east_as_per_documents', '')],
                ['West (Documents)', sched.get('west_as_per_documents', '')],
                ['North (Documents)', sched.get('north_as_per_documents', '')],
                ['South (Documents)', sched.get('south_as_per_documents', '')],
            ]
            story.append(create_styled_table(boundary_data, header_color='#E67E22'))
            story.append(Spacer(1, 10))
            
            story.append(Paragraph("Construction Details", styles['SubSectionHeader']))
            construction_data = [
                ['Construction Type', sched.get('construction_type', '')],
                ['Roof Type', sched.get('roof_type', '')],
                ['Flooring Type', sched.get('flooring_type', '')],
                ['Stair Type', sched.get('stair_type', '')],
                ['No. of Floors Approved', str(sched.get('no_of_floors_approved', ''))],
                ['No. of Floors Existing', str(sched.get('no_of_floors_existing', ''))],
                ['Construction Quality', sched.get('construction_quality', '')],
                ['Maintenance of Property', sched.get('maintenance_of_property', '')],
            ]
            story.append(create_styled_table(construction_data, header_color='#E67E22'))
            story.append(Spacer(1, 10))
            
            story.append(Paragraph("Occupancy Details", styles['SubSectionHeader']))
            occupancy_data = [
                ['Occupancy Status', sched.get('occupancy_status', '')],
                ['Occupant Details', sched.get('occupant_details', '')],
                ['Actual Usage of Property', sched.get('actual_usage_of_property', '')],
                ['Approved Usage of Property', sched.get('approved_usage_of_property', '')],
                ['Class of Locality', sched.get('class_of_locality', '')],
            ]
            story.append(create_styled_table(occupancy_data, header_color='#E67E22'))
            story.append(Spacer(1, 12))

        # Infrastructure Details
        if data.get('infrastructure_details'):
            infra = data['infrastructure_details']
            story.append(Paragraph("Infrastructure Details", styles['SectionHeader']))
            
            infra_data = [
                ['Land Locked', 'Yes' if infra.get('land_locked') else 'No'],
                ['Description', infra.get('land_locked_description', '')],
                ['Number of Roads', str(infra.get('number_of_roads', ''))],
                ['Direction', infra.get('road_direction', '')],
                ['Type of Access', infra.get('type_of_access', '')],
                ['Road Width (ft)', str(infra.get('road_width_ft', ''))],
                ['Electricity', 'Yes' if infra.get('electricity') else 'No'],
                ['Water', 'Yes' if infra.get('water') else 'No'],
                ['Drainage Connection', 'Yes' if infra.get('drainage_connection') else 'No'],
                ['Number of Lifts', str(infra.get('number_of_lifts', ''))],
            ]
            story.append(create_styled_table(infra_data, header_color='#9B59B6'))
            story.append(Spacer(1, 12))

        # Technical Details
        if data.get('technical_details'):
            tech = data['technical_details']
            story.append(Paragraph("Technical Details", styles['SectionHeader']))
            
            story.append(Paragraph("Building Specifications", styles['SubSectionHeader']))
            building_data = [
                ['Total Built-up Area', str(tech.get('total_built_up_area', ''))],
                ['Carpet Area', str(tech.get('carpet_area', ''))],
                ['Plot Area', str(tech.get('plot_area', ''))],
                ['Floor Area Ratio (FAR)', str(tech.get('floor_area_ratio', ''))],
                ['Ground Coverage', str(tech.get('ground_coverage', ''))],
                ['Setback Front', str(tech.get('setback_front', ''))],
                ['Setback Back', str(tech.get('setback_back', ''))],
                ['Setback Left', str(tech.get('setback_left', ''))],
                ['Setback Right', str(tech.get('setback_right', ''))],
            ]
            story.append(create_styled_table(building_data, header_color='#16A085'))
            story.append(Spacer(1, 10))
            
            story.append(Paragraph("Structural Details", styles['SubSectionHeader']))
            structural_data = [
                ['Foundation Type', tech.get('foundation_type', '')],
                ['Wall Thickness', tech.get('wall_thickness', '')],
                ['Plinth Height', str(tech.get('plinth_height', ''))],
                ['Ceiling Height', str(tech.get('ceiling_height', ''))],
                ['Slab Thickness', str(tech.get('slab_thickness', ''))],
                ['Beam Size', tech.get('beam_size', '')],
                ['Column Size', tech.get('column_size', '')],
            ]
            story.append(create_styled_table(structural_data, header_color='#16A085'))
            story.append(Spacer(1, 10))
            
            story.append(Paragraph("Electrical & Plumbing", styles['SubSectionHeader']))
            electrical_data = [
                ['Electrical Wiring Done', 'Yes' if tech.get('electrical_wiring_done') else 'No'],
                ['Plumbing Work Done', 'Yes' if tech.get('plumbing_work_done') else 'No'],
                ['AC Points Provided', 'Yes' if tech.get('ac_points_provided') else 'No'],
                ['Fire Fighting System', 'Yes' if tech.get('fire_fighting_system') else 'No'],
                ['Number of Electrical Points', str(tech.get('number_of_electrical_points', ''))],
                ['Number of Water Outlets', str(tech.get('number_of_water_outlets', ''))],
            ]
            story.append(create_styled_table(electrical_data, header_color='#16A085'))
            story.append(Spacer(1, 12))

        # Land Extent Valuations
        if data.get('land_extent_valuations'):
            land_rows = data['land_extent_valuations']
            if land_rows:
                story.append(Paragraph("Land Extent Valuation", styles['SectionHeader']))
                table_data = [['Basis', 'Land Extent (Sqft)', 'Cost/Sqft', 'Total Value']]
                for row in land_rows:
                    table_data.append([
                        str(row.get('basis_of_valuation', '')),
                        str(row.get('land_extent_sqft', '')),
                        str(row.get('cost_per_sqft', '')),
                        str(row.get('total_value', '')),
                    ])
                story.append(Table(table_data, colWidths=[120, 120, 120, 120]))
                story.append(Spacer(1, 12))

        # Structure Valuations
        if data.get('structure_valuations'):
            struct_rows = data['structure_valuations']
            if struct_rows:
                story.append(Paragraph("Structure Valuation", styles['SectionHeader']))
                table_data = [['Floor Details', 'Area (Sqft)', 'Funding %', 'Cost/Sqft', 'Total Value']]
                for row in struct_rows:
                    table_data.append([
                        str(row.get('floor_details', '')),
                        str(row.get('area_sqft', '')),
                        str(row.get('recommendation_of_funding', '')),
                        str(row.get('cost_per_sqft', '')),
                        str(row.get('total_value', '')),
                    ])
                story.append(Table(table_data, colWidths=[100, 90, 90, 90, 90]))
                story.append(Spacer(1, 12))

        # Amenity Valuations
        if data.get('amenity_valuations'):
            amenity_rows = data['amenity_valuations']
            if amenity_rows:
                story.append(Paragraph("Amenities Valuation", styles['SectionHeader']))
                table_data = [['Description', 'Amount']]
                for row in amenity_rows:
                    table_data.append([
                        str(row.get('amenity_name', '')),
                        str(row.get('amenity_value', '')),
                    ])
                story.append(create_styled_table(table_data, col_widths=[300, 200], header_color='#F39C12'))
                story.append(Spacer(1, 12))

        # Property Market Value
        if data.get('property_market_value'):
            market = data['property_market_value']
            story.append(Paragraph("Property Market Value", styles['SectionHeader']))
            market_data = [
                ['Total Market Value', str(market.get('total_market_value', ''))],
                ['Total Guideline Value', str(market.get('total_guideline_value', ''))],
            ]
            story.append(create_styled_table(market_data, header_color='#F39C12'))
            story.append(Spacer(1, 12))

        # Guideline Value
        if data.get('guideline_value'):
            guide = data['guideline_value']
            story.append(Paragraph("Guideline Value", styles['SectionHeader']))
            guide_data = [
                ['Total Guideline Value', str(guide.get('total_guideline_value', ''))],
            ]
            story.append(create_styled_table(guide_data, header_color='#F39C12'))
            story.append(Spacer(1, 12))

        # Final Valuation
        if data.get('final_valuation'):
            final = data['final_valuation']
            story.append(Paragraph("Final Valuation", styles['SectionHeader']))
            final_data = [
                ['Property Type', final.get('property_type', '')],
                ['Property Use', final.get('property_use', '')],
                ['Valuation Purpose', final.get('valuation_purpose', '')],
                ['Final Market Value', str(final.get('final_market_value', ''))],
                ['Final Guideline Value', str(final.get('final_guideline_value', ''))],
                ['Distress Value', str(final.get('distress_value', ''))],
                ['Valuation Date', final.get('valuation_date', '')],
                ['Valuer Name', final.get('valuer_name', '')],
                ['Valuer License No', final.get('valuer_license_no', '')],
            ]
            story.append(create_styled_table(final_data, header_color='#C0392B'))
            story.append(Spacer(1, 12))

        # Location Details
        if data.get('location_details'):
            loc = data['location_details']
            story.append(Paragraph("Location Details", styles['SectionHeader']))
            story.append(Paragraph("GPS Coordinates", styles['SubSectionHeader']))
            gps_data = [
                ['Latitude', str(loc.get('latitude', ''))],
                ['Longitude', str(loc.get('longitude', ''))],
                ['Manual Latitude', str(loc.get('manual_latitude', ''))],
                ['Manual Longitude', str(loc.get('manual_longitude', ''))],
            ]
            story.append(create_styled_table(gps_data, header_color='#8E44AD'))
            story.append(Spacer(1, 10))
            
            story.append(Paragraph("Geo-Location Map", styles['SubSectionHeader']))
            map_note = Paragraph(f"<i>Map visualization would be displayed here using GPS coordinates: {loc.get('latitude', '')}, {loc.get('longitude', '')}</i>", styles['Normal'])
            story.append(map_note)
            story.append(Spacer(1, 12))

        # Property Characteristics
        if data.get('property_characteristics'):
            char = data['property_characteristics']
            story.append(Paragraph("Property Characteristics", styles['SectionHeader']))
            char_data = [
                ['Joint Wall Direction', char.get('joint_wall_direction', '')],
                ['Joint Slab Direction', char.get('joint_slab_direction', '')],
                ['FSI', str(char.get('fsi', ''))],
                ['Nearest Railway Station (km)', str(char.get('nearest_railway_station_km', ''))],
                ['Nearest Bus Station (km)', str(char.get('nearest_bus_station_km', ''))],
                ['Valuation Methodology', char.get('valuation_methodology', '')],
                ['Risk of Demolition', char.get('risk_of_demolition', '')],
                ['Distance from City Centre (km)', str(char.get('distance_from_city_centre_km', ''))],
                ['Development of Vicinity', char.get('development_of_vicinity', '')],
                ['Others', char.get('others_remarks', '')],
            ]
            story.append(create_styled_table(char_data, header_color='#D35400'))
            story.append(Spacer(1, 12))

        # NDMA Parameters
        if data.get('ndma_parameters'):
            ndma = data['ndma_parameters']
            story.append(Paragraph("NDMA Parameters", styles['SectionHeader']))
            ndma_data = [
                ['Nature of Building', ndma.get('nature_of_building', '')],
                ['Shape of Building', ndma.get('shape_of_building', '')],
                ['Concrete Grade', ndma.get('concrete_grade', '')],
                ['Roof Type', ndma.get('roof_type', '')],
                ['Soil Strata', ndma.get('soil_strata', '')],
                ['Seismic Zone', ndma.get('seismic_zone', '')],
            ]
            story.append(create_styled_table(ndma_data, header_color='#7F8C8D'))
            story.append(Spacer(1, 12))

        # Property Photos with geo-stamped overlays
        loc_fallback = {}
        if data.get('location_details'):
            loc = data['location_details']
            loc_fallback = {
                'latitude': loc.get('latitude') or loc.get('manual_latitude'),
                'longitude': loc.get('longitude') or loc.get('manual_longitude'),
            }
        if data.get('property_identification'):
            prop = data['property_identification']
            loc_fallback['locality'] = prop.get('locality_name', '')
            loc_fallback['region'] = prop.get('state') or prop.get('district', '')

        add_photo_grid(story, styles, data.get('photos') or [], loc_fallback)

        doc.build(story)
        return response

    except PropertyValuation.DoesNotExist:
        return Response({'error': 'Valuation not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        return Response({'error': str(e), 'details': error_details}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)