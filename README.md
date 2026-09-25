# Video editor portfolio — GitHub + Vercel

A minimal dark portfolio with About Me, two featured projects, more work, software proficiency and contact details. Editing Skills has been removed. Project cards play muted previews on hover and open a full player when clicked.

The `/editor` page lets you upload videos, thumbnails and a portrait; edit your profile and contact links; choose Featured 1 and Featured 2; and update software proficiency.

## Deploy

1. Upload the contents of the `video-editor-portfolio-vercel` folder to a GitHub repository. `package.json`, `vercel.json`, `api`, `public`, `client` and `lib` must be at the repository root. Do not upload the ZIP file itself.
2. In Vercel, choose **Add New → Project**, import that GitHub repository, and use **Other** as the framework. `vercel.json` supplies the build command and output folder. If the code lives in a subfolder, select that folder as the Vercel Root Directory.
3. In the Vercel project's **Storage** tab, create a **public Vercel Blob** store and connect it to this project. Keep the default `BLOB_READ_WRITE_TOKEN` environment variable. A private Blob store will not work with this implementation.
4. In **Settings → Environment Variables**, add:

   | Variable | Value |
   | --- | --- |
   | `BLOB_READ_WRITE_TOKEN` | Added by the Blob connection |
   | `ADMIN_PASSWORD` | A random private password, at least 24 characters |
   | `SESSION_SECRET` | A different random value, at least 32 characters |

   Generate two separate values locally, one for each field:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Keep these values in Vercel, not GitHub. Do not reuse the example credentials from tests. Configure Production; if you enable Preview deployments, use a separate Blob store and credentials for Preview so test edits cannot change your real portfolio.
5. Redeploy after adding the variables. Open `https://your-domain/editor` and sign in using `ADMIN_PASSWORD`.
6. Replace the sample projects, upload your files and click **Save changes**. Profile and project edits do not require a new GitHub commit or redeploy. Website code changes pushed to the connected GitHub branch will deploy through Vercel.

## Using the editor

- Upload MP4/WebM videos up to 2 GB and JPG/PNG/WebP images up to 20 MB. MP4 with H.264 video and AAC audio is a practical compatibility choice.
- In **Software proficiency**, add or rename software and drag its slider from Beginner to Expert. The bar preview updates immediately; **Save changes** updates the website. You can also remove software entries.
- Select **Featured 1** and **Featured 2** on two different projects. Other projects appear in More work.
- Uploaded media has public URLs. The editor and write APIs require your password; the published portfolio and its content are public.
- Files upload directly to Vercel Blob using multipart uploads, with progress and retry support. They do not pass through GitHub or Vercel's small API request-body limit.
- **Save changes** publishes the form contents to the portfolio. Uploading alone does not add a project to the page.
- Removing a project removes its listing when saved. It does not permanently delete the media from storage.
- Editing in two tabs at once is protected by a saved revision check. If another tab saves first, reload before making a new save.
- Changing `ADMIN_PASSWORD` or `SESSION_SECRET` invalidates existing editor sessions.

## Local development

Requires Node.js 22 and pnpm. Create `.env.local` from `.env.example` and fill in your values locally.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:4173`. Without a Blob token, the sample portfolio renders and login can be tested, but saving and uploads remain unavailable. Local upload completion callbacks are not needed to save projects; the client saves the returned media URL.

```sh
pnpm test
pnpm build
```

## Implementation

- Static HTML/CSS and browser JavaScript, built with esbuild.
- Vercel Node.js functions for login, logout, reading/saving content and scoped upload tokens.
- HTTP-only, SameSite=Strict, signed session cookies with a 12-hour lifetime; secure cookies on HTTPS.
- Same-origin checks on write requests; all edit/upload authorization runs on the server.
- Vercel Blob holds public media and the portfolio JSON. Secrets and passwords are never stored in that JSON.
- Login has a supplemental per-instance attempt limit. For a globally enforced limit, configure a Vercel Firewall rate-limit rule for `/api/login`.

The sample portrait and Blender/W3C clips are placeholders, not claims about your work. Replace them in the editor. Uploads made on the earlier ChatGPT-hosted draft are not automatically copied into Vercel storage.

## Verification and remaining setup

Local build and six automated tests passed, covering session security, login, write authorization, persistence revision handling and project validation. The local browser check covered sign-in, the editor and the portfolio layout. Live Vercel Blob uploading still needs verification after you connect your own Vercel store and deploy.

## References

- [Vercel Blob setup and SDK](https://vercel.com/docs/vercel-blob/using-blob-sdk)
- [Direct browser uploads](https://vercel.com/docs/vercel-blob/client-upload)
- [GitHub deployments](https://vercel.com/docs/git/vercel-for-github)
