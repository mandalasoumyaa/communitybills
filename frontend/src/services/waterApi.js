import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const api = {
  // Water readings CRUD
  getReadings: async (params = {}) => {
    const response = await client.get('/water-readings', { params })
    return response.data
  },
  
  createReading: async (payload) => {
    const response = await client.post('/water-readings', payload)
    return response.data
  },

  updateReading: async (id, currentReading, ratePerLitre = 0.575, waterCost = null) => {
    const payload = {}
    if (currentReading !== undefined) {
      payload.current_reading = currentReading === '' ? null : (currentReading === null ? null : parseFloat(currentReading))
    }
    if (waterCost !== undefined && waterCost !== null) {
      payload.water_cost = waterCost === '' ? null : parseFloat(waterCost)
    }
    const response = await client.put(`/water-readings/${id}`, payload, {
      params: { rate_per_litre: ratePerLitre }
    })
    return response.data
  },

  updateRate: async (month, ratePerLitre) => {
    const response = await client.put('/water-readings/update-rate', null, {
      params: { month, rate_per_litre: ratePerLitre }
    })
    return response.data
  },

  deleteReading: async (id) => {
    const response = await client.delete(`/water-readings/${id}`)
    return response.data
  },

  // OCR Upload
  uploadImage: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post(`${API_BASE_URL}/upload/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // CSV Import
  uploadCSV: async (file, month, ratePerLitre = 0.575) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post(`${API_BASE_URL}/upload/csv`, formData, {
      params: { month, rate_per_litre: ratePerLitre },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  getCSVPreview: async (file, month) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post(`${API_BASE_URL}/upload/csv/preview`, formData, {
      params: { month },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  commitCSVReadings: async (readings, month, ratePerLitre = 0.575) => {
    const response = await client.post('/upload/csv/commit', {
      readings,
      month,
      rate_per_litre: ratePerLitre
    })
    return response.data
  },

  // Excel Import
  uploadExcel: async (file, month, ratePerLitre = 0.575) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post(`${API_BASE_URL}/upload/excel`, formData, {
      params: { month, rate_per_litre: ratePerLitre },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  checkExcelExists: async (month) => {
    const response = await client.get('/upload/excel/exists', { params: { month } })
    return response.data
  },

  getExcelSampleURL: () => {
    return `${API_BASE_URL}/upload/excel/sample`
  },

  getExcelPreview: async (file, month) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await axios.post(`${API_BASE_URL}/upload/excel/preview`, formData, {
      params: { month },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  commitExcelReadings: async (readings, month, ratePerLitre = 0.575) => {
    const response = await client.post('/upload/excel/commit', {
      readings,
      month,
      rate_per_litre: ratePerLitre
    })
    return response.data
  },

  // Calculations & Bills
  calculatePreview: async (payload) => {
    const response = await client.post('/calculate', payload)
    return response.data
  },

  generateBills: async (month, ratePerLitre = 0.575, maintenance = 250.0) => {
    const response = await client.post('/generate-bills', {
      month,
      rate_per_litre: ratePerLitre,
      maintenance
    })
    return response.data
  },

  getBills: async () => {
    const response = await client.get('/bills')
    return response.data
  },

  getBillById: async (id) => {
    const response = await client.get(`/bill/${id}`)
    return response.data
  },

  // Reports
  getMonthlySummary: async (month) => {
    const response = await client.get('/report/month', { params: { month } })
    return response.data
  },

  getYearlySummary: async (year = '2026') => {
    const response = await client.get('/report/year', { params: { year } })
    return response.data
  },

  getCSVExportURL: (month) => {
    return `${API_BASE_URL}/report/export/csv?month=${encodeURIComponent(month)}`
  }
}
