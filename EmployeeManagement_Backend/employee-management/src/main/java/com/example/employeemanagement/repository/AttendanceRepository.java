package com.example.employeemanagement.repository;

import com.example.employeemanagement.model.Attendance;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends MongoRepository<Attendance, String> {
    List<Attendance> findByDate(LocalDate date);
    List<Attendance> findByEmployeeMailAndDateBetween(String mail, LocalDate start, LocalDate end);
    Optional<Attendance> findByEmployeeMailAndDate(String mail, LocalDate date);
    List<Attendance> findByDateBetween(LocalDate parse, LocalDate parse1);
}
