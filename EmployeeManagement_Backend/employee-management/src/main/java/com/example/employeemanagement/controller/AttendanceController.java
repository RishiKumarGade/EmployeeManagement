package com.example.employeemanagement.controller;

import com.example.employeemanagement.dto.AttendanceUpdateRequest;
import com.example.employeemanagement.model.Attendance;
import com.example.employeemanagement.model.Employee;
import com.example.employeemanagement.repository.AttendanceRepository;
import com.example.employeemanagement.repository.EmployeeRepository;

import com.example.employeemanagement.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;


@RestController
@RequestMapping("/hr/attendance")
@PreAuthorize("hasRole('HR')")
public class AttendanceController {

    @Autowired
    private AttendanceRepository attendanceRepo;
    @Autowired
    private EmployeeRepository employeeRepo;
    @Autowired
    private AttendanceService attendanceService;

    @PostMapping("/generate")
    public ResponseEntity<String> generateTodayAttendance() {
        System.out.println("tried generating attendance");
        LocalDate today = LocalDate.now();
        List<Employee> employees = employeeRepo.findByRoleIgnoreCase("EMPLOYEE");

        for (Employee emp : employees) {
            Optional<Attendance> existing = attendanceRepo.findByEmployeeMailAndDate(emp.getMail(), today);
            if (existing.isEmpty()) {
                Attendance att = new Attendance();
                att.setEmployeeMail(emp.getMail());
                att.setDate(today);
                att.setStatus("Absent");
                attendanceRepo.save(att);
            }
        }

        return ResponseEntity.ok("✅ Attendance records created for today.");
    }

    @PutMapping("/update")
    public ResponseEntity<String> updateAttendance(@RequestParam String mail, @RequestParam String date, @RequestParam String status) {
        LocalDate localDate = LocalDate.parse(date);
        Optional<Attendance> existing = attendanceRepo.findByEmployeeMailAndDate(mail, localDate);
        if (existing.isPresent()) {
            Attendance att = existing.get();
            att.setStatus(status);
            attendanceRepo.save(att);
            return ResponseEntity.ok("✅ Attendance updated.");
        }
        return ResponseEntity.badRequest().body("❌ No attendance record found for that date.");
    }

    @PreAuthorize("hasRole('HR')")
    @PutMapping("/mark-present")
    public ResponseEntity<String> markPresent(@RequestBody AttendanceUpdateRequest request) {
        return attendanceService.markEmployeePresent(request.getMail(), request.getDate());
    }


    @GetMapping("/day")
    public List<Attendance> getDayAttendance(@RequestParam String date) {
        return attendanceRepo.findByDate(LocalDate.parse(date));
    }
    @GetMapping("/range")
    public List<Attendance> getAttendanceRange(
            @RequestParam String start,
            @RequestParam String end) {
        return attendanceRepo.findByDateBetween(
                LocalDate.parse(start),
                LocalDate.parse(end)
        );
    }


}
