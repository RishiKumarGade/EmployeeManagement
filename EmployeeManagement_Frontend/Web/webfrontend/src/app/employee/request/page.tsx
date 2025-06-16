"use client";
import React, { useState, useEffect } from "react";
import { Calendar, Clock, User, FileText, Users, LogOut, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";

export default function LeaveRequestPage() {
  const [leaveType, setLeaveType] = useState("Annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [handover, setHandover] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(()=>{
    if (userEmail){
    fetchMyRequests();
    fetchLeaveBalances();
      }
  },[userEmail])

const fetchLeaveBalances = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`http://localhost:8080/leave/balance?mail=${userEmail}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = res.data;

        setLeaveBalances([
          { type: "Annual", count: data.annualLeave, color: "bg-gradient-to-r from-blue-500 to-blue-600", textColor: "text-blue-700" },
          { type: "Sick", count: data.sickLeave, color: "bg-gradient-to-r from-red-500 to-red-600", textColor: "text-red-700" },
          { type: "Personal", count: data.personalLeave, color: "bg-gradient-to-r from-green-500 to-green-600", textColor: "text-green-700" },
          { type: "Emergency", count: data.emergencyLeave, color: "bg-gradient-to-r from-orange-500 to-orange-600", textColor: "text-orange-700" }
        ]);
      } catch (err) {
        console.error("Failed to fetch leave balances", err);
      }
    };

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:8080/auth/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const user = await response.json();
        setUserEmail(user.email);
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || !userEmail) return;

      const response = await fetch(`http://localhost:8080/leave/my-requests?mail=${userEmail}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const requests = await response.json();
        setRecentRequests(requests.slice(0, 3)); // Show only last 3 requests
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    }
  };

  const daysDiff = (() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
      return 0;
    }
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        alert("❌ Please log in again.");
        return;
      }

      if (!leaveType.trim() || !startDate || !endDate || !reason.trim() || !handover.trim() || !userEmail) {
        alert("❌ All fields must be filled.");
        return;
      }

      const payload = {
        leaveType,
        startDate,
        endDate,
        reason,
        workHandoverDetails: handover,
        employeeMail: userEmail,
      };
      console.log(payload)
      const response = await fetch("http://localhost:8080/leave/request-leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert("✅ Leave request submitted successfully!");
        setStartDate("");
        setEndDate("");
        setReason("");
        setHandover("");
        fetchMyRequests();
      } else {
        const errorMsg = await response.text();
        alert(`❌ Failed: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
      alert("❌ An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const leaveTypes = [
    { id: "Annual", label: "Annual Leave", color: "bg-blue-100 text-blue-800 border-blue-300", icon: "🏖️" },
    { id: "Sick", label: "Sick Leave", color: "bg-red-100 text-red-800 border-red-300", icon: "🏥" },
    { id: "Personal", label: "Personal Leave", color: "bg-green-100 text-green-800 border-green-300", icon: "👤" },
    { id: "Emergency", label: "Emergency", color: "bg-orange-100 text-orange-800 border-orange-300", icon: "🚨" }
  ];

   const [leaveBalances, setLeaveBalances] = useState([
    { type: "Annual", count: 0, color: "bg-gradient-to-r from-blue-500 to-blue-600", textColor: "text-blue-700" },
    { type: "Sick", count: 0, color: "bg-gradient-to-r from-red-500 to-red-600", textColor: "text-red-700" },
    { type: "Personal", count: 0, color: "bg-gradient-to-r from-green-500 to-green-600", textColor: "text-green-700" },
    { type: "Emergency", count: 0, color: "bg-gradient-to-r from-orange-500 to-orange-600", textColor: "text-orange-700" }
  ]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Page Header */}
        <div className="mb-8 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Request Leave</h2>
          <p className="text-gray-600">Submit your leave application for approval</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Main Form */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                  Leave Request Form
                </h3>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Enhanced Leave Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Leave Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {leaveTypes.map((type) => (
                      <label
                        key={type.id}
                        className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer hover:shadow-md transition-all duration-200 ${
                          leaveType === type.id 
                            ? `${type.color} border-2 shadow-md transform scale-105` 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="leaveType"
                          value={type.id}
                          checked={leaveType === type.id}
                          onChange={(e) => setLeaveType(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{type.icon}</span>
                          <div>
                            <div className="text-sm font-semibold">{type.label}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Enhanced Date Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1 text-indigo-600" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1 text-indigo-600" />
                      End Date
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Enhanced Days Calculator */}
                {daysDiff > 0 && (
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
                    <div className="flex items-center justify-center">
                      <Clock className="h-6 w-6 text-indigo-500 mr-3" />
                      <div className="text-center">
                        <div className="text-3xl font-bold text-indigo-900">{daysDiff}</div>
                        <div className="text-sm text-indigo-700 font-medium">Total leave days</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Form Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FileText className="inline h-4 w-4 mr-1 text-indigo-600" />
                    Reason for Leave
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Please provide a detailed reason for your leave request..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Handover Details
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={handover}
                    onChange={(e) => setHandover(e.target.value)}
                    placeholder="Describe your handover plan and any important tasks that need coverage..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                  />
                </div>

                {/* Enhanced Submit Button */}
                <div className="pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Submitting...
                      </span>
                    ) : (
                      "Submit Leave Request"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Enhanced Leave Balance */}
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Leave Balance</h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {leaveBalances.map((balance) => (
                    <div key={balance.type} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${balance.color} mr-3 shadow-sm`}></div>
                        <span className="text-sm font-medium text-gray-900">{balance.type} Leave</span>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold ${balance.textColor}`}>{balance.count}</div>
                        <div className="text-xs text-gray-500">days</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">28</div>
                    <div className="text-sm text-gray-500 font-medium">Total Available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Requests */}
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
              </div>
              
              <div className="p-6">
                {recentRequests.length > 0 ? (
                  <div className="space-y-3">
                    {recentRequests.map((request, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                          </div>
                          <div className="text-xs text-gray-500">{request.leaveType} Leave</div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No recent requests</p>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Quick Tips */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6">
              <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center">
                💡 Quick Tips
              </h4>
              <ul className="text-xs text-amber-700 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-amber-600 flex-shrink-0" />
                  Submit requests at least 2 weeks in advance
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-amber-600 flex-shrink-0" />
                  Emergency leave requires immediate manager approval
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-amber-600 flex-shrink-0" />
                  Check team calendar before requesting dates
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}