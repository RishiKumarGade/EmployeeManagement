package com.example.employeemanagement.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "leave_balances")
public class LeaveBalance {
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmployeeMail() {
        return employeeMail;
    }

    public void setEmployeeMail(String employeeMail) {
        this.employeeMail = employeeMail;
    }

    public int getAnnualLeave() {
        return annualLeave;
    }

    public void setAnnualLeave(int annualLeave) {
        this.annualLeave = annualLeave;
    }

    public int getSickLeave() {
        return sickLeave;
    }

    public void setSickLeave(int sickLeave) {
        this.sickLeave = sickLeave;
    }

    public int getPersonalLeave() {
        return personalLeave;
    }

    public void setPersonalLeave(int personalLeave) {
        this.personalLeave = personalLeave;
    }

    public int getEmergencyLeave() {
        return emergencyLeave;
    }

    public void setEmergencyLeave(int emergencyLeave) {
        this.emergencyLeave = emergencyLeave;
    }

    @Id
    private String id;
    private String employeeMail;
    private int annualLeave;
    private int sickLeave;
    private int personalLeave;
    private int emergencyLeave;

}
