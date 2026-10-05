import type { AnalysisStatus } from '@/types/models';

export const DISCLAIMER =
  'This result explains information returned for the selected profile. Check the package label, and ask a qualified professional when a decision affects someone’s health.';

export const STATUS_FALLBACK_LABEL: Record<AnalysisStatus, string> = {
  suitable: 'Good fit',
  review: 'Review',
  avoid: "Doesn't fit",
};

export const FIT_LABEL = {
  GOOD_FIT: 'Good fit',
  REVIEW: 'Review',
  DOES_NOT_FIT: "Doesn't fit",
  INSUFFICIENT_INFORMATION: 'Not enough information',
} as const;

export const STATUS_FALLBACK_SUMMARY: Record<AnalysisStatus, string> = {
  suitable: 'The backend did not flag a concern for the selected profile. Still check the package label.',
  review: 'The backend did not include an overall status. Review the details it did return, and check the package label.',
  avoid: 'The backend marked this as not suitable for the selected profile. Check the package label before using it.',
};
