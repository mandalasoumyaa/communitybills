import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const expenseService = {
  getCategories: async () => {
    const response = await api.get('/expense-categories');
    return response.data;
  },
  
  getExpenses: async (communityId) => {
    const params = communityId ? { community_id: communityId } : {};
    const response = await api.get('/expenses', { params });
    return response.data;
  },
  
  createExpense: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },
  
  deleteExpense: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },
  
  uploadReceipt: async (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload-receipt', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onUploadProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onUploadProgress(percentCompleted);
        }
      }
    });
    return response.data;
  },
  
  extractOcr: async (fileUrl) => {
    const response = await api.post('/ocr/extract', { fileUrl });
    return response.data;
  },
  
  getAiSuggestions: async (expenseData) => {
    const response = await api.post('/ai/suggestions', expenseData);
    return response.data;
  }
};

export default api;
