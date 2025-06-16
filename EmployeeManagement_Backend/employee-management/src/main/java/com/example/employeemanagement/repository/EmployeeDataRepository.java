package com.example.employeemanagement.repository;


import com.example.employeemanagement.model.EmployeeData;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;


public interface EmployeeDataRepository extends MongoRepository<EmployeeData, String> {
    List<EmployeeData> findByEmpId(String empId);
    EmployeeData findByEmpMail(String mail);
    List<EmployeeData> findByGenderIgnoreCase(String gender);
}
