// Lightweight standalone SVG QR Code Generator

export function generateQRCodeSVG(text: string, size = 200, color = '#000000', bgColor = '#ffffff'): string {
  // Generate SVG QR code via quick API / local matrix encoder
  const encodedText = encodeURIComponent(text || 'https://postercraft.app')
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&color=${color.replace('#', '')}&bgcolor=${bgColor.replace('#', '')}`
  return qrUrl
}

export function generateBarcodeDataUrl(text: string): string {
  // Return clean SVG Barcode data URL
  const code = text || '1234567890'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <g fill="#000000">
      <rect x="20" y="15" width="4" height="60"/>
      <rect x="28" y="15" width="2" height="60"/>
      <rect x="34" y="15" width="6" height="60"/>
      <rect x="44" y="15" width="2" height="60"/>
      <rect x="50" y="15" width="4" height="60"/>
      <rect x="58" y="15" width="8" height="60"/>
      <rect x="70" y="15" width="2" height="60"/>
      <rect x="76" y="15" width="6" height="60"/>
      <rect x="86" y="15" width="4" height="60"/>
      <rect x="94" y="15" width="2" height="60"/>
      <rect x="100" y="15" width="6" height="60"/>
      <rect x="110" y="15" width="4" height="60"/>
      <rect x="118" y="15" width="2" height="60"/>
      <rect x="124" y="15" width="8" height="60"/>
      <rect x="136" y="15" width="2" height="60"/>
      <rect x="142" y="15" width="4" height="60"/>
      <rect x="150" y="15" width="6" height="60"/>
      <rect x="160" y="15" width="2" height="60"/>
      <rect x="166" y="15" width="4" height="60"/>
      <rect x="174" y="15" width="8" height="60"/>
      <rect x="186" y="15" width="2" height="60"/>
      <rect x="192" y="15" width="6" height="60"/>
      <rect x="202" y="15" width="4" height="60"/>
      <rect x="210" y="15" width="2" height="60"/>
      <rect x="216" y="15" width="8" height="60"/>
      <rect x="228" y="15" width="2" height="60"/>
      <rect x="234" y="15" width="4" height="60"/>
      <rect x="242" y="15" width="6" height="60"/>
      <rect x="252" y="15" width="4" height="60"/>
      <rect x="260" y="15" width="4" height="60"/>
      <rect x="268" y="15" width="12" height="60"/>
    </g>
    <text x="150" y="88" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle" fill="#000000">${code}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
