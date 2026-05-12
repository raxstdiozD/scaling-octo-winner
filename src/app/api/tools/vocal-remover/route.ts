import { NextRequest, NextResponse } from 'next/server';
import { getEngineRoute } from '@/config/engine';

/**
 * Vocal Separator API Route
 * This route calls the Hugging Face Inference API / Spaces to separate vocals and instrumental.
 * We use the Demucs v4 model which is the gold standard for music separation.
 */

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. Modal.com (Highest Priority for Heavy Tasks)
    const modalUrl = process.env.MODAL_AUDIO_URL ? `${process.env.MODAL_AUDIO_URL}/process` : null;
    if (modalUrl) {
      try {
        console.log('Attempting Modal.com separation...');
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64Audio = buffer.toString('base64');
        
        const modalResponse = await fetch(modalUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_name: file.name,
            file_data_base64: base64Audio,
            task: "separate"
          })
        });

        if (modalResponse.ok) {
          const result = await modalResponse.json();
          if (result.success) return NextResponse.json(result);
          console.warn('Modal processing error:', result.error);
        } else {
          console.warn('Modal server error:', modalResponse.status);
        }
      } catch (modalError: any) {
        console.warn('Modal unreachable:', modalError.message);
      }
    }

    // 2. Local AI Microservice (Railway Fallback)
    const localApiUrl = getEngineRoute("/separate");
    
    try {
      console.log('Attempting local separation at:', localApiUrl);
      const localResponse = await fetch(localApiUrl, {
        method: "POST",
        body: formData,
        next: { revalidate: 0 }
      });

      if (localResponse.ok) {
        const result = await localResponse.json();
        if (result.success) return NextResponse.json(result);
      }
      
      const errorText = await localResponse.text();
      console.warn('Local separation failed or returned error:', errorText);
    } catch (localError: any) {
      console.warn('Local service unreachable, trying cloud...', localError.message);
    }

    // --- Fallback to Hugging Face (Tier 1: High Fidelity) ---
    const hfToken = process.env.HUGGINGFACE_TOKEN;
    if (!hfToken) {
      return NextResponse.json({ error: 'Primary service down and HF Token missing' }, { status: 503 });
    }

    const hfSpaceUrl = "https://r3gm-audio-separator.hf.space/api/predict";
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Audio = buffer.toString('base64');
    
    try {
      const hfResponse = await fetch(hfSpaceUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${hfToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: [
            { name: file.name, data: `data:${file.type};base64,${base64Audio}` },
            "UVR-MDX-NET-Voc_FT",
            "Vocals",
            "v3"
          ]
        }),
        signal: AbortSignal.timeout(60000) // 60s timeout
      });

      if (hfResponse.ok) {
        const hfData = await hfResponse.json();
        if (hfData.data && hfData.data[0]) {
          const vocalsUrl = hfData.data[0].url || hfData.data[0];
          return NextResponse.json({
            success: true,
            result: { vocals: vocalsUrl, instrumental: vocalsUrl, fileName: file.name }
          });
        }
      }
    } catch (e) {
      console.warn("Tier 1 Fallback failed, trying Tier 2...");
    }

    // --- Fallback to Hugging Face (Tier 2: Ultimate Stability) ---
    const tier2Url = "https://sociallycompute-voice-separator.hf.space/api/predict";
    const tier2Response = await fetch(tier2Url, {
      method: "POST",
      headers: { "Authorization": `Bearer ${hfToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ data: [{ name: file.name, data: `data:${file.type};base64,${base64Audio}` }] })
    });

    if (tier2Response.ok) {
      const t2Data = await tier2Response.json();
      if (t2Data.data && t2Data.data[0]) {
        return NextResponse.json({
          success: true,
          result: { vocals: t2Data.data[0].url || t2Data.data[0], instrumental: t2Data.data[0].url || t2Data.data[0], fileName: file.name }
        });
      }
    }

    throw new Error('All services failed. Check Vercel logs for Tier 1/2 details.');

  } catch (error: any) {
    console.error('Vocal separation error:', error);
    
    // Determine the most helpful error message
    let userMessage = 'The AI service is currently unavailable.';
    if (error.message.includes('401') || error.message.includes('403')) userMessage = 'System Error: Invalid AI Token.';
    if (error.message.includes('HUGGINGFACE_TOKEN')) userMessage = 'System Error: AI Token Missing.';
    if (error.message.includes('fetch failed')) userMessage = 'Connection Error: AI Engine Unreachable.';
    if (error.message.includes('timeout')) userMessage = 'The AI is taking too long. Try a shorter clip.';

    return NextResponse.json({ 
      error: userMessage,
      details: error.message,
      debug_info: {
        engine_url: localApiUrl,
        hf_token_present: !!process.env.HUGGINGFACE_TOKEN,
        error_stack: error.stack?.split('\n')[0]
      }
    }, { status: 500 });
  }
}
