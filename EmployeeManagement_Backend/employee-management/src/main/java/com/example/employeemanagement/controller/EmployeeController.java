package com.example.employeemanagement.controller;

import com.example.employeemanagement.model.Employee;
import com.example.employeemanagement.model.LeaveBalance;
import com.example.employeemanagement.repository.EmployeeRepository;
import com.example.employeemanagement.repository.LeaveBalanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    @Autowired
    private LeaveBalanceRepository leaveBalanceRepo;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public Employee createEmployee(@RequestBody Employee employee) {
        // Only ADMIN can create HR users
        if ("HR".equalsIgnoreCase(employee.getRole())) {
            if (!SecurityContextHolder.getContext().getAuthentication().getAuthorities()
                    .contains(new SimpleGrantedAuthority("ROLE_ADMIN"))) {
                throw new AccessDeniedException("Only ADMIN can create HR users.");
            }
        }

        // Encode password
        employee.setPass(passwordEncoder.encode(employee.getPass()));
        LeaveBalance balance = new LeaveBalance();
        balance.setEmployeeMail(employee.getMail());
        balance.setAnnualLeave(15);
        balance.setSickLeave(8);
        balance.setPersonalLeave(3);
        balance.setEmergencyLeave(2);
        leaveBalanceRepo.save(balance);

        return employeeRepository.save(employee);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public Optional<Employee> getEmployeeById(@PathVariable String id) {
        return employeeRepository.findById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR')")
    public Employee updateEmployee(@PathVariable String id, @RequestBody Employee updatedEmployee) {
        updatedEmployee.setId(id);
        return employeeRepository.save(updatedEmployee);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteEmployee(@PathVariable String id) {
        employeeRepository.deleteById(id);
    }
}
