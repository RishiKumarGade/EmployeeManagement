package com.example.employeemanagement.controller;

import com.example.employeemanagement.model.EmployeeData;
import com.example.employeemanagement.repository.EmployeeDataRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("/api/employeedata")
public class EmployeeDataController {

    @Autowired
    private EmployeeDataRepository dataRepo;

    @PostMapping
    public EmployeeData createData(@RequestBody EmployeeData data) {
        return dataRepo.save(data);
    }

    @GetMapping("/emp/{empId}")
    public List<EmployeeData> getByEmpId(@PathVariable String empId) {
        return dataRepo.findByEmpId(empId);
    }

    @GetMapping("/{id}")
    public EmployeeData getById(@PathVariable String id) {
        return dataRepo.findById(id).orElseThrow();
    }

    @PutMapping("/{id}")
    public EmployeeData updateData(@PathVariable String id, @RequestBody EmployeeData data) {
        EmployeeData existing = dataRepo.findById(id).orElseThrow();
        existing.setDob(data.getDob());
        existing.setGender(data.getGender());
        existing.setMobile(data.getMobile());
        existing.setAddress(data.getAddress());
        return dataRepo.save(existing);
    }

    @DeleteMapping("/{id}")
    public void deleteData(@PathVariable String id) {
        dataRepo.deleteById(id);
    }
}
