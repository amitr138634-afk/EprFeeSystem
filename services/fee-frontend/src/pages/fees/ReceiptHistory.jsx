import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Eye, Printer } from 'lucide-react'
import { format } from 'date-fns'
import DataTable from '../../components/common/DataTable'
import { feeApi } from '../../services/api'

export default function ReceiptHistory() {
  const [fromDate, setFromDate] = useState(format(new Date(), 'yyyy-MM-01'))
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['receipts', fromDate, toDate, search, page],
    queryFn: () => feeApi.receipts({ from_date: fromDate, to_date: toDate, page }).then(r => r.data),
    keepPreviousData: true,
  })

  const receipts = data?.results || data || []
  const total = data?.count || receipts.length

  const columns = [
    { key: 'receipt_no', label: 'Receipt No.' },
    { key: 'student_name', label: 'Student Name' },
    { key: 'admission_no', label: 'Adm. No.' },
    { key: 'class_name', label: 'Class' },
    { key: 'payment_date', label: 'Date' },
    {
      key: 'payment_mode',
      label: 'Mode',
      render: (val) => (
        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs capitalize">{val}</span>
      ),
    },
    {
      key: 'net_amount',
      label: 'Amount',
      render: (val) => <span className="font-semibold">₹{Number(val).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          val === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {val}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1">
          <button className="p-1.5 hover:bg-blue-50 rounded text-blue-600"><Eye size={14} /></button>
          <button className="p-1.5 hover:bg-gray-100 rounded text-gray-600"><Printer size={14} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-800">Receipt History</h1>

      <div className="card p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div>
            <label className="form-label">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="form-input" />
          </div>
          <div className="flex-1">
            <label className="form-label">Search</label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Student name, receipt no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="form-input pl-9"
              />
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={receipts}
          loading={isLoading}
          emptyText="No receipts found"
          pagination={{ page, pageSize: 20, total }}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
