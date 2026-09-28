"""PDF layout helpers: letterhead and geo-stamped property photos."""
import io
import os
from datetime import datetime

from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Image as RLImage, Paragraph, Spacer, Table, TableStyle

ASSETS_DIR = os.path.join(os.path.dirname(__file__), 'assets')
LOGO_PATH = os.path.join(ASSETS_DIR, 'logo.png')

CARDINALS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']


def degrees_to_cardinal(deg):
    try:
        return CARDINALS[round(float(deg) / 45) % 8]
    except (TypeError, ValueError):
        return ''


def _load_font(size):
    for name in ('arial.ttf', 'Arial.ttf', 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def stamp_photo(image_path, metadata):
    """Composite GPS/timestamp overlay onto a property photo. Returns JPEG BytesIO."""
    img = Image.open(image_path).convert('RGBA')
    img.thumbnail((900, 680), Image.Resampling.LANCZOS)
    width, height = img.size

    overlay = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    banner_h = max(int(height * 0.24), 90)
    draw.rectangle([0, height - banner_h, width, height], fill=(0, 0, 0, 175))

    # Compass (top-left)
    cx, cy, radius = 42, 42, 28
    draw.ellipse([cx - radius, cy - radius, cx + radius, cy + radius], outline=(255, 255, 255, 220), width=2)
    draw.line([cx, cy - radius + 4, cx, cy - radius + 16], fill=(255, 60, 60, 255), width=3)
    draw.text((cx - 4, cy - 8), 'N', fill=(255, 255, 255, 255), font=_load_font(11))

    # Map thumbnail placeholder (bottom-left, above banner)
    map_size = int(min(width, height) * 0.17)
    mx, my = 12, height - banner_h - map_size - 8
    draw.rectangle([mx, my, mx + map_size, my + map_size], fill=(210, 210, 210, 230), outline=(255, 255, 255, 255), width=2)
    pin_x, pin_y = mx + map_size // 2, my + map_size // 2
    draw.ellipse([pin_x - 5, pin_y - 5, pin_x + 5, pin_y + 5], fill=(220, 30, 30, 255))

    lat = metadata.get('latitude')
    lon = metadata.get('longitude')
    ts = metadata.get('timestamp') or datetime.now()
    if hasattr(ts, 'strftime'):
        ts_str = ts.strftime('%b %d, %Y %I:%M:%S %p')
    else:
        ts_str = str(ts)

    lat_str = lon_str = ''
    if lat not in (None, ''):
        lat_f = float(lat)
        lat_str = f'{abs(lat_f):.8f}{"N" if lat_f >= 0 else "S"}'
    if lon not in (None, ''):
        lon_f = float(lon)
        lon_str = f'{abs(lon_f):.8f}{"E" if lon_f >= 0 else "W"}'

    bearing = metadata.get('bearing_degrees', '')
    bearing_dir = metadata.get('bearing_direction') or degrees_to_cardinal(bearing)
    bearing_str = f'{bearing}° {bearing_dir}'.strip() if bearing else ''

    locality = metadata.get('locality', '') or ''
    region = metadata.get('region', '') or ''

    font_main = _load_font(15)
    font_sub = _load_font(13)
    text_x = mx + map_size + 14
    text_y = height - banner_h + 10
    lines = [
        (ts_str, font_main),
        (f'{lat_str}  {lon_str}'.strip(), font_sub),
        (bearing_str, font_sub),
        (locality, font_sub),
        (region, font_sub),
    ]
    for i, (line, font) in enumerate(lines):
        if line:
            draw.text((text_x, text_y + i * 17), line, fill=(255, 255, 255, 255), font=font)

    combined = Image.alpha_composite(img, overlay).convert('RGB')
    buf = io.BytesIO()
    combined.save(buf, format='JPEG', quality=88)
    buf.seek(0)
    return buf


def build_letterhead(story, styles):
    """KGN Associates letterhead matching official report format."""
    logo_cell = ''
    if os.path.exists(LOGO_PATH):
        logo_cell = RLImage(LOGO_PATH, width=72, height=72)

    company_style = ParagraphStyle(
        'CompanyGreen',
        parent=styles['Normal'],
        fontSize=17,
        textColor=colors.HexColor('#006400'),
        fontName='Helvetica-Bold',
        leading=20,
    )

    left_block = Table(
        [[logo_cell, Paragraph('<b>KGN ASSOCIATES</b><br/>Engineers &amp; Property Valuers', company_style)]],
        colWidths=[82, 210],
    )
    left_block.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))

    valuer_style = ParagraphStyle(
        'ValuerBlock',
        parent=styles['Normal'],
        fontSize=9,
        fontName='Helvetica-Bold',
        alignment=2,
        leading=13,
    )

    right_block = Paragraph(
        '<font color="red" size="13"><b>Er. SHAIK HUSSAIN PEERA</b></font><br/>'
        'B.Tech.(Civil Engineering), A.M.I.E, A.I.V<br/>'
        'IEI Associate Member (AM 3147250)<br/>'
        'Licensed Technical Engineer<br/>'
        'Approved Valuer (CAT-I-A-7649) (CAT-I/A.I.V. NO. 7649)',
        valuer_style,
    )

    header = Table([[left_block, right_block]], colWidths=[310, 230])
    header.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
    ]))
    story.append(header)
    story.append(Spacer(1, 6))

    separator = Table([['=' * 105]], colWidths=[540])
    separator.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#006400')),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(separator)
    story.append(Spacer(1, 14))


def add_photo_grid(story, styles, photos, location_fallback=None):
    """Add property photos in a 2-column grid with geo-stamped overlays."""
    from django.conf import settings

    if not photos:
        return

    title_style = ParagraphStyle(
        'PhotoTitle',
        parent=styles['Normal'],
        fontSize=13,
        fontName='Helvetica-Bold',
        spaceAfter=10,
    )
    story.append(Paragraph('<b>Property Photographs:</b>', title_style))
    story.append(Spacer(1, 8))

    fallback = location_fallback or {}
    stamped = []

    for photo in photos:
        photo_field = photo.get('photo', '')
        if not photo_field:
            continue
        relative = str(photo_field)
        if relative.startswith('http'):
            # Strip domain, keep /media/ path
            idx = relative.find('/media/')
            relative = relative[idx + len('/media/'):] if idx >= 0 else ''
        else:
            relative = relative.replace('/media/', '').lstrip('/')
        if not relative:
            continue
        full_path = os.path.join(settings.MEDIA_ROOT, relative)
        if not os.path.exists(full_path):
            continue

        metadata = {
            'latitude': photo.get('latitude') or fallback.get('latitude'),
            'longitude': photo.get('longitude') or fallback.get('longitude'),
            'locality': photo.get('locality') or fallback.get('locality', ''),
            'region': photo.get('region') or fallback.get('region', ''),
            'bearing_degrees': photo.get('bearing_degrees', ''),
            'bearing_direction': photo.get('bearing_direction', ''),
            'timestamp': photo.get('captured_at') or photo.get('uploaded_at'),
        }
        try:
            buf = stamp_photo(full_path, metadata)
            stamped.append(RLImage(buf, width=252, height=189))
        except Exception:
            continue

    if not stamped:
        story.append(Paragraph('<i>No property photographs available.</i>', styles['Normal']))
        return

    rows = []
    row = []
    for img in stamped:
        cell = Table([[img]], colWidths=[258])
        cell.setStyle(TableStyle([
            ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#1a5276')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        row.append(cell)
        if len(row) == 2:
            rows.append(row)
            row = []
    if row:
        row.append(Spacer(1, 1))
        rows.append(row)

    grid = Table(rows, colWidths=[270, 270], hAlign='LEFT')
    grid.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 4),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(grid)
    story.append(Spacer(1, 12))
