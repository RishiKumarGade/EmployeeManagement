package com.example.employeemanagement.dto;

import com.example.employeemanagement.model.Employee;
import com.example.employeemanagement.model.EmployeeData;

public class EmployeeProfileDTO {
    private Employee employee;
    private EmployeeData employeeData;

    public EmployeeProfileDTO(Employee employee, EmployeeData employeeData) {
        this.employee = employee;
        this.employeeData = employeeData;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public EmployeeData getEmployeeData() {
        return employeeData;
    }

    public void setEmployeeData(EmployeeData employeeData) {
        this.employeeData = employeeData;
    }
}
