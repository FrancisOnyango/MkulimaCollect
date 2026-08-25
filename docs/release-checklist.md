# Release checklist

- [ ] Run full test suite (unit + integration)
- [ ] Verify outbox atomicity integration tests pass
- [ ] Build web PWA and smoke test offline flows
- [ ] Build native Android and iOS artifacts (EAS) and verify install
- [ ] Confirm Sentry DSN set in production env
- [ ] Upload screenshots and metadata for app stores
- [ ] Create release notes and changelog
- [ ] Run E2E QA and sign off
- [ ] Trigger rollout (staged) and monitor telemetry for errors
