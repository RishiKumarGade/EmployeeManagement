'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import toast, { Toaster } from 'react-hot-toast';

interface AttendanceRecord {
  employeeMail: string;
  status: 'Present' | 'Absent' | 'Late' | 'Left Early';
  date: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  early: number;
}

interface WeeklyData {
  week: string;
  stats: AttendanceStats;
  days: AttendanceRecord[];
}

interface MonthlyData {
  month: string;
  stats: AttendanceStats;
  weeks: WeeklyData[];
}

interface YearlyData {
  year: string;
  stats: AttendanceStats;
  months: MonthlyData[];
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyData | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [generated, setGenerated] = useState(true);
  const [activeView, setActiveView] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Day');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<AttendanceStats>({
    present: 0,
    absent: 0,
    late: 0,
    early: 0
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const calculateStats = (data: AttendanceRecord[]) => {
    return {
      present: data.filter(r => r.status === 'Present').length,
      absent: data.filter(r => r.status === 'Absent').length,
      late: data.filter(r => r.status === 'Late').length,
      early: data.filter(r => r.status === 'Left Early').length
    };
  };

  const fetchDayAttendance = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:8080/hr/attendance/day?date=${date}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAttendance(res.data);
      setGenerated(res.data.length > 0);
      setStats(calculateStats(res.data));
      toast.success('Daily attendance loaded successfully');
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setGenerated(false);
      toast.error('Failed to fetch daily attendance');
    } finally {
      setLoading(false);
    }
  };

 const fetchWeeklyAttendance = async () => {
  setLoading(true);
  try {
    const selectedDate = new Date(date);

    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const weeks = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 } 
    );

    const weeklyPromises = weeks.map(async (weekStartDate) => {
      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
      console.log(`http://localhost:8080/hr/attendance/range?start=${format(weekStartDate, 'yyyy-MM-dd')}&end=${format(weekEndDate, 'yyyy-MM-dd')}`)
      const res = await axios.get(
        `http://localhost:8080/hr/attendance/range?start=${format(weekStartDate, 'yyyy-MM-dd')}&end=${format(weekEndDate, 'yyyy-MM-dd')}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        week: `${format(weekStartDate, 'MMM dd')} - ${format(weekEndDate, 'MMM dd')}`,
        stats: calculateStats(res.data),
        days: res.data,
      };
    });

    const weeklyResults = await Promise.all(weeklyPromises);
    setWeeklyData(weeklyResults);

    const allData = weeklyResults.flatMap((w) => w.days);
    setStats(calculateStats(allData));

    toast.success('Weekly attendance data loaded successfully');
  } catch (err) {
    console.error('Error fetching weekly attendance:', err);
    toast.error('Failed to fetch weekly attendance data');
  } finally {
    setLoading(false);
  }
};

  const fetchMonthlyAttendance = async () => {
    setLoading(true);
    try {
      const selectedDate = new Date(date);
      const yearStart = startOfYear(selectedDate);
      const yearEnd = endOfYear(selectedDate);
      
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      
      const monthlyPromises = months.map(async (monthDate) => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const res = await axios.get(
          `http://localhost:8080/hr/attendance/range?start=${format(monthStart, 'yyyy-MM-dd')}&end=${format(monthEnd, 'yyyy-MM-dd')}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        
        const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
        const weeklyData = weeks.map(weekStart => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekData = res.data.filter((record: AttendanceRecord) => {
            const recordDate = new Date(record.date);
            return recordDate >= weekStart && recordDate <= weekEnd;
          });
          
          return {
            week: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
            stats: calculateStats(weekData),
            days: weekData
          };
        });
        
        return {
          month: format(monthDate, 'MMMM yyyy'),
          stats: calculateStats(res.data),
          weeks: weeklyData
        };
      });

      const monthlyResults = await Promise.all(monthlyPromises);
      setMonthlyData(monthlyResults);
      
      const allData = monthlyResults.flatMap(m => m.weeks.flatMap(w => w.days));
      setStats(calculateStats(allData));
      toast.success('Monthly attendance data loaded successfully');
    } catch (err) {
      console.error('Error fetching monthly attendance:', err);
      toast.error('Failed to fetch monthly attendance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchYearlyAttendance = async () => {
    setLoading(true);
    try {
      const selectedDate = new Date(date);
      const yearStart = startOfYear(selectedDate);
      const yearEnd = endOfYear(selectedDate);
      
      const res = await axios.get(
        `http://localhost:8080/hr/attendance/range?start=${format(yearStart, 'yyyy-MM-dd')}&end=${format(yearEnd, 'yyyy-MM-dd')}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
      const monthlyData = months.map(monthDate => {
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthData = res.data.filter((record: AttendanceRecord) => {
          const recordDate = new Date(record.date);
          return recordDate >= monthStart && recordDate <= monthEnd;
        });
        
        const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
        const weeklyData = weeks.map(weekStart => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekData = monthData.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= weekStart && recordDate <= weekEnd;
          });
          
          return {
            week: `${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
            stats: calculateStats(weekData),
            days: weekData
          };
        });
        
        return {
          month: format(monthDate, 'MMMM yyyy'),
          stats: calculateStats(monthData),
          weeks: weeklyData
        };
      });
      
      const yearData = {
        year: format(selectedDate, 'yyyy'),
        stats: calculateStats(res.data),
        months: monthlyData
      };
      
      setYearlyData(yearData);
      setStats(yearData.stats);
      toast.success('Yearly attendance data loaded successfully');
    } catch (err) {
      console.error('Error fetching yearly attendance:', err);
      toast.error('Failed to fetch yearly attendance data');
    } finally {
      setLoading(false);
    }
  };

  const generateTodayAttendance = async () => {
    const loadingToast = toast.loading('Generating attendance...');
    try {
      await axios.post(
        `http://localhost:8080/hr/attendance/generate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.dismiss(loadingToast);
      toast.success('Attendance generated successfully!');
      fetchAttendance();
    } catch (err) {
      console.error('Error generating attendance:', err);
      toast.dismiss(loadingToast);
      toast.error('Not authorized or something went wrong');
    }
  };

  const markPresent = async (mail: string, date: string) => {
    const loadingToast = toast.loading('Updating attendance...');
    try {
      await axios.put(
        'http://localhost:8080/hr/attendance/mark-present',
        { mail, date },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.dismiss(loadingToast);
      toast.success(`${mail} marked as present`);
      fetchAttendance();
    } catch (err) {
      console.error('Error marking present:', err);
      toast.dismiss(loadingToast);
      toast.error('Failed to mark as present');
    }
  };

  const exportCSV = () => {
    try {
      let dataToExport: AttendanceRecord[] = [];
      let filename = '';
      
      switch (activeView) {
        case 'Day':
          dataToExport = filteredAttendance;
          filename = `attendance-day-${date}.csv`;
          break;
        case 'Week':
          dataToExport = weeklyData.flatMap(w => w.days);
          filename = `attendance-week-${date}.csv`;
          break;
        case 'Month':
          dataToExport = monthlyData.flatMap(m => m.weeks.flatMap(w => w.days));
          filename = `attendance-month-${format(new Date(date), 'yyyy-MM')}.csv`;
          break;
        case 'Year':
          dataToExport = yearlyData?.months.flatMap(m => m.weeks.flatMap(w => w.days)) || [];
          filename = `attendance-year-${format(new Date(date), 'yyyy')}.csv`;
          break;
      }
      
      const headers = ['Email', 'Status', 'Date'];
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(record => [
          record.employeeMail,
          record.status,
          record.date
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${activeView} attendance exported successfully`);
    } catch (err) {
      toast.error('Failed to export data');
    }
  };

  const fetchAttendance = () => {
    switch (activeView) {
      case 'Day':
        fetchDayAttendance();
        break;
      case 'Week':
        fetchWeeklyAttendance();
        break;
      case 'Month':
        fetchMonthlyAttendance();
        break;
      case 'Year':
        fetchYearlyAttendance();
        break;
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      case 'Late': return 'bg-yellow-100 text-yellow-800';
      case 'Left Early': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAttendance = attendance.filter(record => {
    const statusMatch = statusFilter === 'all' || 
      record.status.toLowerCase().replace(' ', '') === statusFilter;
    return statusMatch;
  });

  useEffect(() => {
    fetchAttendance();
  }, [date, activeView]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Attendance Monitoring</h2>
          <p className="text-gray-600">Track and review employee attendance patterns daily, weekly, monthly, or yearly.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex bg-gray-100 rounded-xl p-1">
              {['Day', 'Week', 'Month', 'Year'].map((view) => (
                <button
                  key={view}
                  onClick={() => setActiveView(view as any)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all ${
                    activeView === view
                      ? 'bg-indigo-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {view}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-600 mb-1">Status</label>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="leftearly">Left Early</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-green-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.present}</div>
            <div className="text-gray-600 font-medium">Present {activeView === 'Day' ? 'Today' : `This ${activeView}`}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-red-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.absent}</div>
            <div className="text-gray-600 font-medium">Absent {activeView === 'Day' ? 'Today' : `This ${activeView}`}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-yellow-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.late}</div>
            <div className="text-gray-600 font-medium">Late Check-ins</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-purple-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.early}</div>
            <div className="text-gray-600 font-medium">Left Early</div>
          </div>
        </div>

        {!generated && activeView === 'Day' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <button
              onClick={generateTodayAttendance}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Generate Attendance for Today
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeView} Attendance 
              {activeView === 'Day' && ` (${format(new Date(date), 'dd MMMM yyyy')})`}
              {activeView === 'Week' && ` (${format(startOfWeek(new Date(date), { weekStartsOn: 1 }), 'dd MMM')} - ${format(endOfWeek(new Date(date), { weekStartsOn: 1 }), 'dd MMM yyyy')})`}
              {activeView === 'Month' && ` (${format(new Date(date), 'MMMM yyyy')})`}
              {activeView === 'Year' && ` (${format(new Date(date), 'yyyy')})`}
            </h3>
            <button
              onClick={exportCSV}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Loading...' : 'Export CSV'}
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading attendance data...</p>
            </div>
          ) : (
            <>
              {activeView === 'Day' && (
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-4 p-4 bg-gray-100 rounded-lg mb-4 font-semibold text-gray-700">
                    <div>Employee Email</div>
                    <div>Status</div>
                    <div>Date</div>
                    <div>Action</div>
                  </div>

                  <div className="space-y-2">
                    {filteredAttendance.map((record, index) => (
                      <div
                        key={`${record.employeeMail}-${record.date}`}
                        className="grid grid-cols-4 gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors items-center"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {getInitials(record.employeeMail)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{record.employeeMail}</div>
                          </div>
                        </div>
                        <div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                            {record.status}
                          </span>
                        </div>
                        <div className="font-medium text-gray-900">{record.date}</div>
                        <div>
                          {record.status === 'Absent' && (
                            <button
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                              onClick={() => markPresent(record.employeeMail, record.date)}
                            >
                              Mark Present
                            </button>
                          )}
                          {record.status === 'Late' && (
                            <span className="text-yellow-500 text-lg cursor-pointer" title="Late arrival">
                              ⚠️
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeView === 'Week' && (
                <div className="p-6">
                  <div className="space-y-6">
                    {weeklyData.map((week, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">{week.week}</h4>
                          <div className="flex space-x-4 text-sm">
                            <span className="text-green-600 font-medium">Present: {week.stats.present}</span>
                            <span className="text-red-600 font-medium">Absent: {week.stats.absent}</span>
                            <span className="text-yellow-600 font-medium">Late: {week.stats.late}</span>
                            <span className="text-purple-600 font-medium">Early: {week.stats.early}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-800">{week.stats.present}</div>
                            <div className="text-green-600 text-sm">Present</div>
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-red-800">{week.stats.absent}</div>
                            <div className="text-red-600 text-sm">Absent</div>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-800">{week.stats.late}</div>
                            <div className="text-yellow-600 text-sm">Late</div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-purple-800">{week.stats.early}</div>
                            <div className="text-purple-600 text-sm">Left Early</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeView === 'Month' && (
                <div className="p-6">
                  <div className="space-y-8">
                    {monthlyData.map((month, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-xl font-bold text-gray-900">{month.month}</h4>
                          <div className="flex space-x-4 text-sm">
                            <span className="text-green-600 font-medium">Present: {month.stats.present}</span>
                            <span className="text-red-600 font-medium">Absent: {month.stats.absent}</span>
                            <span className="text-yellow-600 font-medium">Late: {month.stats.late}</span>
                            <span className="text-purple-600 font-medium">Early: {month.stats.early}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="bg-green-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-800">{month.stats.present}</div>
                            <div className="text-green-600 text-sm">Present</div>
                          </div>
                          <div className="bg-red-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-red-800">{month.stats.absent}</div>
                            <div className="text-red-600 text-sm">Absent</div>
                          </div>
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-800">{month.stats.late}</div>
                            <div className="text-yellow-600 text-sm">Late</div>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="text-2xl font-bold text-purple-800">{month.stats.early}</div>
                            <div className="text-purple-600 text-sm">Left Early</div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h5 className="font-semibold text-gray-800">Weekly Breakdown:</h5>
                          {month.weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-700">{week.week}</span>
                                <div className="flex space-x-3 text-xs">
                                  <span className="text-green-600">P: {week.stats.present}</span>
                                  <span className="text-red-600">A: {week.stats.absent}</span>
                                  <span className="text-yellow-600">L: {week.stats.late}</span>
                                  <span className="text-purple-600">E: {week.stats.early}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeView === 'Year' && yearlyData && (
                <div className="p-6">
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-2xl font-bold text-gray-900">Year {yearlyData.year} Overview</h4>
                      <div className="flex space-x-4 text-sm">
                        <span className="text-green-600 font-medium">Present: {yearlyData.stats.present}</span>
                        <span className="text-red-600 font-medium">Absent: {yearlyData.stats.absent}</span>
                        <span className="text-yellow-600 font-medium">Late: {yearlyData.stats.late}</span>
                        <span className="text-purple-600 font-medium">Early: {yearlyData.stats.early}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                      <div className="bg-green-50 p-6 rounded-lg border-t-4 border-green-500">
                        <div className="text-3xl font-bold text-green-800">{yearlyData.stats.present}</div>
                        <div className="text-green-600 font-medium">Total Present</div>
                        <div className="text-green-500 text-sm mt-1">
                          {yearlyData.stats.present > 0 ? 
                            `${((yearlyData.stats.present / (yearlyData.stats.present + yearlyData.stats.absent + yearlyData.stats.late + yearlyData.stats.early)) * 100).toFixed(1)}%` 
                            : '0%'
                          }
                        </div>
                      </div>
                      <div className="bg-red-50 p-6 rounded-lg border-t-4 border-red-500">
                        <div className="text-3xl font-bold text-red-800">{yearlyData.stats.absent}</div>
                        <div className="text-red-600 font-medium">Total Absent</div>
                        <div className="text-red-500 text-sm mt-1">
                          {yearlyData.stats.absent > 0 ? 
                            `${((yearlyData.stats.absent / (yearlyData.stats.present + yearlyData.stats.absent + yearlyData.stats.late + yearlyData.stats.early)) * 100).toFixed(1)}%` 
                            : '0%'
                          }
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-6 rounded-lg border-t-4 border-yellow-500">
                        <div className="text-3xl font-bold text-yellow-800">{yearlyData.stats.late}</div>
                        <div className="text-yellow-600 font-medium">Total Late</div>
                        <div className="text-yellow-500 text-sm mt-1">
                          {yearlyData.stats.late > 0 ? 
                            `${((yearlyData.stats.late / (yearlyData.stats.present + yearlyData.stats.absent + yearlyData.stats.late + yearlyData.stats.early)) * 100).toFixed(1)}%` 
                            : '0%'
                          }
                        </div>
                      </div>
                      <div className="bg-purple-50 p-6 rounded-lg border-t-4 border-purple-500">
                        <div className="text-3xl font-bold text-purple-800">{yearlyData.stats.early}</div>
                        <div className="text-purple-600 font-medium">Total Left Early</div>
                        <div className="text-purple-500 text-sm mt-1">
                          {yearlyData.stats.early > 0 ? 
                            `${((yearlyData.stats.early / (yearlyData.stats.present + yearlyData.stats.absent + yearlyData.stats.late + yearlyData.stats.early)) * 100).toFixed(1)}%` 
                            : '0%'
                          }
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {yearlyData.months.map((month, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <div className="flex justify-between items-center mb-4">
                          <h5 className="text-xl font-bold text-gray-900">{month.month}</h5>
                          <div className="flex space-x-4 text-sm">
                            <span className="text-green-600 font-medium">P: {month.stats.present}</span>
                            <span className="text-red-600 font-medium">A: {month.stats.absent}</span>
                            <span className="text-yellow-600 font-medium">L: {month.stats.late}</span>
                            <span className="text-purple-600 font-medium">E: {month.stats.early}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-white p-3 rounded border-l-4 border-green-500">
                            <div className="text-xl font-bold text-green-800">{month.stats.present}</div>
                            <div className="text-green-600 text-sm">Present</div>
                          </div>
                          <div className="bg-white p-3 rounded border-l-4 border-red-500">
                            <div className="text-xl font-bold text-red-800">{month.stats.absent}</div>
                            <div className="text-red-600 text-sm">Absent</div>
                          </div>
                          <div className="bg-white p-3 rounded border-l-4 border-yellow-500">
                            <div className="text-xl font-bold text-yellow-800">{month.stats.late}</div>
                            <div className="text-yellow-600 text-sm">Late</div>
                          </div>
                          <div className="bg-white p-3 rounded border-l-4 border-purple-500">
                            <div className="text-xl font-bold text-purple-800">{month.stats.early}</div>
                            <div className="text-purple-600 text-sm">Left Early</div>
                          </div>
                        </div>

                        <div className="bg-white rounded-lg p-4">
                          <h6 className="font-semibold text-gray-800 mb-3">Weekly Summary:</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {month.weeks.map((week, weekIndex) => (
                              <div key={weekIndex} className="bg-gray-50 p-3 rounded-lg border">
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-700 text-sm">{week.week}</span>
                                  <div className="flex space-x-2 text-xs">
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded">P: {week.stats.present}</span>
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded">A: {week.stats.absent}</span>
                                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">L: {week.stats.late}</span>
                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">E: {week.stats.early}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}