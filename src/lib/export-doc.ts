import jsPDF from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .replace(/https?:\/\//, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60) || "ccscloner-guide"
  );
}

export function downloadPdf(title: string, markdown: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 56;
  const width = doc.internal.pageSize.getWidth() - margin * 2;
  const bottom = doc.internal.pageSize.getHeight() - margin;
  let y = margin;

  const nextPage = (lineHeight: number) => {
    if (y + lineHeight > bottom) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(doc.splitTextToSize(title, width), margin, y);
  y += 30;

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trimEnd();
    if (!line) {
      y += 8;
      continue;
    }
    let text = line;
    let size = 11;
    let style: "normal" | "bold" = "normal";

    if (line.startsWith("### ")) {
      text = line.slice(4);
      size = 12;
      style = "bold";
    } else if (line.startsWith("## ")) {
      text = line.slice(3);
      size = 14;
      style = "bold";
    } else if (line.startsWith("# ")) {
      text = line.slice(2);
      size = 17;
      style = "bold";
    } else if (line.startsWith("- ")) {
      text = "•  " + line.slice(2);
    }

    text = text.replace(/\*\*/g, "");
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    const wrapped: string[] = doc.splitTextToSize(text, width);
    for (const w of wrapped) {
      nextPage(size + 6);
      doc.text(w, margin, y);
      y += size + 6;
    }
    if (style === "bold") y += 6;
  }

  doc.save(`${slugify(title)}.pdf`);
}

export async function downloadDocx(title: string, markdown: string) {
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.LEFT,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: title, bold: true, size: 40 })],
    }),
  ];

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      children.push(new Paragraph({ children: [new TextRun("")] }));
      continue;
    }
    if (line.startsWith("# ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: line.slice(2).replace(/\*\*/g, ""), bold: true })],
        }),
      );
    } else if (line.startsWith("## ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [new TextRun({ text: line.slice(3).replace(/\*\*/g, ""), bold: true })],
        }),
      );
    } else if (line.startsWith("### ")) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [new TextRun({ text: line.slice(4).replace(/\*\*/g, ""), bold: true })],
        }),
      );
    } else if (line.startsWith("- ")) {
      children.push(
        new Paragraph({
          numbering: { reference: "ccs-bullets", level: 0 },
          children: [new TextRun(line.slice(2).replace(/\*\*/g, ""))],
        }),
      );
    } else {
      const bold = line.startsWith("**") && line.endsWith("**");
      children.push(
        new Paragraph({
          children: [new TextRun({ text: line.replace(/\*\*/g, ""), bold })],
        }),
      );
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ccs-bullets",
          levels: [
            {
              level: 0,
              format: "bullet",
              text: "\u2022",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveBlob(blob, `${slugify(title)}.docx`);
}
