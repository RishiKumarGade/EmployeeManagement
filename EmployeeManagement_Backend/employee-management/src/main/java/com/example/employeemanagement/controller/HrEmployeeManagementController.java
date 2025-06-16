package com.example.employeemanagement.controller;

import com.example.employeemanagement.model.Employee;
import com.example.employeemanagement.model.EmployeeData;
import com.example.employeemanagement.model.LeaveBalance;
import com.example.employeemanagement.repository.EmployeeRepository;
import com.example.employeemanagement.repository.EmployeeDataRepository;
import com.example.employeemanagement.dto.EmployeeProfileDTO;

import com.example.employeemanagement.repository.LeaveBalanceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/hr/manage")
public class HrEmployeeManagementController {

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepo;

    @Autowired
    private EmployeeRepository employeeRepo;

    @Autowired
    private EmployeeDataRepository employeeDataRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PreAuthorize("hasRole('HR')")
    @PostMapping("/employee")
    public ResponseEntity<String> createEmployee(@RequestBody Employee employee) {
        employee.setPass(passwordEncoder.encode(employee.getPass()));
        employee.setRole("EMPLOYEE");
        employeeRepo.save(employee);
        LeaveBalance balance = new LeaveBalance();
        balance.setEmployeeMail(employee.getMail());
        balance.setAnnualLeave(15);
        balance.setSickLeave(8);
        balance.setPersonalLeave(3);
        balance.setEmergencyLeave(2);
        leaveBalanceRepo.save(balance);
        return ResponseEntity.ok("✅ Employee created with mail: " + employee.getMail());
    }

    @PreAuthorize("hasRole('HR')")
    @PostMapping("/employee-data/{mail}")
    public ResponseEntity<String> createOrUpdateData(@PathVariable String mail, @RequestBody EmployeeData data) {
        Optional<Employee> optionalEmp = employeeRepo.findByMail(mail);
        if (optionalEmp.isEmpty()) {
            return ResponseEntity.badRequest().body("❌ No employee found with mail: " + mail);
        }

        EmployeeData existing = employeeDataRepo.findByEmpMail(mail);
        data.setEmpMail(mail);

        if (existing != null) {
            existing.setDob(data.getDob());
            existing.setGender(data.getGender());
            existing.setMobile(data.getMobile());
            existing.setAddress(data.getAddress());
            employeeDataRepo.save(existing);
            return ResponseEntity.ok("✅ Employee data updated for: " + mail);
        } else {
            employeeDataRepo.save(data);
            return ResponseEntity.ok("✅ Employee data created for: " + mail);
        }
    }

    @PreAuthorize("hasRole('HR')")
    @GetMapping("/employee-data/{mail}")
    public ResponseEntity<EmployeeData> getEmployeeData(@PathVariable String mail) {
        EmployeeData data = employeeDataRepo.findByEmpMail(mail);
        if (data == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(data);
    }

    @PreAuthorize("hasRole('HR')")
    @PutMapping("/employee")
    public ResponseEntity<String> updateEmployee(@RequestBody Employee updated) {
        if (updated.getMail() == null || updated.getMail().isBlank()) {
            return ResponseEntity.badRequest().body("❌ Employee mail is required.");
        }

        Optional<Employee> opt = employeeRepo.findByMail(updated.getMail());
        if (opt.isEmpty()) return ResponseEntity.badRequest().body("❌ No employee found with mail: " + updated.getMail());

        Employee emp = opt.get();

        emp.setName(updated.getName());
        emp.setDepartment(updated.getDepartment());
        emp.setJobRole(updated.getJobRole());
        emp.setSalary(updated.getSalary());

        if (updated.getPass() != null && !updated.getPass().isBlank()) {
            emp.setPass(passwordEncoder.encode(updated.getPass()));
        }

        employeeRepo.save(emp);
        return ResponseEntity.ok("✅ Employee updated for mail: " + updated.getMail());
    }



    @PreAuthorize("hasRole('HR')")
    @GetMapping("/employees")
    public ResponseEntity<List<EmployeeProfileDTO>> getEmployees(
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String department,
            @RequestParam(required = false) Integer age,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "mail") String sort,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        Sort.Direction sortDir = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDir, sort));

        List<Employee> pagedEmployees = employeeRepo.findAll(pageable).getContent();

        List<EmployeeProfileDTO> result = pagedEmployees.stream()
                .map(emp -> new EmployeeProfileDTO(emp, employeeDataRepo.findByEmpMail(emp.getMail())))
                .filter(dto -> {
                    if (gender != null && (dto.getEmployeeData() == null ||
                            !gender.equalsIgnoreCase(dto.getEmployeeData().getGender()))) return false;
                    if (role != null && !dto.getEmployee().getRole().equalsIgnoreCase(role)) return false;
                    if (name != null && (dto.getEmployee().getName() == null ||
                            !dto.getEmployee().getName().toLowerCase().contains(name.toLowerCase()))) return false;
                    if (department != null && !department.equalsIgnoreCase(dto.getEmployee().getDepartment())) return false;

                    if (age != null && dto.getEmployeeData() != null && dto.getEmployeeData().getDob() != null) {
                        LocalDate dob = dto.getEmployeeData().getDob();
                        if (dob == null) return false;

                        int calculatedAge = Period.between(dob, LocalDate.now()).getYears();
                        return calculatedAge == age;
                    }

                    return true;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }


    @PreAuthorize("hasRole('HR')")
    @GetMapping("/employees/with-data/{mail}")
    public ResponseEntity<EmployeeProfileDTO> getEmployeeAndData(@PathVariable String mail) {
        Optional<Employee> employeeOpt = employeeRepo.findByMail(mail);
        if (employeeOpt.isEmpty()) return ResponseEntity.notFound().build();
        EmployeeData data = employeeDataRepo.findByEmpMail(mail);
        return ResponseEntity.ok(new EmployeeProfileDTO(employeeOpt.get(), data));
    }
}
