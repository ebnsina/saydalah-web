// The app is authenticated entirely client-side (the token lives in
// localStorage), so server rendering would flash the signed-out UI before
// hydration. Rendering on the client only reads the token before first paint —
// no flash — which is the right trade-off for this internal dashboard.
export const ssr = false;
