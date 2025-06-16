package com.example.employeemanagement.dto;

public class AttendanceUpdateRequest {
    private String mail;
    private String date;

    public String getMail() {
        return mail;
    }

    public void setMail(String mail) {
        this.mail = mail;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }
}
