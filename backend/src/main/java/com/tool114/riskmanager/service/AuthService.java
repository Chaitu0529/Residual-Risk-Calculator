package com.tool114.riskmanager.service;

import com.tool114.riskmanager.dto.*;
import com.tool114.riskmanager.entity.Role;
import com.tool114.riskmanager.entity.User;
import com.tool114.riskmanager.exception.BadRequestException;
import com.tool114.riskmanager.repository.RoleRepository;
import com.tool114.riskmanager.repository.UserRepository;
import com.tool114.riskmanager.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final AuditLogService auditLogService;

    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        Set<Role> roles = new HashSet<>();
        if (request.getRoles() != null && !request.getRoles().isEmpty()) {
            request.getRoles().forEach(roleName -> {
                Role.ERole eRole = roleName.equalsIgnoreCase("admin")
                    ? Role.ERole.ROLE_ADMIN
                    : Role.ERole.ROLE_USER;
                Role role = roleRepository.findByName(eRole)
                        .orElseThrow(() -> new BadRequestException("Role not found: " + roleName));
                roles.add(role);
            });
        } else {
            Role userRole = roleRepository.findByName(Role.ERole.ROLE_USER)
                    .orElseThrow(() -> new BadRequestException("Default role not found"));
            roles.add(userRole);
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .roles(roles)
                .isActive(true)
                .build();

        User saved = userRepository.save(user);

        auditLogService.log(saved.getUsername(), "REGISTER", "User", saved.getId(),
            "New user registered: " + saved.getUsername(), httpRequest);

        UserDetails userDetails = userDetailsService.loadUserByUsername(saved.getUsername());
        String token = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        return buildAuthResponse(saved, userDetails, token, refreshToken);
    }

    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String token = jwtUtil.generateToken(userDetails);
            String refreshToken = jwtUtil.generateRefreshToken(userDetails);

            User user = userRepository.findByUsername(userDetails.getUsername())
                    .orElseThrow();
            userRepository.updateLastLogin(user.getUsername(), LocalDateTime.now());

            auditLogService.log(user.getUsername(), "LOGIN", "User", user.getId(),
                "User logged in", httpRequest);

            return buildAuthResponse(user, userDetails, token, refreshToken);
        } catch (BadCredentialsException e) {
            auditLogService.logFailure(request.getUsername(), "LOGIN_FAILED",
                "Failed login attempt", httpRequest, "Invalid credentials");
            throw new BadCredentialsException("Invalid username or password");
        }
    }

    public AuthResponse refreshToken(String refreshToken, HttpServletRequest httpRequest) {
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }
        String username = jwtUtil.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);

        String newToken = jwtUtil.generateToken(userDetails);
        String newRefreshToken = jwtUtil.generateRefreshToken(userDetails);

        User user = userRepository.findByUsername(username).orElseThrow();
        return buildAuthResponse(user, userDetails, newToken, newRefreshToken);
    }

    public void logout(String token, HttpServletRequest httpRequest) {
        if (token != null && token.startsWith("Bearer ")) {
            String jwt = token.substring(7);
            String username = jwtUtil.extractUsername(jwt);
            jwtUtil.blacklistToken(jwt);
            auditLogService.log(username, "LOGOUT", "User", null,
                "User logged out", httpRequest);
        }
    }

    private AuthResponse buildAuthResponse(User user, UserDetails userDetails,
                                            String token, String refreshToken) {
        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .type("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .roles(roles)
                .build();
    }
}
