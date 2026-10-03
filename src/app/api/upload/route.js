import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req) {
  try {
    const formData = await req.formData();
    // Accept 'file', 'image', or 'photo' field names
    const file = formData.get('file') || formData.get('image') || formData.get('photo');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'No file found. Send multipart/form-data with field name "file", "image", or "photo".' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name || 'image.jpg') || '.jpg';
    const cleanBase = path.basename(file.name || 'image', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${Date.now()}_${cleanBase}${ext}`;
    const filePath = path.join(uploadsDir, filename);

    // Write file to public/uploads
    fs.writeFileSync(filePath, buffer);

    const mimeType = file.type || 'image/jpeg';
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // Optional metadata if passed in multipart form
    const description = formData.get('description') || '';
    const latitude = formData.get('latitude') || null;
    const longitude = formData.get('longitude') || null;
    const locality = formData.get('locality') || '';
    const region = formData.get('region') || '';

    return NextResponse.json({
      success: true,
      filename,
      url: `/uploads/${filename}`,
      full_url: `/uploads/${filename}`,
      size: buffer.length,
      mimetype: mimeType,
      dataUrl,
      metadata: {
        description,
        latitude,
        longitude,
        locality,
        region,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('API /upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload image' }, { status: 500 });
  }
}
