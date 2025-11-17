/**
 * 라벨 프린트 서비스
 * - EJS 템플릿을 HTML로 렌더링
 * - HTML을 PDF로 변환
 * - PDF를 프린터로 출력 또는 파일로 저장 (환경별 처리)
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const ejs = require('ejs');
const appConfig = require('../../config/appConfig');

const execAsync = promisify(exec);

const DEFAULT_PDF_OPTIONS = {
  large: { width: '100mm', height: '100mm', margin: '0mm' },
  medium: { width: '80mm', height: '60mm', margin: '0mm' },
  small: { width: '50mm', height: '30mm', margin: '0mm' },
  verysmall: { width: '28mm', height: '16mm', margin: '0mm' }
};

// 프린터 패키지는 조건부 로드 (서버 인쇄용)
let printer = null;
try {
  if (appConfig.printer.enabled && appConfig.printer.type !== 'cloud') {
    // eslint-disable-next-line global-require
    printer = require('printer');
  }
} catch (error) {
  console.warn('프린터 패키지 로드 실패:', error.message);
}

// Puppeteer 브라우저 인스턴스 (싱글톤)
let browserInstance = null;
let browserInitPromise = null;

async function getBrowser() {
  if (browserInstance) return browserInstance;
  if (browserInitPromise) return browserInitPromise;

  browserInitPromise = (async () => {
    try {
      const launchOptions = {
        headless: appConfig.puppeteer.headless,
        args: appConfig.puppeteer.args
      };

      if (appConfig.puppeteer.executablePath) {
        launchOptions.executablePath = appConfig.puppeteer.executablePath;
      }

      browserInstance = await puppeteer.launch(launchOptions);
      console.log('✓ Puppeteer 브라우저 인스턴스 초기화 완료');

      browserInstance.on('disconnected', () => {
        browserInstance = null;
        browserInitPromise = null;
      });

      return browserInstance;
    } catch (error) {
      browserInitPromise = null;
      console.error('Puppeteer 브라우저 초기화 실패:', error);
      throw new Error(`브라우저 초기화 실패: ${error.message}`);
    }
  })();

  return browserInitPromise;
}

function resolveSumatraPath() {
  const candidates = [
    process.env.SUMATRA_PATH,
    path.join(process.cwd(), 'bin', 'SumatraPDF.exe'),
    'C:\\Program Files\\SumatraPDF\\SumatraPDF.exe',
    'C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe'
  ].filter((candidate) => typeof candidate === 'string' && candidate.length > 0);

  for (const candidate of candidates) {
    try {
      if (fsSync.existsSync(candidate)) return candidate;
    } catch {
      // ignore
    }
  }
  return null;
}

async function closeBrowser() {
  if (!browserInstance) return;

  try {
    await browserInstance.close();
    browserInstance = null;
    browserInitPromise = null;
    console.log('✓ Puppeteer 브라우저 인스턴스 종료 완료');
  } catch (error) {
    console.error('브라우저 종료 실패:', error);
  }
}

async function ensureTempDir() {
  const tempDir = path.resolve(process.cwd(), appConfig.printer.tempPath);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

async function ensurePdfSaveDir() {
  const pdfDir = path.resolve(process.cwd(), appConfig.printer.pdfSavePath);
  await fs.mkdir(pdfDir, { recursive: true });
  return pdfDir;
}

// 템플릿 렌더링
async function renderTemplate(templateName, data) {
  try {
    const templatePath = path.join(__dirname, '../views', `label-${templateName}.ejs`);

    await fs.access(templatePath).catch((e) => {
      if (e && e.code === 'ENOENT') {
        throw new Error(`템플릿 파일을 찾을 수 없습니다: label-${templateName}.ejs`);
      }
      throw e;
    });

    const templateData = {
      productName: data.productName ?? '',
      manufactureDate: data.manufactureDate ?? '',
      expiryDate: data.expiryDate ?? '',
      barcodeNumber: data.barcodeNumber ?? '',
      barcodeBase64: data.barcodeBase64 ?? '',
      storageCondition: data.storageCondition ?? '냉동',
      registrationNumber: data.registrationNumber ?? '',
      categoryAndForm: data.categoryAndForm ?? '',
      ingredients: data.ingredients ?? '',
      rawMaterials: data.rawMaterials ?? '',
      actualWeight: data.actualWeight ?? '',
      isLoadingBarcode: data.isLoadingBarcode ?? false
    };

    const html = await ejs.renderFile(templatePath, templateData, {
      cache: false,
      strict: false
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

// HTML → PDF
async function convertHtmlToPdf(html, options = {}) {
  const {
    width = '100mm',
    height = '100mm',
    margin = '0mm',
    printCount = 1
  } = options;

  const browser = await getBrowser();

  try {
    const page = await browser.newPage();

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
            * { box-sizing: border-box; }
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
            .label-page:last-child { page-break-after: auto; }
          </style>
        </head>
        <body>
          ${Array.from({ length: printCount }).map(() => `<div class="label-page">${html}</div>`).join('')}
        </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      width,
      height,
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: margin, right: margin, bottom: margin, left: margin }
    });

    await page.close();
    return pdfBuffer;
  } catch (error) {
    console.error('HTML to PDF 변환 실패:', error);
    throw new Error(`PDF 변환 실패: ${error.message}`);
  }
}

async function printPdfOnWindows(pdfBuffer, printerName) {
  const tempDir = await ensureTempDir();
  const tempFilePath = path.join(
    tempDir,
    `label-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
  );

  try {
    await fs.writeFile(tempFilePath, pdfBuffer);
    const sumatra = resolveSumatraPath();

    if (sumatra) {
      const cmd = `"${sumatra}" -silent -exit-when-done -print-to "${printerName}" -print-settings "noscale,portrait" "${tempFilePath}"`;
      await execAsync(cmd, { windowsHide: true, timeout: 30000 });
    } else {
      const escapedPath = tempFilePath.replace(/'/g, "''");
      const escapedPrinter = printerName.replace(/'/g, "''");
      const cmd = `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "Start-Process -FilePath '${escapedPath}' -Verb PrintTo -ArgumentList '${escapedPrinter}' -WindowStyle Hidden"`;
      await execAsync(cmd, { windowsHide: true, timeout: 30000 });
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  } catch (error) {
    console.error('Windows 프린트 실패:', error);
    throw new Error(`프린트 실패: ${error.message}`);
  } finally {
    setTimeout(() => {
      fs.unlink(tempFilePath).catch(() => {});
    }, 5000);
  }
}

// Unix(CUPS) 인쇄
async function printPdfOnUnix(pdfBuffer, printerName, sizeOpt) {
  const tempDir = await ensureTempDir();
  const tempFilePath = path.join(
    tempDir,
    `label-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`
  );

  try {
    await fs.writeFile(tempFilePath, pdfBuffer);

    const widthMm = Number(String(sizeOpt?.width ?? '').replace('mm', '')) || 0;
    const heightMm = Number(String(sizeOpt?.height ?? '').replace('mm', '')) || 0;

    const mediaOpt =
      widthMm > 0 && heightMm > 0 ? `-o media=Custom.${widthMm}x${heightMm}mm` : '';

    const cupsOpts = `${mediaOpt} -o fit-to-page=false -o scaling=100`;

    const command = printerName
      ? `lp -d "${printerName}" ${cupsOpts} "${tempFilePath}"`
      : `lp ${cupsOpts} "${tempFilePath}"`;

    await execAsync(command, { timeout: 30000 });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error('Unix 프린트 실패:', error);
    throw new Error(`프린트 실패: ${error.message}`);
  } finally {
    setTimeout(() => {
      fs.unlink(tempFilePath).catch(() => {});
    }, 5000);
  }
}

// PDF 저장(클라우드 / 공유용)
async function savePdfToFile(pdfBuffer, filename = null) {
  const pdfDir = await ensurePdfSaveDir();
  const fileName =
    filename ?? `label-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
  const filePath = path.join(pdfDir, fileName);

  await fs.writeFile(filePath, pdfBuffer);
  console.log(`PDF 파일 저장 완료: ${filePath}`);
  return filePath;
}

// 라벨 프린트 (템플릿 기반)
// labelPrintService.js 같은 곳이라고 가정
exports.printLabel = async (params) => {
  try {
    const {
      templateType,
      templateData,
      printerName,
      printCount = 1,
      returnPdfBuffer = false // ✅ 추가: PDF 버퍼만 받고 싶을 때
    } = params;

    const validTypes = ['large', 'medium', 'small', 'verysmall'];

    if (!validTypes.includes(templateType)) {
      throw new Error(`유효하지 않은 템플릿 타입입니다: ${templateType}`);
    }

    const sizeOpt = DEFAULT_PDF_OPTIONS[templateType];
    const finalPdfOptions = { ...sizeOpt, printCount };

    const html = await renderTemplate(templateType, templateData);
    const pdfBuffer = await convertHtmlToPdf(html, finalPdfOptions);

    /**
     * ✅ 1) 프론트/로컬 에이전트로 넘길 PDF 버퍼만 필요할 때
     * - 예) 프론트에서 pdfBase64로 받아서 http://localhost:4310/print 로 보내기
     */
    if (returnPdfBuffer) {
      return {
        success: true,
        message: `PDF 버퍼 생성 완료 (${printCount}개 라벨)`,
        printCount,
        mode: 'buffer',
        pdfBuffer // Buffer 그대로
      };
    }

    /**
     * ✅ 2) 기존 cloud 모드: 파일만 저장
     */
    if (appConfig.printer.type === 'cloud' || !appConfig.printer.enabled) {
      const filePath = await savePdfToFile(pdfBuffer);
      const base = appConfig.printer.publicBaseUrl;
      const publicUrl =
        typeof base === 'string' && base.length > 0
          ? `${base.replace(/\/$/, '')}/${path.basename(filePath)}`
          : null;

      return {
        success: true,
        message: `PDF 파일이 저장되었습니다 (${printCount}개 라벨)`,
        printCount,
        printerName: null,
        filePath,
        publicUrl,
        mode: 'cloud'
      };
    }

    /**
     * ✅ 3) 서버 인쇄 모드 (이건 기존 로직 그대로)
     */
    if (!printerName || typeof printerName !== 'string' || printerName.trim().length === 0) {
      throw new Error('서버 인쇄 모드에서는 프린터 이름이 필요합니다');
    }

    if (process.platform === 'win32') {
      await printPdfOnWindows(pdfBuffer, printerName);
    } else {
      await printPdfOnUnix(pdfBuffer, printerName, sizeOpt);
    }

    return {
      success: true,
      message: `${printerName} 로 ${printCount}개의 라벨이 프린트되었습니다`,
      printCount,
      printerName,
      mode: 'local'
    };
  } catch (error) {
    console.error('라벨 프린트 실패:', error);
    const mode =
      appConfig.printer.type === 'cloud' || !appConfig.printer.enabled ? 'cloud' : 'local';

    return {
      success: false,
      message: `라벨 프린트 실패: ${error.message}`,
      error: error.message,
      mode
    };
  }
};

// 프린터 목록 조회 (서버에 연결된 프린터 기준)
exports.getAvailablePrinters = async () => {
  if (appConfig.printer.type === 'cloud' || !appConfig.printer.enabled) {
    return [];
  }

  // 1) printer 패키지로 조회
  try {
    if (printer) {
      const printers = printer.getPrinters();
      if (Array.isArray(printers) && printers.length > 0) {
        return printers
          .filter(
            (p) =>
              p &&
              typeof p.name === 'string' &&
              p.name.trim().length > 0
          )
          .map((p) => ({
            name: String(p.name).trim(),
            status: String(p.status ?? p.state ?? 'Unknown').trim(),
            driver: String(p.driver ?? p.driverName ?? '').trim(),
            isDefault: Boolean(p.isDefault ?? p.default ?? false)
          }));
      }
    }
  } catch (error) {
    console.error('printer 패키지로 프린터 목록 조회 실패:', error.message);
  }

  // 2) Windows PowerShell fallback
  if (process.platform === 'win32') {
    try {
      const command =
        'powershell -ExecutionPolicy Bypass -Command "$ErrorActionPreference = \'Stop\'; ' +
        '$printers = Get-Printer -ErrorAction Stop | Select-Object Name, PrinterStatus, DriverName; ' +
        'if ($printers) { $printers | ConvertTo-Json -Depth 10 } else { \'[]\' }"';

      const { stdout } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10,
        timeout: appConfig.printer.listTimeout,
        encoding: 'utf8'
      });

      const trimmedOutput = stdout ? stdout.trim() : '';
      if (trimmedOutput && trimmedOutput !== '[]') {
        const parsed = JSON.parse(trimmedOutput);
        const list = Array.isArray(parsed) ? parsed : [parsed];

        return list
          .filter(
            (p) =>
              p &&
              typeof p.Name === 'string' &&
              p.Name.trim().length > 0
          )
          .map((p) => ({
            name: String(p.Name).trim(),
            status: String(p.PrinterStatus ?? 'Unknown').trim(),
            driver: String(p.DriverName ?? '').trim(),
            isDefault: false
          }));
      }
    } catch (error) {
      console.error('PowerShell fallback 실패:', error.message);
    }
  }

  // 3) (선택) Linux CUPS lpstat 기반 조회를 추가할 수 있음

  return [];
};

exports.closeBrowser = closeBrowser;

process.on('SIGINT', async () => {
  await closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
  process.exit(0);
});
