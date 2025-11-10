/**
 * 라벨 프린트 서비스
 * - React 컴포넌트를 PDF로 변환
 * - PDF를 바로 프린터로 출력
 */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs").promises;
const { exec } = require("child_process");
const { promisify } = require("util");
const execAsync = promisify(exec);

/**
 * React 컴포넌트 HTML을 PDF로 변환
 * @param {string} htmlContent - React 컴포넌트로부터 생성된 HTML 문자열
 * @param {Object} options - PDF 옵션 (페이지 크기, 마진 등)
 * @returns {Buffer} - PDF 버퍼
 */
async function convertHtmlToPdf(htmlContent, options = {}) {
  const {
    width = "50mm",
    height = "30mm",
    margin = "0mm",
    printCount = 1,
  } = options;

  // Puppeteer 브라우저 실행
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // 여러 라벨을 한 페이지에 표시하기 위한 HTML 생성
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <style>
            @page {
              size: ${width} ${height};
              margin: ${margin};
            }
            body {
              margin: 0;
              padding: 0;
              font-family: 'Nanum Gothic', sans-serif;
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

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

/**
 * Windows에서 PDF를 기본 프린터로 출력
 * @param {Buffer} pdfBuffer - PDF 버퍼
 * @param {string} printerName - 프린터 이름 (옵션, 기본값: 기본 프린터)
 * @returns {Promise<void>}
 */
async function printPdfOnWindows(pdfBuffer, printerName = null) {
  // 임시 파일로 저장
  const tempDir = path.join(__dirname, "../../temp");
  await fs.mkdir(tempDir, { recursive: true });

  const tempFilePath = path.join(
    tempDir,
    `label-${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`
  );

  try {
    // PDF 파일 저장
    await fs.writeFile(tempFilePath, pdfBuffer);

    if (printerName) {
      const command = `powershell -Command "Start-Process -FilePath '${tempFilePath}' -Verb PrintTo -ArgumentList '${printerName}' -WindowStyle Hidden"`;
      await execAsync(command);
    } else {
      const command = `powershell -Command "Start-Process -FilePath '${tempFilePath}' -Verb Print -WindowStyle Hidden"`;
      await execAsync(command);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  } finally {
    // 임시 파일 삭제 (비동기, 에러 무시)
    fs.unlink(tempFilePath).catch(() => {});
  }
}

/**
 * React 컴포넌트 HTML을 받아서 PDF로 변환하고 프린트
 * @param {Object} params - 파라미터
 * @param {string} params.htmlContent - React 컴포넌트로부터 생성된 HTML 문자열
 * @param {number} params.printCount - 프린트할 개수
 * @param {Object} params.pdfOptions - PDF 옵션 (width, height, margin 등)
 * @param {string} params.printerName - 프린터 이름 (필수)
 * @returns {Promise<Object>} - 결과 객체
 */
exports.printLabelFromReact = async ({
  htmlContent,
  printCount = 1,
  pdfOptions = {},
  printerName,
}) => {
  try {
    if (!printerName) {
      throw new Error("프린터 이름이 필요합니다");
    }

    // HTML을 PDF로 변환
    const pdfBuffer = await convertHtmlToPdf(htmlContent, {
      ...pdfOptions,
      printCount,
    });

    // PDF를 프린터로 출력
    await printPdfOnWindows(pdfBuffer, printerName);

    return {
      success: true,
      message: `${printerName}로 ${printCount}개의 라벨이 프린트되었습니다`,
      printCount,
      printerName,
    };
  } catch (error) {
    console.error("라벨 프린트 실패:", error);
    return {
      success: false,
      message: `라벨 프린트 실패: ${error.message}`,
      error: error.message,
      printerName,
      printCount,
    };
  }
};

/**
 * Windows에서 사용 가능한 프린터 목록 조회
 * @returns {Promise<Array>} - 프린터 목록 배열
 */
async function getWindowsPrinters() {
  try {
    // PowerShell 실행 정책 확인 및 우회
    // -ExecutionPolicy Bypass를 사용하여 실행 정책 문제 해결
    const command = `powershell -ExecutionPolicy Bypass -Command "$ErrorActionPreference = 'Stop'; try { $printers = Get-Printer -ErrorAction Stop | Select-Object Name, PrinterStatus, DriverName; if ($printers) { $printers | ConvertTo-Json -Depth 10 } else { '[]' } } catch { Write-Error $_.Exception.Message; '[]' }"`;
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 1024 * 1024 * 10, // 10MB 버퍼
      timeout: 30000, // 30초 타임아웃
      encoding: 'utf8',
    });

    // stderr가 있으면 로그만 남기고 계속 진행
    if (stderr && stderr.trim() && !stderr.includes('[]')) {
      console.warn("프린터 목록 조회 경고:", stderr);
    }

    // stdout이 비어있거나 '[]'만 있으면 빈 배열 반환
    const trimmedOutput = stdout ? stdout.trim() : '';
    if (!trimmedOutput || trimmedOutput === '[]' || trimmedOutput === '') {
      console.warn("프린터 목록이 비어있습니다. Windows 프린터 설정을 확인해주세요.");
      return [];
    }

    // JSON 파싱
    let printers;
    try {
      printers = JSON.parse(trimmedOutput);
    } catch (parseError) {
      console.error("프린터 목록 JSON 파싱 실패:", parseError);
      console.error("원본 출력 (처음 500자):", trimmedOutput.substring(0, 500));
      
      // 파싱 실패 시 빈 배열 반환
      return [];
    }

    // null이나 undefined 처리
    if (!printers) {
      console.warn("프린터 데이터가 null입니다.");
      return [];
    }

    // 배열이 아니면 배열로 변환
    const printerList = Array.isArray(printers) ? printers : [printers];

    // 유효한 프린터만 필터링 및 매핑
    const result = printerList
      .filter((printer) => printer && printer.Name && typeof printer.Name === 'string')
      .map((printer) => ({
        name: String(printer.Name || "").trim(),
        status: String(printer.PrinterStatus || "Unknown").trim(),
        driver: String(printer.DriverName || "").trim(),
      }))
      .filter((printer) => printer.name.length > 0); // 이름이 비어있지 않은 것만

    console.log(`프린터 목록 조회 성공: ${result.length}개 프린터 발견`);
    if (result.length > 0) {
      console.log("발견된 프린터:", result.map(p => p.name).join(", "));
    }
    
    return result;
  } catch (error) {
    console.error("프린터 목록 조회 실패:", error);
    console.error("에러 상세:", {
      message: error.message,
      code: error.code,
      signal: error.signal,
      stdout: error.stdout ? error.stdout.substring(0, 500) : null,
      stderr: error.stderr ? error.stderr.substring(0, 500) : null,
    });

    // 빈 배열 반환 (에러 발생 시에도 서버가 중단되지 않도록)
    return [];
  }
}

/**
 * Windows에서 사용 가능한 프린터 목록 조회
 * @returns {Promise<Array>} - 프린터 목록 배열
 */
exports.getAvailablePrinters = async () => {
  return await getWindowsPrinters();
};

/**
 * React 컴포넌트 HTML을 PDF로 변환만 하고 프린트하지 않음 (테스트용)
 * @param {Object} params - 파라미터
 * @param {string} params.htmlContent - React 컴포넌트로부터 생성된 HTML 문자열
 * @param {number} params.printCount - 생성할 개수
 * @param {Object} params.pdfOptions - PDF 옵션
 * @returns {Promise<Buffer>} - PDF 버퍼
 */
exports.convertLabelToPdf = async ({
  htmlContent,
  printCount = 1,
  pdfOptions = {},
}) => {
  return await convertHtmlToPdf(htmlContent, {
    ...pdfOptions,
    printCount,
  });
};

