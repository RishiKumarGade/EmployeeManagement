package com.example.employeemanagement.service;

import com.example.employeemanagement.model.Attendance;
import com.example.employeemanagement.model.Employee;
import com.example.employeemanagement.repository.AttendanceRepository;
import com.example.employeemanagement.repository.EmployeeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Optional;

@Service
public class AttendanceService {
    private static final Logger logger = LoggerFactory.getLogger(AttendanceService.class);

// inside autoCreateDailyAttendance()

    @Autowired
    private EmployeeRepository employeeRepo;

    @Autowired
    private AttendanceRepository attendanceRepo;

    public ResponseEntity<String> markEmployeePresent(String mail, String dateStr) {
        Optional<Employee> employeeOpt = employeeRepo.findByMail(mail);
        if (employeeOpt.isEmpty() || !employeeOpt.get().getRole().equalsIgnoreCase("EMPLOYEE")) {
            return ResponseEntity.badRequest().body("❌ Employee not found or invalid role");
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateStr); // e.g., "2025-06-12"
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body("❌ Invalid date format (Expected: yyyy-MM-dd)");
        }

        Optional<Attendance> attendanceOpt = attendanceRepo.findByEmployeeMailAndDate(mail, date);
        if (attendanceOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("❌ Attendance record not found for that date");
        }

        Attendance attendance = attendanceOpt.get();
        attendance.setStatus("Present");
        attendanceRepo.save(attendance);

        return ResponseEntity.ok("✅ Marked Present for " + mail + " on " + date);
    }


    // Automatically creates "Absent" attendance records for all EMPLOYEEs every day
    @Scheduled(cron = "0 0 0 * * ?") // Runs every day at midnight
    public void autoCreateDailyAttendance() {
        List<Employee> employees = employeeRepo.findByRoleIgnoreCase("EMPLOYEE");
        LocalDate today = LocalDate.now();
        logger.info("Running daily attendance generation for {}", today);
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
    }
}
