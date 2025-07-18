import { message } from 'antd';

/**
 * 字段名映射表，用于将英文字段名转换为中文
 */
const FIELD_NAME_MAP: { [key: string]: string } = {
  'password': '密码',
  'new_password': '新密码',
  'old_password': '当前密码',
  'password_confirm': '确认密码',
  'confirm_password': '确认密码',
  'email': '邮箱',
  'username': '用户名',
  'name': '姓名',
  'first_name': '名',
  'last_name': '姓',
  'description': '描述',
  'base_url': 'API地址',
  'api_key': 'API密钥',
  'total_quota': '总配额',
  'model_group': '模型组',
  'user': '用户',
};

/**
 * 处理API错误响应并显示用户友好的错误消息
 * @param error - Axios错误对象
 * @param defaultMessage - 默认错误消息
 */
export const handleApiError = (error: any, defaultMessage: string = '操作失败') => {
  console.error('API错误:', error);
  
  // 处理字段级验证错误
  if (error.response?.data) {
    const errorData = error.response.data;
    let errorMessages: string[] = [];
    
    // 解析字段级错误
    Object.keys(errorData).forEach(field => {
      // 跳过非错误字段
      if (field === 'status' || field === 'code') return;
      
      const fieldErrors = errorData[field];
      const fieldName = FIELD_NAME_MAP[field] || field;
      
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach(msg => {
          errorMessages.push(`${fieldName}: ${msg}`);
        });
      } else if (typeof fieldErrors === 'string') {
        errorMessages.push(`${fieldName}: ${fieldErrors}`);
      }
    });
    
    // 处理非字段错误
    if (errorData.non_field_errors) {
      if (Array.isArray(errorData.non_field_errors)) {
        errorData.non_field_errors.forEach((msg: string) => {
          errorMessages.push(msg);
        });
      }
    }
    
    // 处理detail错误
    if (errorData.detail && typeof errorData.detail === 'string') {
      errorMessages.push(errorData.detail);
    }
    
    // 显示错误消息
    if (errorMessages.length > 0) {
      errorMessages.forEach(msg => message.error(msg));
      return;
    }
  }
  
  // 如果没有找到特定错误，显示默认消息
  message.error(defaultMessage);
};

/**
 * 专门处理表单验证错误的函数
 * @param error - Axios错误对象
 * @param form - Ant Design表单实例
 * @param defaultMessage - 默认错误消息
 */
export const handleFormError = (error: any, form?: any, defaultMessage: string = '操作失败') => {
  console.error('表单错误:', error);
  
  if (error.response?.data && form) {
    const errorData = error.response.data;
    const formErrors: { [key: string]: { errors: string[] } } = {};
    let hasFieldErrors = false;
    
    // 解析字段级错误并设置到表单
    Object.keys(errorData).forEach(field => {
      // 跳过非字段错误
      if (field === 'non_field_errors' || field === 'detail') return;
      
      const fieldErrors = errorData[field];
      if (Array.isArray(fieldErrors)) {
        formErrors[field] = { errors: fieldErrors };
        hasFieldErrors = true;
      } else if (typeof fieldErrors === 'string') {
        formErrors[field] = { errors: [fieldErrors] };
        hasFieldErrors = true;
      }
    });
    
    // 设置表单字段错误
    if (hasFieldErrors) {
      try {
        form.setFields(Object.keys(formErrors).map(field => ({
          name: field,
          errors: formErrors[field].errors,
        })));
      } catch (error) {
        console.warn('设置表单字段错误失败:', error);
      }
      
      // 显示具体的字段错误消息
      Object.keys(formErrors).forEach(field => {
        const fieldName = FIELD_NAME_MAP[field] || field;
        formErrors[field].errors.forEach(error => {
          message.error(`${fieldName}: ${error}`);
        });
      });
      return;
    }
    
    // 处理非字段错误
    if (errorData.non_field_errors) {
      if (Array.isArray(errorData.non_field_errors)) {
        errorData.non_field_errors.forEach((msg: string) => {
          message.error(msg);
        });
        return;
      }
    }
    
    // 处理detail错误
    if (errorData.detail && typeof errorData.detail === 'string') {
      message.error(errorData.detail);
      return;
    }
  }
  
  // 回退到通用错误处理
  handleApiError(error, defaultMessage);
}; 