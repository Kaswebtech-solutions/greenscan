// app/routes/scan-history.jsx

import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Page, LegacyCard, DataTable, Button } from "@shopify/polaris";
import { PDFDocument, StandardFonts } from "pdf-lib";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

// ----------- SERVER LOADER -------------
export const loader = async ({ request }) => {
  try {
    const { session } = await authenticate.admin(request);
    const shop = session?.shop;

    if (!shop) {
      console.warn("No shop found in session.");
      return json({ scans: [] });
    }

    const scans = await prisma.complianceScan.findMany({
      where: { storeName: shop },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return json({ scans });
  } catch (error) {
    console.error("Loader error:", error);
    return json({ scans: [] });
  }
};

// ----------- CLIENT COMPONENT -------------
export default function ScanHistory() {
  const { scans = [] } = useLoaderData() || {}; // safe fallback

  const generatePDF = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;

    let y = height - 40;
    const lineHeight = 14;

    const drawTextBlock = (label, text) => {
      const value = text || "—";
      const lines = wrapText(`${label}: ${value}`, width - 100, font, fontSize);

      lines.forEach((line, i) => {
        if (y < 60) {
          y = height - 40;
          pdfDoc.addPage(); // create new page
        }
        page.drawText(line, { x: 50, y: y, size: fontSize, font });
        y -= lineHeight;
      });

      y -= 10;
    };

    const wrapText = (text, maxWidth, font, fontSize) => {
      const words = text.split(" ");
      let line = "";
      const lines = [];

      for (const word of words) {
        const testLine = line + word + " ";
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxWidth) {
          lines.push(line.trim());
          line = word + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());
      return lines;
    };

    scans.forEach((scan, index) => {
      if (y < 80) {
        y = height - 40;
        pdfDoc.addPage(); // start new page
      }

      page.drawText(`Scan #${index + 1}`, { x: 50, y, size: fontSize + 1, font });
      y -= 16;

      drawTextBlock("Text", scan.customerText);
      drawTextBlock("Violate Text", scan.violateText);
      drawTextBlock("Reason", scan.reason);
      drawTextBlock("Suggested Text", scan.suggestedText);
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scan-history.pdf";
    link.click();
    URL.revokeObjectURL(url);
  };

  const rows = scans.map((scan) => [
    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {scan.customerText || "—"}
    </div>,
    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {scan.violateText || "—"}
    </div>,
    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {scan.reason || "—"}
    </div>,
    <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
      {scan.suggestedText || "—"}
    </div>,
  ]);

  return (
    <Page title="Scan History">
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
        <Button variant="primary" onClick={generatePDF}>
          Download
        </Button>
      </div>

      <LegacyCard>
        <DataTable
          columnContentTypes={["text", "text", "text", "text"]}
          headings={["Text", "Violate Text", "Reason", "Suggested Text"]}
          rows={rows}
        />
      </LegacyCard>
    </Page>
  );
}
