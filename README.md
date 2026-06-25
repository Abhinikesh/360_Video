# Horizon

**Turn any photo into an immersive, narrated 360° story — powered by AI.**

Horizon takes a single photo of a place, generates a depth-based parallax animation from it, writes a narration script using AI vision, converts that script to natural-sounding speech, and renders everything into a downloadable, shareable video. No 360° camera required.

It also includes **Demo Maker**, a built-in secondary tool for turning screenshots or screen recordings into narrated walkthrough videos — useful for product demos and explainer content.

🔗 **Live Demo:** _coming soon_

<!-- 
  📸 ADD SCREENSHOT HERE: Homepage hero section
  ![Horizon Homepage](./screenshots/homepage.png)
-->

---

## ✨ Features

- **AI Depth-Based 360° Effect** — Converts a single flat photo into a parallax animation using AI depth estimation, with no special camera needed
- **Live Camera Capture** — Capture photos directly from your device camera, including a guided panoramic mode
- **AI Auto-Narration** — Generates a complete narration script from your image using Google Gemini Vision
- **Multi-Language Voice Narration** — Text-to-speech in 10+ languages with multiple voice styles
- **Background Music** — Procedurally generated ambient tracks mixed under narration, 100% free and offline
- **QR Code Sharing** — Every story gets a branded QR code linking to a public, no-login share page
- **Demo Maker** — A separate tool for building narrated demo videos from photo slideshows or screen recordings

<!-- 
  📸 ADD SCREENSHOT HERE: Create page / 3-column editor
  ![Create Page](./screenshots/create-page.png)
-->

---

## 🧱 Tech Stack

**Frontend**
- React + Vite
- React Router
- Tailwind CSS

**Backend**
- FastAPI (Python)
- MongoDB (via Motor, async)
- FFmpeg for video/audio processing
- OpenCV + NumPy for depth-based animation

**AI & Services**
- Google Gemini (image-to-narration)
- gTTS (free text-to-speech, no API key required)
- Google OAuth 2.0 (sign-in)
- `qrcode` (Python) for QR generation

<!-- 
  📸 ADD SCREENSHOT HERE: Result screen with video + QR code
  ![Result Screen](./screenshots/result-screen.png)
-->

---

## 🎬 Demo Maker

Horizon also includes a secondary tool, accessible at `/demo-maker`, for creating narrated demo/explainer videos:

- **Photos to Video** — Upload 5–10 images, reorder them, add narration per slide, generate a transitioned slideshow with voiceover
- **Screen Recording Voiceover** — Upload a screen recording, write or auto-generate a narration script, and have it mixed in over (or replacing) the original audio

<!-- 
  📸 ADD SCREENSHOT HERE: Demo Maker page
  ![Demo Maker](./screenshots/demo-maker.png)
-->

---

## 📄 License

This project is currently unlicensed / private. Add a license file here if you intend to open-source it.

---

## 🙏 Acknowledgments

Built with FastAPI, React, FFmpeg, and a deliberate focus on using only free, open infrastructure wherever possible.
