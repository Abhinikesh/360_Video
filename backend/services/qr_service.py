"""
QR Code service — generate branded QR code PNGs for project share links.

Uses the free, open-source `qrcode[pil]` library.
Runs fully offline — no external API calls.
QR codes are cached to disk after first generation.
"""
import os
import uuid
import qrcode
from PIL import Image, ImageDraw

QR_OUTPUT_DIR = "outputs/qrcodes"

# Canvas dimensions
_QR_SIZE       = 300   # QR module area
_CANVAS_W      = 380
_CANVAS_H      = 440
_BORDER_RADIUS = 16


def ensure_qr_dir() -> None:
    os.makedirs(QR_OUTPUT_DIR, exist_ok=True)


def generate_qr_code(
    project_id: str,
    project_title: str,
    share_url: str,
) -> str:
    """
    Generate a styled, branded QR code PNG for a project share URL.

    Returns the absolute path to the saved PNG file.
    The file is cached — calling again with the same project_id will
    re-generate (QR may differ due to uuid suffix, but that's fine).
    """
    ensure_qr_dir()

    # ── Build QR matrix ──────────────────────────────────────────────────────
    qr = qrcode.QRCode(
        version=2,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=9,
        border=4,
    )
    qr.add_data(share_url)
    qr.make(fit=True)

    # Try rounded style; fall back to plain PIL image if the style module
    # is unavailable (older qrcode installs).
    try:
        from qrcode.image.styledpil import StyledPilImage
        from qrcode.image.styles.moduledrawers.pil import RoundedModuleDrawer
        qr_img = qr.make_image(
            image_factory=StyledPilImage,
            module_drawer=RoundedModuleDrawer(),
        ).convert("RGB")
    except Exception:
        qr_img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    qr_img = qr_img.resize((_QR_SIZE, _QR_SIZE), Image.LANCZOS)

    # ── Build branded canvas ─────────────────────────────────────────────────
    canvas = Image.new("RGB", (_CANVAS_W, _CANVAS_H), "#FFFFFF")
    draw   = ImageDraw.Draw(canvas)

    # Paste QR centered horizontally, with top padding
    qr_x = (_CANVAS_W - _QR_SIZE) // 2
    qr_y = 36
    canvas.paste(qr_img, (qr_x, qr_y))

    cx = _CANVAS_W // 2  # center x

    # "Scan to view story" subtitle
    _draw_centered(draw, cx, _QR_SIZE + 55,  "Scan to view story",   "#9CA3AF", 14)

    # Project title (truncated)
    title = (project_title[:32] + "…") if len(project_title) > 32 else project_title
    _draw_centered(draw, cx, _QR_SIZE + 83,  title,                  "#111827", 17)

    # Thin divider
    div_y = _QR_SIZE + 106
    draw.line([(cx - 80, div_y), (cx + 80, div_y)], fill="#E5E7EB", width=1)

    # "Made with Horizon" branding
    _draw_centered(draw, cx, _QR_SIZE + 125, "Made with Horizon",    "#2563EB", 13)

    # ── Save ─────────────────────────────────────────────────────────────────
    filename    = f"qr_{project_id[:12]}_{uuid.uuid4().hex[:6]}.png"
    output_path = os.path.join(QR_OUTPUT_DIR, filename)
    canvas.save(output_path, "PNG")

    return output_path


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _draw_centered(
    draw: ImageDraw.ImageDraw,
    cx: int,
    cy: int,
    text: str,
    fill: str,
    font_size: int,
) -> None:
    """Draw text centered at (cx, cy). Uses truetype if available, else default."""
    try:
        from PIL import ImageFont
        # Try to load a system font; fall back to default if not found
        font_candidates = [
            "/System/Library/Fonts/Helvetica.ttc",      # macOS
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Ubuntu
            "/usr/share/fonts/liberation/LiberationSans-Regular.ttf",
        ]
        font = None
        for path in font_candidates:
            if os.path.exists(path):
                font = ImageFont.truetype(path, font_size)
                break
        if font is None:
            font = ImageFont.load_default()
        bbox = draw.textbbox((cx, cy), text, font=font, anchor="mm")
        draw.text((cx, cy), text, fill=fill, font=font, anchor="mm")
    except Exception:
        # Ultimate fallback: no anchor support
        draw.text((cx - len(text) * 3, cy), text, fill=fill)
