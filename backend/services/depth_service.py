"""
Depth map generation service.

PRIMARY  : Replicate API → Depth Anything V2 (requires REPLICATE_API_KEY)
FALLBACK : PIL luminance + Gaussian blur (zero dependencies beyond Pillow)
"""
import os
import uuid
import asyncio
from pathlib import Path


async def generate_depth_map(image_path: str) -> str:
    """
    Generate a depth map from an input image.
    Returns the path to the saved depth map PNG.
    """
    depth_id   = str(uuid.uuid4())[:8]
    depth_path = f"outputs/depth/depth_{depth_id}.png"
    os.makedirs("outputs/depth", exist_ok=True)

    api_key = os.getenv("REPLICATE_API_KEY", "").strip()

    if api_key:
        return await _replicate_depth(image_path, depth_path, api_key)
    else:
        return await _pil_depth_fallback(image_path, depth_path)


async def _replicate_depth(image_path: str, depth_path: str, api_key: str) -> str:
    """Call Replicate's Depth Anything V2 model."""
    try:
        import replicate
        import httpx

        os.environ["REPLICATE_API_TOKEN"] = api_key

        # Run in thread pool so we don't block the event loop
        def _run():
            with open(image_path, "rb") as f:
                output = replicate.run(
                    "depth-anything/depth-anything-v2-large:4b2e9024c2a5a7f5e2f5e2f5e2f5e2f5",
                    input={"image": f},
                )
            return output

        output_url = await asyncio.get_event_loop().run_in_executor(None, _run)

        # Download the depth image
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.get(str(output_url))
            resp.raise_for_status()
            with open(depth_path, "wb") as f:
                f.write(resp.content)

        return depth_path

    except Exception as exc:
        print(f"[depth_service] Replicate failed ({exc}), falling back to PIL")
        return await _pil_depth_fallback(image_path, depth_path)


async def _pil_depth_fallback(image_path: str, depth_path: str) -> str:
    """
    Simple depth simulation using PIL:
    1. Convert to grayscale (luminance ≈ perceived depth)
    2. Apply Gaussian blur to smooth transitions
    3. Invert so bright areas = close, dark areas = far
    """
    def _run():
        from PIL import Image, ImageFilter, ImageOps

        img = Image.open(image_path).convert("L")  # grayscale

        # Blur to smooth out fine details (simulates depth layers)
        depth = img.filter(ImageFilter.GaussianBlur(radius=4))

        # Enhance contrast for more dramatic depth
        from PIL import ImageEnhance
        depth = ImageEnhance.Contrast(depth).enhance(1.5)

        # Invert: typical depth maps have white = close, black = far
        depth = ImageOps.invert(depth)

        depth.save(depth_path)
        return depth_path

    return await asyncio.get_event_loop().run_in_executor(None, _run)
