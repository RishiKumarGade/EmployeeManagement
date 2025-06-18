'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

type Employee = {
  id?: string;
  name: string;
  mail: string;
  pass: string;
  role: string;
  department: string;
  jobRole: string;
  salary: number;
  profilePicUrl?: string;
};

type EmployeeData = {
  id?: string;
  empId?: string;
  empMail: string;
  dob?: string;
  gender?: string;
  mobile?: string;
  address?: string;
};

type EmployeeProfile = {
  employee: Employee;
  employeeData?: EmployeeData;
};

type SearchCriteria = 'name' | 'email' | 'department' | 'jobRole';

export default function HRDashboard() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeProfile[]>([]);
  const [form, setForm] = useState<Employee>({
    name: '',
    mail: '',
    pass: '',
    role: 'EMPLOYEE',
    department: '',
    jobRole: '',
    salary: 0,
  });
  const [employeeDataForm, setEmployeeDataForm] = useState<EmployeeData>({
    empMail: '',
    dob: '',
    gender: '',
    mobile: '',
    address: '',
  });

  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>('name');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const fetchEmployees = async () => {
    const loadingToast = toast.loading('Loading employees...');
    
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE}/hr/manage/employees?role=EMPLOYEE`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const employeeProfiles = res.data.map((profile: any) => ({
        employee: profile.employee,
        employeeData: profile.employeeData,
      }));
      
      setEmployees(employeeProfiles);
      setFilteredEmployees(employeeProfiles);
      
      toast.success('Employees loaded successfully', { 
        id: loadingToast,
        duration: 2000 
      });
    } catch (err) {
      console.error('Failed to fetch employees', err);
      toast.error('Failed to load employees. Please try again.', { 
        id: loadingToast,
        duration: 4000 
      });
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    let filtered = employees.filter(profile => {
      const emp = profile.employee;
      
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      
      switch (searchCriteria) {
        case 'name':
          return emp.name.toLowerCase().includes(searchLower);
        case 'email':
          return emp.mail.toLowerCase().includes(searchLower);
        case 'department':
          return emp.department.toLowerCase().includes(searchLower);
        case 'jobRole':
          return emp.jobRole.toLowerCase().includes(searchLower);
        default:
          return true;
      }
    });
    
    setFilteredEmployees(filtered);
    setCurrentPage(1);
  }, [searchTerm, searchCriteria, employees]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('Employee name is required');
      return;
    }
    if (!form.mail.trim()) {
      toast.error('Email address is required');
      return;
    }
    if (!editId && !form.pass.trim()) {
      toast.error('Password is required for new employees');
      return;
    }
    if (!form.department.trim()) {
      toast.error('Department is required');
      return;
    }
    if (!form.jobRole.trim()) {
      toast.error('Job role is required');
      return;
    }
    if (form.salary <= 0) {
      toast.error('Please enter a valid salary amount');
      return;
    }

    const loadingToast = toast.loading(editId ? 'Updating employee...' : 'Adding employee...');

    try {
      if (editId) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_BASE}/hr/manage/employee`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Employee updated successfully!', { 
          id: loadingToast,
          duration: 3000 
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_BASE}/hr/manage/employee`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Employee added successfully!', { 
          id: loadingToast,
          duration: 3000 
        });
      }
      resetForm();
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          `Failed to ${editId ? 'update' : 'add'} employee`;
      
      toast.error(errorMessage, { 
        id: loadingToast,
        duration: 4000 
      });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await new Promise((resolve) => {
      toast.custom((t) => (
        <div className="bg-white p-6 rounded-lg shadow-lg border max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-gray-900">Delete Employee</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        position: 'top-center',
      });
    });

    if (!result) return;

    const loadingToast = toast.loading('Deleting employee...');
    
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE}/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      toast.success('Employee deleted successfully', { 
        id: loadingToast,
        duration: 3000 
      });
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          'Failed to delete employee';
      
      toast.error(errorMessage, { 
        id: loadingToast,
        duration: 4000 
      });
    }
  };

  const handleEdit = (profile: EmployeeProfile) => {
    setForm({ ...profile.employee, pass: '' });
    setEditId(profile.employee.mail || null);
    setShowForm(true);
    toast(`Editing ${profile.employee.name}`, { duration: 2000 });
  };

  const resetForm = () => {
    setForm({
      name: '',
      mail: '',
      pass: '',
      role: 'EMPLOYEE',
      department: '',
      jobRole: '',
      salary: 0,
    });
    setEditId(null);
    setShowForm(false);
  };

  const toggleEmployeeSelection = (id: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedEmployees(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedEmployees.size === filteredEmployees.length) {
      setSelectedEmployees(new Set());
      toast('All employees deselected', {
    icon: 'ℹ️'
  });
    } else {
      setSelectedEmployees(new Set(filteredEmployees.map(p => p.employee.id || '')));
toast(`${filteredEmployees.length} employees selected`, {
  icon: '✅'
});    }
  };



  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };




  const getSearchPlaceholder = () => {
    switch (searchCriteria) {
      case 'name':
        return 'Search by employee name...';
      case 'email':
        return 'Search by email address...';
      case 'department':
        return 'Search by department...';
      case 'jobRole':
        return 'Search by job role...';
      default:
        return 'Search employees...';
    }
  };

  const stats = {
    total: employees.length
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#374151',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
          },
        }}
      />

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Management</h2>
            <p className="text-gray-600">Manage and organize your workforce effectively</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
          >
            <span>➕</span>
            Add New Employee
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">Search By:</label>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchCriteria"
                    value="name"
                    checked={searchCriteria === 'name'}
                    onChange={(e) => setSearchCriteria(e.target.value as SearchCriteria)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Name</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchCriteria"
                    value="email"
                    checked={searchCriteria === 'email'}
                    onChange={(e) => setSearchCriteria(e.target.value as SearchCriteria)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchCriteria"
                    value="department"
                    checked={searchCriteria === 'department'}
                    onChange={(e) => setSearchCriteria(e.target.value as SearchCriteria)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Department</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="searchCriteria"
                    value="jobRole"
                    checked={searchCriteria === 'jobRole'}
                    onChange={(e) => setSearchCriteria(e.target.value as SearchCriteria)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">Job Role</span>
                </label>
              </div>
            </div>
            <div className="flex-1 max-w-md relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  searchTerm 
                    ? 'bg-blue-50 border-blue-200 text-gray-900' 
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              />
            </div>

            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  toast.success('Search cleared');
                }}
                className="self-start px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-blue-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.total}</div>
            <div className="text-gray-600 font-medium">Total Employees</div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 border-t-4 border-green-500">
            <div className="text-3xl font-bold text-gray-900 mb-2">{filteredEmployees.length}</div>
            <div className="text-gray-600 font-medium">Filtered Results</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {searchTerm ? `Search Results for "${searchTerm}"` : 'All Employees'}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.size === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Employee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Job Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Salary</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🔍</span>
                        <p className="text-lg font-medium">No employees found</p>
                        <p className="text-sm">Try adjusting your search criteria</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentItems.map((profile) => (
                    <tr key={profile.employee.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.has(profile.employee.id || '')}
                          onChange={() => toggleEmployeeSelection(profile.employee.id || '')}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-sm">
                            {getInitials(profile.employee.name)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{profile.employee.name}</div>
                            <div className="text-sm text-gray-500">{profile.employee.mail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{profile.employee.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{profile.employee.jobRole}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">₹{profile.employee.salary.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(profile)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(profile.employee.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredEmployees.length)} of {filteredEmployees.length} employees
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ❮
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 border rounded-lg text-sm ${
                      currentPage === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ❯
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editId ? 'Edit' : 'Add'} Employee</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="mail"
                type="email"
                value={form.mail}
                onChange={handleChange}
                placeholder="Email Address"
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="pass"
                type="password"
                value={form.pass}
                onChange={handleChange}
                placeholder="Password"
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="department"
                type="text"
                value={form.department}
                onChange={handleChange}
                placeholder="Department"
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="jobRole"
                type="text"
                value={form.jobRole}
                onChange={handleChange}
                placeholder="Job Role"
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="salary"
                type="number"
                value={form.salary}
                onChange={handleChange}
                placeholder="Salary"
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="HR">HR</option>
              </select>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                {editId ? 'Update' : 'Add'} Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}