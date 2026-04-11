import Tesseract from "tesseract.js";

export interface OCRItem {
  name: string;
  qty: number;
  price: number;
}

export interface OCRResult {
  items: OCRItem[];
  subtotal: number;
  tax: number;
  service: number;
  total: number;
  rawText: string;
}

export async function scanReceipt(
  imageSource: File | string,
  onProgress?: (progress: number) => void
): Promise<OCRResult> {
  const result = await Tesseract.recognize(imageSource, "ind+eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });

  const text = result.data.text;
  return parseReceiptText(text);
}

function parseReceiptText(text: string): OCRResult {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const items: OCRItem[] = [];
  let subtotal = 0;
  let tax = 0;
  let service = 0;
  let total = 0;

  for (const line of lines) {
    // Try to match price patterns: "Item Name  25,000" or "Item Name  25.000" or "Item Name Rp25000"
    const priceMatch = line.match(
      /^(.+?)\s+(?:Rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{1,2})?)\s*$/i
    );

    if (priceMatch) {
      const name = priceMatch[1].trim();
      const priceStr = priceMatch[2].replace(/[.,]/g, (m, offset, s) => {
        // Keep last separator if it's decimal
        const lastDot = s.lastIndexOf(".");
        const lastComma = s.lastIndexOf(",");
        const lastSep = Math.max(lastDot, lastComma);
        if (offset === lastSep && s.length - offset <= 3) return ".";
        return "";
      });
      const price = Math.round(parseFloat(priceStr));

      if (isNaN(price) || price <= 0) continue;

      const lowerName = name.toLowerCase();
      if (lowerName.includes("subtotal") || lowerName.includes("sub total")) {
        subtotal = price;
      } else if (lowerName.includes("tax") || lowerName.includes("pajak") || lowerName.includes("ppn") || lowerName.includes("pb1")) {
        tax = price;
      } else if (lowerName.includes("service") || lowerName.includes("servis") || lowerName.includes("svc")) {
        service = price;
      } else if (lowerName.includes("total") || lowerName.includes("grand")) {
        total = price;
      } else {
        // Check for qty pattern: "2x Item" or "Item x2"
        const qtyMatch = name.match(/^(\d+)\s*[xX]\s*(.+)$/) || name.match(/^(.+?)\s*[xX]\s*(\d+)$/);
        if (qtyMatch) {
          const isQtyFirst = /^\d+$/.test(qtyMatch[1]);
          items.push({
            name: isQtyFirst ? qtyMatch[2].trim() : qtyMatch[1].trim(),
            qty: parseInt(isQtyFirst ? qtyMatch[1] : qtyMatch[2]),
            price,
          });
        } else {
          items.push({ name, qty: 1, price });
        }
      }
    }
  }

  if (!subtotal && items.length > 0) {
    subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  }
  if (!total) {
    total = subtotal + tax + service;
  }

  return { items, subtotal, tax, service, total, rawText: text };
}
