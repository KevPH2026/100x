#!/usr/bin/env python3
"""Generate 100x.pics demo video — reliable approach: image→clip per segment → concat."""
import subprocess, os, json

OUT = "/Users/mac/projects/copyforge/demo-video"
os.chdir(OUT)

# ── Narration Segments ──
segments = [
    ("01_landing.png", "Welcome to 100x.pics. The AI-powered ad creative platform built for DTC brands."),
    ("02_features.png", "Upload your product image, tell us about your brand, and our AI agent does the rest. No design skills needed."),
    ("03_cta.png", "From product photo to platform-ready ads in minutes. Try it free."),
    ("04_login.png", "Get started for free. Sign up with just your email."),
    ("05_chat.png", "Our AI agent understands your brand through a simple conversation. Tell it about your product, target audience, and preferred platforms. It generates ad creatives tailored for Instagram, TikTok, Facebook, Pinterest, and more."),
    ("06_dashboard.png", "Every creative is organized in your personal dashboard. Download anytime, with automatic sizing for each platform."),
    ("07_admin_overview.png", "Behind the scenes, a powerful admin dashboard tracks usage, registrations, and asset generation in real time."),
    ("08_admin_users.png", "See who signed up, manage quotas, and monitor user activity at a glance."),
    ("09_admin_assets.png", "Browse all generated assets with brand names, platforms, and scene descriptions. Complete creative intelligence for your DTC business."),
]

# ── Step 1: Generate TTS for each segment ──
print("🎤 Generating TTS...")
for i, (_, text) in enumerate(segments):
    mp3 = f"narr_{i:02d}.mp3"
    subprocess.run([
        "edge-tts", "--voice", "en-US-AriaNeural", "--rate", "+5%",
        "--text", text, "--write-media", mp3
    ], check=True, capture_output=True)
print(f"  ✅ {len(segments)} narration clips")

# ── Step 2: Get durations ──
durations = []
for i in range(len(segments)):
    r = subprocess.run(
        ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", f"narr_{i:02d}.mp3"],
        capture_output=True, text=True
    )
    dur = float(json.loads(r.stdout)["format"]["duration"])
    # Pad 2s for breathing room
    durations.append(dur + 2.0)

total = sum(durations)
print(f"⏱ Total duration: {total:.1f}s")

# ── Step 3: Create individual clips (image + narration) ──
print("🎞 Creating video clips...")
for i, (img, _) in enumerate(segments):
    dur = durations[i]
    clip = f"clip_{i:02d}.mp4"
    mp3 = f"narr_{i:02d}.mp3"
    
    # Image → video with pan zoom (Ken Burns effect) + audio
    # Subtle zoom in from 100% to 105%
    subprocess.run([
        "ffmpeg", "-y",
        "-loop", "1", "-t", str(dur), "-i", img,
        "-i", mp3,
        "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,zoompan=z='min(zoom+0.0003,1.05)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={int(dur*30)}:s=1920x1080:fps=30",
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest",
        clip
    ], capture_output=True, text=True)
    
    size_kb = os.path.getsize(clip) / 1024
    print(f"  ✅ clip_{i:02d}.mp4 ({dur:.1f}s, {size_kb:.0f}KB)")

# ── Step 4: Concat all clips ──
print("\n🔗 Concatenating clips...")
with open("cliplist.txt", "w") as f:
    for i in range(len(segments)):
        f.write(f"file 'clip_{i:02d}.mp4'\n")

subprocess.run([
    "ffmpeg", "-y", "-f", "concat", "-safe", "0",
    "-i", "cliplist.txt", "-c", "copy", "video_only.mp4"
], capture_output=True)

# ── Step 5: Generate BGM ──
print("🎵 Generating BGM...")
# Create a pleasant ambient pad with multiple sine waves + some warmth
subprocess.run([
    "ffmpeg", "-y",
    "-f", "lavfi", "-i", f"sine=frequency=174:duration={total+2}",
    "-f", "lavfi", "-i", f"sine=frequency=220:duration={total+2}",
    "-f", "lavfi", "-i", f"sine=frequency=261:duration={total+2}",
    "-f", "lavfi", "-i", f"sine=frequency=329:duration={total+2}",
    "-filter_complex",
    f"[0:a]volume=0.02[a];[1:a]volume=0.02[b];[2:a]volume=0.015[c];[3:a]volume=0.015[d];"
    f"[a][b][c][d]amix=inputs=4:duration=longest,"
    f"lowpass=f=600,volume=0.5,"
    f"afade=t=in:st=0:d=3,afade=t=out:st={total-3}:d=3[out]",
    "-map", "[out]", "-c:a", "libmp3lame", "-b:a", "128k", "bgm.mp3"
], capture_output=True)

# ── Step 6: Mix video audio + BGM ──
print("🎛 Mixing audio...")
subprocess.run([
    "ffmpeg", "-y",
    "-i", "video_only.mp4",
    "-i", "bgm.mp3",
    "-filter_complex",
    "[0:a]volume=1.0[vid];[1:a]volume=0.12[bgm];[vid][bgm]amix=inputs=2:duration=first:dropout_transition=3[mix]",
    "-map", "0:v", "-map", "[mix]",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    "100x_demo.mp4"
], capture_output=True)

# ── Result ──
result = subprocess.run(
    ["ffprobe", "-v", "quiet", "-print_format", "json", "-show_format", "100x_demo.mp4"],
    capture_output=True, text=True
)
dur = float(json.loads(result.stdout)["format"]["duration"])
size = os.path.getsize("100x_demo.mp4") / (1024*1024)

print(f"\n✅ DONE!")
print(f"   📏 {dur:.1f}s ({dur/60:.1f}min)")
print(f"   💾 {size:.1f}MB")
print(f"   📂 {OUT}/100x_demo.mp4")

# Cleanup
for f in ["cliplist.txt", "bgm.mp3", "video_only.mp4"]:
    if os.path.exists(f): os.remove(f)
for i in range(len(segments)):
    for p in [f"narr_{i:02d}.mp3", f"clip_{i:02d}.mp4"]:
        if os.path.exists(p): os.remove(p)
print("   🧹 Cleaned up")
