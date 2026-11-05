Sacramento Regular is font artwork by Brian J. Bonislawsky, distributed under
the SIL Open Font License in [OFL.txt](OFL.txt). The original font is retained
unchanged, separate from the original TypeScript reader and geometry code.

Source: [google/fonts, commit 90abd17b4f97671435798b6147b698aa9087612f](https://github.com/google/fonts/blob/90abd17b4f97671435798b6147b698aa9087612f/ofl/sacramento/Sacramento-Regular.ttf).
SHA-256: `9341fda10adbfeb7efc94302b34507a3e227d7e7f5c432df3f5ac8753ff73d24`.

Run `bun scripts/generate-name-svg.ts` to regenerate the checked-in signature
without a font download. The reader supports Unicode cmap format 4, horizontal
metrics, short/long glyph locations and simple quadratic outlines. It rejects
composite glyphs. The generator accepts only this font and renders the fixed
name "Aadit Agrawal". The previous OpenType generator applies no substitutions
or nonzero kerning to that name. Changing the font or name requires reviewing
shaping and kerning needs, updating the parity fixtures, and updating the hash.

The output preserves the existing two-decimal paths, viewBox and rounded stroke
lengths. Font hinting is irrelevant to these unhinted SVG outlines.
