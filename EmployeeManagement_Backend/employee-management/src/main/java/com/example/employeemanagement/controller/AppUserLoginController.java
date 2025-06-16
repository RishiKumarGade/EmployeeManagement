package com.example.employeemanagement.controller;

import com.example.employeemanagement.security.JwtUtil;
import com.example.employeemanagement.service.AppUserDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AppUserLoginController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private AppUserDetailsService appUserDetailsService;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("mail");
        String password = request.get("password");
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );
        } catch (Exception e) {
            e.printStackTrace(); // Log exact reason (e.g., BadCredentialsException)
            return ResponseEntity.status(401).body("❌ Invalid credentials");
        }

        UserDetails userDetails = appUserDetailsService.loadUserByUsername(username);
        System.out.println(userDetails.getUsername() + " " + userDetails.getPassword()) ;
        String role = userDetails.getAuthorities().stream()
                .findFirst().map(GrantedAuthority::getAuthority).orElse("ROLE_EMPLOYEE");

        String token = jwtUtil.generateToken(userDetails.getUsername(), role.replace("ROLE_", ""));
        Map<String, String> response = new HashMap<>();
        response.put("role",role.replace("ROLE_", ""));
        response.put("token", token);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("✅ HR/Employee Access Confirmed");
    }
}

