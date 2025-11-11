/**
 * 라벨 프린트 API 클라이언트
 * 
 * 사용법:
 * 1. 이 파일을 프론트엔드 프로젝트의 services 폴더에 복사
 * 2. axios 설치: npm install axios
 * 3. 환경 변수 설정: REACT_APP_API_URL=http://localhost:4000/api
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

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
    totalPages?: number;
  };
}

export interface Printer {
  name: string;
  status: string;
  driver: string;
  isDefault: boolean;
}

export type TemplateType = 'large' | 'medium' | 'small' | 'verysmall';

export interface PrintLabelRequest {
  templateType: TemplateType;
  itemId: number;
  manufactureDate: string; // YYYY-MM-DD
  expiryDate: string; // YYYY-MM-DD
  printerName?: string;
  printCount?: number;
  pdfOptions?: {
    width?: string;
    height?: string;
    margin?: string;
  };
  productName?: string;
  storageCondition?: string;
  registrationNumber?: string;
  categoryAndForm?: string;
  ingredients?: string;
  rawMaterials?: string;
  actualWeight?: string;
  saveTemplate?: boolean;
}

export interface PrintLabelResponse {
  templateId: number | null;
  barcode: string;
  printCount: number;
  printerName: string | null;
  filePath: string | null;
  mode: 'local' | 'cloud' | 'unknown';
  printedAt: string | null;
  error: string | null;
}

export interface SaveTemplateRequest {
  labelType: TemplateType;
  itemId?: number;
  itemName?: string;
  storageCondition?: string;
  registrationNumber?: string;
  categoryAndForm?: string;
  ingredients?: string;
  rawMaterials?: string;
  actualWeight?: string;
}

export interface LabelTemplate {
  id: number;
  label_type: TemplateType;
  item_id: number | null;
  item_name: string | null;
  storage_condition: string | null;
  registration_number: string | null;
  category_and_form: string | null;
  ingredients: string | null;
  raw_materials: string | null;
  actual_weight: string | null;
  created_at: string;
  updated_at: string;
}

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 60000, // 60초 타임아웃 (PDF 생성 시간 고려)
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
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
      const { status, data } = error.response;
      const apiError = data as ApiResponse;
      console.error(`API Error [${status}]:`, apiError.message || error.message);
    } else if (error.request) {
      console.error('Network Error: 서버에 연결할 수 없습니다.');
    } else {
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * 라벨 프린트 API 클라이언트
 */
export const labelApi = {
  /**
   * 프린터 목록 조회
   * GET /api/label/printers
   */
  getPrinters: async (): Promise<ApiResponse<Printer[]>> => {
    try {
      const response = await apiClient.get('/label/printers');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 라벨 프린트
   * POST /api/label/print
   * 
   * @example
   * ```typescript
   * const result = await labelApi.printLabel({
   *   templateType: 'large',
   *   itemId: 1,
   *   manufactureDate: '2024-01-01',
   *   expiryDate: '2025-01-01',
   *   printerName: 'HP LaserJet',
   *   printCount: 1,
   * });
   * ```
   */
  printLabel: async (data: PrintLabelRequest): Promise<ApiResponse<PrintLabelResponse>> => {
    try {
      const response = await apiClient.post('/label/print', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 템플릿 저장 (데이터만)
   * POST /api/label/template
   */
  saveTemplate: async (data: SaveTemplateRequest): Promise<ApiResponse<LabelTemplate>> => {
    try {
      const response = await apiClient.post('/label/template', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 템플릿 목록 조회
   * GET /api/label/templates?page=1&limit=50
   */
  getTemplates: async (page: number = 1, limit: number = 50): Promise<ApiResponse<LabelTemplate[]>> => {
    try {
      const response = await apiClient.get('/label/templates', {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * 템플릿 조회
   * GET /api/label/template/:templateId
   */
  getTemplate: async (templateId: number): Promise<ApiResponse<LabelTemplate>> => {
    try {
      const response = await apiClient.get(`/label/template/${templateId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default labelApi;

