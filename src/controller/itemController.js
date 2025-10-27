/**
 * 품목 관리 컨트롤러
 * - 품목 목록 조회, 생성, 수정, 삭제 기능 제공
 */
const itemService = require('../services/itemService');

/**
 * 모든 품목 목록 조회
 */
exports.index = async (req, res, next) => {
  try {
    const items = await itemService.listItems();
    
    res.json({ 
      ok: true, 
      message: '품목 목록 조회 성공',
      data: items 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 새 품목 생성
 */
exports.create = async (req, res, next) => {
  try {
    console.log('=== 품목 생성 요청 ===');
    console.log('요청 데이터:', JSON.stringify(req.body, null, 2));
    
    // validateItemCreate 미들웨어에서 이미 데이터 검증 및 정규화 완료
    const createdItem = await itemService.createItem(req.body);
    
    console.log('생성된 품목:', JSON.stringify(createdItem, null, 2));
    
    res.status(201).json({ 
      ok: true, 
      message: '품목이 성공적으로 생성되었습니다',
      data: createdItem 
    });
  } catch (error) { 
    console.error('=== 품목 생성 오류 ===');
    console.error(error);
    
    // 중복 코드 에러인 경우 명확한 메시지 반환
    if (error.status === 409) {
      return res.status(409).json({
        ok: false,
        message: error.message,
      });
    }
    
    next(error); 
  }
};

/**
 * ID로 품목 조회
 */
exports.show = async (req, res, next) => {
  try {
    const item = await itemService.getItem(req.params.id);
    
    if (!item) {
      return res.status(404).json({ 
        ok: false, 
        message: '해당 ID의 품목을 찾을 수 없습니다' 
      });
    }
    
    res.json({ 
      ok: true, 
      message: '품목 조회 성공',
      data: item 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ID로 품목 조회 (show와 동일, 라우팅 편의를 위한 별칭)
 */
exports.showById = async (req, res, next) => {
  try {
    const item = await itemService.getItem(req.params.id);
    
    if (!item) {
      return res.status(404).json({ 
        ok: false, 
        message: '해당 ID의 품목을 찾을 수 없습니다' 
      });
    }
    
    res.json({ 
      ok: true, 
      message: '품목 조회 성공',
      data: item 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 품목 코드로 품목 조회
 */
exports.showByCode = async (req, res, next) => {
  try {
    const item = await itemService.getItemByCode(req.params.code);
    
    if (!item) {
      return res.status(404).json({ 
        ok: false, 
        message: '해당 코드의 품목을 찾을 수 없습니다' 
      });
    }
    
    res.json({ 
      ok: true, 
      message: '품목 조회 성공',
      data: item 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 품목 정보 수정
 */
exports.update = async (req, res, next) => {
  try {
    const updatedItem = await itemService.updateItem(req.params.id, req.body);
    
    if (!updatedItem) {
      return res.status(404).json({ 
        ok: false, 
        message: '해당 ID의 품목을 찾을 수 없습니다' 
      });
    }
    
    res.json({ 
      ok: true, 
      message: '품목이 성공적으로 수정되었습니다',
      data: updatedItem 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 품목 삭제
 */
exports.destroy = async (req, res, next) => {
  try {
    const deletedCount = await itemService.deleteItem(req.params.id);
    
    res.json({ 
      ok: true, 
      message: '품목이 성공적으로 삭제되었습니다',
      deleted: deletedCount 
    });
  } catch (error) {
    next(error);
  }
};
