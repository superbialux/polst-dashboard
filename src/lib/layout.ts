/** Centred page container shared by the desktop header and the content below
 *  it, so their edges align.
 *
 *  Both desktop widths sit on a 12-column grid, all on the 4pt rule:
 *    lg  (≥1024): 12 cols × 64px + 11 gutters × 16px = 768 + 176 = 944
 *                 feed = 8 cols (624) · rail = 4 cols (304) · 624+16+304 = 944
 *    xl  (≥1280): 12 cols × 76px + 11 gutters × 16px = 912 + 176 = 1088
 *                 feed = 8 cols (720) · rail = 4 cols (352) · 720+16+352 = 1088
 */
export const PAGE_CONTAINER =
  "mx-auto w-full max-w-screen-md lg:max-w-[944px] xl:max-w-[1088px]";

/** The two-column page grid (feed + rail) matching the container math. */
export const PAGE_GRID =
  "lg:grid lg:grid-cols-[minmax(0,1fr)_304px] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_352px]";
