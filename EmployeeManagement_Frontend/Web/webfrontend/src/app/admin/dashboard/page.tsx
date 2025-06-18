'use client';

import { useState } from 'react';

export default function AdminDashboard() {
  const [form, setForm] = useState({
    name: '',
    mail: '',
    pass: '',
    role: 'EMPLOYEE',
    department: '',
    jobRole: '',
    salary: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials:"include",
      body: JSON.stringify({ ...form, salary: parseFloat(form.salary) }),
    });

    const data = await res.text();
    alert(data);
    setForm({
    name: '',
    mail: '',
    pass: '',
    role: 'EMPLOYEE',
    department: '',
    jobRole: '',
    salary: '',
  });

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-xl">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Admin Dashboard</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="mail"
              value={form.mail}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Email address"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="pass"
              value={form.pass}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Set a password"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="EMPLOYEE">Employee</option>
              <option value="HR">HR</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Department</label>
            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Department name"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Job Role</label>
            <input
              type="text"
              name="jobRole"
              value={form.jobRole}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. Developer, Manager"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">Salary (₹)</label>
            <input
              type="number"
              step="0.01"
              name="salary"
              value={form.salary}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Monthly salary"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition"
          >
            Add {form.role}
          </button>
        </form>
      </div>
    </div>
  );
}
