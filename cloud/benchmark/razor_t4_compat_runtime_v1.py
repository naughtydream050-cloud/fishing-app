#!/usr/bin/env python3
"""RAZOR_T4_COMPAT_RUNTIME_V1: manifest and isolated 8-second Base gate only.

Inference only.  It never reads training data, preprocesses, trains, or loads a LoRA.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
import zipfile
from pathlib import Path

os.environ["MPLBACKEND"] = "Agg"

COMMIT = "7202bc354d7fc31d1c0e5a90b0b49fb610e52362"
RUNTIME_NAME = "RAZOR_T4_COMPAT_RUNTIME_V1"
SETTINGS = {
    "caption": "instrumental KRUMP, dark raw KRUMP, strong kick, strong snare, unstable dissonant melody, distinctive rhythmic spacing and accents, minimal aggressive 32-bar loop structure, avoid generic trap or rage",
    "lyrics": "",
    "bpm": 120,
    "key_scale": "C# minor",
    "time_signature": "4",
    "seed": 20260831,
    "duration_seconds": 8.0,
    "inference_steps": 32,
    "guidance_scale": 7.0,
    "use_adg": True,
    "shift": 3.0,
    "infer_method": "ode",
    "batch_size": 1,
    "instrumental": True,
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def tree_hash(root: Path) -> str:
    digest = hashlib.sha256()
    for path in sorted(item for item in root.rglob("*") if item.is_file()):
        digest.update(str(path.relative_to(root)).replace("\\", "/").encode())
        digest.update(sha256(path).encode())
    return digest.hexdigest()


def run(command: list[str], *, cwd: Path | None = None, env: dict[str, str] | None = None, timeout: int = 21600) -> None:
    subprocess.run(command, cwd=cwd, env=env, check=True, timeout=timeout)


def validate_t4(torch) -> dict:
    if not torch.cuda.is_available():
        raise RuntimeError("GATE 0 FAILED: CUDA is unavailable")
    name = torch.cuda.get_device_name(0)
    capability = torch.cuda.get_device_capability(0)
    if "T4" not in name:
        raise RuntimeError(f"GATE 0 FAILED: RAZOR T4 compatibility runtime requires Tesla T4, got {name}")
    return {
        "name": name,
        "compute_capability": f"{capability[0]}.{capability[1]}",
        "vram_gib": round(torch.cuda.get_device_properties(0).total_memory / 1024 ** 3, 2),
        "torch": torch.__version__,
        "cuda": torch.version.cuda,
    }


def patch_t4_dtype(repo: Path) -> str:
    target = repo / "acestep" / "core" / "generation" / "handler" / "init_service_orchestrator.py"
    source = target.read_text(encoding="utf-8")
    old = """                else:\n                    self.dtype = torch.float16\n                    logger.info(\n                        \"[initialize_service] Pre-Ampere CUDA detected: \"\n                        \"using float16 instead of bfloat16.\"\n                    )\n"""
    new = """                else:\n                    self.dtype = torch.float32\n                    logger.info(\n                        \"[initialize_service] RAZOR T4 compatibility runtime: \"\n                        \"using float32; FP16 fallback is disabled.\"\n                    )\n"""
    if new not in source:
        if old not in source:
            raise RuntimeError(f"GATE 0 FAILED: expected dtype branch not found: {target}")
        target.write_text(source.replace(old, new, 1), encoding="utf-8")
    return sha256(target)


def outer(args: argparse.Namespace) -> None:
    import torch

    runtime = args.runtime_dir
    repo = runtime / "ACE-Step-1.5"
    checkpoints = runtime / "checkpoints"
    adapter_root = runtime / "adapters"
    output = args.output_dir / RUNTIME_NAME
    output.mkdir(parents=True, exist_ok=True)
    runtime.mkdir(parents=True, exist_ok=True)
    if shutil.disk_usage("/tmp").free < args.min_tmp_free_gb * 1024 ** 3:
        raise RuntimeError("GATE 0 FAILED: /tmp has less than the required free space")
    gpu = validate_t4(torch)
    uv = shutil.which("uv")
    if not uv:
        run([sys.executable, "-m", "pip", "install", "--quiet", "--no-cache-dir", "uv"], timeout=900)
        uv = shutil.which("uv") or str(Path(sys.executable).parent / "uv")
    if not repo.exists():
        run(["git", "clone", "https://github.com/ace-step/ACE-Step-1.5.git", str(repo)], timeout=1800)
    run(["git", "checkout", COMMIT], cwd=repo, timeout=300)
    patch_hash = patch_t4_dtype(repo)
    run([uv, "sync", "--no-cache"], cwd=repo, timeout=3600)
    checkpoints.mkdir(exist_ok=True)
    link = repo / "checkpoints"
    if link.exists() or link.is_symlink():
        if link.is_dir() and not link.is_symlink(): shutil.rmtree(link)
        else: link.unlink()
    link.symlink_to(checkpoints, target_is_directory=True)
    run([uv, "run", "--no-sync", "acestep-download", "--model", "acestep-v15-base", "--dir", str(checkpoints)], cwd=repo, timeout=7200)
    base_dir = checkpoints / "acestep-v15-base"
    if not base_dir.is_dir():
        raise RuntimeError(f"GATE 0 FAILED: missing base model directory: {base_dir}")
    with zipfile.ZipFile(args.adapters) as archive:
        archive.extractall(adapter_root)
    adapters = {
        "epoch10": adapter_root / "pilot_20" / "checkpoints" / "epoch_10_loss_0.5858" / "adapter_model.safetensors",
        "epoch15": adapter_root / "pilot_20" / "checkpoints" / "epoch_15_loss_0.6048" / "adapter_model.safetensors",
        "epoch20": adapter_root / "pilot_20" / "final" / "adapter_model.safetensors",
    }
    if not all(path.is_file() for path in adapters.values()):
        raise RuntimeError("GATE 0 FAILED: adapter weights are incomplete")
    manifest = {
        "runtime": RUNTIME_NAME,
        "ace_step_commit": COMMIT,
        "base_model": {"revision": "ACE-Step/acestep-v15-base", "tree_sha256": tree_hash(base_dir)},
        "adapter_sha256": {name: sha256(path) for name, path in adapters.items()},
        "settings": SETTINGS,
        "gpu": gpu,
        "dtype": "torch.float32",
        "quantization": None,
        "cpu_offload": True,
        "offload_dit_to_cpu": True,
        "lm": "off",
        "dtype_patch_sha256": patch_hash,
        "disk_free_gib": round(shutil.disk_usage("/tmp").free / 1024 ** 3, 2),
    }
    manifest_path = output / f"{RUNTIME_NAME}_MANIFEST.json"
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    env = os.environ.copy()
    env.update({"MPLBACKEND": "Agg", "RAZOR_T4_COMPAT_INNER": "1", "ACESTEP_CHECKPOINTS_DIR": str(checkpoints), "ACESTEP_DISABLE_TQDM": "1"})
    run([uv, "run", "--no-sync", "python", str(Path(__file__).resolve()), "--output-dir", str(args.output_dir), "--runtime-dir", str(runtime), "--duration-seconds", str(args.duration_seconds)] + (["--adapter-label", args.adapter_label] if args.adapter_label else []), cwd=repo, env=env, timeout=21600)


def inner(args: argparse.Namespace) -> None:
    import soundfile as sf
    import torch
    from acestep.handler import AceStepHandler

    adapter_dirs = {\n        "epoch10": args.runtime_dir / "adapters" / "pilot_20" / "checkpoints" / "epoch_10_loss_0.5858",\n        "epoch15": args.runtime_dir / "adapters" / "pilot_20" / "checkpoints" / "epoch_15_loss_0.6048",\n        "epoch20": args.runtime_dir / "adapters" / "pilot_20" / "final",\n    }\n    if args.adapter_label:\n        adapter_dir = adapter_dirs[args.adapter_label]\n        if not (adapter_dir / "adapter_config.json").is_file() or not (adapter_dir / "adapter_model.safetensors").is_file():\n            raise RuntimeError(f"GATE 3 FAILED: missing adapter files: {adapter_dir}")\n\n    started = time.time()
    torch.cuda.reset_peak_memory_stats()
    output = args.output_dir / RUNTIME_NAME
    handler = AceStepHandler()
    status, ok = handler.initialize_service(
        project_root=str(args.runtime_dir / "ACE-Step-1.5"), config_path="acestep-v15-base", device="cuda",
        use_flash_attention=False, compile_model=False, offload_to_cpu=True, offload_dit_to_cpu=True,
        quantization=None, use_mlx_dit=False,
    )
    if not ok: raise RuntimeError(f"GATE {3 if args.adapter_label else (2 if args.duration_seconds == 64 else 1)} FAILED: " + status)
    if handler.dtype != torch.float32:\n        raise RuntimeError(f"GATE {3 if args.adapter_label else (2 if args.duration_seconds == 64 else 1)} FAILED: actual dtype is {handler.dtype}, expected torch.float32")\n    load_message = None\n    if args.adapter_label:\n        load_message = handler.load_lora(str(adapter_dirs[args.adapter_label]))\n        if not load_message.startswith("✅"):\n            raise RuntimeError(f"GATE 3 FAILED: {args.adapter_label} adapter load failed: {load_message}")
    result = handler.generate_music(
        captions=SETTINGS["caption"], lyrics="", bpm=SETTINGS["bpm"], key_scale=SETTINGS["key_scale"],
        time_signature=SETTINGS["time_signature"], vocal_language="unknown", inference_steps=SETTINGS["inference_steps"],
        guidance_scale=SETTINGS["guidance_scale"], use_random_seed=False, seed=SETTINGS["seed"],
        audio_duration=args.duration_seconds, batch_size=1, task_type="text2music", use_adg=SETTINGS["use_adg"],
        shift=SETTINGS["shift"], infer_method=SETTINGS["infer_method"],
    )
    if not result.get("success") or not result.get("audios"):
        raise RuntimeError("GATE 1 FAILED: " + str(result.get("error") or result.get("status_message") or "no audio"))
    audio = result["audios"][0]
    tensor = audio["tensor"].detach().float().cpu()
    nan_count, inf_count = int(torch.isnan(tensor).sum()), int(torch.isinf(tensor).sum())
    if nan_count or inf_count:
        raise RuntimeError(f"GATE {gate} FAILED: output has NaN={nan_count}, Inf={inf_count}")
    data = tensor.numpy() if tensor.ndim == 1 else tensor.transpose(0, 1).numpy()
    gate = 3 if args.adapter_label else (2 if args.duration_seconds == 64 else 1)\n    wav = output / (f"{args.adapter_label}.wav" if args.adapter_label else f"base_{int(args.duration_seconds)}s.wav")
    sf.write(wav, data, audio["sample_rate"], subtype="PCM_16")
    if not wav.is_file() or wav.stat().st_size < 4096:
        raise RuntimeError(f"GATE {gate} FAILED: WAV write failed")
    report = {
        "gate": gate, "status": "PASS", "actual_dtype": str(handler.dtype), "wav": str(wav),
        "duration_seconds": float(sf.info(str(wav)).duration), "nan": nan_count, "inf": inf_count,
        "peak_vram_gib": round(torch.cuda.max_memory_allocated() / 1024 ** 3, 3),
        "elapsed_seconds": round(time.time() - started, 2), "initialization": status,\n        "adapter_label": args.adapter_label, "adapter_path": str(adapter_dirs[args.adapter_label]) if args.adapter_label else None, "adapter_load": load_message,
    }
    (output / f"GATE_{gate}_BASE_{int(args.duration_seconds)}S_REPORT.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, default=Path("/kaggle/working"))
    parser.add_argument("--runtime-dir", type=Path, default=Path("/tmp/RAZOR_T4_COMPAT_RUNTIME_V1"))
    parser.add_argument("--adapters", type=Path, default=Path("/kaggle/input/krump-core-v1-benchmark-assets/KRUMP_CORE_V1_BENCHMARK_ADAPTERS.zip"))
    parser.add_argument("--min-tmp-free-gb", type=float, default=10.0)
    parser.add_argument("--duration-seconds", type=float, default=8.0)\n    parser.add_argument("--adapter-label", choices=("epoch10", "epoch15", "epoch20"))
    args = parser.parse_args()
    SETTINGS["duration_seconds"] = args.duration_seconds
    (inner if os.environ.get("RAZOR_T4_COMPAT_INNER") == "1" else outer)(args)


if __name__ == "__main__":
    main()

