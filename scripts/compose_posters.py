from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
LANDING = ROOT / "src" / "assets" / "landing"
FONT_BOLD = r"C:\Windows\Fonts\msjhbd.ttc"
FONT_REGULAR = r"C:\Windows\Fonts\msjh.ttc"
RED = (255, 54, 41, 255)
WHITE = (245, 245, 245, 255)
DIM = (224, 224, 226, 255)


def load_font(path: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(path, size=size)


def text_block_height(draw: ImageDraw.ImageDraw, lines: Iterable[str], font: ImageFont.FreeTypeFont, spacing: int) -> int:
    total = 0
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        total += bbox[3] - bbox[1]
        if i:
            total += spacing
    return total


def wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    words = list(text)
    lines: list[str] = []
    current = ""
    for char in words:
        candidate = current + char
        bbox = draw.textbbox((0, 0), candidate, font=font)
        if bbox[2] - bbox[0] <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = char
    if current:
        lines.append(current)
    return lines


def draw_lines(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    lines: list[str],
    font: ImageFont.FreeTypeFont,
    fill: tuple[int, int, int, int],
    spacing: int,
) -> int:
    for line in lines:
        draw.text((x, y), line, font=font, fill=fill)
        bbox = draw.textbbox((x, y), line, font=font)
        y += (bbox[3] - bbox[1]) + spacing
    return y


def add_left_panel(base: Image.Image, panel_width: int) -> None:
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    draw.rectangle((0, 0, panel_width, base.height), fill=(0, 0, 0, 218))
    for i in range(200):
      alpha = max(0, 180 - i)
      draw.rectangle((panel_width + i, 0, panel_width + i + 1, base.height), fill=(0, 0, 0, alpha))
    base.alpha_composite(overlay)


def add_formula_poster(background: Path, output: Path) -> None:
    base = Image.open(background).convert("RGBA")
    add_left_panel(base, 540)
    overlay = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    headline_font = load_font(FONT_BOLD, 92)
    body_font = load_font(FONT_REGULAR, 34)
    formula_font = load_font(FONT_BOLD, 38)
    mult_font = load_font(FONT_BOLD, 42)
    result_font = load_font(FONT_BOLD, 62)

    draw.rectangle((64, 140, 122, 148), fill=RED)
    title_lines = ["為什麼你會", "被帶進去？"]
    y = 210
    y = draw_lines(draw, 64, y, title_lines, headline_font, WHITE, 12)
    subtitle = ["這不是偶然的嗨。", "每一個環節都經過設計。"]
    draw.rectangle((64, y + 8, 122, y + 16), fill=RED)
    draw_lines(draw, 64, y + 52, subtitle, body_font, DIM, 14)

    formula_x = 660
    formula_top = 110
    band = Image.new("RGBA", base.size, (0, 0, 0, 0))
    band_draw = ImageDraw.Draw(band)
    band_draw.rounded_rectangle((610, 56, 1100, 852), radius=36, fill=(0, 0, 0, 106))
    band_draw.rectangle((622, 72, 1088, 836), outline=(255, 60, 45, 80), width=2)
    base.alpha_composite(band)
    draw = ImageDraw.Draw(base)

    terms = [
        "共同注意力",
        "身體同步",
        "預期堆疊",
        "腦內啡的釋放",
        "你屬於這裡",
        "情緒感染",
    ]
    y = formula_top
    for i, term in enumerate(terms):
        bbox = draw.textbbox((0, 0), term, font=formula_font)
        width = bbox[2] - bbox[0]
        draw.text((formula_x + (390 - width) // 2, y), term, font=formula_font, fill=WHITE)
        y += 64
        if i < len(terms) - 1:
            x_bbox = draw.textbbox((0, 0), "×", font=mult_font)
            xw = x_bbox[2] - x_bbox[0]
            draw.text((formula_x + (390 - xw) // 2, y), "×", font=mult_font, fill=RED)
            y += 48

    draw.text((formula_x + 154, y + 4), "=", font=result_font, fill=RED)
    result_y = y + 74
    result_bbox = draw.textbbox((0, 0), "集體亢奮", font=result_font)
    result_w = result_bbox[2] - result_bbox[0]
    draw.text((formula_x + (390 - result_w) // 2, result_y), "集體亢奮", font=result_font, fill=RED)
    draw.rectangle((formula_x + 34, result_y + 86, formula_x + 356, result_y + 90), fill=RED)

    base.save(output)


def add_flow_overview_poster(background: Path, output: Path) -> None:
    base = Image.open(background).convert("RGBA")
    add_left_panel(base, 608)
    draw = ImageDraw.Draw(base)

    headline_font = load_font(FONT_BOLD, 88)
    body_font = load_font(FONT_REGULAR, 34)

    draw.rectangle((64, 138, 122, 146), fill=RED)
    title = ["安全並且", "精心編排的", "失控"]
    y = 200
    y = draw_lines(draw, 64, y, title, headline_font, WHITE, 10)
    draw.rectangle((64, y + 10, 122, y + 18), fill=RED)

    lines = [
        "你可能會出神，事後忘記過程",
        "做了什麼，但不會受傷。",
    ]
    draw_lines(draw, 64, y + 56, lines, body_font, DIM, 16)
    base.save(output)


if __name__ == "__main__":
    import sys

    mode = sys.argv[1]
    background = Path(sys.argv[2])
    output = Path(sys.argv[3])

    if mode == "formula":
        add_formula_poster(background, output)
    elif mode == "overview":
        add_flow_overview_poster(background, output)
    else:
        raise SystemExit(f"unknown mode: {mode}")
