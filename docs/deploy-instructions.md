# Deployment & Signing Instructions

## Web (PWA)
1. Build: `npm run build:web`
2. Deploy `dist/` to a static hosting provider (Netlify, Vercel, S3+CloudFront).
3. Ensure environment variables (SENTRY DSN, API endpoints) are set in hosting service.

## Native (Expo / EAS)
1. Ensure `eas.json` is configured for production builds.
2. Obtain `EAS_TOKEN` and add it to GitHub Secrets as `EAS_TOKEN`.
3. For automatic signing, add platform-specific credentials in EAS or use manual signing.
4. Trigger the `EAS Build` workflow from GitHub Actions or run locally:
   - `eas build --platform all --non-interactive`

## CI Secrets
- EAS_TOKEN: for EAS builds
- SENTRY_DSN: for Sentry uploads
- APPLE_APP_SPECIFIC and APPLE_CERT: if using automatic iOS signing
- ANDROID_KEYSTORE: base64-encoded keystore if using CI signing

## Post-build
- Upload artifacts from `eas-build-artifacts/` (CI will attempt to upload common output file patterns).
- Use TestFlight / Play Console for staged rollouts.
