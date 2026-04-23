# Firefox Release Path

This project is compatible with Firefox MV3 and can be released on AMO.

## 1. Local Firefox Test
1. Open `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select this project's `manifest.json`
4. Open a few `http/https` pages and verify:
   - Banner appears
   - Popup opens and checks active domain
   - Unsupported pages (like `about:`) show the neutral popup state

## 2. Build Firefox Package
Use PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\build-firefox-package.ps1
```

Output:
- `dist\kosovo-gov-site-verification-firefox.zip`

## 3. AMO Submission Notes
- Upload the generated zip to AMO.
- Manifest includes:
  - `browser_specific_settings.gecko.id`
  - `browser_specific_settings.gecko.strict_min_version`
- If AMO review flags anything, fix and rebuild package.

## 4. Quick Compatibility Checklist
- `manifest_version` is 3
- Service worker background starts correctly
- Content scripts only run on `http/https`
- No Chrome-only APIs are required for core behavior
