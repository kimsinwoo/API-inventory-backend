/**
 * 사용자 활동 로그 미들웨어
 * 모든 API 요청을 기록하여 감사 추적 지원
 */

const db = require("../../models");
const dayjs = require("dayjs");

/**
 * 활동 로그 기록
 */
exports.logActivity = async (req, res, next) => {
  // 응답 완료 후 로그 기록
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    res.send = originalSend;

    // 로그 기록 (비동기)
    setImmediate(async () => {
      try {
        const duration = Date.now() - startTime;
        
        const logData = {
          userId: req.session?.userId || null,
          userEmail: req.session?.userEmail || null,
          method: req.method,
          path: req.path,
          fullUrl: req.originalUrl,
          statusCode: res.statusCode,
          duration,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get("user-agent"),
          timestamp: new Date(),
        };

        // 민감한 정보 제외
        const sensitiveFields = ["password", "token", "secret"];
        const body = req.body ? { ...req.body } : {};
        sensitiveFields.forEach((field) => {
          if (body[field]) {
            body[field] = "***REDACTED***";
          }
        });

        logData.body = body;
        logData.query = req.query;

        // 콘솔에 로그 출력
        if (res.statusCode >= 400) {
          console.error(
            `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
          );
        } else {
          console.log(
            `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
          );
        }

        // 데이터베이스에 저장 (옵션)
        // await saveToDatabase(logData);
      } catch (error) {
        console.error("활동 로그 기록 실패:", error);
      }
    });

    return originalSend.call(this, data);
  };

  next();
};

/**
 * 중요 작업 감사 로그
 * 재고 입출고, 승인, 삭제 등 중요한 작업에 대한 감사 추적
 */
exports.auditLog = (action, resourceType) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (data) {
      res.send = originalSend;

      // 감사 로그 기록 (비동기)
      setImmediate(async () => {
        try {
          const duration = Date.now() - startTime;
          const success = res.statusCode >= 200 && res.statusCode < 300;

          const auditData = {
            userId: req.session?.userId || null,
            userEmail: req.session?.userEmail || null,
            action,
            resourceType,
            resourceId: req.params.id || null,
            success,
            statusCode: res.statusCode,
            duration,
            ip: req.ip || req.connection.remoteAddress,
            timestamp: new Date(),
            details: {
              method: req.method,
              path: req.path,
              body: req.body,
              query: req.query,
            },
          };

          console.log(
            `[AUDIT] [${dayjs().format("YYYY-MM-DD HH:mm:ss")}] ` +
              `${auditData.userEmail || "Anonymous"} - ${action} ${resourceType} ` +
              `(${success ? "SUCCESS" : "FAILED"}) - ${duration}ms`
          );

          // AuditLog 테이블에 저장 (옵션)
          // await db.AuditLog.create({ ... });
        } catch (error) {
          console.error("감사 로그 기록 실패:", error);
        }
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * 에러 로그
 */
exports.logError = (error, req, res, next) => {
  console.error("\n========== 에러 발생 ==========");
  console.error("시간:", dayjs().format("YYYY-MM-DD HH:mm:ss"));
  console.error("사용자:", req.session?.userEmail || "Anonymous");
  console.error("경로:", req.method, req.path);
  console.error("에러:", error.message);
  console.error("스택:", error.stack);
  console.error("================================\n");

  // 에러를 다음 미들웨어로 전달
  next(error);
};

/**
 * 특정 엔드포인트만 로그 제외
 */
exports.skipLogging = (paths = []) => {
  return (req, res, next) => {
    if (paths.includes(req.path)) {
      return next();
    }

    exports.logActivity(req, res, next);
  };
};

/**
 * 요청 ID 추가 (디버깅용)
 */
exports.addRequestId = (req, res, next) => {
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader("X-Request-Id", req.requestId);
  next();
};

