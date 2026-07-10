import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon";
import { Modal } from "@/components/Modal";
import { Switch } from "@/components/dashboard";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

const SOCIAL_CHANNELS = ["Facebook", "Reddit", "LinkedIn", "X / Twitter", "Discord"];

export function SocialShareModal({
  open,
  onClose,
  objectName,
}: {
  open: boolean;
  onClose: () => void;
  objectName: string;
}) {
  const toast = useToast();
  return (
    <Modal open={open} onClose={onClose} label="Distribute to channels" title="Distribute to channels">
      <div className="space-y-2 p-4">
        <p className="pb-1 text-sm text-text-secondary">Share {objectName} through a social channel.</p>
        {SOCIAL_CHANNELS.map((channel) => (
          <Button
            key={channel}
            variant="secondary"
            size="lg"
            className="w-full justify-start"
            onClick={() => {
              toast(`${channel} share opened`);
              onClose();
            }}
          >
            {channel}
          </Button>
        ))}
      </div>
    </Modal>
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
  const toast = useToast();
  const [format, setFormat] = useState<"PNG" | "SVG">("PNG");
  const [color, setColor] = useState("#171717");
  const [logo, setLogo] = useState(false);
  return (
    <Modal open={open} onClose={onClose} label="QR code" title="QR code">
      <div className="space-y-4 p-4">
        <p className="text-sm leading-5 text-text-secondary">
          Scanning opens {objectName} with attribution intact.
        </p>
        <div className="mx-auto grid size-56 place-items-center rounded-md border border-border-default bg-white">
          <span style={{ color }}><Icon name="qr_code_2" size={184} /></span>
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">Brand logo</span>
            <Switch checked={logo} onChange={setLogo} label="Brand logo overlay" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border border-border-default bg-surface-raised p-1">
            {(["PNG", "SVG"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFormat(option)}
                className={cn(
                  "h-7 rounded-sm px-3 text-sm font-semibold text-text-secondary",
                  format === option && "bg-surface-subtle text-text-primary",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          <Button
            className="flex-1"
            onClick={() => toast(`${objectName} QR downloaded as ${format}`)}
          >
            <Icon name="download" size={18} />
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}
