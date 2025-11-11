/**
 * 라벨 프린트 서비스
 * - React 컴포넌트를 PDF로 변환
 * - PDF를 프린터로 출력 또는 파일로 저장 (환경별 처리)
 * - 클라우드 배포 환경 지원
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs").promises;
const { exec } = require("child_process");
const { promisify } = require("util");
const appConfig = require("../../config/appConfig");

const execAsync = promisify(exec);

// 프린터 패키지는 조건부 로드 (클라우드 환경에서는 필요 없음)
let printer = null;
try {
  if (appConfig.printer.enabled && appConfig.printer.type !== "cloud") {
    printer = require("printer");
  }
} catch (error) {
  console.warn("프린터 패키지 로드 실패 (클라우드 환경일 수 있음):", error.message);
}

// Puppeteer 브라우저 인스턴스 (싱글톤 패턴으로 재사용)
let browserInstance = null;
let browserInitPromise = null;

/**
 * Puppeteer 브라우저 인스턴스 초기화 (싱글톤)
 * @returns {Promise<puppeteer.Browser>}
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

      // 클라우드 환경에서 실행 파일 경로 지정
      if (appConfig.puppeteer.executablePath) {
        launchOptions.executablePath = appConfig.puppeteer.executablePath;
      }

      browserInstance = await puppeteer.launch(launchOptions);
      console.log("✓ Puppeteer 브라우저 인스턴스 초기화 완료");

      // 브라우저 종료 시 정리
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
 * 임시 디렉토리 생성 및 경로 반환
 * @returns {Promise<string>}
 */
async function ensureTempDir() {
  const tempDir = path.resolve(process.cwd(), appConfig.printer.tempPath);
  await fs.mkdir(tempDir, { recursive: true });
  return tempDir;
}

/**
 * PDF 저장 디렉토리 생성 및 경로 반환
 * @returns {Promise<string>}
 */
async function ensurePdfSaveDir() {
  const pdfDir = path.resolve(process.cwd(), appConfig.printer.pdfSavePath);
  await fs.mkdir(pdfDir, { recursive: true });
  return pdfDir;
}

/**
 * React 컴포넌트 HTML을 PDF로 변환
 * @param {string} htmlContent - React 컴포넌트로부터 생성된 HTML 문자열
 * @param {Object} options - PDF 옵션 (페이지 크기, 마진 등)
 * @returns {Promise<Buffer>} - PDF 버퍼
 */
async function convertHtmlToPdf(htmlContent, options = {}) {
  const {
    width = "50mm",
    height = "30mm",
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
            .map(() => `<div class="label-page">${htmlContent}</div>`)
            .join("")}
        </body>
      </html>
    `;

    // HTML 콘텐츠 설정
    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // PDF 생성
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
 * @param {Buffer} pdfBuffer - PDF 버퍼
 * @param {string} printerName - 프린터 이름
 * @returns {Promise<void>}
 */
async function printPdfOnWindows(pdfBuffer, printerName) {
  const tempDir = await ensureTempDir();
  const tempFilePath = path.join(
    tempDir,
    `label-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`
  );

  try {
    // PDF 파일 저장
    await fs.writeFile(tempFilePath, pdfBuffer);

    // PowerShell을 사용하여 PDF 프린트
    const escapedPath = tempFilePath.replace(/'/g, "''");
    const escapedPrinter = printerName.replace(/'/g, "''");
    const command = `powershell -ExecutionPolicy Bypass -Command "Start-Process -FilePath '${escapedPath}' -Verb PrintTo -ArgumentList '${escapedPrinter}' -WindowStyle Hidden"`;

    await execAsync(command, {
      timeout: 10000,
    });

    // 프린트 작업 완료 대기
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(`Windows 프린트 실패 (프린터: ${printerName}):`, error);
    throw new Error(`프린트 실패: ${error.message}`);
  } finally {
    // 임시 파일 삭제 (비동기, 에러 무시)
    setTimeout(() => {
      fs.unlink(tempFilePath).catch(() => {});
    }, 5000);
  }
}

/**
 * Linux/macOS에서 PDF를 프린터로 출력
 * @param {Buffer} pdfBuffer - PDF 버퍼
 * @param {string} printerName - 프린터 이름
 * @returns {Promise<void>}
 */
async function printPdfOnUnix(pdfBuffer, printerName) {
  const tempDir = await ensureTempDir();
  const tempFilePath = path.join(
    tempDir,
    `label-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`
  );

  try {
    // PDF 파일 저장
    await fs.writeFile(tempFilePath, pdfBuffer);

    // Linux/macOS에서 PDF 프린트는 시스템 명령어 사용
    // lp (CUPS) 또는 lpr 명령어 사용
    const platform = process.platform;
    let command;

    if (platform === "darwin") {
      // macOS: lp 명령어 사용
      command = printerName
        ? `lp -d "${printerName}" "${tempFilePath}"`
        : `lp "${tempFilePath}"`;
    } else {
      // Linux: lp 또는 lpr 명령어 사용
      command = printerName
        ? `lp -d "${printerName}" "${tempFilePath}"`
        : `lp "${tempFilePath}"`;
    }

    try {
      await execAsync(command, {
        timeout: 30000,
      });
      console.log(`PDF 프린트 명령 실행 완료: ${command}`);
    } catch (execError) {
      // lp 명령어 실패 시 lpr 시도
      if (platform === "linux") {
        const lprCommand = printerName
          ? `lpr -P "${printerName}" "${tempFilePath}"`
          : `lpr "${tempFilePath}"`;

        try {
          await execAsync(lprCommand, {
            timeout: 30000,
          });
          console.log(`PDF 프린트 명령 실행 완료 (lpr): ${lprCommand}`);
        } catch (lprError) {
          console.error(`프린트 명령 실행 실패:`, lprError);
          throw new Error(`프린트 실패: ${lprError.message}`);
        }
      } else {
        throw new Error(`프린트 실패: ${execError.message}`);
      }
    }

    // 프린트 작업 완료 대기
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    console.error(`Unix 프린트 실패 (프린터: ${printerName}):`, error);
    throw new Error(`프린트 실패: ${error.message}`);
  } finally {
    // 임시 파일 삭제 (비동기, 에러 무시)
    setTimeout(() => {
      fs.unlink(tempFilePath).catch(() => {});
    }, 5000);
  }
}

/**
 * PDF를 파일로 저장 (클라우드 환경)
 * @param {Buffer} pdfBuffer - PDF 버퍼
 * @param {string} filename - 파일명 (옵셔널)
 * @returns {Promise<string>} - 저장된 파일 경로
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
 * React 컴포넌트 HTML을 받아서 PDF로 변환하고 프린트 또는 저장
 * @param {Object} params - 파라미터
 * @param {string} params.htmlContent - React 컴포넌트로부터 생성된 HTML 문자열
 * @param {number} params.printCount - 프린트할 개수
 * @param {Object} params.pdfOptions - PDF 옵션 (width, height, margin 등)
 * @param {string} params.printerName - 프린터 이름 (로컬 환경에서 필수)
 * @returns {Promise<Object>} - 결과 객체
 */
exports.printLabelFromReact = async ({
  htmlContent,
  printCount = 1,
  pdfOptions = {},
  printerName,
}) => {
  try {
    if (!htmlContent) {
      throw new Error("htmlContent가 필요합니다");
    }

    // HTML을 PDF로 변환
    const pdfBuffer = await convertHtmlToPdf(htmlContent, {
      ...pdfOptions,
      printCount,
    });

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
      printerName: printerName || null,
      printCount,
      mode: appConfig.printer.type === "cloud" ? "cloud" : "local",
    };
  }
};

/**
 * Windows에서 사용 가능한 프린터 목록 조회
 * @returns {Promise<Array>} - 프린터 목록 배열
 */
async function getWindowsPrinters() {
  // 클라우드 환경에서는 빈 배열 반환
  if (appConfig.printer.type === "cloud" || !appConfig.printer.enabled) {
    return [];
  }

  try {
    // printer 패키지를 사용하여 프린터 목록 가져오기
    if (printer) {
      const printers = printer.getPrinters();

      if (!printers || printers.length === 0) {
        console.warn("프린터 목록이 비어있습니다.");
        return [];
      }

      // 프린터 정보 매핑
      const result = printers
        .filter((p) => p && p.name && typeof p.name === "string")
        .map((p) => ({
          name: String(p.name || "").trim(),
          status: String(p.status || p.state || "Unknown").trim(),
          driver: String(p.driver || p.driverName || "").trim(),
          isDefault: Boolean(p.isDefault || p.default || false),
        }))
        .filter((p) => p.name.length > 0);

      if (result.length > 0) {
        console.log(
          `프린터 목록 조회 성공: ${result.length}개 프린터 발견 - ${result.map((p) => p.name).join(", ")}`
        );
      }

      return result;
    }
  } catch (error) {
    console.error("printer 패키지로 프린터 목록 조회 실패:", error.message);
  }

  // PowerShell fallback (Windows 전용)
  if (process.platform === "win32") {
    try {
      console.log("PowerShell fallback으로 프린터 목록 조회 시도...");
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

        const result = printerList
          .filter((p) => p && p.Name && typeof p.Name === "string")
          .map((p) => ({
            name: String(p.Name || "").trim(),
            status: String(p.PrinterStatus || "Unknown").trim(),
            driver: String(p.DriverName || "").trim(),
            isDefault: false,
          }))
          .filter((p) => p.name.length > 0);

        console.log(`PowerShell fallback 성공: ${result.length}개 프린터 발견`);
        return result;
      }
    } catch (fallbackError) {
      console.error("PowerShell fallback도 실패:", fallbackError.message);
    }
  }

  // Linux/macOS fallback (lpstat 명령어 사용)
  if (process.platform !== "win32") {
    try {
      console.log("lpstat 명령어로 프린터 목록 조회 시도...");
      // lpstat으로 프린터 목록 조회
      const command = process.platform === "darwin"
        ? `lpstat -p 2>/dev/null | awk '{print $2}' | sed 's/:$//' || lpstat -a 2>/dev/null | awk '{print $1}' || echo ""`
        : `lpstat -p 2>/dev/null | awk '{print $2}' | sed 's/_.*$//' || lpstat -a 2>/dev/null | awk '{print $1}' || echo ""`;

      const { stdout } = await execAsync(command, {
        timeout: appConfig.printer.listTimeout,
        encoding: "utf8",
      });

      if (stdout && stdout.trim()) {
        const printerNames = stdout
          .trim()
          .split("\n")
          .filter((name) => name && name.trim().length > 0)
          .map((name) => name.trim())
          .filter((name, index, self) => self.indexOf(name) === index); // 중복 제거

        if (printerNames.length > 0) {
          const result = printerNames.map((name) => ({
            name,
            status: "Unknown",
            driver: "",
            isDefault: false,
          }));

          console.log(`lpstat으로 프린터 목록 조회 성공: ${result.length}개`);
          return result;
        }
      }
    } catch (error) {
      console.error("lpstat 프린터 목록 조회 실패:", error.message);
    }

    // printer 패키지 fallback (사용 가능한 경우)
    if (printer) {
      try {
        const printers = printer.getPrinters();
        if (printers && printers.length > 0) {
          return printers
            .filter((p) => p && p.name)
            .map((p) => ({
              name: String(p.name || "").trim(),
              status: String(p.status || p.state || "Unknown").trim(),
              driver: String(p.driver || p.driverName || "").trim(),
              isDefault: Boolean(p.isDefault || p.default || false),
            }))
            .filter((p) => p.name.length > 0);
        }
      } catch (error) {
        console.error("printer 패키지로 프린터 목록 조회 실패:", error.message);
      }
    }
  }

  // 빈 배열 반환 (에러 발생 시에도 서버가 중단되지 않도록)
  return [];
}

/**
 * 사용 가능한 프린터 목록 조회
 * @returns {Promise<Array>} - 프린터 목록 배열
 */
exports.getAvailablePrinters = async () => {
  try {
    return await getWindowsPrinters();
  } catch (error) {
    console.error("프린터 목록 조회 실패:", error);
    return [];
  }
};

/**
 * React 컴포넌트 HTML을 PDF로 변환만 하고 프린트하지 않음 (테스트용)
 * @param {Object} params - 파라미터
 * @param {string} params.htmlContent - React 컴포넌트로부터 생성된 HTML 문자열
 * @param {number} params.printCount - 생성할 개수
 * @param {Object} params.pdfOptions - PDF 옵션
 * @returns {Promise<Buffer>} - PDF 버퍼
 */
exports.convertLabelToPdf = async ({ htmlContent, printCount = 1, pdfOptions = {} }) => {
  return await convertHtmlToPdf(htmlContent, {
    ...pdfOptions,
    printCount,
  });
};

/**
 * 브라우저 인스턴스 종료 (서버 종료 시 호출)
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
