package com.example.employeemanagement.controller;

import com.example.employeemanagement.model.LeaveBalance;
import com.example.employeemanagement.model.LeaveRequest;
import com.example.employeemanagement.repository.EmployeeRepository;
import com.example.employeemanagement.repository.LeaveBalanceRepository;
import com.example.employeemanagement.repository.LeaveRequestRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/leave")
public class LeaveController {

    @Autowired
    private LeaveRequestRepository leaveRepo;

    @Autowired
    private LeaveBalanceRepository leaveBalanceRepo;

    @Autowired
    private EmployeeRepository employeeRepo;

    // 🧑‍💼 Employee - Submit request
    @PostMapping("/request-leave")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ResponseEntity<String> requestLeave(@RequestBody LeaveRequest request) {
        System.out.println("hehe");
        if (request.getStartDate().isAfter(request.getEndDate())) {
            return ResponseEntity.badRequest().body("❌ Start date cannot be after end date.");
        }

        if (request.getReason() == null || request.getReason().trim().isEmpty() ||
                request.getLeaveType() == null || request.getLeaveType().trim().isEmpty() ||
                request.getWorkHandoverDetails() == null || request.getWorkHandoverDetails().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("❌ All fields must be filled.");
        }

        int days = Period.between(request.getStartDate(), request.getEndDate()).getDays() + 1;
        request.setTotalDays(days);
        request.setStatus("Pending");

        LeaveBalance balance = leaveBalanceRepo.findByEmployeeMail(request.getEmployeeMail());
        if (balance == null) return ResponseEntity.badRequest().body("❌ Leave balance not found.");

        switch (request.getLeaveType()) {
            case "Annual":
                if (balance.getAnnualLeave() < days) return ResponseEntity.badRequest().body("❌ Insufficient annual leave.");
                break;
            case "Sick":
                if (balance.getSickLeave() < days) return ResponseEntity.badRequest().body("❌ Insufficient sick leave.");
                break;
            case "Personal":
                if (balance.getPersonalLeave() < days) return ResponseEntity.badRequest().body("❌ Insufficient personal leave.");
                break;
            case "Emergency":
                if (balance.getEmergencyLeave() < days) return ResponseEntity.badRequest().body("❌ Insufficient emergency leave.");
                break;
            default:
                return ResponseEntity.badRequest().body("❌ Invalid leave type.");
        }

        leaveRepo.save(request);
        return ResponseEntity.ok("✅ Leave request submitted.");
    }

    // 👩‍💼 HR - View all requests
    @GetMapping("/all")
    @PreAuthorize("hasRole('HR')")
    public List<LeaveRequest> getAllRequests() {
        return leaveRepo.findAll();
    }

    // 👩‍💼 HR - Approve or Reject with reason
    @PutMapping("/action")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<String> actOnRequest(@RequestParam String requestId,
                                               @RequestParam String status,
                                               @RequestParam String hrMail,
                                               @RequestParam(required = false) String reason) {
        Optional<LeaveRequest> opt = leaveRepo.findById(requestId);
        if (opt.isEmpty()) return ResponseEntity.badRequest().body("❌ Request not found");

        LeaveRequest request = opt.get();
        if (!request.getStatus().equalsIgnoreCase("Pending")) {
            return ResponseEntity.badRequest().body("⚠️ Already handled by " + request.getReviewedBy());
        }

        request.setStatus(status);
        request.setReviewedBy(hrMail);
        request.setDecisionDate(LocalDate.now());
        request.setDecisionReason(reason != null ? reason : "");

        // If approved, deduct from balance
        if (status.equalsIgnoreCase("Approved")) {
            LeaveBalance balance = leaveBalanceRepo.findByEmployeeMail(request.getEmployeeMail());
            int days = request.getTotalDays();

            switch (request.getLeaveType()) {
                case "Annual":
                    balance.setAnnualLeave(balance.getAnnualLeave() - days); break;
                case "Sick":
                    balance.setSickLeave(balance.getSickLeave() - days); break;
                case "Personal":
                    balance.setPersonalLeave(balance.getPersonalLeave() - days); break;
                case "Emergency":
                    balance.setEmergencyLeave(balance.getEmergencyLeave() - days); break;
            }
            leaveBalanceRepo.save(balance);
        }

        leaveRepo.save(request);
        return ResponseEntity.ok("✅ Request " + status + " by " + hrMail);
    }

    // 🧑‍💼 Employee - View their own requests
    @GetMapping("/my-requests")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public List<LeaveRequest> myRequests(@RequestParam String mail) {
        return leaveRepo.findByEmployeeMail(mail);
    }

    // 👩‍💼 HR - Update leave balance manually
    @PutMapping("/update-balance")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<String> updateLeaveBalance(@RequestBody LeaveBalance newBalance) {
        LeaveBalance existing = leaveBalanceRepo.findByEmployeeMail(newBalance.getEmployeeMail());
        if (existing == null) return ResponseEntity.badRequest().body("❌ Employee not found.");

        existing.setAnnualLeave(newBalance.getAnnualLeave());
        existing.setSickLeave(newBalance.getSickLeave());
        existing.setPersonalLeave(newBalance.getPersonalLeave());
        existing.setEmergencyLeave(newBalance.getEmergencyLeave());
        leaveBalanceRepo.save(existing);

        return ResponseEntity.ok("✅ Leave balance updated.");
    }
    // 🧑‍💼 Employee - View their leave balance
    @GetMapping("/balance")
    @PreAuthorize("hasAnyRole('EMPLOYEE', 'HR')")
    public ResponseEntity<?> getLeaveBalance(@RequestParam String mail) {
        LeaveBalance balance = leaveBalanceRepo.findByEmployeeMail(mail);
        if (balance == null) {
            return ResponseEntity.badRequest().body("❌ Leave balance not found for " + mail);
        }
        return ResponseEntity.ok(balance);
    }

}
