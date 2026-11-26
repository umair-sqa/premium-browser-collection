# Chrome Web Store submission checklist

Status: **not submitted**. This checklist prepares each product for future submission.

## Per product

- [ ] Unique name and short description (≤132 characters where required)
- [ ] Detailed description matching implemented features only
- [ ] Category selection (Themes vs Productivity / Lifestyle for extensions)
- [ ] Icons (16/32/48/128 for extensions; theme store tiles)
- [ ] Screenshots / promotional images in `store/`
- [ ] Privacy practices disclosure
- [ ] Permission justifications matching `manifest.json`
- [ ] Single purpose description
- [ ] Version bump and release notes in `CHANGELOG.md`
- [ ] Manual install verification on current Chrome stable
- [ ] Confirm no remote code, no undeclared network calls

## Theme-specific

- [ ] Manifest contains only theme schema fields
- [ ] Frame and NTP images render correctly on Windows and macOS
- [ ] Active/inactive tab text remains readable

## Extension-specific

- [ ] New Tab override loads without console errors
- [ ] Settings persist across restarts
- [ ] Optional permissions / geolocation denied paths tested
- [ ] Host permissions justified (Cosmos Open-Meteo only when used)

## References

Consult the current Chrome Web Store developer documentation before uploading — requirements change.
