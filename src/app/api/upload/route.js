import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export const maxDuration = 60;

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized — please login as admin' }, { status: 401 });
    }

    // Check Cloudinary env vars
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ 
        success: false, 
        message: `Cloudinary not configured. Missing: ${!cloudName ? 'CLOUDINARY_CLOUD_NAME ' : ''}${!apiKey ? 'CLOUDINARY_API_KEY ' : ''}${!apiSecret ? 'CLOUDINARY_API_SECRET' : ''}` 
      }, { status: 500 });
    }

    const body = await request.json();
    const { image } = body;
    if (!image) return NextResponse.json({ success: false, message: 'No image data received' }, { status: 400 });

    // Upload directly via Cloudinary REST API (no SDK needed)
    const formData = new URLSearchParams();
    formData.append('file', image);
    formData.append('upload_preset', 'ml_default'); // will try unsigned first
    formData.append('folder', 'lmart_products');

    // Use signed upload with API key/secret
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Dynamic import cloudinary
    const cloudinary = (await import('cloudinary')).v2;
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

    const result = await cloudinary.uploader.upload(image, {
      folder: 'lmart_products',
      quality: 'auto:good',
      fetch_format: 'auto',
      transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    });

    return NextResponse.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    console.error('Upload error full:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Upload failed: ' + (error.message || 'Unknown error'),
      detail: error.http_code ? `Cloudinary error ${error.http_code}` : null
    }, { status: 500 });
  }
}
