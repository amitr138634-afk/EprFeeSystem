import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { feeApi, masterApi } from '../../services/api'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'
import { Save, ChevronRight } from 'lucide-react'

const MONTHS = ['april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'january', 'february', 'march']
const MONTH_LABELS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']

export default function DefineFeeAmount() {
  const queryClient = useQueryClient()
  const activeSession = useAuthStore(s => s.currentSession?.session_year) || ''
  const [filters, setFilters] = useState({
    class_id: '',
    type: '',
    session: activeSession
  })
  const [showTable, setShowTable] = useState(false)
  const [feeAmounts, setFeeAmounts] = useState([])

  // Fetch classes
  const { data: classes = [] } = useQuery({
    queryKey: ['class-master'],
    queryFn: () => masterApi.classes().then(r => r.data.results || r.data)
  })

  // Fetch fee heads
  const { data: feeHeadsData } = useQuery({
    queryKey: ['fee-heads', filters.session],
    queryFn: () => feeApi.heads({ session: filters.session }).then(r => r.data.results || r.data),
    enabled: !!filters.session
  })

  // Fetch existing fee amounts
  const { data: existingAmounts = [], refetch } = useQuery({
    queryKey: ['fee-amounts', filters],
    queryFn: () => feeApi.amounts(filters).then(r => r.data.results || r.data),
    enabled: showTable && !!filters.class_id && !!filters.type
  })

  const bulkUpdateMutation = useMutation({
    mutationFn: (data) => feeApi.bulkUpdateAmounts(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['fee-amounts'])
      toast.success('Fee amounts saved successfully!')
      refetch()
    },
    onError: () => {
      toast.error('Failed to save fee amounts')
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!filters.class_id || !filters.type) {
      toast.error('Please select class and type')
      return
    }

    // Get selected class name
    const selectedClass = classes.find(c => c.id === parseInt(filters.class_id))
    
    // Get all head names from fee heads
    const allHeadNames = []
    if (feeHeadsData && feeHeadsData.length > 0) {
      const headData = feeHeadsData[0]
      for (let i = 1; i <= 20; i++) {
        const headName = headData[`head${i}`]
        if (headName && headName.trim()) {
          allHeadNames.push(headName.trim())
        }
      }
    }

    // Map existing amounts
    const amountsMap = {}
    existingAmounts.forEach(item => {
      amountsMap[item.head_name] = item
    })

    // Initialize fee amounts array
    const initialAmounts = allHeadNames.map(headName => {
      const existing = amountsMap[headName]
      if (existing) {
        return existing
      }
      return {
        class_id: parseInt(filters.class_id),
        class_name: selectedClass?.class_name || '',
        type: filters.type,
        session: filters.session,
        head_name: headName,
        frequency: 'monthly',
        april: 0, may: 0, june: 0, july: 0, august: 0, september: 0,
        october: 0, november: 0, december: 0, january: 0, february: 0, march: 0
      }
    })

    setFeeAmounts(initialAmounts)
    setShowTable(true)
  }

  const handleAmountChange = (index, field, value) => {
    const updated = [...feeAmounts]
    updated[index][field] = value
    setFeeAmounts(updated)
  }

  const handleSave = async () => {
    if (feeAmounts.length === 0) {
      toast.error('No fee amounts to save')
      return
    }

    // Separate create and update
    const toCreate = feeAmounts.filter(item => !item.id)
    const toUpdate = feeAmounts.filter(item => item.id)

    try {
      // Create new records
      if (toCreate.length > 0) {
        await feeApi.createAmount(toCreate)
      }

      // Update existing records
      if (toUpdate.length > 0) {
        await bulkUpdateMutation.mutateAsync({ amounts: toUpdate })
      }

      if (toCreate.length > 0 && toUpdate.length === 0) {
        toast.success('Fee amounts created successfully!')
        refetch()
      }
    } catch (error) {
      toast.error('Failed to save fee amounts')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Define Fee Amount</h1>
        <p className="text-sm text-gray-500 mt-1">Set fee amounts for each class</p>
      </div>

      {/* Filter Form */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Select Class *</label>
              <select
                value={filters.class_id}
                onChange={(e) => setFilters({ ...filters, class_id: e.target.value })}
                className="form-input"
                required
              >
                <option value="">-- Select Class --</option>
                {classes.filter(c => c.status).map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Type *</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="form-input"
                required
              >
                <option value="">-- Select Type --</option>
                <option value="old">Old</option>
                <option value="new">New</option>
              </select>
            </div>

            <div>
              <label className="form-label">Session *</label>
              <input
                type="text"
                value={filters.session}
                onChange={(e) => setFilters({ ...filters, session: e.target.value })}
                className="form-input"
                placeholder="e.g., 2024-25"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary flex items-center gap-2">
            Submit <ChevronRight size={18} />
          </button>
        </form>
      </div>

      {/* Fee Amount Table */}
      {showTable && feeAmounts.length > 0 && (
        <div className="card">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-700">Fee Structure</h2>
            <button
              onClick={handleSave}
              disabled={bulkUpdateMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={18} />
              {bulkUpdateMutation.isPending ? 'Saving...' : 'Save All'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b sticky top-0">
                <tr>
                  <th className="table-header text-left px-4 py-3 w-48">Fee Head</th>
                  <th className="table-header text-center px-4 py-3 w-32">Frequency</th>
                  {MONTH_LABELS.map((month, idx) => (
                    <th key={idx} className="table-header text-center px-2 py-3 w-24">{month}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {feeAmounts.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{item.head_name}</td>
                    <td className="px-4 py-3">
                      <select
                        value={item.frequency}
                        onChange={(e) => handleAmountChange(index, 'frequency', e.target.value)}
                        className="form-input text-xs py-1 px-2"
                      >
                        <option value="one_time">One Time</option>
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </td>
                    {MONTHS.map((month) => (
                      <td key={month} className="px-2 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item[month]}
                          onChange={(e) => handleAmountChange(index, month, parseFloat(e.target.value) || 0)}
                          className="form-input text-xs py-1 px-2 text-right w-full"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTable && feeAmounts.length === 0 && (
        <div className="card p-8 text-center text-gray-500">
          No fee heads configured for this session. Please define fee heads first.
        </div>
      )}
    </div>
  )
}
