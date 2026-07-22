import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { SegmentedControl, Switch } from "@/components/dashboard";
import { useToast } from "@/components/Toast";
import { copyText } from "@/lib/utils";
import { WORKSPACE } from "@/lib/workspace";

/* ── Social share ────────────────────────────────────────────────────
   Every channel opens its real share-intent URL with the object's link —
   the new tab IS the feedback, so no toast pretends anything. Discord has
   no web share intent, so its action is an honest clipboard copy. */

const SHARE_INTENTS: Array<{ label: string; intent: (url: string, text: string) => string }> = [
  {
    label: "Facebook",
    intent: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    label: "Reddit",
    intent: (url, text) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  {
    label: "LinkedIn",
    intent: (url) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    label: "X / Twitter",
    intent: (url, text) =>
      `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

export function SocialShareModal({
  open,
  onClose,
  objectName,
  url,
}: {
  open: boolean;
  onClose: () => void;
  objectName: string;
  /** The public share link the channels distribute. */
  url: string;
}) {
  const toast = useToast();
  return (
    <Modal open={open} onClose={onClose} label="Distribute to channels" title="Distribute to channels">
      <div className="space-y-2 p-4">
        <p className="truncate pb-1 text-sm text-text-secondary">{objectName}</p>
        {SHARE_INTENTS.map(({ label, intent }) => (
          <Button
            key={label}
            variant="secondary"
            size="lg"
            className="w-full justify-start"
            onClick={() => {
              window.open(intent(url, objectName), "_blank", "noopener,noreferrer");
              onClose();
            }}
          >
            {label}
          </Button>
        ))}
        <Button
          variant="secondary"
          size="lg"
          className="w-full justify-start"
          onClick={async () => {
            const ok = await copyText(url);
            toast(ok ? "Link copied — paste it into Discord" : "Couldn't copy — try again");
            if (ok) onClose();
          }}
        >
          Discord
        </Button>
      </div>
    </Modal>
  );
}

/* ── QR code ─────────────────────────────────────────────────────────
   The QR is real — the preview, the color option, and both downloads all
   encode the actual share URL, so a phone can scan the modal. */

/** File-safe slug for download names. */
const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "polst";

/** Centered brand-monogram overlay injected into the QR's SVG. Only used
 *  with error correction H, which tolerates the covered modules. */
const logoOverlay = (svg: string, color: string): string => {
  const viewBox = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (!viewBox) return svg;
  const size = Number(viewBox[1]);
  const badge = size * 0.26;
  const origin = (size - badge) / 2;
  return svg.replace(
    "</svg>",
    `<g><rect x="${origin}" y="${origin}" width="${badge}" height="${badge}" rx="${badge * 0.18}" fill="#ffffff"/>` +
      `<text x="${size / 2}" y="${size / 2}" text-anchor="middle" dominant-baseline="central" ` +
      `font-family="system-ui, sans-serif" font-weight="700" font-size="${badge * 0.5}" fill="${color}">` +
      `${WORKSPACE.initials}</text></g></svg>`,
  );
};

/** Build the QR as an SVG string — one source of truth for the preview
 *  and both download formats. */
const buildQrSvg = async (url: string, color: string, logo: boolean): Promise<string> => {
  const svg = await QRCode.toString(url, {
    type: "svg",
    width: 200,
    margin: 2,
    // The overlay covers modules, so it needs the strongest correction.
    errorCorrectionLevel: logo ? "H" : "M",
    // Print exception: a QR quiet zone must stay true white to scan
    // reliably, so this surface deliberately skips the theme tokens.
    color: { dark: color, light: "#ffffff" },
  });
  return logo ? logoOverlay(svg, color) : svg;
};

/** Trigger a browser download of a blob, then release the object URL. */
const downloadBlob = (blob: Blob, filename: string) => {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(href);
};

/** Rasterize the QR SVG to a 1024px PNG blob via an offscreen canvas. */
const svgToPngBlob = (svg: string): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(svgUrl);
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no 2d context"));
      ctx.drawImage(image, 0, 0, 1024, 1024);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/png",
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      reject(new Error("SVG rasterization failed"));
    };
    image.src = svgUrl;
  });

/** The working QR block — live preview, URL, color/logo options, and
 *  the download row. The modal wraps it; the Distribution source detail
 *  renders it inline so preview and download need no extra click. */
export function QrPanel({ objectName, url }: { objectName: string; url: string }) {
  const toast = useToast();
  const [format, setFormat] = useState<"PNG" | "SVG">("PNG");
  // --text-primary's hex — <input type="color"> needs a literal value.
  const [color, setColor] = useState("#21262f");
  const [logo, setLogo] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;
    let stale = false;
    buildQrSvg(url, color, logo)
      .then((next) => {
        if (!stale) setSvg(next);
      })
      .catch(() => {
        if (!stale) setSvg(null);
      });
    return () => {
      stale = true;
    };
  }, [url, color, logo]);

  const download = async () => {
    if (!svg) return;
    try {
      const filename = `${slugify(objectName)}-qr`;
      if (format === "SVG") {
        downloadBlob(new Blob([svg], { type: "image/svg+xml" }), `${filename}.svg`);
      } else {
        downloadBlob(await svgToPngBlob(svg), `${filename}.png`);
      }
      toast(`${objectName} QR downloaded as ${format}`);
    } catch {
      toast("Couldn't generate the download — try again");
    }
  };

  return (
    <div className="space-y-4">
      {/* Print exception: a QR quiet zone must stay true white to scan
          reliably, so this surface deliberately skips the theme tokens. */}
      <div className="mx-auto grid size-56 place-items-center rounded-md border border-border-default bg-white">
        {svg ? (
          <span aria-label={`QR code for ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <span style={{ color }}>
            <Icon name="qr_code_2" size={184} />
          </span>
        )}
      </div>
      <div className="truncate rounded-md bg-surface-subtle px-3 py-2 font-mono text-xs text-text-secondary">
        {url}
      </div>
      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
          QR color
          <input
            type="color"
            value={color}
            onChange={(event) => setColor(event.target.value)}
            className="h-8 w-10 rounded-sm border border-border-default bg-surface-raised p-1"
          />
        </label>
        {/* A real <label>, like "QR color" beside it — clicking the words
            toggles the switch (the button is the label's control). */}
        <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
          Brand logo
          <Switch checked={logo} onChange={setLogo} label="Brand logo overlay" />
        </label>
      </div>
      <div className="flex items-center gap-2">
        <SegmentedControl
          tabs={["PNG", "SVG"] as const}
          active={format}
          onChange={setFormat}
          size="compact"
        />
        <Button className="flex-1" disabled={!svg} onClick={download}>
          <Icon name="download" size={18} />
          Download
        </Button>
      </div>
    </div>
  );
}

export function QrCodeModal({
  open,
  onClose,
  objectName,
  url,
}: {
  open: boolean;
  onClose: () => void;
  objectName: string;
  url: string;
}) {
  return (
    <Modal open={open} onClose={onClose} label="QR code" title="QR code">
      <div className="space-y-4 p-4">
        <p className="text-sm leading-5 text-text-secondary">
          Scanning opens {objectName} with attribution intact.
        </p>
        {/* Keyed remount per URL so the options start fresh per object. */}
        {open ? <QrPanel key={url} objectName={objectName} url={url} /> : null}
      </div>
    </Modal>
  );
}
