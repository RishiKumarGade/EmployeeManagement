package com.example.employeemanagement.controller;

import com.example.employeemanagement.model.Employee;
import com.example.employeemanagement.repository.EmployeeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/users")
public class AdminUserManagementController {

    @Autowired
    private EmployeeRepository employeeRepo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/create")
    public ResponseEntity<String> createUser(@RequestBody Employee user) {
        if (user.getMail() == null || user.getPass() == null || user.getRole() == null) {
            return ResponseEntity.badRequest().body("Missing required fields: mail, pass, or role.");
        }
        System.out.println(user.getMail() + user.getPass()+user.getRole());

        if (!user.getRole().equalsIgnoreCase("HR") && !user.getRole().equalsIgnoreCase("EMPLOYEE")) {
            return ResponseEntity.badRequest().body("Invalid role. Only 'HR' or 'EMPLOYEE' allowed.");
        }

        if (employeeRepo.findByMail(user.getMail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("A user with this email already exists.");
        }
        System.out.println("done");
        user.setPass(passwordEncoder.encode(user.getPass()));
        user.setRole(user.getRole().toUpperCase());
        employeeRepo.save(user);

        return ResponseEntity.ok("✅ User with role " + user.getRole() + " created successfully.");
    }
}
