"""Quick test for PDF letterhead and geo-stamped photos."""
import io
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import override_settings
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from PIL import Image

from apis.models import PropertyValuation, PropertyPhoto


def make_test_image():
    buf = io.BytesIO()
    Image.new('RGB', (640, 480), color=(120, 140, 100)).save(buf, format='JPEG')
    buf.seek(0)
    return SimpleUploadedFile('test_photo.jpg', buf.read(), content_type='image/jpeg')


@override_settings(ALLOWED_HOSTS=['testserver', 'localhost'])
def main():
    user, _ = User.objects.get_or_create(username='testuser', defaults={'email': 't@t.com'})
    user.set_password('testpass123')
    user.save()
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {RefreshToken.for_user(user).access_token}')

    r = client.post('/api/valuations/', {}, format='json')
    vid = r.json()['id']

    client.post(f'/api/valuations/{vid}/update_institution_details/', {'bank_name': 'Test Bank'}, format='json')
    client.post(f'/api/valuations/{vid}/update_property_identification/', {
        'locality_name': 'Madugupalle', 'state': 'Andhra Pradesh'
    }, format='json')
    client.post(f'/api/valuations/{vid}/update_location_details/', {
        'latitude': '14.70920345', 'longitude': '77.89437658'
    }, format='json')

    img = make_test_image()
    r = client.post(f'/api/valuations/{vid}/add_photo/', {
        'photo': img,
        'description': 'Front view',
        'latitude': '14.70920345',
        'longitude': '77.89437658',
        'locality': 'Madugupalle',
        'region': 'Andhra Pradesh',
        'bearing_degrees': '127',
        'bearing_direction': 'SE',
    }, format='multipart')

    print('Photo upload:', r.status_code, r.content[:200] if r.status_code != 201 else 'OK')

    r = client.get(f'/api/valuations/{vid}/generate-pdf/')
    pdf_ok = r.status_code == 200 and r.content[:4] == b'%PDF' and len(r.content) > 5000
    print(f'PDF: status={r.status_code}, size={len(r.content)}, valid={pdf_ok}')

    PropertyValuation.objects.filter(id=vid).delete()
    return 0 if pdf_ok and r.status_code == 200 else 1


if __name__ == '__main__':
    raise SystemExit(main())
