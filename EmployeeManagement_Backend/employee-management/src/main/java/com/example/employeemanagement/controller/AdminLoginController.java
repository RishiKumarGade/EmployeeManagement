package com.example.employeemanagement.controller;

import com.example.employeemanagement.security.JwtUtil;
import com.example.employeemanagement.service.AdminDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/admin")
public class AdminLoginController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private AdminDetailsService adminDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");
        System.out.println(username + " " + password);

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
        } catch (Exception e) {
            e.printStackTrace(); // Log exact reason (e.g., BadCredentialsException)
            return ResponseEntity.status(401).body("❌ Invalid credentials");
        }

        UserDetails userDetails = adminDetailsService.loadUserByUsername(username);
        System.out.println(userDetails.getUsername());

        String role = userDetails.getAuthorities().stream()
                .findFirst().map(GrantedAuthority::getAuthority).orElse("ROLE_ADMIN");

        System.out.println(role);

        String token = jwtUtil.generateToken(userDetails.getUsername(), role.replace("ROLE_", ""));
        Map<String, String> response = new HashMap<>();
        response.put("token", token);

        System.out.println(token);
        return ResponseEntity.ok(response);
    }
}
