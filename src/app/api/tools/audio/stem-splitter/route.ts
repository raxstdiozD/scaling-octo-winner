import { NextRequest, NextResponse } from 'next/server';
import { getEngineRoute } from '@/config/engine';

/**
 * Stem Splitter API Route
 * This route calls the AI backends with stems=4 to get Drums, Bass, Other, and Vocals.
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Add stems parameter for 4-stem separation
    formData.append('stems', '4');

    // 1. Local AI Microservice
    const localApiUrl = getEngineRoute("/separate?stems=4");
    
    try {
      console.log('Attempting local stem splitting...');
      const localResponse = await fetch(localApiUrl, {
        method: "POST",
        body: formData,
        next: { revalidate: 0 }
      });

      if (localResponse.ok) {
        const result = await localResponse.json();
        if (result.success) return NextResponse.json(result);
      }
    } catch (localError: any) {
      console.warn('Local stem splitter unreachable:', localError.message);
    }

    // 2. Modal.com (Cloud Fallback)
    const modalUrl = process.env.MODAL_VOCAL_REMOVER_URL;
    if (modalUrl) {
      try {
        console.log('Attempting Modal stem splitting...');
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Audio = buffer.toString('base64');
        
        const modalResponse = await fetch(modalUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_name: file.name,
            file_data_base64: base64Audio,
            stems: 4
          })
        });

        if (modalResponse.ok) {
          const result = await modalResponse.json();
          if (result.success) return NextResponse.json(result);
        }
      } catch (modalError: any) {
        console.warn('Modal stem splitter unreachable:', modalError.message);
      }
    }

    return NextResponse.json({ 
      error: 'Stem splitting service is currently unavailable locally. Please ensure the local Python API is running.' 
    }, { status: 503 });

  } catch (error: any) {
    console.error('Stem splitting error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
