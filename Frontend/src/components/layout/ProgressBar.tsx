'use client';

import NextNProgress from 'nextjs-progressbar';

export default function ProgressBar() {
  return (
    <NextNProgress
      color="#a3e635"
      height={3}
      showOnShallow={true}
      options={{ showSpinner: false }}
    />
  );
}