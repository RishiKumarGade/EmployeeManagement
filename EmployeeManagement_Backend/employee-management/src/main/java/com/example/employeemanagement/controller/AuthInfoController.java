package com.example.employeemanagement.controller;

import com.example.employeemanagement.dto.UserDetailsResponse;
import com.example.employeemanagement.model.Admin;
import com.example.employeemanagement.model.Employee;
import com.example.employeemanagement.repository.AdminRepository;
import com.example.employeemanagement.repository.EmployeeRepository;
import com.example.employeemanagement.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
public class AuthInfoController {

    @Autowired
    private JwtUtil jwtTokenUtil;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AdminRepository adminRepository;

    @GetMapping("/me")
    public ResponseEntity<?> getMyDetails(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        String identifier = jwtTokenUtil.extractUsername(token);
        String role = jwtTokenUtil.extractRole(token);

        if ("ADMIN".equalsIgnoreCase(role)) {
            Optional<Admin> adminOpt = adminRepository.findByUsername(identifier);
            if (adminOpt.isEmpty()) return ResponseEntity.status(404).body("Admin not found");

            Admin admin = adminOpt.get();
            UserDetailsResponse response = new UserDetailsResponse(
                    admin.getUsername(),
                    admin.getUsername(),
                    "ADMIN",
                    null,
                    null
            );
            return ResponseEntity.ok(response);
        }

        Optional<Employee> employeeOpt = employeeRepository.findByMail(identifier);
        if (employeeOpt.isEmpty()) return ResponseEntity.status(404).body("User not found");

        Employee emp = employeeOpt.get();
        UserDetailsResponse response = new UserDetailsResponse(
                emp.getName(),
                emp.getMail(),
                emp.getRole(),
                emp.getDepartment(),
                emp.getJobRole()
        );
        return ResponseEntity.ok(response);
    }
}
