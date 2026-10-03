import React, { useState } from 'react';
import { Eye, Copy, Check, ShieldAlert, KeyRound, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import type { ApiService } from '../../types';

interface RevealKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  api: ApiService | null;
  onRotate?: (apiId: string) => void;
}

export const RevealKeyModal: React.FC<RevealKeyModalProps> = ({
  open,
  onOpenChange,
  api,
  onRotate,
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!api) return null;

  const actualKey = api.api_key_encrypted || 'No secret key saved for this service';

  const handleCopy = () => {
    navigator.clipboard.writeText(actualKey);
    setCopied(true);
    toast.success('API key copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setConfirmed(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>API Credential Vault</DialogTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                {api.provider} • {api.name} ({api.environment})
              </p>
            </div>
          </div>
        </DialogHeader>

        {!confirmed ? (
          <div className="space-y-4 pt-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3.5 text-xs text-amber-800">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                <span>Security Confirmation</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed">
                Revealing this secret credential exposes it on your screen. Ensure no unauthorized individuals or screen recordings are capturing this display.
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
                onClick={() => setConfirmed(true)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                <span>Confirm & Reveal Key</span>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-slate-700">
                Full Unmasked Key
              </span>
              <div className="relative flex items-center rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <code className="text-xs font-mono text-slate-900 break-all select-all">
                  {actualKey}
                </code>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy to Clipboard</span>
                  </>
                )}
              </Button>

              {onRotate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-amber-600"
                  onClick={() => {
                    handleClose();
                    onRotate(api.id);
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Rotate</span>
                </Button>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button size="sm" onClick={handleClose}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
