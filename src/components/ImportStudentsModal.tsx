import React, { useState, useRef } from 'react'
import { X, Upload, Download, AlertCircle, CheckCircle2, FileSpreadsheet, Loader2 } from 'lucide-react'
import { bulkAddStudents } from '../lib/api'
import toast from 'react-hot-toast'

interface ImportStudentsModalProps {
  isOpen: boolean
  hostelId: string | null
  onClose: () => void
  onSuccess: () => void
}

export function ImportStudentsModal({ isOpen, hostelId, onClose, onSuccess }: ImportStudentsModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<any[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const downloadTemplate = () => {
    const headers = [
      'full_name',
      'email',
      'phone',
      'password',
      'college_name',
      'branch',
      'id_number',
      'parent_phone',
      'joining_date',
      'room_number',
      'bed_number',
      'aadhaar_number'
    ]
    const sample = [
      'Bhanu Student',
      'bhanu.student@example.com',
      '9876543210',
      'Bhanu@2026',
      'VNR VJIET',
      'CSE',
      '22071A0589',
      '9000123456',
      '2026-06-01',
      '101',
      'Bed A',
      '123456789012'
    ]
    const csvContent = [headers.join(','), sample.join(',')].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'students_bulk_import_template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0])
    }
  }

  const processFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a valid CSV file')
      return
    }
    setFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      parseCSV(text)
    }
    reader.readAsText(file)
  }

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/)
    if (lines.length <= 1) {
      toast.error('CSV file appears to be empty')
      return
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
    const requiredHeaders = ['full_name', 'email', 'phone', 'password']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

    if (missingHeaders.length > 0) {
      toast.error(`Missing required headers: ${missingHeaders.join(', ')}`)
      return
    }

    const records: any[] = []
    const errors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Simple CSV line parser respecting quotes
      const values: string[] = []
      let currentVal = ''
      let inQuotes = false
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim().replace(/^["']|["']$/g, ''))
          currentVal = ''
        } else {
          currentVal += char
        }
      }
      values.push(currentVal.trim().replace(/^["']|["']$/g, ''))

      const record: any = {}
      headers.forEach((header, index) => {
        record[header] = values[index] || ''
      })

      // Validation
      const rowNum = i + 1
      if (!record.full_name) errors.push(`Row ${rowNum}: Full Name is required`)
      if (!record.email) {
        errors.push(`Row ${rowNum}: Email is required`)
      } else if (!/\S+@\S+\.\S+/.test(record.email)) {
        errors.push(`Row ${rowNum}: Email is invalid`)
      }
      if (!record.phone) {
        errors.push(`Row ${rowNum}: Phone number is required`)
      }
      if (!record.password || record.password.length < 6) {
        errors.push(`Row ${rowNum}: Password must be at least 6 characters`)
      }

      // Format joining_date to standard YYYY-MM-DD
      if (!record.joining_date) {
        record.joining_date = new Date().toISOString().substring(0, 10)
      }

      records.push(record)
    }

    setParsedData(records)
    setValidationErrors(errors)
    if (errors.length > 0) {
      toast.error(`Validation found ${errors.length} errors. Please fix them.`)
    } else {
      toast.success(`Successfully parsed ${records.length} student records.`)
    }
  }

  const handleSubmit = async () => {
    if (parsedData.length === 0) {
      toast.error('No data to import')
      return
    }
    if (validationErrors.length > 0) {
      toast.error('Please fix validation errors before proceeding')
      return
    }
    if (!hostelId) {
      toast.error('Hostel ID is missing. Please refresh dashboard.')
      return
    }

    setImporting(true)
    try {
      await bulkAddStudents(parsedData, hostelId)
      toast.success(`Successfully imported ${parsedData.length} students!`)
      onSuccess()
    } catch (err: any) {
      console.error('Import students error:', err)
      toast.error(err.message || 'Failed to import students. Please check your data.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-600" /> Bulk Import Students
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Add multiple students, allocate rooms & beds, and auto-generate logins.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-200/80 rounded-xl transition text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Instructions */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1">
              <h4 className="font-bold text-indigo-950 text-sm">Download student CSV template</h4>
              <p className="text-xs text-indigo-700 max-w-md">
                Make sure your CSV contains required columns: <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">full_name</code>, <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">email</code>, <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">phone</code>, <code className="bg-indigo-100 px-1 py-0.5 rounded font-mono">password</code>. Optional columns allow room allocations.
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0 shadow-sm shadow-indigo-600/10"
            >
              <Download className="h-3.5 w-3.5" /> Template.csv
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
              dragActive ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]' : 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <div className="h-12 w-12 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50 transition">
              <Upload className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-800 text-sm">
                {file ? file.name : 'Choose a CSV file or drag it here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Only standard CSV files are accepted'}
              </p>
            </div>
          </div>

          {/* Parsed Preview */}
          {parsedData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Import Preview</h4>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-bold">
                    {parsedData.length} records found
                  </span>
                  {validationErrors.length > 0 ? (
                    <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 text-xs px-2.5 py-1 rounded-full font-bold">
                      <AlertCircle className="h-3.5 w-3.5" /> {validationErrors.length} errors
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verification passed
                    </span>
                  )}
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-xs text-rose-800 max-h-36 overflow-y-auto space-y-1">
                  <p className="font-bold text-rose-900 mb-1">Please fix the following validation errors:</p>
                  {validationErrors.map((err, idx) => (
                    <p key={idx} className="flex items-start gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="px-4 py-2.5">Name</th>
                      <th className="px-4 py-2.5">Phone</th>
                      <th className="px-4 py-2.5">Email</th>
                      <th className="px-4 py-2.5">College</th>
                      <th className="px-4 py-2.5">Room & Bed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 font-semibold text-slate-900">{row.full_name}</td>
                        <td className="px-4 py-2.5 text-slate-700">{row.phone}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-500">{row.email}</td>
                        <td className="px-4 py-2.5 text-slate-500 truncate max-w-[120px]">{row.college_name || '—'}</td>
                        <td className="px-4 py-2.5 font-medium text-slate-600">
                          {row.room_number ? `Rm ${row.room_number} (${row.bed_number || 'No Bed'})` : 'Unassigned'}
                        </td>
                      </tr>
                    ))}
                    {parsedData.length > 5 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-2 bg-slate-50/50 text-center text-slate-400 font-medium italic">
                          ... and {parsedData.length - 5} more student records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            disabled={importing}
            className="border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-sm transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={importing || parsedData.length === 0 || validationErrors.length > 0}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-600/15"
          >
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Importing...
              </>
            ) : (
              'Start Import'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
