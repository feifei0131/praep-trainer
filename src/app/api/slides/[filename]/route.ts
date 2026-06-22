import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params
  console.log('filename param:', JSON.stringify(filename))
  console.log('filename length:', filename.length)
  try {
    const filePath = path.join(
      '/Users/feifei0131/Documents/AI_Project/praep-trainer',
      'public', 'slides', filename
    )
    const file = await readFile(filePath)
    return new NextResponse(file, {
      headers: { 'Content-Type': 'image/png' },
    })
  } catch (e) {
    console.error('Error:', e)
    return new NextResponse('Not found', { status: 404 })
  }
}
