// API Route: GET /api/swagger
// Serves the OpenAPI spec as JSON for Swagger UI
import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

export async function GET() {
  return NextResponse.json(swaggerSpec);
}
