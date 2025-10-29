/**
 * 주문서 가져오기 컨트롤러
 * - 파일 업로드 및 처리 요청 핸들링
 * - 응답 포맷팅
 */

const orderImportService = require('../services/orderImportService');
const path = require('path');

// 출력 디렉토리 설정
const outputDir = path.join(__dirname, '../../uploads/order-outputs');

/**
 * 단일 파일 업로드 및 분석
 * POST /api/order-import/upload
 */
const uploadSingleFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: '파일이 업로드되지 않았습니다.'
      });
    }

    const result = await orderImportService.processSingleFile(req.file.path);

    res.json({
      ok: true,
      message: '파일이 성공적으로 처리되었습니다.',
      data: {
        format: result.format,
        recordCount: result.recordCount,
        orders: result.data,
        originalFileName: req.file.originalname
      }
    });

  } catch (error) {
    console.error('파일 처리 오류:', error);
    next(error);
  }
};

/**
 * 다중 파일 업로드 및 통합
 * POST /api/order-import/upload-multiple
 */
const uploadMultipleFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        ok: false,
        message: '파일이 업로드되지 않았습니다.'
      });
    }

    const result = await orderImportService.processMultipleFiles(req.files, outputDir);

    res.json({
      ok: true,
      message: `${req.files.length}개의 파일이 성공적으로 처리되었습니다.`,
      data: {
        fileResults: result.fileResults,
        totalRecords: result.totalRecords,
        outputFileName: result.outputFileName,
        downloadUrl: `/api/order-import/download/${result.outputFileName}`
      }
    });

  } catch (error) {
    console.error('다중 파일 처리 오류:', error);
    next(error);
  }
};

/**
 * 통합 파일 다운로드
 * GET /api/order-import/download/:filename
 */
const downloadFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(outputDir, filename);

    // 파일 존재 확인
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        ok: false,
        message: '파일을 찾을 수 없습니다.'
      });
    }

    // 파일 다운로드
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('파일 다운로드 오류:', err);
        next(err);
      }
    });

  } catch (error) {
    console.error('다운로드 처리 오류:', error);
    next(error);
  }
};

/**
 * 업로드된 파일 목록 조회
 * GET /api/order-import/files
 */
const getUploadedFiles = async (req, res, next) => {
  try {
    const fs = require('fs');
    
    // 출력 파일 목록 읽기
    if (!fs.existsSync(outputDir)) {
      return res.json({
        ok: true,
        data: {
          files: []
        }
      });
    }

    const files = fs.readdirSync(outputDir);
    const fileList = files
      .filter(file => file.endsWith('.xlsx'))
      .map(file => {
        const stats = fs.statSync(path.join(outputDir, file));
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          downloadUrl: `/api/order-import/download/${file}`
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // 최신순 정렬

    res.json({
      ok: true,
      data: {
        files: fileList,
        total: fileList.length
      }
    });

  } catch (error) {
    console.error('파일 목록 조회 오류:', error);
    next(error);
  }
};

/**
 * 파일 삭제
 * DELETE /api/order-import/files/:filename
 */
const deleteFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(outputDir, filename);

    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        ok: false,
        message: '파일을 찾을 수 없습니다.'
      });
    }

    // 파일 삭제
    fs.unlinkSync(filePath);

    res.json({
      ok: true,
      message: '파일이 삭제되었습니다.'
    });

  } catch (error) {
    console.error('파일 삭제 오류:', error);
    next(error);
  }
};

/**
 * 다중 파일 업로드 및 CJ대한통운 형식으로 통합
 * POST /api/order-import/upload-cj
 */
const uploadAndConvertToCJ = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        ok: false,
        message: '파일이 업로드되지 않았습니다.'
      });
    }

    const result = await orderImportService.processAndConvertToCJ(req.files, outputDir);

    res.json({
      ok: true,
      message: `${req.files.length}개의 파일이 성공적으로 처리되었습니다.`,
      data: {
        fileResults: result.fileResults,
        totalRecords: result.totalRecords,
        files: {
          standard: {
            fileName: result.standardFile.fileName,
            downloadUrl: result.standardFile.downloadUrl,
            description: '표준 통합 주문내역 (전체 정보 포함)'
          },
          cj: {
            fileName: result.cjFile.fileName,
            downloadUrl: result.cjFile.downloadUrl,
            description: 'CJ대한통운 업로드용 파일 (배송 정보만)'
          }
        }
      }
    });

  } catch (error) {
    console.error('CJ대한통운 형식 변환 오류:', error);
    next(error);
  }
};

module.exports = {
  uploadSingleFile,
  uploadMultipleFiles,
  uploadAndConvertToCJ,
  downloadFile,
  getUploadedFiles,
  deleteFile
};


