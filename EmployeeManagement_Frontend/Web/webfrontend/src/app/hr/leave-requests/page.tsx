'use client';
import { useEffect, useState } from 'react';
import { Calendar, Clock, User, Building, AlertCircle, CheckCircle, XCircle, Eye, Filter } from 'lucide-react';

interface LeaveRequest {
  id: string;
  employeeName: string;
  employeeMail: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  workHandoverDetails: string;
  status: 'Pending' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  decisionDate?: string;
  decisionReason?: string;
  requestDate?: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
}

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [requests, filter, departmentFilter, leaveTypeFilter, dateFrom, dateTo]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:8080/leave/all', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!res.ok) throw new Error('Failed to fetch requests');
      
      const data = await res.json();
      setRequests(data);
      calculateStats(data);
    } catch (err) {
      console.error('Error fetching leave requests:', err);
      alert('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: LeaveRequest[]) => {
    const pending = data.filter(r => r.status === 'Pending').length;
    const approved = data.filter(r => r.status === 'APPROVED').length;
    const rejected = data.filter(r => r.status === 'REJECTED').length;
    setStats({ pending, approved, rejected });
  };

  const applyFilters = () => {
    let filtered = [...requests];

    if (filter !== 'ALL') {
      filtered = filtered.filter(r => r.status === filter);
    }

    if (leaveTypeFilter) {
      filtered = filtered.filter(r => r.leaveType.toLowerCase() === leaveTypeFilter.toLowerCase());
    }
    if (dateFrom) {
      filtered = filtered.filter(r => new Date(r.startDate) >= new Date(dateFrom));
    }
    if (dateTo) {
      filtered = filtered.filter(r => new Date(r.endDate) <= new Date(dateTo));
    }

    setFilteredRequests(filtered);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject', reason?: string) => {
    try {
      const meRes = await fetch("http://localhost:8080/auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!meRes.ok) {
        alert("⚠️ Failed to get logged-in HR info");
        return;
      }

      const user = await meRes.json();
      const hrMail = user.email;

      const url = new URL("http://localhost:8080/leave/action");
      url.searchParams.append("requestId", id);
      url.searchParams.append("status", action.toUpperCase());
      url.searchParams.append("hrMail", hrMail);
      url.searchParams.append("reason", reason || '');

      const res = await fetch(url.toString(), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.ok) {
        alert(`✅ Leave request ${action}d successfully`);
        fetchLeaveRequests();
      } else {
        const errMsg = await res.text();
        alert("❌ Failed: " + errMsg);
      }
    } catch (err) {
      console.error("Error updating leave request:", err);
      alert("❌ An error occurred while processing the request");
    }
  };

  const handleApprove = (id: string) => {
    if (window.confirm('Are you sure you want to approve this leave request?')) {
      const remarks = prompt('Enter approval remarks (optional):') || '';
      handleAction(id, 'approve', remarks);
    }
  };

  const handleReject = (id: string) => {
    setSelectedRequestId(id);
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    if (selectedRequestId) {
      handleAction(selectedRequestId, 'reject', rejectionReason);
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequestId(null);
    }
  };

  const closeModal = () => {
    setShowRejectModal(false);
    setRejectionReason('');
    setSelectedRequestId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'annual': return 'bg-blue-500';
      case 'sick': return 'bg-red-500';
      case 'personal': return 'bg-purple-500';
      case 'emergency': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header with Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Leave Request Management</h2>
              <p className="text-gray-600">Review and approve employee leave requests</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending Requests</div>
              </div>
              <div className="bg-white border-l-4 border-green-400 p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{stats.approved}</div>
                <div className="text-sm text-gray-600">Approved This Month</div>
              </div>
              <div className="bg-white border-l-4 border-red-400 p-4 rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{stats.rejected}</div>
                <div className="text-sm text-gray-600">Rejected This Month</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="ALL">All Requests</option>
                <option value="Pending">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">Leave Type</label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={leaveTypeFilter}
                onChange={e => setLeaveTypeFilter(e.target.value)}
              >
                <option value="">All Types</option>
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="personal">Personal Leave</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Requests Table/Cards */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Leave Requests ({filteredRequests.length})</h3>

          </div>

          <div className="p-6">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400">
                  <Calendar className="h-full w-full" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No leave requests found</h3>
                <p className="mt-2 text-gray-500">No requests match your current filters.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredRequests.map(request => (
                  <div
                    key={request.id}
                    className="border-2 border-gray-200 rounded-xl p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                          {getInitials(request.employeeName)}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                            {request.employeeName}
                            {request.leaveType === 'Emergency' && (
                              <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                                URGENT
                              </span>
                            )}
                          </h4>
                          <p className="text-gray-600">{request.employeeMail}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>

                    {/* Request Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Leave Type</div>
                        <div className="flex items-center">
                          <span className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getLeaveTypeColor(request.leaveType)}`}>
                            {request.leaveType}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Duration</div>
                        <div className="font-semibold text-gray-900">
                          {formatDate(request.startDate)} - {formatDate(request.endDate)}
                        </div>
                        <div className="text-sm text-gray-600">({request.totalDays} days)</div>
                      </div>
                      {/* <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">Applied On</div>
                        <div className="font-semibold text-gray-900">
                          {request.requestDate ? formatDate(request.requestDate) : 'N/A'}
                        </div>
                      </div> */}
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">
                          {request.status === 'Pending' ? 'Status' : 'Reviewed By'}
                        </div>
                        <div className="font-semibold text-gray-900">
                          {request.reviewedBy || 'Pending Review'}
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Reason:</h5>
                      <p className="text-gray-700 leading-relaxed">{request.reason}</p>
                    </div>

                    {request.workHandoverDetails && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <h5 className="text-sm font-semibold text-gray-900 mb-2">Work Handover Details:</h5>
                        <p className="text-gray-700 leading-relaxed">{request.workHandoverDetails}</p>
                      </div>
                    )}

                    {request.decisionReason && (
                      <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                        <h5 className="text-sm font-semibold text-gray-900 mb-2">HR Remarks:</h5>
                        <p className="text-gray-700 leading-relaxed">{request.decisionReason}</p>
                      </div>
                    )}

                    <div className="flex justify-end space-x-3">
                      <button
                        className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        onClick={() => alert(`Viewing details for ${request.employeeName}'s request`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      
                      {request.status === 'Pending' && (
                        <>
                          <button
                            className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transform hover:scale-105 transition-all"
                            onClick={() => handleReject(request.id)}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </button>
                          <button
                            className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transform hover:scale-105 transition-all"
                            onClick={() => handleApprove(request.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reject Leave Request</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                rows={4}
                placeholder="Please provide a detailed reason for rejecting this leave request..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}