# Other people's code the engine uses

Each file is copied in unchanged, with its licence beside it (CLAUDE.md rule 8). All three are MIT.

| File | What it is | Version | Licence |
| --- | --- | --- | --- |
| `supabase.js` | Supabase's own client for the browser: phone sign-in and live updates | @supabase/supabase-js 2.119.1 (`dist/umd/supabase.js`) | `supabase.LICENSE` |
| `libphonenumber-mobile.js` | Knows what a mobile number looks like in every country | libphonenumber-js 1.13.16 (`bundle/libphonenumber-mobile.js`) | `libphonenumber.LICENSE` |
| `uqr.js` | Makes the squares of a QR code | uqr 0.1.3, packed as one browser file with esbuild (`--format=iife --global-name=uqr`) | `uqr.LICENSE` |

Nothing here is loaded from another website when a guest opens the page: the files are served with the app.
The card form is the one exception, and it is not in this folder: a card number must be typed into the payment processor's own page, which comes from the processor.
