/**
 * 바코드 및 라벨 프린트 API 클라이언트
 * 
 * 사용법:
 * 1. 이 파일을 프론트엔드 프로젝트의 services 폴더에 복사
 * 2. axios 설치: npm install axios
 * 3. 타입 정의 파일(types/api.ts) 생성
 * 4. 환경 변수 설정: REACT_APP_API_URL=http://localhost:4000/api
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// API Base URL (환경 변수에서 가져오거나 기본값 사용)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// 타입 정의
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

export interface Printer {
  name: string;
  status: string;
  driver: string;
  isDefault: boolean;
}

export interface FinishedItem {
  id: number;
  code: string;
  name: string;
  unit: string;
}

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

export interface CreateLabelRequest {
  itemId: number;
  inventoryId: number;
  barcode: string;
  quantity?: number;
  unit?: string;
}

export interface PrintLabelRequest {
  htmlContent: string;
  printerName?: string;
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

export interface PrintSavedLabelRequest {
  labelId: number;
  printerName?: string;
  manufactureDate: string;
  expiryDate: string;
  printCount?: number;
  pdfOptions?: {
    width?: string;
    height?: string;
    margin?: string;
  };
}

export interface PrintResult {
  templateId: number | null;
  printCount: number;
  printerName: string | null;
  filePath: string | null;
  mode: 'local' | 'cloud' | 'unknown';
  printedAt: string | null;
  error: string | null;
}

export interface BarcodeInfo {
  barcode: string;
  item?: any;
  inventory?: any;
}

export interface BarcodeHistory {
  barcode: string;
  movements: any[];
}

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 포함 (세션 인증)
  timeout: 30000, // 30초 타임아웃
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // 요청 전 처리 (예: 토큰 추가)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // 서버 응답이 있는 경우
      const { status, data } = error.response;
      const apiError = data as ApiResponse;
      console.error(`API Error [${status}]:`, apiError.message || error.message);
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      console.error('Network Error: 서버에 연결할 수 없습니다.');
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
   * GET /api/barcode/printers
   */
  getPrinters: async (): Promise<ApiResponse<Printer[]>> => {
    try {
      const response = await apiClient.get('/barcode/printers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Finished 품목 목록 조회
   * GET /api/barcode/items/finished
   */
  getFinishedItems: async (): Promise<ApiResponse<FinishedItem[]>> => {
    try {
      const response = await apiClient.get('/barcode/items/finished');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 라벨 생성
   * POST /api/barcode/labels
   */
  createLabel: async (data: CreateLabelRequest): Promise<ApiResponse<Label>> => {
    try {
      const response = await apiClient.post('/barcode/labels', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 라벨 목록 조회
   * GET /api/barcode/labels?page=1&limit=50
   */
  getLabels: async (page: number = 1, limit: number = 50): Promise<ApiResponse<Label[]>> => {
    try {
      const response = await apiClient.get('/barcode/labels', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 라벨 ID로 조회
   * GET /api/barcode/labels/:labelId
   */
  getLabelById: async (labelId: number): Promise<ApiResponse<Label>> => {
    try {
      const response = await apiClient.get(`/barcode/labels/${labelId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 바코드로 라벨 조회
   * GET /api/barcode/labels/barcode/:barcode
   */
  getLabelsByBarcode: async (barcode: string): Promise<ApiResponse<Label[]>> => {
    try {
      const response = await apiClient.get(`/barcode/labels/barcode/${barcode}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 재고 ID로 라벨 조회
   * GET /api/barcode/labels/inventory/:inventoryId
   */
  getLabelsByInventoryId: async (inventoryId: number): Promise<ApiResponse<Label[]>> => {
    try {
      const response = await apiClient.get(`/barcode/labels/inventory/${inventoryId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 등록번호로 라벨 템플릿 조회
   * GET /api/barcode/labeltemplates/registration/:registrationNumber
   */
  getLabelTemplateByRegistrationNumber: async (
    registrationNumber: string
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.get(
        `/barcode/labeltemplates/registration/${registrationNumber}`
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 라벨 프린트 (HTML 컨텐츠)
   * POST /api/barcode/print-label
   * 
   * @param data 프린트 요청 데이터
   * @returns 프린트 결과
   * 
   * @example
   * ```typescript
   * const result = await barcodeApi.printLabel({
   *   htmlContent: '<div>라벨 내용</div>',
   *   printerName: 'HP LaserJet', // 로컬 환경에서만 필요
   *   printCount: 1,
   *   pdfOptions: { width: '50mm', height: '30mm', margin: '0mm' },
   * });
   * ```
   */
  printLabel: async (data: PrintLabelRequest): Promise<ApiResponse<PrintResult>> => {
    try {
      const response = await apiClient.post('/barcode/print-label', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 저장된 라벨 프린트
   * POST /api/barcode/print-saved-label
   * 
   * @param data 프린트 요청 데이터
   * @returns 프린트 결과
   * 
   * @example
   * ```typescript
   * const result = await barcodeApi.printSavedLabel({
   *   labelId: 123,
   *   printerName: 'HP LaserJet', // 로컬 환경에서만 필요
   *   manufactureDate: '2024-01-01',
   *   expiryDate: '2025-01-01',
   *   printCount: 1,
   * });
   * ```
   */
  printSavedLabel: async (
    data: PrintSavedLabelRequest
  ): Promise<ApiResponse<PrintResult & { labelId: number; barcode: string }>> => {
    try {
      const response = await apiClient.post('/barcode/print-saved-label', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 바코드 스캔
   * GET /api/barcode/scan/:barcode
   */
  scanBarcode: async (barcode: string): Promise<ApiResponse<BarcodeInfo>> => {
    try {
      const response = await apiClient.get(`/barcode/scan/${barcode}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 바코드 생성
   * POST /api/barcode/generate-label
   */
  generateBarcode: async (data: {
    itemId: number;
    quantity: number;
    receivedAt?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/barcode/generate-label', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 입고 처리
   * POST /api/barcode/receive
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
    try {
      const response = await apiClient.post('/barcode/receive', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 공장 이동 출고
   * POST /api/barcode/transfer-out
   */
  transferOut: async (data: {
    barcode: string;
    quantity: number;
    toFactoryId: number;
    note?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/barcode/transfer-out', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 공장 이동 입고
   * POST /api/barcode/transfer-in
   */
  transferIn: async (data: {
    barcode: string;
    factoryId: number;
    storageConditionId?: number;
    note?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/barcode/transfer-in', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 출고 처리
   * POST /api/barcode/issue
   */
  issueByBarcode: async (data: {
    barcode: string;
    quantity: number;
    issueType?: 'SHIPPING' | 'PRODUCTION' | 'DISPOSAL' | 'SAMPLE' | 'OTHER';
    note?: string;
    customerName?: string;
    trackingNumber?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await apiClient.post('/barcode/issue', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 배송 처리
   * POST /api/barcode/ship
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
    try {
      const response = await apiClient.post('/barcode/ship', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 바코드 이력 조회
   * GET /api/barcode/history/:barcode
   */
  getBarcodeHistory: async (barcode: string): Promise<ApiResponse<BarcodeHistory>> => {
    try {
      const response = await apiClient.get(`/barcode/history/${barcode}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default barcodeApi;


