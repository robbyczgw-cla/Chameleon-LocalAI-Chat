# Ambient Music Setup

The ambient music feature requires you to provide your own audio files due to CDN restrictions.

## How to Set Up

1. **Download royalty-free music** from sources like:
   - [Pixabay Music](https://pixabay.com/music/)
   - [YouTube Audio Library](https://www.youtube.com/audiolibrary)
   - [Free Music Archive](https://freemusicarchive.org/)
   - [Incompetech](https://incompetech.com/)

2. **Rename and place files** in this folder:
   - `light-theme.mp3` - Peaceful, morning vibes
   - `dark-theme.mp3` - Deep, ambient sounds
   - `cyberpunk-theme.mp3` - Electronic, futuristic
   - `retro-wave-theme.mp3` - 80s synthwave
   - `girly-violet-theme.mp3` - Soft, dreamy
   - `ocean-breeze-theme.mp3` - Coastal, relaxing

3. **File requirements**:
   - Format: MP3 (most compatible)
   - Size: Keep under 5MB for fast loading
   - Duration: 2-5 minutes (will loop)
   - License: Must be royalty-free for your use case

## Alternative: Use External URLs

If you prefer to use external URLs (like your own CDN), edit:
`/lib/ambient-music.ts` and update the `THEME_TRACKS` URLs.

## Testing

After adding files, test by:
1. Refresh the app
2. Click the music icon in the header (desktop only)
3. Check browser console for any loading errors
