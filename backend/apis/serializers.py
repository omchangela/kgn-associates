from decimal import Decimal, ROUND_HALF_UP, InvalidOperation
from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import (
    PropertyValuation, InstitutionDetails, VerifiedDocument, PropertyIdentification,
    ScheduleDetails, InfrastructureDetails, TechnicalDetails, LandExtentValuation,
    StructureValuation, AmenityValuation, PropertyMarketValue, GuidelineValue,
    FinalValuation, LocationDetails, PropertyCharacteristics, NDMAParameters,
    PropertyPhoto
)

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
        extra_kwargs = {
            'first_name': {'required': False, 'allow_blank': True},
            'last_name': {'required': False, 'allow_blank': True},
        }
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Check if username already exists
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({"username": "A user with that username already exists."})
        
        # Check if email already exists
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})
        
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT token serializer with additional user data"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Remove username field and add email field
        self.fields.pop('username', None)
        self.fields['email'] = serializers.EmailField(write_only=True, required=True)
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token
    
    def validate(self, attrs):
        # Convert email to username for authentication
        email = attrs.get('email')
        
        if email:
            try:
                user = User.objects.get(email=email)
                attrs['username'] = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError({"email": "No user found with this email."})
        
        # Call parent validate with the converted username
        data = super().validate(attrs)
        # Add user data to response
        data['user'] = UserSerializer(self.user).data
        return data

class PropertyValuationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyValuation
        fields = ['id', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class VerifiedDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VerifiedDocument
        fields = '__all__'

class InstitutionDetailsSerializer(serializers.ModelSerializer):
    verified_documents = VerifiedDocumentSerializer(many=True, read_only=True)
    
    class Meta:
        model = InstitutionDetails
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class PropertyIdentificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyIdentification
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class ScheduleDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleDetails
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class InfrastructureDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfrastructureDetails
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class TechnicalDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicalDetails
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class LandExtentValuationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandExtentValuation
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class StructureValuationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StructureValuation
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class AmenityValuationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AmenityValuation
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class PropertyMarketValueSerializer(serializers.ModelSerializer):
    land_extent_valuations = LandExtentValuationSerializer(many=True, read_only=True)
    structure_valuations = StructureValuationSerializer(many=True, read_only=True)
    amenity_valuations = AmenityValuationSerializer(many=True, read_only=True)
    
    class Meta:
        model = PropertyMarketValue
        fields = '__all__'

class GuidelineValueSerializer(serializers.ModelSerializer):
    land_extent_valuations = LandExtentValuationSerializer(many=True, read_only=True)
    amenity_valuations = AmenityValuationSerializer(many=True, read_only=True)
    
    class Meta:
        model = GuidelineValue
        fields = '__all__'

class FinalValuationSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinalValuation
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class LocationDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationDetails
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class PropertyCharacteristicsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyCharacteristics
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class NDMAParametersSerializer(serializers.ModelSerializer):
    class Meta:
        model = NDMAParameters
        fields = '__all__'
        read_only_fields = ['id', 'valuation']

class RoundedDecimalField(serializers.DecimalField):
    """Decimal field that rounds GPS coords before max_digits validation."""

    def to_internal_value(self, data):
        if data in (None, ''):
            return None
        try:
            rounded = Decimal(str(data).strip()).quantize(
                Decimal('0.00000001'), rounding=ROUND_HALF_UP
            )
        except InvalidOperation:
            self.fail('invalid')
        return super().to_internal_value(rounded)


class PropertyPhotoSerializer(serializers.ModelSerializer):
    latitude = RoundedDecimalField(max_digits=10, decimal_places=8, required=False, allow_null=True)
    longitude = RoundedDecimalField(max_digits=11, decimal_places=8, required=False, allow_null=True)

    class Meta:
        model = PropertyPhoto
        fields = '__all__'
        read_only_fields = ['id', 'valuation', 'uploaded_at']

class PropertyValuationDetailSerializer(serializers.ModelSerializer):
    """Complete serializer with all related data"""
    institution_details = InstitutionDetailsSerializer(read_only=True)
    property_identification = PropertyIdentificationSerializer(read_only=True)
    schedule_details = ScheduleDetailsSerializer(read_only=True)
    infrastructure_details = InfrastructureDetailsSerializer(read_only=True)
    technical_details = TechnicalDetailsSerializer(read_only=True)
    property_market_value = PropertyMarketValueSerializer(read_only=True)
    guideline_value = GuidelineValueSerializer(read_only=True)
    final_valuation = FinalValuationSerializer(read_only=True)
    location_details = LocationDetailsSerializer(read_only=True)
    property_characteristics = PropertyCharacteristicsSerializer(read_only=True)
    ndma_parameters = NDMAParametersSerializer(read_only=True)
    photos = PropertyPhotoSerializer(many=True, read_only=True)
    land_extent_valuations = LandExtentValuationSerializer(many=True, read_only=True)
    structure_valuations = StructureValuationSerializer(many=True, read_only=True)
    amenity_valuations = AmenityValuationSerializer(many=True, read_only=True)
    
    class Meta:
        model = PropertyValuation
        fields = [
            'id', 'created_at', 'updated_at',
            'institution_details', 'property_identification', 'schedule_details',
            'infrastructure_details', 'technical_details', 'property_market_value',
            'guideline_value', 'final_valuation', 'location_details',
            'property_characteristics', 'ndma_parameters', 'photos',
            'land_extent_valuations', 'structure_valuations', 'amenity_valuations',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']