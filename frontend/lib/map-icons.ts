import L from 'leaflet';

/** Blue factory pin — used for matched/regular suppliers */
export const supplierIcon = L.divIcon({
  html: `
    <div style="
      width:36px;height:36px;border-radius:50% 50% 50% 0;
      background:#3b82f6;transform:rotate(-45deg);
      border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(45deg);font-size:14px;">🏭</span>
    </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -40],
});

/** Teal factory pin with glow ring — used for the matched supplier */
export const matchedSupplierIcon = L.divIcon({
  html: `
    <div style="position:relative;width:44px;height:44px;">
      <div style="
        position:absolute;inset:-4px;border-radius:50%;
        background:rgba(13,148,136,0.2);border:2px solid rgba(13,148,136,0.5);
        animation:supplierPulse 2s ease-in-out infinite;
      "></div>
      <div style="
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        background:#0d9488;transform:rotate(-45deg);
        border:3px solid #fff;box-shadow:0 2px 12px rgba(13,148,136,0.5);
        display:flex;align-items:center;justify-content:center;
        position:absolute;top:4px;left:4px;
      ">
        <span style="transform:rotate(45deg);font-size:14px;">🏭</span>
      </div>
    </div>`,
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 40],
  popupAnchor: [0, -44],
});

/** Green teardrop pin — delivery destination */
export const deliveryIcon = L.divIcon({
  html: `
    <div style="
      width:36px;height:36px;border-radius:50% 50% 50% 0;
      background:#10b981;transform:rotate(-45deg);
      border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
    ">
      <span style="transform:rotate(45deg);font-size:14px;">📦</span>
    </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -40],
});

/** Amber pulsing dot — live rider position */
export const riderIcon = L.divIcon({
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="
        position:absolute;inset:-6px;border-radius:50%;
        background:rgba(245,158,11,0.2);
        animation:riderPing 1.5s ease-out infinite;
      "></div>
      <div style="
        width:24px;height:24px;border-radius:50%;
        background:#f59e0b;border:3px solid #fff;
        box-shadow:0 2px 8px rgba(245,158,11,0.5);
      "></div>
    </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});
