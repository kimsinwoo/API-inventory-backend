# 프론트엔드 API 사용 가이드

이 문서는 백엔드 API를 프론트엔드에서 사용하기 위한 가이드입니다.

## API 기본 정보

- **Base URL**: `http://localhost:4000/api` (개발 환경)
- **Content-Type**: `application/json`
- **인증**: 세션 기반 (쿠키 사용)

## TypeScript 타입 정의

```typescript
// types/api.ts

// API 응답 공통 타입
export interface ApiResponse<T = any> {
  ok: boolean;
  message: string;
  data?: T;
  error?: string;
  warning?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

// 프린터 정보
export interface Printer {
  name: string;
  status: string;
  driver: string;
  isDefault: boolean;
}

// Finished 품목
export interface FinishedItem {
  id: number;
  code: string;
  name: string;
  unit: string;
}

// 라벨 정보
export interface Label {
  id: number;
  barcode: string;
  product_name: string;
  registration_code: string;
  quantity: number;
  unit: string;
  label_size: string;
  inventory_id?: number;
  item_id?: number;
  label_data?: any;
  created_at?: string;
  updated_at?: string;
}

// 라벨 생성 요청
export interface CreateLabelRequest {
  itemId: number;
  inventoryId: number;
  barcode: string;
  quantity?: number;
  unit?: string;
}

// 라벨 프린트 요청
export interface PrintLabelRequest {
  htmlContent: string;
  printerName?: string; // 로컬 환경에서는 필수, 클라우드에서는 선택사항
  printCount?: number;
  pdfOptions?: {
    width?: string;
    height?: string;
    margin?: string;
  };
  labelType?: string;
  productName?: string;
  storageCondition?: string;
  registrationNumber?: string;
  categoryAndForm?: string;
  ingredients?: string;
  rawMaterials?: string;
  actualWeight?: string;
  itemId?: number;
}

// 저장된 라벨 프린트 요청
export interface PrintSavedLabelRequest {
  labelId: number;
  printerName?: string; // 로컬 환경에서는 필수, 클라우드에서는 선택사항
  manufactureDate: string; // YYYY-MM-DD 형식
  expiryDate: string; // YYYY-MM-DD 형식
  printCount?: number;
  pdfOptions?: {
    width?: string;
    height?: string;
    margin?: string;
  };
}

// 프린트 결과
export interface PrintResult {
  templateId: number | null;
  printCount: number;
  printerName: string | null;
  filePath: string | null; // 클라우드 환경에서만
  mode: "local" | "cloud" | "unknown";
  printedAt: string | null;
  error: string | null;
}

// 바코드 정보
export interface BarcodeInfo {
  barcode: string;
  item?: any;
  inventory?: any;
}

// 바코드 이력
export interface BarcodeHistory {
  barcode: string;
  movements: any[];
}
```

## API 클라이언트 구현

```typescript
// services/barcodeApi.ts

import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 포함
});

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 서버 응답이 있는 경우
      const { status, data } = error.response;
      console.error(`API Error [${status}]:`, data.message || error.message);
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      console.error('Network Error:', error.message);
    } else {
      // 요청 설정 중 오류
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * 바코드 API 클라이언트
 */
export const barcodeApi = {
  /**
   * 프린터 목록 조회
   */
  getPrinters: async (): Promise<ApiResponse<Printer[]>> => {
    const response = await apiClient.get('/barcode/printers');
    return response.data;
  },

  /**
   * Finished 품목 목록 조회
   */
  getFinishedItems: async (): Promise<ApiResponse<FinishedItem[]>> => {
    const response = await apiClient.get('/barcode/items/finished');
    return response.data;
  },

  /**
   * 라벨 생성
   */
  createLabel: async (data: CreateLabelRequest): Promise<ApiResponse<Label>> => {
    const response = await apiClient.post('/barcode/labels', data);
    return response.data;
  },

  /**
   * 라벨 목록 조회
   */
  getLabels: async (page: number = 1, limit: number = 50): Promise<ApiResponse<Label[]>> => {
    const response = await apiClient.get('/barcode/labels', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * 라벨 ID로 조회
   */
  getLabelById: async (labelId: number): Promise<ApiResponse<Label>> => {
    const response = await apiClient.get(`/barcode/labels/${labelId}`);
    return response.data;
  },

  /**
   * 바코드로 라벨 조회
   */
  getLabelsByBarcode: async (barcode: string): Promise<ApiResponse<Label[]>> => {
    const response = await apiClient.get(`/barcode/labels/barcode/${barcode}`);
    return response.data;
  },

  /**
   * 재고 ID로 라벨 조회
   */
  getLabelsByInventoryId: async (inventoryId: number): Promise<ApiResponse<Label[]>> => {
    const response = await apiClient.get(`/barcode/labels/inventory/${inventoryId}`);
    return response.data;
  },

  /**
   * 등록번호로 라벨 템플릿 조회
   */
  getLabelTemplateByRegistrationNumber: async (
    registrationNumber: string
  ): Promise<ApiResponse<any>> => {
    const response = await apiClient.get(
      `/barcode/labeltemplates/registration/${registrationNumber}`
    );
    return response.data;
  },

  /**
   * 라벨 프린트 (HTML 컨텐츠)
   */
  printLabel: async (data: PrintLabelRequest): Promise<ApiResponse<PrintResult>> => {
    const response = await apiClient.post('/barcode/print-label', data);
    return response.data;
  },

  /**
   * 저장된 라벨 프린트
   */
  printSavedLabel: async (
    data: PrintSavedLabelRequest
  ): Promise<ApiResponse<PrintResult & { labelId: number; barcode: string }>> => {
    const response = await apiClient.post('/barcode/print-saved-label', data);
    return response.data;
  },

  /**
   * 바코드 스캔
   */
  scanBarcode: async (barcode: string): Promise<ApiResponse<BarcodeInfo>> => {
    const response = await apiClient.get(`/barcode/scan/${barcode}`);
    return response.data;
  },

  /**
   * 바코드 생성
   */
  generateBarcode: async (data: {
    itemId: number;
    quantity: number;
    receivedAt?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/barcode/generate-label', data);
    return response.data;
  },

  /**
   * 입고 처리
   */
  receiveWithBarcode: async (data: {
    barcode: string;
    itemId: number;
    factoryId: number;
    storageConditionId: number;
    wholesalePrice: number;
    quantity: number;
    receivedAt?: string;
    unit?: string;
    note?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/barcode/receive', data);
    return response.data;
  },

  /**
   * 공장 이동 출고
   */
  transferOut: async (data: {
    barcode: string;
    quantity: number;
    toFactoryId: number;
    note?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/barcode/transfer-out', data);
    return response.data;
  },

  /**
   * 공장 이동 입고
   */
  transferIn: async (data: {
    barcode: string;
    factoryId: number;
    storageConditionId?: number;
    note?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/barcode/transfer-in', data);
    return response.data;
  },

  /**
   * 출고 처리
   */
  issueByBarcode: async (data: {
    barcode: string;
    quantity: number;
    issueType?: 'SHIPPING' | 'PRODUCTION' | 'DISPOSAL' | 'SAMPLE' | 'OTHER';
    note?: string;
    customerName?: string;
    trackingNumber?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/barcode/issue', data);
    return response.data;
  },

  /**
   * 배송 처리
   */
  shipByBarcode: async (data: {
    barcode: string;
    quantity: number;
    customerName: string;
    customerAddress?: string;
    customerPhone?: string;
    shippingCompany?: 'CJ대한통운' | '롯데택배' | '우체국택배' | '한진택배' | '로젠택배' | '기타';
    trackingNumber?: string;
    shippingMessage?: string;
  }): Promise<ApiResponse<any>> => {
    const response = await apiClient.post('/barcode/ship', data);
    return response.data;
  },

  /**
   * 바코드 이력 조회
   */
  getBarcodeHistory: async (barcode: string): Promise<ApiResponse<BarcodeHistory>> => {
    const response = await apiClient.get(`/barcode/history/${barcode}`);
    return response.data;
  },
};

export default barcodeApi;
```

## React Hook 예제

```typescript
// hooks/useBarcodeApi.ts

import { useState, useCallback } from 'react';
import { barcodeApi } from '../services/barcodeApi';
import { ApiResponse, Printer, Label, PrintLabelRequest, PrintSavedLabelRequest } from '../types/api';

export const useBarcodeApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 프린터 목록 조회
   */
  const getPrinters = useCallback(async (): Promise<Printer[] | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.getPrinters();
      if (response.ok) {
        return response.data || [];
      } else {
        setError(response.message || '프린터 목록 조회 실패');
        return null;
      }
    } catch (err: any) {
      setError(err.message || '프린터 목록 조회 중 오류 발생');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Finished 품목 목록 조회
   */
  const getFinishedItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.getFinishedItems();
      if (response.ok) {
        return response.data || [];
      } else {
        setError(response.message || '품목 목록 조회 실패');
        return null;
      }
    } catch (err: any) {
      setError(err.message || '품목 목록 조회 중 오류 발생');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 라벨 프린트
   */
  const printLabel = useCallback(async (data: PrintLabelRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.printLabel(data);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.message || response.error || '라벨 프린트 실패');
        return null;
      }
    } catch (err: any) {
      setError(err.message || '라벨 프린트 중 오류 발생');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 저장된 라벨 프린트
   */
  const printSavedLabel = useCallback(async (data: PrintSavedLabelRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.printSavedLabel(data);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.message || response.error || '라벨 프린트 실패');
        return null;
      }
    } catch (err: any) {
      setError(err.message || '라벨 프린트 중 오류 발생');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 라벨 생성
   */
  const createLabel = useCallback(async (data: {
    itemId: number;
    inventoryId: number;
    barcode: string;
    quantity?: number;
    unit?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.createLabel(data);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.message || '라벨 생성 실패');
        return null;
      }
    } catch (err: any) {
      setError(err.message || '라벨 생성 중 오류 발생');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 라벨 목록 조회
   */
  const getLabels = useCallback(async (page: number = 1, limit: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.getLabels(page, limit);
      if (response.ok) {
        return {
          labels: response.data || [],
          meta: response.meta,
        };
      } else {
        setError(response.message || '라벨 목록 조회 실패');
        return null;
      }
    } catch (err: any) {
      setError(err.message || '라벨 목록 조회 중 오류 발생');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 바코드 스캔
   */
  const scanBarcode = useCallback(async (barcode: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await barcodeApi.scanBarcode(barcode);
      if (response.ok && response.data) {
        return response.data;
      } else {
        setError(response.message || '바코드 조회 실패');
        return null;
      }
    } catch (err: any) {
      setError(err.message || '바코드 조회 중 오류 발생');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getPrinters,
    getFinishedItems,
    printLabel,
    printSavedLabel,
    createLabel,
    getLabels,
    scanBarcode,
  };
};
```

## React 컴포넌트 예제

```typescript
// components/LabelPrintComponent.tsx

import React, { useState, useEffect } from 'react';
import { useBarcodeApi } from '../hooks/useBarcodeApi';
import { Printer, FinishedItem } from '../types/api';

const LabelPrintComponent: React.FC = () => {
  const { loading, error, getPrinters, getFinishedItems, printLabel } = useBarcodeApi();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [finishedItems, setFinishedItems] = useState<FinishedItem[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<number | null>(null);
  const [printCount, setPrintCount] = useState<number>(1);
  const [htmlContent, setHtmlContent] = useState<string>('');

  // 컴포넌트 마운트 시 프린터 목록 및 품목 목록 조회
  useEffect(() => {
    const loadData = async () => {
      const printerList = await getPrinters();
      if (printerList) {
        setPrinters(printerList);
        // 기본 프린터 선택
        const defaultPrinter = printerList.find((p) => p.isDefault);
        if (defaultPrinter) {
          setSelectedPrinter(defaultPrinter.name);
        } else if (printerList.length > 0) {
          setSelectedPrinter(printerList[0].name);
        }
      }

      const items = await getFinishedItems();
      if (items) {
        setFinishedItems(items);
      }
    };

    loadData();
  }, [getPrinters, getFinishedItems]);

  // 라벨 HTML 생성 (예제)
  const generateLabelHtml = (item: FinishedItem) => {
    return `
      <div style="width: 50mm; height: 30mm; border: 1px solid #000; padding: 5px;">
        <h3>${item.name}</h3>
        <p>코드: ${item.code}</p>
        <p>단위: ${item.unit}</p>
        <p>바코드: [바코드 이미지]</p>
      </div>
    `;
  };

  // 프린트 처리
  const handlePrint = async () => {
    if (!selectedItem || !htmlContent) {
      alert('품목과 라벨 내용을 입력해주세요.');
      return;
    }

    const item = finishedItems.find((i) => i.id === selectedItem);
    if (!item) {
      alert('선택한 품목을 찾을 수 없습니다.');
      return;
    }

    // 라벨 HTML 생성
    const labelHtml = generateLabelHtml(item);

    // 프린트 요청 (클라우드 환경에서는 printerName 생략 가능)
    const result = await printLabel({
      htmlContent: labelHtml,
      printerName: selectedPrinter || undefined, // 클라우드 환경에서는 undefined
      printCount,
      pdfOptions: {
        width: '50mm',
        height: '30mm',
        margin: '0mm',
      },
      productName: item.name,
      itemId: item.id,
    });

    if (result) {
      if (result.mode === 'cloud' && result.filePath) {
        alert(`PDF 파일이 저장되었습니다: ${result.filePath}`);
        // 클라우드 환경에서는 PDF 파일 다운로드 링크 제공 가능
      } else {
        alert(`프린트 완료: ${result.printerName}`);
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>라벨 프린트</h2>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {/* 프린터 선택 */}
      <div style={{ marginBottom: '15px' }}>
        <label>프린터 선택: </label>
        <select
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          disabled={loading || printers.length === 0}
        >
          <option value="">프린터 선택</option>
          {printers.map((printer) => (
            <option key={printer.name} value={printer.name}>
              {printer.name} {printer.isDefault && '(기본)'} - {printer.status}
            </option>
          ))}
        </select>
        {printers.length === 0 && (
          <span style={{ color: 'orange', marginLeft: '10px' }}>
            프린터가 없습니다. 클라우드 환경일 수 있습니다.
          </span>
        )}
      </div>

      {/* 품목 선택 */}
      <div style={{ marginBottom: '15px' }}>
        <label>품목 선택: </label>
        <select
          value={selectedItem || ''}
          onChange={(e) => setSelectedItem(Number(e.target.value))}
          disabled={loading}
        >
          <option value="">품목 선택</option>
          {finishedItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.code})
            </option>
          ))}
        </select>
      </div>

      {/* 프린트 개수 */}
      <div style={{ marginBottom: '15px' }}>
        <label>프린트 개수: </label>
        <input
          type="number"
          value={printCount}
          onChange={(e) => setPrintCount(Number(e.target.value))}
          min={1}
          disabled={loading}
        />
      </div>

      {/* 라벨 HTML 내용 (예제) */}
      <div style={{ marginBottom: '15px' }}>
        <label>라벨 내용: </label>
        <textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          rows={10}
          cols={50}
          disabled={loading}
          placeholder="라벨 HTML 내용을 입력하세요"
        />
      </div>

      {/* 프린트 버튼 */}
      <button onClick={handlePrint} disabled={loading || !selectedItem}>
        {loading ? '프린트 중...' : '프린트'}
      </button>
    </div>
  );
};

export default LabelPrintComponent;
```

## 저장된 라벨 프린트 예제

```typescript
// components/PrintSavedLabelComponent.tsx

import React, { useState } from 'react';
import { useBarcodeApi } from '../hooks/useBarcodeApi';

interface PrintSavedLabelProps {
  labelId: number;
  barcode: string;
}

const PrintSavedLabelComponent: React.FC<PrintSavedLabelProps> = ({
  labelId,
  barcode,
}) => {
  const { loading, error, printSavedLabel, getPrinters } = useBarcodeApi();
  const [printers, setPrinters] = useState<any[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [printCount, setPrintCount] = useState<number>(1);
  const [manufactureDate, setManufactureDate] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');

  // 프린터 목록 조회
  React.useEffect(() => {
    const loadPrinters = async () => {
      const printerList = await getPrinters();
      if (printerList) {
        setPrinters(printerList);
        const defaultPrinter = printerList.find((p) => p.isDefault);
        if (defaultPrinter) {
          setSelectedPrinter(defaultPrinter.name);
        } else if (printerList.length > 0) {
          setSelectedPrinter(printerList[0].name);
        }
      }
    };
    loadPrinters();
  }, [getPrinters]);

  // 프린트 처리
  const handlePrint = async () => {
    if (!manufactureDate || !expiryDate) {
      alert('제조일자와 유통기한을 입력해주세요.');
      return;
    }

    // 날짜 형식 검증 (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(manufactureDate) || !dateRegex.test(expiryDate)) {
      alert('날짜 형식이 올바르지 않습니다. YYYY-MM-DD 형식으로 입력해주세요.');
      return;
    }

    const result = await printSavedLabel({
      labelId,
      printerName: selectedPrinter || undefined, // 클라우드 환경에서는 undefined
      manufactureDate,
      expiryDate,
      printCount,
      pdfOptions: {
        width: '50mm',
        height: '30mm',
        margin: '0mm',
      },
    });

    if (result) {
      if (result.mode === 'cloud' && result.filePath) {
        alert(`PDF 파일이 저장되었습니다: ${result.filePath}`);
      } else {
        alert(`프린트 완료: ${result.printerName || '클라우드 모드'}`);
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3>저장된 라벨 프린트</h3>
      <p>바코드: {barcode}</p>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {/* 프린터 선택 */}
      <div style={{ marginBottom: '15px' }}>
        <label>프린터 선택: </label>
        <select
          value={selectedPrinter}
          onChange={(e) => setSelectedPrinter(e.target.value)}
          disabled={loading}
        >
          <option value="">프린터 선택 (선택사항)</option>
          {printers.map((printer) => (
            <option key={printer.name} value={printer.name}>
              {printer.name} {printer.isDefault && '(기본)'}
            </option>
          ))}
        </select>
      </div>

      {/* 제조일자 */}
      <div style={{ marginBottom: '15px' }}>
        <label>제조일자 (YYYY-MM-DD): </label>
        <input
          type="date"
          value={manufactureDate}
          onChange={(e) => setManufactureDate(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {/* 유통기한 */}
      <div style={{ marginBottom: '15px' }}>
        <label>유통기한 (YYYY-MM-DD): </label>
        <input
          type="date"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {/* 프린트 개수 */}
      <div style={{ marginBottom: '15px' }}>
        <label>프린트 개수: </label>
        <input
          type="number"
          value={printCount}
          onChange={(e) => setPrintCount(Number(e.target.value))}
          min={1}
          disabled={loading}
        />
      </div>

      {/* 프린트 버튼 */}
      <button onClick={handlePrint} disabled={loading || !manufactureDate || !expiryDate}>
        {loading ? '프린트 중...' : '프린트'}
      </button>
    </div>
  );
};

export default PrintSavedLabelComponent;
```

## 환경 변수 설정

프론트엔드 프로젝트의 `.env` 파일에 다음을 추가하세요:

```env
REACT_APP_API_URL=http://localhost:4000/api
```

## 사용 예제

### 1. 프린터 목록 조회

```typescript
import { barcodeApi } from './services/barcodeApi';

const printers = await barcodeApi.getPrinters();
if (printers.ok) {
  console.log('프린터 목록:', printers.data);
} else {
  console.error('오류:', printers.message);
}
```

### 2. 라벨 프린트

```typescript
import { barcodeApi } from './services/barcodeApi';

const result = await barcodeApi.printLabel({
  htmlContent: '<div>라벨 내용</div>',
  printerName: 'HP LaserJet', // 로컬 환경에서만 필요
  printCount: 1,
  pdfOptions: {
    width: '50mm',
    height: '30mm',
    margin: '0mm',
  },
});

if (result.ok && result.data) {
  if (result.data.mode === 'cloud') {
    console.log('PDF 저장됨:', result.data.filePath);
  } else {
    console.log('프린트 완료:', result.data.printerName);
  }
}
```

### 3. 저장된 라벨 프린트

```typescript
import { barcodeApi } from './services/barcodeApi';

const result = await barcodeApi.printSavedLabel({
  labelId: 123,
  printerName: 'HP LaserJet', // 로컬 환경에서만 필요
  manufactureDate: '2024-01-01',
  expiryDate: '2025-01-01',
  printCount: 1,
});

if (result.ok && result.data) {
  console.log('프린트 완료');
}
```

## 주의사항

1. **클라우드 환경**: 프린터 이름은 선택사항이며, PDF 파일로 저장됩니다.
2. **로컬 환경**: 프린터 이름이 필요하며, 지정한 프린터로 직접 출력됩니다.
3. **에러 처리**: 모든 API 호출은 에러 처리를 포함해야 합니다.
4. **로딩 상태**: 사용자 경험을 위해 로딩 상태를 표시하는 것을 권장합니다.
5. **날짜 형식**: 제조일자와 유통기한은 `YYYY-MM-DD` 형식이어야 합니다.

## 추가 리소스

- [Axios 문서](https://axios-http.com/)
- [React Hooks 문서](https://react.dev/reference/react)


