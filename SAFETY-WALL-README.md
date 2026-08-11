# Safety Services Wall – Share & Deploy

This page shows four video cards (16:9) with the Safety services wall. To share it so **others can watch the videos** when you push to Git:

## 1. Commit the video files

Include the `.mp4` files in the **same directory** as `Safety services wall.html` and commit them:

- `20260318_0624_New Video_storyboard_01kkz702f5e0xtcr5n18seds54.mp4` (slot 1)
- `20260318_0624_New Video_storyboard_01kkz702e9e3krx5n633arhwde.mp4` (slot 2)
- `20260318_0643_New Video_simple_compose_01kkz82z88fxg9e4j8k8r6gr2j.mp4` (slot 3)
- `20260318_0643_New Video_simple_compose_01kkz82z80f5r9542cw0z0mf7e.mp4` (slot 4)

Do **not** add these to `.gitignore` if you want them to be part of the repo.

## 2. GitHub file size limit

GitHub allows files up to **100 MB**. If any video is larger:

- Use **Git LFS** for the repo, or  
- Host the videos elsewhere (e.g. CDN, S3, or a video host) and use full URLs (e.g. via URL params or by changing the default URLs in the script).

## 3. Host the page over HTTP/HTTPS

Videos load reliably when the page is served from a web server (same origin). For example:

- **GitHub Pages:** Push the repo, enable Pages in repo Settings → Pages, and open the generated URL (e.g. `https://<user>.github.io/<repo>/`). Open `Safety services wall.html` from that base URL so the video paths resolve correctly.
- **Any static host:** Upload the whole folder (HTML + all four `.mp4` files in the same directory) to Netlify, Vercel, or your own server. Share the URL to the HTML file.

## 4. Same-directory rule

The script uses **relative paths** for the default videos. For that to work:

- Keep `Safety services wall.html` and all four `.mp4` files in the **same directory** in the repo and on the server.
- The page URL can be anything (e.g. `https://site.com/Safety%20services%20wall.html`); the videos will load from the same path (e.g. `https://site.com/20260318_0624_....mp4`).

## 5. Optional: different video location

If you host the videos in another path or domain, you can pass a base path when opening the page:

- Example: `Safety services wall.html?mediaBase=https://cdn.example.com/videos/`  
  Then all four default videos load from that URL prefix.

---

**Summary:** Commit the HTML and the four `.mp4` files together in one folder, push to Git, and host that folder (e.g. GitHub Pages). Share the link to the HTML; others will be able to watch the videos.

---

## Safety wall PT-III (`Safety wall PT-III.html`) — images for GitHub

Default media cards load **PNG files from the `media/` folder** (paths are resolved from the HTML file’s URL, so this works on GitHub Pages and project sites).

**Commit these files with the HTML:**

- `media/safety-wall-slot1.png` — media card 1 + its Past/Future thumbnails  
- `media/safety-wall-slot2.png` — media card 2 + its Past/Future thumbnails  

Do **not** add `media/*.png` to `.gitignore` if you want visitors to see the images.

Replace those files anytime (keep the same filenames) to update what everyone sees after you push.
