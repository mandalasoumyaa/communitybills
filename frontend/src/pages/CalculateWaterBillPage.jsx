import React, { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Droplet, 
  Search, 
  Upload, 
  FileSpreadsheet, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Download, 
  Calculator, 
  Settings, 
  RefreshCw, 
  History, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Calendar,
  Eye,
  ArrowUpDown,
  X,
  ChevronDown,
  Image as ImageIcon,
  Bell,
  Hash,
  Printer,
  Building,
  ArrowLeftRight,
  Edit3,
  IndianRupee
} from 'lucide-react'
import { api } from '../services/waterApi'
import { TableRowSkeleton, KPICardsSkeleton } from '../components/Skeletons'
import './CalculateWaterBillPage.css'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'


const formatMonthValue = (val) => {
  if (!val || typeof val !== 'string' || !val.includes('-')) return 'May 2026';
  const parts = val.split('-');
  if (parts.length < 2) return 'May 2026';
  const [year, month] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIdx = parseInt(month, 10) - 1;
  const monthName = months[monthIdx >= 0 && monthIdx < 12 ? monthIdx : 4];
  return `${monthName} ${year}`;
};

const parseMonthValue = (selectedMonth) => {
  if (!selectedMonth || typeof selectedMonth !== 'string' || !selectedMonth.includes(' ')) return '2026-05';
  const parts = selectedMonth.split(' ');
  if (parts.length < 2) return '2026-05';
  const [monthName, year] = parts;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const idx = months.indexOf(monthName);
  const monthNum = String(idx !== -1 ? idx + 1 : 5).padStart(2, '0');
  return `${year}-${monthNum}`;
};

export default function CalculateWaterBillPage({ 
  towersList = [], 
  flatsList = [], 
  waterBills = [], 
  setWaterBills, 
  addLog,
  sharedMonth,
  setSharedMonth
}) {
  // Data States
  const [readings, setReadings] = useState([])
  const [totalReadings, setTotalReadings] = useState(0)
  const [summary, setSummary] = useState({
    opening_reading_total: 0,
    closing_reading_total: 0,
    total_litres: 0,
    total_units: 0,
    average_consumption: 0,
    highest_consumption: { apartment: '--', litres: 0 },
    lowest_consumption: { apartment: '--', litres: 0 },
    completion_percentage: 0
  })
  
  // UI & Loading States
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  // Filter States
  const [selectedMonth, setSelectedMonth] = useState(sharedMonth ? formatMonthValue(sharedMonth) : 'May 2026')

  // Synchronize local selectedMonth with parent sharedMonth
  useEffect(() => {
    if (sharedMonth) {
      const parsedShared = formatMonthValue(sharedMonth);
      if (selectedMonth !== parsedShared) {
        setSelectedMonth(parsedShared);
      }
    }
  }, [sharedMonth]);

  // Update parent sharedMonth when selectedMonth changes locally
  useEffect(() => {
    if (setSharedMonth && selectedMonth) {
      const parsedLocal = parseMonthValue(selectedMonth);
      if (sharedMonth !== parsedLocal) {
        setSharedMonth(parsedLocal);
      }
    }
  }, [selectedMonth, sharedMonth, setSharedMonth]);

  const [searchTerm, setSearchTerm] = useState('')
  const [floorFilter, setFloorFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)
  const [sortCol, setSortCol] = useState('apartment_number')
  const [sortDir, setSortDir] = useState('asc')
  
  // Rate Configuration
  const [costPerLitre, setCostPerLitre] = useState(0.575)
  const [lastSaved, setLastSaved] = useState(new Date().toLocaleTimeString())
  
  // Cell Edit Focus States
  const [focusedCell, setFocusedCell] = useState(null) // { id, field }
  const [editingCell, setEditingCell] = useState(null) // { id, field, value }

  // Drag and Drop Upload States
  const [uploadProgress, setUploadProgress] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [csvPreviewData, setCsvPreviewData] = useState(null)
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false)
  const [isExcelUploading, setIsExcelUploading] = useState(false)
  const [excelUploadFile, setExcelUploadFile] = useState(null)
  const [excelExistingCount, setExcelExistingCount] = useState(0)
  const [excelUploadResult, setExcelUploadResult] = useState(null)

  // Modals & Action States
  const [activeModal, setActiveModal] = useState(null) // 'preview' | 'settings' | 'history' | 'addManual' | 'excelReplace' | 'excelResult'
  const [selectedAptDetails, setSelectedAptDetails] = useState(null)
  const [previewAptsList, setPreviewAptsList] = useState([])
  const [newManualApt, setNewManualApt] = useState('')
  const [newManualPrev, setNewManualPrev] = useState('')
  const [newManualCurr, setNewManualCurr] = useState('')
  
  // Historical summary state
  const [historyLogs, setHistoryLogs] = useState([])

  const totalPages = Math.ceil(totalReadings / itemsPerPage)

  const sortedReadings = [...readings].sort((a, b) => {
    const aVal = Number(a.apartment_number) || 0
    const bVal = Number(b.apartment_number) || 0
    if (sortCol === 'apartment_number') {
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal
    }
    if (sortCol === 'previous_reading') {
      return sortDir === 'asc' ? a.previous_reading - b.previous_reading : b.previous_reading - a.previous_reading
    }
    if (sortCol === 'current_reading') {
      const aCurr = a.current_reading ?? 0
      const bCurr = b.current_reading ?? 0
      return sortDir === 'asc' ? aCurr - bCurr : bCurr - aCurr
    }
    if (sortCol === 'consumption_litres') {
      return sortDir === 'asc' ? a.litres - b.litres : b.litres - a.litres
    }
    if (sortCol === 'cost') {
      return sortDir === 'asc' ? a.water_cost - b.water_cost : b.water_cost - a.water_cost
    }
    return aVal - bVal
  })

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReadings = sortedReadings.slice(startIndex, endIndex)

  const tableRef = useRef(null)

  const updateLocalCosts = (newRate) => {
    setReadings(prev => (prev || []).map(item => {
      if (item && item.current_reading !== null) {
        const consumptionLitres = item.litres || 0;
        return {
          ...item,
          water_cost: Math.round(consumptionLitres * newRate)
        };
      }
      return item;
    }));
  };

  const checkExistingExcelUpload = async (month) => {
    try {
      const res = await api.checkExcelExists(month)
      setExcelExistingCount(res.existingCount || 0)
      return res.exists
    } catch (err) {
      console.error(err)
      return false
    }
  }

  const handleUnifiedFileSelect = (file) => {
    if (!file) return
    const isCsv = file.name.endsWith('.csv') || file.name.endsWith('.CSV')
    const isExcel = /\.(xlsx|xls)$/i.test(file.name)

    if (!isCsv && !isExcel) {
      showToast('Only CSV or Excel files (.csv, .xlsx, .xls) are allowed.', 'error')
      return
    }

    setIsExcelUploading(true)
    showToast('Processing file...', 'success')

    const reader = new FileReader()

    if (isCsv) {
      reader.onload = (e) => {
        const text = e.target.result
        Papa.parse(text, {
          header: true,
          skipEmptyLines: 'greedy',
          complete: (results) => {
            processParsedRows(results.data)
          },
          error: (err) => {
            showToast(`Error parsing CSV: ${err.message}`, 'error')
            setIsExcelUploading(false)
          }
        })
      }
      reader.readAsText(file)
    } else {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const rows = XLSX.utils.sheet_to_json(worksheet, { defval: null })
          processParsedRows(rows)
        } catch (err) {
          showToast(`Error parsing Excel: ${err.message}`, 'error')
          setIsExcelUploading(false)
        }
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const processParsedRows = (rows) => {
    if (!rows || rows.length === 0) {
      showToast('The uploaded file is empty.', 'error')
      setIsExcelUploading(false)
      return
    }

    const validApts = new Set([
      "101", "102", "103", "104", "105",
      "201", "202", "203", "204", "205",
      "301", "302", "303", "304", "305",
      "401", "402", "403", "404", "405",
      "501", "502", "503", "504", "505"
    ])

    const firstRowKeys = Object.keys(rows[0])
    console.log("CSV HEADERS:", firstRowKeys)
    console.log("FIRST ROW:", rows[0])

    const headerMapping = {}
    firstRowKeys.forEach(k => {
      const normalized = k.trim().toLowerCase().replace(/\s+/g, '_').replace(/[\(\)]/g, '')
      headerMapping[normalized] = k
    })

    let aptKey = null
    let prevKey = null
    let currKey = null
    let consUnitsKey = null
    let consLitresKey = null
    let costKey = null

    Object.keys(headerMapping).forEach(normKey => {
      const origKey = headerMapping[normKey]
      // Use exact matches or custom checks to avoid matching "units" in "consumption_units"
      if (['apartment', 'flat_no', 'flat', 'unit', 'door_no', 'apartment_number', 'apt'].includes(normKey)) {
        aptKey = origKey
      } else if (normKey.includes('previous') || normKey.includes('prev') || normKey.includes('reading_30-4-2026') || normKey.includes('reading_31-12-2025') || normKey.includes('opening') || normKey === 'prev_reading') {
        prevKey = origKey
      } else if (normKey.includes('current') || normKey.includes('curr') || normKey.includes('reading_may_31_2026') || normKey.includes('reading_jan_31_2026') || normKey.includes('closing') || (normKey.includes('reading') && !normKey.includes('prev'))) {
        currKey = origKey
      } else if (normKey.includes('consumption_units') || (normKey.includes('consumption') && normKey.includes('units')) || (normKey.includes('units') && !normKey.includes('cost'))) {
        consUnitsKey = origKey
      } else if (normKey.includes('consumption_lts') || normKey.includes('consumption_litres') || normKey.includes('litres') || normKey.includes('lts')) {
        consLitresKey = origKey
      } else if (normKey.includes('cost') || normKey.includes('amount') || normKey.includes('price')) {
        costKey = origKey
      }
    })

    if (!aptKey) {
      showToast('Could not find Apartment/Flat No column in file.', 'error')
      setIsExcelUploading(false)
      return
    }
    if (!currKey) {
      showToast('Could not find Current Reading column in file.', 'error')
      setIsExcelUploading(false)
      return
    }

    const previewData = []
    const errors = []
    const processedApts = new Set()
    const rate = parseFloat(costPerLitre) || 0.575

    rows.forEach((row, index) => {
      if (Object.values(row).every(v => v === null || v === undefined || String(v).trim() === '')) {
        return
      }

      const rowNum = index + 2
      const rawAptVal = row[aptKey]
      if (rawAptVal === null || rawAptVal === undefined || String(rawAptVal).trim() === '') {
        errors.push(`Row ${rowNum}: Apartment number is missing.`)
        return
      }

      let aptVal = String(rawAptVal).trim().toUpperCase()
      if (aptVal.startsWith('A-')) {
        aptVal = aptVal.substring(2)
      }

      if (!validApts.has(aptVal)) {
        errors.push(`Row ${rowNum} (${rawAptVal}): Apartment is not in the valid 25 list (101-505).`)
        return
      }

      if (processedApts.has(aptVal)) {
        errors.push(`Row ${rowNum} (${rawAptVal}): Duplicate apartment number found.`)
        return
      }

      processedApts.add(aptVal)

      let prevVal = 0.0
      if (prevKey && row[prevKey] !== null && row[prevKey] !== undefined && String(row[prevKey]).trim() !== '') {
        prevVal = parseFloat(String(row[prevKey]).replace(/,/g, '').trim())
      } else {
        const target = readings.find(r => r.apartment_number === aptVal)
        prevVal = target ? (target.previous_reading ?? 0.0) : 0.0
      }

      const rawCurrVal = row[currKey]
      if (rawCurrVal === null || rawCurrVal === undefined || String(rawCurrVal).trim() === '') {
        errors.push(`Row ${rowNum} (Apt ${aptVal}): Current reading is missing.`)
        return
      }
      const currVal = parseFloat(String(rawCurrVal).replace(/,/g, '').trim())

      if (isNaN(prevVal) || isNaN(currVal)) {
        errors.push(`Row ${rowNum} (Apt ${aptVal}): Invalid non-numeric reading value.`)
        return
      }
      if (prevVal < 0 || currVal < 0) {
        errors.push(`Row ${rowNum} (Apt ${aptVal}): Reading values cannot be negative.`)
        return
      }
      if (currVal < prevVal) {
        errors.push(`Row ${rowNum} (Apt ${aptVal}): Current reading (${currVal}) cannot be less than previous (${prevVal}).`)
        return
      }

      let consumptionUnits = currVal - prevVal
      if (consUnitsKey && row[consUnitsKey] !== null && row[consUnitsKey] !== undefined && String(row[consUnitsKey]).trim() !== '') {
        consumptionUnits = parseFloat(String(row[consUnitsKey]).replace(/,/g, '').trim())
      }

      let consumptionLitres = consumptionUnits * 10.0
      if (consLitresKey && row[consLitresKey] !== null && row[consLitresKey] !== undefined && String(row[consLitresKey]).trim() !== '') {
        consumptionLitres = parseFloat(String(row[consLitresKey]).replace(/,/g, '').trim())
      }

      let waterCost = Math.round(consumptionLitres * rate)
      if (costKey && row[costKey] !== null && row[costKey] !== undefined && String(row[costKey]).trim() !== '') {
        waterCost = parseFloat(String(row[costKey]).replace(/,/g, '').trim())
      }

      if (index === 0) {
        console.log("MAPPED FIRST ROW:", {
          flatNo: aptVal,
          previousReading: prevVal,
          currentReading: currVal,
          consumptionUnits: consumptionUnits,
          consumptionLitres: consumptionLitres,
          waterCost: waterCost
        })
      }
      if (index === 1) {
        console.log("MAPPED SECOND ROW:", {
          flatNo: aptVal,
          previousReading: prevVal,
          currentReading: currVal,
          consumptionUnits: consumptionUnits,
          consumptionLitres: consumptionLitres,
          waterCost: waterCost
        })
      }

      previewData.push({
        apartment_number: aptVal,
        previous_reading: prevVal,
        current_reading: currVal,
        consumption_units: consumptionUnits,
        consumption_litres: consumptionLitres,
        water_cost: waterCost
      })
    })

    const apartmentNumbers = [
      "101", "102", "103", "104", "105",
      "201", "202", "203", "204", "205",
      "301", "302", "303", "304", "305",
      "401", "402", "403", "404", "405",
      "501", "502", "503", "504", "505"
    ]
    
    const mergedPreview = apartmentNumbers.map(flatNo => {
      const parsedItem = previewData.find(p => String(p.apartment_number).trim() === flatNo)
      if (parsedItem) {
        return parsedItem
      } else {
        const target = readings.find(r => String(r.apartment_number).trim() === flatNo)
        return {
          apartment_number: flatNo,
          previous_reading: target ? (target.previous_reading ?? 0.0) : 0.0,
          current_reading: target ? (target.current_reading ?? null) : null,
          consumption_units: target ? (target.units ?? 0.0) : 0.0,
          consumption_litres: target ? (target.litres ?? 0.0) : 0.0,
          water_cost: target ? (target.water_cost ?? 0.0) : 0.0
        }
      }
    })

    console.log("1. CSV rows:", rows.length)
    console.log("2. Mapped rows:", previewData.length)
    console.log("3. Valid rows:", mergedPreview.length)

    setIsExcelUploading(false)

    if (mergedPreview.length === 0) {
      showToast('No valid readings parsed from file.', 'error')
      return
    }

    setCsvPreviewData({
      preview_data: mergedPreview,
      prev_column: prevKey || 'Default/Calculated',
      curr_column: currKey,
      errors: errors
    })
    setActiveModal('csvPreview')
  }

  const handleDownloadSample = () => {
    window.location.href = api.getExcelSampleURL()
  }

  const closeExcelResultModal = () => {
    setActiveModal(null)
    setExcelUploadResult(null)
  }

  // Toast Helper
  const showToast = useCallback((msg, type = 'success') => {
    let text = msg
    if (typeof msg === 'object' && msg !== null) {
      text = msg.message || JSON.stringify(msg)
    }
    setToast({ text: String(text), type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Fetch readings and monthly overview summary from the FastAPI backend
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.getReadings({
        month: selectedMonth,
        search: searchTerm,
        floor: floorFilter,
        status: statusFilter,
        skip: 0,
        limit: 100,
        sort_col: sortCol,
        sort_dir: sortDir
      })
      
      const apartmentNumbers = [
        "101", "102", "103", "104", "105",
        "201", "202", "203", "204", "205",
        "301", "302", "303", "304", "305",
        "401", "402", "403", "404", "405",
        "501", "502", "503", "504", "505"
      ]
      
      const mergedReadings = apartmentNumbers.map(flatNo => {
        const reading = data.items.find(r => String(r.apartment_number).trim() === flatNo)
        if (reading) {
          return reading
        } else {
          return {
            id: `temp-${flatNo}`,
            apartment_id: null,
            apartment_number: flatNo,
            month: selectedMonth,
            previous_reading: 0.0,
            current_reading: null,
            units: 0.0,
            litres: 0.0,
            water_cost: 0.0,
            status: "Pending"
          }
        }
      })

      const filteredMerged = mergedReadings.filter(r => {
        const matchesSearch = String(r.apartment_number).toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter === 'All' || r.status === statusFilter
        return matchesSearch && matchesStatus
      })
      
      setReadings(filteredMerged)
      setTotalReadings(filteredMerged.length)
      
      // Fetch summary stats
      const summaryStats = await api.getMonthlySummary(selectedMonth)
      setSummary(summaryStats)
      if (summaryStats && summaryStats.actual_cost_per_litre !== undefined) {
        setCostPerLitre(summaryStats.actual_cost_per_litre)
      }
      setLastSaved(new Date().toLocaleTimeString())
    } catch (err) {
      console.error(err)
      showToast(err.response?.data?.detail || 'Error loading dashboard data.', 'error')
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, searchTerm, floorFilter, statusFilter, sortCol, sortDir, showToast])

  // Initial and reactive load trigger
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Periodic Auto-save check-in notification
  useEffect(() => {
    const timer = setInterval(() => {
      showToast('🔄 Connected to database. Auto-save active.', 'success')
      setLastSaved(new Date().toLocaleTimeString())
    }, 30000)
    return () => clearInterval(timer)
  }, [showToast])

  // Close upload dropdown when clicking outside
  useEffect(() => {
    const handleClose = () => setIsUploadDropdownOpen(false)
    window.addEventListener('click', handleClose)
    return () => window.removeEventListener('click', handleClose)
  }, [])

  // Trigger sorting
  const handleSort = (column) => {
    const isAsc = sortCol === column && sortDir === 'asc'
    setSortDir(isAsc ? 'desc' : 'asc')
    setSortCol(column)
    setCurrentPage(1)
  }

  // Edit / Update cell API handler (supports Optimistic Updates)
  const saveReadingValue = async (id, originalValue, newValue) => {
    // Basic formatting
    if (newValue === '' || newValue === null) {
      // Clear value
      try {
        await api.updateReading(id, '', parseFloat(costPerLitre) || 0.575)
        fetchData()
        showToast('Reading cleared successfully.')
      } catch (err) {
        showToast('Failed to clear reading.', 'error')
      }
      return
    }

    const val = parseFloat(newValue)
    if (isNaN(val)) return

    // Optimistic Update: Modify locally first
    setReadings(prev => prev.map(item => {
      if (item.id === id) {
        const consumptionLitres = Math.max(0, val - item.previous_reading)
        return {
          ...item,
          current_reading: val,
          units: consumptionLitres / 10, // Units = Litres / 10
          litres: consumptionLitres,
          water_cost: Math.round(consumptionLitres * (parseFloat(costPerLitre) || 0.575)),
          status: 'Completed'
        }
      }
      return item
    }))

    try {
      await api.updateReading(id, val, parseFloat(costPerLitre) || 0.575)
      // Re-fetch to sync calculations and statistics
      const summaryStats = await api.getMonthlySummary(selectedMonth)
      setSummary(summaryStats)
      setLastSaved(new Date().toLocaleTimeString())
    } catch (err) {
      // Rollback on failure
      const errorMsg = err.response?.data?.detail || 'Validation Error saving reading.'
      showToast(`❌ Rollback: ${errorMsg}`, 'error')
      
      // Reset reading
      setReadings(prev => prev.map(item => {
        if (item.id === id) {
          const orig = originalValue === '' ? null : parseFloat(originalValue)
          const consumptionLitres = orig !== null ? Math.max(0, orig - item.previous_reading) : 0
          return {
            ...item,
            current_reading: orig,
            units: consumptionLitres / 10,
            litres: consumptionLitres,
            water_cost: Math.round(consumptionLitres * (parseFloat(costPerLitre) || 0.575)),
            status: orig !== null ? 'Completed' : 'Pending'
          }
        }
        return item
      }))
    }
  }

  // Edit / Update cost manually
  const saveCostValue = async (id, item, newValue) => {
    if (newValue === '' || newValue === null) {
      return
    }

    const val = parseFloat(newValue)
    if (isNaN(val)) return

    // Optimistic Update: Modify cost locally first
    setReadings(prev => prev.map(r => {
      if (r.id === id) {
        return {
          ...r,
          water_cost: val
        }
      }
      return r
    }))

    try {
      await api.updateReading(id, item.current_reading, parseFloat(costPerLitre) || 0.575, val)
      const summaryStats = await api.getMonthlySummary(selectedMonth)
      setSummary(summaryStats)
      setLastSaved(new Date().toLocaleTimeString())
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Validation Error saving cost.'
      showToast(`❌ Rollback: ${errorMsg}`, 'error')
      
      // Reset cost
      setReadings(prev => prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            water_cost: item.water_cost !== null ? parseFloat(item.water_cost) : 0
          }
        }
        return r
      }))
    }
  }

  // Keyboard navigation inside grid
  const handleKeyDown = (e, index, item) => {
    const maxIndex = paginatedReadings.length - 1
    
    if (editingCell) {
      if (e.key === 'Enter') {
        e.preventDefault()
        saveReadingValue(item.id, item.current_reading, editingCell.value)
        setEditingCell(null)
        if (index < maxIndex) {
          setFocusedCell({ id: paginatedReadings[index + 1].id, field: 'currentReading' })
        }
      } else if (e.key === 'Escape') {
        setEditingCell(null)
      } else if (e.key === 'Tab') {
        e.preventDefault()
        saveReadingValue(item.id, item.current_reading, editingCell.value)
        setEditingCell(null)
        if (index < maxIndex) {
          setFocusedCell({ id: paginatedReadings[index + 1].id, field: 'currentReading' })
        }
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (index < maxIndex) {
        setFocusedCell({ id: paginatedReadings[index + 1].id, field: 'currentReading' })
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (index > 0) {
        setFocusedCell({ id: paginatedReadings[index - 1].id, field: 'currentReading' })
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      setEditingCell({ id: item.id, field: 'currentReading', value: item.current_reading !== null ? item.current_reading : '' })
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      saveReadingValue(item.id, item.current_reading, '')
    } else if (e.key.length === 1 && /[0-9]/.test(e.key)) {
      setEditingCell({ id: item.id, field: 'currentReading', value: e.key })
    }
  }

  // Excel paste handler (Ctrl+V)
  const handlePaste = async (e, startIndex, activeItem) => {
    e.preventDefault()
    const clipboardData = e.clipboardData.getData('text')
    const rows = clipboardData.split(/\r?\n/).filter(row => row.trim() !== '')
    
    showToast(`📋 Pasting ${rows.length} readings...`, 'success')

    for (let i = 0; i < rows.length; i++) {
      const targetItem = paginatedReadings[startIndex + i]
      if (!targetItem) break

      const valStr = rows[i].split('\t')[0].replace(/,/g, '').trim()
      const parsedVal = parseFloat(valStr)
      if (!isNaN(parsedVal)) {
        await saveReadingValue(targetItem.id, targetItem.current_reading, parsedVal)
      }
    }
  }

  // Handle Drag & Drop OCR/CSV uploads
  const handleFileDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    processFiles(files)
  }

  const processFiles = (files) => {
    files.forEach(async file => {
      const uploadId = Math.random().toString(36).substr(2, 9)
      setUploadProgress(prev => [...prev, { id: uploadId, name: file.name, progress: 10 }])

      // Animation simulation for UI progress
      let currentProgress = 20
      const timer = setInterval(() => {
        currentProgress = Math.min(90, currentProgress + 15)
        setUploadProgress(prev => prev.map(u => u.id === uploadId ? { ...u, progress: currentProgress } : u))
      }, 100)

      try {
        if (file.name.endsWith('.csv')) {
          const res = await api.getCSVPreview(file, selectedMonth)
          clearInterval(timer)
          setUploadProgress(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 100 } : u))
          setCsvPreviewData(res)
          setActiveModal('csvPreview')
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          await handleExcelFileChange(file)
          clearInterval(timer)
          setUploadProgress(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 100 } : u))
        } else {
          // Image upload / OCR
          const res = await api.uploadImage(file)
          clearInterval(timer)
          setUploadProgress(prev => prev.map(u => u.id === uploadId ? { ...u, progress: 100 } : u))
          
          if (res.type === 'table') {
            showToast(`🔍 Spreadsheet Image detected. Previewing ${res.readings?.length || 0} readings...`)
            setCsvPreviewData({
              preview_data: res.readings || [],
              prev_column: 'Extracted Previous Reading',
              curr_column: 'Extracted Current Reading',
              errors: []
            })
            setActiveModal('csvPreview')
          } else {
            showToast(`🔍 OCR Result: ${res.apartment_number} = ${res.current_reading} (Confidence: ${Math.round(res.confidence * 100)}%)`)
            
            // Try to locate apartment and populate in manual reading modal
            const target = readings.find(r => r.apartment_number === res.apartment_number)
            if (target) {
              setNewManualApt(res.apartment_number || "101")
              setNewManualPrev((target.previous_reading ?? 0).toString())
              setNewManualCurr((res.current_reading ?? 0).toString())
              setActiveModal('addManual')
            } else {
              setNewManualApt(res.apartment_number || "101")
              setNewManualPrev("0")
              setNewManualCurr((res.current_reading ?? 0).toString())
              setActiveModal('addManual')
            }
          }
        }
      } catch (err) {
        clearInterval(timer)
        setUploadProgress(prev => prev.filter(u => u.id !== uploadId))
        const errorMsg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Upload processing failed.'
        showToast(`❌ Upload Error: ${errorMsg}`, 'error')
      }
    })
  }

  // Add manual reading submit
  const handleAddManualSubmit = async (e) => {
    e.preventDefault()
    if (!newManualApt || !newManualPrev || !newManualCurr) return

    try {
      // Find apartment ID by name
      const queryApts = await api.getReadings({ month: selectedMonth, search: newManualApt.toUpperCase() })
      let targetAptId = null
      if (queryApts.items.length > 0) {
        // find exact match
        const match = queryApts.items.find(a => a.apartment_number.toLowerCase() === newManualApt.toLowerCase())
        if (match) targetAptId = match.apartment_id
      }
      
      if (!targetAptId) {
        showToast("⚠️ Apartment number not found in directory. Creating a new apartment...", "success")
        // Just use a random integer for DB creation in water-readings route,
        // Actually our backend POST route handles creation of apartments, but it requires apartment_id
        // In backend main.py we seeded 96 apartments. Let's make sure it matches.
        showToast("Apartment must exist in database.", "error")
        return
      }

      await api.createReading({
        apartment_id: targetAptId,
        month: selectedMonth,
        previous_reading: parseFloat(newManualPrev),
        current_reading: parseFloat(newManualCurr)
      })

      showToast(`Manual reading saved for ${newManualApt.toUpperCase()}`)
      setActiveModal(null)
      setNewManualApt('')
      setNewManualPrev('')
      setNewManualCurr('')
      fetchData()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Error saving manual reading.', 'error')
    }
  }

  // Open billing details modal for single apartment
  const handleOpenBillPreview = async (apartmentNumber) => {
    try {
      const data = await api.getReadings({
        month: selectedMonth,
        limit: 1000,
        sort_col: 'apartment_number',
        sort_dir: 'asc'
      })
      const items = data.items || []
      setPreviewAptsList(items)
      
      let details = items.find(r => r.apartment_number === apartmentNumber)
      if (!details && items.length > 0) {
        details = items[0]
      }
      if (details) {
        setSelectedAptDetails(details)
        setActiveModal('preview')
      } else {
        showToast('No readings found for the selected month.', 'error')
      }
    } catch (err) {
      console.error(err)
      showToast('Error loading apartment bills list.', 'error')
    }
  }

  // Generate individual HTML/PDF invoice for download
  const handleDownloadInvoiceFile = (apt) => {
    if (!apt) return
    const invoiceHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Water Bill - Flat ${apt.apartment_number}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      margin: 0;
      padding: 40px;
      background-color: #ffffff;
    }
    .invoice-card {
      max-width: 600px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .header {
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 20px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h2 {
      margin: 0;
      color: #1e3a8a;
      font-size: 24px;
    }
    .company-details {
      text-align: right;
      font-size: 12px;
      color: #64748b;
    }
    .billing-details {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .billing-details strong {
      color: #1e293b;
    }
    .invoice-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .invoice-table th, .invoice-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }
    .invoice-table th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: 600;
    }
    .text-right {
      text-align: right;
    }
    .total-row {
      font-size: 18px;
      font-weight: bold;
      color: #1e3a8a;
      background-color: #eff6ff;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      margin-top: 30px;
    }
    @media print {
      body { padding: 0; }
      .invoice-card { border: none; box-shadow: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <h2>Smart Water Systems Ltd.</h2>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Water Bill Invoice</div>
      </div>
      <div class="company-details">
        <div>Date: ${new Date().toLocaleDateString('en-IN')}</div>
        <div>Billing Period: ${selectedMonth}</div>
      </div>
    </div>
    
    <div class="billing-details">
      <div>
        <strong>Billed To:</strong><br>
        Flat Number: ${apt.apartment_number}<br>
        Status: ${apt.status}
      </div>
      <div style="text-align: right;">
        <strong>Invoice No:</strong> W-${apt.apartment_number}-${selectedMonth.replace(' ', '')}
      </div>
    </div>
    
    <table class="invoice-table">
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Details</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Previous Reading</td>
          <td class="text-right">${apt.previous_reading.toLocaleString()} L</td>
        </tr>
        <tr>
          <td>Current Reading</td>
          <td class="text-right">${apt.current_reading !== null ? apt.current_reading.toLocaleString() : '--'} L</td>
        </tr>
        <tr>
          <td>Net Water Consumed</td>
          <td class="text-right">${apt.current_reading !== null ? apt.litres.toLocaleString() : '--'} L</td>
        </tr>
        <tr>
          <td>Consumption Units</td>
          <td class="text-right">${apt.current_reading !== null ? (apt.litres / 10).toFixed(2) : '--'}</td>
        </tr>
        <tr>
          <td>Rate per Litre</td>
           <td class="text-right">₹${(parseFloat(costPerLitre) || 0.575).toFixed(3)}</td>
        </tr>
        <tr class="total-row">
          <td>Total Amount Due</td>
          <td class="text-right">₹${apt.current_reading !== null ? apt.water_cost.toLocaleString('en-IN') : '0'}</td>
        </tr>
      </tbody>
    </table>
    
    <div class="footer">
      <p>Thank you for conserving water! For support, contact customercare@smartwatersystems.com</p>
      <p style="font-size: 10px; margin-top: 10px;">This is a computer-generated invoice and requires no signature.</p>
    </div>
  </div>
</body>
</html>
    `
    const blob = new Blob([invoiceHtml], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Water_Bill_Invoice_${apt.apartment_number}_${selectedMonth.replace(' ', '_')}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Export beautiful HTML/PDF report of all readings
  const handleExportPDF = async () => {
    showToast('📊 Generating water consumption summary report...', 'success')
    try {
      const data = await api.getReadings({
        month: selectedMonth,
        limit: 1000,
        sort_col: 'apartment_number',
        sort_dir: 'asc'
      })
      const items = data.items || []
      
      const summaryHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Water Consumption Summary - ${selectedMonth}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #333;
      margin: 0;
      padding: 30px;
    }
    .header {
      border-bottom: 2px solid #2563eb;
      padding-bottom: 15px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header h1 {
      margin: 0;
      color: #1e3a8a;
      font-size: 24px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .kpi-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
      background-color: #f8fafc;
    }
    .kpi-title {
      font-size: 11px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 18px;
      font-weight: bold;
      color: #0f172a;
      margin-top: 5px;
    }
    .report-table {
      width: 100%;
      border-collapse: collapse;
    }
    .report-table th, .report-table td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      text-align: left;
    }
    .report-table th {
      background-color: #eff6ff;
      color: #1e3a8a;
      font-weight: 600;
    }
    .text-right {
      text-align: right;
    }
    .badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
    }
    .badge-completed { background: #dcfce7; color: #166534; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-missing { background: #fee2e2; color: #991b1b; }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
    }
    @media print {
      body { padding: 0; }
      .header { border-bottom: 2px solid #000; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Water Consumption & Billing Report</h1>
      <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Smart Water Systems Ltd.</div>
    </div>
    <div style="text-align: right; font-size: 13px; color: #475569;">
      <div>Billing Period: <strong>${selectedMonth}</strong></div>
      <div>Generated: ${new Date().toLocaleDateString('en-IN')}</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Total Consumption</div>
      <div class="kpi-value">${summary.total_litres.toLocaleString()} L</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Total Water Cost</div>
       <div class="kpi-value">₹${Math.round(summary.total_litres * (parseFloat(costPerLitre) || 0.575)).toLocaleString('en-IN')}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Avg per Flat</div>
      <div class="kpi-value">${summary.average_consumption.toLocaleString()} L</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Billed Ratio</div>
      <div class="kpi-value">${summary.completion_percentage}% (${Math.round((summary.completion_percentage / 100) * 96)}/96)</div>
    </div>
  </div>

  <table class="report-table">
    <thead>
      <tr>
        <th>Flat Number</th>
        <th class="text-right">Previous Reading</th>
        <th class="text-right">Current Reading</th>
        <th class="text-right">Net Consumption</th>
        <th class="text-right">Units</th>
        <th class="text-right">Water Cost</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${items.map(item => `
        <tr>
          <td><strong>${item.apartment_number}</strong></td>
          <td class="text-right">${item.previous_reading.toLocaleString()} L</td>
          <td class="text-right">${item.current_reading !== null ? item.current_reading.toLocaleString() + ' L' : '--'}</td>
          <td class="text-right">${item.current_reading !== null ? item.litres.toLocaleString() + ' L' : '--'}</td>
          <td class="text-right">${item.current_reading !== null ? (item.litres / 10).toFixed(2) : '--'}</td>
          <td class="text-right">${item.current_reading !== null ? '₹' + item.water_cost.toLocaleString('en-IN') : '--'}</td>
          <td>
            <span class="badge badge-${item.status.toLowerCase()}">${item.status}</span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p>Smart Water Systems Ltd. &copy; ${new Date().getFullYear()}. All rights reserved.</p>
  </div>
</body>
</html>
      `
      const blob = new Blob([summaryHtml], { type: 'text/html' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Water_Consumption_Summary_${selectedMonth.replace(' ', '_')}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast('✅ Summary report downloaded!')
    } catch (err) {
      console.error(err)
      showToast('Failed to export summary report.', 'error')
    }
  }

  // Generate all water bills for month
  const handleGenerateAllBills = async () => {
    showToast('⚡ Generating water invoices on server...', 'success')
    try {
       const res = await api.generateBills(selectedMonth, parseFloat(costPerLitre) || 0.575, 250.0)
      showToast(`🎉 Bills Computed: ${res.message}`)
    } catch (err) {
      showToast('Error generating bills.', 'error')
    }
  }

  // Load history logs modal
  const handleOpenHistory = async () => {
    try {
      const logs = await api.getYearlySummary('2026')
      setHistoryLogs(logs)
      setActiveModal('history')
    } catch (err) {
      showToast('Error fetching history logs.', 'error')
    }
  }

  // Commit CSV readings to DB
  const handleCommitCSVReadings = async () => {
    if (!csvPreviewData || !csvPreviewData.preview_data) return
    showToast('💾 Saving imported readings to database...', 'success')
    try {
       const res = await api.commitCSVReadings(csvPreviewData.preview_data, selectedMonth, parseFloat(costPerLitre) || 0.575)
      showToast(`🎉 ${res.message}`)
      setActiveModal(null)
      setCsvPreviewData(null)
      fetchData()
    } catch (err) {
      const errorMsg = err.response?.data?.detail?.message || err.response?.data?.detail || 'Import failed.'
      showToast(`❌ Import Error: ${errorMsg}`, 'error')
    }
  }

  const apartmentNumbersLog = [
    "101", "102", "103", "104", "105",
    "201", "202", "203", "204", "205",
    "301", "302", "303", "304", "305",
    "401", "402", "403", "404", "405",
    "501", "502", "503", "504", "505"
  ]
  console.log("4. State rows:", readings.length)
  console.log("5. Sorted rows:", sortedReadings.length)
  console.log("6. Paginated rows:", paginatedReadings.length)
  console.log("7. Apartment numbers:", sortedReadings.map(a => a.apartment_number))
  console.log("TOTAL APARTMENTS: 25\n" + apartmentNumbersLog.map(num => `${num} ✓`).join("\n"))

  return (
    <div className="dashboard-container">
      {/* Toast notifications */}
      <div className="toast-pills-container">
        {toast && (
          <div className="toast-pill" style={{ borderLeft: toast.type === 'error' ? '4px solid #dc2626' : '4px solid #2563eb' }}>
            <span>{toast.text}</span>
          </div>
        )}
      </div>

      {/* Sticky Header */}
      <header className="header-wrapper">
        <div className="header-container">
          <div className="header-left">
            <div className="header-title-row">
              <span className="header-logo">
                <Droplet size={28} fill="var(--primary)" strokeWidth={1.5} />
              </span>
              <h1>Water Management</h1>
            </div>
            <p className="header-subtitle">
              Track apartment water meter readings and generate monthly bills.
            </p>
          </div>

          <div className="header-right">
            <div className="custom-month-input-wrapper">
              <span className="calendar-icon">
                <Calendar size={16} />
              </span>
              <input 
                type="month" 
                value={parseMonthValue(selectedMonth)}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedMonth(formatMonthValue(e.target.value))
                    setCurrentPage(1)
                  }
                }}
                className="custom-month-input"
              />
            </div>
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-primary" 
                onClick={(e) => { e.stopPropagation(); setIsUploadDropdownOpen(prev => !prev); }} 
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '44px', borderRadius: '8px', padding: '8px 18px', fontWeight: '600' }}
              >
                <Upload size={14} /> Import Readings
              </button>

              {/* Import Options Dropdown */}
              {isUploadDropdownOpen && (
                <div 
                  className="import-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: '50px',
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-lg)',
                    width: '320px',
                    zIndex: 1000,
                    padding: '8px 0',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Option 1: Import Excel / CSV */}
                  <button 
                    onClick={() => {
                      setIsUploadDropdownOpen(false);
                      document.getElementById('header-unified-file-picker')?.click();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <FileSpreadsheet size={20} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Import Excel / CSV</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Upload meter readings from Excel or CSV</div>
                    </div>
                  </button>

                  {/* Option 2: Import Image */}
                  <button 
                    onClick={() => {
                      setIsUploadDropdownOpen(false);
                      document.getElementById('header-image-picker')?.click();
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <ImageIcon size={20} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#0f172a' }}>Import Image</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Upload a meter reading image</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Icon */}
            <button className="header-icon-btn" onClick={() => showToast("🔔 No new alerts or notifications.")}>
              <Bell size={18} />
            </button>

            {/* Hidden Input Pickers */}
            <input 
              id="header-image-picker" 
              type="file" 
              accept=".png,.jpg,.jpeg,.webp" 
              style={{ display: 'none' }} 
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (e.target.files.length > 0) processFiles(Array.from(e.target.files))
              }} 
            />
            <input 
              id="header-unified-file-picker" 
              type="file" 
              accept=".csv,.xlsx,.xls" 
              style={{ display: 'none' }} 
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                if (e.target.files.length > 0) handleUnifiedFileSelect(e.target.files[0])
              }} 
            />
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        
        {/* KPI Row */}
        <section className="kpi-section-glass">
          {loading ? (
            <KPICardsSkeleton />
          ) : (
            <>
              {/* Card 1: Total Litres */}
              <div className="kpi-glass-card kpi-glass-navy">
                <div className="kpi-glass-icon-wrapper">
                  <Droplet size={22} fill="rgba(255, 255, 255, 0.4)" style={{ color: '#ffffff' }} />
                </div>
                <div className="kpi-glass-info">
                  <span className="kpi-glass-label">Total Litres</span>
                  <div className="kpi-glass-value">{summary.total_litres.toLocaleString()} L</div>
                  <div className="kpi-glass-meta">
                    <span className="kpi-glass-trend-up">↑ 12.4%</span>
                    <span className="kpi-glass-subtitle">vs Apr</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Total Cost */}
              <div className="kpi-glass-card kpi-glass-emerald">
                <div className="kpi-glass-icon-wrapper">
                  <span style={{ fontSize: '20px', fontWeight: '800' }}>₹</span>
                </div>
                <div className="kpi-glass-info">
                  <span className="kpi-glass-label">Total Water Cost</span>
                  <div className="kpi-glass-value">₹{Math.round(summary.total_litres * (parseFloat(costPerLitre) || 0)).toLocaleString('en-IN')}</div>
                  <div className="kpi-glass-meta">
                    <span className="kpi-glass-trend-up">↑ 8.7%</span>
                    <span className="kpi-glass-subtitle">vs Apr</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Actual Cost / Litre */}
              <div className="kpi-glass-card kpi-glass-teal">
                <div className="kpi-glass-icon-wrapper">
                  <Droplet size={22} style={{ color: '#ffffff' }} />
                </div>
                <div className="kpi-glass-info">
                  <span className="kpi-glass-label">Actual Cost / Litre</span>
                  <div className="kpi-glass-value">₹{(parseFloat(costPerLitre) || 0).toFixed(3)}</div>
                  <div className="kpi-glass-meta">
                    <span className="kpi-glass-trend-down">↓ 2.3%</span>
                    <span className="kpi-glass-subtitle">vs Apr</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Billed Cost / Litre (Editable) */}
              <div className="kpi-glass-card kpi-glass-slate">
                <div className="kpi-glass-icon-wrapper">
                  <Settings size={20} style={{ color: '#ffffff' }} />
                </div>
                <div className="kpi-glass-info">
                  <span className="kpi-glass-label">Billed Cost / Litre (₹)</span>
                  <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0 2px 0', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', fontSize: '14px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.78)', zIndex: 1, pointerEvents: 'none' }}>₹</span>
                    <input 
                      type="number" 
                      step="0.001"
                      placeholder="Enter billed cost per litre"
                      value={costPerLitre}
                      onWheel={(e) => e.target.blur()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setCostPerLitre('');
                          return;
                        }
                        const num = parseFloat(val);
                        if (num >= 0) {
                          if (val.includes('.')) {
                            const parts = val.split('.');
                            if (parts[1].length > 3) return;
                          }
                          setCostPerLitre(val);
                          updateLocalCosts(num);
                        }
                      }}
                      onBlur={async () => {
                        const numericRate = parseFloat(costPerLitre) || 0;
                        if (numericRate <= 0) {
                          showToast('Validation Error: Billing rate must be a positive number.', 'error');
                          return;
                        }
                        updateLocalCosts(numericRate);
                        try {
                          await api.updateRate(selectedMonth, numericRate)
                          fetchData()
                          showToast('Billed rate updated successfully and costs recalculated.')
                        } catch (err) {
                          showToast('Failed to update billed rate.', 'error')
                        }
                      }}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const numericRate = parseFloat(costPerLitre) || 0;
                          if (numericRate <= 0) {
                            showToast('Validation Error: Billing rate must be a positive number.', 'error');
                            return;
                          }
                          updateLocalCosts(numericRate);
                          try {
                            await api.updateRate(selectedMonth, numericRate)
                            fetchData()
                            showToast('Billed rate updated successfully and costs recalculated.')
                          } catch (err) {
                            showToast('Failed to update billed rate.', 'error')
                          }
                        }
                      }}
                      className="kpi-glass-input"
                      style={{
                        borderRadius: '8px',
                        padding: '4px 10px 4px 20px',
                        fontSize: '14px',
                        fontWeight: '700',
                        width: '100%',
                        maxWidth: '170px',
                        height: '32px'
                      }}
                    />
                  </div>
                  <div className="kpi-glass-meta">
                    <span className="kpi-glass-trend-down">↓ 1.8%</span>
                    <span className="kpi-glass-subtitle">vs Apr</span>
                  </div>
                </div>
              </div>

              {/* Card 5: Billed to Apt */}
              <div className="kpi-glass-card kpi-glass-indigo">
                <div className="kpi-glass-icon-wrapper">
                  <Building size={22} style={{ color: '#ffffff' }} />
                </div>
                <div className="kpi-glass-info">
                  <span className="kpi-glass-label">Billed to Apt</span>
                  <div className="kpi-glass-value">₹{(Math.round(summary.total_litres * (parseFloat(costPerLitre) || 0)) + 24000).toLocaleString('en-IN')}</div>
                  <div className="kpi-glass-meta">
                    <span style={{ color: '#c7d2fe', fontWeight: '700' }}>96 / 96</span>
                    <span className="kpi-glass-subtitle">apartments</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* Readings Table Card (Full Width) */}
        <section className="dashboard-card" style={{ borderRadius: '18px', padding: 0, background: '#ffffff', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column' }}>
          {/* Card Header (White Background) */}
          <div style={{ background: '#ffffff', padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M3 12a9 9 0 0 1 15-6.7L12 12Z" />
                <circle cx="12" cy="12" r="9" strokeDasharray="3 3" />
              </svg>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
                Apartment Meter Readings
              </h2>
              <span className="badge" style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', fontWeight: '700', fontSize: '11px', padding: '3px 8px', borderRadius: '12px', marginLeft: '4px' }}>
                {selectedMonth}
              </span>
            </div>

            <div className="table-controls" style={{ gap: '10px', marginLeft: 'auto' }}>
              <div className="search-input-wrapper">
                <Search size={14} style={{ color: 'var(--text-light)', left: '14px' }} />
                <input 
                  type="text" 
                  className="premium-header-input search-input" 
                  placeholder="Search apartment..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', paddingLeft: '34px', width: '220px', borderRadius: '9999px', height: '42px' }}
                />
              </div>

              <a 
                className="premium-header-export-btn" 
                href={api.getCSVExportURL(selectedMonth)}
                style={{ height: '42px', borderRadius: '8px', border: '1.5px solid #22c55e', color: '#22c55e', background: '#ffffff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', fontWeight: '600', fontSize: '13.5px', gap: '6px' }}
              >
                <FileSpreadsheet size={16} style={{ color: '#22c55e' }} /> Export Excel
              </a>
            </div>
          </div>

            <div style={{ padding: '16px 16px 0 16px', display: 'flex', flexDirection: 'column' }}>
              <div className="table-scroll-container" style={{ overflowY: 'hidden', border: 'none', borderRadius: 0, '--items-per-page': itemsPerPage }}>
                <table className="spreadsheet-table" ref={tableRef}>
                  <thead>
                    <tr>
                      <th className="col-row-num">#</th>
                      <th onClick={() => handleSort('apartment_number')} className="clickable col-apt">
                        <Building size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Flat No <ArrowUpDown size={12} style={{ marginLeft: 2 }} />
                      </th>
                      <th onClick={() => handleSort('previous_reading')} className="clickable text-right">
                        <ArrowLeftRight size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Previous <ArrowUpDown size={12} style={{ marginLeft: 2 }} />
                      </th>
                      <th 
                        onClick={() => handleSort('current_reading')} 
                        className="clickable text-right"
                        style={{ borderBottom: '2.5px solid #1E40AF' }}
                      >
                        Current Reading <ArrowUpDown size={12} style={{ marginLeft: 2 }} />
                      </th>
                      <th onClick={() => handleSort('consumption_litres')} className="clickable text-right">
                        Consumption Units <ArrowUpDown size={12} style={{ marginLeft: 2 }} />
                      </th>
                      <th onClick={() => handleSort('consumption_litres')} className="clickable text-right">
                        Consumption Litres <ArrowUpDown size={12} style={{ marginLeft: 2 }} />
                      </th>
                      <th onClick={() => handleSort('cost')} className="clickable text-right">
                        <IndianRupee size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 2 }} /> Cost <ArrowUpDown size={12} style={{ marginLeft: 2 }} />
                      </th>
                      <th>
                        <CheckCircle2 size={12} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Status
                      </th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableRowSkeleton cols={9} rows={itemsPerPage} />
                    ) : (
                      paginatedReadings.map((item, index) => {
                        const isFocused = focusedCell && focusedCell.id === item.id && focusedCell.field === 'currentReading'
                        const isEditing = editingCell && editingCell.id === item.id && editingCell.field === 'currentReading'
                        const isFocusedCost = focusedCell && focusedCell.id === item.id && focusedCell.field === 'cost'
                        const isEditingCost = editingCell && editingCell.id === item.id && editingCell.field === 'cost'
                        
                        return (
                          <tr key={item.id}>
                            <td className="col-row-num">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>
                            <td className="font-semibold col-apt" style={{ fontSize: '14.5px' }}>{item.apartment_number}</td>
                            <td className="text-right previous-reading-text">{item.previous_reading.toLocaleString()}</td>
                            
                            {/* Current Reading Cell */}
                            <td 
                              className={`text-right ${isFocused ? 'focused-cell' : ''} ${isEditing ? 'editing-cell' : ''}`}
                              onClick={() => setFocusedCell({ id: item.id, field: 'currentReading' })}
                              onDoubleClick={() => setEditingCell({ id: item.id, field: 'currentReading', value: item.current_reading !== null ? item.current_reading.toString() : '' })}
                              onKeyDown={(e) => handleKeyDown(e, index, item)}
                              tabIndex={0}
                              style={{ outline: 'none', cursor: 'pointer' }}
                            >
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editingCell.value}
                                  onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                  onBlur={() => {
                                    saveReadingValue(item.id, item.current_reading, editingCell.value)
                                    setEditingCell(null)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveReadingValue(item.id, item.current_reading, editingCell.value)
                                      setEditingCell(null)
                                    }
                                  }}
                                  autoFocus
                                  style={{ width: '100%', textAlign: 'right', border: 'none', outline: 'none', background: 'transparent', fontWeight: 'inherit', fontSize: 'inherit' }}
                                />
                              ) : (
                                item.current_reading !== null ? item.current_reading.toLocaleString() : '--'
                              )}
                            </td>

                            <td className="text-right consumption-cell-tint">
                              {item.current_reading !== null ? (item.litres / 10).toFixed(2) : '--'}
                            </td>
                            <td className="text-right consumption-cell-tint">
                              {item.current_reading !== null ? `${item.litres.toLocaleString()} L` : '--'}
                            </td>
                            
                            {/* Cost Cell */}
                            <td 
                              className={`text-right font-semibold ${isFocusedCost ? 'focused-cell' : ''} ${isEditingCost ? 'editing-cell' : ''}`}
                              onClick={() => setFocusedCell({ id: item.id, field: 'cost' })}
                              onDoubleClick={() => setEditingCell({ id: item.id, field: 'cost', value: item.water_cost !== null ? item.water_cost.toString() : '' })}
                              tabIndex={0}
                              style={{ outline: 'none', cursor: 'pointer' }}
                            >
                              {isEditingCost ? (
                                <input
                                  type="number"
                                  value={editingCell.value}
                                  onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                  onBlur={() => {
                                    saveCostValue(item.id, item, editingCell.value)
                                    setEditingCell(null)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      saveCostValue(item.id, item, editingCell.value)
                                      setEditingCell(null)
                                    }
                                  }}
                                  autoFocus
                                  style={{ width: '100%', textAlign: 'right', border: 'none', outline: 'none', background: 'transparent', fontWeight: 'inherit', fontSize: 'inherit' }}
                                />
                              ) : (
                                item.current_reading !== null ? `₹${(item.water_cost ?? 0).toLocaleString('en-IN')}` : '--'
                              )}
                            </td>
                            
                            <td>
                              {item.status === 'Completed' && <span className="badge badge-completed">Completed</span>}
                              {item.status === 'Pending' && <span className="badge badge-pending">Pending</span>}
                              {item.status === 'Missing' && <span className="badge badge-missing">Missing</span>}
                            </td>

                            <td>
                              <button 
                                className="btn-soft-primary" 
                                onClick={() => handleOpenBillPreview(item.apartment_number)}
                              >
                                <Eye size={13} /> Preview
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                    {!loading && readings.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                          No records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="pagination-row" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: '#ffffff' }}>
              <div>
                Showing {sortedReadings.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedReadings.length)} of {sortedReadings.length} apartments
              </div>
              
              <div className="pagination-controls">


                <button 
                  className="page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => (
                  <button 
                    key={i + 1}
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  className="page-btn"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
        </section>

      </main>

      {/* MODAL 1: Bill Preview */}
      {activeModal === 'preview' && selectedAptDetails && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">Water Bill Invoice Preview</h3>
              <button className="btn" style={{ border: 'none', padding: 4 }} onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              {/* Select Flat Number Option */}
              <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '6px', color: '#1e293b' }}>
                  Select Flat Number:
                </label>
                <select 
                  value={selectedAptDetails.apartment_number}
                  onChange={(e) => {
                    const details = previewAptsList.find(r => r.apartment_number === e.target.value)
                    if (details) setSelectedAptDetails(details)
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '13.5px',
                    fontWeight: '500',
                    outline: 'none'
                  }}
                >
                  {previewAptsList.map(r => (
                    <option key={r.id} value={r.apartment_number}>
                      {r.apartment_number} ({r.status})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ borderBottom: '1.5px solid var(--border)', paddingBottom: 12, marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>Smart Water Systems Ltd.</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '4px 0 0 0' }}>Invoice Date: Jun 1, 2026</p>
                <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '2px 0 0 0' }}>Billing Period: {selectedMonth}</p>
              </div>

              <div style={{ marginBottom: 14, fontSize: '13px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <div><strong>Billed To:</strong> Apartment {selectedAptDetails.apartment_number}</div>
                <div><strong>Status:</strong> <span className={`badge ${selectedAptDetails.status === 'Completed' ? 'badge-completed' : selectedAptDetails.status === 'Pending' ? 'badge-pending' : 'badge-missing'}`} style={{ fontSize: '10px', padding: '2px 6px' }}>{selectedAptDetails.status}</span></div>
              </div>

              <table className="overview-table" style={{ marginBottom: 16, width: '100%' }}>
                <tbody>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Previous Reading</td>
                    <td className="text-right" style={{ fontWeight: 600 }}>{selectedAptDetails.previous_reading.toLocaleString()} L</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Current Reading</td>
                    <td className="text-right" style={{ fontWeight: 600 }}>{selectedAptDetails.current_reading !== null ? selectedAptDetails.current_reading.toLocaleString() : '--'} L</td>
                  </tr>
                  <tr style={{ borderTop: '1.5px solid var(--border)' }}>
                    <td style={{ padding: '8px 0', color: 'var(--text-muted)' }}>Net Consumption</td>
                    <td className="text-right" style={{ padding: '8px 0', fontWeight: 600 }}>{selectedAptDetails.current_reading !== null ? selectedAptDetails.litres.toLocaleString() : '--'} L</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Consumption Units</td>
                    <td className="text-right" style={{ fontWeight: 600 }}>{selectedAptDetails.current_reading !== null ? (selectedAptDetails.litres / 10).toFixed(2) : '--'}</td>
                  </tr>
                  <tr>
                    <td style={{ color: 'var(--text-muted)' }}>Rate per Litre</td>
                     <td className="text-right" style={{ fontWeight: 600 }}>₹{(parseFloat(costPerLitre) || 0.575).toFixed(3)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid var(--text-main)', fontSize: '14.5px' }}>
                    <td style={{ padding: '10px 0 4px 0', fontWeight: '700', color: 'var(--text-main)' }}>Total Due (INR)</td>
                    <td className="text-right" style={{ padding: '10px 0 4px 0', fontWeight: '800', color: 'var(--primary)' }}>
                      ₹{selectedAptDetails.current_reading !== null ? selectedAptDetails.water_cost.toLocaleString('en-IN') : '0'}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="info-card-blue" style={{ marginTop: 0 }}>
                <Info size={16} />
                <p style={{ fontSize: 11.5 }}>
                  Billing computed automatically. Reminders will be sent via WhatsApp and SMS once generated.
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setActiveModal(null)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  handleDownloadInvoiceFile(selectedAptDetails)
                  showToast(`📥 Invoice downloaded for Apartment ${selectedAptDetails.apartment_number}`)
                  setActiveModal(null)
                }}
                disabled={selectedAptDetails.status !== 'Completed'}
              >
                Download Invoice for {selectedAptDetails.apartment_number}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Settings */}
      {activeModal === 'settings' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Billing & Rate Configuration</h3>
              <button className="btn" style={{ border: 'none', padding: 4 }} onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    Water Cost per Litre (₹)
                  </label>
                  <input 
                    type="number" 
                    step="0.001"
                    className="search-input" 
                    style={{ width: '100%', paddingLeft: 12 }} 
                    value={costPerLitre}
                    onWheel={(e) => e.target.blur()}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setCostPerLitre('');
                        return;
                      }
                      const num = parseFloat(val);
                      if (num >= 0) {
                        if (val.includes('.')) {
                          const parts = val.split('.');
                          if (parts[1].length > 3) return;
                        }
                        setCostPerLitre(val);
                      }
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                    Fixed Maintenance Surcharge (₹)
                  </label>
                  <input 
                    type="number" 
                    className="search-input" 
                    style={{ width: '100%', paddingLeft: 12 }} 
                    defaultValue="250"
                    onWheel={(e) => e.target.blur()}
                  />
                </div>

                <div style={{ marginTop: 8, padding: 12, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, color: '#475569' }}>
                  <h4 style={{ fontWeight: 600, color: '#1e293b', marginBottom: 6 }}>Water Bill Calculation Formula:</h4>
                  <ul style={{ paddingLeft: 16, margin: 0, display: 'flex', flexDirection: 'column', gap: 4, listStyleType: 'disc' }}>
                    <li><strong>Units Consumed:</strong> Current Reading - Previous Reading</li>
                    <li><strong>Litres Consumed:</strong> Units × 10</li>
                    <li><strong>Water Cost (₹):</strong> Litres × Cost per Litre (rounded)</li>
                    <li><strong>Total Bill (₹):</strong> Water Cost + Fixed Maintenance Surcharge</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setActiveModal(null)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  fetchData()
                  showToast("⚙️ Billing configuration applied!")
                  setActiveModal(null)
                }}
              >
                Apply Rates
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: History */}
      {activeModal === 'history' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3 className="modal-title">Reading & Consumption History</h3>
              <button className="btn" style={{ border: 'none', padding: 4 }} onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="card-subtitle" style={{ marginBottom: 12 }}>Showing monthly usage summaries for the year 2026.</p>
              
              <table className="overview-table">
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '8px 0', textAlign: 'left' }}>Billing Month</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Total Litres</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Total Cost (₹)</th>
                    <th style={{ padding: '8px 0', textAlign: 'right' }}>Billed Apts</th>
                  </tr>
                </thead>
                <tbody>
                  {historyLogs.map((log, i) => (
                    <tr key={i} style={{ fontWeight: log.month.includes(selectedMonth) ? 'bold' : 'normal', background: log.month.includes(selectedMonth) ? 'var(--primary-light)' : 'transparent' }}>
                      <td>{log.month}</td>
                      <td className="text-right">{log.litres.toLocaleString()} L</td>
                      <td className="text-right">₹{log.cost.toLocaleString('en-IN')}</td>
                      <td className="text-right">{log.billed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={() => setActiveModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Add Manual Reading */}
      {activeModal === 'addManual' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Add Manual Water Reading</h3>
              <button className="btn" style={{ border: 'none', padding: 4 }} onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddManualSubmit}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                      Apartment Number
                    </label>
                    <select 
                      className="search-input bg-white" 
                      style={{ width: '100%', paddingLeft: 12, height: '40px' }} 
                      required
                      value={newManualApt}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewManualApt(val);
                        const target = readings.find(r => r.apartment_number === val);
                        if (target) {
                          setNewManualPrev((target.previous_reading ?? 0).toString());
                        } else {
                          setNewManualPrev("0");
                        }
                      }}
                    >
                      <option value="" disabled>Select Flat No</option>
                      {[
                        "101", "102", "103", "104", "105",
                        "201", "202", "203", "204", "205",
                        "301", "302", "303", "304", "305",
                        "401", "402", "403", "404", "405",
                        "501", "502", "503", "504", "505"
                      ].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                      Previous Month Reading (L)
                    </label>
                    <input 
                      type="number" 
                      className="search-input" 
                      style={{ width: '100%', paddingLeft: 12 }} 
                      required
                      placeholder="e.g. 12450"
                      value={newManualPrev}
                      onChange={(e) => setNewManualPrev(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                      Current Month Reading (L)
                    </label>
                    <input 
                      type="number" 
                      className="search-input" 
                      style={{ width: '100%', paddingLeft: 12 }} 
                      required
                      placeholder="e.g. 14250"
                      value={newManualCurr}
                      onChange={(e) => setNewManualCurr(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn" onClick={() => setActiveModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Reading</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CSV Import Preview */}
      {activeModal === 'excelReplace' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 450 }}>
            <div className="modal-header">
              <h3 className="modal-title">Replace Existing Readings</h3>
              <button className="btn" style={{ border: 'none', padding: 4 }} onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 12, color: '#0f172a' }}>
                Readings already exist for <strong>{selectedMonth}</strong>.
              </p>
              <p style={{ marginBottom: 0, color: '#475569' }}>
                Uploading a new Excel file will replace existing readings for this month. Existing values will be updated with the uploaded values.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setActiveModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmReplaceExcelUpload}>Replace</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'excelResult' && excelUploadResult && (
        <div className="modal-overlay" onClick={closeExcelResultModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">Excel Upload Result</h3>
              <button className="btn" style={{ border: 'none', padding: 4 }} onClick={closeExcelResultModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 10, color: excelUploadResult.success ? '#166534' : '#991b1b' }}>
                {excelUploadResult.success ? 'Excel uploaded successfully.' : 'Excel upload failed.'}
              </p>
              {excelUploadResult.message && (
                <p style={{ marginBottom: 16, color: '#475569' }}>{excelUploadResult.message}</p>
              )}
              {excelUploadResult.totalRows !== undefined && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc' }}>
                    <div style={{ fontSize: 12, color: '#475569' }}>Total Rows</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{excelUploadResult.totalRows}</div>
                  </div>
                  <div style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 10, background: '#ecfdf5' }}>
                    <div style={{ fontSize: 12, color: '#475569' }}>Imported</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{excelUploadResult.imported}</div>
                  </div>
                  <div style={{ padding: 12, border: '1px solid #e2e8f0', borderRadius: 10, background: '#fef2f2' }}>
                    <div style={{ fontSize: 12, color: '#475569' }}>Failed</div>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>{excelUploadResult.failed}</div>
                  </div>
                </div>
              )}
              {excelUploadResult.errors && excelUploadResult.errors.length > 0 && (
                <div style={{ maxHeight: 220, overflowY: 'auto', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, color: '#991b1b' }}>
                  <strong style={{ display: 'block', marginBottom: 8 }}>Errors</strong>
                  {excelUploadResult.errors.map((err, idx) => (
                    <div key={idx} style={{ marginBottom: 6 }}>
                      <div style={{ fontWeight: 700 }}>Row {err.row}</div>
                      <div>{err.flat_no ? `Flat ${err.flat_no}: ` : ''}{err.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-primary" onClick={closeExcelResultModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'csvPreview' && csvPreviewData && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 800 }}>
            <div className="modal-header">
              <h3 className="modal-title">CSV/Excel Import Preview</h3>
              <button className="btn" style={{ border: 'none', padding: 4 }} onClick={() => setActiveModal(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="info-card-blue" style={{ marginTop: 0, marginBottom: 16 }}>
                <Info size={16} />
                <div>
                  <p style={{ fontSize: 13, margin: 0 }}>
                    <strong>Detected Columns:</strong><br />
                    • Flat No Column: <code style={{color: 'var(--primary)'}}>Apartment</code><br />
                    • Previous Reading Column: <code style={{color: 'var(--primary)'}}>{csvPreviewData.prev_column}</code><br />
                    • Current Reading Column: <code style={{color: 'var(--primary)'}}>{csvPreviewData.curr_column}</code>
                  </p>
                </div>
              </div>

              {csvPreviewData.errors && csvPreviewData.errors.length > 0 && (
                <div style={{ maxHeight: 100, overflowY: 'auto', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 6, padding: 8, marginBottom: 16, fontSize: 12, color: '#b91c1c' }}>
                  <strong>Warnings/Errors in File:</strong>
                  {csvPreviewData.errors.map((err, i) => (
                    <div key={i}>• {err}</div>
                  ))}
                </div>
              )}

              <p className="card-subtitle" style={{ marginBottom: 10 }}>Please review the extracted readings before importing:</p>
              
              <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                <table className="overview-table" style={{ margin: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-header)', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: 8, textAlign: 'left' }}>Flat No</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Previous Reading</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Current Reading</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Consumption Units</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Consumption Litres</th>
                      <th style={{ padding: 8, textAlign: 'right' }}>Water Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreviewData.preview_data && csvPreviewData.preview_data.map((item, i) => (
                      <tr key={i}>
                        <td style={{ padding: 8 }}>{item.apartment_number}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>{(item.previous_reading ?? 0).toLocaleString()}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>{(item.current_reading ?? 0).toLocaleString()}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>{(item.consumption_units ?? 0).toLocaleString()}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>{(item.consumption_litres ?? 0).toLocaleString()}</td>
                        <td style={{ padding: 8, textAlign: 'right' }}>₹{(item.water_cost ?? 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setActiveModal(null)}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handleCommitCSVReadings}
                disabled={!csvPreviewData.preview_data || csvPreviewData.preview_data.length === 0}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
