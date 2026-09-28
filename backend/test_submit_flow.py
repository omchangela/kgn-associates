"""Integration test: form save + PDF generation flow."""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import override_settings
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apis.models import PropertyValuation


def main():
    with override_settings(ALLOWED_HOSTS=['testserver', 'localhost', '127.0.0.1']):
        return _run_tests()


def _run_tests():
    errors = []

    user, _ = User.objects.get_or_create(
        username='testuser',
        defaults={'email': 'test@test.com'},
    )
    user.set_password('testpass123')
    user.save()

    client = APIClient()
    token = str(RefreshToken.for_user(user).access_token)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    r = client.post('/api/valuations/', {}, format='json')
    if r.status_code not in (200, 201):
        print('FAIL: create valuation', r.status_code, r.content[:300])
        return 1
    vid = r.json()['id']
    print(f'OK: Created valuation id={vid}')

    sections = [
        ('update_institution_details', {
            'bank_name': 'HDFC Bank Test',
            'branch_name': 'Chennai Branch',
            'applicant_name': 'John Doe Test',
            'loan_application_id': 'LA-999',
        }),
        ('update_property_identification', {
            'address_as_per_documents': '123 Test Street',
            'survey_number': '456/789',
            'district': 'Chennai',
            'pincode': '600017',
        }),
        ('update_schedule_details', {
            'east_boundary_docs': '30 ft',
            'construction_type': 'rcc',
            'occupancy_status': 'occupied',
        }),
        ('update_infrastructure_details', {
            'land_locked_description': 'Corner plot',
            'number_of_roads': 2,
            'road_direction': 'north',
        }),
        ('update_technical_details', {
            'total_built_up_area': '2400',
            'carpet_area': '2000',
        }),
        ('update_final_valuation', {
            'property_type': 'Residential',
            'final_market_value': '5000000',
            'valuer_name': 'R Kumar',
        }),
        ('update_location_details', {
            'latitude': '13.0827',
            'longitude': '80.2707',
        }),
        ('update_property_characteristics', {
            'joint_wall_direction': 'East',
            'fsi': '2',
        }),
        ('update_ndma_parameters', {
            'nature_of_building': 'Residential Apartment',
            'seismic_zone': 'zone3',
        }),
    ]

    for action, payload in sections:
        r = client.post(f'/api/valuations/{vid}/{action}/', payload, format='json')
        label = action.replace('update_', '')
        if r.status_code != 200:
            print(f'FAIL: {label}', r.status_code, r.content[:300])
            errors.append(label)
        else:
            print(f'OK: {label}')

    r = client.post(f'/api/valuations/{vid}/add_land_extent_valuation/', {
        'basis_of_valuation': 'as_per_documents',
        'land_extent_sqft': '1200',
        'cost_per_sqft': '2000',
        'total_value': '2400000',
    }, format='json')
    if r.status_code not in (200, 201):
        print('FAIL: land_extent', r.status_code, r.content[:300])
        errors.append('land_extent')
    else:
        print('OK: land_extent')

    r = client.post(f'/api/valuations/{vid}/add_structure_valuation/', {
        'floor_details': 'plinth_area',
        'area_sqft': '1000',
        'cost_per_sqft': '1500',
        'total_value': '1500000',
    }, format='json')
    if r.status_code not in (200, 201):
        print('FAIL: structure', r.status_code, r.content[:300])
        errors.append('structure')
    else:
        print('OK: structure')

    r = client.post(f'/api/valuations/{vid}/add_amenity_valuation/', {
        'amenity_name': 'Parking',
        'amenity_value': '50000',
    }, format='json')
    if r.status_code not in (200, 201):
        print('FAIL: amenity', r.status_code, r.content[:300])
        errors.append('amenity')
    else:
        print('OK: amenity')

    r = client.get(f'/api/valuations/{vid}/full_details/')
    data = r.json()
    checks = [
        ('bank_name', data.get('institution_details', {}).get('bank_name'), 'HDFC Bank Test'),
        ('survey_number', data.get('property_identification', {}).get('survey_number'), '456/789'),
        ('east_boundary', data.get('schedule_details', {}).get('east_boundary_docs'), '30 ft'),
        ('final_market_value', str(data.get('final_valuation', {}).get('final_market_value')), '5000000.00'),
        ('land_extent_count', len(data.get('land_extent_valuations', [])), 1),
        ('structure_count', len(data.get('structure_valuations', [])), 1),
        ('amenity_count', len(data.get('amenity_valuations', [])), 1),
        ('amenity_name', (data.get('amenity_valuations') or [{}])[0].get('amenity_name') if data.get('amenity_valuations') else None, 'Parking'),
    ]
    print('\n--- Data verification ---')
    for name, actual, expected in checks:
        ok = actual == expected
        print(f'{"PASS" if ok else "FAIL"}: {name} = {actual!r} (expected {expected!r})')
        if not ok:
            errors.append(f'data:{name}')

    r = client.get(f'/api/valuations/{vid}/generate-pdf/')
    pdf_ok = r.status_code == 200 and r.content[:4] == b'%PDF' and len(r.content) > 1000
    print(f'\n--- PDF ---')
    print(f'{"PASS" if pdf_ok else "FAIL"}: status={r.status_code}, size={len(r.content)} bytes, header={r.content[:4]!r}')
    if not pdf_ok:
        errors.append('pdf')

    PropertyValuation.objects.filter(id=vid).delete()
    print('\n--- Summary ---')
    if errors:
        print(f'FAILED ({len(errors)} issues): {errors}')
        return 1
    print('ALL TESTS PASSED')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
