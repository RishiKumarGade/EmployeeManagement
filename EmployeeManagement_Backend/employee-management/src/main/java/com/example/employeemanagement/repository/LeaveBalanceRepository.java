package com.example.employeemanagement.repository;

import com.example.employeemanagement.model.LeaveBalance;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface LeaveBalanceRepository extends MongoRepository<LeaveBalance, String> {
    LeaveBalance findByEmployeeMail(String employeeMail);
}
