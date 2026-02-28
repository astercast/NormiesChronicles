import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'

export const dynamic = 'force-dynamic'

export async function GET() {
  const results: Record<string, unknown> = {}

  results.hasToken = !!process.env.BLOB_READ_WRITE_TOKEN
  results.tokenPrefix = process.env.BLOB_READ_WRITE_TOKEN?.slice(0, 20) + '...'

  // Try listing
  try {
    const { blobs } = await list()
    results.listOK = true
    results.blobCount = blobs.length
    results.blobs = blobs.map(b => ({ url: b.url, size: b.size, uploadedAt: b.uploadedAt }))
  } catch (err: unknown) {
    results.listError = err instanceof Error ? err.message : String(err)
  }

  // Try writing
  try {
    const blob = await put('chronicles-test.json', JSON.stringify({ test: true, ts: Date.now() }), {
      access: 'private',
      allowOverwrite: true,
      contentType: 'application/json',
    })
    results.writeOK = true
    results.writeUrl = blob.url
  } catch (err: unknown) {
    results.writeError = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json(results, { status: 200 })
}
