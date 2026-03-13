// PDF export and preview helpers
(function () {
  function buildPdfData(calculation, currency, exchangeRate) {
    const helpers = window.AppHelpers;
    const displayValues = helpers.getDisplayValues(calculation, currency, exchangeRate);
    const generatedAt = new Date();
    const datePart = [
      generatedAt.getFullYear(),
      String(generatedAt.getMonth() + 1).padStart(2, "0"),
      String(generatedAt.getDate()).padStart(2, "0")
    ].join("");
    const timePart = [
      String(generatedAt.getHours()).padStart(2, "0"),
      String(generatedAt.getMinutes()).padStart(2, "0")
    ].join("");

    return {
      generatedDate: generatedAt.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      }),
      estimateId: "CTX-" + datePart + "-" + timePart,
      inputDetails: {
        productName: calculation.productName || "Not provided",
        hsCode: calculation.hsCode || "Not provided",
        cifValueEntered: helpers.formatMoney(displayValues.cifDisplay, currency),
        currencySelected: currency,
        cdRate: helpers.formatPercent(calculation.cdRate * 100),
        stRate: helpers.formatPercent(calculation.stRate * 100),
        vatRate: helpers.formatPercent(calculation.vatRate * 100),
        exchangeRate: currency === "KHR" ? helpers.formatNumber(exchangeRate) + " KHR per USD" : ""
      },
      summaryCards: {
        finalLandedCost: helpers.formatMoney(displayValues.landedCostDisplay, currency),
        totalImportTax: helpers.formatMoney(displayValues.totalTaxDisplay, currency),
        totalImportTaxRate: helpers.formatPercent(calculation.totalTaxPercentage)
      },
      taxRows: [
        ["Customs Duty", helpers.formatMoney(displayValues.cdDisplay, currency)],
        ["Special Tax", helpers.formatMoney(displayValues.stDisplay, currency)],
        ["VAT", helpers.formatMoney(displayValues.vatDisplay, currency)],
        ["Total Import Tax", helpers.formatMoney(displayValues.totalTaxDisplay, currency), true]
      ],
      notes: [
        currency === "KHR" ? "Results are shown in KHR." : "Results are shown in USD.",
        currency === "KHR" ? "Exchange rate used: " + helpers.formatNumber(exchangeRate) + " KHR per USD." : null,
        "Estimate basis: CIF value and user-entered tax rates."
      ].filter(Boolean),
      disclaimer: "Estimate only. Final duties and taxes may vary depending on customs assessment, HS classification, and applicable regulations."
    };
  }

  function buildPdfFileName(calculation) {
    const productSlug = (calculation.productName || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return productSlug
      ? productSlug + "-import-tax-estimate.pdf"
      : "cambodia-import-tax-estimate.pdf";
  }

  function exportCalculationPdf(calculation, currency, exchangeRate) {
    const jsPdfLibrary = window.jspdf;

    if (!jsPdfLibrary || !jsPdfLibrary.jsPDF) {
      throw new Error("PDF library not loaded");
    }

    const pdfData = buildPdfData(calculation, currency, exchangeRate);
    const doc = new jsPdfLibrary.jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 36;
    const contentWidth = pageWidth - margin * 2;
    const darkText = [33, 37, 41];
    const mutedText = [107, 114, 128];
    const borderColor = [214, 220, 228];
    const lightFill = [248, 250, 252];
    const accentFill = [239, 246, 255];
    const cardFill = [255, 255, 255];
    const headerRule = [191, 219, 254];
    const accentText = [29, 78, 216];
    const footerReserve = 20;
    let y = margin;

    function ensureSpace(requiredHeight) {
      if (y + requiredHeight > pageHeight - margin - footerReserve) {
        doc.addPage();
        y = margin;
      }
    }

    function drawTextBlock(text, x, textY, maxWidth, fontSize, fontStyle, color, lineGap) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.setFont("helvetica", fontStyle);
      doc.setFontSize(fontSize);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(lines, x, textY);
      return lines.length * (lineGap || (fontSize + 2));
    }

    function drawSectionTitle(title) {
      ensureSpace(28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text(title, margin, y);
      y += 20;
    }

    function drawPdfHeader() {
      ensureSpace(86);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(21);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text("Cambodia Import Tax Estimate", margin, y);
      y += 20;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
      doc.text("Generated by Atlas Tools", margin, y);
      y += 16;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text("Date generated", margin, y);
      doc.text("Reference No.", margin + 220, y);
      y += 9;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(pdfData.generatedDate, margin, y);
      doc.text(pdfData.estimateId, margin + 220, y);
      y += 10;

      doc.setDrawColor(headerRule[0], headerRule[1], headerRule[2]);
      doc.line(margin, y, pageWidth - margin, y);
      y += 16;
    }

    function drawSummaryCard(x, cardY, width, height, label, value, options) {
      const labelColor = options.labelColor || mutedText;
      const valueColor = options.valueColor || darkText;

      doc.setFillColor(options.fillColor[0], options.fillColor[1], options.fillColor[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.roundedRect(x, cardY, width, height, 10, 10, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(options.labelSize || 9);
      doc.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
      doc.text(label, x + 14, cardY + 18);

      doc.setFont("helvetica", options.valueStyle || "bold");
      doc.setFontSize(options.valueSize || 14);
      doc.setTextColor(valueColor[0], valueColor[1], valueColor[2]);
      doc.text(value, x + 14, cardY + (options.valueY || 40));
    }

    function drawPdfInputDetails() {
      const detailRows = [
        [
          { label: "Product Name", value: pdfData.inputDetails.productName },
          { label: "HS Code", value: pdfData.inputDetails.hsCode }
        ],
        [
          { label: "CIF Value Entered", value: pdfData.inputDetails.cifValueEntered },
          { label: "Currency Selected", value: pdfData.inputDetails.currencySelected }
        ],
        [
          { label: "Customs Duty (CD) Rate", value: pdfData.inputDetails.cdRate },
          { label: "Special Tax (ST) Rate", value: pdfData.inputDetails.stRate },
          { label: "Value Added Tax (VAT) Rate", value: pdfData.inputDetails.vatRate }
        ]
      ];

      if (pdfData.inputDetails.exchangeRate) {
        detailRows.push([{ label: "Exchange Rate", value: pdfData.inputDetails.exchangeRate }]);
      }

      const rowHeight = 28;
      const sectionHeight = 14 + detailRows.length * rowHeight + 10;

      ensureSpace(sectionHeight + 10);
      drawSectionTitle("Input Details");
      const sectionTop = y;
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
      doc.roundedRect(margin, sectionTop, contentWidth, sectionHeight, 10, 10, "FD");
      y = sectionTop + 10;

      detailRows.forEach(function (row) {
        drawFactRow(row, y, row.length);
        y += rowHeight;
      });

      y = sectionTop + sectionHeight + 18;
    }

    function drawFactCell(x, cellTop, label, value) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.8);
      doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
      doc.text(label, x, cellTop + 9);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text(String(value), x, cellTop + 19);
    }

    function drawFactRow(items, topY, columns) {
      const gap = 12;
      const width = contentWidth - 32;
      const cellWidth = (width - gap * (columns - 1)) / columns;

      items.forEach(function (item, index) {
        drawFactCell(
          margin + 16 + index * (cellWidth + gap),
          topY,
          item.label,
          item.value
        );
      });

      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(margin + 12, topY + 25, pageWidth - margin - 12, topY + 25);
    }

    function drawPdfSummary() {
      const gap = 12;
      const cardHeight = 72;
      const cardWidth = (contentWidth - gap * 2) / 3;

      ensureSpace(cardHeight + 30);
      drawSectionTitle("Estimate Summary");

      drawSummaryCard(margin, y, cardWidth, cardHeight, "Final Landed Cost", pdfData.summaryCards.finalLandedCost, {
        fillColor: accentFill,
        labelColor: accentText,
        valueColor: darkText,
        valueSize: 17,
        valueY: 43
      });

      drawSummaryCard(margin + cardWidth + gap, y, cardWidth, cardHeight, "Total Import Tax", pdfData.summaryCards.totalImportTax, {
        fillColor: lightFill,
        labelColor: mutedText,
        valueColor: darkText,
        valueSize: 13,
        valueY: 38
      });

      drawSummaryCard(margin + (cardWidth + gap) * 2, y, cardWidth, cardHeight, "Total Import Tax Rate", pdfData.summaryCards.totalImportTaxRate, {
        fillColor: cardFill,
        labelColor: mutedText,
        valueColor: darkText,
        valueSize: 12,
        valueY: 38
      });

      y += cardHeight + 18;
    }

    function drawPdfTaxTable() {
      const rowHeight = 22;
      const headerHeight = 24;
      const tableHeight = headerHeight + rowHeight * pdfData.taxRows.length;

      ensureSpace(tableHeight + 26);
      drawSectionTitle("Import Tax Breakdown");
      const tableTop = y;

      doc.setFillColor(lightFill[0], lightFill[1], lightFill[2]);
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.roundedRect(margin, tableTop, contentWidth, tableHeight, 8, 8, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(darkText[0], darkText[1], darkText[2]);
      doc.text("Tax Type", margin + 12, tableTop + 16);
      doc.text("Amount", pageWidth - margin - 12, tableTop + 16, { align: "right" });

      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.line(margin, tableTop + headerHeight, pageWidth - margin, tableTop + headerHeight);
      y = tableTop + headerHeight;

      pdfData.taxRows.forEach(function (row, index) {
        const rowTop = y + index * rowHeight;

        if (index > 0) {
          doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
          doc.line(margin, rowTop, pageWidth - margin, rowTop);
        }

        doc.setFont("helvetica", row[2] ? "bold" : "normal");
        doc.setFontSize(9.5);
        doc.text(row[0], margin + 12, rowTop + 15);
        doc.text(row[1], pageWidth - margin - 12, rowTop + 15, { align: "right" });
      });

      y = tableTop + tableHeight + 18;
    }

    function drawPdfNotes() {
      let notesHeight = 12;

      pdfData.notes.forEach(function (note) {
        notesHeight += doc.splitTextToSize(note, contentWidth - 24).length * 10 + 2;
      });

      notesHeight += doc.splitTextToSize(pdfData.disclaimer, contentWidth - 24).length * 9 + 10;

      ensureSpace(notesHeight);
      drawSectionTitle("Notes");
      const notesTop = y;
      doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
      doc.setFillColor(cardFill[0], cardFill[1], cardFill[2]);
      doc.roundedRect(margin, notesTop, contentWidth, notesHeight, 10, 10, "FD");
      y = notesTop + 12;

      pdfData.notes.forEach(function (note) {
        const noteHeight = drawTextBlock(note, margin + 12, y, contentWidth - 24, 8.5, "normal", mutedText, 10);
        y += noteHeight + 2;
      });

      y += 1;
      drawTextBlock(pdfData.disclaimer, margin + 12, y, contentWidth - 24, 7.8, "normal", mutedText, 9);
      y = notesTop + notesHeight + 10;
    }

    function drawPdfFooter(totalPages) {
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber);
        doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.line(margin, pageHeight - margin - 16, pageWidth - margin, pageHeight - margin - 16);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(mutedText[0], mutedText[1], mutedText[2]);
        doc.text("Atlas Tools", margin, pageHeight - margin);
        doc.text("Generated on " + pdfData.generatedDate, pageWidth / 2, pageHeight - margin, { align: "center" });
        doc.text("Page " + pageNumber + " of " + totalPages, pageWidth - margin, pageHeight - margin, { align: "right" });
      }
    }

    drawPdfHeader();
    drawPdfInputDetails();
    drawPdfSummary();
    drawPdfTaxTable();
    drawPdfNotes();
    drawPdfFooter(doc.getNumberOfPages());

    const previewWindow = window.open("", "_blank");

    if (!previewWindow) {
      throw new Error("Preview window blocked");
    }

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    previewWindow.location.href = pdfUrl;

    window.setTimeout(function () {
      URL.revokeObjectURL(pdfUrl);
    }, 60000);

    return buildPdfFileName(calculation);
  }

  window.PdfExport = {
    buildPdfData: buildPdfData,
    buildPdfFileName: buildPdfFileName,
    exportCalculationPdf: exportCalculationPdf
  };
})();
