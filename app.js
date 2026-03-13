// DOM references
const productNameInput = document.getElementById("productName");
const hsCodeInput = document.getElementById("hsCode");
const cifValueInput = document.getElementById("cifValue");
const cdRateInput = document.getElementById("cdRate");
const stRateInput = document.getElementById("stRate");
const vatRateInput = document.getElementById("vatRate");
const exchangeRateInput = document.getElementById("exchangeRate");
const exchangeRateField = document.getElementById("exchangeRateField");
const currencyInputs = document.querySelectorAll('input[name="currency"]');
const calculateButton = document.getElementById("calculateButton");
const resetButton = document.getElementById("resetButton");
const copyButton = document.getElementById("copyButton");
const exportPdfButton = document.getElementById("exportPdfButton");
const message = document.getElementById("message");
const summarySection = document.getElementById("summarySection");
const distributionSection = document.getElementById("distributionSection");
const breakdownToggle = document.getElementById("breakdownToggle");
const breakdownToggleLabel = document.getElementById("breakdownToggleLabel");
const breakdownSection = document.getElementById("breakdownSection");
const printReport = document.getElementById("printReport");

const summaryCifOutput = document.getElementById("summaryCif");
const summaryTotalTaxOutput = document.getElementById("summaryTotalTax");
const summaryTaxRateOutput = document.getElementById("summaryTaxRate");
const summaryTaxRateHintOutput = document.getElementById("summaryTaxRateHint");
const summaryMultiplierOutput = document.getElementById("summaryMultiplier");
const summaryLandedCostOutput = document.getElementById("summaryLandedCost");
const summaryCurrencyNoteOutput = document.getElementById("summaryCurrencyNote");
const distributionCdBar = document.getElementById("distributionCdBar");
const distributionStBar = document.getElementById("distributionStBar");
const distributionVatBar = document.getElementById("distributionVatBar");
const distributionCdAmountOutput = document.getElementById("distributionCdAmount");
const distributionStAmountOutput = document.getElementById("distributionStAmount");
const distributionVatAmountOutput = document.getElementById("distributionVatAmount");
const breakdownCifOutput = document.getElementById("breakdownCif");
const breakdownCdBaseOutput = document.getElementById("breakdownCdBase");
const breakdownCdOutput = document.getElementById("breakdownCd");
const breakdownCdResultOutput = document.getElementById("breakdownCdResult");
const breakdownStBaseOutput = document.getElementById("breakdownStBase");
const breakdownStOutput = document.getElementById("breakdownSt");
const breakdownStResultOutput = document.getElementById("breakdownStResult");
const breakdownVatBaseOutput = document.getElementById("breakdownVatBase");
const breakdownVatOutput = document.getElementById("breakdownVat");
const breakdownVatResultOutput = document.getElementById("breakdownVatResult");
const breakdownTotalTaxOutput = document.getElementById("breakdownTotalTax");
const breakdownTotalTaxResultOutput = document.getElementById("breakdownTotalTaxResult");
const breakdownLandedCostOutput = document.getElementById("breakdownLandedCost");
const breakdownLandedCostResultOutput = document.getElementById("breakdownLandedCostResult");

// App state and constants
let lastCalculation = null;
let cifBaseUsdValue = null;
let isBreakdownExpanded = false;

const DEFAULT_EXCHANGE_RATE = 4000;

// Formatting helpers
function getSelectedCurrency() {
  return document.querySelector('input[name="currency"]:checked').value;
}

function formatNumber(value) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatMoney(value, currency) {
  return currency === "KHR"
    ? formatNumber(value) + " ៛"
    : "$" + formatNumber(value);
}

function formatPercent(value) {
  return formatNumber(value) + "%";
}

function formatMultiplier(value) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }) + "×";
}

// Parsing and sanitizing helpers
function parseFormattedNumber(value) {
  return Number(value.replace(/,/g, ""));
}

function sanitizeDecimalValue(value) {
  let cleaned = value.replace(/[^\d.]/g, "");
  const firstDotIndex = cleaned.indexOf(".");

  if (firstDotIndex !== -1) {
    cleaned = cleaned.slice(0, firstDotIndex + 1) + cleaned.slice(firstDotIndex + 1).replace(/\./g, "");
  }

  return cleaned;
}

function sanitizeHsCodeValue(value) {
  return value.replace(/[^\d.]/g, "");
}

function attachSanitizer(inputElement, sanitizeFn) {
  inputElement.addEventListener("input", function () {
    const sanitizedValue = sanitizeFn(inputElement.value);

    if (inputElement.value !== sanitizedValue) {
      inputElement.value = sanitizedValue;
    }
  });

  inputElement.addEventListener("paste", function () {
    requestAnimationFrame(function () {
      inputElement.value = sanitizeFn(inputElement.value);
    });
  });
}

function formatInputWithThousands(inputElement) {
  inputElement.addEventListener("blur", function () {
    const rawValue = inputElement.value.replace(/,/g, "").trim();

    if (rawValue === "" || Number.isNaN(Number(rawValue))) {
      return;
    }

    const numberValue = Number(rawValue);
    inputElement.value = numberValue.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  });
}

function attachEditableNumberFocus(inputElement) {
  inputElement.addEventListener("focus", function () {
    inputElement.value = inputElement.value.replace(/,/g, "");
  });
}

// Currency conversion helpers
function convertCurrency(value, currency, exchangeRate) {
  return currency === "KHR" ? value * exchangeRate : value;
}

function getCurrentExchangeRate() {
  const exchangeRateRaw = exchangeRateInput.value.trim();

  if (exchangeRateRaw === "" || isInvalidPositiveNumber(exchangeRateRaw)) {
    return DEFAULT_EXCHANGE_RATE;
  }

  return parseFormattedNumber(exchangeRateRaw);
}

// Keep CIF internally in USD so currency changes only affect display.
function syncCifBaseUsdFromInput() {
  const cifRawValue = cifValueInput.value.replace(/,/g, "").trim();

  if (cifRawValue === "" || Number.isNaN(Number(cifRawValue))) {
    cifBaseUsdValue = null;
    return;
  }

  const cifDisplayValue = Number(cifRawValue);
  const exchangeRate = getCurrentExchangeRate();

  cifBaseUsdValue = getSelectedCurrency() === "KHR"
    ? cifDisplayValue / exchangeRate
    : cifDisplayValue;
}

function renderCifInputFromBase() {
  if (cifBaseUsdValue === null) {
    cifValueInput.value = "";
    return;
  }

  const cifDisplayValue = convertCurrency(cifBaseUsdValue, getSelectedCurrency(), getCurrentExchangeRate());
  cifValueInput.value = cifDisplayValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function updateExchangeRateState() {
  const isKhr = getSelectedCurrency() === "KHR";

  exchangeRateInput.disabled = !isKhr;
  exchangeRateField.classList.toggle("is-disabled", !isKhr);

  if (isKhr && exchangeRateInput.value.trim() === "") {
    exchangeRateInput.value = DEFAULT_EXCHANGE_RATE.toLocaleString("en-US");
  }
}

// Validation helpers
function isInvalidNumber(value) {
  const normalizedValue = value.replace(/,/g, "");
  return normalizedValue === "" || Number.isNaN(Number(normalizedValue)) || Number(normalizedValue) < 0;
}

function isInvalidPositiveNumber(value) {
  const normalizedValue = value.replace(/,/g, "");
  return normalizedValue === "" || Number.isNaN(Number(normalizedValue)) || Number(normalizedValue) <= 0;
}

function validateInputs() {
  const currency = getSelectedCurrency();
  const cifValueRaw = cifValueInput.value;
  const cdRateRaw = cdRateInput.value;
  const stRateRaw = stRateInput.value;
  const vatRateRaw = vatRateInput.value;
  const exchangeRateRaw = exchangeRateInput.value.trim();

  if (
    isInvalidNumber(cifValueRaw) ||
    isInvalidNumber(cdRateRaw) ||
    isInvalidNumber(stRateRaw) ||
    isInvalidNumber(vatRateRaw)
  ) {
    return {
      isValid: false,
      errorMessage: "Please enter valid non-negative numbers for all tax fields."
    };
  }

  if (currency === "KHR" && isInvalidPositiveNumber(exchangeRateRaw)) {
    return {
      isValid: false,
      errorMessage: "Please enter a valid positive exchange rate for KHR."
    };
  }

  syncCifBaseUsdFromInput();

  return {
    isValid: true,
    values: {
      productName: productNameInput.value.trim(),
      hsCode: hsCodeInput.value.trim(),
      currency: currency,
      cifValue: cifBaseUsdValue,
      cdRate: parseFormattedNumber(cdRateRaw) / 100,
      stRate: parseFormattedNumber(stRateRaw) / 100,
      vatRate: parseFormattedNumber(vatRateRaw) / 100,
      exchangeRate: currency === "KHR" ? parseFormattedNumber(exchangeRateRaw) : 1
    }
  };
}

// Tax calculation engine
function calculateImportTax(input) {
  const cdAmount = input.cifValue * input.cdRate;
  const stBase = input.cifValue + cdAmount;
  const stAmount = stBase * input.stRate;
  const vatBase = input.cifValue + cdAmount + stAmount;
  const vatAmount = vatBase * input.vatRate;
  const totalTax = cdAmount + stAmount + vatAmount;
  const totalTaxPercentage = input.cifValue === 0 ? 0 : (totalTax / input.cifValue) * 100;
  const landedCost = input.cifValue + totalTax;

  return {
    cifValue: input.cifValue,
    cdRate: input.cdRate,
    stRate: input.stRate,
    vatRate: input.vatRate,
    cdAmount: cdAmount,
    stBase: stBase,
    stAmount: stAmount,
    vatBase: vatBase,
    vatAmount: vatAmount,
    totalTax: totalTax,
    totalTaxPercentage: totalTaxPercentage,
    landedCost: landedCost
  };
}

// UI rendering functions
function setMessage(text, isSuccess) {
  message.classList.toggle("success", Boolean(isSuccess));
  message.textContent = text;
}

function clearMessage() {
  setMessage("", false);
}

function renderEmptySummary(currency) {
  summaryCifOutput.textContent = formatMoney(0, currency);
  summaryTotalTaxOutput.textContent = formatMoney(0, currency);
  summaryTaxRateOutput.textContent = "0.00%";
  summaryTaxRateHintOutput.textContent = "0.00% of CIF";
  summaryMultiplierOutput.textContent = "1.000×";
  summaryLandedCostOutput.textContent = formatMoney(0, currency);
  summaryCurrencyNoteOutput.textContent = currency === "KHR"
    ? "Results are shown in KHR using the exchange rate."
    : "Results are shown in USD.";
}

function renderEmptyDistribution(currency) {
  distributionCdBar.style.width = "0%";
  distributionStBar.style.width = "0%";
  distributionVatBar.style.width = "0%";
  distributionCdAmountOutput.textContent = formatMoney(0, currency);
  distributionStAmountOutput.textContent = formatMoney(0, currency);
  distributionVatAmountOutput.textContent = formatMoney(0, currency);
}

function renderEmptyBreakdown(currency) {
  breakdownCifOutput.textContent = formatMoney(0, currency);
  breakdownCdBaseOutput.textContent = "CIF";
  breakdownCdOutput.textContent = "CD = " + formatMoney(0, currency) + " x 0.00%";
  breakdownCdResultOutput.textContent = "= " + formatMoney(0, currency);
  breakdownStBaseOutput.textContent = "ST base = CIF + CD";
  breakdownStOutput.textContent = "ST = " + formatMoney(0, currency) + " x 0.00%";
  breakdownStResultOutput.textContent = "= " + formatMoney(0, currency);
  breakdownVatBaseOutput.textContent = "VAT base = CIF + CD + ST";
  breakdownVatOutput.textContent = "VAT = " + formatMoney(0, currency) + " x 0.00%";
  breakdownVatResultOutput.textContent = "= " + formatMoney(0, currency);
  breakdownTotalTaxOutput.textContent = formatMoney(0, currency) + " + " + formatMoney(0, currency) + " + " + formatMoney(0, currency);
  breakdownTotalTaxResultOutput.textContent = "= " + formatMoney(0, currency) + " (0.00% of CIF)";
  breakdownLandedCostOutput.textContent = formatMoney(0, currency) + " + " + formatMoney(0, currency);
  breakdownLandedCostResultOutput.textContent = "= " + formatMoney(0, currency);
}

function resetResults() {
  const currency = getSelectedCurrency();

  renderEmptySummary(currency);
  renderEmptyDistribution(currency);
  renderEmptyBreakdown(currency);
  window.PrintReport.renderEmptyPrintReport();
}

function setCalculationVisibility(hasCalculation) {
  summarySection.classList.toggle("hidden", !hasCalculation);
  distributionSection.classList.toggle("hidden", !hasCalculation);
  breakdownToggle.classList.toggle("hidden", !hasCalculation);
  breakdownSection.classList.toggle("hidden", !hasCalculation || !isBreakdownExpanded);
  printReport.classList.toggle("print-ready", hasCalculation);
  copyButton.classList.toggle("hidden", !hasCalculation);
  exportPdfButton.classList.toggle("hidden", !hasCalculation);
  copyButton.disabled = !hasCalculation;
  exportPdfButton.disabled = !hasCalculation;
}

function updateBreakdownToggle() {
  breakdownToggle.setAttribute("aria-expanded", String(isBreakdownExpanded));
  breakdownToggleLabel.textContent = isBreakdownExpanded ? "Hide details ▴" : "Show details ▾";

  if (lastCalculation) {
    breakdownSection.classList.toggle("hidden", !isBreakdownExpanded);
  }
}

// Shared display-data builder
function getDisplayValues(calculation, currency, exchangeRate) {
  return {
    cifDisplay: convertCurrency(calculation.cifValue, currency, exchangeRate),
    cdDisplay: convertCurrency(calculation.cdAmount, currency, exchangeRate),
    stBaseDisplay: convertCurrency(calculation.stBase, currency, exchangeRate),
    stDisplay: convertCurrency(calculation.stAmount, currency, exchangeRate),
    vatBaseDisplay: convertCurrency(calculation.vatBase, currency, exchangeRate),
    vatDisplay: convertCurrency(calculation.vatAmount, currency, exchangeRate),
    totalTaxDisplay: convertCurrency(calculation.totalTax, currency, exchangeRate),
    landedCostDisplay: convertCurrency(calculation.landedCost, currency, exchangeRate)
  };
}

// Shared helpers for print-report.js and pdf-export.js
window.AppHelpers = {
  formatNumber: formatNumber,
  formatMoney: formatMoney,
  formatPercent: formatPercent,
  formatMultiplier: formatMultiplier,
  convertCurrency: convertCurrency,
  getDisplayValues: getDisplayValues
};

function renderSummary(calculation, currency, exchangeRate) {
  const displayValues = getDisplayValues(calculation, currency, exchangeRate);
  const importMultiplier = calculation.cifValue === 0 ? 0 : calculation.landedCost / calculation.cifValue;

  summaryCifOutput.textContent = formatMoney(displayValues.cifDisplay, currency);
  summaryTotalTaxOutput.textContent = formatMoney(displayValues.totalTaxDisplay, currency);
  summaryTaxRateOutput.textContent = formatPercent(calculation.totalTaxPercentage);
  summaryTaxRateHintOutput.textContent = formatPercent(calculation.totalTaxPercentage) + " of CIF";
  summaryMultiplierOutput.textContent = formatMultiplier(importMultiplier);
  summaryLandedCostOutput.textContent = formatMoney(displayValues.landedCostDisplay, currency);
  summaryCurrencyNoteOutput.textContent = currency === "KHR"
    ? "Results are shown in KHR using an exchange rate of " + formatNumber(exchangeRate) + " KHR per USD."
    : "Results are shown in USD.";
}

function renderDistribution(calculation, currency, exchangeRate) {
  const displayValues = getDisplayValues(calculation, currency, exchangeRate);
  const cdShare = calculation.totalTax === 0 ? 0 : (calculation.cdAmount / calculation.totalTax) * 100;
  const stShare = calculation.totalTax === 0 ? 0 : (calculation.stAmount / calculation.totalTax) * 100;
  const vatShare = calculation.totalTax === 0 ? 0 : (calculation.vatAmount / calculation.totalTax) * 100;

  distributionCdBar.style.width = cdShare + "%";
  distributionStBar.style.width = stShare + "%";
  distributionVatBar.style.width = vatShare + "%";
  distributionCdAmountOutput.textContent = formatMoney(displayValues.cdDisplay, currency);
  distributionStAmountOutput.textContent = formatMoney(displayValues.stDisplay, currency);
  distributionVatAmountOutput.textContent = formatMoney(displayValues.vatDisplay, currency);
}

function renderBreakdown(calculation, currency, exchangeRate) {
  const displayValues = getDisplayValues(calculation, currency, exchangeRate);

  breakdownCifOutput.textContent = formatMoney(displayValues.cifDisplay, currency);
  breakdownCdBaseOutput.textContent = "CIF = " + formatMoney(displayValues.cifDisplay, currency);
  breakdownCdOutput.textContent = formatMoney(displayValues.cifDisplay, currency) + " x " + formatPercent(calculation.cdRate * 100);
  breakdownCdResultOutput.textContent = "= " + formatMoney(displayValues.cdDisplay, currency);
  breakdownStBaseOutput.textContent = "ST base = CIF + CD = " + formatMoney(displayValues.cifDisplay, currency) + " + " + formatMoney(displayValues.cdDisplay, currency) + " = " + formatMoney(displayValues.stBaseDisplay, currency);
  breakdownStOutput.textContent = formatMoney(displayValues.stBaseDisplay, currency) + " x " + formatPercent(calculation.stRate * 100);
  breakdownStResultOutput.textContent = "= " + formatMoney(displayValues.stDisplay, currency);
  breakdownVatBaseOutput.textContent = "VAT base = CIF + CD + ST = " + formatMoney(displayValues.cifDisplay, currency) + " + " + formatMoney(displayValues.cdDisplay, currency) + " + " + formatMoney(displayValues.stDisplay, currency) + " = " + formatMoney(displayValues.vatBaseDisplay, currency);
  breakdownVatOutput.textContent = formatMoney(displayValues.vatBaseDisplay, currency) + " x " + formatPercent(calculation.vatRate * 100);
  breakdownVatResultOutput.textContent = "= " + formatMoney(displayValues.vatDisplay, currency);
  breakdownTotalTaxOutput.textContent = formatMoney(displayValues.cdDisplay, currency) + " + " + formatMoney(displayValues.stDisplay, currency) + " + " + formatMoney(displayValues.vatDisplay, currency);
  breakdownTotalTaxResultOutput.textContent = "= " + formatMoney(displayValues.totalTaxDisplay, currency) + " (" + formatPercent(calculation.totalTaxPercentage) + " of CIF)";
  breakdownLandedCostOutput.textContent = formatMoney(displayValues.cifDisplay, currency) + " + " + formatMoney(displayValues.totalTaxDisplay, currency);
  breakdownLandedCostResultOutput.textContent = "= " + formatMoney(displayValues.landedCostDisplay, currency);
}

function renderCalculation(calculation, exchangeRate) {
  const currency = getSelectedCurrency();

  renderSummary(calculation, currency, exchangeRate);
  renderDistribution(calculation, currency, exchangeRate);
  renderBreakdown(calculation, currency, exchangeRate);
  window.PrintReport.renderPrintReport(calculation, currency, exchangeRate);
}

function resetForm() {
  productNameInput.value = "";
  hsCodeInput.value = "";
  cifValueInput.value = "";
  cdRateInput.value = "";
  stRateInput.value = "";
  vatRateInput.value = "";
  exchangeRateInput.value = "";
  document.getElementById("currencyUsd").checked = true;

  cifBaseUsdValue = null;
  lastCalculation = null;
  isBreakdownExpanded = false;

  updateExchangeRateState();
  resetResults();
  setCalculationVisibility(false);
  updateBreakdownToggle();
  clearMessage();
}

// Copy/export helpers
function buildCopySummary(calculation, currency, exchangeRate) {
  const cifDisplay = convertCurrency(calculation.cifValue, currency, exchangeRate);
  const cdDisplay = convertCurrency(calculation.cdAmount, currency, exchangeRate);
  const stDisplay = convertCurrency(calculation.stAmount, currency, exchangeRate);
  const vatDisplay = convertCurrency(calculation.vatAmount, currency, exchangeRate);
  const totalTaxDisplay = convertCurrency(calculation.totalTax, currency, exchangeRate);
  const landedCostDisplay = convertCurrency(calculation.landedCost, currency, exchangeRate);
  const importMultiplier = calculation.cifValue === 0 ? 0 : calculation.landedCost / calculation.cifValue;

  const summaryLines = [
    "Cambodia Import Tax Estimate",
    "",
    "Product: " + (calculation.productName || "N/A"),
    "HS Code: " + (calculation.hsCode || "N/A"),
    "",
    "CIF Value: " + formatMoney(cifDisplay, currency),
    "Customs Duty: " + formatMoney(cdDisplay, currency),
    "Special Tax: " + formatMoney(stDisplay, currency),
    "VAT Amount: " + formatMoney(vatDisplay, currency),
    "",
    "Total Import Tax: " + formatMoney(totalTaxDisplay, currency),
    "Effective Tax Rate: " + formatPercent(calculation.totalTaxPercentage),
    "Import Multiplier: " + formatMultiplier(importMultiplier),
    "",
    "Final Landed Cost: " + formatMoney(landedCostDisplay, currency)
  ];

  const footerLines = [
    "Currency: " + currency,
    currency === "KHR" ? "Exchange Rate: " + formatNumber(exchangeRate) + " KHR per USD" : null
  ].filter(Boolean);

  return summaryLines.concat([""], footerLines).join("\n");
}

// Event handlers
function handleCalculateClick() {
  clearMessage();

  const validation = validateInputs();

  if (!validation.isValid) {
    resetResults();
    setCalculationVisibility(false);
    lastCalculation = null;
    setMessage(validation.errorMessage, false);
    return;
  }

  const calculation = calculateImportTax(validation.values);

  lastCalculation = {
    productName: validation.values.productName,
    hsCode: validation.values.hsCode,
    ...calculation
  };

  renderCalculation(lastCalculation, validation.values.exchangeRate);
  setCalculationVisibility(true);

  if (window.innerWidth <= 640) {
    summarySection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function handleResetClick() {
  resetForm();
}

function handleBreakdownToggleClick() {
  isBreakdownExpanded = !isBreakdownExpanded;
  updateBreakdownToggle();
}

async function handleCopyClick() {
  if (!lastCalculation) {
    setMessage("Please calculate the tax before copying the estimate.", false);
    return;
  }

  const currency = getSelectedCurrency();
  const exchangeRateRaw = exchangeRateInput.value.trim();

  if (currency === "KHR" && isInvalidPositiveNumber(exchangeRateRaw)) {
    setMessage("Please enter a valid positive exchange rate for KHR.", false);
    return;
  }

  const exchangeRate = currency === "KHR" ? parseFormattedNumber(exchangeRateRaw) : 1;
  const summaryText = buildCopySummary(lastCalculation, currency, exchangeRate);

  try {
    await navigator.clipboard.writeText(summaryText);
    setMessage("Estimate copied to clipboard.", true);
  } catch (error) {
    setMessage("Copy failed. Your browser may not allow clipboard access here.", false);
  }
}

async function handleExportPdfClick() {
  if (!lastCalculation) {
    setMessage("Please calculate the tax before previewing the PDF.", false);
    return;
  }

  const currency = getSelectedCurrency();
  const exchangeRateRaw = exchangeRateInput.value.trim();

  if (currency === "KHR" && isInvalidPositiveNumber(exchangeRateRaw)) {
    setMessage("Please enter a valid positive exchange rate for KHR.", false);
    return;
  }

  const exchangeRate = currency === "KHR" ? parseFormattedNumber(exchangeRateRaw) : 1;

  try {
    await window.PdfExport.exportCalculationPdf(lastCalculation, currency, exchangeRate, "preview");
    clearMessage();
  } catch (error) {
    setMessage("PDF preview failed. Please try again in a browser tab that allows pop-ups.", false);
  }
}

function handleCurrencyChange() {
  clearMessage();
  updateExchangeRateState();
  renderCifInputFromBase();

  if (lastCalculation) {
    const exchangeRate = getSelectedCurrency() === "KHR"
      ? parseFormattedNumber(exchangeRateInput.value)
      : 1;
    renderCalculation(lastCalculation, exchangeRate);
  }
}

function handleExchangeRateBlur() {
  renderCifInputFromBase();

  if (
    lastCalculation &&
    getSelectedCurrency() === "KHR" &&
    !isInvalidPositiveNumber(exchangeRateInput.value)
  ) {
    renderCalculation(lastCalculation, parseFormattedNumber(exchangeRateInput.value));
  }
}

// Initialization
attachSanitizer(hsCodeInput, sanitizeHsCodeValue);
attachSanitizer(cifValueInput, sanitizeDecimalValue);
attachSanitizer(cdRateInput, sanitizeDecimalValue);
attachSanitizer(stRateInput, sanitizeDecimalValue);
attachSanitizer(vatRateInput, sanitizeDecimalValue);
attachSanitizer(exchangeRateInput, sanitizeDecimalValue);

formatInputWithThousands(cifValueInput);
formatInputWithThousands(exchangeRateInput);
attachEditableNumberFocus(cifValueInput);
attachEditableNumberFocus(exchangeRateInput);

cifValueInput.addEventListener("input", function () {
  syncCifBaseUsdFromInput();
});

calculateButton.addEventListener("click", handleCalculateClick);
resetButton.addEventListener("click", handleResetClick);
breakdownToggle.addEventListener("click", handleBreakdownToggleClick);
copyButton.addEventListener("click", handleCopyClick);
exportPdfButton.addEventListener("click", handleExportPdfClick);
exchangeRateInput.addEventListener("blur", handleExchangeRateBlur);

currencyInputs.forEach(function (inputElement) {
  inputElement.addEventListener("change", handleCurrencyChange);
});

updateExchangeRateState();
resetResults();
setCalculationVisibility(false);
updateBreakdownToggle();
