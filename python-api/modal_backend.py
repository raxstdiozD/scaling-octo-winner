import modal
import os
import base64
import tempfile
import shutil
import subprocess

# Define the Modal Image with pre-downloaded model
# We use a robust image with ffmpeg and essential AI libraries
image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install(
        "demucs", 
        "torch", 
        "torchaudio", 
        "torchcodec",
        "numpy", 
        "fastapi[standard]", 
        "python-multipart"
    )
    # Pre-download the model to the image to save time and avoid network issues during execution
    .run_commands("python3 -c 'from demucs.pretrained import get_model; get_model(\"htdemucs\")'")
)

app = modal.App("lumora-vocal-remover")

from pydantic import BaseModel

class SeparationRequest(BaseModel):
    file_name: str
    file_data_base64: str
    stems: int = 2
    task: str = "separate" # "separate" or "denoise"

@app.function(
    image=image, 
    gpu="any", 
    timeout=600,
    cpu=2.0,           # Ensure enough CPU for preprocessing
    memory=8192,       # Ensure enough RAM for Demucs
)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    import torch
    from demucs.pretrained import get_model
    from demucs.apply import apply_model
    from demucs.audio import AudioFile, save_audio
    
    web_app = FastAPI(title="Lumora Audio Engine")
    
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Pre-load model to memory once
    print("AI Model: Loading HTDemucs...")
    model = get_model("htdemucs")

    @web_app.post("/process")
    async def process_audio(req: SeparationRequest):
        file_name = req.file_name
        file_data_base64 = req.file_data_base64
        num_stems = int(req.stems)
        task = req.task
        
        temp_dir = tempfile.mkdtemp()
        try:
            # 1. Decode and Save Input
            raw_input_path = os.path.join(temp_dir, "input_raw")
            if "," in file_data_base64:
                file_data_base64 = file_data_base64.split(",")[1]
                
            with open(raw_input_path, "wb") as f:
                f.write(base64.b64decode(file_data_base64))

            # 2. Pre-process: Convert to WAV (Crucial for stability across different audio formats)
            # This ensures Demucs gets exactly what it expects
            input_wav_path = os.path.join(temp_dir, "input.wav")
            print(f"Pre-processing {file_name}...")
            subprocess.run([
                "ffmpeg", "-i", raw_input_path,
                "-ar", str(model.samplerate),
                "-ac", str(model.audio_channels),
                "-y", input_wav_path
            ], check=True, capture_output=True)

            # 3. Load Audio and Initialize Device
            device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"Applying AI model on {device}...")
            
            model.to(device)
            wav = AudioFile(input_wav_path).read(
                streams=0, 
                samplerate=model.samplerate, 
                channels=model.audio_channels
            )

            # 4. Apply Model (The heavy lifting)
            sources = apply_model(model, wav[None], device=device)[0]

            # 5. Process and Encode results
            result_stems = {}
            
            def encode_file(path):
                with open(path, "rb") as f:
                    return f"data:audio/mpeg;base64,{base64.b64encode(f.read()).decode('utf-8')}"

            def save_mp3(source, name):
                wav_path = os.path.join(temp_dir, f"{name}.wav")
                mp3_path = os.path.join(temp_dir, f"{name}.mp3")
                save_audio(source, wav_path, samplerate=model.samplerate)
                # Convert back to MP3 for client delivery (saves bandwidth)
                subprocess.run([
                    "ffmpeg", "-i", wav_path, 
                    "-codec:a", "libmp3lame", 
                    "-q:a", "2", # High quality VBR
                    "-y", mp3_path
                ], check=True, capture_output=True)
                return mp3_path

            if task == "denoise":
                # Denoising often just means taking the vocals stem
                vocal_idx = model.sources.index("vocals")
                p = save_mp3(sources[vocal_idx], "cleaned")
                return {"success": True, "result": {"cleaned": encode_file(p), "fileName": file_name}}
            
            if num_stems == 4:
                # Full stem splitting (Vocals, Drums, Bass, Other)
                for name, source in zip(model.sources, sources):
                    p = save_mp3(source, name)
                    result_stems[name] = encode_file(p)
            else:
                # Simple Vocal Removal (Vocals + Instrumental)
                vocal_idx = model.sources.index("vocals")
                vocal_source = sources[vocal_idx]
                
                # Sum everything else for the instrumental track
                instrumental_source = None
                for i, source in enumerate(sources):
                    if i == vocal_idx: continue
                    if instrumental_source is None: instrumental_source = source
                    else: instrumental_source += source
                
                vp = save_mp3(vocal_source, "vocals")
                ip = save_mp3(instrumental_source, "instrumental")
                result_stems["vocals"] = encode_file(vp)
                result_stems["instrumental"] = encode_file(ip)

            print("Processing successful.")
            return {"success": True, "result": {**result_stems, "fileName": file_name}}

        except Exception as e:
            import traceback
            error_msg = f"Audio engine error: {str(e)}"
            print(error_msg)
            print(traceback.format_exc())
            return {"success": False, "error": error_msg, "trace": traceback.format_exc()}
        finally:
            # Cleanup temp directory
            shutil.rmtree(temp_dir, ignore_errors=True)

    return web_app

