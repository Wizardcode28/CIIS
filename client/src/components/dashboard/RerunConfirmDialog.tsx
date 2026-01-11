import { useState } from 'react';
import { RerunIntent } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface RerunConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (intent: RerunIntent) => void;
}

export function RerunConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: RerunConfirmDialogProps) {
  const [intent, setIntent] = useState<'light' | 'medium' | 'deep'>('medium');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Rerun Live Report
          </AlertDialogTitle>

          <AlertDialogDescription className="space-y-4" asChild>
            <div>
              <p>
                This will scrape fresh social media data and regenerate the report.
                Processing time depends on the selected depth.
              </p>

              {/* Intent selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="intent"
                    value="light"
                    checked={intent === 'light'}
                    onChange={() => setIntent('light')}
                  />
                  <span>
                    <strong>Light</strong> — Quick scan (~few minutes)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="intent"
                    value="medium"
                    checked={intent === 'medium'}
                    onChange={() => setIntent('medium')}
                  />
                  <span>
                    <strong>Medium</strong> — Balanced analysis (recommended)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="intent"
                    value="deep"
                    checked={intent === 'deep'}
                    onChange={() => setIntent('deep')}
                  />
                  <span>
                    <strong>Deep</strong> — Maximum coverage (slowest)
                  </span>
                </label>
              </div>

              <p className="text-sm text-muted-foreground">
                The system automatically applies safe limits to avoid overloading APIs.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(intent)}
            className="bg-primary hover:bg-primary-hover text-primary-foreground"
          >
            Rerun Report
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
