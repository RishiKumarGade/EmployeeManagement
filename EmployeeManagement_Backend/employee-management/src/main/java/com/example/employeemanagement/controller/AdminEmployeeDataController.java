package com.example.employeemanagement.controller;

import com.example.employeemanagement.model.EmployeeData;
import com.example.employeemanagement.repository.EmployeeDataRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/admin/employeedata")
public class AdminEmployeeDataController {

    @Autowired
    private EmployeeDataRepository dataRepo;

    @PostMapping("/{empId}")
    public ResponseEntity<?> createByEmpId(@PathVariable String empId, @RequestBody EmployeeData data) {
        if (!dataRepo.findByEmpId(empId).isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("❌ Data for empId already exists.");
        }
        data.setEmpId(empId);
        return ResponseEntity.ok(dataRepo.save(data));
    }

    @PutMapping("/{empId}")
    public ResponseEntity<?> updateByEmpId(@PathVariable String empId, @RequestBody EmployeeData data) {
        List<EmployeeData> existingList = dataRepo.findByEmpId(empId);
        if (existingList.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("❌ No data found for empId.");
        }

        EmployeeData existing = existingList.get(0);
        existing.setDob(data.getDob());
        existing.setGender(data.getGender());
        existing.setMobile(data.getMobile());
        existing.setAddress(data.getAddress());

        return ResponseEntity.ok(dataRepo.save(existing));
    }
}
