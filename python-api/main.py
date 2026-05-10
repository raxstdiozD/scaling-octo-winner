import os
import tempfile
import shutil
import base64
import torch
import uvicorn
import subprocess
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from demucs.pretrained import get_model
from demucs.apply import apply_model
from demucs.audio import AudioFile, save_audio
import imageio_ffmpeg
from rembg import remove
from fastapi.responses import Response
import io
from PIL import Image

app = FastAPI(title="Lumora Vocal Remover Backend")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure FFmpeg is available
try:
    ffmpeg_bin = os.path.abspath(imageio_ffmpeg.get_ffmpeg_exe())
    ffmpeg_dir = os.path.dirname(ffmpeg_bin)
    
    # Aggressively update PATH
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.environ["PATH"] = ffmpeg_dir + os.pathsep + script_dir + os.pathsep + os.environ["PATH"]
    os.environ["FFMPEG_BINARY"] = ffmpeg_bin
    
    print(f"FFmpeg configured: {ffmpeg_bin}")
except Exception as e:
    print(f"Warning: Could not set FFmpeg path: {e}")

# Preload Demucs model
print("Loading AI Model (HTDemucs)...")
model = get_model("htdemucs")
print("Model loaded successfully.")

@app.post("/separate")
@app.post("/audio/separate")
async def separate_audio(file: UploadFile = File(...), stems: int = 2):
    """
    Separates audio into stems using Facebook's Demucs.
    stems=2: Returns 'vocals' and 'instrumental'
    stems=4: Returns 'vocals', 'drums', 'bass', and 'other'
    """
    temp_dir = tempfile.mkdtemp()
    # 1. Save uploaded file to temp path
    try:
        file_extension = os.path.splitext(file.filename)[1]
        raw_input_path = os.path.join(temp_dir, f"raw_input{file_extension}")
        input_wav_path = os.path.join(temp_dir, "input.wav")
        
        with open(raw_input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. Convert to WAV using ffmpeg
        print(f"Converting {file.filename} to WAV...")
        subprocess.run([
            "ffmpeg", "-i", raw_input_path,
            "-ar", str(model.samplerate),
            "-ac", str(model.audio_channels),
            "-y", input_wav_path
        ], check=True, capture_output=True)

        # 3. Load audio file from the WAV
        wav = AudioFile(input_wav_path).read(
            streams=0, 
            samplerate=model.samplerate, 
            channels=model.audio_channels
        )

        # 4. Run separation
        device = "cpu" 
        print(f"Processing on {device} (Stems: {stems})...")
        
        sources = apply_model(model, wav[None], device=device)[0]
        
        # 5. Save and Encode results
        result_stems = {}
        
        if stems == 4:
            # Return all 4 individual stems
            for name, source in zip(model.sources, sources):
                output_path = os.path.join(temp_dir, f"{name}.wav")
                save_audio(source, output_path, samplerate=model.samplerate)
                with open(output_path, "rb") as f:
                    encoded = base64.b64encode(f.read()).decode('utf-8')
                    result_stems[name] = f"data:audio/wav;base64,{encoded}"
        else:
            # Default 2-stem output
            vocal_idx = model.sources.index("vocals")
            vocal_source = sources[vocal_idx]
            
            instrumental_source = None
            for i, source in enumerate(sources):
                if i == vocal_idx: continue
                if instrumental_source is None: instrumental_source = source
                else: instrumental_source += source

            # Save Vocals
            vocal_path = os.path.join(temp_dir, "vocals.wav")
            save_audio(vocal_source, vocal_path, samplerate=model.samplerate)
            with open(vocal_path, "rb") as f:
                result_stems["vocals"] = f"data:audio/wav;base64,{base64.b64encode(f.read()).decode('utf-8')}"

            # Save Instrumental
            inst_path = os.path.join(temp_dir, "instrumental.wav")
            save_audio(instrumental_source, inst_path, samplerate=model.samplerate)
            with open(inst_path, "rb") as f:
                result_stems["instrumental"] = f"data:audio/wav;base64,{base64.b64encode(f.read()).decode('utf-8')}"
        
        return {
            "success": True,
            "result": {
                **result_stems,
                "fileName": file.filename
            }
        }

    except Exception as e:
        print(f"Processing Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup temp files
        try:
            shutil.rmtree(temp_dir)
        except:
            pass

@app.get("/health")
async def health():
    return {"status": "ready", "model": "htdemucs"}

@app.post("/image/remove-bg")
async def remove_bg(file: UploadFile = File(...)):
    """
    Removes background from an image using rembg.
    """
    try:
        input_data = await file.read()
        
        # Use rembg to remove background
        output_data = remove(input_data)
        
        return Response(content=output_data, media_type="image/png")
    except Exception as e:
        print(f"Background Removal Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
