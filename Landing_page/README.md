# Ink Bloom Gallery

A fullscreen WebGL image gallery prototype featuring an organic ink-bleed transition effect.

## How to Run

1. Make sure you have Node.js installed.
2. Clone or open the project folder.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Controls
- **Click**: Trigger transition to the next image (from your mouse position).
- **Keys `1` to `5`**: Switch between the 5 available transition modes. Mode can only be switched when a transition is not currently active.

## Transition Modes

| Mode | Key | Description |
| :--- | :--- | :--- |
| **Ink Bloom** | `1` | Organic ink-bleed using FBM noise, distance fields, and edge distortion. |
| **RGB Split** | `2` | Splits R, G, B channels with sine-wave displacement peaking mid-transition. |
| **Slice Shutter** | `3` | Divides screen into vertical strips, sliding the old image up progressively. |
| **Pixel Mosaic** | `4` | Cellular flip using a grid. Each cell flips individually, briefly pixelating. |
| **Zoom Blur** | `5` | Radial blur effect. Old image zooms in, new zooms out, crossfading in the middle. |

## Tunable Shader Constants

Open `src/shaders/ink.frag.glsl` to modify these values at the top of the file:

**Mode 0: Ink Bloom**
| Constant | Description |
| :--- | :--- |
| `NOISE_SCALE` | Controls how large the ink branches are |
| `NOISE_STRENGTH` | Controls deviation from a perfect circle |
| `EDGE_SOFTNESS` | Softness of the ink mask edge |
| `EDGE_WIDTH` | Width of the rim/edge effect |
| `DISTORTION_AMOUNT` | Liquid distortion intensity |
| `NOISE_SPEED` | Speed of the noise animation |

**Mode 1: RGB Split**
| Constant | Description |
| :--- | :--- |
| `RGB_OFFSET_MULT` | Maximum channel separation distance |
| `RGB_WAVE_FREQ` | Frequency of the vertical sine wave distortion |
| `RGB_WAVE_AMP` | Amplitude of the vertical sine wave distortion |

**Mode 2: Slice Shutter**
| Constant | Description |
| :--- | :--- |
| `SLICE_COUNT` | Number of vertical strips across the screen |
| `SLICE_DELAY_MULT` | Stagger delay between adjacent strips |
| `SLICE_GAP` | Width of the dark gap separating strips |

**Mode 3: Pixel Mosaic**
| Constant | Description |
| :--- | :--- |
| `MOSAIC_COLS` | Number of grid columns (rows auto-calculate) |
| `MOSAIC_EDGE_BRIGHTNESS`| Intensity of the white flash as a cell flips |

**Mode 4: Zoom Blur**
| Constant | Description |
| :--- | :--- |
| `ZOOM_SAMPLES` | Number of radial blur passes (performance vs quality) |
| `ZOOM_MAX_SCALE1` | How large the old image scales up to before disappearing |
| `ZOOM_MAX_SCALE2` | How large the new image starts at before scaling down to 1.0 |

## Notes & Assumptions

- Assumed the images will load reasonably fast. The gallery waits for all images to preload before displaying.
- Images fit their height perfectly to the screen while proportionally scaling their width, drawing black bars to prevent edge smearing if they are narrower than the window.
- UI overlay has `mix-blend-mode: difference` for better contrast over varied backgrounds.
