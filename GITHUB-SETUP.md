# Setup

1. Replace the repository files with this folder's contents.
2. Create a fine-grained token at https://github.com/settings/personal-access-tokens/new . Select only aas_vos-portfolio, with Repository permissions → Contents → Read and write.
3. In Vercel environment variables add GITHUB_TOKEN for Production only. Keep ADMIN_PASSWORD and SESSION_SECRET. Redeploy.

Defaults: repository Night5200/aas_vos-portfolio, branch main. Override with GITHUB_REPOSITORY and GITHUB_BRANCH if needed.

Save changes commits lib/defaults.json; image uploads commit public/media files separately. Vercel publishes the changes after deployment finishes. Images must be JPG/PNG/WebP under 2 MB; newly uploaded images appear after deployment. Videos use external links.

Existing Blob content is NOT automatically migrated. Copy your current text and links before switching, and re-upload old Blob images before deleting the store. Keep lib/defaults.json if it already contains real content. Do not delete the store until all old Blob URLs have been replaced.

The branch must allow direct commits. Keep tokens out of GitHub; replace the token in Vercel when it expires. Do not give Preview deployments the production token.
