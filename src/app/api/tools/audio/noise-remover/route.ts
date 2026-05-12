import { NextRequest, NextResponse } from 'next/server';
import { getEngineRoute } from '@/config/engine';

/**
 * AI Noise Remover API Route
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Try Modal.com (Highest Priority for Heavy Tasks)
    const modalUrl = process.env.MODAL_AUDIO_URL ? `${process.env.MODAL_AUDIO_URL}/process` : null;
    if (modalUrl) {
      try {
        console.log('Attempting Modal noise removal...');
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Audio = buffer.toString('base64');
        
        const modalResponse = await fetch(modalUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_name: file.name,
            file_data_base64: base64Audio,
            task: "denoise"
          })
        });

        if (modalResponse.ok) {
          const result = await modalResponse.json();
          if (result.success) return NextResponse.json(result);
          console.warn('Modal noise removal error:', result.error);
        } else {
          console.warn('Modal server error:', modalResponse.status);
        }
      } catch (modalError: any) {
        console.warn('Modal noise removal unreachable:', modalError.message);
      }
    }

    // 2. Try Local AI Microservice (Railway Fallback)
    const localApiUrl = getEngineRoute("/api/noise-remover");
    
    try {
      console.log('Attempting local noise removal at:', localApiUrl);
      const localResponse = await fetch(localApiUrl, {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(2000)
      });

      if (localResponse.ok) {
        const result = await localResponse.json();
        if (result.success) return NextResponse.json(result);
      }
    } catch (localError: any) {
      console.warn('Local service unreachable:', localError.message);
    }

    // 2. Try Hugging Face
    const hfToken = process.env.HUGGINGFACE_TOKEN;
    if (hfToken) {
      try {
        const hfSpaceUrl = "https://r3gm-audio-separator.hf.space/api/predict";
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Audio = buffer.toString('base64');
        
        console.log('Attempting HF noise removal...');
        const hfResponse = await fetch(hfSpaceUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${hfToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            data: [
              { name: file.name, data: `data:${file.type};base64,${base64Audio}` },
              "UVR-DeNoise", 
              "Clean", 
              "v3" 
            ]
          }),
          signal: AbortSignal.timeout(45000)
        });

        if (hfResponse.ok) {
          const hfData = await hfResponse.json();
          if (hfData.data && hfData.data[0]) {
            return NextResponse.json({
              success: true,
              result: {
                cleaned: hfData.data[0].url || hfData.data[0],
                fileName: file.name
              }
            });
          }
        }
      } catch (hfError: any) {
        console.error('HF request failed:', hfError.message);
      }
    }

    // 3. Fallback for Localhost Development
    // If we're here, all real services failed. 
    // We return a 'success' but with isDemo: true and NO external random music.
    if (process.env.NODE_ENV === 'development') {
      console.warn('AI services unavailable. Falling back to local audio mock.');
      return NextResponse.json({
        success: true,
        result: {
          cleaned: null, // Frontend will detect this and use original audio
          fileName: file.name,
          isDemo: true
        }
      });
    }

    throw new Error('All noise removal services failed');

  } catch (error: any) {
    console.error('Noise removal error:', error);
    return NextResponse.json({ 
      error: 'Failed to process audio',
      details: error.message 
    }, { status: 500 });
  }
}
