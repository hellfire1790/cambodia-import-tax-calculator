// Print report rendering helpers
(function () {
  const printGeneratedDateOutput = document.getElementById("printGeneratedDate");
  const printProductNameOutput = document.getElementById("printProductName");
  const printHsCodeOutput = document.getElementById("printHsCode");
  const printInputCifOutput = document.getElementById("printInputCif");
  const printCdRateOutput = document.getElementById("printCdRate");
  const printStRateOutput = document.getElementById("printStRate");
  const printVatRateOutput = document.getElementById("printVatRate");
  const printCurrencyOutput = document.getElementById("printCurrency");
  const printExchangeRateRow = document.getElementById("printExchangeRateRow");
  const printExchangeRateOutput = document.getElementById("printExchangeRate");
  const printFinalLandedCostOutput = document.getElementById("printFinalLandedCost");
  const printTotalImportTaxOutput = document.getElementById("printTotalImportTax");
  const printSummaryCifOutput = document.getElementById("printSummaryCif");
  const printEffectiveTaxRateOutput = document.getElementById("printEffectiveTaxRate");
  const printImportMultiplierOutput = document.getElementById("printImportMultiplier");
  const printBreakdownCdOutput = document.getElementById("printBreakdownCd");
  const printBreakdownStOutput = document.getElementById("printBreakdownSt");
  const printBreakdownVatOutput = document.getElementById("printBreakdownVat");
  const printCurrencyNoteOutput = document.getElementById("printCurrencyNote");
  const printExchangeRateNoteOutput = document.getElementById("printExchangeRateNote");

  function renderEmptyPrintReport() {
    printGeneratedDateOutput.textContent = "Date generated: -";
    printProductNameOutput.textContent = "N/A";
    printHsCodeOutput.textContent = "N/A";
    printInputCifOutput.textContent = "-";
    printCdRateOutput.textContent = "-";
    printStRateOutput.textContent = "-";
    printVatRateOutput.textContent = "-";
    printCurrencyOutput.textContent = "-";
    printExchangeRateOutput.textContent = "-";
    printExchangeRateRow.classList.add("hidden");
    printFinalLandedCostOutput.textContent = "-";
    printTotalImportTaxOutput.textContent = "-";
    printSummaryCifOutput.textContent = "-";
    printEffectiveTaxRateOutput.textContent = "-";
    printImportMultiplierOutput.textContent = "-";
    printBreakdownCdOutput.textContent = "-";
    printBreakdownStOutput.textContent = "-";
    printBreakdownVatOutput.textContent = "-";
    printCurrencyNoteOutput.textContent = "-";
    printExchangeRateNoteOutput.textContent = "-";
    printExchangeRateNoteOutput.classList.add("hidden");
  }

  function renderPrintReport(calculation, currency, exchangeRate) {
    const helpers = window.AppHelpers;
    const displayValues = helpers.getDisplayValues(calculation, currency, exchangeRate);
    const importMultiplier = calculation.cifValue === 0 ? 0 : calculation.landedCost / calculation.cifValue;

    printGeneratedDateOutput.textContent = "Date generated: " + new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
    printProductNameOutput.textContent = calculation.productName || "N/A";
    printHsCodeOutput.textContent = calculation.hsCode || "N/A";
    printInputCifOutput.textContent = helpers.formatMoney(displayValues.cifDisplay, currency);
    printCdRateOutput.textContent = helpers.formatPercent(calculation.cdRate * 100);
    printStRateOutput.textContent = helpers.formatPercent(calculation.stRate * 100);
    printVatRateOutput.textContent = helpers.formatPercent(calculation.vatRate * 100);
    printCurrencyOutput.textContent = currency;
    printExchangeRateOutput.textContent = helpers.formatNumber(exchangeRate) + " KHR per USD";
    printExchangeRateRow.classList.toggle("hidden", currency !== "KHR");

    printFinalLandedCostOutput.textContent = helpers.formatMoney(displayValues.landedCostDisplay, currency);
    printTotalImportTaxOutput.textContent = helpers.formatMoney(displayValues.totalTaxDisplay, currency);
    printSummaryCifOutput.textContent = helpers.formatMoney(displayValues.cifDisplay, currency);
    printEffectiveTaxRateOutput.textContent = helpers.formatPercent(calculation.totalTaxPercentage);
    printImportMultiplierOutput.textContent = helpers.formatMultiplier(importMultiplier);
    printBreakdownCdOutput.textContent = helpers.formatMoney(displayValues.cdDisplay, currency);
    printBreakdownStOutput.textContent = helpers.formatMoney(displayValues.stDisplay, currency);
    printBreakdownVatOutput.textContent = helpers.formatMoney(displayValues.vatDisplay, currency);
    printCurrencyNoteOutput.textContent = currency === "KHR" ? "Results are shown in KHR." : "Results are shown in USD.";
    printExchangeRateNoteOutput.textContent = "Exchange rate used: " + helpers.formatNumber(exchangeRate) + " KHR per USD.";
    printExchangeRateNoteOutput.classList.toggle("hidden", currency !== "KHR");
  }

  window.PrintReport = {
    renderEmptyPrintReport: renderEmptyPrintReport,
    renderPrintReport: renderPrintReport
  };
})();
