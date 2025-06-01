import React from 'react';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <script dangerouslySetInnerHTML={{
          __html: `
            if (typeof global === 'undefined') {
              var global = globalThis;
            }
            if (typeof process === 'undefined') {
              var process = { env: {} };
            }
            window.global = globalThis;
          `
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
