import modal
import os
import base64
import tempfile
import shutil

# Define the Modal Image with pre-downloaded model
image = (
    modal.Image.debian_slim()
    .apt_install("ffmpeg")
    .pip_install("demucs", "torch", "torchaudio", "numpy", "fastapi[standard]", "torchcodec", "python-multipart")
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

@app.function(image=image, gpu="any", timeout=600)
@modal.asgi_app()
def fastapi_app():
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    import torch
    from demucs.pretrained import get_model
    from demucs.apply import apply_model
    from demucs.audio import AudioFile, save_audio
    
    web_app = FastAPI()
    
    web_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @web_app.post("/process")
    async def process_audio(req: SeparationRequest):
        file_name = req.file_name
        file_data_base64 = req.file_data_base64
        num_stems = int(req.stems)
        task = req.task
        
        temp_dir = tempfile.mkdtemp()
        try:
            # 1. Decode and Save Input
            input_path = os.path.join(temp_dir, file_name)
            if "," in file_data_base64:
                file_data_base64 = file_data_base64.split(",")[1]
                
            with open(input_path, "wb") as f:
                f.write(base64.b64decode(file_data_base64))

            # 2. Load Model
            device = "cuda" if torch.cuda.is_available() else "cpu"
            model = get_model("htdemucs")
            model.to(device)

            # 3. Read Audio
            wav = AudioFile(input_path).read(
                streams=0, 
                samplerate=model.samplerate, 
                channels=model.audio_channels
            )

            # 4. Apply Model
            sources = apply_model(model, wav[None], device=device)[0]

            # 5. Process based on Task
            result_stems = {}
            
            def encode_file(path):
                with open(path, "rb") as f:
                    return f"data:audio/mpeg;base64,{base64.b64encode(f.read()).decode('utf-8')}"

            def save_mp3(source, name):
                wav_path = os.path.join(temp_dir, f"{name}.wav")
                mp3_path = os.path.join(temp_dir, f"{name}.mp3")
                save_audio(source, wav_path, samplerate=model.samplerate)
                import subprocess
                subprocess.run(["ffmpeg", "-i", wav_path, "-codec:a", "libmp3lame", "-b:a", "192k", mp3_path], check=True)
                return mp3_path

            if task == "denoise":
                vocal_idx = model.sources.index("vocals")
                p = save_mp3(sources[vocal_idx], "cleaned")
                return {"success": True, "result": {"cleaned": encode_file(p), "fileName": file_name}}
            
            # Default separation
            if num_stems == 4:
                for name, source in zip(model.sources, sources):
                    p = save_mp3(source, name)
                    result_stems[name] = encode_file(p)
            else:
                vocal_idx = model.sources.index("vocals")
                vocal_source = sources[vocal_idx]
                instrumental_source = None
                for i, source in enumerate(sources):
                    if i == vocal_idx: continue
                    if instrumental_source is None: instrumental_source = source
                    else: instrumental_source += source
                
                vp = save_mp3(vocal_source, "vocals")
                ip = save_mp3(instrumental_source, "instrumental")
                result_stems["vocals"] = encode_file(vp)
                result_stems["instrumental"] = encode_file(ip)

            return {"success": True, "result": {**result_stems, "fileName": file_name}}

        except Exception as e:
            return {"success": False, "error": str(e)}
        finally:
            shutil.rmtree(temp_dir)

    return web_app
