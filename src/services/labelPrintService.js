/**
 * 라벨 프린트 서비스
 * - EJS 템플릿을 HTML로 렌더링
 * - HTML을 PDF로 변환
 * - PDF를 프린터로 출력 또는 파일로 저장 (환경별 처리)
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs").promises;
const { exec } = require("child_process");
const { promisify } = require("util");
const ejs = require("ejs");
const appConfig = require("../../config/appConfig");

const execAsync = promisify(exec);

// 프린터 패키지는 조건부 로드
let printer = null;
try {
  if (appConfig.printer.enabled && appConfig.printer.type !== "cloud") {
    printer = require("printer");
  }
} catch (error) {
  console.warn("프린터 패키지 로드 실패:", error.message);
}

// Puppeteer 브라우저 인스턴스 (싱글톤)
let browserInstance = null;
let browserInitPromise = null;

/**
 * Puppeteer 브라우저 인스턴스 초기화
 */
async function getBrowser() {
  if (browserInstance) {
    return browserInstance;
  }

  if (browserInitPromise) {
    return browserInitPromise;
  }

  browserInitPromise = (async () => {
    try {
      const launchOptions = {
        headless: appConfig.puppeteer.headless,
        args: appConfig.puppeteer.args,
      };

      if (appConfig.puppeteer.executablePath) {
        launchOptions.executablePath = appConfig.puppeteer.executablePath;
      }

      browserInstance = await puppeteer.launch(launchOptions);
      console.log("✓ Puppeteer 브라우저 인스턴스 초기화 완료");

      browserInstance.on("disconnected", () => {
        browserInstance = null;
        browserInitPromise = null;
      });

      return browserInstance;
    } catch (error) {
      browserInitPromise = null;
      console.error("Puppeteer 브라우저 초기화 실패:", error);
      throw new Error(`브라우저 초기화 실패: ${error.message}`);
    }
  })();

  return browserInitPromise;
}

/**
 * 브라우저 인스턴스 종료
 */
async function closeBrowser() {
  if (browserInstance) {
    try {
      await browserInstance.close();
      browserInstance = null;
      browserInitPromise = null;
      console.log("✓ Puppeteer 브라우저 인스턴스 종료 완료");
    } catch (error) {
      console.error("브라우저 종료 실패:", error);
    }
  }
}

/**
 * 임시 디렉토리 생성
 */
async function ensureTempDir() {
  const tempDir = path.resolve(process.cwd(), appConfig.printer.tempPath);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * PDF 저장 디렉토리 생성
 */
async function ensurePdfSaveDir() {
  const pdfDir = path.resolve(process.cwd(), appConfig.printer.pdfSavePath);
  await fs.mkdir(pdfDir, { recursive: true });
  return pdfDir;
}

/**
 * EJS 템플릿을 HTML로 렌더링
 * @param {string} templateName - 템플릿 이름 (large, medium, small, verysmall)
 * @param {object} data - 템플릿 데이터
 * @returns {Promise<string>} 렌더링된 HTML
 */
async function renderTemplate(templateName, data) {
  try {
    const templatePath = path.join(
      __dirname,
      "../views",
      `label-${templateName}.ejs`
    );

    // 템플릿 파일 존재 확인
    try {
      await fs.access(templatePath);
    } catch (accessError) {
      if (accessError.code === 'ENOENT') {
        throw new Error(`템플릿 파일을 찾을 수 없습니다: label-${templateName}.ejs`);
      }
      throw accessError;
    }

    // 템플릿 데이터에 기본값 설정 (안전하게)
    const templateData = {
      productName: data.productName || '',
      manufactureDate: data.manufactureDate || '',
      expiryDate: data.expiryDate || '',
      barcodeNumber: data.barcodeNumber || '',
      barcodeBase64: data.barcodeBase64 || '',
      storageCondition: data.storageCondition || '냉동',
      registrationNumber: data.registrationNumber || '',
      categoryAndForm: data.categoryAndForm || '',
      ingredients: data.ingredients || '',
      rawMaterials: data.rawMaterials || '',
      actualWeight: data.actualWeight || '',
      isLoadingBarcode: data.isLoadingBarcode || false,
    };

    // EJS 렌더링
    const html = await ejs.renderFile(templatePath, templateData, {
      cache: false,
      strict: false, // 정의되지 않은 변수는 빈 문자열로 처리
    });

    return html;
  } catch (error) {
    console.error(`템플릿 렌더링 오류 (${templateName}):`, error);
    if (error.code === 'ENOENT') {
      throw new Error(`템플릿 파일을 찾을 수 없습니다: label-${templateName}.ejs`);
    }
    throw new Error(`템플릿 렌더링 실패: ${error.message}`);
  }
}

/**
 * HTML을 PDF로 변환
 * @param {string} html - HTML 문자열
 * @param {object} options - PDF 옵션
 * @returns {Promise<Buffer>} PDF 버퍼
 */
async function convertHtmlToPdf(html, options = {}) {
  const {
    width = "100mm",
    height = "100mm",
    margin = "0mm",
    printCount = 1,
  } = options;

  const browser = await getBrowser();

  try {
    const page = await browser.newPage();

    // 여러 라벨을 한 페이지에 표시하기 위한 HTML 생성
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: ${width} ${height};
              margin: ${margin};
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Nanum Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .label-page {
              page-break-after: always;
              width: ${width};
              height: ${height};
              box-sizing: border-box;
            }
            .label-page:last-child {
              page-break-after: auto;
            }
          </style>
        </head>
        <body>
          ${Array(printCount)
            .fill(0)
            .map(() => `<div class="label-page">${html}</div>`)
            .join("")}
        </body>
      </html>
    `;

    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      width: width,
      height: height,
      printBackground: true,
      margin: {
        top: margin,
        right: margin,
        bottom: margin,
        left: margin,
      },
    });

    await page.close();

    return pdfBuffer;
  } catch (error) {
    console.error("HTML to PDF 변환 실패:", error);
    throw new Error(`PDF 변환 실패: ${error.message}`);
  }
}

/**
 * Windows에서 PDF를 프린터로 출력
 */
async function printPdfOnWindows(pdfBuffer, printerName) {
  const tempDir = await ensureTempDir();
  const tempFilePath = path.join(
    tempDir,
    `label-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`
  );

  try {
    await fs.writeFile(tempFilePath, pdfBuffer);

    const escapedPath = tempFilePath.replace(/'/g, "''");
    const escapedPrinter = printerName.replace(/'/g, "''");
    const command = `powershell -ExecutionPolicy Bypass -Command "Start-Process -FilePath '${escapedPath}' -Verb PrintTo -ArgumentList '${escapedPrinter}' -WindowStyle Hidden"`;

    await execAsync(command, {
      timeout: 10000,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(`Windows 프린트 실패:`, error);
    throw new Error(`프린트 실패: ${error.message}`);
  } finally {
    setTimeout(() => {
      fs.unlink(tempFilePath).catch(() => {});
    }, 5000);
  }
}

/**
 * Linux/macOS에서 PDF를 프린터로 출력
 */
async function printPdfOnUnix(pdfBuffer, printerName) {
  const tempDir = await ensureTempDir();
  const tempFilePath = path.join(
    tempDir,
    `label-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`
  );

  try {
    await fs.writeFile(tempFilePath, pdfBuffer);

    const platform = process.platform;
    const command =
      platform === "darwin"
        ? printerName
          ? `lp -d "${printerName}" "${tempFilePath}"`
          : `lp "${tempFilePath}"`
        : printerName
        ? `lp -d "${printerName}" "${tempFilePath}"`
        : `lp "${tempFilePath}"`;

    await execAsync(command, {
      timeout: 30000,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(`Unix 프린트 실패:`, error);
    throw new Error(`프린트 실패: ${error.message}`);
  } finally {
    setTimeout(() => {
      fs.unlink(tempFilePath).catch(() => {});
    }, 5000);
  }
}

/**
 * PDF를 파일로 저장 (클라우드 환경)
 */
async function savePdfToFile(pdfBuffer, filename = null) {
  const pdfDir = await ensurePdfSaveDir();
  const fileName =
    filename ||
    `label-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
  const filePath = path.join(pdfDir, fileName);

  await fs.writeFile(filePath, pdfBuffer);
  console.log(`PDF 파일 저장 완료: ${filePath}`);

  return filePath;
}

/**
 * 라벨 프린트 (템플릿 기반)
 * @param {object} params - 프린트 파라미터
 * @returns {Promise<object>} 결과 객체
 */
exports.printLabel = async (params) => {
  try {
    const {
      templateType, // large, medium, small, verysmall
      templateData, // 템플릿에 전달할 데이터
      printerName,
      printCount = 1,
      pdfOptions = {},
    } = params;

    // 템플릿 타입 검증
    const validTemplateTypes = ['large', 'medium', 'small', 'verysmall'];
    if (!templateType || !validTemplateTypes.includes(templateType)) {
      throw new Error(`유효하지 않은 템플릿 타입입니다: ${templateType}`);
    }

    // 템플릿별 기본 PDF 옵션 (템플릿 파일의 @page size와 일치)
    const defaultPdfOptions = {
      large: { width: '100mm', height: '100mm', margin: '0mm' },
      medium: { width: '80mm', height: '60mm', margin: '0mm' },
      small: { width: '50mm', height: '30mm', margin: '0mm' },
      verysmall: { width: '26mm', height: '18mm', margin: '0mm' },
    };

    // PDF 옵션 병합 (사용자 지정 옵션이 있으면 우선 적용)
    const finalPdfOptions = {
      width: pdfOptions.width || defaultPdfOptions[templateType].width,
      height: pdfOptions.height || defaultPdfOptions[templateType].height,
      margin: pdfOptions.margin || defaultPdfOptions[templateType].margin,
      printCount,
    };

    // EJS 템플릿 렌더링
    const html = await renderTemplate(templateType, templateData);

    // HTML을 PDF로 변환
    const pdfBuffer = await convertHtmlToPdf(html, finalPdfOptions);

    // 환경별 처리
    if (appConfig.printer.type === "cloud" || !appConfig.printer.enabled) {
      // 클라우드 환경: PDF 파일로 저장
      const filePath = await savePdfToFile(pdfBuffer);
      return {
        success: true,
        message: `PDF 파일이 저장되었습니다 (${printCount}개 라벨)`,
        printCount,
        printerName: null,
        filePath,
        mode: "cloud",
      };
    } else {
      // 로컬 환경: 프린터로 출력
      if (!printerName) {
        throw new Error("로컬 환경에서는 프린터 이름이 필요합니다");
      }

      if (process.platform === "win32") {
        await printPdfOnWindows(pdfBuffer, printerName);
      } else {
        await printPdfOnUnix(pdfBuffer, printerName);
      }

      return {
        success: true,
        message: `${printerName}로 ${printCount}개의 라벨이 프린트되었습니다`,
        printCount,
        printerName,
        mode: "local",
      };
    }
  } catch (error) {
    console.error("라벨 프린트 실패:", error);
    return {
      success: false,
      message: `라벨 프린트 실패: ${error.message}`,
      error: error.message,
      mode: appConfig.printer.type === "cloud" ? "cloud" : "local",
    };
  }
};

/**
 * 프린터 목록 조회
 */
exports.getAvailablePrinters = async () => {
  if (appConfig.printer.type === "cloud" || !appConfig.printer.enabled) {
    return [];
  }

  try {
    if (printer) {
      const printers = printer.getPrinters();
      if (printers && printers.length > 0) {
        return printers
          .filter((p) => p && p.name && typeof p.name === "string")
          .map((p) => ({
            name: String(p.name || "").trim(),
            status: String(p.status || p.state || "Unknown").trim(),
            driver: String(p.driver || p.driverName || "").trim(),
            isDefault: Boolean(p.isDefault || p.default || false),
          }))
          .filter((p) => p.name.length > 0);
      }
    }
  } catch (error) {
    console.error("printer 패키지로 프린터 목록 조회 실패:", error.message);
  }

  // Windows PowerShell fallback
  if (process.platform === "win32") {
    try {
      const command = `powershell -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; try { $printers = Get-Printer -ErrorAction Stop | Select-Object Name, PrinterStatus, DriverName; if ($printers) { $printers | ConvertTo-Json -Depth 10 } else { '[]' } } catch { Write-Error $_.Exception.Message; '[]' }"`;

      const { stdout } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10,
        timeout: appConfig.printer.listTimeout,
        encoding: "utf8",
      });

      const trimmedOutput = stdout ? stdout.trim() : "";
      if (trimmedOutput && trimmedOutput !== "[]" && trimmedOutput !== "") {
        const printers = JSON.parse(trimmedOutput);
        const printerList = Array.isArray(printers) ? printers : [printers];

        return printerList
          .filter((p) => p && p.Name && typeof p.Name === "string")
          .map((p) => ({
            name: String(p.Name || "").trim(),
            status: String(p.PrinterStatus || "Unknown").trim(),
            driver: String(p.DriverName || "").trim(),
            isDefault: false,
          }))
          .filter((p) => p.name.length > 0);
      }
    } catch (error) {
      console.error("PowerShell fallback 실패:", error.message);
    }
  }

  return [];
};

/**
 * 브라우저 인스턴스 종료
 */
exports.closeBrowser = closeBrowser;

// 프로세스 종료 시 브라우저 정리
process.on("SIGINT", async () => {
  await closeBrowser();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeBrowser();
  process.exit(0);
});

