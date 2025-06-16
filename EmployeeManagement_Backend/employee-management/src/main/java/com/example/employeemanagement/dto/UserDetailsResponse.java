package com.example.employeemanagement.dto;

public class UserDetailsResponse {
    private String name;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    private String email;
    private String role;
    private String department;
    private String jobRole;

    // Constructors
    public UserDetailsResponse() {}

    public UserDetailsResponse(String name, String email, String role, String department, String jobRole) {
        this.name = name;
        this.email = email;
        this.role = role;
        this.department = department;
        this.jobRole = jobRole;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getJobRole() {
        return jobRole;
    }

    public void setJobRole(String jobRole) {
        this.jobRole = jobRole;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
// Getters and Setters
    // (Generate using your IDE or Lombok if you prefer)
}
