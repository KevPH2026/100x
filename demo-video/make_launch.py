#!/usr/bin/env python3
"""100x.pics launch video — 20s, product-demo style."""
import subprocess, os, json

OUT = "/Users/mac/projects/copyforge/demo-video"
os.chdir(OUT)

# 5个场景，每个约4秒 = 20秒
segments = [
    ("v2_01_hero.png", 4.5,
     "100x.pics. Your ad creatives, done."),
    ("v2_02_steps.png", 4.0,
     "Three steps. Upload your product. Describe your brand. Hit generate."),
    ("v2_03_chat.png", 4.5,
     "AI understands your brand and creates platform-ready ads."),
    ("v2_04_dashboard.png", 4.5,
     "Instagram, TikTok, Facebook. Every size. Every platform."),
    ("v2_05_cta.png", 4.0,
     "100x.pics. Try it free."),
]

# Step 1: TTS
print("🎤 TTS...")
for i, (_, _, text) in enumerate(segments):
    subprocess.run([
        "edge-tts", "--voice", "en-US-AriaNeural",
        "--rate", "+15%", "--text", text,
        "--write-media", f"n{i}.mp3"
    ], capture_output=True, check=True)

# Step 2: Get durations, use max(tts_dur, min_dur)
durations = []
for i in range(len(segments)):
    r = subprocess.run(["ffprobe","-v","quiet","-print_format","json","-show_format",f"n{i}.mp3"], capture_output=True, text=True)
    tts_dur = float(json.loads(r.stdout)["format"]["duration"])
    durations.append(max(tts_dur + 0.8, segments[i][1]))

total = sum(durations)
print(f"⏱ {total:.1f}s total")

# Step 3: Create clips with zoompan
print("🎞 Clips...")
for i, (img, _, _) in enumerate(segments):
    dur = durations[i]
    fps = 30
    frames = int(dur * fps)
    subprocess.run([
        "ffmpeg", "-y",
        "-loop", "1", "-i", img,
        "-i", f"n{i}.mp3",
        "-vf", f"scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,zoompan=z='min(zoom+0.0005,1.08)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={frames}:s=1920x1080:fps={fps}",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest", f"c{i}.mp4"
    ], capture_output=True)
    print(f"  ✅ c{i}.mp4 ({dur:.1f}s)")

# Step 4: Concat
print("🔗 Concat...")
with open("cl.txt", "w") as f:
    for i in range(len(segments)):
        f.write(f"file 'c{i}.mp4'\n")
subprocess.run(["ffmpeg","-y","-f","concat","-safe","0","-i","cl.txt","-c","copy","vo.mp4"], capture_output=True)

# Step 5: BGM - ambient pad
print("🎵 BGM...")
subprocess.run([
    "ffmpeg", "-y",
    "-f","lavfi","-i",f"sine=frequency=220:duration={total+2}",
    "-f","lavfi","-i",f"sine=frequency=330:duration={total+2}",
    "-f","lavfi","-i",f"sine=frequency=440:duration={total+2}",
    "-filter_complex",
    f"[0:a]volume=0.02[a];[1:a]volume=0.015[b];[2:a]volume=0.015[c];"
    f"[a][b][c]amix=inputs=3:duration=longest,lowpass=f=600,volume=0.4,"
    f"afade=t=in:st=0:d=2,afade=t=out:st={total-2}:d=2[out]",
    "-map","[out]","-c:a","libmp3lame","-b:a","128k","bgm.mp3"
], capture_output=True)

# Step 6: Mix
print("🎛 Mix...")
subprocess.run([
    "ffmpeg","-y","-i","vo.mp4","-i","bgm.mp3",
    "-filter_complex","[0:a]volume=1.0[v];[1:a]volume=0.1[b];[v][b]amix=inputs=2:duration=first[m]",
    "-map","0:v","-map","[m]",
    "-c:v","copy","-c:a","aac","-b:a","192k",
    "-shortest","-movflags","+faststart",
    "100x_launch.mp4"
], capture_output=True)

dur = float(json.loads(subprocess.run(["ffprobe","-v","quiet","-print_format","json","-show_format","100x_launch.mp4"], capture_output=True, text=True).stdout)["format"]["duration"])
size = os.path.getsize("100x_launch.mp4") / (1024*1024)
print(f"\n✅ 100x_launch.mp4 — {dur:.1f}s, {size:.1f}MB")

# Cleanup
for f in ["cl.txt","vo.mp4","bgm.mp3"]:
    if os.path.exists(f): os.remove(f)
for i in range(len(segments)):
    for p in [f"n{i}.mp3", f"c{i}.mp4"]:
        if os.path.exists(p): os.remove(p)
print("🧹 Done")
