'use client';

import React from 'react';

export default function Home() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black z-50">
      <iframe
        src="/landing.html"
        className="w-full h-full border-0"
        title="Kasthataka Sahayaka — Digital Oasis Landing Page"
      />
    </div>
  );
}
